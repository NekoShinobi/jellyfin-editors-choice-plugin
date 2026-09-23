using System.Globalization;
using System.Xml.Serialization;
using EditorsChoicePlugin.Configuration;
using Xunit;

namespace EditorsChoicePlugin.Tests;

public class BannerSettingsTests
{
    [Fact]
    public void DefaultsKeepTheOriginalLayout()
    {
        var settings = BannerSettings.Create(new PluginConfiguration());
        Assert.Equal("left", settings["heroContentAlignment"]);
        Assert.Equal("center", settings["heroContentVerticalPosition"]);
        Assert.Equal(0, settings["heroContentMaxWidth"]);
        Assert.Equal("auto", settings["heroScrimStyle"]);
        Assert.Equal(100, settings["heroScrimStrength"]);
        Assert.Equal(4, settings["heroOverviewMaxLines"]);
        Assert.Equal("dots", settings["heroIndicatorStyle"]);
        Assert.Equal(new[] { "type", "rating", "year", "runtime", "official" }, settings["heroMetadataFields"]);
        Assert.Equal(true, settings["showInfoButton"]);
        Assert.DoesNotContain("heroAccentColor", settings.Keys);
        Assert.DoesNotContain("heroTitleColor", settings.Keys);
        Assert.DoesNotContain("heroBackdropFocusX", settings.Keys);
    }

    [Theory]
    [InlineData("loop")]
    [InlineData("fade")]
    [InlineData("zoom")]
    [InlineData("wipe")]
    [InlineData("parallax")]
    [InlineData("dip")]
    [InlineData("stagger")]
    [InlineData("iris")]
    [InlineData("instant")]
    public void EveryTransitionEffectReachesTheBrowser(string effect)
    {
        var settings = BannerSettings.Create(new PluginConfiguration { TransitionEffect = effect });
        Assert.Equal(effect, settings["transitionEffect"]);
    }

    [Fact]
    public void InvalidValuesFallBackToDefaults()
    {
        var config = new PluginConfiguration
        {
            HeroContentAlignment = "diagonal",
            HeroContentMaxWidth = 12,
            HeroScrimStyle = "<script>",
            HeroScrimColor = "red",
            HeroScrimStrength = 400,
            HeroOverviewMaxLines = 0,
            HeroBackdropPosition = "sideways",
            HeroMetadataFields = ["year", "bogus", "year", "genres"],
            HeroCornerRadius = -5,
        };

        var settings = BannerSettings.Create(config);
        Assert.Equal("left", settings["heroContentAlignment"]);
        Assert.Equal(0, settings["heroContentMaxWidth"]);
        Assert.Equal("auto", settings["heroScrimStyle"]);
        Assert.Equal("#000000", settings["heroScrimColor"]);
        Assert.Equal(100, settings["heroScrimStrength"]);
        Assert.Equal(1, settings["heroOverviewMaxLines"]);
        Assert.Equal("center", settings["heroBackdropPosition"]);
        Assert.Equal(new[] { "year", "genres" }, settings["heroMetadataFields"]);
        Assert.Equal(0, settings["heroCornerRadius"]);
    }

    [Fact]
    public void OptionalColorsAndFocusAreSentOnlyWhenEnabled()
    {
        var config = new PluginConfiguration
        {
            UseHeroAccentColor = true,
            HeroAccentColor = "#FF8800",
            UseCustomTextColors = true,
            HeroTitleColor = "not a color",
            HeroBackdropPosition = "custom",
            HeroBackdropFocusX = 130,
            HeroBackdropFocusY = 25,
        };

        var settings = BannerSettings.Create(config);
        Assert.Equal("#ff8800", settings["heroAccentColor"]);
        Assert.Equal("#ffffff", settings["heroTitleColor"]);
        Assert.Equal(100, settings["heroBackdropFocusX"]);
        Assert.Equal(25, settings["heroBackdropFocusY"]);
    }

    [Theory]
    [InlineData("smooth", "cubic-bezier(0.22, 1, 0.36, 1)")]
    [InlineData("overshoot", "cubic-bezier(0.34, 1.56, 0.64, 1)")]
    [InlineData("anticipate", "cubic-bezier(0.36, 0, 0.66, -0.56)")]
    [InlineData("bouncy-castle", "cubic-bezier(0.22, 1, 0.36, 1)")]
    public void EasingPresetsResolveToCubicBezier(string preset, string expected)
    {
        Assert.Equal(expected, BannerSettings.Create(new PluginConfiguration { TransitionEasing = preset })["transitionEasing"]);
    }

    [Fact]
    public void CustomEasingIsClampedAndCultureInvariant()
    {
        var culture = CultureInfo.CurrentCulture;
        try
        {
            // Some locales write decimals with commas, which CSS would reject.
            CultureInfo.CurrentCulture = new CultureInfo("de-DE");
            var config = new PluginConfiguration
            {
                TransitionEasing = "custom",
                TransitionEasingX1 = 1.4,
                TransitionEasingY1 = -9,
                TransitionEasingX2 = 0.125,
                TransitionEasingY2 = 1.5,
            };
            Assert.Equal("cubic-bezier(1, -2, 0.125, 1.5)", BannerSettings.NormalizeEasing(config));
            config.TransitionEasingY2 = double.NaN;
            Assert.Equal("cubic-bezier(0.22, 1, 0.36, 1)", BannerSettings.NormalizeEasing(config));
        }
        finally
        {
            CultureInfo.CurrentCulture = culture;
        }
    }

    [Fact]
    public void CustomCssStaysOutOfThePreLoginBootstrap()
    {
        var settings = BannerSettings.Create(new PluginConfiguration { HeroCustomCss = ".x { color: red; }" });
        Assert.DoesNotContain("heroCustomCss", settings.Keys);
    }

    [Theory]
    [InlineData(".x { color: red; }", true)]
    [InlineData(".x { .y { color: red; } }", true)]
    [InlineData(".x { content: \"}\"; }", true)]
    [InlineData("/* } */ .x { color: red; }", true)]
    [InlineData(".x { color: red; } } body { display: none; } .y {", false)]
    [InlineData(".x { color: red;", false)]
    [InlineData(".x { content: \"; }", false)]
    [InlineData("/* unterminated", false)]
    [InlineData("   ", false)]
    public void CustomCssMustKeepBracesBalanced(string css, bool accepted)
    {
        Assert.Equal(accepted, BannerSettings.NormalizeCustomCss(css) is not null);
    }

    [Fact]
    public void CustomCssHasALengthLimit()
    {
        string css = ".x { color: red; }" + new string(' ', BannerSettings.CustomCssMaxLength);
        Assert.Null(BannerSettings.NormalizeCustomCss(css));
    }

    [Fact]
    public void MetadataFieldsRoundTripThroughXml()
    {
        // Jellyfin stores plugin configuration as XML: an administrator may turn
        // every field off, and older files omit the element entirely.
        var serializer = new XmlSerializer(typeof(PluginConfiguration));
        foreach (string[] fields in new[] { Array.Empty<string>(), new[] { "genres", "year" } })
        {
            using var writer = new StringWriter();
            serializer.Serialize(writer, new PluginConfiguration { HeroMetadataFields = fields });
            using var reader = new StringReader(writer.ToString());
            var restored = (PluginConfiguration)serializer.Deserialize(reader)!;
            Assert.Equal(fields, restored.HeroMetadataFields);
        }

        const string legacy = "<?xml version=\"1.0\"?><PluginConfiguration xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\"><Mode>RANDOM</Mode></PluginConfiguration>";
        using var legacyReader = new StringReader(legacy);
        var upgraded = (PluginConfiguration)serializer.Deserialize(legacyReader)!;
        Assert.Equal(BannerSettings.DefaultMetadataFields, upgraded.HeroMetadataFields);
    }
}
