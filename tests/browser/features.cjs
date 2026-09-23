// Run like presentation.cjs: Playwright, jQuery and @splidejs/splide on NODE_PATH.
// Covers blurhash placeholders, carousel labels, keyboard/remote navigation,
// neighbour preloading, translations, and TV layout focus.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const client = fs.readFileSync(path.join(root, 'EditorsChoicePlugin/Api/client.js'), 'utf8');
const splideRoot = path.dirname(require.resolve('@splidejs/splide/package.json'));
const errors = [];
// A valid blurhash (from the blurhash README).
const HASH = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';

async function home(browser, data, { lang = 'en', tv = false, viewport = { width: 1440, height: 900 } } = {}) {
    const page = await browser.newPage({ viewport });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.route('**/*', route => {
        const url = route.request().url();
        if (url.endsWith('/splide.min.js')) return route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(path.join(splideRoot, 'dist/js/splide.min.js'), 'utf8') });
        if (url.endsWith('/splide.min.css')) return route.fulfill({ contentType: 'text/css', body: '' });
        // Backdrops never finish, so the placeholder stays up.
        if (url.includes('/Images/Backdrop')) return new Promise(() => {});
        return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90"><rect width="160" height="90" fill="#557788"/></svg>' });
    });
    await page.setContent(`<!DOCTYPE html><html lang="${lang}" class="${tv ? 'layout-tv' : ''}"><base href="http://banner.test/web/"><body><header class="skinHeader"></header><div id="reactRoot"><div id="indexPage"><div id="homeTab" class="is-active"><div class="homeSectionsContainer"><div id="following"><button id="below">Below</button></div></div></div></div></div></body></html>`);
    await page.addStyleTag({ path: path.join(splideRoot, 'dist/css/splide.min.css') });
    await page.addScriptTag({ path: require.resolve('jquery') });
    await page.addScriptTag({ path: path.join(splideRoot, 'dist/js/splide.min.js') });
    await page.evaluate((data) => {
        const { hash, ...settings } = data;
        const response = {
            favourites: [1, 2, 3].map(id => ({ id: String(id), name: 'Feature ' + id, item_type: 'Movie', runtime_minutes: 95,
                overview_html: '<p>Overview.</p>', backdrop_blurhash: hash, has_trailer: true, hasPoster: true })),
            autoplay: false, showNavigationArrows: true, autoplayInterval: 60000, showPlayButton: true, showTrailerButton: true,
            bannerHeight: 360, heroMetadataFields: ['type', 'runtime'], isEditor: true,
            ...settings,
        };
        window.ApiClient = { fetch: async () => ({ json: async () => response }), getUrl: u => 'http://banner.test/' + u,
            serverId: () => 'test', accessToken: () => 'test' };
        window.Dashboard = { confirm: text => { window.confirmed = text; } };
        const Original = window.Splide;
        window.Splide = function (...args) { window.testSlider = new Original(...args); return window.testSlider; };
    }, { hash: HASH, ...data });
    const { hash, ...settings } = data;
    await page.addScriptTag({ content: 'const editorsChoiceBootstrap = ' + JSON.stringify({ bannerHeight: 360, ...settings }) + ';\n' + client });
    await page.waitForSelector('.splide.is-initialized');
    return page;
}

(async () => {
    const browser = await chromium.launch({
        ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}),
    });
    try {
        // Blurhash placeholder replaces the skeleton while the backdrop is still downloading.
        let page = await home(browser, {});
        await page.waitForFunction(() => !document.querySelector('.editorsChoiceIsLoading'));
        const bg = await page.locator('.splide__slide.is-active:not(.splide__slide--clone) .editorsChoiceBlurhash').evaluate(el => ({ bg: el.style.backgroundImage, opacity: getComputedStyle(el).opacity }));
        assert.match(bg.bg, /^url\("data:image\/png;base64,/);
        console.log('PASS blurhash placeholder shown before backdrop loads');

        // Carousel labels.
        const labels = await page.evaluate(() => ({
            root: document.querySelector('.splide').getAttribute('aria-label'),
            rootRole: document.querySelector('.splide').getAttribute('aria-roledescription'),
            slide: document.querySelector('.splide__slide:not(.splide__slide--clone)').getAttribute('aria-label'),
            slideRole: document.querySelector('.splide__slide:not(.splide__slide--clone)').getAttribute('aria-roledescription'),
            prev: document.querySelector('.splide__arrow--prev').getAttribute('title'),
        }));
        assert.equal(labels.root, 'Featured content');
        assert.equal(labels.rootRole, 'carousel');
        assert.equal(labels.slide, '1 of 3: Feature 1');
        assert.equal(labels.slideRole, 'slide');
        console.log('PASS carousel labels');

        // Only the visible slide is focusable.
        const inert = await page.evaluate(() => Array.from(document.querySelectorAll('.splide__slide')).map(s => [s.matches('.is-active:not(.splide__slide--clone)'), s.hasAttribute('inert')]));
        assert.ok(inert.every(([active, isInert]) => active !== isInert));
        console.log('PASS inactive slides are inert');

        // Keyboard: Right moves across buttons, then to the next slide's first button.
        await page.locator('.splide__slide.is-active:not(.splide__slide--clone) .editorsChoiceItemButton').focus();
        const buttons = await page.locator('.splide__slide.is-active:not(.splide__slide--clone) .editorsChoiceItemActions .emby-button').count();
        for (let i = 1; i < buttons; i++) await page.keyboard.press('ArrowRight');
        assert.equal(await page.evaluate(() => testSlider.index), 0);
        await page.keyboard.press('ArrowRight');
        await page.waitForFunction(() => testSlider.index === 1 && document.activeElement.closest('.splide__slide')?.id === document.querySelectorAll('.splide__slide:not(.splide__slide--clone)')[1].id);
        const focused = await page.evaluate(() => document.activeElement.className);
        assert.match(focused, /editorsChoicePosterButton|editorsChoiceItemButton/);
        await page.keyboard.press('ArrowLeft');
        await page.waitForFunction(() => testSlider.index === 0);
        console.log('PASS arrow keys move between buttons then slides; focus follows');

        // Arrow keys outside the banner no longer move it.
        await page.locator('#below').focus();
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(800);
        assert.equal(await page.evaluate(() => testSlider.index), 0);
        console.log('PASS arrow keys outside the banner are ignored');

        // Neighbour preloading switches lazy posters to eager on both sides.
        const eager = await page.evaluate(() => Array.from(document.querySelectorAll('.splide__slide:not(.splide__slide--clone) img.editorsChoiceItemPoster')).map(i => i.loading));
        assert.deepEqual(eager.slice(1), ['eager', 'eager']);
        console.log('PASS neighbour posters preloaded');

        // Editor notice uses the response flag.
        await page.evaluate(() => { const b = document.createElement('button'); b.setAttribute('is', 'emby-ratingbutton'); b.id = 'fav'; document.body.append(b); });
        await page.click('#fav');
        assert.match(await page.evaluate(() => window.confirmed), /featured items editor/);
        console.log('PASS editor notice without plugin configuration request');
        await page.close();

        // French strings and TV layout.
        page = await home(browser, { hash: 'bad' }, { lang: 'fr', tv: true });
        const fr = await page.evaluate(() => ({
            type: document.querySelector('.splide__slide:not(.splide__slide--clone) .editorsChoiceMediaType').textContent,
            slide: document.querySelector('.splide__slide:not(.splide__slide--clone)').getAttribute('aria-label'),
            info: document.querySelector('.splide__slide:not(.splide__slide--clone) .editorsChoiceInfoButton').getAttribute('aria-label'),
            runtime: document.querySelector('.splide__slide:not(.splide__slide--clone) .editorsChoiceItemMetadata').textContent,
            arrows: getComputedStyle(document.querySelector('.editorsChoiceScrollButtonsContainer')).display,
            paginationInert: document.querySelector('.splide__pagination')?.hasAttribute('inert'),
            blurhash: !!document.querySelector('.editorsChoiceBlurhash'),
        }));
        assert.equal(fr.type, 'Film');
        assert.equal(fr.slide, '1 sur 3: Feature 1');
        assert.equal(fr.info, "Plus d'informations: Feature 1");
        assert.equal(fr.arrows, 'none');
        assert.equal(fr.paginationInert, true);
        assert.equal(fr.blurhash, false);
        console.log('PASS French strings, TV layout, invalid blurhash ignored');
        await page.close();

        // Tall custom heights on narrow screens: buttons stay clear of the page indicator.
        for (const [width, height] of [[390, 844], [700, 1100], [1440, 900]]) {
            page = await home(browser, { bannerHeightMode: 'viewport', bannerViewportHeight: 80 }, { viewport: { width, height } });
            const overlap = await page.evaluate(() => {
                const slide = document.querySelector('.splide__slide.is-active:not(.splide__slide--clone)');
                const actions = slide.querySelector('.editorsChoiceItemActions').getBoundingClientRect();
                return Array.from(document.querySelectorAll('.splide__pagination, .editorsChoiceMobilePagination'))
                    .filter(el => getComputedStyle(el).display !== 'none')
                    .map(el => el.getBoundingClientRect())
                    .some(box => box.height && actions.bottom > box.top && actions.top < box.bottom
                        && actions.right > box.left && actions.left < box.right);
            });
            assert.equal(overlap, false, `buttons overlap the indicator at ${width}x${height}`);
            await page.close();
        }
        console.log('PASS buttons clear the page indicator at 80% height on phone, tablet, and desktop');

        // Freeze each effect partway through and check it is really animating.
        for (const effect of ['parallax', 'dip', 'stagger', 'iris']) {
            page = await home(browser, { transitionEffect: effect, transitionDurationMs: 1000 });
            const sample = async (time) => page.evaluate((time) => {
                for (const animation of document.getAnimations()) {
                    if (animation.effect?.target?.closest?.('.splide__slide')) { animation.pause(); animation.currentTime = time; }
                }
                // Splide marks the destination active only after the move; use its index.
                const incoming = testSlider.Components.Slides.getAt(testSlider.index).slide;
                const outgoing = document.querySelector('.editorsChoiceTransitionOutgoing');
                if (incoming === outgoing) throw new Error('Incoming and outgoing slides are the same.');
                const style = el => getComputedStyle(el);
                return {
                    incomingOpacity: Number(style(incoming).opacity), outgoingOpacity: Number(style(outgoing).opacity),
                    incomingClip: style(incoming).clipPath, incomingTransform: style(incoming).transform,
                    backdropTranslate: style(incoming.querySelector('.editorsChoiceBackdrop')).translate,
                    outgoingContentOpacity: Number(style(outgoing.querySelector('.editorsChoiceContent')).opacity),
                    revealDelay: incoming.style.getPropertyValue('--ec-reveal-delay'),
                    blurhashOpacity: Number(style(incoming.querySelector('.editorsChoiceBlurhash')).opacity),
                };
            }, time);
            await page.evaluate(() => testSlider.go('>'));
            await page.waitForSelector('.editorsChoiceTransitionOutgoing', { state: 'attached' });
            const start = await sample(200);
            const early = await sample(300);
            const middle = await sample(500);
            if (effect !== 'dip' && effect !== 'stagger') assert.equal(middle.incomingOpacity, 1, 'incoming slide is visible');
            // The incoming slide shows its artwork (here the blurred preview) during the move.
            assert.equal(middle.blurhashOpacity, 1, 'incoming artwork is shown during the transition');
            if (effect === 'parallax') {
                assert.notEqual(middle.incomingTransform, 'none');
                assert.notEqual(middle.backdropTranslate, 'none');
                assert.notEqual(middle.backdropTranslate, '0px');
                assert.match(middle.incomingClip, /inset/);
            } else if (effect === 'dip') {
                assert.ok(early.outgoingOpacity < 0.5 && early.outgoingOpacity > 0);
                assert.equal(middle.incomingOpacity, 0);
                assert.equal(middle.outgoingOpacity, 0);
                assert.equal(early.revealDelay, '550ms');
            } else if (effect === 'stagger') {
                assert.ok(start.outgoingContentOpacity < 0.5, 'old text leaves first');
                assert.equal(start.incomingOpacity, 0, 'artwork crossfade waits for the text to leave');
                assert.ok(middle.incomingOpacity > start.incomingOpacity);
                assert.equal(early.revealDelay, '600ms');
            } else {
                assert.match(middle.incomingClip, /circle/);
            }
            await page.evaluate(() => document.getAnimations()
                .filter(animation => animation.effect?.target?.closest?.('.splide__slide') && animation.effect.getComputedTiming().endTime !== Infinity)
                .forEach(animation => animation.finish()));
            await page.waitForFunction(() => !document.querySelector('.editorsChoiceTransitionOutgoing') && testSlider.index === 1);
            await page.close();
        }
        console.log('PASS parallax, dip, staggered, and iris transitions animate');
        assert.deepEqual(errors, []);
        console.log('PASS no page errors');
    } finally {
        await browser.close();
    }
})().catch(e => { console.error(e); console.error(errors); process.exit(1); });
