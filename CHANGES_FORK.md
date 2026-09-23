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
- Added Slide, Fade, Fade + Zoom, Wipe, Parallax slide, Dip to black, Staggered,
  Iris, and Instant transitions, with a separate duration control and settings preview.
- Added exact pixel heights, viewport percentages, full-screen heights, an option
  to subtract the Jellyfin header, and independent mobile heights.
- Added background dimming (off by default), background motion (on by default),
  and theme videos (on by default). Disabled videos are not loaded.
- Respect reduced-motion preferences for transitions, artwork, videos, and autoplay.
- Reorganized settings into Content, Opening slide, Layout, Style, Motion, and
  Advanced tabs with a sticky save bar, unsaved-change markers, Discard, and a
  live desktop/mobile preview that uses titles from the library.
- Added hero customization: alignment (desktop and phone), vertical position,
  text width, poster placement and size, inset frame, backdrop image type, focus
  point, blur/brightness/saturation, scrim style/color/strength, accent color,
  title display and size, text colors and shadow, taglines, ordered metadata
  fields (adding critic rating, genres, and end time), description lines and
  size, details/trailer/resume-progress toggles, button shape/style/size,
  artwork zoom intensity, theme video delay, pause on hover, slide indicator
  style and position, arrow style, and custom CSS. Defaults match the previous
  layout, and every value is validated on the server before reaching browsers.
- Added an animation curve for slide transitions, the text reveal, and the
  artwork zoom: ten templates or a custom cubic Bézier curve, with a draggable
  and keyboard-accessible editor and a playback demo.

## Content and playback

- Render safe Markdown descriptions from Jellyfin overviews.
- Show ratings, year, movie runtime, and series episode counts.
- Use the active user's progress for movie resume and series continuation.
- Support library and rating filters for featured content.
- Added Mixed mode, combining favourites, new, collection, and random titles with
  per-source counts, alternate/grouped/shuffled order, no duplicates across
  sources, and optional random filling.
- Selections rotate through every eligible title per viewer and source before
  repeating; the end of a rotation shows only the remaining titles. Only served
  selections count, so background cache refreshes don't use up unseen titles.
- New mode finds recent series with one episode query instead of two queries per
  series in the library.
- The viewer is identified by the user ID claim rather than the user name.
- Malformed editor or collection IDs, missing editor accounts, and orphaned
  episodes no longer throw; the selection falls back as it would for an empty source.

## Loading, accessibility, and remote control

- Blurred blurhash previews appear while backdrops download and replace the
  loading skeleton when available. Artwork on both sides of the current slide is preloaded.
- All banner text is translated into the nine supported languages, following
  Jellyfin's display language; runtimes use the locale's unit format.
- The carousel and its slides are labelled by position and title, and
  off-screen slides and clones are inert.
- Left/Right move between a slide's buttons and then change slides, for keyboards
  and TV remotes. The banner no longer reacts to arrow keys pressed elsewhere.
  TV layout hides the arrow and indicator buttons from focus.
- The editor's favourite reminder no longer requests the admin-only plugin
  configuration from every user's browser.

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
