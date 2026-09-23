const pluginId = "70bb2ec1-f19e-46b5-b49a-942e6b96ebae";
const referenceCacheTtlMs = 5 * 60 * 1000;
const referenceCache = {
    expiresAt: 0,
    serverId: null,
    requests: new Map(),
};

function getCachedReference(ApiClient, key, loader) {
    const serverId = typeof ApiClient.serverId === "function" ? ApiClient.serverId() : "default";
    const now = Date.now();

    if (referenceCache.serverId !== serverId || referenceCache.expiresAt <= now) {
        referenceCache.serverId = serverId;
        referenceCache.expiresAt = now + referenceCacheTtlMs;
        referenceCache.requests.clear();
    }

    if (!referenceCache.requests.has(key)) {
        const request = Promise.resolve()
            .then(loader)
            .catch((error) => {
                referenceCache.requests.delete(key);
                throw error;
            });
        referenceCache.requests.set(key, request);
    }

    return referenceCache.requests.get(key);
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

async function parseFetchResponse(response) {
    return response && typeof response.json === "function" ? response.json() : response;
}

const metadataFieldLabels = {
    type: "Media type",
    rating: "Community rating",
    critic: "Critic rating",
    year: "Year",
    runtime: "Runtime or episode count",
    official: "Parental rating",
    genres: "Genres",
    ends: "End time",
};
const defaultMetadataFields = ["type", "rating", "year", "runtime", "official"];

function normalizeMetadataFields(fields) {
    if (!Array.isArray(fields)) return defaultMetadataFields;
    return [...new Set(fields.filter((key) => Object.hasOwn(metadataFieldLabels, key)))];
}

// Mirrors BannerSettings.NormalizeCustomCss: the banner nests this CSS inside
// its container, so an unbalanced brace would leak rules onto the whole page.
function customCssIsBalanced(css) {
    let depth = 0;
    let quote = "";
    for (let index = 0; index < css.length; index++) {
        const character = css[index];
        if (quote) {
            if (character === "\\") index++;
            else if (character === quote) quote = "";
            continue;
        }
        if (character === "/" && css[index + 1] === "*") {
            const end = css.indexOf("*/", index + 2);
            if (end < 0) return false;
            index = end + 1;
        } else if (character === '"' || character === "'") {
            quote = character;
        } else if (character === "{") {
            depth++;
        } else if (character === "}" && --depth < 0) {
            return false;
        }
    }
    return depth === 0 && !quote;
}

function textLogo(text) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 150"><text x="0" y="118" textLength="600" lengthAdjust="spacingAndGlyphs" font-family="Impact, 'Arial Narrow', sans-serif" font-size="128" fill="#fff">${escapeHtml(text.toUpperCase())}</text></svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

// Used when the library has no titles with backdrops (or before they load).
const fallbackPreviewItems = [
    {
        name: "Salt & Signal",
        tagline: "Every lighthouse keeps a secret.",
        type: "Movie",
        rating: 7.8,
        critic: 82,
        year: 2024,
        runtimeMinutes: 131,
        official: "PG-13",
        genres: ["Drama", "Mystery", "Thriller"],
        description: "When the keeper of a remote northern lighthouse vanishes during a winter storm, his estranged daughter returns to the island and finds the station still transmitting a signal no one can trace.",
        scene: "radial-gradient(circle at 68% 44%, #ffd89a 0 2.5%, #f39a4e 6%, rgba(240,120,70,.35) 16%, transparent 30%), linear-gradient(180deg, #16223a 0%, #3b3552 26%, #b05a4c 44%, #f0a15b 50%, #1b3b46 50.6%, #10262f 70%, #081419 100%)",
        logoUrl: textLogo("Salt & Signal"),
    },
    {
        name: "Low Orbit",
        tagline: "Six crew. One window home.",
        type: "Series",
        rating: 8.4,
        critic: 91,
        year: 2025,
        episodes: 10,
        official: "TV-14",
        genres: ["Science Fiction", "Drama"],
        description: "A maintenance crew aboard an ageing research station has ninety days to keep it in orbit after the agency that built it quietly stops answering their calls.",
        scene: "radial-gradient(circle at 76% 72%, #9cc6ff 0 16%, #3a67c4 22%, #1b2f66 25%, transparent 25.4%), radial-gradient(circle at 20% 20%, #fff 0 .15%, transparent .4%), radial-gradient(circle at 42% 12%, #fff 0 .12%, transparent .35%), linear-gradient(160deg, #04060d 0%, #0b1330 60%, #1a2448 100%)",
        logoUrl: textLogo("Low Orbit"),
        resume: { label: "Resume S1 E4 · 23m left", percent: 62, remainingMinutes: 23 },
    },
];

// Cubic Bézier control points [x1, y1, x2, y2]. Keep in sync with BannerSettings.EasingPresets.
const easingPresets = {
    smooth: ["Smooth (default)", [0.22, 1, 0.36, 1]],
    ease: ["Ease", [0.25, 0.1, 0.25, 1]],
    "ease-in": ["Ease in", [0.42, 0, 1, 1]],
    "ease-out": ["Ease out", [0, 0, 0.58, 1]],
    "ease-in-out": ["Ease in and out", [0.42, 0, 0.58, 1]],
    linear: ["Linear", [0, 0, 1, 1]],
    gentle: ["Gentle", [0.4, 0, 0.2, 1]],
    dramatic: ["Dramatic", [0.7, 0, 0.3, 1]],
    overshoot: ["Overshoot", [0.34, 1.56, 0.64, 1]],
    anticipate: ["Anticipate (pulls back first)", [0.36, 0, 0.66, -0.56]],
};
const easingFields = ["TransitionEasingX1", "TransitionEasingY1", "TransitionEasingX2", "TransitionEasingY2"];
// Matches the CSS rule for x and BannerSettings' limits for y.
const easingLimits = [[0, 1], [-2, 3], [0, 1], [-2, 3]];

function clampEasingPoints(points) {
    return points.map((value, index) => {
        const [minimum, maximum] = easingLimits[index];
        const number = Number(value);
        return Number.isFinite(number) ? Math.min(maximum, Math.max(minimum, number)) : easingPresets.smooth[1][index];
    });
}

const openingGradient = "radial-gradient(circle at 78% 28%, rgba(126, 87, 194, 0.48), transparent 31%), radial-gradient(circle at 65% 78%, rgba(0, 164, 220, 0.3), transparent 34%), linear-gradient(125deg, #0d111a 8%, #1b2030 48%, #131722 100%)";
const previewTabs = new Set(["opening", "layout", "style", "motion"]);
const tabStorageKey = "editorsChoiceSettingsTab";
const untrackedFields = new Set(["OpeningSlidePreset", "OpeningSlideMediaSearch", "OpeningSlideBackgroundSearch"]);

export default function (view) {
    const ApiClient = globalThis.ApiClient;
    const Dashboard = globalThis.Dashboard;
    const form = view.querySelector(".editorsChoiceConfigurationForm");
    const tabs = Array.from(view.querySelectorAll(".editorsChoiceTab"));
    const panels = Array.from(view.querySelectorAll("[data-tab-panel]"));
    const state = {
        config: null,
        loaded: false,
        loading: false,
        activeTab: "content",
        baseline: new Map(),
        previewDevice: "desktop",
        previewIndex: 0,
        previewItems: fallbackPreviewItems,
        rendered: {
            collections: false,
            libraries: false,
            ratings: false,
            users: false,
        },
    };

    const field = (id) => form.querySelector(`#${id}`);
    const presentationNumbers = {
        SelectionRefreshMinutes: [30, 1, 1440],
        BannerCustomHeight: [600, 240, 2160],
        BannerViewportHeight: [75, 25, 100],
        MobileBannerCustomHeight: [360, 240, 2160],
        MobileBannerViewportHeight: [60, 25, 100],
        TransitionDurationMs: [0, 0, 3000],
        BackgroundDimmingPercent: [30, 0, 100],
        OpeningSlidePrimaryButtonOpacity: [100, 0, 100],
        OpeningSlideSecondaryButtonOpacity: [85, 0, 100],
        HeroCornerRadius: [16, 0, 32],
        HeroBackdropFocusX: [50, 0, 100],
        HeroBackdropFocusY: [50, 0, 100],
        HeroBackdropBlur: [0, 0, 20],
        HeroBackdropBrightness: [100, 50, 150],
        HeroBackdropSaturation: [100, 0, 150],
        HeroScrimStrength: [100, 0, 100],
        HeroMaxGenres: [2, 1, 5],
        HeroOverviewMaxLines: [4, 1, 8],
        ThemeVideoStartDelaySeconds: [0, 0, 10],
    };
    const presentationToggles = {
        EnableSelectionCache: true,
        BannerSubtractHeader: true,
        EnableBackgroundDimming: false,
        EnableBackgroundMotion: true,
        EnableThemeVideos: true,
        OpeningSlideUseCustomButtonStyles: false,
        UseCustomPlayButtonColors: false,
        MobileHidePoster: false,
        UseHeroAccentColor: false,
        UseCustomTextColors: false,
        ShowTagline: false,
        MobileHideDescription: false,
        ShowInfoButton: true,
        ShowTrailerButton: false,
        ShowResumeProgress: true,
        PauseOnHover: true,
    };
    // The first value is the default.
    const presentationChoices = {
        HeroContentAlignment: ["left", "center", "right"],
        MobileContentAlignment: ["inherit", "left", "center"],
        HeroContentVerticalPosition: ["center", "top", "bottom"],
        HeroContentMaxWidth: ["0", "40", "50", "60", "70", "80", "90"],
        HeroPosterMode: ["auto", "right", "hidden"],
        HeroPosterSize: ["medium", "small", "large"],
        HeroFrameStyle: ["bleed", "inset"],
        HeroBackdropImageType: ["Backdrop", "Thumb", "Primary"],
        HeroScrimStyle: ["auto", "side", "bottom", "vignette", "none"],
        HeroTitleDisplay: ["logo", "title", "both"],
        HeroTitleSize: ["medium", "small", "large", "xlarge"],
        HeroTextShadow: ["none", "soft", "strong"],
        HeroMetadataSeparator: ["pill", "dot", "pipe", "none"],
        HeroOverviewSize: ["medium", "small", "large"],
        HeroButtonShape: ["default", "rounded", "pill", "square"],
        HeroButtonVariant: ["filled", "outline", "glass"],
        HeroButtonSize: ["medium", "small", "large"],
        BackgroundMotionIntensity: ["normal", "subtle", "strong"],
        HeroIndicatorStyle: ["dots", "bars", "counter", "progress", "none"],
        HeroIndicatorPosition: ["center", "left", "right"],
        HeroArrowStyle: ["circle", "minimal", "hover"],
    };
    const presentationColors = {
        HeroScrimColor: "#000000",
        HeroAccentColor: "#00a4dc",
        HeroTitleColor: "#ffffff",
        HeroTextColor: "#ffffff",
    };
    let previewAnimation;
    let easingDemo;
    const fonts = {
        default: ["Jellyfin default", "inherit"],
        system: ["System UI", "system-ui, sans-serif"],
        noto: ["Noto Sans", '"Noto Sans", sans-serif'],
        arial: ["Arial", "Arial, Helvetica, sans-serif"],
        verdana: ["Verdana", "Verdana, Geneva, sans-serif"],
        trebuchet: ["Trebuchet MS", '"Trebuchet MS", sans-serif'],
        georgia: ["Georgia", "Georgia, serif"],
        serif: ["Classic serif", '"Times New Roman", Times, serif'],
        mono: ["Monospace", "ui-monospace, Consolas, monospace"],
    };
    const fontFields = ["TitleFont", "MetadataFont", "DescriptionFont", "ButtonFont"];
    const openingSlidePresets = {
        welcome: {
            eyebrow: "Welcome",
            title: "Welcome to our media library",
            body: "Browse the latest additions, continue watching, or explore something new.",
            primaryText: "Browse library",
            primaryUrl: "#/home.html",
            secondaryText: "",
            secondaryUrl: "",
        },
        help: {
            eyebrow: "Getting started",
            title: "Need help getting started?",
            body: "Choose something to watch, press Play, or open the guide for help with devices and playback.",
            primaryText: "Getting started",
            primaryUrl: "",
            secondaryText: "",
            secondaryUrl: "",
        },
        announcement: {
            eyebrow: "Announcement",
            title: "Something new is waiting",
            body: "Take a look at the latest additions and this week's featured picks.",
            primaryText: "Explore the library",
            primaryUrl: "#/home.html",
            secondaryText: "",
            secondaryUrl: "",
        },
    };
    for (const id of fontFields) {
        field(id).replaceChildren(...Object.entries(fonts).map(([key, [label]]) => new Option(label, key)));
    }
    field("TransitionEasing").replaceChildren(
        ...Object.entries(easingPresets).map(([key, [label]]) => new Option(label, key)),
        new Option("Custom", "custom"));

    function showError(message, error) {
        console.error(message, error);
        Dashboard.alert(message);
    }

    function setVisible(id, visible) {
        field(id).style.display = visible ? "" : "none";
        // Hidden numeric controls must not prevent HTML form validation.
        field(id).querySelectorAll("input, select").forEach((input) => { input.disabled = !visible; });
    }

    function normalizeColor(value, fallback) {
        return /^#[0-9a-f]{6}$/i.test(value || "") ? value : fallback;
    }

    function normalizeMode(mode) {
        return ["FAVOURITES", "RANDOM", "COLLECTIONS", "NEW", "MIXED"].includes(mode) ? mode : "RANDOM";
    }

    function getSelectedMode() {
        if (field("FavouritesMode").checked) return "FAVOURITES";
        if (field("CollectionsMode").checked) return "COLLECTIONS";
        if (field("NewMode").checked) return "NEW";
        if (field("MixedMode").checked) return "MIXED";
        return "RANDOM";
    }

    const mixedCountFields = ["MixedFavouritesCount", "MixedNewCount", "MixedCollectionsCount", "MixedRandomCount"];

    function mixedCount(id) {
        return Number(field(id).value) > 0;
    }

    /* ===== Tabs ===== */

    function readStoredTab() {
        try {
            return sessionStorage.getItem(tabStorageKey);
        } catch {
            return null;
        }
    }

    function selectTab(name, focus = false) {
        if (!panels.some((panel) => panel.dataset.tabPanel === name)) name = "content";
        state.activeTab = name;
        for (const tab of tabs) {
            const selected = tab.dataset.tab === name;
            tab.setAttribute("aria-selected", String(selected));
            tab.tabIndex = selected ? 0 : -1;
            if (selected && focus) tab.focus();
        }
        for (const panel of panels) panel.hidden = panel.dataset.tabPanel !== name;
        const showPreview = previewTabs.has(name);
        field("BannerPreviewPanel").hidden = !showPreview;
        view.querySelector(".editorsChoiceSettingsLayout").classList.toggle("editorsChoiceSettingsLayout--withPreview", showPreview);
        try {
            sessionStorage.setItem(tabStorageKey, name);
        } catch {
            // Storage can be unavailable in private windows; the tab still works.
        }
        updateStickyLayout();
        updatePreview();
    }

    function handleTabKeydown(event) {
        const index = tabs.indexOf(event.currentTarget);
        const target = event.key === "ArrowRight" ? tabs[(index + 1) % tabs.length]
            : event.key === "ArrowLeft" ? tabs[(index - 1 + tabs.length) % tabs.length]
                : event.key === "Home" ? tabs[0]
                    : event.key === "End" ? tabs[tabs.length - 1]
                        : null;
        if (!target) return;
        event.preventDefault();
        selectTab(target.dataset.tab, true);
    }

    function findScrollParent(element) {
        for (let parent = element.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
            const overflow = getComputedStyle(parent).overflowY;
            if ((overflow === "auto" || overflow === "scroll") && parent.scrollHeight > parent.clientHeight) return parent;
        }
        return null;
    }

    function findBackground(element) {
        for (let node = element; node; node = node.parentElement) {
            const color = getComputedStyle(node).backgroundColor;
            if (color && color !== "transparent" && !/rgba\([^)]*,\s*0\)$/.test(color)) return color;
        }
        return "#101010";
    }

    // The tab bar, preview and save bar are sticky; keep them clear of Jellyfin's
    // fixed header and give them an opaque background matching the theme.
    function updateStickyLayout() {
        let top = 0;
        for (const header of document.querySelectorAll(".skinHeader, .MuiAppBar-positionFixed")) {
            const position = getComputedStyle(header).position;
            if (position === "fixed" || position === "sticky") top = Math.max(top, header.getBoundingClientRect().bottom);
        }
        const scroller = findScrollParent(form);
        const scrollerTop = scroller ? scroller.getBoundingClientRect().top : 0;
        if (scroller) top = Math.max(0, top - scrollerTop);
        view.style.setProperty("--ec-sticky-top", `${Math.round(top)}px`);
        // A sticky element whose offset exceeds its resting position is pushed down over
        // the settings below it. Pad the form so the header rests clear of Jellyfin's header.
        // The form's own padding does not move its box, so this stays stable across calls.
        const scrolled = scroller ? scroller.scrollTop : window.scrollY;
        const restingTop = form.getBoundingClientRect().top - scrollerTop + scrolled;
        view.style.setProperty("--ec-header-offset", `${Math.max(0, Math.ceil(top - restingTop))}px`);
        view.style.setProperty("--ec-tabs-height", `${view.querySelector(".editorsChoiceSettingsHeader").offsetHeight}px`);
        view.style.setProperty("--ec-settings-bg", findBackground(form));
    }

    /* ===== Unsaved changes ===== */

    function controlKey(control) {
        if (control.id) return untrackedFields.has(control.id) ? null : control.id;
        const list = control.closest(".checkboxList");
        return list && control.dataset.id ? `${list.id}:${control.dataset.id}` : null;
    }

    function controlValue(control) {
        return control.type === "checkbox" || control.type === "radio" ? control.checked : control.value;
    }

    function trackedControls() {
        return Array.from(form.querySelectorAll("input, select, textarea")).filter((control) => controlKey(control));
    }

    // Records the current value of every control not yet tracked. Lists that
    // render later (libraries, collections) join the baseline as they appear.
    function captureBaseline(reset = false) {
        if (reset) state.baseline = new Map();
        for (const control of trackedControls()) {
            const key = controlKey(control);
            if (!state.baseline.has(key)) state.baseline.set(key, controlValue(control));
        }
        refreshDirtyState();
    }

    function refreshDirtyState() {
        if (!state.loaded) return;
        const dirtyTabs = new Set();
        for (const control of trackedControls()) {
            const key = controlKey(control);
            if (state.baseline.has(key) && state.baseline.get(key) !== controlValue(control)) {
                dirtyTabs.add(control.closest("[data-tab-panel]")?.dataset.tabPanel);
            }
        }
        const names = [];
        for (const tab of tabs) {
            const dirty = dirtyTabs.has(tab.dataset.tab);
            tab.classList.toggle("editorsChoiceTab--dirty", dirty);
            tab.querySelector(".editorsChoiceTabStatus").textContent = dirty ? " (unsaved changes)" : "";
            if (dirty) names.push(tab.firstChild.textContent.trim());
        }
        const status = field("EditorsChoiceSaveStatus");
        status.textContent = names.length ? `Unsaved changes in ${names.join(", ")}` : "All changes saved";
        status.classList.toggle("editorsChoiceSaveStatus--dirty", names.length > 0);
        field("EditorsChoiceDiscard").disabled = names.length === 0;
    }

    function discardChanges() {
        restoreMediaOption("OpeningSlideMediaId", state.config?.OpeningSlideMediaId, state.config?.OpeningSlideMediaName);
        restoreMediaOption("OpeningSlideBackgroundItemId", state.config?.OpeningSlideBackgroundItemId, state.config?.OpeningSlideBackgroundItemName);
        orderMetadataFields(String(state.baseline.get("HeroMetadataOrder") || "").split(","));
        for (const control of trackedControls()) {
            const key = controlKey(control);
            if (!state.baseline.has(key)) continue;
            if (control.type === "checkbox" || control.type === "radio") control.checked = state.baseline.get(key);
            else control.value = state.baseline.get(key);
        }
        syncMetadataOrder();
        validateCustomCss();
        updateConditionalVisibility();
        loadModeData(getSelectedMode()).catch((error) => showError("The data for this Editor's Choice mode could not be loaded.", error));
    }

    /* ===== Metadata fields ===== */

    function renderMetadataFields(selected) {
        const chosen = normalizeMetadataFields(selected);
        const order = [...chosen, ...Object.keys(metadataFieldLabels).filter((key) => !chosen.includes(key))];
        field("HeroMetadataFieldList").innerHTML = order.map((key) => {
            const label = metadataFieldLabels[key];
            const checked = chosen.includes(key) ? " checked" : "";
            return `<li data-metadata-field="${key}"><label class="emby-checkbox-label"><input is="emby-checkbox" type="checkbox" id="HeroMetadataField-${key}"${checked}><span class="checkboxLabel">${escapeHtml(label)}</span></label><button type="button" is="paper-icon-button-light" class="paper-icon-button-light" data-move="-1" aria-label="Move ${escapeHtml(label)} up"><span class="material-icons arrow_upward" aria-hidden="true"></span></button><button type="button" is="paper-icon-button-light" class="paper-icon-button-light" data-move="1" aria-label="Move ${escapeHtml(label)} down"><span class="material-icons arrow_downward" aria-hidden="true"></span></button></li>`;
        }).join("");
        syncMetadataOrder();
    }

    function metadataRows() {
        return Array.from(field("HeroMetadataFieldList").children);
    }

    function orderMetadataFields(order) {
        const list = field("HeroMetadataFieldList");
        for (const key of order) {
            const row = list.querySelector(`[data-metadata-field="${key}"]`);
            if (row) list.append(row);
        }
    }

    function syncMetadataOrder() {
        const rows = metadataRows();
        rows.forEach((row, index) => {
            row.querySelector('[data-move="-1"]').disabled = index === 0;
            row.querySelector('[data-move="1"]').disabled = index === rows.length - 1;
        });
        field("HeroMetadataOrder").value = rows.map((row) => row.dataset.metadataField).join(",");
    }

    function selectedMetadataFields() {
        return metadataRows()
            .filter((row) => row.querySelector("input").checked)
            .map((row) => row.dataset.metadataField);
    }

    function moveMetadataField(event) {
        const button = event.target.closest("[data-move]");
        if (!button) return;
        const row = button.closest("li");
        if (button.dataset.move === "-1") row.previousElementSibling?.before(row);
        else row.nextElementSibling?.after(row);
        syncMetadataOrder();
        (button.disabled ? row.querySelector("input") : button).focus();
        updateConditionalVisibility();
    }

    function validateCustomCss() {
        const input = field("HeroCustomCss");
        input.setCustomValidity(customCssIsBalanced(input.value)
            ? ""
            : "Check the braces: every { needs a matching } and comments and quotes must be closed.");
    }

    /* ===== Animation curve ===== */

    function easingPoints() {
        return clampEasingPoints(easingFields.map((id) => Number.parseFloat(field(id).value)));
    }

    function setEasingPoints(points) {
        clampEasingPoints(points).forEach((value, index) => {
            field(easingFields[index]).value = String(Math.round(value * 100) / 100);
        });
    }

    function easingCss() {
        return `cubic-bezier(${easingPoints().map((value) => Math.round(value * 1000) / 1000).join(", ")})`;
    }

    // The graph maps time (x) and progress (y) from 0–1 onto 0–200 SVG units,
    // growing vertically when a handle overshoots.
    function renderEasingEditor() {
        const [x1, y1, x2, y2] = easingPoints();
        const svg = field("TransitionEasingGraph");
        const top = Math.max(1, y1, y2);
        const bottom = Math.min(0, y1, y2);
        svg.setAttribute("viewBox", `-12 ${(1 - top) * 200 - 12} 224 ${(top - bottom) * 200 + 24}`);
        const round = (value) => Math.round(value * 100) / 100;
        const point = (x, y) => [round(x * 200), round((1 - y) * 200)];
        const [h1x, h1y] = point(x1, y1);
        const [h2x, h2y] = point(x2, y2);
        svg.querySelector(".editorsChoiceEasingCurve").setAttribute("d", `M0 200 C${h1x} ${h1y} ${h2x} ${h2y} 200 0`);
        for (const [arm, [x, y], [ax, ay]] of [[1, [0, 200], [h1x, h1y]], [2, [200, 0], [h2x, h2y]]]) {
            const line = svg.querySelector(`[data-arm="${arm}"]`);
            line.setAttribute("x1", x);
            line.setAttribute("y1", y);
            line.setAttribute("x2", ax);
            line.setAttribute("y2", ay);
        }
        for (const [handle, x, y, cx, cy] of [["1", x1, y1, h1x, h1y], ["2", x2, y2, h2x, h2y]]) {
            const circle = svg.querySelector(`[data-handle="${handle}"]`);
            circle.setAttribute("cx", cx);
            circle.setAttribute("cy", cy);
            circle.setAttribute("aria-valuetext", `time ${x}, progress ${y}`);
        }
        field("TransitionEasingValue").textContent = easingCss();
    }

    function playEasingDemo() {
        easingDemo?.cancel();
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        easingDemo = view.querySelector(".editorsChoiceEasingDemo span").animate(
            [{ left: "-0.5rem" }, { left: "calc(100% - 0.5rem)" }],
            { duration: boundedNumber("TransitionDurationMs", 0, 0, 3000) || 650, easing: easingCss(), fill: "forwards" });
    }

    // Editing a template's curve turns it into a custom curve.
    function customizeEasing(points) {
        if (points) setEasingPoints(points);
        field("TransitionEasing").value = "custom";
        updateConditionalVisibility();
    }

    function moveEasingHandle(handle, x, y) {
        const points = easingPoints();
        const offset = handle === "1" ? 0 : 2;
        points[offset] = x;
        points[offset + 1] = y;
        customizeEasing(points);
    }

    function easingPointFromEvent(event) {
        const matrix = field("TransitionEasingGraph").getScreenCTM();
        if (!matrix) return null;
        const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
        return [point.x / 200, 1 - point.y / 200];
    }

    function bindEasingHandle(circle) {
        const handle = circle.dataset.handle;
        circle.addEventListener("pointerdown", (event) => {
            event.preventDefault();
            circle.setPointerCapture(event.pointerId);
            circle.classList.add("is-dragging");
            circle.focus();
        });
        circle.addEventListener("pointermove", (event) => {
            if (!circle.hasPointerCapture(event.pointerId)) return;
            const point = easingPointFromEvent(event);
            if (point) moveEasingHandle(handle, ...point);
        });
        const release = (event) => {
            if (!circle.hasPointerCapture(event.pointerId)) return;
            circle.releasePointerCapture(event.pointerId);
            circle.classList.remove("is-dragging");
            playEasingDemo();
        };
        circle.addEventListener("pointerup", release);
        circle.addEventListener("pointercancel", release);
        circle.addEventListener("keydown", (event) => {
            const step = event.shiftKey ? 0.1 : 0.01;
            const [dx, dy] = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }[event.key] || [];
            if (dx === undefined) return;
            event.preventDefault();
            const points = easingPoints();
            const offset = handle === "1" ? 0 : 2;
            moveEasingHandle(handle, points[offset] + dx, points[offset + 1] + dy);
        });
    }

    function updateConditionalVisibility() {
        const openingType = field("OpeningSlideType").value;
        const backgroundType = field("OpeningSlideBackgroundType").value;
        setVisible("OpeningSlideMessage-container", openingType === "message");
        setVisible("OpeningSlideMedia-container", openingType === "media");
        setVisible("OpeningSlideContinue-container", openingType !== "none");
        setVisible("OpeningSlideBackgroundMedia-container", openingType === "message" && backgroundType === "media");
        setVisible("OpeningSlideBackgroundUrl-container", openingType === "message" && backgroundType === "url");
        setVisible("OpeningSlidePrimaryButtonStyle-container", openingType === "message" && field("OpeningSlideUseCustomButtonStyles").checked);
        setVisible("OpeningSlideSecondaryButtonStyle-container", openingType === "message" && field("OpeningSlideUseCustomButtonStyles").checked);
        setVisible("PlayButtonText-container", field("ShowPlayButton").checked);
        setVisible("PlayButtonColors-container", field("ShowPlayButton").checked && field("UseCustomPlayButtonColors").checked);
        field("OpeningSlideMediaId").required = openingType === "media";
        field("OpeningSlideBackgroundItemId").required = openingType === "message" && backgroundType === "media";
        setVisible("SelectionRefreshMinutes-container", field("EnableSelectionCache").checked);
        const mode = getSelectedMode();
        const mixed = mode === "MIXED";
        setVisible("MixedSources-container", mixed);
        setVisible("RandomMediaCount-container", !mixed);
        setVisible("EditorUserId-container", mode === "FAVOURITES" || (mixed && mixedCount("MixedFavouritesCount")));
        setVisible("LibraryList-container", mode === "RANDOM"
            || (mixed && (mixedCount("MixedRandomCount") || field("MixedFillWithRandom").checked)));
        setVisible("CollectionsList-container", mode === "COLLECTIONS" || (mixed && mixedCount("MixedCollectionsCount")));
        setVisible("NewTimeLimit-container", mode === "NEW" || (mixed && mixedCount("MixedNewCount")));
        setVisible("AutoplayInterval-container", field("EnableAutoplay").checked);
        setVisible("ShowAutoplayButton-container", field("EnableAutoplay").checked);
        setVisible("PauseOnHover-container", field("EnableAutoplay").checked);
        const heightMode = field("BannerHeightMode").value;
        const mobileMode = field("MobileBannerHeightMode").value;
        setVisible("BannerHeight-container", heightMode === "preset");
        setVisible("BannerCustomHeight-container", heightMode === "pixels");
        setVisible("BannerViewportHeight-container", heightMode === "viewport");
        setVisible("MobileBannerCustomHeight-container", mobileMode === "pixels");
        setVisible("MobileBannerViewportHeight-container", mobileMode === "viewport");
        setVisible("BannerSubtractHeader-container", heightMode === "fullscreen" || mobileMode === "fullscreen");
        setVisible("BackgroundDimmingPercent-container", field("EnableBackgroundDimming").checked);
        setVisible("TransitionDurationMs-container", field("TransitionEffectSelect").value !== "instant");
        setVisible("TransitionEasing-container", field("TransitionEffectSelect").value !== "instant");
        renderEasingEditor();
        setVisible("HeroPosterSize-container", field("HeroPosterMode").value !== "hidden");
        setVisible("HeroCornerRadius-container", field("HeroFrameStyle").value === "inset");
        setVisible("HeroBackdropFocus-container", field("HeroBackdropPositionSelect").value === "custom");
        setVisible("HeroScrimOptions-container", field("HeroScrimStyle").value !== "none");
        setVisible("HeroAccentColor-container", field("UseHeroAccentColor").checked);
        setVisible("HeroTextColors-container", field("UseCustomTextColors").checked);
        setVisible("HeroMaxGenres-container", !!field("HeroMetadataField-genres")?.checked);
        setVisible("HeroDescriptionOptions-container", field("ShowDesc").checked);
        setVisible("BackgroundMotionIntensity-container", field("EnableBackgroundMotion").checked);
        setVisible("ThemeVideoStartDelaySeconds-container", field("EnableThemeVideos").checked);
        setVisible("HeroIndicatorPosition-container", !["none", "progress"].includes(field("HeroIndicatorStyle").value));
        setVisible("HeroArrowStyle-container", field("ShowNavigationArrows").checked);
        updatePreview();
        refreshDirtyState();
    }

    /* ===== Preview ===== */

    function previewBannerHeight(mobile) {
        const override = mobile && field("MobileBannerHeightMode").value !== "inherit";
        const prefix = override ? "MobileBanner" : "Banner";
        const mode = field(prefix + "HeightMode").value;
        const viewport = mobile ? 844 : 900;
        const height = mode === "pixels" ? boundedNumber(prefix + "CustomHeight", 600, 240, 2160)
            : mode === "viewport" ? viewport * boundedNumber(prefix + "ViewportHeight", 75, 25, 100) / 100
            : mode === "fullscreen" ? viewport - (field("BannerSubtractHeader").checked ? 80 : 0)
            : boundedNumber("BannerHeightSelect", 360, 1, 2160) + 120;
        return { height, mode };
    }

    function hexToRgb(hex) {
        const value = Number.parseInt(hex.slice(1), 16);
        return `${value >> 16 & 255}, ${value >> 8 & 255}, ${value & 255}`;
    }

    function scrimBackground(style, alignment, rgb, strength) {
        const color = (alpha) => `rgba(${rgb}, ${(alpha * strength).toFixed(3)})`;
        const clear = `rgba(${rgb}, 0)`;
        if (style === "none") return "none";
        if (style === "bottom") return `linear-gradient(0deg, ${color(0.95)} 0%, ${color(0.5)} 38%, ${clear} 75%)`;
        if (style === "vignette") return `radial-gradient(ellipse at center, ${clear} 30%, ${color(0.9)} 100%)`;
        if (alignment === "center") return `linear-gradient(90deg, ${color(0.22)}, ${color(0.78)} 50%, ${color(0.22)})`;
        if (style === "side") {
            return `linear-gradient(${alignment === "right" ? 270 : 90}deg, ${color(0.92)} 0%, ${color(0.6)} 38%, ${clear} 72%)`;
        }
        // Automatic uses the banner's defaults for artwork of average brightness.
        return `linear-gradient(${alignment === "right" ? 225 : 135}deg, ${color(0.95)} 0%, ${color(0.85)} 15%, ${color(0.55)} 30%, ${color(0.25)} 50%, ${color(0.08)} 65%, ${clear} 80%)`;
    }

    function formatRuntime(minutes) {
        if (!Number.isFinite(minutes) || minutes <= 0) return "";
        const hours = Math.floor(minutes / 60);
        const remainder = Math.round(minutes % 60);
        if (!hours) return `${remainder}m`;
        return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
    }

    function previewMetadata(item) {
        const endMinutes = item.resume?.remainingMinutes || (item.type === "Movie" ? item.runtimeMinutes : 0);
        const values = {
            type: item.type ? escapeHtml(item.type) : "",
            rating: item.rating > 0 ? `<span class="material-icons star" aria-hidden="true" style="color:#f2b01e;font-size:1em;margin-right:.25em"></span>${Number(item.rating).toFixed(1)}` : "",
            critic: item.critic > 0 ? `<span class="material-icons thumb_up" aria-hidden="true" style="font-size:1em;margin-right:.25em"></span>${Math.round(item.critic)}%` : "",
            year: item.year ? String(item.year) : "",
            runtime: item.type === "Movie" ? formatRuntime(item.runtimeMinutes)
                : item.episodes ? `${item.episodes} episodes` : "",
            official: item.official ? escapeHtml(item.official) : "",
            genres: item.genres?.length ? escapeHtml(item.genres.slice(0, boundedNumber("HeroMaxGenres", 2, 1, 5, true)).join(", ")) : "",
            ends: endMinutes > 0
                ? "Ends at " + new Date(Date.now() + endMinutes * 60000).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
                : "",
        };
        return selectedMetadataFields().map((key) => values[key]).filter(Boolean);
    }

    function previewButton(label, icon, style, iconOnly = false) {
        const iconMarkup = icon ? `<span class="material-icons ${icon}" aria-hidden="true"></span>` : "";
        const text = iconOnly ? "" : `<span>${escapeHtml(label)}</span>`;
        const className = `editorsChoicePreviewButton${iconOnly ? " editorsChoicePreviewButton--icon" : ""}`;
        return `<span class="${className}" style="${style}">${iconMarkup}${text}</span>`;
    }

    function updatePreview() {
        previewAnimation?.cancel();
        const mobile = state.previewDevice === "mobile";
        const { height, mode } = previewBannerHeight(mobile);
        const width = mobile ? 390 : 1440;
        const customHeight = mode !== "preset";
        const preview = field("BannerPreview");
        const part = (name) => preview.querySelector(`.editorsChoicePreview${name}`);
        field("BannerPreviewStage").classList.toggle("editorsChoicePreviewStage--mobile", mobile);
        field("BannerPreviewDesktop").setAttribute("aria-pressed", String(!mobile));
        field("BannerPreviewMobile").setAttribute("aria-pressed", String(mobile));
        preview.style.aspectRatio = `${width} / ${Math.round(height)}`;
        // Pixel values in the real banner shrink by this factor in the preview.
        const scale = (preview.clientWidth || 440) / width;

        const openingType = state.activeTab === "opening" ? field("OpeningSlideType").value : "none";
        const message = openingType === "message";
        const sample = state.previewItems[state.previewIndex % state.previewItems.length];
        const selectedTitle = field("OpeningSlideMediaId").selectedOptions[0]?.textContent;
        const item = openingType === "media" && field("OpeningSlideMediaId").value
            ? { ...sample, name: selectedTitle, logoUrl: "", tagline: "", description: "Artwork and details come from Jellyfin." }
            : sample;

        // Layout
        const desktopAlignment = field("HeroContentAlignment").value;
        const mobileAlignment = field("MobileContentAlignment").value;
        const alignment = message ? field("OpeningSlideAlignment").value
            : mobile && mobileAlignment !== "inherit" ? mobileAlignment : desktopAlignment;
        const vertical = message ? "center" : field("HeroContentVerticalPosition").value;
        const inset = field("HeroFrameStyle").value === "inset";
        preview.dataset.frame = inset ? "inset" : "bleed";
        preview.style.borderRadius = inset ? `${boundedNumber("HeroCornerRadius", 16, 0, 32) * scale}px` : "";
        part("HeaderBar").hidden = customHeight;

        const content = part("Content");
        const info = part("Info");
        const poster = part("Poster");
        const posterMode = field("HeroPosterMode").value;
        const showPoster = !message && posterMode !== "hidden" && !(mobile && field("MobileHidePoster").checked);
        const posterRight = posterMode === "right";
        const maxWidth = Number(field("HeroContentMaxWidth").value);
        const textColumn = mobile ? "minmax(0, 1fr)" : maxWidth >= 30 ? `minmax(0, ${maxWidth}%)` : "minmax(0, min(40.6em, 100%))";
        content.style.top = `${(customHeight ? 30 : 120) / height * 100}%`;
        content.style.bottom = `${30 / height * 100}%`;
        content.style.left = content.style.right = mobile ? "5.2%" : "3.3%";
        content.style.columnGap = mobile ? ".85em" : "2.5em";
        content.style.gridTemplateColumns = showPoster ? (posterRight ? `${textColumn} auto` : `auto ${textColumn}`) : textColumn;
        content.style.justifyContent = { center: "center", right: "end" }[alignment] || "start";
        content.style.alignItems = { top: "start", bottom: "end" }[vertical] || "center";
        poster.hidden = !showPoster;
        poster.style.order = posterRight ? "2" : "";
        poster.style.alignSelf = content.style.alignItems;
        const posterSize = field("HeroPosterSize").value;
        const posterHeights = mobile
            ? { small: ["50%", "80%", "7.8em", "9.5em"], medium: ["65%", "100%", "9.87em", "12em"], large: ["80%", "100%", "11.7em", "14.5em"] }
            : { small: ["60%", "80%", "25.2em", "29em"], medium: ["75%", "100%", "32.4em", "37.5em"], large: ["88%", "100%", "39.6em", "45em"] };
        const [presetShare, customShare, viewportLimit, absoluteLimit] = posterHeights[posterSize] || posterHeights.medium;
        poster.style.height = `min(${customHeight ? customShare : presetShare}, ${viewportLimit}, ${absoluteLimit})`;
        poster.style.backgroundImage = item.posterUrl ? `url("${item.posterUrl.replaceAll('"', "%22")}")` : item.scene || "";
        poster.style.backgroundSize = item.posterUrl ? "cover" : "300% 170%";
        info.style.height = customHeight ? "100%" : mobile ? "82%" : "75%";
        info.style.justifyContent = { top: "flex-start", bottom: "flex-end" }[vertical] || "center";
        info.style.alignItems = { center: "center", right: "flex-end" }[alignment] || "stretch";
        info.style.textAlign = alignment;
        const main = part("Main");
        main.style.alignItems = info.style.alignItems;

        // Backdrop
        const backdrop = part("Backdrop");
        let backdropUrl = "";
        if (message) {
            const backgroundType = field("OpeningSlideBackgroundType").value;
            backdropUrl = backgroundType === "url" ? field("OpeningSlideBackgroundUrl").value
                : backgroundType === "media" && field("OpeningSlideBackgroundItemId").value
                    ? ApiClient.getUrl(`Items/${field("OpeningSlideBackgroundItemId").value}/Images/Backdrop/0`)
                    : "";
        } else {
            backdropUrl = item.images?.[field("HeroBackdropImageType").value] || item.images?.Backdrop || "";
        }
        backdrop.style.backgroundImage = backdropUrl ? `url("${backdropUrl.replaceAll('"', "%22")}")`
            : message ? openingGradient : item.scene || "";
        backdrop.style.backgroundSize = backdropUrl || message ? "cover" : "170% 170%";
        const position = field("HeroBackdropPositionSelect").value;
        backdrop.style.backgroundPosition = position === "custom"
            ? `${boundedNumber("HeroBackdropFocusX", 50, 0, 100)}% ${boundedNumber("HeroBackdropFocusY", 50, 0, 100)}%`
            : { top: "center top", bottom: "center bottom" }[position] || "center";
        const blur = boundedNumber("HeroBackdropBlur", 0, 0, 20);
        const brightness = boundedNumber("HeroBackdropBrightness", 100, 50, 150);
        const saturation = boundedNumber("HeroBackdropSaturation", 100, 0, 150);
        backdrop.style.filter = `blur(${(blur * scale).toFixed(2)}px) brightness(${brightness}%) saturate(${saturation}%)`;
        backdrop.style.inset = blur ? `${(-2 * blur * scale).toFixed(2)}px` : "";
        const scrimStyle = field("HeroScrimStyle").value;
        part("Scrim").style.background = scrimBackground(
            scrimStyle,
            alignment,
            hexToRgb(normalizeColor(field("HeroScrimColor").value, "#000000")),
            boundedNumber("HeroScrimStrength", 100, 0, 100) / 100);
        part("Dimming").style.background = field("EnableBackgroundDimming").checked
            ? `rgba(0, 0, 0, ${boundedNumber("BackgroundDimmingPercent", 30, 0, 100) / 100})` : "";

        // Title
        const titleScale = { small: 0.8, large: 1.25, xlarge: 1.5 }[field("HeroTitleSize").value] || 1;
        const titleDisplay = field("HeroTitleDisplay").value;
        const hasLogo = !message && !!item.logoUrl;
        const showLogo = hasLogo && titleDisplay !== "title";
        const customColors = field("UseCustomTextColors").checked;
        const titleColor = customColors ? field("HeroTitleColor").value : "";
        const textColor = customColors ? field("HeroTextColor").value : "";
        const logo = part("Logo");
        logo.hidden = !showLogo;
        if (showLogo && logo.getAttribute("src") !== item.logoUrl) logo.src = item.logoUrl;
        logo.style.height = `${(mobile ? 3.75 : 5) * titleScale}em`;
        logo.style.width = `min(${18.75 * titleScale}em, 100%)`;
        logo.style.objectPosition = { center: "center", right: "right center" }[alignment] || "left center";
        const title = part("Title");
        title.hidden = showLogo;
        title.textContent = message ? field("OpeningSlideTitle").value || "Your headline" : item.name;
        title.style.fontSize = `${1.8 * titleScale}em`;
        title.style.height = `${(mobile ? 3.75 : 5) / 1.8}em`;
        title.style.justifyContent = { center: "center", right: "flex-end" }[alignment] || "";
        title.style.fontFamily = (fonts[field("TitleFont").value] || fonts.default)[1];
        title.style.color = titleColor;
        const subtitle = part("Subtitle");
        subtitle.hidden = !(showLogo && titleDisplay === "both");
        subtitle.textContent = item.name;
        subtitle.style.fontSize = `${1.15 * titleScale}em`;
        subtitle.style.color = titleColor;
        const tagline = part("Tagline");
        tagline.hidden = message || !field("ShowTagline").checked || !item.tagline;
        tagline.textContent = item.tagline || "";
        tagline.style.color = textColor;
        const shadow = { soft: "0 1px 6px rgba(0, 0, 0, .55)", strong: "0 2px 3px rgba(0, 0, 0, .9), 0 0 18px rgba(0, 0, 0, .6)" }[field("HeroTextShadow").value];
        main.style.textShadow = shadow || "";
        logo.style.filter = shadow ? `drop-shadow(${shadow.split(", ")[0]})` : "";

        // Metadata and description
        const meta = part("Meta");
        const metadata = message ? [escapeHtml(field("OpeningSlideEyebrow").value || "Welcome")] : previewMetadata(item);
        meta.dataset.separator = message ? "pill" : field("HeroMetadataSeparator").value;
        meta.innerHTML = metadata.map((value) => `<span>${value}</span>`).join("");
        meta.hidden = !metadata.length;
        meta.style.justifyContent = title.style.justifyContent;
        meta.style.textTransform = message ? "uppercase" : "";
        meta.style.letterSpacing = message ? ".14em" : "";
        meta.style.fontFamily = (fonts[field("MetadataFont").value] || fonts.default)[1];
        meta.style.color = textColor;
        const description = part("Description");
        const lines = boundedNumber("HeroOverviewMaxLines", 4, 1, 8, true);
        description.textContent = message ? field("OpeningSlideBody").value || "Your message" : item.description;
        description.hidden = !message && (!field("ShowDesc").checked || (mobile && field("MobileHideDescription").checked) || !item.description);
        description.style.webkitLineClamp = String(lines);
        description.style.maxHeight = `${1.45 * lines}em`;
        description.style.fontSize = { small: ".9em", large: "1.12em" }[field("HeroOverviewSize").value] || "";
        description.style.fontFamily = (fonts[field("DescriptionFont").value] || fonts.default)[1];
        description.style.color = textColor;

        // Buttons
        const accent = field("UseHeroAccentColor").checked ? field("HeroAccentColor").value : "";
        preview.style.setProperty("--ec-preview-accent", accent || "");
        const themeAccent = getComputedStyle(view).getPropertyValue("--ec-accent").trim() || "#00a4dc";
        const variant = field("HeroButtonVariant").value;
        const radius = { rounded: ".6em", pill: "999px", square: "0" }[field("HeroButtonShape").value] || ".2em";
        const baseStyle = `border-radius:${radius};font-family:${(fonts[field("ButtonFont").value] || fonts.default)[1]}`;
        const primaryBackground = field("UseCustomPlayButtonColors").checked ? field("PlayButtonBackgroundColor").value : accent || themeAccent;
        const primaryText = field("UseCustomPlayButtonColors").checked ? field("PlayButtonTextColor").value : "#fff";
        const customPrimary = field("UseCustomPlayButtonColors").checked;
        const primaryStyle = variant === "outline" && !customPrimary
            ? `${baseStyle};background:transparent;border:2px solid ${accent || "#fff"}`
            : variant === "glass" && !customPrimary
                ? `${baseStyle};background:rgba(255,255,255,.24);border-color:rgba(255,255,255,.26)`
                : `${baseStyle};background:${primaryBackground};color:${primaryText}`;
        const secondaryStyle = variant === "outline"
            ? `${baseStyle};background:transparent;border:2px solid rgba(255,255,255,.72)`
            : `${baseStyle};background:rgba(255,255,255,.16);border-color:rgba(255,255,255,.2)`;
        let actions = "";
        if (message) {
            const customStyles = field("OpeningSlideUseCustomButtonStyles").checked;
            const openingStyle = (prefix, fallback) => customStyles
                ? `${baseStyle};background:${field(prefix + "BackgroundColor").value};color:${field(prefix + "TextColor").value};opacity:${boundedNumber(prefix + "Opacity", 100, 0, 100) / 100}`
                : fallback;
            if (field("OpeningSlidePrimaryButtonText").value) {
                actions += previewButton(field("OpeningSlidePrimaryButtonText").value, "arrow_forward", openingStyle("OpeningSlidePrimaryButton", primaryStyle));
            }
            if (field("OpeningSlideSecondaryButtonText").value) {
                actions += previewButton(field("OpeningSlideSecondaryButtonText").value, "help_outline", openingStyle("OpeningSlideSecondaryButton", secondaryStyle));
            }
        } else {
            if (field("ShowPlayButton").checked) {
                const resume = item.resume;
                const label = resume ? resume.label : field("PlayButtonText").value || "Watch Now";
                const progress = resume && field("ShowResumeProgress").checked
                    ? `<span class="editorsChoicePreviewProgressTrack"><span style="width:${resume.percent}%"></span></span>` : "";
                actions += `<span style="position:relative">${previewButton(label, "play_arrow", primaryStyle)}${progress}</span>`;
            }
            if (field("ShowTrailerButton").checked) actions += previewButton("Trailer", "movie", secondaryStyle);
            if (field("ShowInfoButton").checked) actions += previewButton("More information", "info", secondaryStyle, true);
        }
        const actionBar = part("Actions");
        actionBar.innerHTML = actions;
        actionBar.hidden = !actions;
        info.style.paddingBottom = actions ? "" : "0";
        actionBar.style.fontSize = { small: ".88em", large: "1.15em" }[field("HeroButtonSize").value] || "";
        const centeredActions = alignment === "center" || (mobile && alignment === "left");
        actionBar.style.left = alignment === "right" ? "auto" : centeredActions ? "50%" : "0";
        actionBar.style.right = alignment === "right" ? "0" : "auto";
        actionBar.style.transform = centeredActions ? "translateX(-50%)" : "";

        // Navigation
        const autoplay = field("EnableAutoplay").checked;
        let indicator = field("HeroIndicatorStyle").value;
        if (indicator === "progress" && !autoplay) indicator = "dots";
        const showArrows = field("ShowNavigationArrows").checked;
        const controls = part("Controls");
        controls.dataset.style = field("HeroArrowStyle").value;
        controls.style.top = customHeight ? ".5em" : "7.5em";
        const controlIcons = [
            showArrows && !mobile ? "chevron_left" : "",
            autoplay && field("ShowAutoplayButton").checked ? "pause" : "",
            showArrows && !mobile ? "chevron_right" : "",
        ].filter(Boolean);
        controls.innerHTML = controlIcons.map((icon) => `<span class="material-icons ${icon}"></span>`).join("");
        controls.hidden = !controlIcons.length;
        const indicatorBar = part("Indicator");
        const total = 5;
        const current = state.previewIndex % total;
        const mobileCounter = mobile && indicator !== "none" && indicator !== "progress";
        indicatorBar.dataset.style = indicator;
        if (mobileCounter || indicator === "counter") {
            const arrows = mobile && showArrows;
            indicatorBar.innerHTML = `${arrows ? '<span class="material-icons chevron_left"></span>' : ""}<span>${current + 1} / ${total}</span>${arrows ? '<span class="material-icons chevron_right"></span>' : ""}`;
        } else if (indicator === "dots" || indicator === "bars") {
            indicatorBar.innerHTML = Array.from({ length: total }, (_, index) => `<i class="${index === current ? "is-active" : ""}"></i>`).join("");
        } else {
            indicatorBar.innerHTML = mobile && showArrows ? '<span class="material-icons chevron_left"></span><span class="material-icons chevron_right"></span>' : "";
        }
        indicatorBar.hidden = !indicatorBar.innerHTML;
        const indicatorPosition = field("HeroIndicatorPosition").value;
        indicatorBar.style.left = indicatorPosition === "left" ? "3.3%" : indicatorPosition === "right" ? "auto" : "50%";
        indicatorBar.style.right = indicatorPosition === "right" ? "3.3%" : "auto";
        indicatorBar.style.transform = indicatorPosition === "center" ? "translateX(-50%)" : "";
        part("Autoplay").hidden = indicator !== "progress";

        const effect = field("TransitionEffectSelect");
        field("BannerPreviewSummary").textContent = `${mobile ? "Mobile" : "Desktop"} · ${Math.round(height)}px${["viewport", "fullscreen"].includes(mode) ? " on this example screen" : ""} · ${effect.selectedOptions[0]?.textContent || "Slide"}`;
    }

    function previewTransition() {
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const effect = field("TransitionEffectSelect").value;
        state.previewIndex++;
        updatePreview();
        if (reduced || effect === "instant") return;
        // One preview surface, so these approximate how the next slide arrives.
        const frames = ["loop", "parallax"].includes(effect) ? [{ transform: "translateX(100%)" }, { transform: "translateX(0)" }]
            : effect === "wipe" ? [{ clipPath: "inset(0 0 0 100%)" }, { clipPath: "inset(0 0 0 0)" }]
            : effect === "zoom" ? [{ opacity: 0, transform: "scale(1.08)" }, { opacity: 1, transform: "scale(1)" }]
            : effect === "dip" ? [{ opacity: 1 }, { opacity: 0, offset: 0.45 }, { opacity: 0, offset: 0.55 }, { opacity: 1 }]
            : effect === "iris" ? [{ clipPath: "circle(0% at 25% 50%)" }, { clipPath: "circle(150% at 25% 50%)" }]
            : [{ opacity: 0 }, { opacity: 1 }];
        previewAnimation = field("BannerPreview").animate(frames, {
            duration: boundedNumber("TransitionDurationMs", 0, 0, 3000) || 650,
            easing: easingCss(),
        });
    }

    function setPreviewDevice(device) {
        state.previewDevice = device;
        updatePreview();
    }

    // Prefer real titles from the library so the preview shows representative artwork.
    async function loadPreviewItems() {
        try {
            const response = await ApiClient.getItems(ApiClient.getCurrentUserId(), {
                Recursive: true,
                IncludeItemTypes: "Movie,Series",
                ImageTypes: "Backdrop",
                SortBy: "Random",
                Limit: 2,
                Fields: "Overview,Genres,Taglines,OfficialRating,CommunityRating,CriticRating,ProductionYear,RunTimeTicks",
            });
            const items = (Array.isArray(response?.Items) ? response.Items : []).filter((item) => item.BackdropImageTags?.length);
            if (!items.length || !view.isConnected) return;
            const image = (item, type, tag, maxWidth) => tag
                ? ApiClient.getUrl(`Items/${item.Id}/Images/${type}/0`, { tag, maxWidth }) : "";
            state.previewItems = items.map((item) => ({
                name: item.Name,
                tagline: item.Taglines?.[0] || "",
                type: item.Type,
                rating: item.CommunityRating,
                critic: item.CriticRating,
                year: item.ProductionYear,
                runtimeMinutes: item.RunTimeTicks ? item.RunTimeTicks / 600000000 : 0,
                official: item.OfficialRating,
                genres: item.Genres || [],
                description: item.Overview || "",
                images: {
                    Backdrop: image(item, "Backdrop", item.BackdropImageTags[0], 1280),
                    Thumb: image(item, "Thumb", item.ImageTags?.Thumb, 1280),
                    Primary: image(item, "Primary", item.ImageTags?.Primary, 1280),
                },
                posterUrl: image(item, "Primary", item.ImageTags?.Primary, 400),
                logoUrl: image(item, "Logo", item.ImageTags?.Logo, 600),
            }));
            field("BannerPreviewSource").textContent = "Uses titles from your library. Artwork cropping and header size depend on the device. Changes apply to the home page after saving and refreshing.";
            updatePreview();
        } catch (error) {
            console.debug("Editor's Choice: preview titles unavailable; using built-in artwork.", error);
        }
    }

    /* ===== Loading and saving ===== */

    function renderCheckboxes(containerId, items, selectedIds) {
        const selected = new Set(Array.isArray(selectedIds) ? selectedIds : []);
        const markup = items.map((item) => {
            const id = escapeHtml(item.Id);
            const name = escapeHtml(item.Name);
            const checked = selected.has(item.Id) ? " checked" : "";
            return `<label class="emby-checkbox-label"><input is="emby-checkbox" type="checkbox" data-id="${id}"${checked}><span class="checkboxLabel">${name}</span></label>`;
        }).join("");
        field(containerId).innerHTML = markup;
        captureBaseline();
    }

    function restoreMediaOption(selectId, id, name) {
        const select = field(selectId);
        select.replaceChildren(new Option("Choose a title", ""));
        if (id) {
            select.add(new Option(name || "Previously selected title", id));
            select.value = id;
        }
    }

    async function searchOpeningMedia(searchId, selectId, buttonId) {
        const query = field(searchId).value.trim();
        if (query.length < 2) {
            Dashboard.alert("Enter at least two characters to search.");
            return;
        }

        const button = field(buttonId);
        button.disabled = true;
        try {
            const response = await ApiClient.getItems(ApiClient.getCurrentUserId(), {
                Recursive: true,
                SearchTerm: query,
                IncludeItemTypes: "Movie,Series",
                SortBy: "SortName",
                SortOrder: "Ascending",
                Limit: 30,
                Fields: "ProductionYear",
            });
            const items = Array.isArray(response?.Items) ? response.Items : [];
            const select = field(selectId);
            select.replaceChildren(new Option(items.length ? "Choose a title" : "No matching titles", ""));
            for (const item of items) {
                const year = item.ProductionYear ? ` (${item.ProductionYear})` : "";
                select.add(new Option(`${item.Name}${year}`, item.Id));
            }
            if (items.length === 1) select.value = items[0].Id;
            updatePreview();
            refreshDirtyState();
        } catch (error) {
            showError("The media search could not be completed.", error);
        } finally {
            button.disabled = false;
        }
    }

    function getUsers() {
        return getCachedReference(ApiClient, "users", () => ApiClient.getUsers());
    }

    function getRootItems() {
        return getCachedReference(ApiClient, "root-items", async () => {
            const data = await ApiClient.getItems();
            return Array.isArray(data?.Items) ? data.Items : [];
        });
    }

    function getParentalRatings() {
        return getCachedReference(ApiClient, "parental-ratings", () => ApiClient.getParentalRatings());
    }

    function getCollections() {
        return getCachedReference(ApiClient, "collections", async () => {
            const rootItems = await getRootItems();
            const collectionParents = rootItems.filter((item) => item.CollectionType === "boxsets");
            const responses = await Promise.all(collectionParents.map(async (parent) => {
                const response = await ApiClient.fetch({
                    dataType: "json",
                    type: "GET",
                    url: ApiClient.getUrl(`/Items?ParentId=${encodeURIComponent(parent.Id)}`),
                });
                const data = await parseFetchResponse(response);
                return Array.isArray(data?.Items) ? data.Items : [];
            }));

            const uniqueCollections = new Map();
            for (const item of responses.flat()) {
                if (item?.Id && !uniqueCollections.has(item.Id)) {
                    uniqueCollections.set(item.Id, item);
                }
            }
            return Array.from(uniqueCollections.values());
        });
    }

    async function loadUsers() {
        if (state.rendered.users) return;

        const users = await getUsers();
        const options = [new Option("None", "none")];
        for (const user of users) {
            if (!user.Policy?.IsDisabled) {
                options.push(new Option(user.Name, user.Id));
            }
        }

        const select = field("EditorUserId");
        select.replaceChildren(...options);
        select.value = state.config?.EditorUserId || "none";
        state.rendered.users = true;
    }

    async function loadLibraries() {
        if (state.rendered.libraries) return;

        const libraryTypes = new Set(["tvshows", "movies", "mixed"]);
        const rootItems = await getRootItems();
        const libraries = rootItems.filter((item) => libraryTypes.has(item.CollectionType));
        renderCheckboxes("LibraryList", libraries, state.config?.FilteredLibraries);
        state.rendered.libraries = true;
    }

    async function loadCollections() {
        if (state.rendered.collections) return;

        const collections = await getCollections();
        renderCheckboxes("CollectionsList", collections, state.config?.SelectedCollections);
        state.rendered.collections = true;
    }

    async function loadRatings() {
        if (state.rendered.ratings) return;

        const allRatings = await getParentalRatings();
        const groupedRatings = new Map();
        for (const rating of allRatings) {
            if (rating.RatingScore == null) continue;

            const score = rating.RatingScore.score;
            const subScore = rating.RatingScore.subScore ?? 0;
            const key = `${score},${subScore}`;
            const existing = groupedRatings.get(key);
            if (existing) {
                existing.Name += `/${rating.Name}`;
            } else {
                groupedRatings.set(key, { Name: rating.Name, Value: key });
            }
        }

        const select = field("MaximumParentRating");
        const options = [new Option("User profile", "-2")];
        for (const rating of groupedRatings.values()) {
            options.push(new Option(rating.Name, rating.Value));
        }
        select.replaceChildren(...options);

        const configuredValue = Number(state.config?.MaximumParentRating) === -2 || state.config?.MaximumParentRating == null
            ? "-2"
            : `${state.config.MaximumParentRating},${state.config.MaximumParentRatingSubscore ?? 0}`;
        select.value = Array.from(select.options).some((option) => option.value === configuredValue)
            ? configuredValue
            : "-2";
        state.rendered.ratings = true;
    }

    async function loadModeData(mode) {
        switch (mode) {
            case "FAVOURITES":
                await loadUsers();
                break;
            case "COLLECTIONS":
                await loadCollections();
                break;
            case "RANDOM":
                await loadLibraries();
                break;
            case "MIXED":
                await Promise.all([loadUsers(), loadCollections(), loadLibraries()]);
                break;
        }
    }

    function applyConfig(config) {
        const mode = normalizeMode(config.Mode);
        config.Mode = mode;
        field("FrontendInjectionMethod").value = config.FrontendInjectionMethod || "automatic";
        field("FavouritesMode").checked = mode === "FAVOURITES";
        field("RandomMode").checked = mode === "RANDOM";
        field("CollectionsMode").checked = mode === "COLLECTIONS";
        field("NewMode").checked = mode === "NEW";
        field("MixedMode").checked = mode === "MIXED";
        field("MixedFavouritesCount").value = config.MixedFavouritesCount ?? 2;
        field("MixedNewCount").value = config.MixedNewCount ?? 2;
        field("MixedCollectionsCount").value = config.MixedCollectionsCount ?? 0;
        field("MixedRandomCount").value = config.MixedRandomCount ?? 1;
        field("MixedOrder").value = ["grouped", "shuffle"].includes(config.MixedOrder) ? config.MixedOrder : "interleave";
        field("MixedFillWithRandom").checked = config.MixedFillWithRandom ?? true;
        field("AvoidRepeats").checked = config.AvoidRepeats ?? true;
        field("RandomMediaCount").value = config.RandomMediaCount;
        field("MinimumRating").value = config.MinimumRating;
        field("MinimumCriticRating").value = config.MinimumCriticRating;
        field("EnableAutoplay").checked = config.EnableAutoplay;
        field("ShowAutoplayButton").checked = config.ShowAutoplayButton ?? true;
        field("ShowNavigationArrows").checked = config.ShowNavigationArrows ?? true;
        field("AutoplayInterval").value = config.AutoplayInterval;
        field("NewTimeLimitSelect").value = config.NewTimeLimit;
        field("ShowDesc").checked = config.ShowDescription;
        field("ShowPlayButton").checked = config.ShowPlayButton;
        field("ReduceImageSize").checked = config.ReduceImageSize;
        field("BannerHeightSelect").value = config.BannerHeight;
        // Preserve non-standard heights from older hand-edited configurations.
        if (!field("BannerHeightSelect").value) {
            field("BannerHeightSelect").add(new Option(`Existing (${config.BannerHeight}px)`, String(config.BannerHeight)));
            field("BannerHeightSelect").value = config.BannerHeight;
        }
        field("BannerHeightMode").value = ["pixels", "viewport", "fullscreen"].includes(config.BannerHeightMode) ? config.BannerHeightMode : "preset";
        field("MobileBannerHeightMode").value = ["pixels", "viewport", "fullscreen"].includes(config.MobileBannerHeightMode) ? config.MobileBannerHeightMode : "inherit";
        for (const [id, [fallback, min, max]] of Object.entries(presentationNumbers)) {
            const value = config[id];
            field(id).value = Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
        }
        for (const [id, fallback] of Object.entries(presentationToggles)) field(id).checked = config[id] ?? fallback;
        for (const [id, options] of Object.entries(presentationChoices)) {
            const value = String(config[id] ?? "");
            field(id).value = options.includes(value) ? value : options[0];
        }
        for (const [id, fallback] of Object.entries(presentationColors)) field(id).value = normalizeColor(config[id], fallback);
        field("TransitionEffectSelect").value = Array.from(field("TransitionEffectSelect").options).some((option) => option.value === config.TransitionEffect)
            ? config.TransitionEffect : "loop";
        const easing = Object.hasOwn(easingPresets, config.TransitionEasing) || config.TransitionEasing === "custom"
            ? config.TransitionEasing : "smooth";
        field("TransitionEasing").value = easing;
        setEasingPoints(easing === "custom"
            ? [config.TransitionEasingX1, config.TransitionEasingY1, config.TransitionEasingX2, config.TransitionEasingY2]
            : easingPresets[easing][1]);
        field("HeroBackdropPositionSelect").value = ["top", "bottom", "custom"].includes(config.HeroBackdropPosition) ? config.HeroBackdropPosition : "center";
        for (const id of fontFields) field(id).value = Object.hasOwn(fonts, config[id]) ? config[id] : "default";
        renderMetadataFields(config.HeroMetadataFields);
        field("HeroCustomCss").value = config.HeroCustomCss || "";
        validateCustomCss();
        field("ShowPlayed").checked = config.ShowPlayed;
        field("PlayButtonText").value = config.PlayButtonText || "";
        field("PlayButtonBackgroundColor").value = normalizeColor(config.PlayButtonBackgroundColor, "#7f5af0");
        field("PlayButtonTextColor").value = normalizeColor(config.PlayButtonTextColor, "#ffffff");
        field("HideOnTvLayout").checked = config.HideOnTvLayout;
        field("OpeningSlideType").value = ["message", "media"].includes(config.OpeningSlideType) ? config.OpeningSlideType : "none";
        field("OpeningSlideContinue").checked = config.OpeningSlideContinue ?? true;
        field("OpeningSlidePreset").value = "custom";
        field("OpeningSlideEyebrow").value = config.OpeningSlideEyebrow || "";
        field("OpeningSlideTitle").value = config.OpeningSlideTitle || "";
        field("OpeningSlideBody").value = config.OpeningSlideBody || "";
        field("OpeningSlideAlignment").value = ["center", "right"].includes(config.OpeningSlideAlignment)
            ? config.OpeningSlideAlignment : "left";
        field("OpeningSlideBackgroundType").value = ["media", "url"].includes(config.OpeningSlideBackgroundType)
            ? config.OpeningSlideBackgroundType : "gradient";
        field("OpeningSlideBackgroundUrl").value = config.OpeningSlideBackgroundUrl || "";
        field("OpeningSlidePrimaryButtonText").value = config.OpeningSlidePrimaryButtonText || "";
        field("OpeningSlidePrimaryButtonUrl").value = config.OpeningSlidePrimaryButtonUrl || "";
        field("OpeningSlideSecondaryButtonText").value = config.OpeningSlideSecondaryButtonText || "";
        field("OpeningSlideSecondaryButtonUrl").value = config.OpeningSlideSecondaryButtonUrl || "";
        field("OpeningSlidePrimaryButtonBackgroundColor").value = normalizeColor(config.OpeningSlidePrimaryButtonBackgroundColor, "#7f5af0");
        field("OpeningSlidePrimaryButtonTextColor").value = normalizeColor(config.OpeningSlidePrimaryButtonTextColor, "#ffffff");
        field("OpeningSlideSecondaryButtonBackgroundColor").value = normalizeColor(config.OpeningSlideSecondaryButtonBackgroundColor, "#20242c");
        field("OpeningSlideSecondaryButtonTextColor").value = normalizeColor(config.OpeningSlideSecondaryButtonTextColor, "#ffffff");
        restoreMediaOption("OpeningSlideMediaId", config.OpeningSlideMediaId, config.OpeningSlideMediaName);
        restoreMediaOption("OpeningSlideBackgroundItemId", config.OpeningSlideBackgroundItemId, config.OpeningSlideBackgroundItemName);
        updateConditionalVisibility();
    }

    function boundedNumber(id, fallback, minimum, maximum, integer = false) {
        const rawValue = field(id).value;
        const value = integer ? Number.parseInt(rawValue, 10) : Number.parseFloat(rawValue);
        return Number.isFinite(value) && value >= minimum && value <= maximum ? value : fallback;
    }

    function selectedIds(containerId) {
        return Array.from(field(containerId).querySelectorAll('input[is="emby-checkbox"]:checked'))
            .map((input) => input.dataset.id)
            .filter(Boolean);
    }

    function applyFormToConfig(config) {
        const mode = getSelectedMode();
        const parentalRatingParts = String(field("MaximumParentRating").value || "-2").split(",");
        const editorUserId = field("EditorUserId").value;

        if (state.rendered.users) {
            config.EditorUserId = editorUserId && editorUserId !== "none" ? editorUserId : null;
        }
        config.FrontendInjectionMethod = field("FrontendInjectionMethod").value;
        config.DoScriptInject = ["automatic", "direct"].includes(config.FrontendInjectionMethod);
        config.FileTransformation = config.FrontendInjectionMethod === "file-transformation";
        config.EnableAutoplay = field("EnableAutoplay").checked;
        config.ShowAutoplayButton = field("ShowAutoplayButton").checked;
        config.ShowNavigationArrows = field("ShowNavigationArrows").checked;
        config.AutoplayInterval = boundedNumber("AutoplayInterval", 10, 1, Number.MAX_SAFE_INTEGER, true);
        config.ShowDescription = field("ShowDesc").checked;
        config.ShowPlayButton = field("ShowPlayButton").checked;
        config.ReduceImageSize = field("ReduceImageSize").checked;
        config.ShowPlayed = field("ShowPlayed").checked;
        config.HideOnTvLayout = field("HideOnTvLayout").checked;
        config.UseHeroLayout = true;
        config.Heading = null;
        for (const id of fontFields) config[id] = field(id).value;
        config.TransitionEffect = field("TransitionEffectSelect").value;
        config.TransitionEasing = field("TransitionEasing").value;
        [config.TransitionEasingX1, config.TransitionEasingY1, config.TransitionEasingX2, config.TransitionEasingY2] = easingPoints();
        config.BannerHeightMode = field("BannerHeightMode").value;
        config.MobileBannerHeightMode = field("MobileBannerHeightMode").value;
        for (const [id, [fallback, min, max]] of Object.entries(presentationNumbers)) {
            config[id] = boundedNumber(id, fallback, min, max, true);
        }
        for (const id of Object.keys(presentationToggles)) config[id] = field(id).checked;
        for (const id of Object.keys(presentationChoices)) config[id] = field(id).value;
        config.HeroContentMaxWidth = Number(config.HeroContentMaxWidth);
        for (const [id, fallback] of Object.entries(presentationColors)) config[id] = normalizeColor(field(id).value, fallback);
        config.HeroMetadataFields = selectedMetadataFields();
        config.HeroCustomCss = field("HeroCustomCss").value.trim();
        config.HeroBackdropPosition = field("HeroBackdropPositionSelect").value;
        config.Mode = mode;
        config.ShowRandomMedia = mode === "RANDOM";
        if (mode !== "MIXED") {
            config.RandomMediaCount = boundedNumber("RandomMediaCount", 5, 1, Number.MAX_SAFE_INTEGER, true);
        }
        for (const id of mixedCountFields) config[id] = boundedNumber(id, 0, 0, 50, true);
        config.MixedOrder = field("MixedOrder").value;
        config.MixedFillWithRandom = field("MixedFillWithRandom").checked;
        config.AvoidRepeats = field("AvoidRepeats").checked;
        config.MinimumRating = boundedNumber("MinimumRating", 0, 0, 10);
        config.MinimumCriticRating = boundedNumber("MinimumCriticRating", 0, 0, 100, true);
        if (state.rendered.ratings) {
            config.MaximumParentRating = Number(parentalRatingParts[0]);
            config.MaximumParentRatingSubscore = Number(parentalRatingParts[1] ?? 0);
        }
        if (state.rendered.libraries) {
            config.FilteredLibraries = selectedIds("LibraryList");
        }
        if (state.rendered.collections) {
            config.SelectedCollections = selectedIds("CollectionsList");
        }
        config.NewTimeLimit = field("NewTimeLimitSelect").value;
        config.BannerHeight = boundedNumber("BannerHeightSelect", 360, 1, Number.MAX_SAFE_INTEGER, true);
        config.PlayButtonText = field("PlayButtonText").value;
        config.PlayButtonBackgroundColor = field("PlayButtonBackgroundColor").value;
        config.PlayButtonTextColor = field("PlayButtonTextColor").value;
        config.OpeningSlideType = field("OpeningSlideType").value;
        config.OpeningSlideContinue = field("OpeningSlideContinue").checked;
        config.OpeningSlideMediaId = field("OpeningSlideMediaId").value || null;
        config.OpeningSlideMediaName = field("OpeningSlideMediaId").value
            ? field("OpeningSlideMediaId").selectedOptions[0]?.textContent || null : null;
        config.OpeningSlideEyebrow = field("OpeningSlideEyebrow").value.trim();
        config.OpeningSlideTitle = field("OpeningSlideTitle").value.trim();
        config.OpeningSlideBody = field("OpeningSlideBody").value.trim();
        config.OpeningSlideAlignment = field("OpeningSlideAlignment").value;
        config.OpeningSlideBackgroundType = field("OpeningSlideBackgroundType").value;
        config.OpeningSlideBackgroundItemId = field("OpeningSlideBackgroundItemId").value || null;
        config.OpeningSlideBackgroundItemName = field("OpeningSlideBackgroundItemId").value
            ? field("OpeningSlideBackgroundItemId").selectedOptions[0]?.textContent || null : null;
        config.OpeningSlideBackgroundUrl = field("OpeningSlideBackgroundUrl").value.trim() || null;
        config.OpeningSlidePrimaryButtonText = field("OpeningSlidePrimaryButtonText").value.trim() || null;
        config.OpeningSlidePrimaryButtonUrl = field("OpeningSlidePrimaryButtonUrl").value.trim() || null;
        config.OpeningSlideSecondaryButtonText = field("OpeningSlideSecondaryButtonText").value.trim() || null;
        config.OpeningSlideSecondaryButtonUrl = field("OpeningSlideSecondaryButtonUrl").value.trim() || null;
        config.OpeningSlidePrimaryButtonBackgroundColor = field("OpeningSlidePrimaryButtonBackgroundColor").value;
        config.OpeningSlidePrimaryButtonTextColor = field("OpeningSlidePrimaryButtonTextColor").value;
        config.OpeningSlideSecondaryButtonBackgroundColor = field("OpeningSlideSecondaryButtonBackgroundColor").value;
        config.OpeningSlideSecondaryButtonTextColor = field("OpeningSlideSecondaryButtonTextColor").value;
        return config;
    }

    async function handleShow() {
        updateStickyLayout();
        window.addEventListener("resize", updateStickyLayout);
        if (state.loaded || state.loading) return;

        state.loading = true;
        Dashboard.showLoadingMsg();
        try {
            const configRequest = ApiClient.getPluginConfiguration(pluginId);
            const ratingsRequest = getParentalRatings();
            state.config = await configRequest;
            applyConfig(state.config);
            await Promise.all([
                ratingsRequest.then(() => loadRatings()),
                loadModeData(state.config.Mode),
            ]);
            state.loaded = true;
            captureBaseline(true);
            loadPreviewItems();
        } catch (error) {
            showError("The Editor's Choice settings could not be loaded.", error);
        } finally {
            state.loading = false;
            Dashboard.hideLoadingMsg();
        }
    }

    async function handleModeChange() {
        updateConditionalVisibility();
        Dashboard.showLoadingMsg();
        try {
            await loadModeData(getSelectedMode());
        } catch (error) {
            showError("The data for this Editor's Choice mode could not be loaded.", error);
        } finally {
            Dashboard.hideLoadingMsg();
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (getSelectedMode() === "MIXED" && !mixedCountFields.some(mixedCount)) {
            selectTab("content");
            Dashboard.alert("Mixed mode needs at least one source with one or more titles.");
            return;
        }
        Dashboard.showLoadingMsg();
        try {
            const config = state.config || await ApiClient.getPluginConfiguration(pluginId);
            state.config = applyFormToConfig(config);
            const result = await ApiClient.updatePluginConfiguration(pluginId, state.config);
            Dashboard.processPluginConfigurationUpdateResult(result);
            captureBaseline(true);
        } catch (error) {
            Dashboard.hideLoadingMsg();
            showError("The Editor's Choice settings could not be saved.", error);
        }
    }

    form.addEventListener("submit", handleSubmit);
    // Validation can fail on a field in a hidden tab; show that tab so the browser
    // can point at the field.
    form.addEventListener("invalid", (event) => {
        const panel = event.target.closest?.("[data-tab-panel]");
        if (panel?.hidden) selectTab(panel.dataset.tabPanel);
    }, true);
    for (const tab of tabs) {
        tab.addEventListener("click", () => selectTab(tab.dataset.tab));
        tab.addEventListener("keydown", handleTabKeydown);
    }
    form.querySelectorAll('input[name="mode"]').forEach((input) => input.addEventListener("change", handleModeChange));
    field("EnableAutoplay").addEventListener("change", updateConditionalVisibility);
    field("HeroCustomCss").addEventListener("input", validateCustomCss);
    field("HeroMetadataFieldList").addEventListener("click", moveMetadataField);
    field("EditorsChoiceDiscard").addEventListener("click", discardChanges);
    form.addEventListener("input", (event) => {
        if (!event.target.matches('input[name="mode"]')) updateConditionalVisibility();
    });
    form.addEventListener("change", (event) => {
        if (!event.target.matches('input[name="mode"]')) updateConditionalVisibility();
    });
    field("PreviewTransition").addEventListener("click", previewTransition);
    field("TransitionEasing").addEventListener("change", () => {
        const preset = easingPresets[field("TransitionEasing").value];
        if (preset) setEasingPoints(preset[1]);
        updateConditionalVisibility();
        playEasingDemo();
    });
    for (const id of easingFields) field(id).addEventListener("input", () => customizeEasing());
    view.querySelectorAll(".editorsChoiceEasingHandle").forEach(bindEasingHandle);
    field("TransitionEasingPlay").addEventListener("click", playEasingDemo);
    field("BannerPreviewDesktop").addEventListener("click", () => setPreviewDevice("desktop"));
    field("BannerPreviewMobile").addEventListener("click", () => setPreviewDevice("mobile"));
    field("OpeningSlidePreset").addEventListener("change", () => {
        const preset = openingSlidePresets[field("OpeningSlidePreset").value];
        if (!preset) return;
        field("OpeningSlideEyebrow").value = preset.eyebrow;
        field("OpeningSlideTitle").value = preset.title;
        field("OpeningSlideBody").value = preset.body;
        field("OpeningSlidePrimaryButtonText").value = preset.primaryText;
        field("OpeningSlidePrimaryButtonUrl").value = preset.primaryUrl;
        field("OpeningSlideSecondaryButtonText").value = preset.secondaryText;
        field("OpeningSlideSecondaryButtonUrl").value = preset.secondaryUrl;
        updateConditionalVisibility();
    });
    field("OpeningSlideMediaSearchButton").addEventListener("click", () =>
        searchOpeningMedia("OpeningSlideMediaSearch", "OpeningSlideMediaId", "OpeningSlideMediaSearchButton"));
    field("OpeningSlideBackgroundSearchButton").addEventListener("click", () =>
        searchOpeningMedia("OpeningSlideBackgroundSearch", "OpeningSlideBackgroundItemId", "OpeningSlideBackgroundSearchButton"));
    for (const [inputId, selectId, buttonId] of [
        ["OpeningSlideMediaSearch", "OpeningSlideMediaId", "OpeningSlideMediaSearchButton"],
        ["OpeningSlideBackgroundSearch", "OpeningSlideBackgroundItemId", "OpeningSlideBackgroundSearchButton"],
    ]) {
        field(inputId).addEventListener("keydown", (event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            searchOpeningMedia(inputId, selectId, buttonId);
        });
    }
    selectTab(readStoredTab() || "content");
    view.addEventListener("viewhide", () => {
        previewAnimation?.cancel();
        easingDemo?.cancel();
        window.removeEventListener("resize", updateStickyLayout);
    });
    view.addEventListener("viewshow", handleShow);
}
