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

    // MIXED mode: titles taken from each source. Zero leaves a source out.
    public int MixedFavouritesCount { get; set; } = 2;

    public int MixedNewCount { get; set; } = 2;

    public int MixedCollectionsCount { get; set; } = 0;

    public int MixedRandomCount { get; set; } = 1;

    // "interleave" alternates sources, "grouped" keeps each source together, "shuffle" randomizes.
    public string MixedOrder { get; set; } = "interleave";

    public bool MixedFillWithRandom { get; set; } = true;

    // Cycle through every eligible title before featuring one again.
    public bool AvoidRepeats { get; set; } = true;

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

    // Optional administrator-authored slide shown before the automatic selection.
    public string OpeningSlideType { get; set; } = "none";

    public bool OpeningSlideContinue { get; set; } = true;

    public string? OpeningSlideMediaId { get; set; }

    public string? OpeningSlideMediaName { get; set; }

    public string OpeningSlideEyebrow { get; set; } = "Welcome";

    public string OpeningSlideTitle { get; set; } = "Welcome to our media library";

    public string OpeningSlideBody { get; set; } = "Browse the latest additions, continue watching, or explore something new.";

    public string OpeningSlideAlignment { get; set; } = "left";

    public string OpeningSlideBackgroundType { get; set; } = "gradient";

    public string? OpeningSlideBackgroundItemId { get; set; }

    public string? OpeningSlideBackgroundItemName { get; set; }

    public string? OpeningSlideBackgroundUrl { get; set; }

    public string? OpeningSlidePrimaryButtonText { get; set; }

    public string? OpeningSlidePrimaryButtonUrl { get; set; }

    public string? OpeningSlideSecondaryButtonText { get; set; }

    public string? OpeningSlideSecondaryButtonUrl { get; set; }

    public bool OpeningSlideUseCustomButtonStyles { get; set; } = false;

    public string OpeningSlidePrimaryButtonBackgroundColor { get; set; } = "#7f5af0";

    public string OpeningSlidePrimaryButtonTextColor { get; set; } = "#ffffff";

    public int OpeningSlidePrimaryButtonOpacity { get; set; } = 100;

    public string OpeningSlideSecondaryButtonBackgroundColor { get; set; } = "#20242c";

    public string OpeningSlideSecondaryButtonTextColor { get; set; } = "#ffffff";

    public int OpeningSlideSecondaryButtonOpacity { get; set; } = 85;

    public bool UseCustomPlayButtonColors { get; set; } = false;

    public string PlayButtonBackgroundColor { get; set; } = "#7f5af0";

    public string PlayButtonTextColor { get; set; } = "#ffffff";

    // Hero composition. Defaults reproduce the layout from earlier releases.
    public string HeroContentAlignment { get; set; } = "left";

    public string MobileContentAlignment { get; set; } = "inherit";

    public string HeroContentVerticalPosition { get; set; } = "center";

    // Percentage of the banner width; zero keeps the automatic 650px text column.
    public int HeroContentMaxWidth { get; set; } = 0;

    public string HeroPosterMode { get; set; } = "auto";

    public string HeroPosterSize { get; set; } = "medium";

    public bool MobileHidePoster { get; set; } = false;

    public string HeroFrameStyle { get; set; } = "bleed";

    public int HeroCornerRadius { get; set; } = 16;

    // Hero backdrop. HeroBackdropPosition "custom" enables the focus coordinates.
    public string HeroBackdropImageType { get; set; } = "Backdrop";

    public int HeroBackdropFocusX { get; set; } = 50;

    public int HeroBackdropFocusY { get; set; } = 50;

    public int HeroBackdropBlur { get; set; } = 0;

    public int HeroBackdropBrightness { get; set; } = 100;

    public int HeroBackdropSaturation { get; set; } = 100;

    public string HeroScrimStyle { get; set; } = "auto";

    public string HeroScrimColor { get; set; } = "#000000";

    public int HeroScrimStrength { get; set; } = 100;

    // Hero typography and colour.
    public bool UseHeroAccentColor { get; set; } = false;

    public string HeroAccentColor { get; set; } = "#00a4dc";

    public string HeroTitleDisplay { get; set; } = "logo";

    public string HeroTitleSize { get; set; } = "medium";

    public bool UseCustomTextColors { get; set; } = false;

    public string HeroTitleColor { get; set; } = "#ffffff";

    public string HeroTextColor { get; set; } = "#ffffff";

    public string HeroTextShadow { get; set; } = "none";

    public bool ShowTagline { get; set; } = false;

    public string[] HeroMetadataFields { get; set; } = ["type", "rating", "year", "runtime", "official"];

    public string HeroMetadataSeparator { get; set; } = "pill";

    public int HeroMaxGenres { get; set; } = 2;

    public int HeroOverviewMaxLines { get; set; } = 4;

    public string HeroOverviewSize { get; set; } = "medium";

    public bool MobileHideDescription { get; set; } = false;

    // Hero buttons.
    public bool ShowInfoButton { get; set; } = true;

    public bool ShowTrailerButton { get; set; } = false;

    public string HeroButtonShape { get; set; } = "default";

    public string HeroButtonVariant { get; set; } = "filled";

    public string HeroButtonSize { get; set; } = "medium";

    public bool ShowResumeProgress { get; set; } = true;

    // Hero motion and navigation.
    // One easing curve shapes slide transitions, the text reveal and the artwork zoom.
    // A preset name from BannerSettings.EasingPresets, or "custom" for the points below.
    public string TransitionEasing { get; set; } = "smooth";

    public double TransitionEasingX1 { get; set; } = 0.22;

    public double TransitionEasingY1 { get; set; } = 1;

    public double TransitionEasingX2 { get; set; } = 0.36;

    public double TransitionEasingY2 { get; set; } = 1;

    public string BackgroundMotionIntensity { get; set; } = "normal";

    public int ThemeVideoStartDelaySeconds { get; set; } = 0;

    public bool PauseOnHover { get; set; } = true;

    public string HeroIndicatorStyle { get; set; } = "dots";

    public string HeroIndicatorPosition { get; set; } = "center";

    public string HeroArrowStyle { get; set; } = "circle";

    // Administrator CSS, nested inside the banner container on the client.
    public string HeroCustomCss { get; set; } = "";

    // Legacy XML compatibility only; Hero banners have no section heading.
    public string? Heading { get; set; }
    public string? PlayButtonText { get; set; }
}
