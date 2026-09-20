namespace EditorsChoicePlugin.Configuration;

public static class BannerSettings
{
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
        response.Add("transitionEffect", config.TransitionEffect is "fade" or "zoom" or "wipe" or "instant" ? config.TransitionEffect : "loop");
        response.Add("showPlayButton", config.ShowPlayButton);
        response.Add("showNavigationArrows", config.ShowNavigationArrows);
        response.Add("hideOnTvLayout", config.HideOnTvLayout);
        response.Add("heroBackdropPosition", config.HeroBackdropPosition);

        // If ShowPlayButton is true and a PlayButtonText is set, include this in the response to allow custom play button text
        if (config.ShowPlayButton && !string.IsNullOrEmpty(config.PlayButtonText))
        {
            response.Add("playButtonText", config.PlayButtonText);
        }

        response.Add("titleFont", NormalizeFont(config.TitleFont));
        response.Add("metadataFont", NormalizeFont(config.MetadataFont));
        response.Add("descriptionFont", NormalizeFont(config.DescriptionFont));
        response.Add("buttonFont", NormalizeFont(config.ButtonFont));
        return response;
    }

    private static string NormalizeFont(string font) =>
        font is "system" or "noto" or "arial" or "verdana" or "trebuchet" or "georgia" or "serif" or "mono" ? font : "default";
}
