using EditorsChoicePlugin.Configuration;
using Jellyfin.Data.Enums;
using Jellyfin.Database.Implementations.Entities;
using Jellyfin.Database.Implementations.Enums;
using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Library;

namespace EditorsChoicePlugin.Services;

// Existing selection/filtering rules, reusable by the background warmer.
// The caller supplies the user; all library queries remain user-scoped.
public sealed class HeroSelectionQuery
{
    private readonly IUserManager _userManager;
    private readonly ILibraryManager _libraryManager;
    private readonly PluginConfiguration _config;

    public HeroSelectionQuery(IUserManager users, ILibraryManager library, PluginConfiguration config)
    {
        _userManager = users;
        _libraryManager = library;
        _config = config;
    }

    public List<BaseItem> Select(User activeUser)
    {
        InternalItemsQuery query;
        List<BaseItem> initialResult = [];
        List<BaseItem> result = [];
        bool resultsEmpty = false;
        int? maximumParentRating = -2;
        int maximumParentRatingSubscore = 0;
        bool? mustHaveParentRating = null;

        // Don't have any minimum rating set if config is set to 0
        float? minimumRating = null;
        int? minimumCriticRating = null;

        if (_config.MinimumRating > 0) minimumRating = _config.MinimumRating;
        if (_config.MinimumCriticRating > 0) minimumCriticRating = _config.MinimumCriticRating;

        // If the config is set to be user profile specific, then we need to set the rating to the user's max age rating.
        if (_config.MaximumParentRating == -2)
        {
            maximumParentRating = activeUser.MaxParentalRatingScore;
            maximumParentRatingSubscore = 0;
            if (maximumParentRating >= 0)
            {
                mustHaveParentRating = true; // we want to avoid showing unrated content when a user has a parental access limitation
            }
        }
        else
        {
            maximumParentRating = _config.MaximumParentRating;
            maximumParentRatingSubscore = _config.MaximumParentRatingSubscore;
            mustHaveParentRating = true; // we want to avoid showing unrated content when a user has a parental access limitation
        }

        // Convert simple parental rating score to ParentalRatingScore with score and subscore.
        MediaBrowser.Model.Entities.ParentalRatingScore? parentalRatingScore = null;
        if (maximumParentRating != null)
        {
            parentalRatingScore = new MediaBrowser.Model.Entities.ParentalRatingScore((int)maximumParentRating, maximumParentRatingSubscore);
        }

        // If not showing random media, collect the editor user's favourited items
        if (_config.Mode == "FAVOURITES")
        {

            // Use random fallback if no editor ID set
            if (_config.EditorUserId == null || _config.EditorUserId == "" || _config.EditorUserId.Length < 16)
            {
                resultsEmpty = true;
            }
            else
            {
                Jellyfin.Database.Implementations.Entities.User? editorUser = _userManager.GetUserById(Guid.Parse(_config.EditorUserId));

                // Get the favourites list
                query = new InternalItemsQuery(editorUser)
                {
                    IsFavorite = true,
                    IncludeItemsByName = true,
                    IncludeItemTypes = [BaseItemKind.Series, BaseItemKind.Movie, BaseItemKind.Episode, BaseItemKind.Season], // Editor may have favourited individual episodes or seasons - we will handle this later
                    MinCommunityRating = minimumRating,
                    MinCriticRating = minimumCriticRating,
                    MaxParentalRating = parentalRatingScore,
                    HasParentalRating = mustHaveParentRating,
                    OrderBy = new[] { (ItemSortBy.Random, SortOrder.Ascending) }
                };
                query.Limit = _config.RandomMediaCount * 2;
                initialResult = _libraryManager.GetItemList(query).ToList();

                // Get ids of items in the favourites list
                List<Guid> itemIds = new List<Guid>();
                foreach (var item in initialResult)
                {
                    if (!itemIds.Contains(item.Id))
                    {
                        // Only include if active user has parental access to this item
                        if (item.IsVisible(activeUser))
                        {
                            itemIds.Add(item.Id);
                        }
                    }
                }

                // Query items from the active user to ensure access
                query = new InternalItemsQuery(activeUser)
                {
                    ItemIds = [.. itemIds],
                    IncludeItemTypes = [BaseItemKind.Series, BaseItemKind.Movie, BaseItemKind.Episode, BaseItemKind.Season], // Editor may have favourited individual episodes or seasons - we will handle this later
                    IsPlayed = _config.ShowPlayed ? null : false
                };
                result = PrepareResult(query, activeUser);

                // If the result is empty (i.e. the active user doesn't have access to any of the items), fallback to random mode.
                resultsEmpty = result.Count == 0;
            }

        }

        if (_config.Mode == "COLLECTIONS")
        {
            List<string> remainingCollections = _config.SelectedCollections.ToList();

            while (result.Count == 0 && remainingCollections.Count > 0)
            { // if a collection is totally inaccessible due to user visibility or excessive filters configured, we need to try another collection
                int collectionR = new Random().Next(remainingCollections.Count);
                string collectionId = remainingCollections[collectionR];
                remainingCollections.RemoveAt(collectionR);
                Guid collectionGuid = Guid.Parse(collectionId);

                BaseItem collection = _libraryManager.GetParentItem(collectionGuid, activeUser.Id);
                if (collection is Folder)
                {
                    Folder f = (Folder)collection;
                    initialResult = f.GetChildren(activeUser, true).ToList();

                    // Get ids of items in the collection
                    List<Guid> itemIds = new List<Guid>();
                    foreach (var item in initialResult)
                    {
                        if (!itemIds.Contains(item.Id))
                        {
                            itemIds.Add(item.Id);
                        }
                    }

                    query = new InternalItemsQuery(activeUser)
                    {
                        ItemIds = [.. itemIds],
                        IncludeItemTypes = [BaseItemKind.Series, BaseItemKind.Movie],
                        MinCommunityRating = minimumRating,
                        MinCriticRating = minimumCriticRating,
                        MaxParentalRating = parentalRatingScore,
                        HasParentalRating = mustHaveParentRating,
                        OrderBy = new[] { (ItemSortBy.Random, SortOrder.Ascending) },
                        IsPlayed = _config.ShowPlayed ? null : false
                    };
                    query.Limit = _config.RandomMediaCount * 2;
                    result = PrepareResult(query, activeUser);
                }

                // If the result is empty (i.e. the active user doesn't have access to any of the items), fallback to random mode.
                resultsEmpty = result.Count == 0;
            }
        }

        if (_config.Mode == "NEW")
        {
            DateTime newEndDate = DateTime.Today.AddMonths(-1);

            switch (_config.NewTimeLimit)
            {
                case "1month":
                    newEndDate = DateTime.Today.AddMonths(-1);
                    break;
                case "2month":
                    newEndDate = DateTime.Today.AddMonths(-2);
                    break;
                case "6month":
                    newEndDate = DateTime.Today.AddMonths(-6);
                    break;
                case "1year":
                    newEndDate = DateTime.Today.AddYears(-1);
                    break;
                case "2year":
                    newEndDate = DateTime.Today.AddYears(-2);
                    break;
                case "5year":
                    newEndDate = DateTime.Today.AddYears(-5);
                    break;
            }

            // Query all series that meet user criteria
            InternalItemsQuery queryItems = new InternalItemsQuery(activeUser)
            {
                IncludeItemTypes = [BaseItemKind.Series],
                MinCommunityRating = minimumRating,
                MinCriticRating = minimumCriticRating,
                MaxParentalRating = parentalRatingScore,
                HasParentalRating = mustHaveParentRating,
                OrderBy = new[] { (ItemSortBy.Random, SortOrder.Descending) },
                IsPlayed = _config.ShowPlayed ? null : false
            };
            initialResult = _libraryManager.GetItemList(queryItems).ToList();

            // Of TV series that meet those criteria, loop through to find items that are recent enough. These are already ordered by recency, so can quit on first item that is too old.
            List<Guid> itemIds = new List<Guid>();
            foreach (var item in initialResult)
            {
                // Get the latest season of the TV show
                InternalItemsQuery querySeasons = new InternalItemsQuery(activeUser)
                {
                    IncludeItemTypes = [BaseItemKind.Season],
                    ParentId = item.Id,
                    OrderBy = new[] { (ItemSortBy.IndexNumber, SortOrder.Descending )}
                };
                List<BaseItem> seasons = _libraryManager.GetItemList(querySeasons).ToList();

                if (seasons.Count > 0) {
                    Guid latestSeasonId = seasons[0].Id;
                    //_logger.LogInformation("Season of {0}: {1}", item.Name, latestSeasonId);

                    // Get the latest episode of the latest season
                    InternalItemsQuery queryEpisodes = new InternalItemsQuery(activeUser)
                    {
                        IncludeItemTypes = [BaseItemKind.Episode],
                        ParentId = latestSeasonId,
                        OrderBy = new[] { (ItemSortBy.IndexNumber, SortOrder.Descending) }
                    };
                    List<BaseItem> episodes = _libraryManager.GetItemList(queryEpisodes).ToList();
                    
                    //_logger.LogInformation("Contains {0} episodes.", episodes.Count);

                    // Check if the most recent episode was released within the user's time period
                    if (episodes.Count > 0) { // TODO: for some reason, some seasons come up with no episodes...
                        BaseItem episode = episodes[0];
                        if (episode.PremiereDate is not null) {
                            DateTime episodePremiere = (DateTime) episode.PremiereDate;
                            if (DateTime.Compare(episodePremiere, newEndDate) >= 0 )
                            {
                                itemIds.Add(item.Id);
                            }
                        }
                    }
                }

                if (itemIds.Count == _config.RandomMediaCount ) break; // Stop looking once we have enough episodes

            }

            // Query movies that premiered within the user's time period
            InternalItemsQuery queryMovies = new InternalItemsQuery(activeUser)
            {
                IncludeItemTypes = [BaseItemKind.Movie],
                MinCommunityRating = minimumRating,
                MinCriticRating = minimumCriticRating,
                MaxParentalRating = parentalRatingScore,
                HasParentalRating = mustHaveParentRating,
                MinPremiereDate = newEndDate,
                OrderBy = new[] { (ItemSortBy.Random, SortOrder.Ascending) },
                IsPlayed = _config.ShowPlayed ? null : false
            };
            queryMovies.Limit = _config.RandomMediaCount;
            List<BaseItem> resultMovies = _libraryManager.GetItemList(queryMovies).ToList();

            // Join the lists of recent films and recent series
            foreach (BaseItem item in resultMovies) itemIds.Add(item.Id);

            InternalItemsQuery finalQuery = new InternalItemsQuery(activeUser)
            {
                ItemIds = [.. itemIds],
                OrderBy = new[] { (ItemSortBy.Random, SortOrder.Ascending) }
            };
            finalQuery.Limit = _config.RandomMediaCount;

            result = PrepareResult(finalQuery, activeUser);

            resultsEmpty = result.Count == 0;
        }

        // If showing random media is enabled OR the results list is currently empty, collect a random selection from the entire library
        if (_config.Mode == "RANDOM" || resultsEmpty)
        {
            Guid[] filteredLibraryIds = GetFilteredLibraryIds();

            // Get all shows and movies
            query = new InternalItemsQuery(activeUser)
            {
                IncludeItemTypes = [BaseItemKind.Series, BaseItemKind.Movie],
                AncestorIds = filteredLibraryIds,
                MinCommunityRating = minimumRating,
                MinCriticRating = minimumCriticRating,
                MaxParentalRating = parentalRatingScore,
                HasParentalRating = mustHaveParentRating,
                OrderBy = new[] { (ItemSortBy.Random, SortOrder.Ascending) },
                IsPlayed = _config.ShowPlayed ? null : false
            };
            query.Limit = _config.RandomMediaCount * 2;
            result = PrepareResult(query, activeUser);
        }


        return result;
    }

    private List<BaseItem> PrepareResult(InternalItemsQuery query, Jellyfin.Database.Implementations.Entities.User? activeUser)
    {
        List<BaseItem> initialResult = _libraryManager.GetItemList(query).ToList();
        List<BaseItem> result = [];

        // Randomly add items until we run out or reach the admin-set cap
        var random = new Random();
        int max = initialResult.Count;

        for (int i = 0; i < _config.RandomMediaCount && i < max; i++)
        {
            BaseItem initItem = initialResult[random.Next(initialResult.Count)];
            var shiftItem = initItem;

            // Deal with episodes or seasons
            if (shiftItem.GetBaseItemKind() == BaseItemKind.Episode || shiftItem.GetBaseItemKind() == BaseItemKind.Season)
            {
                shiftItem = shiftItem.GetParent();

                // If the parent is a season (i.e. the favourited item was an episode) then we need to get the season's parent show
                if (shiftItem.GetBaseItemKind() == BaseItemKind.Season)
                {
                    shiftItem = shiftItem.GetParent();
                }
            }

            // Only include if active user has parental access to this item, not already in the results, if only unplayed items should be shown & this is unplayed, and if has a backdrop image
            if (shiftItem.IsVisible(activeUser) && !result.Contains(shiftItem) && !(shiftItem.IsPlayed(activeUser, null) && !_config.ShowPlayed) && shiftItem.HasImage(MediaBrowser.Model.Entities.ImageType.Backdrop))
            {
                result.Add(shiftItem);
            }
            else
            {
                i--; // reset increment so we make up for non-inclusion
                max--;
            }
            initialResult.Remove(initItem);
        }

        return result;
    }

    private Guid[] GetFilteredLibraryIds()
    {
        List<Guid> libraryIds = [];

        foreach (string libraryId in _config.FilteredLibraries ?? [])
        {
            if (Guid.TryParse(libraryId, out Guid parsedId) && !libraryIds.Contains(parsedId))
            {
                libraryIds.Add(parsedId);
            }
        }

        return [.. libraryIds];
    }
}
