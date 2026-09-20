using MediaBrowser.Model.Plugins;

namespace EditorsChoicePlugin.Configuration;

public class PluginConfiguration : BasePluginConfiguration
{
    public PluginConfiguration() { }

    public string EditorUserId { get; set; } = "";

    public string FrontendInjectionMethod { get; set; } = FrontendInjectionMethods.Automatic;

    // Retained for configuration compatibility with older plugin releases.
    public bool DoScriptInject { get; set; } = true;

    // Retained for configuration compatibility with older plugin releases.
    public bool FileTransformation { get; set; } = false;

    public bool ShowRandomMedia { get; set; } = true;

    public string Mode { get; set; } = "";

    public int RandomMediaCount { get; set; } = 5;

    public float MinimumRating { get; set; } = 0.0f;

    public int MinimumCriticRating { get; set; } = 0;

    public int MaximumParentRating { get; set; } = -2;
    public int MaximumParentRatingSubscore { get; set; } = 0;

    public string[] FilteredLibraries { get; set; } = [];

    public string[] SelectedCollections { get; set; } = [];

    public bool EnableAutoplay { get; set; } = true;

    public bool ShowAutoplayButton { get; set; } = true;

    public int AutoplayInterval { get; set; } = 10;

    public bool ShowPlayButton { get; set; } = true;

    public bool ShowNavigationArrows { get; set; } = true;

    public string NewTimeLimit { get; set; } = "1month";

    public bool ShowDescription { get; set; } = true;

    public bool HideOnTvLayout { get; set; } = false;

    // Legacy XML compatibility only; the frontend now always uses Hero layout.
    public bool UseHeroLayout { get; set; } = true;

    public string TransitionEffect { get; set; } = "loop";

    // Zero uses the Hero transition default of 650ms.
    public int TransitionDurationMs { get; set; } = 0;

    public bool EnableBackgroundMotion { get; set; } = true;

    public bool EnableThemeVideos { get; set; } = true;

    public bool EnableBackgroundDimming { get; set; } = false;

    public int BackgroundDimmingPercent { get; set; } = 30;

    public string HeroBackdropPosition { get; set; } = "center";

    public bool ReduceImageSize { get; set; } = false;

    public int BannerHeight { get; set; } = 360;

    // Preset mode preserves the legacy Hero layout's additional 120 pixels.
    public string BannerHeightMode { get; set; } = "preset";

    public int BannerCustomHeight { get; set; } = 600;

    public int BannerViewportHeight { get; set; } = 75;

    public bool BannerSubtractHeader { get; set; } = true;

    public string MobileBannerHeightMode { get; set; } = "inherit";

    public int MobileBannerCustomHeight { get; set; } = 360;

    public int MobileBannerViewportHeight { get; set; } = 60;

    public string TitleFont { get; set; } = "default";

    public string MetadataFont { get; set; } = "default";

    public string DescriptionFont { get; set; } = "default";

    public string ButtonFont { get; set; } = "default";

    public bool EnableSelectionCache { get; set; } = true;

    public int SelectionRefreshMinutes { get; set; } = 30;

    public bool ShowPlayed { get; set; } = true;

    // Legacy XML compatibility only; Hero banners have no section heading.
    public string? Heading { get; set; }
    public string? PlayButtonText { get; set; }
}
