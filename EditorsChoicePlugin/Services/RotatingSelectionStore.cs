using System.Collections.Concurrent;

namespace EditorsChoicePlugin.Services;

// Only IDs are retained, never user data, API responses, or playback progress.
public sealed class RotatingSelectionStore
{
    private sealed class Slot
    {
        public readonly object Gate = new();
        public Guid[]? Ids;
        public string Key = "";
        public DateTimeOffset ExpiresAt;
    }

    private readonly ConcurrentDictionary<Guid, Slot> _slots = new();
    private readonly TimeProvider _clock;

    public RotatingSelectionStore(TimeProvider? clock = null) => _clock = clock ?? TimeProvider.System;

    public Guid[] Get(Guid userId, string configurationKey, TimeSpan lifetime, Func<Guid[]> select)
    {
        var slot = _slots.GetOrAdd(userId, _ => new Slot());
        lock (slot.Gate)
        {
            if (slot.Ids is null || slot.Key != configurationKey || slot.ExpiresAt <= _clock.GetUtcNow())
            {
                // Publish only successful refreshes. Each user has their own lock.
                var ids = select().Distinct().ToArray();
                slot.Ids = ids;
                slot.Key = configurationKey;
                slot.ExpiresAt = _clock.GetUtcNow() + lifetime;
            }

            return slot.Ids.ToArray();
        }
    }

    public void RetainUsers(HashSet<Guid> userIds)
    {
        foreach (var id in _slots.Keys)
        {
            if (!userIds.Contains(id)) _slots.TryRemove(id, out _);
        }
    }

    public void Clear() => _slots.Clear();
}
