// Run with Playwright, jQuery and @splidejs/splide available on NODE_PATH.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const client = fs.readFileSync(path.join(root, 'EditorsChoicePlugin/Api/client.js'), 'utf8');
const splideRoot = path.dirname(require.resolve('@splidejs/splide/package.json'));
const errors = [];

async function home(browser, data = {}, options = {}) {
    const page = await browser.newPage({
        viewport: { width: options.mobile ? 390 : 1440, height: 900 },
        reducedMotion: options.reduced ? 'reduce' : 'no-preference',
    });
    page.on('pageerror', error => errors.push(error.message));
    let libraryAttempts = 0;
    await page.route('**/*', route => {
        if (route.request().url().endsWith('/splide.min.js')) {
            if (options.failLibrary && libraryAttempts++ === 0) return route.abort();
            return route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(path.join(splideRoot, 'dist/js/splide.min.js'), 'utf8') });
        }
        if (route.request().url().endsWith('/splide.min.css')) return route.fulfill({ contentType: 'text/css', body: fs.readFileSync(path.join(splideRoot, 'dist/css/splide.min.css'), 'utf8') });
        return route.fulfill({
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90"><rect width="160" height="90" fill="#557788"/></svg>',
    }); });
    await page.setContent('<!DOCTYPE html><base href="http://banner.test/web/"><style>body{margin:0;padding-top:120px;min-height:2000px}.skinHeader{position:fixed;top:0;height:80px;width:100%}</style><header class="skinHeader"></header><div id="reactRoot"><div id="indexPage"><div id="homeTab" class="is-active"><div class="homeSectionsContainer"><div id="following">Library</div></div></div></div></div>');
    await page.addStyleTag({ path: path.join(splideRoot, 'dist/css/splide.min.css') });
    // Stands in for Branding > Custom CSS, which Jellyfin loads before the banner.
    if (options.themeCss) await page.addStyleTag({ content: options.themeCss });
    await page.addScriptTag({ path: require.resolve('jquery') });
    if (!options.failLibrary) await page.addScriptTag({ path: path.join(splideRoot, 'dist/js/splide.min.js') });
    await page.evaluate(({ data, options }) => {
        const response = {
            favourites: [1, 2, 3].map(id => ({ id: String(id), name: 'Feature ' + id,
                item_type: 'Movie', overview_html: '<p>A short overview.</p>', theme_video_id: 'video-' + id })),
            autoplay: false, showNavigationArrows: true, autoplayInterval: 60000,
            showPlayButton: true, bannerHeight: 360, ...data,
        };
        window.ApiClient = {
            fetch: async () => {
                if (options.defer && !window.responseReleased) await new Promise(resolve => { window.releaseResponse = () => { window.responseReleased = true; resolve(); }; });
                if (options.fail && !window.retried) { window.retried = true; throw new Error("Offline"); }
                return { json: async () => response };
            },
            getUrl: url => 'http://banner.test/' + url, serverId: () => 'test', accessToken: () => 'test',
        };
        const Original = window.Splide;
        if (Original) window.Splide = function (...args) { window.testSlider = new Original(...args); return window.testSlider; };
    }, { data, options });
    await page.addScriptTag({ content: "const editorsChoiceBootstrap = " + JSON.stringify({ bannerHeight: 360, ...data }) + ";\n" + client });
    if (options.defer || options.fail || options.failLibrary || data.favourites?.length === 0) return page;
    await page.waitForSelector('.editorsChoiceAdded .splide.is-initialized');
    await page.waitForFunction(() => !document.querySelector('.editorsChoiceIsLoading'));
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.editorsChoiceSkeleton')).visibility === 'hidden');
    {
        await page.waitForFunction(() => {
            const slide = document.querySelector('.splide__slide.is-active:not(.splide__slide--clone)');
            return slide.classList.contains('editorsChoiceSlideReady')
                && getComputedStyle(slide.querySelector('.editorsChoiceItemTitle')).opacity === '1'
                && getComputedStyle(slide.querySelector('.editorsChoiceBackdrop')).opacity === '1';
        });
    }
    return page;
}

async function expectHeight(page, expected) {
    await page.waitForFunction(expected => Math.abs(document.querySelector('.splide__track').getBoundingClientRect().height - expected) < 2, expected, { timeout: 5000 }).catch(async error => {
        console.error(await page.evaluate(() => ({
            height: document.querySelector('.splide__track').getBoundingClientRect().height,
            root: document.querySelector('.splide').outerHTML.slice(0, 1000),
            options: testSlider.options,
            configuredHeight: testSlider.options.height,
            boxes: ['.splide__track', '.splide__list', '.splide__slide', '.editorsChoiceContent', '.editorsChoiceItemPoster'].map(s => {
                const el = document.querySelector(s);
                return [s, el?.getAttribute('style'), el && getComputedStyle(el).height, el && getComputedStyle(el).minHeight];
            }),
        })));
        throw error;
    });
}

(async () => {
    const browser = await chromium.launch({
        headless: true, args: ['--no-sandbox'],
        ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}),
    });
    try {
        for (const hero of [false, true]) {
            for (const effect of ['loop', 'fade', 'zoom', 'wipe', 'instant']) {
                const page = await home(browser, { useHeroLayout: hero, transitionEffect: effect,
                    transitionDurationMs: 160, enableThemeVideos: false, enableBackgroundMotion: false });
                await expectHeight(page, 480);
                assert.equal(await page.locator('video').count(), 0);
                assert.equal(await page.locator('.editorsChoiceNoBackgroundMotion').count(), 1);
                for (const next of [1, 2, 0]) {
                    await page.evaluate(() => testSlider.go('>'));
                    await page.waitForFunction(next => testSlider.index === next && testSlider.state.is(3), next);
                    await page.waitForTimeout(190);
                    assert.equal(await page.locator('.splide__slide.is-active:not(.splide__slide--clone)').count(), 1);
                }
                assert.equal(await page.locator('.editorsChoiceTransitionOutgoing').count(), 0);
                await page.evaluate(() => {
                    testSlider.go('>');
                    document.querySelector('.editorsChoiceContainer').remove();
                });
                await page.waitForFunction(() => bannerSliders.size === 0);
                await page.close();
                console.log('PASS transition and teardown:', hero ? 'hero' : 'legacy normal → hero', effect);
            }
        }
        for (const hero of [false, true]) {
            const page = await home(browser, {
                useHeroLayout: hero, enableThemeVideos: false, bannerHeightMode: 'pixels', bannerCustomHeight: 720,
                mobileBannerHeightMode: 'pixels', mobileBannerCustomHeight: 320,
                enableBackgroundDimming: true, backgroundDimmingPercent: 45,
            });
            await expectHeight(page, 720);
            if (hero && process.env.BANNER_SCREENSHOT_DIR) {
                fs.mkdirSync(process.env.BANNER_SCREENSHOT_DIR, { recursive: true });
                await page.locator('.splide').screenshot({ path: path.join(process.env.BANNER_SCREENSHOT_DIR, 'hero-custom-height.png') });
            }
            const dim = await page.locator('.splide__slide.is-active .editorsChoiceDimming').first().evaluate(el => getComputedStyle(el).backgroundColor);
            assert.match(dim, /0\.45/);
            await page.setViewportSize({ width: 390, height: 844 });
            await expectHeight(page, 320);
            await page.setViewportSize({ width: 1440, height: 900 });
            await expectHeight(page, 720);
            await page.close();
        }
        console.log('PASS exact custom heights, mobile overrides, dimming');

        const fittedItem = {
            id: 'poster-fit', name: 'Poster Fit', item_type: 'Movie', hasPoster: true,
            has_trailer: true, overview_html: '<p>One line of text followed by enough words to create several more lines and verify that every visible description line remains complete at constrained banner heights.</p>',
        };
        const fittedData = {
            enableThemeVideos: false, reduceImageSizes: true,
            bannerHeightMode: 'pixels', bannerCustomHeight: 720,
            favourites: [fittedItem],
        };
        const fitted = await home(browser, fittedData);
        await fitted.setViewportSize({ width: 900, height: 900 });
        await expectHeight(fitted, 720);
        const fittedSlide = fitted.locator('.splide__slide:not(.splide__slide--clone)');
        const poster = await fittedSlide.locator('.editorsChoicePosterButton').evaluate(el => {
            const box = el.getBoundingClientRect();
            const content = el.closest('.editorsChoiceContent').getBoundingClientRect();
            return { width: box.width, height: box.height, top: box.top, bottom: box.bottom,
                contentTop: content.top, contentBottom: content.bottom };
        });
        assert.ok(Math.abs(poster.width / poster.height - 2 / 3) < 0.01);
        assert.ok(poster.top >= poster.contentTop && poster.bottom <= poster.contentBottom);
        assert.match(await fittedSlide.locator('.editorsChoiceItemPoster').getAttribute('src'), /height=600/);
        await fitted.close();
        const compact = await home(browser, { ...fittedData, bannerCustomHeight: 420 });
        await compact.setViewportSize({ width: 900, height: 900 });
        await expectHeight(compact, 420);
        const overview = await compact.locator('.splide__slide:not(.splide__slide--clone) .editorsChoiceItemOverview').evaluate(el => {
            const style = getComputedStyle(el);
            return { height: el.getBoundingClientRect().height, lineHeight: parseFloat(style.lineHeight), display: style.display };
        });
        assert.notEqual(overview.display, 'none');
        assert.ok(Math.abs(overview.height / overview.lineHeight - Math.round(overview.height / overview.lineHeight)) < 0.02);
        await compact.close();
        const short = await home(browser, { ...fittedData, bannerCustomHeight: 320 });
        await short.setViewportSize({ width: 900, height: 900 });
        await expectHeight(short, 320);
        assert.equal(await short.locator('.splide__slide:not(.splide__slide--clone) .editorsChoiceItemOverview').evaluate(el => getComputedStyle(el).display), 'none');
        await short.close();
        console.log('PASS custom-height poster scaling and complete description lines');

        const wipe = await home(browser, {
            transitionEffect: 'wipe', transitionDurationMs: 1000,
            enableThemeVideos: false, enableBackgroundDimming: true, backgroundDimmingPercent: 50,
        });
        async function inspectWipe(command, expectedStart) {
            await wipe.evaluate(command => testSlider.go(command), command);
            await wipe.waitForSelector('.editorsChoiceTransitionOutgoing');
            const state = await wipe.locator('.splide__slide:not(.splide__slide--clone)').evaluateAll(slides => {
                const slide = slides.find(candidate => candidate.style.zIndex === '2');
                return ({
                start: slide.getAnimations().map(animation => animation.effect.getKeyframes()[0]?.clipPath)
                    .find(value => value?.startsWith('inset')),
                dimming: getComputedStyle(slide.querySelector('.editorsChoiceDimming')).backgroundColor,
                dimmingZIndex: getComputedStyle(slide.querySelector('.editorsChoiceDimming')).zIndex,
                contentZIndex: getComputedStyle(slide.querySelector('.editorsChoiceContent')).zIndex,
                });
            });
            assert.equal(state.start, expectedStart);
            assert.match(state.dimming, /0\.5/);
            assert.equal(state.dimmingZIndex, '2');
            assert.equal(state.contentZIndex, '3');
            await wipe.waitForFunction(() => testSlider.state.is(3));
        }
        await inspectWipe('>', 'inset(0px 0px 0px 100%)');
        await inspectWipe('<', 'inset(0px 100% 0px 0px)');
        await wipe.evaluate(() => testSlider.go('<'));
        await wipe.waitForSelector('.editorsChoiceTransitionOutgoing');
        assert.equal(await wipe.locator('.splide__slide:not(.splide__slide--clone)').evaluateAll(slides => {
            const slide = slides.find(candidate => candidate.style.zIndex === '2');
            return slide.getAnimations().map(animation => animation.effect.getKeyframes()[0]?.clipPath)
                .find(value => value?.startsWith('inset'));
        }), 'inset(0px 100% 0px 0px)');
        await wipe.close();
        console.log('PASS directional wipe, wraparound, and dimming layer');

        for (const hero of [false, true]) {
            for (const subtract of [false, true]) {
                const page = await home(browser, { useHeroLayout: hero, enableThemeVideos: false,
                    bannerHeightMode: 'fullscreen', bannerSubtractHeader: subtract });
                await expectHeight(page, subtract ? 820 : 900);
                await page.waitForFunction(top => Math.abs(document.querySelector('.splide').getBoundingClientRect().top - top) < 2, subtract ? 80 : 0);
                await page.evaluate(() => { document.querySelector('.skinHeader').style.height = '100px'; });
                await expectHeight(page, subtract ? 800 : 900);
                await page.setViewportSize({ width: 390, height: 700 });
                await expectHeight(page, subtract ? 600 : 700);
                await page.evaluate(() => { window.scrollTo(0, 150); window.dispatchEvent(new Event('resize')); });
                await page.waitForFunction(top => Math.abs(document.querySelector('.splide').getBoundingClientRect().top + window.scrollY - top) < 2, subtract ? 100 : 0);
                await page.close();
            }
        }
        console.log('PASS fullscreen alignment, header resize, mobile resize, scrolling');

        const percent = await home(browser, { bannerHeightMode: 'viewport', bannerViewportHeight: 75 });
        await expectHeight(percent, 675);
        await percent.setViewportSize({ width: 390, height: 800 });
        await expectHeight(percent, 600);
        assert.equal(await percent.locator('.editorsChoiceNoBackgroundMotion').count(), 0);
        assert.equal(await percent.locator('.editorsChoiceContainer').evaluate(el => el.style.getPropertyValue('--ec-dimming')), '0');
        await percent.close();
        const reduced = await home(browser, { useHeroLayout: true, transitionEffect: 'zoom', autoplay: true }, { reduced: true });
        assert.equal(await reduced.evaluate(() => testSlider.options.speed), 0);
        assert.equal(await reduced.evaluate(() => testSlider.Components.Autoplay.isPaused()), true);
        assert.equal(await reduced.locator('video[src]').count(), 0);
        await reduced.close();
        const liveMotion = await home(browser, { transitionEffect: 'wipe', autoplay: true });
        await liveMotion.emulateMedia({ reducedMotion: 'reduce' });
        await liveMotion.waitForFunction(() => testSlider.options.speed === 0 && testSlider.Components.Autoplay.isPaused());
        await liveMotion.close();
        console.log('PASS percentage height, defaults, and reduced motion');

        const messageOnly = await home(browser, {
            openingSlide: {
                type: 'message', continueToSelection: false, eyebrow: 'Welcome', title: 'Welcome to Harbor Media',
                bodyHtml: '<p>Find something great or read the guide.</p>', backgroundType: 'gradient', alignment: 'right',
                actions: [
                    { label: 'Browse library', url: '/web/#/home.html', primary: true,
                        backgroundColor: '#123456', textColor: '#fedcba', opacity: 60 },
                    { label: 'Getting started', url: 'https://example.com/help', primary: false },
                ],
            },
        });
        assert.equal(await messageOnly.locator('.splide__slide:not(.splide__slide--clone)').count(), 1);
        assert.equal(await messageOnly.locator('.splide__slide:not(.splide__slide--clone) .editorsChoiceItemTitle').textContent(), 'Welcome to Harbor Media');
        const originalMessage = messageOnly.locator('.splide__slide:not(.splide__slide--clone)');
        assert.equal(await originalMessage.evaluate(el => el.classList.contains('editorsChoiceOpeningSlide--gradient')), true);
        assert.equal(await originalMessage.evaluate(el => el.classList.contains('editorsChoiceOpeningSlide--right')), true);
        assert.equal(await originalMessage.evaluate(el => el.classList.contains('editorsChoiceSlideReady')), true);
        const customOpeningButton = originalMessage.getByRole('link', { name: /Browse library/ });
        assert.equal(await customOpeningButton.getAttribute('href'), '/web/#/home.html');
        assert.equal(await customOpeningButton.evaluate(el => el.classList.contains('editorsChoiceCustomButton')), true);
        assert.equal(await customOpeningButton.evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(18, 52, 86)');
        assert.equal(await customOpeningButton.evaluate(el => getComputedStyle(el).color), 'rgb(254, 220, 186)');
        assert.equal(await customOpeningButton.evaluate(el => getComputedStyle(el).opacity), '0.6');
        assert.equal(await originalMessage.getByRole('link', { name: /Getting started/ }).getAttribute('target'), '_blank');
        await messageOnly.close();

        const messageAndSelection = await home(browser, {
            openingSlide: {
                type: 'message', continueToSelection: true, title: 'Server notice',
                bodyHtml: '<p>Maintenance is complete.</p>', backgroundType: 'url',
                backgroundUrl: 'http://banner.test/custom.jpg', actions: [],
            },
        });
        assert.equal(await messageAndSelection.locator('.splide__slide:not(.splide__slide--clone)').count(), 4);
        assert.equal(await messageAndSelection.locator('.splide__slide:not(.splide__slide--clone)').first().locator('.editorsChoiceItemTitle').textContent(), 'Server notice');
        await messageAndSelection.close();

        const pinnedMedia = await home(browser, {
            useCustomPlayButtonColors: true,
            playButtonBackgroundColor: '#345678',
            playButtonTextColor: '#ffffff',
            openingSlide: {
                type: 'media', continueToSelection: true,
                item: { id: '2', name: 'Feature 2', item_type: 'Movie', overview_html: '<p>Pinned.</p>' },
            },
        });
        assert.equal(await pinnedMedia.locator('.splide__slide:not(.splide__slide--clone)').count(), 3);
        assert.equal(await pinnedMedia.locator('.splide__slide:not(.splide__slide--clone)').first().locator('.editorsChoiceItemTitle').textContent(), 'Feature 2');
        assert.equal(await pinnedMedia.locator('.splide__slide:not(.splide__slide--clone) .editorsChoiceItemTitle', { hasText: 'Feature 2' }).count(), 1);
        const customPlayButton = pinnedMedia.locator('.splide__slide:not(.splide__slide--clone)').first().locator('.editorsChoiceItemButton');
        assert.equal(await customPlayButton.evaluate(el => el.classList.contains('editorsChoiceCustomButton')), true);
        assert.equal(await customPlayButton.evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(52, 86, 120)');
        await pinnedMedia.close();
        console.log('PASS custom message, message-only mode, actions, and pinned media ordering');

        const delayed = await home(browser, { bannerHeightMode: 'pixels', bannerCustomHeight: 720, enableThemeVideos: false,
            titleFont: 'georgia', metadataFont: 'mono', descriptionFont: 'verdana', buttonFont: 'arial' }, { defer: true });
        await delayed.waitForFunction(() => window.releaseResponse);
        assert.equal(await delayed.locator('.editorsChoiceContainer').getAttribute('aria-busy'), 'true');
        assert.equal(await delayed.locator('.splide').evaluate(el => el.getBoundingClientRect().height), 720);
        const before = await delayed.locator('#following').evaluate(el => el.getBoundingClientRect().top);
        await delayed.evaluate(() => releaseResponse());
        await delayed.waitForFunction(() => !document.querySelector('.editorsChoiceIsLoading'));
        await expectHeight(delayed, 720);
        assert.equal(await delayed.locator('#following').evaluate(el => el.getBoundingClientRect().top), before);
        assert.match(await delayed.locator('.editorsChoiceItemTitle').first().evaluate(el => getComputedStyle(el).fontFamily), /Georgia/);
        assert.equal(await delayed.locator('.editorsChoiceContainer').getAttribute('aria-busy'), 'false');
        await delayed.close();
        const empty = await home(browser, { favourites: [], bannerHeightMode: 'pixels', bannerCustomHeight: 600 });
        await empty.waitForSelector('.editorsChoiceMessageText');
        assert.equal(await empty.locator('.splide').evaluate(el => el.getBoundingClientRect().height), 600);
        assert.equal(await empty.locator('.editorsChoiceContainer').getAttribute('aria-busy'), 'false');
        await empty.close();
        const failed = await home(browser, { enableThemeVideos: false }, { fail: true });
        await failed.waitForSelector('.editorsChoiceMessageText');
        assert.equal(await failed.locator('.splide').evaluate(el => el.getBoundingClientRect().height), 480);
        await failed.getByRole('button', { name: 'Retry' }).click();
        await failed.waitForSelector('.splide.is-initialized');
        await failed.waitForFunction(() => !document.querySelector('.editorsChoiceIsLoading'));
        await failed.close();
        const dependency = await home(browser, { enableThemeVideos: false }, { failLibrary: true });
        await dependency.waitForSelector('.editorsChoiceMessageText');
        await dependency.getByRole('button', { name: 'Retry' }).click();
        await dependency.waitForSelector('.splide.is-initialized');
        await dependency.waitForFunction(() => !document.querySelector('.editorsChoiceIsLoading'));
        await dependency.close();
        console.log('PASS early skeleton, stable hydration, fonts, empty state, API and dependency retry');

        const appearanceItem = {
            id: 'look', name: 'Look Test', item_type: 'Movie', year: 2024, hasPoster: true, has_trailer: true,
            genres: ['Drama', 'Mystery', 'Thriller'], tagline: 'Every lighthouse keeps a secret.',
            overview_html: '<p>Overview text.</p>',
        };
        const defaults = await home(browser, { enableThemeVideos: false });
        assert.deepEqual(await defaults.locator('.editorsChoiceContainer').evaluate(el =>
            el.getAttributeNames().filter(name => name.startsWith('data-ec-'))), []);
        assert.equal(await defaults.locator('.splide__slide.is-active:not(.splide__slide--clone) .editorsChoiceInfoButton').count(), 1);
        assert.equal(await defaults.evaluate(() => testSlider.options.pagination), true);
        await defaults.close();
        const styled = await home(browser, {
            enableThemeVideos: false, favourites: [appearanceItem, { ...appearanceItem, id: 'look-2' }],
            heroContentAlignment: 'center', heroScrimStyle: 'bottom', heroIndicatorStyle: 'counter',
            heroIndicatorPosition: 'left', heroTitleDisplay: 'title', heroMetadataFields: ['year', 'genres', 'type', 'bogus'],
            heroMaxGenres: 2, heroMetadataSeparator: 'dot', heroButtonVariant: 'glass', showInfoButton: false,
            showTrailerButton: true, showTagline: true, heroPosterMode: 'right', heroOverviewMaxLines: 1,
            heroBackdropPosition: 'custom', heroBackdropFocusX: 30, heroBackdropFocusY: 70, heroBackdropBlur: 4,
            heroCustomCss: '.editorsChoiceItemTitle { letter-spacing: 3px; }',
        });
        const styledSlide = styled.locator('.splide__slide.is-active:not(.splide__slide--clone)');
        const container = styled.locator('.editorsChoiceContainer');
        assert.equal(await container.getAttribute('data-ec-align'), 'center');
        assert.equal(await container.getAttribute('data-ec-scrim'), 'bottom');
        assert.equal(await container.getAttribute('data-ec-indicator'), 'counter');
        assert.deepEqual(await styledSlide.locator('.editorsChoiceMetadataItem').allTextContents(), ['2024', 'Drama, Mystery', 'Movie']);
        assert.equal(await styledSlide.locator('.editorsChoiceMetadataItem').nth(1).evaluate(el => getComputedStyle(el, '::before').content), '"·"');
        assert.equal(await styledSlide.locator('.editorsChoiceItemTagline').textContent(), 'Every lighthouse keeps a secret.');
        assert.equal(await styledSlide.locator('.editorsChoiceInfoButton').count(), 0);
        assert.equal(await styledSlide.locator('.editorsChoiceTrailerButton').count(), 1);
        assert.equal(await styledSlide.locator('.editorsChoiceInfo').evaluate(el => getComputedStyle(el).textAlign), 'center');
        assert.equal(await styledSlide.locator('.editorsChoicePosterButton').evaluate(el => getComputedStyle(el).order), '2');
        assert.equal(await styledSlide.locator('.editorsChoiceItemTitle').evaluate(el => getComputedStyle(el).letterSpacing), '3px');
        assert.equal(await styledSlide.locator('.editorsChoiceItemOverview').evaluate(el => getComputedStyle(el).webkitLineClamp), '1');
        assert.match(await styledSlide.locator('.editorsChoiceBackdrop').evaluate(el => getComputedStyle(el, '::after').backgroundImage), /^linear-gradient\(0deg/);
        assert.equal(await styledSlide.locator('.editorsChoiceBackdrop').evaluate(el => el.style.backgroundPosition), '30% 70%');
        assert.match(await styledSlide.locator('.editorsChoiceBackdrop').evaluate(el => getComputedStyle(el).filter), /blur\(4px\)/);
        assert.equal(await styled.evaluate(() => testSlider.options.pagination), false);
        assert.equal(await styled.locator('.editorsChoiceMobilePagination').isVisible(), true);
        assert.equal(await styled.locator('.editorsChoiceMobilePageButton').first().isVisible(), false);
        await styled.close();
        const accented = await home(browser, {
            enableThemeVideos: false, autoplay: true, heroAccentColor: '#ff0000', heroIndicatorStyle: 'progress',
        });
        assert.equal(await accented.locator('.splide__slide.is-active:not(.splide__slide--clone) .editorsChoiceItemButton').first().evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(255, 0, 0)');
        assert.equal(await accented.locator('.editorsChoiceProgress').evaluate(el => getComputedStyle(el).display), 'block');
        await accented.close();

        // Global theme rules like these used to win over the banner's button colors.
        const hostileTheme = `
            .raised { background: rgba(40, 40, 40, 0.8) !important; }
            .raised:hover { background: rgb(1, 2, 3) !important; }
            .emby-button.show-focus:focus { background: rgb(1, 2, 3) !important; }
            .editorsChoicePlayAction .editorsChoiceItemButton,
            .editorsChoicePlayAction .editorsChoiceItemButton:is(:hover, :focus-visible, :active) { color: #fff !important; }`;
        const paint = el => [getComputedStyle(el).backgroundColor, getComputedStyle(el).color];
        const customOverTheme = await home(browser, {
            enableThemeVideos: false, useCustomPlayButtonColors: true,
            playButtonBackgroundColor: '#345678', playButtonTextColor: '#fedcba',
        }, { themeCss: hostileTheme });
        const themedPlay = customOverTheme.locator('.splide__slide.is-active:not(.splide__slide--clone) .editorsChoiceItemButton').first();
        assert.deepEqual(await themedPlay.evaluate(paint), ['rgb(52, 86, 120)', 'rgb(254, 220, 186)']);
        await themedPlay.hover();
        assert.equal(await themedPlay.evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(52, 86, 120)');
        await themedPlay.evaluate(el => el.classList.add('show-focus'));
        await themedPlay.focus();
        assert.equal(await themedPlay.evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(52, 86, 120)');
        await customOverTheme.close();

        const themeTokens = await home(browser, { enableThemeVideos: false, showTrailerButton: false }, { themeCss: hostileTheme + `
            .editorsChoiceContainer { --ec-primary-bg: #112233; --ec-primary-fg: #ddeeff;
                --ec-secondary-bg: #445566; --ec-button-radius: 3px; }` });
        const tokenSlide = themeTokens.locator('.splide__slide.is-active:not(.splide__slide--clone)');
        assert.deepEqual(await tokenSlide.locator('.editorsChoiceItemButton').evaluate(paint), ['rgb(17, 34, 51)', 'rgb(221, 238, 255)']);
        assert.deepEqual(await tokenSlide.locator('.editorsChoiceInfoButton').evaluate(paint), ['rgb(68, 85, 102)', 'rgb(255, 255, 255)']);
        assert.equal(await tokenSlide.locator('.editorsChoiceInfoButton').evaluate(el => getComputedStyle(el).borderRadius), '3px');
        await themeTokens.close();

        const settingOverToken = await home(browser, { enableThemeVideos: false, heroAccentColor: '#ff0000', heroButtonShape: 'pill' },
            { themeCss: '.editorsChoiceContainer { --ec-primary-bg: #112233; --ec-button-radius: 3px; }' });
        const settingPlay = settingOverToken.locator('.splide__slide.is-active:not(.splide__slide--clone) .editorsChoiceItemButton').first();
        assert.equal(await settingPlay.evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(255, 0, 0)');
        assert.equal(await settingPlay.evaluate(el => getComputedStyle(el).borderRadius), '999px');
        await settingOverToken.close();

        const outlineOverToken = await home(browser, { enableThemeVideos: false, heroButtonVariant: 'outline' },
            { themeCss: '.editorsChoiceContainer { --ec-primary-bg: #112233; }' });
        const outlinePlay = outlineOverToken.locator('.splide__slide.is-active:not(.splide__slide--clone) .editorsChoiceItemButton').first();
        assert.equal(await outlinePlay.evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)');
        await outlineOverToken.close();

        const untouched = await home(browser, { enableThemeVideos: false }, { themeCss: hostileTheme });
        const nativePlay = untouched.locator('.splide__slide.is-active:not(.splide__slide--clone) .editorsChoiceItemButton').first();
        assert.equal(await nativePlay.evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(40, 40, 40, 0.8)');
        assert.equal(await untouched.locator('.editorsChoiceContainer').evaluate(el => el.hasAttribute('data-ec-primary')), false);
        await untouched.close();
        console.log('PASS theming tokens outrank global theme rules and settings outrank tokens');
        const eased = await home(browser, { enableThemeVideos: false, transitionEffect: 'zoom', transitionEasing: 'cubic-bezier(0.36, 0, 0.66, -0.56)' });
        assert.equal(await eased.evaluate(() => testSlider.options.easing), 'cubic-bezier(0.36, 0, 0.66, -0.56)');
        assert.equal(await eased.locator('.editorsChoiceContainer').evaluate(el => el.style.getPropertyValue('--ec-easing')), 'cubic-bezier(0.36, 0, 0.66, -0.56)');
        await eased.evaluate(() => testSlider.go('>'));
        await eased.waitForFunction(() => document.querySelector('.editorsChoiceTransitionOutgoing'));
        assert.equal(await eased.evaluate(() => document.querySelector('.splide__slide[style*="z-index: 2"]').getAnimations()[0].effect.getTiming().easing), 'cubic-bezier(0.36, 0, 0.66, -0.56)');
        await eased.close();
        const unsafeEasing = await home(browser, { enableThemeVideos: false, transitionEasing: 'cubic-bezier(2, 0, 0.5, 1)' });
        assert.equal(await unsafeEasing.evaluate(() => testSlider.options.easing), 'cubic-bezier(0.22, 1, 0.36, 1)');
        assert.equal(await unsafeEasing.locator('.editorsChoiceContainer').evaluate(el => el.style.getPropertyValue('--ec-easing')), '');
        await unsafeEasing.close();
        // Without autoplay the progress bar has nothing to show, so dots remain.
        const stillProgress = await home(browser, { enableThemeVideos: false, heroIndicatorStyle: 'progress' });
        assert.equal(await stillProgress.locator('.editorsChoiceContainer').getAttribute('data-ec-indicator'), null);
        assert.equal(await stillProgress.evaluate(() => testSlider.options.pagination), true);
        await stillProgress.close();
        const phone = await home(browser, {
            enableThemeVideos: false, favourites: [appearanceItem], heroContentAlignment: 'right',
            mobileContentAlignment: 'center', mobileHidePoster: true, mobileHideDescription: true,
        }, { mobile: true });
        assert.equal(await phone.locator('.editorsChoiceContainer').getAttribute('data-ec-align'), 'center');
        assert.equal(await phone.locator('.editorsChoicePosterButton').first().isVisible(), false);
        assert.equal(await phone.locator('.editorsChoiceItemOverview').first().evaluate(el => getComputedStyle(el).display), 'none');
        await phone.setViewportSize({ width: 1440, height: 900 });
        await phone.waitForFunction(() => document.querySelector('.editorsChoiceContainer').dataset.ecAlign === 'right');
        await phone.close();
        console.log('PASS appearance settings: layout, metadata, buttons, indicators, scrim, custom CSS');

        const settings = await browser.newPage({ viewport: { width: 1440, height: 900 } });
        settings.on('pageerror', error => errors.push(error.message));
        // A real origin gives the page session storage, which remembers the open tab.
        await settings.route('http://settings.test/**', route => route.fulfill({ contentType: 'text/html',
            body: fs.readFileSync(path.join(root, 'EditorsChoicePlugin/Configuration/configPage.html'), 'utf8') }));
        await settings.goto('http://settings.test/');
        await settings.evaluate(() => {
            window.config = { Mode: 'RANDOM', BannerHeight: 500, UseHeroLayout: true, EnableAutoplay: true, ShowPlayButton: true,
                AutoplayInterval: 10, RandomMediaCount: 5, MinimumRating: 0, MinimumCriticRating: 0 };
            window.ApiClient = { getPluginConfiguration: async () => window.config,
                getItems: async (_, query) => ({ Items: query?.SearchTerm
                    ? [{ Id: 'featured-id', Name: 'Featured Example', ProductionYear: 2026 }]
                    : [] }), getParentalRatings: async () => [],
                getCurrentUserId: () => 'admin', getUrl: path => '/' + path,
                updatePluginConfiguration: async (_, config) => { window.saved = structuredClone(config); return {}; } };
            window.alerts = [];
            window.Dashboard = { showLoadingMsg() {}, hideLoadingMsg() {}, alert: text => alerts.push(text), processPluginConfigurationUpdateResult() {} };
        });
        await settings.addScriptTag({ content: fs.readFileSync(path.join(root, 'EditorsChoicePlugin/Configuration/configPage.js'), 'utf8').replace('export default function (view)', 'window.initializeConfig = function (view)') });
        await settings.evaluate(() => {
            const view = document.querySelector('.editorsChoiceConfigurationPage');
            initializeConfig(view);
            view.dispatchEvent(new Event('viewshow'));
        });
        const openTab = name => settings.click(`#EditorsChoiceTab-${name}`);
        const status = () => settings.locator('#EditorsChoiceSaveStatus').textContent();
        await settings.waitForFunction(() => document.querySelector('#BannerHeightSelect').value === '500');
        assert.equal(await settings.locator('#EditorsChoiceTab-content').getAttribute('aria-selected'), 'true');
        assert.equal(await settings.locator('#BannerPreviewPanel').isVisible(), false);
        assert.equal(await status(), 'All changes saved');
        assert.equal(await settings.locator('#EditorsChoiceDiscard').isDisabled(), true);
        // Arrow keys move between tabs.
        await settings.focus('#EditorsChoiceTab-content');
        await settings.keyboard.press('ArrowLeft');
        assert.equal(await settings.locator('#EditorsChoiceTab-advanced').getAttribute('aria-selected'), 'true');
        assert.equal(await settings.locator('#EditorsChoicePanel-advanced').isVisible(), true);
        assert.equal(await settings.locator('#EnableSelectionCache').isChecked(), true);
        assert.equal(await settings.locator('#SelectionRefreshMinutes').inputValue(), '30');
        await settings.fill('#SelectionRefreshMinutes', '0');
        assert.equal(await settings.locator('form').evaluate(el => el.checkValidity()), false);
        await settings.fill('#SelectionRefreshMinutes', '1441');
        assert.equal(await settings.locator('form').evaluate(el => el.checkValidity()), false);
        await settings.fill('#SelectionRefreshMinutes', '45');
        assert.equal(await settings.locator('#EditorsChoiceTab-advanced').evaluate(el => el.classList.contains('editorsChoiceTab--dirty')), true);
        assert.equal(await status(), 'Unsaved changes in Advanced');
        await settings.fill('#HeroCustomCss', '.editorsChoiceItemTitle { color: red;');
        assert.equal(await settings.locator('form').evaluate(el => el.checkValidity()), false);
        await settings.fill('#HeroCustomCss', '.editorsChoiceItemTitle { color: red; }');
        assert.equal(await settings.locator('form').evaluate(el => el.checkValidity()), true);

        await openTab('layout');
        assert.equal(await settings.locator('#BannerPreviewPanel').isVisible(), true);
        assert.equal(await settings.locator('#EnableBackgroundDimming').isChecked(), false);
        assert.equal(await settings.locator('#HeroScrimStyle').inputValue(), 'auto');
        assert.equal(await settings.locator('#HeroCornerRadius-container').isVisible(), false);
        await settings.selectOption('#HeroFrameStyle', 'inset');
        assert.equal(await settings.locator('#HeroCornerRadius-container').isVisible(), true);
        await settings.fill('#HeroCornerRadius', '24');
        await settings.selectOption('#HeroContentAlignment', 'center');
        await settings.selectOption('#HeroPosterMode', 'right');
        await settings.selectOption('#HeroContentMaxWidth', '60');
        await settings.selectOption('#HeroScrimStyle', 'side');
        await settings.fill('#HeroScrimStrength', '70');
        await settings.selectOption('#HeroBackdropPositionSelect', 'custom');
        await settings.fill('#HeroBackdropFocusX', '30');
        await settings.fill('#HeroBackdropFocusY', '60');
        assert.equal(await settings.locator('#BannerPreview').evaluate(el => el.querySelector('.editorsChoicePreviewBackdrop').style.backgroundPosition), '30% 60%');
        assert.equal(await settings.locator('#BannerPreview .editorsChoicePreviewInfo').evaluate(el => el.style.textAlign), 'center');
        await settings.selectOption('#BannerHeightMode', 'pixels');
        await settings.fill('#BannerCustomHeight', '720');
        await settings.selectOption('#MobileBannerHeightMode', 'fullscreen');
        await settings.check('#EnableBackgroundDimming');
        await settings.fill('#BackgroundDimmingPercent', '40');

        await openTab('motion');
        assert.equal(await settings.locator('#EnableBackgroundMotion').isChecked(), true);
        assert.equal(await settings.locator('#EnableThemeVideos').isChecked(), true);
        await settings.uncheck('#EnableBackgroundMotion');
        await settings.uncheck('#EnableThemeVideos');
        assert.equal(await settings.locator('#ThemeVideoStartDelaySeconds-container').isVisible(), false);
        await settings.selectOption('#TransitionEffectSelect', 'wipe');
        await settings.fill('#TransitionDurationMs', '1200');
        assert.equal(await settings.locator('#TransitionEasing').inputValue(), 'smooth');
        assert.equal(await settings.locator('#TransitionEasingValue').textContent(), 'cubic-bezier(0.22, 1, 0.36, 1)');
        await settings.selectOption('#TransitionEasing', 'overshoot');
        assert.equal(await settings.locator('#TransitionEasingY1').inputValue(), '1.56');
        assert.equal(await settings.locator('#TransitionEasingValue').textContent(), 'cubic-bezier(0.34, 1.56, 0.64, 1)');
        // Editing a template's numbers makes it a custom curve.
        await settings.fill('#TransitionEasingX1', '0.5');
        assert.equal(await settings.locator('#TransitionEasing').inputValue(), 'custom');
        await settings.fill('#TransitionEasingX1', '1.5');
        assert.equal(await settings.locator('form').evaluate(el => el.checkValidity()), false);
        await settings.fill('#TransitionEasingX1', '0.5');
        // Handles move with the keyboard and by dragging.
        await settings.focus('[data-handle="2"]');
        await settings.keyboard.press('ArrowRight');
        await settings.keyboard.press('Shift+ArrowDown');
        assert.equal(await settings.locator('#TransitionEasingX2').inputValue(), '0.65');
        assert.equal(await settings.locator('#TransitionEasingY2').inputValue(), '0.9');
        const handle = await settings.locator('[data-handle="1"]').boundingBox();
        const graph = await settings.locator('#TransitionEasingGraph').boundingBox();
        await settings.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
        await settings.mouse.down();
        await settings.mouse.move(graph.x + graph.width * 0.9, handle.y + handle.height / 2, { steps: 4 });
        await settings.mouse.move(graph.x + graph.width * 2, handle.y + handle.height / 2, { steps: 2 });
        await settings.mouse.up();
        assert.equal(await settings.locator('#TransitionEasingX1').inputValue(), '1');
        assert.equal(await settings.locator('#TransitionEasingY1').inputValue(), '1.56');
        assert.equal(await settings.locator('#TransitionEasingGraph path').getAttribute('d'), 'M0 200 C200 -112 130 20 200 0');
        await settings.click('#TransitionEasingPlay');
        await settings.selectOption('#HeroIndicatorStyle', 'bars');
        await settings.selectOption('#HeroArrowStyle', 'minimal');

        await openTab('opening');
        assert.equal(await settings.locator('#OpeningSlideType').inputValue(), 'none');
        assert.equal(await settings.locator('#OpeningSlideMessage-container').isVisible(), false);
        await settings.selectOption('#OpeningSlideType', 'media');
        await settings.fill('#OpeningSlideMediaSearch', 'Featured');
        await settings.click('#OpeningSlideMediaSearchButton');
        assert.equal(await settings.locator('#OpeningSlideMediaId option').count(), 2);
        await settings.selectOption('#OpeningSlideMediaId', 'featured-id');
        await settings.selectOption('#OpeningSlideType', 'message');
        await settings.selectOption('#OpeningSlidePreset', 'welcome');
        await settings.selectOption('#OpeningSlideBackgroundType', 'url');
        await settings.fill('#OpeningSlideBackgroundUrl', 'https://example.com/welcome.jpg');
        await settings.selectOption('#OpeningSlideAlignment', 'center');
        await settings.check('#OpeningSlideUseCustomButtonStyles');
        await settings.fill('#OpeningSlidePrimaryButtonBackgroundColor', '#123456');
        await settings.fill('#OpeningSlidePrimaryButtonTextColor', '#fedcba');
        await settings.fill('#OpeningSlidePrimaryButtonOpacity', '65');
        await settings.fill('#OpeningSlideSecondaryButtonBackgroundColor', '#234567');
        await settings.fill('#OpeningSlideSecondaryButtonTextColor', '#ffffff');
        await settings.fill('#OpeningSlideSecondaryButtonOpacity', '75');
        await settings.fill('#OpeningSlideSecondaryButtonText', 'Getting started');
        await settings.fill('#OpeningSlideSecondaryButtonUrl', 'https://example.com/help');
        await settings.uncheck('#OpeningSlideContinue');
        assert.equal(await settings.locator('#OpeningSlideMessage-container').isVisible(), true);
        assert.equal(await settings.locator('#OpeningSlideMedia-container').isVisible(), false);
        assert.equal(await settings.locator('#OpeningSlideBackgroundUrl-container').isVisible(), true);
        assert.equal(await settings.locator('#BannerPreview .editorsChoicePreviewTitle').textContent(), 'Welcome to our media library');

        await openTab('style');
        await settings.check('#UseCustomPlayButtonColors');
        await settings.fill('#PlayButtonBackgroundColor', '#345678');
        await settings.fill('#PlayButtonTextColor', '#abcdef');
        await settings.selectOption('#TitleFont', 'georgia');
        await settings.selectOption('#MetadataFont', 'mono');
        assert.equal(await settings.locator('#HeroDescriptionOptions-container').isVisible(), false);
        await settings.check('#ShowDesc');
        await settings.selectOption('#DescriptionFont', 'verdana');
        await settings.selectOption('#ButtonFont', 'arial');
        await settings.selectOption('#HeroTitleDisplay', 'both');
        await settings.selectOption('#HeroTitleSize', 'large');
        await settings.check('#UseHeroAccentColor');
        await settings.fill('#HeroAccentColor', '#ff8800');
        await settings.selectOption('#HeroButtonVariant', 'glass');
        await settings.uncheck('#ShowInfoButton');
        await settings.check('#ShowTagline');
        assert.equal(await settings.locator('#HeroMaxGenres-container').isVisible(), false);
        await settings.check('#HeroMetadataField-genres');
        assert.equal(await settings.locator('#HeroMaxGenres-container').isVisible(), true);
        // Move genres from seventh to fourth place.
        for (let move = 0; move < 3; move++) await settings.click('[data-metadata-field="genres"] [data-move="-1"]');
        await settings.uncheck('#HeroMetadataField-official');
        await settings.selectOption('#HeroMetadataSeparator', 'dot');
        await settings.fill('#HeroOverviewMaxLines', '2');
        assert.equal(await settings.locator('#BannerPreview .editorsChoicePreviewMeta').getAttribute('data-separator'), 'dot');

        await settings.click('#BannerPreviewMobile');
        await settings.click('#PreviewTransition');
        assert.match(await settings.locator('#BannerPreviewSummary').textContent(), /Mobile.*Wipe/);
        assert.equal(await settings.locator('#BannerPreviewStage').evaluate(el => el.classList.contains('editorsChoicePreviewStage--mobile')), true);

        // An invalid field on another tab brings that tab forward when saving.
        await openTab('layout');
        await settings.fill('#BannerCustomHeight', '20');
        await openTab('content');
        assert.equal(await settings.locator('form').evaluate(el => el.checkValidity()), false);
        await settings.locator('form').evaluate(el => el.requestSubmit());
        assert.equal(await settings.locator('#EditorsChoiceTab-layout').getAttribute('aria-selected'), 'true');
        await settings.fill('#BannerCustomHeight', '720');
        assert.match(await status(), /Unsaved changes in Opening slide, Layout, Style, Motion, Advanced/);
        await settings.locator('form').evaluate(el => el.requestSubmit());
        await settings.waitForFunction(() => window.saved);
        await settings.waitForFunction(() => document.querySelector('#EditorsChoiceSaveStatus').textContent === 'All changes saved');
        const saved = await settings.evaluate(() => window.saved);
        assert.equal(saved.EnableSelectionCache, true);
        assert.equal(saved.SelectionRefreshMinutes, 45);
        assert.equal(saved.UseHeroLayout, true);
        assert.equal(saved.Heading, null);
        assert.equal(saved.TitleFont, 'georgia');
        assert.equal(saved.MetadataFont, 'mono');
        assert.equal(saved.DescriptionFont, 'verdana');
        assert.equal(saved.ButtonFont, 'arial');
        assert.equal(saved.BannerHeightMode, 'pixels');
        assert.equal(saved.BannerCustomHeight, 720);
        assert.equal(saved.MobileBannerHeightMode, 'fullscreen');
        assert.equal(saved.EnableBackgroundDimming, true);
        assert.equal(saved.BackgroundDimmingPercent, 40);
        assert.equal(saved.EnableBackgroundMotion, false);
        assert.equal(saved.EnableThemeVideos, false);
        assert.equal(saved.TransitionEffect, 'wipe');
        assert.equal(saved.TransitionDurationMs, 1200);
        assert.equal(saved.TransitionEasing, 'custom');
        assert.deepEqual([saved.TransitionEasingX1, saved.TransitionEasingY1, saved.TransitionEasingX2, saved.TransitionEasingY2], [1, 1.56, 0.65, 0.9]);
        assert.equal(saved.OpeningSlideType, 'message');
        assert.equal(saved.OpeningSlideContinue, false);
        assert.equal(saved.OpeningSlideEyebrow, 'Welcome');
        assert.equal(saved.OpeningSlideTitle, 'Welcome to our media library');
        assert.equal(saved.OpeningSlideBackgroundType, 'url');
        assert.equal(saved.OpeningSlideBackgroundUrl, 'https://example.com/welcome.jpg');
        assert.equal(saved.OpeningSlideAlignment, 'center');
        assert.equal(saved.OpeningSlideUseCustomButtonStyles, true);
        assert.equal(saved.OpeningSlidePrimaryButtonBackgroundColor, '#123456');
        assert.equal(saved.OpeningSlidePrimaryButtonTextColor, '#fedcba');
        assert.equal(saved.OpeningSlidePrimaryButtonOpacity, 65);
        assert.equal(saved.OpeningSlideSecondaryButtonBackgroundColor, '#234567');
        assert.equal(saved.OpeningSlideSecondaryButtonTextColor, '#ffffff');
        assert.equal(saved.OpeningSlideSecondaryButtonOpacity, 75);
        assert.equal(saved.UseCustomPlayButtonColors, true);
        assert.equal(saved.PlayButtonBackgroundColor, '#345678');
        assert.equal(saved.PlayButtonTextColor, '#abcdef');
        assert.equal(saved.OpeningSlideSecondaryButtonText, 'Getting started');
        assert.equal(saved.OpeningSlideSecondaryButtonUrl, 'https://example.com/help');
        assert.equal(saved.HeroFrameStyle, 'inset');
        assert.equal(saved.HeroCornerRadius, 24);
        assert.equal(saved.HeroContentAlignment, 'center');
        assert.equal(saved.HeroPosterMode, 'right');
        assert.equal(saved.HeroContentMaxWidth, 60);
        assert.equal(saved.HeroScrimStyle, 'side');
        assert.equal(saved.HeroScrimStrength, 70);
        assert.equal(saved.HeroBackdropPosition, 'custom');
        assert.equal(saved.HeroBackdropFocusX, 30);
        assert.equal(saved.HeroBackdropFocusY, 60);
        assert.equal(saved.HeroIndicatorStyle, 'bars');
        assert.equal(saved.HeroArrowStyle, 'minimal');
        assert.equal(saved.HeroTitleDisplay, 'both');
        assert.equal(saved.HeroTitleSize, 'large');
        assert.equal(saved.UseHeroAccentColor, true);
        assert.equal(saved.HeroAccentColor, '#ff8800');
        assert.equal(saved.HeroButtonVariant, 'glass');
        assert.equal(saved.ShowInfoButton, false);
        assert.equal(saved.ShowTagline, true);
        assert.deepEqual(saved.HeroMetadataFields, ['type', 'rating', 'year', 'genres', 'runtime']);
        assert.equal(saved.HeroMetadataSeparator, 'dot');
        assert.equal(saved.HeroOverviewMaxLines, 2);
        assert.equal(saved.HeroCustomCss, '.editorsChoiceItemTitle { color: red; }');
        assert.equal(saved.PauseOnHover, true);
        assert.equal(saved.ShowResumeProgress, true);
        await settings.evaluate(() => {
            window.config = window.saved;
            const oldView = document.querySelector('.editorsChoiceConfigurationPage');
            const view = oldView.cloneNode(true);
            oldView.replaceWith(view);
            initializeConfig(view);
            view.dispatchEvent(new Event('viewshow'));
        });
        await settings.waitForFunction(() => document.querySelector('#BannerCustomHeight').value === '720');
        // The last tab is remembered for the session.
        assert.equal(await settings.locator('#EditorsChoiceTab-layout').getAttribute('aria-selected'), 'true');
        assert.equal(await status(), 'All changes saved');
        assert.equal(await settings.locator('#HeroContentAlignment').inputValue(), 'center');
        assert.equal(await settings.locator('#HeroBackdropFocusY').inputValue(), '60');
        await openTab('advanced');
        assert.equal(await settings.locator('#EnableSelectionCache').isChecked(), true);
        assert.equal(await settings.locator('#SelectionRefreshMinutes').inputValue(), '45');
        await openTab('opening');
        assert.equal(await settings.locator('#OpeningSlideAlignment').inputValue(), 'center');
        assert.equal(await settings.locator('#OpeningSlidePrimaryButtonOpacity').inputValue(), '65');
        await openTab('style');
        assert.equal(await settings.locator('#PlayButtonColors-container').isVisible(), true);
        assert.deepEqual(await settings.locator('#HeroMetadataFieldList li').evaluateAll(rows => rows.map(row => row.dataset.metadataField)),
            ['type', 'rating', 'year', 'genres', 'runtime', 'critic', 'official', 'ends']);
        assert.equal(await settings.locator('#HeroMetadataField-official').isChecked(), false);
        // Discard restores the saved value and clears the unsaved marker.
        await settings.selectOption('#HeroTitleSize', 'small');
        await settings.click('[data-metadata-field="runtime"] [data-move="-1"]');
        assert.equal(await settings.locator('#EditorsChoiceTab-style').evaluate(el => el.classList.contains('editorsChoiceTab--dirty')), true);
        await settings.click('#EditorsChoiceDiscard');
        assert.equal(await settings.locator('#HeroTitleSize').inputValue(), 'large');
        assert.equal(await settings.locator('#HeroMetadataOrder').inputValue(), 'type,rating,year,genres,runtime,critic,official,ends');
        assert.equal(await status(), 'All changes saved');
        await openTab('advanced');
        await settings.uncheck('#EnableSelectionCache');
        assert.equal(await settings.locator('#SelectionRefreshMinutes').isDisabled(), true);
        assert.equal(await settings.locator('#SelectionRefreshMinutes-container').isVisible(), false);
        await settings.evaluate(() => { window.saved = null; });
        await settings.locator('form').evaluate(el => el.requestSubmit());
        await settings.waitForFunction(() => window.saved);
        assert.equal(await settings.evaluate(() => saved.EnableSelectionCache), false);
        assert.equal(await settings.evaluate(() => saved.SelectionRefreshMinutes), 45);
        await openTab('motion');
        assert.equal(await settings.locator('#TransitionEasing').inputValue(), 'custom');
        assert.equal(await settings.locator('#TransitionEasingValue').textContent(), 'cubic-bezier(1, 1.56, 0.65, 0.9)');
        assert.equal(await settings.locator('#EnableBackgroundMotion').isChecked(), false);
        assert.equal(await settings.locator('#EnableThemeVideos').isChecked(), false);
        await openTab('layout');
        assert.equal(await settings.locator('#BackgroundDimmingPercent').inputValue(), '40');
        await openTab('style');
        assert.equal(await settings.locator('#TitleFont').inputValue(), 'georgia');
        await openTab('opening');
        assert.equal(await settings.locator('#OpeningSlideType').inputValue(), 'message');
        assert.equal(await settings.locator('#OpeningSlideEyebrow').inputValue(), 'Welcome');
        assert.equal(await settings.locator('#OpeningSlideTitle').inputValue(), 'Welcome to our media library');
        if (process.env.BANNER_SCREENSHOT_DIR) {
            await settings.locator('#BannerPreview').screenshot({ path: path.join(process.env.BANNER_SCREENSHOT_DIR, 'settings-preview.png') });
        }
        await openTab('layout');
        await settings.selectOption('#BannerHeightMode', 'preset');
        await settings.selectOption('#MobileBannerHeightMode', 'inherit');
        await openTab('motion');
        await settings.selectOption('#TransitionEffectSelect', 'instant');
        assert.equal(await settings.locator('#BannerCustomHeight').isDisabled(), true);
        assert.equal(await settings.locator('#TransitionDurationMs').isDisabled(), true);
        assert.equal(await settings.locator('#TransitionEasing-container').isVisible(), false);
        assert.equal(await settings.locator('#BannerSubtractHeader-container').isVisible(), false);
        assert.deepEqual(await settings.evaluate(() => alerts), []);
        await settings.close();
        assert.deepEqual(errors, []);
        console.log('PASS settings tabs, unsaved changes, conditional fields, validation, preview, and persistence');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
