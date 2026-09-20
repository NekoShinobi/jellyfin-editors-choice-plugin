using EditorsChoicePlugin.Services;
using Microsoft.Extensions.DependencyInjection;
using MediaBrowser.Controller;
using MediaBrowser.Controller.Plugins;

namespace EditorsChoicePlugin;

public class PluginServiceRegistrator : IPluginServiceRegistrator
{
    public void RegisterServices(Microsoft.Extensions.DependencyInjection.IServiceCollection serviceCollection, IServerApplicationHost applicationHost)
    {
        serviceCollection.AddSingleton<RotatingSelectionStore>();
        serviceCollection.AddSingleton<HeroSelectionCache>();
        serviceCollection.AddHostedService(provider => provider.GetRequiredService<HeroSelectionCache>());
    }
}