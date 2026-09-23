using EditorsChoicePlugin.Configuration;
using EditorsChoicePlugin.Services;
using Jellyfin.Data.Enums;
using Jellyfin.Database.Implementations.Entities;
using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Entities.Movies;
using MediaBrowser.Controller.Entities.TV;
using MediaBrowser.Controller.Library;
using MediaBrowser.Model.Entities;
using Moq;
using Xunit;

namespace EditorsChoicePlugin.Tests;

public class SelectionSourceTests
{
    private sealed class Clock : TimeProvider
    {
        public DateTimeOffset Now = DateTimeOffset.UtcNow;
        public override DateTimeOffset GetUtcNow() => Now;
    }

    // Real items need a running server to evaluate visibility.
    private static T CreateItem<T>(string kind) where T : BaseItem
    {
        var item = new Mock<T> { CallBase = true };
        item.Setup(i => i.GetClientTypeName()).Returns(kind);
        item.Setup(i => i.IsVisible(It.IsAny<User>(), It.IsAny<bool>())).Returns(true);
        item.Object.Id = Guid.NewGuid();
        item.Object.ImageInfos = [new ItemImageInfo { Type = ImageType.Backdrop, Path = "/backdrop.jpg" }];
        return item.Object;
    }

    private static Movie CreateMovie() => CreateItem<Movie>("Movie");

    // Honors the query fields the selection relies on: favourites, item IDs,
    // exclusions and limits.
    private static Mock<ILibraryManager> Library(IReadOnlyList<BaseItem> pool, IReadOnlyList<BaseItem>? favourites = null)
    {
        var library = new Mock<ILibraryManager>();
        library.Setup(l => l.GetItemList(It.IsAny<InternalItemsQuery>())).Returns((InternalItemsQuery query) =>
        {
            IEnumerable<BaseItem> items = query.IsFavorite == true ? favourites ?? [] : pool;
            if (query.ItemIds.Length > 0) items = pool.Concat(favourites ?? []).Where(item => query.ItemIds.Contains(item.Id));
            items = items.Where(item => !query.ExcludeItemIds.Contains(item.Id)).Distinct();
            if (query.Limit is { } limit) items = items.Take(limit);
            return items.ToArray();
        });
        return library;
    }

    [Fact]
    public void HistoryIsBoundedAndResetsPerSource()
    {
        var history = new SelectionHistory();
        var ids = Enumerable.Range(0, SelectionHistory.MaximumPerSource + 10).Select(_ => Guid.NewGuid()).ToArray();
        history.Record("RANDOM", ids);
        history.Record("NEW", [ids[0]]);
        Assert.Empty(history.Seen("RANDOM"));
        history.CommitPending();

        Assert.Equal(SelectionHistory.MaximumPerSource, history.Seen("RANDOM").Count);
        Assert.DoesNotContain(ids[0], history.Seen("RANDOM"));
        Assert.Contains(ids[^1], history.Seen("RANDOM"));

        history.Reset("RANDOM");
        Assert.Empty(history.Seen("RANDOM"));
        Assert.Single(history.Seen("NEW"));
    }

    [Fact]
    public void RotatesThroughThePoolAndShowsOnlyWhatRemainsBeforeRepeating()
    {
        var user = new User("viewer", "auth", "reset");
        var pool = Enumerable.Range(0, 5).Select(_ => (BaseItem)CreateMovie()).ToArray();
        var config = new PluginConfiguration { Mode = "RANDOM", RandomMediaCount = 2 };
        var query = new HeroSelectionQuery(Mock.Of<IUserManager>(), Library(pool).Object, config);
        var history = new SelectionHistory();

        List<BaseItem> Serve()
        {
            history.BeginSelection();
            var result = query.Select(user, history);
            history.CommitPending();
            return result;
        }

        var first = Serve();
        var second = Serve();
        var third = Serve();

        Assert.Equal(2, first.Count);
        Assert.Equal(2, second.Count);
        // One title is left in this rotation: show it alone rather than repeat another.
        Assert.Single(third);
        Assert.Equal(5, first.Concat(second).Concat(third).Select(item => item.Id).Distinct().Count());

        // The pool is exhausted, so the next selection starts a new rotation.
        Assert.Equal(2, Serve().Count);
    }

    [Fact]
    public void WithoutHistoryEverySelectionDrawsFromTheWholePool()
    {
        var user = new User("viewer", "auth", "reset");
        var pool = Enumerable.Range(0, 2).Select(_ => (BaseItem)CreateMovie()).ToArray();
        var config = new PluginConfiguration { Mode = "RANDOM", RandomMediaCount = 2 };
        var query = new HeroSelectionQuery(Mock.Of<IUserManager>(), Library(pool).Object, config);

        Assert.Equal(2, query.Select(user).Count);
        Assert.Equal(2, query.Select(user).Count);
    }

    [Fact]
    public void OnlyServedSelectionsCountAsShown()
    {
        var clock = new Clock();
        var store = new RotatingSelectionStore(clock);
        var user = Guid.NewGuid();
        var id = Guid.NewGuid();
        // A background refresh nobody saw.
        store.Get(user, "one", TimeSpan.Zero, history => { history.Record("RANDOM", [id]); return [id]; }, served: false);
        var seenAfterWarm = -1;
        store.Get(user, "one", TimeSpan.Zero, history => { seenAfterWarm = history.Seen("RANDOM").Count; return []; }, served: false);
        Assert.Equal(0, seenAfterWarm);

        // A cached selection counts once a request serves it.
        store.Get(user, "one", TimeSpan.FromMinutes(30), history => { history.Record("RANDOM", [id]); return [id]; }, served: false);
        store.Get(user, "one", TimeSpan.FromMinutes(30), _ => throw new InvalidOperationException("Still cached."));
        clock.Now += TimeSpan.FromMinutes(30);
        var seenAfterServe = 0;
        store.Get(user, "one", TimeSpan.Zero, history => { seenAfterServe = history.Seen("RANDOM").Count; return []; }, served: false);
        Assert.Equal(1, seenAfterServe);
    }

    [Fact]
    public void StoreKeepsHistoryAcrossRefreshesAndClearsItWhenTheConfigurationChanges()
    {
        var store = new RotatingSelectionStore();
        var user = Guid.NewGuid();
        var id = Guid.NewGuid();
        store.Get(user, "one", TimeSpan.Zero, history => { history.Record("RANDOM", [id]); return [id]; });

        var seenAfterRefresh = 0;
        store.Get(user, "one", TimeSpan.Zero, history => { seenAfterRefresh = history.Seen("RANDOM").Count; return []; });
        var seenAfterChange = -1;
        store.Get(user, "two", TimeSpan.Zero, history => { seenAfterChange = history.Seen("RANDOM").Count; return []; });

        Assert.Equal(1, seenAfterRefresh);
        Assert.Equal(0, seenAfterChange);
    }

    [Theory]
    [InlineData("interleave")]
    [InlineData("grouped")]
    [InlineData("shuffle")]
    public void MixedModeCombinesSourcesWithoutDuplicates(string order)
    {
        var user = new User("viewer", "auth", "reset");
        var editor = new User("editor", "auth", "reset");
        var favourites = Enumerable.Range(0, 2).Select(_ => (BaseItem)CreateMovie()).ToArray();
        // Random titles include the favourites, which must not appear twice.
        var pool = favourites.Concat(Enumerable.Range(0, 4).Select(_ => (BaseItem)CreateMovie())).ToArray();
        var users = new Mock<IUserManager>();
        users.Setup(u => u.GetUserById(editor.Id)).Returns(editor);
        var config = new PluginConfiguration
        {
            Mode = "MIXED", EditorUserId = editor.Id.ToString(), MixedOrder = order,
            MixedFavouritesCount = 2, MixedNewCount = 0, MixedCollectionsCount = 0, MixedRandomCount = 2,
        };

        var result = new HeroSelectionQuery(users.Object, Library(pool, favourites).Object, config).Select(user);

        Assert.Equal(4, result.Select(item => item.Id).Distinct().Count());
        Assert.Equal(2, result.Count(item => favourites.Contains(item)));
        if (order == "interleave")
        {
            Assert.Contains(result[0], favourites);
            Assert.DoesNotContain(result[1], favourites);
            Assert.Contains(result[2], favourites);
        }
        else if (order == "grouped")
        {
            Assert.All(result.Take(2), item => Assert.Contains(item, favourites));
        }
    }

    [Fact]
    public void MixedModeFillsShortfallsWithRandomTitles()
    {
        var user = new User("viewer", "auth", "reset");
        var pool = Enumerable.Range(0, 6).Select(_ => (BaseItem)CreateMovie()).ToArray();
        // No editor is configured, so the favourites source is empty.
        var config = new PluginConfiguration
        {
            Mode = "MIXED", EditorUserId = "not-a-guid",
            MixedFavouritesCount = 3, MixedNewCount = 0, MixedCollectionsCount = 0, MixedRandomCount = 1,
        };
        var query = new HeroSelectionQuery(Mock.Of<IUserManager>(), Library(pool).Object, config);

        Assert.Equal(4, query.Select(user).Count);
        config.MixedFillWithRandom = false;
        Assert.Single(query.Select(user));
    }

    [Fact]
    public void InvalidEditorAndCollectionIdsFallBackToRandomInsteadOfThrowing()
    {
        var user = new User("viewer", "auth", "reset");
        var pool = new BaseItem[] { CreateMovie() };
        var library = Library(pool);

        foreach (var config in new[]
        {
            new PluginConfiguration { Mode = "FAVOURITES", EditorUserId = "0123456789abcdefXYZ" },
            new PluginConfiguration { Mode = "FAVOURITES", EditorUserId = Guid.NewGuid().ToString() },
            new PluginConfiguration { Mode = "COLLECTIONS", SelectedCollections = ["broken", Guid.NewGuid().ToString()] },
        })
        {
            Assert.Single(new HeroSelectionQuery(Mock.Of<IUserManager>(), library.Object, config).Select(user));
        }
    }

    [Fact]
    public void NewModeFindsRecentSeriesWithOneEpisodeQuery()
    {
        var user = new User("viewer", "auth", "reset");
        var series = CreateItem<Series>("Series");
        var episode = new Episode { Id = Guid.NewGuid(), SeriesId = series.Id, PremiereDate = DateTime.UtcNow };
        var library = new Mock<ILibraryManager>();
        library.Setup(l => l.GetItemList(It.IsAny<InternalItemsQuery>())).Returns((InternalItemsQuery query) =>
            query.IncludeItemTypes.SequenceEqual([BaseItemKind.Episode]) ? [episode]
            : query.IncludeItemTypes.SequenceEqual([BaseItemKind.Series]) && query.ItemIds.Contains(series.Id) ? [series]
            : Array.Empty<BaseItem>());
        var config = new PluginConfiguration { Mode = "NEW", NewTimeLimit = "6month" };

        var result = new HeroSelectionQuery(Mock.Of<IUserManager>(), library.Object, config).Select(user);

        Assert.Equal(series, Assert.Single(result));
        library.Verify(l => l.GetItemList(It.Is<InternalItemsQuery>(q =>
            q.IncludeItemTypes.Contains(BaseItemKind.Episode)
            && q.MinPremiereDate == HeroSelectionQuery.NewCutoff("6month", DateTime.Today))), Times.Once);
        library.Verify(l => l.GetItemList(It.Is<InternalItemsQuery>(q =>
            q.IncludeItemTypes.Contains(BaseItemKind.Season))), Times.Never);
    }

    [Theory]
    [InlineData("1month", 1)]
    [InlineData("6month", 6)]
    [InlineData("2year", 24)]
    [InlineData("unknown", 1)]
    public void NewCutoffMatchesTheConfiguredWindow(string limit, int months)
    {
        var today = new DateTime(2026, 9, 23);
        Assert.Equal(today.AddMonths(-months), HeroSelectionQuery.NewCutoff(limit, today));
    }
}
