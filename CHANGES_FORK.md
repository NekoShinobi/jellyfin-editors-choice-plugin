# Changes in this fork

The screenshot at the top of [README.md](README.md) shows the fork's Hero design.

## Hero banner and settings

- Hero is now the only banner layout. Removed the layout switch and Banner Heading.
  Legacy configuration fields remain readable so upgrades preserve other settings.
- Added an early loading skeleton using presentation settings embedded in the
  initial script. It reserves the configured height before content and carousel
  dependencies finish loading. Empty and failed responses keep the reserved space;
  failures offer Retry. Initial insertion depends on the home page and plugin
  script being available.
- Added separate font dropdowns for titles, metadata, descriptions, and buttons.
  Options use device fonts with fallbacks; image logos are unaffected.
- Added Slide, Fade, Fade + Zoom, Wipe, and Instant transitions, with a separate
  duration control and settings preview.
- Added exact pixel heights, viewport percentages, full-screen heights, an option
  to subtract the Jellyfin header, and independent mobile heights.
- Added background dimming (off by default), background motion (on by default),
  and theme videos (on by default). Disabled videos are not loaded.
- Respect reduced-motion preferences for transitions, artwork, videos, and autoplay.

## Content and playback

- Render safe Markdown descriptions from Jellyfin overviews.
- Show ratings, year, movie runtime, and series episode counts.
- Use the active user's progress for movie resume and series continuation.
- Support library and rating filters for featured content.

## Server selection cache

Caching is enabled by default, warming selections per user on the server and
refreshing them every 30 minutes by default (configurable from
1 to 1440 minutes). It stores item IDs, rechecks access when serving results, and
keeps playback progress fresh. Turning caching off restores selection on
each request. Refreshed selections appear on subsequent banner loads; they do not
replace slides in a page already open. Refreshes run within approximately five
seconds of the configured interval, subject to server load. A selection may include
some of the same titles after a refresh, especially with small eligible libraries.

## Compatibility and packaging

- Support Jellyfin 10.11 / .NET 9 and Jellyfin 12 / .NET 10 builds.
- Align packaged plugin metadata with the runtime plugin name, helping Jellyfin
  identify prior versions during upgrades. This does not force-delete folders or
  override filesystem permissions.
- Preserve automatic frontend injection and manual injection options.

## Verification

Server regression tests cover selection arrays, defaults, package identity, safe
presentation bootstrap, cache registration, user isolation, and timed selection
refresh. Browser checks cover cache settings, transitions,
legacy settings migration to Hero, responsive sizing, reduced motion, early
loading, font persistence, empty states, retries, and teardown.
