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

export default function (view) {
    const ApiClient = globalThis.ApiClient;
    const Dashboard = globalThis.Dashboard;
    const form = view.querySelector(".editorsChoiceConfigurationForm");
    const state = {
        config: null,
        loaded: false,
        loading: false,
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
    };
    const presentationToggles = {
        EnableSelectionCache: true,
        BannerSubtractHeader: true,
        EnableBackgroundDimming: false,
        EnableBackgroundMotion: true,
        EnableThemeVideos: true,
    };
    let previewAnimation;
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

    function showError(message, error) {
        console.error(message, error);
        Dashboard.alert(message);
    }

    function setVisible(id, visible) {
        field(id).style.display = visible ? "" : "none";
        // Hidden numeric controls must not prevent HTML form validation.
        field(id).querySelectorAll("input, select").forEach((input) => { input.disabled = !visible; });
    }

    function normalizeMode(mode) {
        return ["FAVOURITES", "RANDOM", "COLLECTIONS", "NEW"].includes(mode) ? mode : "RANDOM";
    }

    function getSelectedMode() {
        if (field("FavouritesMode").checked) return "FAVOURITES";
        if (field("CollectionsMode").checked) return "COLLECTIONS";
        if (field("NewMode").checked) return "NEW";
        return "RANDOM";
    }

    function updateConditionalVisibility() {
        const openingType = field("OpeningSlideType").value;
        const backgroundType = field("OpeningSlideBackgroundType").value;
        setVisible("OpeningSlideMessage-container", openingType === "message");
        setVisible("OpeningSlideMedia-container", openingType === "media");
        setVisible("OpeningSlideContinue-container", openingType !== "none");
        setVisible("OpeningSlideBackgroundMedia-container", openingType === "message" && backgroundType === "media");
        setVisible("OpeningSlideBackgroundUrl-container", openingType === "message" && backgroundType === "url");
        field("OpeningSlideMediaId").required = openingType === "media";
        field("OpeningSlideBackgroundItemId").required = openingType === "message" && backgroundType === "media";
        setVisible("SelectionRefreshMinutes-container", field("EnableSelectionCache").checked);
        const mode = getSelectedMode();
        setVisible("EditorUserId-container", mode === "FAVOURITES");
        setVisible("LibraryList-container", mode === "RANDOM");
        setVisible("CollectionsList-container", mode === "COLLECTIONS");
        setVisible("NewTimeLimit-container", mode === "NEW");
        setVisible("AutoplayInterval-container", field("EnableAutoplay").checked);
        setVisible("ShowAutoplayButton-container", field("EnableAutoplay").checked);
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
        updatePreview();
    }

    function updatePreview() {
        previewAnimation?.cancel();
        const mobile = field("BannerPreviewDevice").value === "mobile";
        const override = mobile && field("MobileBannerHeightMode").value !== "inherit";
        const prefix = override ? "MobileBanner" : "Banner";
        const mode = field(prefix + "HeightMode").value;
        const viewport = mobile ? 844 : 900;
        const height = mode === "pixels" ? boundedNumber(prefix + "CustomHeight", 600, 240, 2160)
            : mode === "viewport" ? viewport * boundedNumber(prefix + "ViewportHeight", 75, 25, 100) / 100
            : mode === "fullscreen" ? viewport - (field("BannerSubtractHeader").checked ? 80 : 0)
            : boundedNumber("BannerHeightSelect", 360, 1, 2160) + 120;
        const preview = field("BannerPreview");
        const openingType = field("OpeningSlideType").value;
        const previewTitle = preview.querySelector("strong");
        const previewMetadata = preview.querySelector("small");
        const previewBody = preview.querySelector("span:not(.editorsChoicePreviewButton)");
        const previewButton = preview.querySelector(".editorsChoicePreviewButton");
        const previewScene = preview.querySelector(".editorsChoicePreviewScene");
        if (openingType === "message") {
            previewTitle.textContent = field("OpeningSlideTitle").value || "Your headline";
            previewMetadata.textContent = field("OpeningSlideEyebrow").value || "WELCOME";
            previewBody.textContent = field("OpeningSlideBody").value || "Your message";
            previewButton.textContent = field("OpeningSlidePrimaryButtonText").value || "Optional action";
            previewButton.style.display = field("OpeningSlidePrimaryButtonText").value ? "" : "none";
            const backgroundType = field("OpeningSlideBackgroundType").value;
            const backgroundValue = backgroundType === "url" ? field("OpeningSlideBackgroundUrl").value
                : backgroundType === "media" && field("OpeningSlideBackgroundItemId").value
                    ? ApiClient.getUrl(`Items/${field("OpeningSlideBackgroundItemId").value}/Images/Backdrop/0`)
                    : "";
            previewScene.style.backgroundImage = backgroundValue
                ? `linear-gradient(90deg, rgba(0,0,0,.85), rgba(0,0,0,.12)), url("${backgroundValue.replaceAll('"', "%22")}")`
                : "";
            previewScene.style.backgroundSize = backgroundValue ? "cover" : "";
            previewScene.style.backgroundPosition = backgroundValue ? "center" : "";
        } else {
            const selectedTitle = field("OpeningSlideMediaId").selectedOptions[0]?.textContent;
            previewTitle.textContent = openingType === "media" && field("OpeningSlideMediaId").value ? selectedTitle : "Featured tonight";
            previewMetadata.textContent = "2026 · Series";
            previewBody.textContent = openingType === "media" ? "Artwork and details come from Jellyfin." : "Your next great watch";
            previewButton.textContent = "Watch now";
            previewButton.style.display = "";
            previewScene.style.backgroundImage = "";
            previewScene.style.backgroundSize = "";
            previewScene.style.backgroundPosition = "";
        }
        preview.style.height = Math.round(height / 4) + "px";
        preview.style.maxWidth = mobile ? "240px" : "620px";
        const selectors = ["strong", "small", "span:not(.editorsChoicePreviewButton)", ".editorsChoicePreviewButton"];
        fontFields.forEach((id, index) => {
            preview.querySelector(selectors[index]).style.fontFamily = (fonts[field(id).value] || fonts.default)[1];
        });
        preview.style.setProperty("--preview-dimming", field("EnableBackgroundDimming").checked
            ? boundedNumber("BackgroundDimmingPercent", 30, 0, 100) / 100 : 0);
        const effect = field("TransitionEffectSelect");
        field("BannerPreviewSummary").textContent = `${mobile ? "Mobile" : "Desktop"} · ${Math.round(height)}px${["viewport", "fullscreen"].includes(mode) ? " on this example screen" : ""} · ${effect.selectedOptions[0]?.textContent || "Slide"}`;
    }

    function previewTransition() {
        updatePreview();
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const effect = field("TransitionEffectSelect").value;
        if (effect === "instant") return;
        const frames = effect === "loop" ? [{ transform: "translateX(100%)" }, { transform: "translateX(0)" }]
            : effect === "wipe" ? [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)" }]
            : effect === "zoom" ? [{ opacity: 0, transform: "scale(1.08)" }, { opacity: 1, transform: "scale(1)" }]
            : [{ opacity: 0 }, { opacity: 1 }];
        previewAnimation = field("BannerPreview").animate(frames, {
            duration: boundedNumber("TransitionDurationMs", 0, 0, 3000) || 650,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        });
    }

    function renderCheckboxes(containerId, items, selectedIds) {
        const selected = new Set(Array.isArray(selectedIds) ? selectedIds : []);
        const markup = items.map((item) => {
            const id = escapeHtml(item.Id);
            const name = escapeHtml(item.Name);
            const checked = selected.has(item.Id) ? " checked" : "";
            return `<label class="emby-checkbox-label"><input is="emby-checkbox" type="checkbox" data-id="${id}"${checked}><span class="checkboxLabel">${name}</span></label>`;
        }).join("");
        field(containerId).innerHTML = markup;
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
        field("TransitionEffectSelect").value = ["loop", "fade", "zoom", "wipe", "instant"].includes(config.TransitionEffect) ? config.TransitionEffect : "loop";
        field("HeroBackdropPositionSelect").value = config.HeroBackdropPosition;
        for (const id of fontFields) field(id).value = Object.hasOwn(fonts, config[id]) ? config[id] : "default";
        field("ShowPlayed").checked = config.ShowPlayed;
        field("PlayButtonText").value = config.PlayButtonText || "";
        field("HideOnTvLayout").checked = config.HideOnTvLayout;
        field("OpeningSlideType").value = ["message", "media"].includes(config.OpeningSlideType) ? config.OpeningSlideType : "none";
        field("OpeningSlideContinue").checked = config.OpeningSlideContinue ?? true;
        field("OpeningSlidePreset").value = "custom";
        field("OpeningSlideEyebrow").value = config.OpeningSlideEyebrow || "";
        field("OpeningSlideTitle").value = config.OpeningSlideTitle || "";
        field("OpeningSlideBody").value = config.OpeningSlideBody || "";
        field("OpeningSlideBackgroundType").value = ["media", "url"].includes(config.OpeningSlideBackgroundType)
            ? config.OpeningSlideBackgroundType : "gradient";
        field("OpeningSlideBackgroundUrl").value = config.OpeningSlideBackgroundUrl || "";
        field("OpeningSlidePrimaryButtonText").value = config.OpeningSlidePrimaryButtonText || "";
        field("OpeningSlidePrimaryButtonUrl").value = config.OpeningSlidePrimaryButtonUrl || "";
        field("OpeningSlideSecondaryButtonText").value = config.OpeningSlideSecondaryButtonText || "";
        field("OpeningSlideSecondaryButtonUrl").value = config.OpeningSlideSecondaryButtonUrl || "";
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
        config.BannerHeightMode = field("BannerHeightMode").value;
        config.MobileBannerHeightMode = field("MobileBannerHeightMode").value;
        for (const [id, [fallback, min, max]] of Object.entries(presentationNumbers)) {
            config[id] = boundedNumber(id, fallback, min, max, true);
        }
        for (const id of Object.keys(presentationToggles)) config[id] = field(id).checked;
        config.HeroBackdropPosition = field("HeroBackdropPositionSelect").value;
        config.Mode = mode;
        config.ShowRandomMedia = mode === "RANDOM";
        config.RandomMediaCount = boundedNumber("RandomMediaCount", 5, 1, Number.MAX_SAFE_INTEGER, true);
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
        config.OpeningSlideType = field("OpeningSlideType").value;
        config.OpeningSlideContinue = field("OpeningSlideContinue").checked;
        config.OpeningSlideMediaId = field("OpeningSlideMediaId").value || null;
        config.OpeningSlideMediaName = field("OpeningSlideMediaId").value
            ? field("OpeningSlideMediaId").selectedOptions[0]?.textContent || null : null;
        config.OpeningSlideEyebrow = field("OpeningSlideEyebrow").value.trim();
        config.OpeningSlideTitle = field("OpeningSlideTitle").value.trim();
        config.OpeningSlideBody = field("OpeningSlideBody").value.trim();
        config.OpeningSlideBackgroundType = field("OpeningSlideBackgroundType").value;
        config.OpeningSlideBackgroundItemId = field("OpeningSlideBackgroundItemId").value || null;
        config.OpeningSlideBackgroundItemName = field("OpeningSlideBackgroundItemId").value
            ? field("OpeningSlideBackgroundItemId").selectedOptions[0]?.textContent || null : null;
        config.OpeningSlideBackgroundUrl = field("OpeningSlideBackgroundUrl").value.trim() || null;
        config.OpeningSlidePrimaryButtonText = field("OpeningSlidePrimaryButtonText").value.trim() || null;
        config.OpeningSlidePrimaryButtonUrl = field("OpeningSlidePrimaryButtonUrl").value.trim() || null;
        config.OpeningSlideSecondaryButtonText = field("OpeningSlideSecondaryButtonText").value.trim() || null;
        config.OpeningSlideSecondaryButtonUrl = field("OpeningSlideSecondaryButtonUrl").value.trim() || null;
        return config;
    }

    async function handleShow() {
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
        Dashboard.showLoadingMsg();
        try {
            const config = state.config || await ApiClient.getPluginConfiguration(pluginId);
            state.config = applyFormToConfig(config);
            const result = await ApiClient.updatePluginConfiguration(pluginId, state.config);
            Dashboard.processPluginConfigurationUpdateResult(result);
        } catch (error) {
            Dashboard.hideLoadingMsg();
            showError("The Editor's Choice settings could not be saved.", error);
        }
    }

    form.addEventListener("submit", handleSubmit);
    form.querySelectorAll('input[name="mode"]').forEach((input) => input.addEventListener("change", handleModeChange));
    field("EnableAutoplay").addEventListener("change", updateConditionalVisibility);
    form.addEventListener("input", (event) => {
        if (!event.target.matches('input[name="mode"]')) updateConditionalVisibility();
    });
    form.addEventListener("change", (event) => {
        if (!event.target.matches('input[name="mode"]')) updateConditionalVisibility();
    });
    field("PreviewTransition").addEventListener("click", previewTransition);
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
    view.addEventListener("viewhide", () => previewAnimation?.cancel());
    view.addEventListener("viewshow", handleShow);
}
