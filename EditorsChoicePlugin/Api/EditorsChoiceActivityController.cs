using System.Net.Mime;
using System.Reflection;
using System.Text.Json;
using EditorsChoicePlugin.Configuration;
using EditorsChoicePlugin.Services;
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
    private readonly HeroSelectionCache _selectionCache;
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
        ILogger<EditorsChoiceActivityController> logger,
        HeroSelectionCache selectionCache)
    {
        _userManager = userManager;
        _userDataManager = userDataManager;
        _libraryManager = libraryManager;
        _tvSeriesManager = tvSeriesManager;
        _logger = logger;
        _selectionCache = selectionCache;
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
            using var reader = new StreamReader(scriptStream);
            var bootstrap = JsonSerializer.Serialize(BannerSettings.Create(_config));
            Response.Headers.CacheControl = "no-store";
            return Content("const editorsChoiceBootstrap = " + bootstrap + ";\n" + reader.ReadToEnd(), "application/javascript");
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

            var openingSlide = CreateOpeningSlide(activeUser);
            var result = openingSlide is not null && !_config.OpeningSlideContinue
                ? []
                : _selectionCache.GetSelection(activeUser, _config);

            // Build response
            response = new Dictionary<string, object>();
            items = new List<object>();

            foreach (BaseItem item in result) items.Add(CreateMediaItem(item, activeUser));

            response.Add("favourites", items);
            if (openingSlide is not null) response.Add("openingSlide", openingSlide);
            foreach (var setting in BannerSettings.Create(_config)) response.Add(setting.Key, setting.Value);

            return Ok(response);

        }
        catch (Exception e)
        {
            _logger.LogError(e, "Failed to build the Editors Choice response.");
            return StatusCode(StatusCodes.Status500InternalServerError);
        }

    }

    private Dictionary<string, object> CreateMediaItem(
        BaseItem item,
        Jellyfin.Database.Implementations.Entities.User activeUser)
    {
        BaseItemKind itemKind = item.GetBaseItemKind();
        IReadOnlyList<BaseItem> extras = GetOptionalExtras(item);
        BaseItem? themeVideo = _config.EnableThemeVideos
            ? extras.FirstOrDefault(extra => extra.ExtraType == MediaBrowser.Model.Entities.ExtraType.ThemeVideo)
            : null;
        BaseItem? localTrailer = extras.FirstOrDefault(
            extra => extra.ExtraType == MediaBrowser.Model.Entities.ExtraType.Trailer);
        bool hasTrailer = localTrailer is not null
            || (item is IHasTrailers itemWithTrailers && itemWithTrailers.RemoteTrailers?.Count > 0);

        var itemObject = new Dictionary<string, object>
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

        if (themeVideo is not null) itemObject.Add("theme_video_id", themeVideo.Id.ToString());
        if (localTrailer is not null)
        {
            itemObject.Add("trailer_item_id", localTrailer.Id.ToString());
            itemObject.Add("trailer_item_type", localTrailer.GetBaseItemKind().ToString());
        }

        if (_config.ShowDescription) itemObject.Add("overview_html", RenderOverviewMarkdown(item.Overview));
        if (item.ProductionYear.HasValue) itemObject.Add("year", item.ProductionYear.Value);
        if (itemKind == BaseItemKind.Movie && item.RunTimeTicks.HasValue)
        {
            itemObject.Add("runtime_minutes", Math.Max(1, (int)Math.Round(
                TimeSpan.FromTicks(item.RunTimeTicks.Value).TotalMinutes)));
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
        return itemObject;
    }

    private Dictionary<string, object>? CreateOpeningSlide(
        Jellyfin.Database.Implementations.Entities.User activeUser)
    {
        if (_config.OpeningSlideType == "media")
        {
            BaseItem? item = GetVisibleConfiguredItem(_config.OpeningSlideMediaId, activeUser);
            if (item is null || !item.HasImage(MediaBrowser.Model.Entities.ImageType.Backdrop)) return null;

            return new Dictionary<string, object>
            {
                { "type", "media" },
                { "continueToSelection", _config.OpeningSlideContinue },
                { "item", CreateMediaItem(item, activeUser) }
            };
        }

        if (_config.OpeningSlideType != "message") return null;

        var slide = new Dictionary<string, object>
        {
            { "type", "message" },
            { "continueToSelection", _config.OpeningSlideContinue },
            { "eyebrow", LimitedText(_config.OpeningSlideEyebrow, 40) ?? "Welcome" },
            { "title", LimitedText(_config.OpeningSlideTitle, 120) ?? "Welcome" },
            { "bodyHtml", RenderOverviewMarkdown(LimitedText(_config.OpeningSlideBody, 4000)) },
            { "backgroundType", _config.OpeningSlideBackgroundType is "media" or "url"
                ? _config.OpeningSlideBackgroundType : "gradient" }
        };

        if (_config.OpeningSlideBackgroundType == "media")
        {
            BaseItem? background = GetVisibleConfiguredItem(_config.OpeningSlideBackgroundItemId, activeUser);
            if (background is not null && background.HasImage(MediaBrowser.Model.Entities.ImageType.Backdrop))
            {
                slide.Add("backgroundItemId", background.Id.ToString());
            }
            else
            {
                slide["backgroundType"] = "gradient";
            }
        }
        else if (_config.OpeningSlideBackgroundType == "url"
                 && NormalizeSafeUrl(_config.OpeningSlideBackgroundUrl) is { } backgroundUrl)
        {
            slide.Add("backgroundUrl", backgroundUrl);
        }
        else if (_config.OpeningSlideBackgroundType == "url")
        {
            slide["backgroundType"] = "gradient";
        }

        var actions = new List<object>();
        AddOpeningAction(actions, _config.OpeningSlidePrimaryButtonText, _config.OpeningSlidePrimaryButtonUrl, true);
        AddOpeningAction(actions, _config.OpeningSlideSecondaryButtonText, _config.OpeningSlideSecondaryButtonUrl, false);
        slide.Add("actions", actions);
        return slide;
    }

    private BaseItem? GetVisibleConfiguredItem(
        string? configuredId,
        Jellyfin.Database.Implementations.Entities.User activeUser)
    {
        if (!Guid.TryParse(configuredId, out Guid itemId)) return null;

        return _libraryManager.GetItemList(new InternalItemsQuery(activeUser)
        {
            ItemIds = [itemId],
            IncludeItemTypes = [BaseItemKind.Series, BaseItemKind.Movie]
        }).FirstOrDefault(item => item.Id == itemId && item.IsVisible(activeUser));
    }

    private static void AddOpeningAction(
        List<object> actions,
        string? label,
        string? configuredUrl,
        bool primary)
    {
        string? safeLabel = LimitedText(label, 60);
        string? safeUrl = NormalizeSafeUrl(configuredUrl);
        if (safeLabel is null || safeUrl is null) return;

        actions.Add(new Dictionary<string, object>
        {
            { "label", safeLabel },
            { "url", safeUrl },
            { "primary", primary }
        });
    }

    private static string? LimitedText(string? value, int maximumLength)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        string trimmed = value.Trim();
        return trimmed.Length <= maximumLength ? trimmed : trimmed[..maximumLength];
    }

    private static string? NormalizeSafeUrl(string? value)
    {
        string? trimmed = LimitedText(value, 2048);
        if (trimmed is null) return null;
        if ((trimmed.StartsWith('/') && !trimmed.StartsWith("//", StringComparison.Ordinal))
            || trimmed.StartsWith('#')) return trimmed;
        if (!Uri.TryCreate(trimmed, UriKind.Absolute, out Uri? uri)) return null;
        return uri.Scheme is "http" or "https" ? uri.AbsoluteUri : null;
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

}
