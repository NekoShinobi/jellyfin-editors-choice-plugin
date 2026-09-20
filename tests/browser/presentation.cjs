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
                bodyHtml: '<p>Find something great or read the guide.</p>', backgroundType: 'gradient',
                actions: [
                    { label: 'Browse library', url: '/web/#/home.html', primary: true },
                    { label: 'Getting started', url: 'https://example.com/help', primary: false },
                ],
            },
        });
        assert.equal(await messageOnly.locator('.splide__slide:not(.splide__slide--clone)').count(), 1);
        assert.equal(await messageOnly.locator('.splide__slide:not(.splide__slide--clone) .editorsChoiceItemTitle').textContent(), 'Welcome to Harbor Media');
        const originalMessage = messageOnly.locator('.splide__slide:not(.splide__slide--clone)');
        assert.equal(await originalMessage.evaluate(el => el.classList.contains('editorsChoiceOpeningSlide--gradient')), true);
        assert.equal(await originalMessage.evaluate(el => el.classList.contains('editorsChoiceSlideReady')), true);
        assert.equal(await originalMessage.getByRole('link', { name: /Browse library/ }).getAttribute('href'), '/web/#/home.html');
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
            openingSlide: {
                type: 'media', continueToSelection: true,
                item: { id: '2', name: 'Feature 2', item_type: 'Movie', overview_html: '<p>Pinned.</p>' },
            },
        });
        assert.equal(await pinnedMedia.locator('.splide__slide:not(.splide__slide--clone)').count(), 3);
        assert.equal(await pinnedMedia.locator('.splide__slide:not(.splide__slide--clone)').first().locator('.editorsChoiceItemTitle').textContent(), 'Feature 2');
        assert.equal(await pinnedMedia.locator('.splide__slide:not(.splide__slide--clone) .editorsChoiceItemTitle', { hasText: 'Feature 2' }).count(), 1);
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

        const settings = await browser.newPage();
        settings.on('pageerror', error => errors.push(error.message));
        await settings.setContent(fs.readFileSync(path.join(root, 'EditorsChoicePlugin/Configuration/configPage.html'), 'utf8'));
        await settings.evaluate(() => {
            window.config = { Mode: 'RANDOM', BannerHeight: 500, UseHeroLayout: true, EnableAutoplay: true,
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
        await settings.waitForFunction(() => document.querySelector('#BannerHeightSelect').value === '500');
        assert.equal(await settings.locator('#EnableSelectionCache').isChecked(), true);
        assert.equal(await settings.locator('#SelectionRefreshMinutes').inputValue(), '30');
        await settings.fill('#SelectionRefreshMinutes', '0');
        assert.equal(await settings.locator('form').evaluate(el => el.checkValidity()), false);
        await settings.fill('#SelectionRefreshMinutes', '1441');
        assert.equal(await settings.locator('form').evaluate(el => el.checkValidity()), false);
        await settings.fill('#SelectionRefreshMinutes', '45');
        assert.equal(await settings.locator('#EnableBackgroundDimming').isChecked(), false);
        assert.equal(await settings.locator('#EnableBackgroundMotion').isChecked(), true);
        assert.equal(await settings.locator('#EnableThemeVideos').isChecked(), true);
        assert.equal(await settings.locator('#Heading, #UseHeroLayout').count(), 0);
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
        await settings.fill('#OpeningSlideSecondaryButtonText', 'Getting started');
        await settings.fill('#OpeningSlideSecondaryButtonUrl', 'https://example.com/help');
        await settings.uncheck('#OpeningSlideContinue');
        assert.equal(await settings.locator('#OpeningSlideMessage-container').isVisible(), true);
        assert.equal(await settings.locator('#OpeningSlideMedia-container').isVisible(), false);
        assert.equal(await settings.locator('#OpeningSlideBackgroundUrl-container').isVisible(), true);
        await settings.selectOption('#TitleFont', 'georgia');
        await settings.selectOption('#MetadataFont', 'mono');
        await settings.selectOption('#DescriptionFont', 'verdana');
        await settings.selectOption('#ButtonFont', 'arial');
        await settings.selectOption('#BannerHeightMode', 'pixels');
        await settings.fill('#BannerCustomHeight', '720');
        await settings.selectOption('#MobileBannerHeightMode', 'fullscreen');
        await settings.check('#EnableBackgroundDimming');
        await settings.fill('#BackgroundDimmingPercent', '40');
        await settings.uncheck('#EnableBackgroundMotion');
        await settings.uncheck('#EnableThemeVideos');
        await settings.selectOption('#TransitionEffectSelect', 'wipe');
        await settings.fill('#TransitionDurationMs', '1200');
        await settings.selectOption('#BannerPreviewDevice', 'mobile');
        await settings.click('#PreviewTransition');
        assert.match(await settings.locator('#BannerPreviewSummary').textContent(), /Mobile.*Wipe/);
        await settings.fill('#BannerCustomHeight', '20');
        assert.equal(await settings.locator('form').evaluate(el => el.checkValidity()), false);
        await settings.fill('#BannerCustomHeight', '720');
        await settings.locator('form').evaluate(el => el.requestSubmit());
        await settings.waitForFunction(() => window.saved);
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
        assert.equal(saved.OpeningSlideType, 'message');
        assert.equal(saved.OpeningSlideContinue, false);
        assert.equal(saved.OpeningSlideEyebrow, 'Welcome');
        assert.equal(saved.OpeningSlideTitle, 'Welcome to our media library');
        assert.equal(saved.OpeningSlideBackgroundType, 'url');
        assert.equal(saved.OpeningSlideBackgroundUrl, 'https://example.com/welcome.jpg');
        assert.equal(saved.OpeningSlideSecondaryButtonText, 'Getting started');
        assert.equal(saved.OpeningSlideSecondaryButtonUrl, 'https://example.com/help');
        await settings.evaluate(() => {
            window.config = window.saved;
            const oldView = document.querySelector('.editorsChoiceConfigurationPage');
            const view = oldView.cloneNode(true);
            oldView.replaceWith(view);
            initializeConfig(view);
            view.dispatchEvent(new Event('viewshow'));
        });
        await settings.waitForFunction(() => document.querySelector('#BannerCustomHeight').value === '720');
        assert.equal(await settings.locator('#EnableSelectionCache').isChecked(), true);
        assert.equal(await settings.locator('#SelectionRefreshMinutes').inputValue(), '45');
        await settings.uncheck('#EnableSelectionCache');
        assert.equal(await settings.locator('#SelectionRefreshMinutes').isDisabled(), true);
        assert.equal(await settings.locator('#SelectionRefreshMinutes-container').isVisible(), false);
        await settings.evaluate(() => { window.saved = null; });
        await settings.locator('form').evaluate(el => el.requestSubmit());
        await settings.waitForFunction(() => window.saved);
        assert.equal(await settings.evaluate(() => saved.EnableSelectionCache), false);
        assert.equal(await settings.evaluate(() => saved.SelectionRefreshMinutes), 45);
        assert.equal(await settings.locator('#EnableBackgroundMotion').isChecked(), false);
        assert.equal(await settings.locator('#EnableThemeVideos').isChecked(), false);
        assert.equal(await settings.locator('#BackgroundDimmingPercent').inputValue(), '40');
        assert.equal(await settings.locator('#TitleFont').inputValue(), 'georgia');
        assert.equal(await settings.locator('#OpeningSlideType').inputValue(), 'message');
        assert.equal(await settings.locator('#OpeningSlideEyebrow').inputValue(), 'Welcome');
        assert.equal(await settings.locator('#OpeningSlideTitle').inputValue(), 'Welcome to our media library');
        if (process.env.BANNER_SCREENSHOT_DIR) {
            await settings.locator('#BannerPreview').screenshot({ path: path.join(process.env.BANNER_SCREENSHOT_DIR, 'settings-preview.png') });
        }
        await settings.selectOption('#BannerHeightMode', 'preset');
        await settings.selectOption('#MobileBannerHeightMode', 'inherit');
        await settings.selectOption('#TransitionEffectSelect', 'instant');
        assert.equal(await settings.locator('#BannerCustomHeight').isDisabled(), true);
        assert.equal(await settings.locator('#TransitionDurationMs').isDisabled(), true);
        assert.equal(await settings.locator('#BannerSubtractHeader-container').isVisible(), false);
        assert.deepEqual(await settings.evaluate(() => alerts), []);
        await settings.close();
        assert.deepEqual(errors, []);
        console.log('PASS settings defaults, conditional fields, validation, preview, and persistence');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
