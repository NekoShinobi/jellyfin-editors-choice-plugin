using System.Security.Claims;
using EditorsChoicePlugin.Api;
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
            NullLogger<EditorsChoiceActivityController>.Instance)
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
        library.Verify(l => l.GetItemList(It.IsAny<InternalItemsQuery>()), Times.AtLeastOnce());
    }
}
