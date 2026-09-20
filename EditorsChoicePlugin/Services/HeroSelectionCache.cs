using System.Text.Json;
using EditorsChoicePlugin.Configuration;
using Jellyfin.Data;
using Jellyfin.Data.Enums;
using Jellyfin.Database.Implementations.Entities;
using Jellyfin.Database.Implementations.Enums;
using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Library;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace EditorsChoicePlugin.Services;

public sealed class HeroSelectionCache : BackgroundService
{
    private readonly IUserManager _users;
    private readonly ILibraryManager _library;
    private readonly RotatingSelectionStore _store;
    private readonly ILogger<HeroSelectionCache> _logger;

    public HeroSelectionCache(IUserManager users, ILibraryManager library,
        RotatingSelectionStore store, ILogger<HeroSelectionCache> logger)
    {
        _users = users;
        _library = library;
        _store = store;
        _logger = logger;
    }

    public static string ConfigurationKey(PluginConfiguration config) => JsonSerializer.Serialize(new
    {
        config.Mode, config.ShowRandomMedia, config.EditorUserId, config.RandomMediaCount,
        config.MinimumRating, config.MinimumCriticRating, config.MaximumParentRating,
        config.MaximumParentRatingSubscore, config.FilteredLibraries, config.SelectedCollections,
        config.NewTimeLimit, config.ShowPlayed, config.SelectionRefreshMinutes,
    });

    private Guid[] GetIds(User user, PluginConfiguration config) => _store.Get(
        user.Id, ConfigurationKey(config), TimeSpan.FromMinutes(Math.Clamp(config.SelectionRefreshMinutes, 1, 1440)),
        () => new HeroSelectionQuery(_users, _library, config).Select(user).Select(item => item.Id).ToArray());

    public List<BaseItem> GetSelection(User user, PluginConfiguration config)
    {
        if (user.HasPermission(PermissionKind.IsDisabled)) return [];
        if (!config.EnableSelectionCache)
        {
            _store.Clear();
            return new HeroSelectionQuery(_users, _library, config).Select(user);
        }

        var ids = GetIds(user, config);
        // An empty ItemIds query can mean "all items" in Jellyfin.
        if (ids.Length == 0) return [];

        // Always recheck permissions and watched status with the current user.
        // The controller then adds fresh per-user progress and playback actions.
        var visible = _library.GetItemList(new InternalItemsQuery(user)
        {
            ItemIds = ids,
            IncludeItemTypes = [BaseItemKind.Series, BaseItemKind.Movie],
            IsPlayed = config.ShowPlayed ? null : false,
        }).Where(item => item.IsVisible(user)).ToDictionary(item => item.Id);
        return ids.Where(visible.ContainsKey).Select(id => visible[id]).ToList();
    }

    public void WarmSelections(PluginConfiguration config, CancellationToken cancellationToken)
    {
        if (!config.EnableSelectionCache)
        {
            _store.Clear();
            return;
        }

#if NET10_0_OR_GREATER
        var allUsers = _users.GetUsers();
#else
        var allUsers = _users.Users;
#endif
        var users = allUsers.Where(user => !user.HasPermission(PermissionKind.IsDisabled)).ToArray();
        _store.RetainUsers(users.Select(user => user.Id).ToHashSet());
        foreach (var user in users)
        {
            cancellationToken.ThrowIfCancellationRequested();
            try
            {
                GetIds(user, config);
            }
            catch (Exception exception)
            {
                _logger.LogWarning(exception, "Unable to refresh Editor's Choice selection for user {UserId}.", user.Id);
            }
        }
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Do not delay Jellyfin startup while warming selections.
        await Task.Yield();
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(5));
        do
        {
            try
            {
                if (Plugin.Instance is { } plugin)
                {
                    // Avoid a configuration change modifying a refresh in progress.
                    var config = JsonSerializer.Deserialize<PluginConfiguration>(JsonSerializer.Serialize(plugin.Configuration))!;
                    if (string.IsNullOrEmpty(config.Mode)) config.Mode = config.ShowRandomMedia ? "RANDOM" : "FAVOURITES";
                    WarmSelections(config, stoppingToken);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception exception)
            {
                _logger.LogWarning(exception, "Editor’s Choice selection warming will retry.");
            }
        } while (await timer.WaitForNextTickAsync(stoppingToken).ConfigureAwait(false));
    }
}
