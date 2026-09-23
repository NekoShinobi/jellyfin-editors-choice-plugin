using System.Globalization;

namespace EditorsChoicePlugin.Configuration;

public static class BannerSettings
{
    public static readonly string[] MetadataFields = ["type", "rating", "critic", "year", "runtime", "official", "genres", "ends"];

    public static readonly string[] DefaultMetadataFields = ["type", "rating", "year", "runtime", "official"];

    public const int CustomCssMaxLength = 10000;

    // Cubic Bézier control points (x1, y1, x2, y2). Keep in sync with easingPresets in configPage.js.
    public static readonly IReadOnlyDictionary<string, double[]> EasingPresets = new Dictionary<string, double[]>
    {
        ["smooth"] = [0.22, 1, 0.36, 1],
        ["ease"] = [0.25, 0.1, 0.25, 1],
        ["ease-in"] = [0.42, 0, 1, 1],
        ["ease-out"] = [0, 0, 0.58, 1],
        ["ease-in-out"] = [0.42, 0, 0.58, 1],
        ["linear"] = [0, 0, 1, 1],
        ["gentle"] = [0.4, 0, 0.2, 1],
        ["dramatic"] = [0.7, 0, 0.3, 1],
        ["overshoot"] = [0.34, 1.56, 0.64, 1],
        ["anticipate"] = [0.36, 0, 0.66, -0.56],
    };

    // CSS requires x values within 0–1; y may leave that range to overshoot.
    public const double EasingMinimumY = -2;

    public const double EasingMaximumY = 3;

    // Presentation only: safe to include in the initial script before login.
    // No user IDs, library filters, selected media, or playback information.
    public static Dictionary<string, object> Create(PluginConfiguration config)
    {
        var response = new Dictionary<string, object>();
        response.Add("autoplay", config.EnableAutoplay);
        response.Add("showAutoplayButton", config.ShowAutoplayButton);
        response.Add("autoplayInterval", config.AutoplayInterval * 1000);
        response.Add("reduceImageSizes", config.ReduceImageSize);
        response.Add("bannerHeight", config.BannerHeight);
        response.Add("bannerHeightMode", config.BannerHeightMode is "pixels" or "viewport" or "fullscreen" ? config.BannerHeightMode : "preset");
        response.Add("bannerCustomHeight", Math.Clamp(config.BannerCustomHeight, 240, 2160));
        response.Add("bannerViewportHeight", Math.Clamp(config.BannerViewportHeight, 25, 100));
        response.Add("bannerSubtractHeader", config.BannerSubtractHeader);
        response.Add("mobileBannerHeightMode", config.MobileBannerHeightMode is "pixels" or "viewport" or "fullscreen" ? config.MobileBannerHeightMode : "inherit");
        response.Add("mobileBannerCustomHeight", Math.Clamp(config.MobileBannerCustomHeight, 240, 2160));
        response.Add("mobileBannerViewportHeight", Math.Clamp(config.MobileBannerViewportHeight, 25, 100));
        response.Add("transitionDurationMs", Math.Clamp(config.TransitionDurationMs, 0, 3000));
        response.Add("enableBackgroundMotion", config.EnableBackgroundMotion);
        response.Add("enableThemeVideos", config.EnableThemeVideos);
        response.Add("enableBackgroundDimming", config.EnableBackgroundDimming);
        response.Add("backgroundDimmingPercent", Math.Clamp(config.BackgroundDimmingPercent, 0, 100));
        response.Add("useHeroLayout", true);
        response.Add("transitionEasing", NormalizeEasing(config));
        response.Add("transitionEffect", config.TransitionEffect is "fade" or "zoom" or "wipe" or "parallax" or "dip" or "stagger" or "iris" or "instant"
            ? config.TransitionEffect : "loop");
        response.Add("showPlayButton", config.ShowPlayButton);
        response.Add("showNavigationArrows", config.ShowNavigationArrows);
        response.Add("hideOnTvLayout", config.HideOnTvLayout);
        response.Add("heroBackdropPosition", Choice(config.HeroBackdropPosition, "center", "top", "bottom", "custom"));
        if (config.HeroBackdropPosition == "custom")
        {
            response.Add("heroBackdropFocusX", Math.Clamp(config.HeroBackdropFocusX, 0, 100));
            response.Add("heroBackdropFocusY", Math.Clamp(config.HeroBackdropFocusY, 0, 100));
        }

        response.Add("useCustomPlayButtonColors", config.UseCustomPlayButtonColors);
        if (config.UseCustomPlayButtonColors)
        {
            response.Add("playButtonBackgroundColor", NormalizeColor(config.PlayButtonBackgroundColor, "#7f5af0"));
            response.Add("playButtonTextColor", NormalizeColor(config.PlayButtonTextColor, "#ffffff"));
        }

        // If ShowPlayButton is true and a PlayButtonText is set, include this in the response to allow custom play button text
        if (config.ShowPlayButton && !string.IsNullOrEmpty(config.PlayButtonText))
        {
            response.Add("playButtonText", config.PlayButtonText);
        }

        response.Add("titleFont", NormalizeFont(config.TitleFont));
        response.Add("metadataFont", NormalizeFont(config.MetadataFont));
        response.Add("descriptionFont", NormalizeFont(config.DescriptionFont));
        response.Add("buttonFont", NormalizeFont(config.ButtonFont));

        response.Add("heroContentAlignment", Choice(config.HeroContentAlignment, "left", "center", "right"));
        response.Add("mobileContentAlignment", Choice(config.MobileContentAlignment, "inherit", "left", "center"));
        response.Add("heroContentVerticalPosition", Choice(config.HeroContentVerticalPosition, "center", "top", "bottom"));
        response.Add("heroContentMaxWidth", config.HeroContentMaxWidth is >= 30 and <= 90 ? config.HeroContentMaxWidth : 0);
        response.Add("heroPosterMode", Choice(config.HeroPosterMode, "auto", "right", "hidden"));
        response.Add("heroPosterSize", Choice(config.HeroPosterSize, "medium", "small", "large"));
        response.Add("mobileHidePoster", config.MobileHidePoster);
        response.Add("heroFrameStyle", Choice(config.HeroFrameStyle, "bleed", "inset"));
        response.Add("heroCornerRadius", Math.Clamp(config.HeroCornerRadius, 0, 32));
        response.Add("heroBackdropBlur", Math.Clamp(config.HeroBackdropBlur, 0, 20));
        response.Add("heroBackdropBrightness", Math.Clamp(config.HeroBackdropBrightness, 50, 150));
        response.Add("heroBackdropSaturation", Math.Clamp(config.HeroBackdropSaturation, 0, 150));
        response.Add("heroScrimStyle", Choice(config.HeroScrimStyle, "auto", "side", "bottom", "vignette", "none"));
        response.Add("heroScrimColor", NormalizeColor(config.HeroScrimColor, "#000000"));
        response.Add("heroScrimStrength", Math.Clamp(config.HeroScrimStrength, 0, 100));
        if (config.UseHeroAccentColor)
        {
            response.Add("heroAccentColor", NormalizeColor(config.HeroAccentColor, "#00a4dc"));
        }

        response.Add("heroTitleDisplay", Choice(config.HeroTitleDisplay, "logo", "title", "both"));
        response.Add("heroTitleSize", Choice(config.HeroTitleSize, "medium", "small", "large", "xlarge"));
        if (config.UseCustomTextColors)
        {
            response.Add("heroTitleColor", NormalizeColor(config.HeroTitleColor, "#ffffff"));
            response.Add("heroTextColor", NormalizeColor(config.HeroTextColor, "#ffffff"));
        }

        response.Add("heroTextShadow", Choice(config.HeroTextShadow, "none", "soft", "strong"));
        response.Add("showTagline", config.ShowTagline);
        response.Add("heroMetadataFields", NormalizeMetadataFields(config.HeroMetadataFields));
        response.Add("heroMetadataSeparator", Choice(config.HeroMetadataSeparator, "pill", "dot", "pipe", "none"));
        response.Add("heroMaxGenres", Math.Clamp(config.HeroMaxGenres, 1, 5));
        response.Add("heroOverviewMaxLines", Math.Clamp(config.HeroOverviewMaxLines, 1, 8));
        response.Add("heroOverviewSize", Choice(config.HeroOverviewSize, "medium", "small", "large"));
        response.Add("mobileHideDescription", config.MobileHideDescription);
        response.Add("showInfoButton", config.ShowInfoButton);
        response.Add("showTrailerButton", config.ShowTrailerButton);
        response.Add("heroButtonShape", Choice(config.HeroButtonShape, "default", "rounded", "pill", "square"));
        response.Add("heroButtonVariant", Choice(config.HeroButtonVariant, "filled", "outline", "glass"));
        response.Add("heroButtonSize", Choice(config.HeroButtonSize, "medium", "small", "large"));
        response.Add("showResumeProgress", config.ShowResumeProgress);
        response.Add("backgroundMotionIntensity", Choice(config.BackgroundMotionIntensity, "normal", "subtle", "strong"));
        response.Add("themeVideoStartDelaySeconds", Math.Clamp(config.ThemeVideoStartDelaySeconds, 0, 10));
        response.Add("pauseOnHover", config.PauseOnHover);
        response.Add("heroIndicatorStyle", Choice(config.HeroIndicatorStyle, "dots", "none", "bars", "counter", "progress"));
        response.Add("heroIndicatorPosition", Choice(config.HeroIndicatorPosition, "center", "left", "right"));
        response.Add("heroArrowStyle", Choice(config.HeroArrowStyle, "circle", "minimal", "hover"));
        return response;
    }

    private static string NormalizeFont(string font) =>
        font is "system" or "noto" or "arial" or "verdana" or "trebuchet" or "georgia" or "serif" or "mono" ? font : "default";

    // Returns the value when it is one of the allowed options, otherwise the fallback.
    private static string Choice(string? value, string fallback, params string[] allowed) =>
        value is not null && (value == fallback || allowed.Contains(value)) ? value : fallback;

    public static string[] NormalizeMetadataFields(string[]? fields) =>
        fields is null ? DefaultMetadataFields : fields.Where(MetadataFields.Contains).Distinct().ToArray();

    public static string NormalizeEasing(PluginConfiguration config)
    {
        double[] points = config.TransitionEasing == "custom"
            ? [config.TransitionEasingX1, config.TransitionEasingY1, config.TransitionEasingX2, config.TransitionEasingY2]
            : EasingPresets.GetValueOrDefault(config.TransitionEasing ?? "", EasingPresets["smooth"]);
        if (points.Any(point => !double.IsFinite(point))) points = EasingPresets["smooth"];

        double x1 = Math.Clamp(points[0], 0, 1);
        double y1 = Math.Clamp(points[1], EasingMinimumY, EasingMaximumY);
        double x2 = Math.Clamp(points[2], 0, 1);
        double y2 = Math.Clamp(points[3], EasingMinimumY, EasingMaximumY);
        return string.Create(CultureInfo.InvariantCulture, $"cubic-bezier({x1:0.###}, {y1:0.###}, {x2:0.###}, {y2:0.###})");
    }

    public static string NormalizeColor(string? color, string fallback)
    {
        string? value = color?.Trim();
        return value is { Length: 7 } && value[0] == '#' && value[1..].All(Uri.IsHexDigit)
            ? value.ToLowerInvariant()
            : fallback;
    }

    // The client nests this CSS inside the banner container, so braces must stay
    // balanced: a stray closing brace would let rules escape to the whole page.
    public static string? NormalizeCustomCss(string? css)
    {
        if (string.IsNullOrWhiteSpace(css) || css.Length > CustomCssMaxLength) return null;

        int depth = 0;
        char quote = '\0';
        for (int i = 0; i < css.Length; i++)
        {
            char c = css[i];
            if (quote != '\0')
            {
                if (c == '\\') i++;
                else if (c == quote) quote = '\0';
                continue;
            }

            if (c == '/' && i + 1 < css.Length && css[i + 1] == '*')
            {
                int end = css.IndexOf("*/", i + 2, StringComparison.Ordinal);
                if (end < 0) return null;
                i = end + 1;
                continue;
            }

            if (c is '"' or '\'') quote = c;
            else if (c == '{') depth++;
            else if (c == '}' && --depth < 0) return null;
        }

        return depth == 0 && quote == '\0' ? css.Trim() : null;
    }
}
