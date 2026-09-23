namespace EditorsChoicePlugin.Services;

// Titles each source has already shown one user in the current cycle. Sources
// skip these until their pool runs out, then start a new cycle.
// A selection's titles count as shown only once it is served: background
// refreshes the user never sees do not use up the rotation.
// Not thread-safe: RotatingSelectionStore only uses it under the user's lock.
public sealed class SelectionHistory
{
    // Bounds memory and the size of exclusion queries on very large libraries.
    public const int MaximumPerSource = 500;

    private sealed class Entries
    {
        public readonly Queue<Guid> Order = new();
        public readonly HashSet<Guid> Ids = [];
    }

    private readonly Dictionary<string, Entries> _sources = new(StringComparer.Ordinal);
    private readonly List<(string Source, Guid Id)> _pending = [];

    public IReadOnlySet<Guid> Seen(string source) =>
        _sources.TryGetValue(source, out var entries) ? entries.Ids : new HashSet<Guid>();

    // Starts a new selection, discarding titles from one that was never served.
    public void BeginSelection() => _pending.Clear();

    public void Record(string source, IEnumerable<Guid> ids) =>
        _pending.AddRange(ids.Select(id => (source, id)));

    public void CommitPending()
    {
        foreach (var (source, id) in _pending)
        {
            if (!_sources.TryGetValue(source, out var entries))
            {
                entries = new Entries();
                _sources[source] = entries;
            }

            if (!entries.Ids.Add(id)) continue;
            entries.Order.Enqueue(id);
            if (entries.Order.Count > MaximumPerSource) entries.Ids.Remove(entries.Order.Dequeue());
        }

        _pending.Clear();
    }

    public void Reset(string source) => _sources.Remove(source);

    public void Clear()
    {
        _sources.Clear();
        _pending.Clear();
    }
}
