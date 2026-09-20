# Presentation browser checks

These checks use Chromium with the actual Splide carousel and mocked Jellyfin
responses. They cover all transitions with Hero and legacy layout settings, cleanup during navigation,
pixel/percentage/fullscreen heights, mobile overrides, header resizing, reduced
motion, dimming, video suppression, font choices, settings validation/save/reload, early skeleton height, stable
hydration, empty results, and error recovery.

From the repository root, install the test dependencies outside the source tree:

```sh
npm install --prefix /tmp/editors-choice-browser-tests playwright@1.63.0 @splidejs/splide@4.1.4 jquery@4.0.0
/tmp/editors-choice-browser-tests/node_modules/.bin/playwright install chromium
NODE_PATH=/tmp/editors-choice-browser-tests/node_modules node tests/browser/presentation.cjs
```

On a minimal Linux host, install the browser's OS libraries using Playwright's
documented setup. `BROWSER_EXECUTABLE` can point to an existing Chromium binary.
Set `BANNER_SCREENSHOT_DIR` to save the Hero banner and settings preview images.
