using EditorsChoicePlugin.Configuration;
using Jellyfin.Data.Enums;
using Jellyfin.Database.Implementations.Entities;
using Jellyfin.Database.Implementations.Enums;
using MediaBrowser.Controller.Dto;
using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Entities.TV;
using MediaBrowser.Controller.Library;
using MediaBrowser.Model.Entities;

namespace EditorsChoicePlugin.Services;

// Existing selection/filtering rules, reusable by the background warmer.
// The caller supplies the user; all library queries remain user-scoped.
public sealed class HeroSelectionQuery
{
    public const string Favourites = "FAVOURITES";
    public const string Random = "RANDOM";
    public const string Collections = "COLLECTIONS";
    public const string New = "NEW";
    public const string Mixed = "MIXED";

    private static readonly string[] Modes = [Favourites, Random, Collections, New, Mixed];

    // Upper bound for one source in Mixed mode, matching the settings page.
    public const int MaximumMixedCount = 50;

    private readonly IUserManager _userManager;
    private readonly ILibraryManager _libraryManager;
    private readonly PluginConfiguration _config;

    private sealed record Filters(
        float? MinimumRating,
        int? MinimumCriticRating,
        ParentalRatingScore? MaximumParentalRating,
        bool? MustHaveParentalRating);

    public HeroSelectionQuery(IUserManager users, ILibraryManager library, PluginConfiguration config)
    {
        _userManager = users;
        _libraryManager = library;
        _config = config;
    }

    public static string NormalizeMode(PluginConfiguration config)
    {
        if (Modes.Contains(config.Mode)) return config.Mode;
        return string.IsNullOrEmpty(config.Mode) && !config.ShowRandomMedia ? Favourites : Random;
    }

    // Mixed sources in display order, with the number of titles each contributes.
    public static IReadOnlyList<(string Source, int Count)> MixedSources(PluginConfiguration config) =>
        new[]
        {
            (Favourites, config.MixedFavouritesCount),
            (New, config.MixedNewCount),
            (Collections, config.MixedCollectionsCount),
            (Random, config.MixedRandomCount),
        }
        .Select(source => (source.Item1, Math.Clamp(source.Item2, 0, MaximumMixedCount)))
        .Where(source => source.Item2 > 0)
        .ToList();

    // With a history, each source skips titles it featured earlier in the cycle.
    public List<BaseItem> Select(User activeUser, SelectionHistory? history = null)
    {
        var filters = CreateFilters(activeUser);
        var picked = new HashSet<Guid>();
        string mode = NormalizeMode(_config);

        if (mode == Mixed)
        {
            var sources = MixedSources(_config);
            var groups = sources
                .Select(source => Take(source.Source, source.Count, activeUser, filters, picked, history))
                .ToList();

            int shortfall = sources.Sum(source => source.Count) - groups.Sum(group => group.Count);
            if (_config.MixedFillWithRandom && shortfall > 0)
            {
                groups.Add(Take(Random, shortfall, activeUser, filters, picked, history));
            }

            return Arrange(groups, _config.MixedOrder);
        }

        int count = Math.Max(1, _config.RandomMediaCount);
        var result = Take(mode, count, activeUser, filters, picked, history);

        // A source with nothing the user can see falls back to the whole library.
        if (result.Count == 0 && mode != Random)
        {
            result = Take(Random, count, activeUser, filters, picked, history);
        }

        return result;
    }

    private List<BaseItem> Take(
        string source,
        int count,
        User user,
        Filters filters,
        HashSet<Guid> picked,
        SelectionHistory? history)
    {
        var seen = history?.Seen(source) ?? new HashSet<Guid>();
        var result = Candidates(source, count, user, filters, [.. picked, .. seen]);

        // Every eligible title has been featured: start the source's next cycle.
        if (result.Count == 0 && seen.Count > 0)
        {
            history!.Reset(source);
            result = Candidates(source, count, user, filters, picked);
        }

        var ids = result.Select(item => item.Id).ToList();
        history?.Record(source, ids);
        picked.UnionWith(ids);
        return result;
    }

    private List<BaseItem> Candidates(string source, int count, User user, Filters filters, HashSet<Guid> exclude) =>
        source switch
        {
            Favourites => FavouriteCandidates(count, user, filters, exclude),
            Collections => CollectionCandidates(count, user, filters, exclude),
            New => NewCandidates(count, user, filters, exclude),
            _ => RandomCandidates(count, user, filters, exclude),
        };

    private Filters CreateFilters(User activeUser)
    {
        // Zero means no minimum.
        float? minimumRating = _config.MinimumRating > 0 ? _config.MinimumRating : null;
        int? minimumCriticRating = _config.MinimumCriticRating > 0 ? _config.MinimumCriticRating : null;

        int? maximumParentRating;
        int maximumParentRatingSubscore;
        bool? mustHaveParentRating;

        // -2 follows each user's own parental rating limit.
        if (_config.MaximumParentRating == -2)
        {
            maximumParentRating = activeUser.MaxParentalRatingScore;
            maximumParentRatingSubscore = 0;
            // Avoid showing unrated content when a user has a parental access limitation.
            mustHaveParentRating = maximumParentRating >= 0 ? true : null;
        }
        else
        {
            maximumParentRating = _config.MaximumParentRating;
            maximumParentRatingSubscore = _config.MaximumParentRatingSubscore;
            mustHaveParentRating = true;
        }

        ParentalRatingScore? parentalRatingScore = maximumParentRating is { } score
            ? new ParentalRatingScore(score, maximumParentRatingSubscore)
            : null;

        return new Filters(minimumRating, minimumCriticRating, parentalRatingScore, mustHaveParentRating);
    }

    private InternalItemsQuery FilteredQuery(User user, Filters filters, HashSet<Guid> exclude, params BaseItemKind[] types) =>
        new(user)
        {
            IncludeItemTypes = types,
            MinCommunityRating = filters.MinimumRating,
            MinCriticRating = filters.MinimumCriticRating,
            MaxParentalRating = filters.MaximumParentalRating,
            HasParentalRating = filters.MustHaveParentalRating,
            ExcludeItemIds = [.. exclude],
            OrderBy = [(ItemSortBy.Random, SortOrder.Ascending)],
            IsPlayed = _config.ShowPlayed ? null : false,
        };

    private List<BaseItem> RandomCandidates(int count, User user, Filters filters, HashSet<Guid> exclude)
    {
        var query = FilteredQuery(user, filters, exclude, BaseItemKind.Series, BaseItemKind.Movie);
        query.AncestorIds = GetFilteredLibraryIds();
        query.Limit = count * 2;
        return Finalize(_libraryManager.GetItemList(query), count, user, exclude);
    }

    private List<BaseItem> FavouriteCandidates(int count, User user, Filters filters, HashSet<Guid> exclude)
    {
        if (!Guid.TryParse(_config.EditorUserId, out Guid editorId) || editorId == Guid.Empty) return [];
        if (_userManager.GetUserById(editorId) is not { } editor) return [];

        // The editor may have favourited episodes or seasons; Finalize maps them to their series.
        // No limit: favourites lists are small, and the whole list is needed to find unseen titles.
        var favourites = FilteredQuery(editor, filters, [],
            BaseItemKind.Series, BaseItemKind.Movie, BaseItemKind.Episode, BaseItemKind.Season);
        favourites.IsFavorite = true;
        favourites.IncludeItemsByName = true;
        favourites.IsPlayed = null;
        var ids = _libraryManager.GetItemList(favourites)
            .Where(item => item.IsVisible(user))
            .Select(item => item.Id)
            .Distinct()
            .ToArray();
        // An empty ItemIds query can mean "all items" in Jellyfin.
        if (ids.Length == 0) return [];

        // Query again as the active user to ensure access.
        var accessible = _libraryManager.GetItemList(new InternalItemsQuery(user)
        {
            ItemIds = ids,
            IncludeItemTypes = [BaseItemKind.Series, BaseItemKind.Movie, BaseItemKind.Episode, BaseItemKind.Season],
            IsPlayed = _config.ShowPlayed ? null : false,
        });
        return Finalize(accessible, count, user, exclude);
    }

    private List<BaseItem> CollectionCandidates(int count, User user, Filters filters, HashSet<Guid> exclude)
    {
        var remaining = (_config.SelectedCollections ?? [])
            .Select(id => Guid.TryParse(id, out Guid parsed) ? parsed : Guid.Empty)
            .Where(id => id != Guid.Empty)
            .Distinct()
            .ToList();

        // One collection is shown at a time. Try another if a collection is inaccessible,
        // filtered out entirely, or already featured this cycle.
        while (remaining.Count > 0)
        {
            int index = System.Random.Shared.Next(remaining.Count);
            Guid collectionId = remaining[index];
            remaining.RemoveAt(index);

            if (_libraryManager.GetItemById(collectionId) is not Folder collection) continue;

            var ids = collection.GetChildren(user, true).Select(item => item.Id).Distinct().ToArray();
            if (ids.Length == 0) continue;

            var query = FilteredQuery(user, filters, exclude, BaseItemKind.Series, BaseItemKind.Movie);
            query.ItemIds = ids;
            query.Limit = count * 2;
            var result = Finalize(_libraryManager.GetItemList(query), count, user, exclude);
            if (result.Count > 0) return result;
        }

        return [];
    }

    private List<BaseItem> NewCandidates(int count, User user, Filters filters, HashSet<Guid> exclude)
    {
        DateTime cutoff = NewCutoff(_config.NewTimeLimit, DateTime.Today);

        // One episode query finds every series with a recent episode, instead of
        // querying seasons and episodes for each series in the library.
        var seriesIds = _libraryManager.GetItemList(new InternalItemsQuery(user)
            {
                IncludeItemTypes = [BaseItemKind.Episode],
                MinPremiereDate = cutoff,
                MaxPremiereDate = DateTime.UtcNow,
                IsVirtualItem = false,
                GroupBySeriesPresentationUniqueKey = true,
                DtoOptions = new DtoOptions(false) { EnableImages = false },
            })
            .OfType<Episode>()
            .Select(episode => episode.SeriesId)
            .Where(id => id != Guid.Empty && !exclude.Contains(id))
            .Distinct()
            .ToArray();

        var candidates = new List<BaseItem>();
        if (seriesIds.Length > 0)
        {
            var series = FilteredQuery(user, filters, exclude, BaseItemKind.Series);
            series.ItemIds = seriesIds;
            series.Limit = count * 2;
            candidates.AddRange(_libraryManager.GetItemList(series));
        }

        var movies = FilteredQuery(user, filters, exclude, BaseItemKind.Movie);
        movies.MinPremiereDate = cutoff;
        movies.Limit = count * 2;
        candidates.AddRange(_libraryManager.GetItemList(movies));

        // Both lists are already random; shuffle so neither type is favoured.
        var shuffled = candidates.ToArray();
        System.Random.Shared.Shuffle(shuffled);
        return Finalize(shuffled, count, user, exclude);
    }

    public static DateTime NewCutoff(string? timeLimit, DateTime today) => timeLimit switch
    {
        "2month" => today.AddMonths(-2),
        "6month" => today.AddMonths(-6),
        "1year" => today.AddYears(-1),
        "2year" => today.AddYears(-2),
        "5year" => today.AddYears(-5),
        _ => today.AddMonths(-1),
    };

    // Maps episodes and seasons to their series, then keeps up to count titles the
    // user can see, with a backdrop, not yet chosen, and unplayed when required.
    private List<BaseItem> Finalize(IEnumerable<BaseItem> candidates, int count, User user, HashSet<Guid> exclude)
    {
        var result = new List<BaseItem>();
        var shuffled = candidates.ToArray();
        System.Random.Shared.Shuffle(shuffled);

        foreach (var candidate in shuffled)
        {
            if (result.Count >= count) break;

            BaseItem? item = candidate;
            while (item is not null && item.GetBaseItemKind() is BaseItemKind.Episode or BaseItemKind.Season)
            {
                item = item.GetParent();
            }

            if (item is null
                || exclude.Contains(item.Id)
                || result.Any(existing => existing.Id == item.Id)
                || !item.IsVisible(user)
                || (!_config.ShowPlayed && item.IsPlayed(user, null))
                || !item.HasImage(ImageType.Backdrop))
            {
                continue;
            }

            result.Add(item);
        }

        return result;
    }

    // Round-robin keeps sources alternating, e.g. favourite, new, random, favourite, new.
    private static List<BaseItem> Arrange(List<List<BaseItem>> groups, string? order)
    {
        if (order == "grouped") return groups.SelectMany(group => group).ToList();

        if (order == "shuffle")
        {
            var all = groups.SelectMany(group => group).ToArray();
            System.Random.Shared.Shuffle(all);
            return [.. all];
        }

        var result = new List<BaseItem>();
        for (int index = 0; groups.Any(group => index < group.Count); index++)
        {
            result.AddRange(groups.Where(group => index < group.Count).Select(group => group[index]));
        }

        return result;
    }

    private Guid[] GetFilteredLibraryIds() =>
        (_config.FilteredLibraries ?? [])
            .Select(id => Guid.TryParse(id, out Guid parsed) ? parsed : Guid.Empty)
            .Where(id => id != Guid.Empty)
            .Distinct()
            .ToArray();
}
