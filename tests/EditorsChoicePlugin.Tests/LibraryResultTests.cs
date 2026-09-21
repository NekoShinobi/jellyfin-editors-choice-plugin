using System.Security.Claims;
using EditorsChoicePlugin.Api;
using EditorsChoicePlugin.Services;
using EditorsChoicePlugin.Configuration;
using Jellyfin.Data.Enums;
using Jellyfin.Database.Implementations.Entities;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Controller.Configuration;
using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Entities.TV;
using MediaBrowser.Controller.Library;
using MediaBrowser.Controller.TV;
using MediaBrowser.Model.Serialization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace EditorsChoicePlugin.Tests;

[Collection("Plugin instance")]
public class LibraryResultTests
{
    [Theory]
    [InlineData("RANDOM", false)]
    [InlineData("FAVOURITES", false)]
    [InlineData("NEW", false)]
    [InlineData("NEW", true)]
    public void FeaturedItemsAcceptArrayBackedLibraryResults(string mode, bool includeSeries)
    {
        var user = new User("viewer", "authentication", "password-reset");
        var config = new PluginConfiguration { Mode = mode, EditorUserId = user.Id.ToString() };
        var paths = new Mock<IApplicationPaths>();
        paths.SetupGet(p => p.PluginsPath).Returns(Path.GetTempPath());
        paths.SetupGet(p => p.PluginConfigurationsPath).Returns(Path.GetTempPath());
        var serializer = new Mock<IXmlSerializer>();
        serializer.Setup(s => s.DeserializeFromFile(typeof(PluginConfiguration), It.IsAny<string>()))
            .Returns(config);
        _ = new Plugin(paths.Object, serializer.Object, NullLogger<Plugin>.Instance,
            Mock.Of<IServiceProvider>(), Mock.Of<IServerConfigurationManager>());

        var users = new Mock<IUserManager>();
        users.Setup(u => u.GetUserByName(user.Username)).Returns(user);
        users.Setup(u => u.GetUserById(user.Id)).Returns(user);
        var library = new Mock<ILibraryManager>();
        library.Setup(l => l.GetItemList(It.IsAny<InternalItemsQuery>()))
            .Returns((InternalItemsQuery query) =>
            {
                // Jellyfin may return arrays, including Array.Empty<BaseItem>().
                if (includeSeries && query.IncludeItemTypes.Length == 1)
                {
                    return query.IncludeItemTypes[0] switch
                    {
                        BaseItemKind.Series => new BaseItem[] { new Series { Id = Guid.NewGuid() } },
                        BaseItemKind.Season => new BaseItem[] { new Season { Id = Guid.NewGuid() } },
                        BaseItemKind.Episode => new BaseItem[] { new Episode { PremiereDate = DateTime.UtcNow } },
                        _ => Array.Empty<BaseItem>()
                    };
                }

                return Array.Empty<BaseItem>();
            });
        var controller = new EditorsChoiceActivityController(users.Object,
            Mock.Of<IUserDataManager>(), library.Object, Mock.Of<ITVSeriesManager>(),
            NullLogger<EditorsChoiceActivityController>.Instance,
            new HeroSelectionCache(users.Object, library.Object, new RotatingSelectionStore(), NullLogger<HeroSelectionCache>.Instance))
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(
                        new[] { new Claim(ClaimTypes.Name, user.Username) }, "test"))
                }
            }
        };

        var response = Assert.IsType<OkObjectResult>(controller.GetFavourites().Result);
        var body = Assert.IsType<Dictionary<string, object>>(response.Value);
        Assert.Empty(Assert.IsType<List<object>>(body["favourites"]));
        Assert.Equal("preset", body["bannerHeightMode"]);
        Assert.Equal("inherit", body["mobileBannerHeightMode"]);
        Assert.Equal(false, body["enableBackgroundDimming"]);
        Assert.Equal(true, body["enableBackgroundMotion"]);
        Assert.Equal(true, body["enableThemeVideos"]);
        library.Verify(l => l.GetItemList(It.IsAny<InternalItemsQuery>()), Times.AtLeastOnce());
    }

    [Fact]
    public void PresentationResponseValidatesValuesAndHonorsDisabledMotionAndVideo()
    {
        var user = new User("viewer", "authentication", "password-reset");
        var config = new PluginConfiguration
        {
            Mode = "RANDOM", BannerHeightMode = "invalid", MobileBannerHeightMode = "invalid",
            BannerCustomHeight = -1, BannerViewportHeight = 200,
            MobileBannerCustomHeight = 9000, MobileBannerViewportHeight = -1,
            TransitionEffect = "invalid", TransitionDurationMs = 9000,
            EnableBackgroundDimming = true, BackgroundDimmingPercent = 200,
            EnableBackgroundMotion = false, EnableThemeVideos = false,
            UseCustomPlayButtonColors = true,
            PlayButtonBackgroundColor = "not-a-color",
            PlayButtonTextColor = "#ABCDEF",
        };
        var paths = new Mock<IApplicationPaths>();
        paths.SetupGet(p => p.PluginsPath).Returns(Path.GetTempPath());
        paths.SetupGet(p => p.PluginConfigurationsPath).Returns(Path.GetTempPath());
        var serializer = new Mock<IXmlSerializer>();
        serializer.Setup(s => s.DeserializeFromFile(typeof(PluginConfiguration), It.IsAny<string>())).Returns(config);
        _ = new Plugin(paths.Object, serializer.Object, NullLogger<Plugin>.Instance,
            Mock.Of<IServiceProvider>(), Mock.Of<IServerConfigurationManager>());
        var users = new Mock<IUserManager>();
        users.Setup(u => u.GetUserByName(user.Username)).Returns(user);
        var library = new Mock<ILibraryManager>();
        library.Setup(l => l.GetItemList(It.IsAny<InternalItemsQuery>())).Returns(Array.Empty<BaseItem>());
        var controller = new EditorsChoiceActivityController(users.Object, Mock.Of<IUserDataManager>(),
            library.Object, Mock.Of<ITVSeriesManager>(), NullLogger<EditorsChoiceActivityController>.Instance,
            new HeroSelectionCache(users.Object, library.Object, new RotatingSelectionStore(), NullLogger<HeroSelectionCache>.Instance))
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.Name, user.Username) }, "test"))
                }
            }
        };
        var response = Assert.IsType<OkObjectResult>(controller.GetFavourites().Result);
        var body = Assert.IsType<Dictionary<string, object>>(response.Value);
        Assert.Equal("preset", body["bannerHeightMode"]);
        Assert.Equal("inherit", body["mobileBannerHeightMode"]);
        Assert.Equal(240, body["bannerCustomHeight"]);
        Assert.Equal(100, body["bannerViewportHeight"]);
        Assert.Equal(2160, body["mobileBannerCustomHeight"]);
        Assert.Equal(25, body["mobileBannerViewportHeight"]);
        Assert.Equal("loop", body["transitionEffect"]);
        Assert.Equal(3000, body["transitionDurationMs"]);
        Assert.Equal(100, body["backgroundDimmingPercent"]);
        Assert.Equal(true, body["enableBackgroundDimming"]);
        Assert.Equal(false, body["enableBackgroundMotion"]);
        Assert.Equal(false, body["enableThemeVideos"]);
        Assert.Equal(true, body["useCustomPlayButtonColors"]);
        Assert.Equal("#7f5af0", body["playButtonBackgroundColor"]);
        Assert.Equal("#abcdef", body["playButtonTextColor"]);
    }

    [Fact]
    public void OlderConfigurationKeepsExistingHeightAndNewFeatureDefaults()
    {
        var serializer = new System.Xml.Serialization.XmlSerializer(typeof(PluginConfiguration));
        using var xml = new StringReader("<PluginConfiguration><BannerHeight>500</BannerHeight><UseHeroLayout>true</UseHeroLayout></PluginConfiguration>");
        var config = Assert.IsType<PluginConfiguration>(serializer.Deserialize(xml));
        Assert.Equal(500, config.BannerHeight);
        Assert.True(config.UseHeroLayout);
        Assert.Equal("preset", config.BannerHeightMode);
        Assert.Equal("inherit", config.MobileBannerHeightMode);
        Assert.False(config.EnableBackgroundDimming);
        Assert.True(config.EnableBackgroundMotion);
        Assert.True(config.EnableThemeVideos);
        Assert.Equal("left", config.OpeningSlideAlignment);
        Assert.False(config.OpeningSlideUseCustomButtonStyles);
        Assert.Equal(100, config.OpeningSlidePrimaryButtonOpacity);
        Assert.Equal(85, config.OpeningSlideSecondaryButtonOpacity);
        Assert.False(config.UseCustomPlayButtonColors);
    }
}
