using EditorsChoicePlugin.Configuration;
using EditorsChoicePlugin.Services;
using Jellyfin.Database.Implementations.Entities;
using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Library;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace EditorsChoicePlugin.Tests;

public class SelectionCacheTests
{
    [Fact]
    public void BackgroundServiceAndEndpointShareOneCache()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddSingleton(Mock.Of<IUserManager>());
        services.AddSingleton(Mock.Of<ILibraryManager>());
        new PluginServiceRegistrator().RegisterServices(services, null!);
        using var provider = services.BuildServiceProvider();
        Assert.Same(provider.GetRequiredService<HeroSelectionCache>(),
            Assert.Single(provider.GetServices<IHostedService>()));
    }

    private sealed class Clock : TimeProvider
    {
        public DateTimeOffset Now = DateTimeOffset.UtcNow;
        public override DateTimeOffset GetUtcNow() => Now;
    }

    [Fact]
    public void SelectionIsStableUntilExpiryAndIsolatedByUser()
    {
        var clock = new Clock();
        var store = new RotatingSelectionStore(clock);
        var user = Guid.NewGuid();
        var calls = 0;
        Guid[] Select() { calls++; return [Guid.NewGuid()]; }
        var first = store.Get(user, "config", TimeSpan.FromMinutes(30), Select);
        Assert.Equal(first, store.Get(user, "config", TimeSpan.FromMinutes(30), Select));
        Assert.NotEqual(first, store.Get(Guid.NewGuid(), "config", TimeSpan.FromMinutes(30), Select));
        Assert.Equal(2, calls);
        clock.Now += TimeSpan.FromMinutes(30);
        Assert.NotEqual(first, store.Get(user, "config", TimeSpan.FromMinutes(30), Select));
        Assert.Equal(3, calls);
    }

    [Fact]
    public async Task ConcurrentRequestsOnlySelectOnceAndReturnCopies()
    {
        var store = new RotatingSelectionStore();
        var user = Guid.NewGuid();
        var item = Guid.NewGuid();
        var calls = 0;
        var results = await Task.WhenAll(Enumerable.Range(0, 10).Select(_ => Task.Run(() =>
            store.Get(user, "config", TimeSpan.FromMinutes(1), () => { Interlocked.Increment(ref calls); return [item]; }))));
        Assert.Equal(1, calls);
        results[0][0] = Guid.Empty;
        Assert.Equal(item, results[1][0]);
    }

    [Fact]
    public void FilterChangeAndClearInvalidateSelection()
    {
        var store = new RotatingSelectionStore();
        var user = Guid.NewGuid();
        var calls = 0;
        Guid[] Select() { calls++; return []; }
        store.Get(user, "one", TimeSpan.FromMinutes(30), Select);
        store.Get(user, "two", TimeSpan.FromMinutes(30), Select);
        store.Clear();
        store.Get(user, "two", TimeSpan.FromMinutes(30), Select);
        Assert.Equal(3, calls);
    }

    [Fact]
    public void CachedIdsAreRequeriedWithTheCurrentUserAndCannotBypassAccess()
    {
        var user = new User("viewer", "auth", "reset");
        var config = new PluginConfiguration { Mode = "RANDOM" };
        var ids = new[] { Guid.NewGuid() };
        var store = new RotatingSelectionStore();
        store.Get(user.Id, HeroSelectionCache.ConfigurationKey(config), TimeSpan.FromMinutes(30), () => ids);
        var library = new Mock<ILibraryManager>();
        library.Setup(l => l.GetItemList(It.IsAny<InternalItemsQuery>())).Returns(Array.Empty<BaseItem>());
        var cache = new HeroSelectionCache(Mock.Of<IUserManager>(), library.Object, store, NullLogger<HeroSelectionCache>.Instance);
        Assert.Empty(cache.GetSelection(user, config));
        library.Verify(l => l.GetItemList(It.Is<InternalItemsQuery>(q => q.User == user && q.ItemIds.SequenceEqual(ids))), Times.Once);
    }

    [Fact]
    public void CachedItemsKeepSelectionOrderAndRecheckVisibility()
    {
        var user = new User("viewer", "auth", "reset");
        var config = new PluginConfiguration { Mode = "RANDOM", ShowPlayed = false };
        var first = new Mock<BaseItem>();
        first.Object.Id = Guid.NewGuid();
        first.Setup(i => i.IsVisible(user, It.IsAny<bool>())).Returns(true);
        var second = new Mock<BaseItem>();
        second.Object.Id = Guid.NewGuid();
        second.Setup(i => i.IsVisible(user, It.IsAny<bool>())).Returns(true);
        var store = new RotatingSelectionStore();
        store.Get(user.Id, HeroSelectionCache.ConfigurationKey(config), TimeSpan.FromMinutes(30),
            () => new[] { first.Object.Id, second.Object.Id });
        var library = new Mock<ILibraryManager>();
        library.Setup(l => l.GetItemList(It.IsAny<InternalItemsQuery>()))
            .Returns(new[] { second.Object, first.Object });
        var cache = new HeroSelectionCache(Mock.Of<IUserManager>(), library.Object, store,
            NullLogger<HeroSelectionCache>.Instance);

        Assert.Equal(new[] { first.Object, second.Object }, cache.GetSelection(user, config));
        first.Setup(i => i.IsVisible(user, It.IsAny<bool>())).Returns(false);
        Assert.Equal(new[] { second.Object }, cache.GetSelection(user, config));
        library.Verify(l => l.GetItemList(It.Is<InternalItemsQuery>(q =>
            q.User == user && q.IsPlayed == false && q.ItemIds.Length == 2)), Times.Exactly(2));
    }

    [Fact]
    public void BackgroundWarmAndCacheDisabledBehaveDifferently()
    {
        var user = new User("viewer", "auth", "reset");
        var users = new Mock<IUserManager>();
#if NET10_0_OR_GREATER
        users.Setup(u => u.GetUsers()).Returns(new[] { user });
#else
        users.SetupGet(u => u.Users).Returns(new[] { user });
#endif
        var library = new Mock<ILibraryManager>();
        library.Setup(l => l.GetItemList(It.IsAny<InternalItemsQuery>())).Returns(Array.Empty<BaseItem>());
        var cache = new HeroSelectionCache(users.Object, library.Object, new RotatingSelectionStore(), NullLogger<HeroSelectionCache>.Instance);
        var config = new PluginConfiguration { Mode = "RANDOM" };
        cache.WarmSelections(config, CancellationToken.None);
        cache.GetSelection(user, config);
        cache.GetSelection(user, config);
        library.Verify(l => l.GetItemList(It.IsAny<InternalItemsQuery>()), Times.Once);
        config.EnableSelectionCache = false;
        cache.GetSelection(user, config);
        cache.GetSelection(user, config);
        library.Verify(l => l.GetItemList(It.IsAny<InternalItemsQuery>()), Times.Exactly(3));
    }

    [Fact]
    public void BackgroundWarmerRefreshesAfterConfiguredInterval()
    {
        var user = new User("viewer", "auth", "reset");
        var users = new Mock<IUserManager>();
#if NET10_0_OR_GREATER
        users.Setup(u => u.GetUsers()).Returns(new[] { user });
#else
        users.SetupGet(u => u.Users).Returns(new[] { user });
#endif
        var library = new Mock<ILibraryManager>();
        library.Setup(l => l.GetItemList(It.IsAny<InternalItemsQuery>())).Returns(Array.Empty<BaseItem>());
        var clock = new Clock();
        var cache = new HeroSelectionCache(users.Object, library.Object,
            new RotatingSelectionStore(clock), NullLogger<HeroSelectionCache>.Instance);
        var config = new PluginConfiguration { Mode = "RANDOM", SelectionRefreshMinutes = 7 };
        cache.WarmSelections(config, CancellationToken.None);
        clock.Now += TimeSpan.FromMinutes(6);
        cache.WarmSelections(config, CancellationToken.None);
        library.Verify(l => l.GetItemList(It.IsAny<InternalItemsQuery>()), Times.Once);
        clock.Now += TimeSpan.FromMinutes(1);
        cache.WarmSelections(config, CancellationToken.None);
        library.Verify(l => l.GetItemList(It.IsAny<InternalItemsQuery>()), Times.Exactly(2));
    }

    [Fact]
    public void BootstrapContainsOnlyPresentationSettings()
    {
        var config = new PluginConfiguration { EditorUserId = "private", Heading = "obsolete", UseHeroLayout = false };
        var settings = BannerSettings.Create(config);
        Assert.Equal(true, settings["useHeroLayout"]);
        Assert.DoesNotContain("heading", settings.Keys);
        Assert.DoesNotContain("editorUserId", settings.Keys);
        Assert.DoesNotContain("favourites", settings.Keys);
        Assert.DoesNotContain("filteredLibraries", settings.Keys);
    }
}
