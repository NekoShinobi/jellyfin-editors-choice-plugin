using MediaBrowser.Common.Configuration;
using MediaBrowser.Controller.Configuration;
using MediaBrowser.Model.Serialization;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace EditorsChoicePlugin.Tests;

[Collection("Plugin instance")]
public class PluginIdentityTests
{
    [Fact]
    public void RuntimeNameMatchesPackageIdentityName()
    {
        var paths = new Mock<IApplicationPaths>();
        paths.SetupGet(p => p.PluginsPath).Returns(Path.GetTempPath());
        paths.SetupGet(p => p.PluginConfigurationsPath).Returns(Path.GetTempPath());

        var plugin = new Plugin(
            paths.Object,
            Mock.Of<IXmlSerializer>(),
            NullLogger<Plugin>.Instance,
            Mock.Of<IServiceProvider>(),
            Mock.Of<IServerConfigurationManager>());

        Assert.Equal("EditorsChoice", plugin.Name);
    }
}
