using System.Net.Mime;
using System.Reflection;
using EditorsChoicePlugin.Configuration;
using Ganss.Xss;
using Jellyfin.Data.Enums;
using Jellyfin.Database.Implementations.Enums;
using Jellyfin.Extensions;
using Markdig;
using MediaBrowser.Controller.Dto;
using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Library;
using MediaBrowser.Controller.TV;
using MediaBrowser.Model.Querying;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace EditorsChoicePlugin.Api;

[ApiController]
[Route("editorschoice")]
public class EditorsChoiceActivityController : ControllerBase
{

    private readonly PluginConfiguration _config;
    private readonly IUserManager _userManager;
    private readonly IUserDataManager _userDataManager;
    private readonly ILibraryManager _libraryManager;
    private readonly ITVSeriesManager _tvSeriesManager;
    private readonly ILogger<EditorsChoiceActivityController> _logger;
    private readonly HtmlSanitizer _overviewSanitizer;
    private readonly string _scriptPath;
    private static readonly MarkdownPipeline OverviewMarkdownPipeline = new MarkdownPipelineBuilder()
        .UseEmphasisExtras()
        .UseListExtras()
        .UsePipeTables()
        .UseTaskLists()
        .DisableHtml()
        .Build();

    public EditorsChoiceActivityController(
        IUserManager userManager,
        IUserDataManager userDataManager,
        ILibraryManager libraryManager,
        ITVSeriesManager tvSeriesManager,
        ILogger<EditorsChoiceActivityController> logger)
    {
        _userManager = userManager;
        _userDataManager = userDataManager;
        _libraryManager = libraryManager;
        _tvSeriesManager = tvSeriesManager;
        _logger = logger;
        _overviewSanitizer = CreateOverviewSanitizer();

        _config = Plugin.Instance!.Configuration;

        _scriptPath = GetType().Namespace + ".client.js";

        _logger.LogInformation("EditorsChoiceActivityController loaded.");
    }

    [HttpGet("script")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [Produces("application/javascript")]
    public ActionResult GetClientScript()
    {
        var scriptStream = Assembly.GetExecutingAssembly().GetManifestResourceStream(_scriptPath);

        if (scriptStream != null)
        {
            return File(scriptStream, "application/javascript");
        }

        return NotFound();
    }

    [HttpGet("favourites")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [Produces(MediaTypeNames.Application.Json)]
    public ActionResult<Dictionary<string, object>> GetFavourites()
    {
        try
        {

            Dictionary<string, object> response;
            List<object> items;
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

            // Get active user - haven't found a better way than this
            string name = "";
            if (User.Identity != null)
            {
                if (User.Identity.Name != null)
                {
                    name = User.Identity.Name;
                }
            }

            Jellyfin.Database.Implementations.Entities.User? activeUser = _userManager.GetUserByName(name);
            if (activeUser == null) return NotFound();

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
                    initialResult = (List<BaseItem>)_libraryManager.GetItemList(query);

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
                initialResult = (List<BaseItem>)_libraryManager.GetItemList(queryItems);

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
                    List<BaseItem> seasons = (List<BaseItem>) _libraryManager.GetItemList(querySeasons);

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
                        List<BaseItem> episodes = (List<BaseItem>) _libraryManager.GetItemList(queryEpisodes);
                        
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
                List<BaseItem> resultMovies = (List<BaseItem>) _libraryManager.GetItemList(queryMovies);

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

            // Build response
            response = new Dictionary<string, object>();
            items = new List<object>();

            foreach (BaseItem i in result)
            {
                BaseItem item = i;
                BaseItemKind itemKind = item.GetBaseItemKind();
                IReadOnlyList<BaseItem> extras = GetOptionalExtras(item);
                BaseItem? themeVideo = _config.UseHeroLayout
                    ? extras.FirstOrDefault(extra => extra.ExtraType == MediaBrowser.Model.Entities.ExtraType.ThemeVideo)
                    : null;
                BaseItem? localTrailer = extras.FirstOrDefault(
                    extra => extra.ExtraType == MediaBrowser.Model.Entities.ExtraType.Trailer);
                bool hasTrailer = localTrailer is not null
                    || (item is IHasTrailers itemWithTrailers && itemWithTrailers.RemoteTrailers?.Count > 0);

                // Narrow down properties that are strictly necessary to pass through to frontend
                Dictionary<string, object> itemObject = new Dictionary<string, object>
                {
                    { "id", item.Id.ToString() },
                    { "name", item.Name },
                    { "official_rating", item.OfficialRating },
                    { "hasLogo", item.HasImage(MediaBrowser.Model.Entities.ImageType.Logo) },
                    { "hasPoster", item.HasImage(MediaBrowser.Model.Entities.ImageType.Primary) },
                    { "item_type", itemKind.ToString() },
                    { "play_item_id", item.Id.ToString() },
                    { "play_item_type", itemKind.ToString() },
                    { "play_is_folder", item is Folder },
                    { "playback_action", "watch" },
                    { "has_trailer", hasTrailer }
                };

                if (themeVideo is not null)
                {
                    itemObject.Add("theme_video_id", themeVideo.Id.ToString());
                }

                if (localTrailer is not null)
                {
                    itemObject.Add("trailer_item_id", localTrailer.Id.ToString());
                    itemObject.Add("trailer_item_type", localTrailer.GetBaseItemKind().ToString());
                }

                if (_config.ShowDescription)
                {
                    itemObject.Add("overview_html", RenderOverviewMarkdown(item.Overview));
                }
                if (item.ProductionYear.HasValue)
                {
                    itemObject.Add("year", item.ProductionYear.Value);
                }
                if (itemKind == BaseItemKind.Movie && item.RunTimeTicks.HasValue)
                {
                    itemObject.Add("runtime_minutes", Math.Max(1, (int)Math.Round(TimeSpan.FromTicks(item.RunTimeTicks.Value).TotalMinutes)));
                }
                if (itemKind == BaseItemKind.Series && item is Folder seriesFolder)
                {
                    itemObject.Add("episode_count", seriesFolder.GetRecursiveChildCount(activeUser));
                }
                if (item.CommunityRating.HasValue)
                {
                    itemObject.Add("community_rating", Math.Round(Convert.ToDecimal(item.CommunityRating), 2));
                }

                AddPlaybackState(item, itemObject, activeUser);

                items.Add(itemObject);
            }

            response.Add("favourites", items);
            response.Add("autoplay", _config.EnableAutoplay);
            response.Add("autoplayInterval", _config.AutoplayInterval * 1000);
            response.Add("reduceImageSizes", _config.ReduceImageSize);
            response.Add("bannerHeight", _config.BannerHeight);
            response.Add("useHeroLayout", _config.UseHeroLayout);
            response.Add("transitionEffect", _config.TransitionEffect);
            response.Add("showPlayButton", _config.ShowPlayButton);
            response.Add("hideOnTvLayout", _config.HideOnTvLayout);
            response.Add("heroBackdropPosition", _config.HeroBackdropPosition);
            if (!string.IsNullOrEmpty(_config.Heading)) response.Add("heading", _config.Heading);

            // If ShowPlayButton is true and a PlayButtonText is set, include this in the response to allow custom play button text
            if (_config.ShowPlayButton && !string.IsNullOrEmpty(_config.PlayButtonText))
            {                response.Add("playButtonText", _config.PlayButtonText);
            }

            return Ok(response);

        }
        catch (Exception e)
        {
            _logger.LogError(e.ToString());
            return StatusCode(503);
        }

    }

    private void AddPlaybackState(
        BaseItem item,
        Dictionary<string, object> itemObject,
        Jellyfin.Database.Implementations.Entities.User activeUser)
    {
        if (item.GetBaseItemKind() == BaseItemKind.Series)
        {
            var nextUp = _tvSeriesManager.GetNextUp(
                new NextUpQuery
                {
                    User = activeUser,
                    SeriesId = item.Id,
                    Limit = 1,
                    EnableResumable = true
                },
                new DtoOptions(false)
                {
                    EnableImages = false
                });
            BaseItem? nextEpisode = nextUp.Items.FirstOrDefault();
            if (nextEpisode is not null)
            {
                var nextEpisodeUserData = _userDataManager.GetUserData(activeUser, nextEpisode);
                bool isResumable = nextEpisodeUserData?.PlaybackPositionTicks > 0;
                bool hasStarted = isResumable || GetFirstPlayedEpisode(item, activeUser) is not null;

                itemObject["play_item_id"] = nextEpisode.Id.ToString();
                itemObject["play_item_type"] = BaseItemKind.Episode.ToString();
                itemObject["play_is_folder"] = false;
                if (hasStarted)
                {
                    itemObject["playback_action"] = isResumable ? "resume" : "continue";
                    if (isResumable)
                    {
                        AddPlaybackProgress(itemObject, nextEpisode, nextEpisodeUserData!.PlaybackPositionTicks);
                    }
                    if (nextEpisode.ParentIndexNumber.HasValue)
                    {
                        itemObject["progress_season"] = nextEpisode.ParentIndexNumber.Value;
                    }

                    if (nextEpisode.IndexNumber.HasValue)
                    {
                        itemObject["progress_episode"] = nextEpisode.IndexNumber.Value;
                    }
                }

                return;
            }

            BaseItem? firstPlayedEpisode = GetFirstPlayedEpisode(item, activeUser);
            if (firstPlayedEpisode is not null)
            {
                itemObject["playback_action"] = "replay";
                itemObject["play_item_id"] = firstPlayedEpisode.Id.ToString();
                itemObject["play_item_type"] = BaseItemKind.Episode.ToString();
                itemObject["play_is_folder"] = false;
            }

            return;
        }

        var userData = _userDataManager.GetUserData(activeUser, item);
        if (userData?.PlaybackPositionTicks > 0)
        {
            itemObject["playback_action"] = "resume";
            AddPlaybackProgress(itemObject, item, userData.PlaybackPositionTicks);
        }
        else if (userData?.Played == true)
        {
            itemObject["playback_action"] = "replay";
        }
    }

    private IReadOnlyList<BaseItem> GetOptionalExtras(BaseItem item)
    {
        try
        {
            return item.GetExtras().ToList();
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "Unable to load optional media for Editors Choice item {ItemId}; rendering the banner without it.",
                item.Id);
            return [];
        }
    }

    private static void AddPlaybackProgress(
        Dictionary<string, object> itemObject,
        BaseItem playbackItem,
        long positionTicks)
    {
        itemObject["playback_position_ticks"] = positionTicks;

        if (!playbackItem.RunTimeTicks.HasValue || playbackItem.RunTimeTicks.Value <= 0)
        {
            return;
        }

        long runtimeTicks = playbackItem.RunTimeTicks.Value;
        long remainingTicks = Math.Max(0, runtimeTicks - positionTicks);
        itemObject["playback_progress_percent"] = Math.Round(
            Math.Clamp(positionTicks * 100d / runtimeTicks, 0d, 100d),
            1);

        if (remainingTicks > 0)
        {
            itemObject["playback_remaining_minutes"] = Math.Max(
                1,
                (int)Math.Ceiling(TimeSpan.FromTicks(remainingTicks).TotalMinutes));
        }
    }

    private BaseItem? GetFirstPlayedEpisode(BaseItem series, Jellyfin.Database.Implementations.Entities.User activeUser)
    {
        var playedEpisodes = _libraryManager.GetItemList(
            new InternalItemsQuery(activeUser)
            {
                IncludeItemTypes = [BaseItemKind.Episode],
                SeriesPresentationUniqueKey = series.GetPresentationUniqueKey(),
                IsPlayed = true,
                Limit = 1,
                OrderBy =
                [
                    (ItemSortBy.ParentIndexNumber, SortOrder.Ascending),
                    (ItemSortBy.IndexNumber, SortOrder.Ascending)
                ],
                DtoOptions = new DtoOptions(false)
                {
                    EnableImages = false
                }
            });

        return playedEpisodes.FirstOrDefault();
    }

    private string RenderOverviewMarkdown(string? overview)
    {
        if (string.IsNullOrWhiteSpace(overview))
        {
            return string.Empty;
        }

        string rendered = Markdown.ToHtml(overview, OverviewMarkdownPipeline);
        return _overviewSanitizer.Sanitize(rendered);
    }

    private static HtmlSanitizer CreateOverviewSanitizer()
    {
        var sanitizer = new HtmlSanitizer();

        sanitizer.AllowedTags.Clear();
        sanitizer.AllowedTags.UnionWith(
        [
            "a", "blockquote", "br", "code", "del", "em", "h1", "h2", "h3", "h4", "h5", "h6",
            "hr", "li", "ol", "p", "pre", "s", "strong", "table", "tbody", "td", "th", "thead", "tr", "ul"
        ]);

        sanitizer.AllowedAttributes.Clear();
        sanitizer.AllowedAttributes.UnionWith(["href", "title"]);

        sanitizer.AllowedSchemes.Clear();
        sanitizer.AllowedSchemes.UnionWith(["http", "https", "mailto"]);

        return sanitizer;
    }

    private List<BaseItem> PrepareResult(InternalItemsQuery query, Jellyfin.Database.Implementations.Entities.User? activeUser)
    {
        List<BaseItem> initialResult = (List<BaseItem>)_libraryManager.GetItemList(query);
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
