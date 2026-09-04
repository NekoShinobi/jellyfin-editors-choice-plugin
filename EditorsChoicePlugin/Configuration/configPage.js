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

    function showError(message, error) {
        console.error(message, error);
        Dashboard.alert(message);
    }

    function setVisible(id, visible) {
        field(id).style.display = visible ? "" : "none";
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
        const mode = getSelectedMode();
        setVisible("EditorUserId-container", mode === "FAVOURITES");
        setVisible("LibraryList-container", mode === "RANDOM");
        setVisible("CollectionsList-container", mode === "COLLECTIONS");
        setVisible("NewTimeLimit-container", mode === "NEW");
        setVisible("AutoplayInterval-container", field("EnableAutoplay").checked);
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
        field("DoScriptInject").checked = config.DoScriptInject;
        field("FileTransformation").checked = config.FileTransformation;
        field("FavouritesMode").checked = mode === "FAVOURITES";
        field("RandomMode").checked = mode === "RANDOM";
        field("CollectionsMode").checked = mode === "COLLECTIONS";
        field("NewMode").checked = mode === "NEW";
        field("RandomMediaCount").value = config.RandomMediaCount;
        field("MinimumRating").value = config.MinimumRating;
        field("MinimumCriticRating").value = config.MinimumCriticRating;
        field("EnableAutoplay").checked = config.EnableAutoplay;
        field("AutoplayInterval").value = config.AutoplayInterval;
        field("NewTimeLimitSelect").value = config.NewTimeLimit;
        field("ShowDesc").checked = config.ShowDescription;
        field("ShowPlayButton").checked = config.ShowPlayButton;
        field("ReduceImageSize").checked = config.ReduceImageSize;
        field("BannerHeightSelect").value = config.BannerHeight;
        field("TransitionEffectSelect").value = config.TransitionEffect;
        field("HeroBackdropPositionSelect").value = config.HeroBackdropPosition;
        field("UseHeroLayout").checked = config.UseHeroLayout;
        field("ShowPlayed").checked = config.ShowPlayed;
        field("Heading").value = config.Heading || "";
        field("PlayButtonText").value = config.PlayButtonText || "";
        field("HideOnTvLayout").checked = config.HideOnTvLayout;
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
        config.DoScriptInject = field("DoScriptInject").checked;
        config.FileTransformation = field("FileTransformation").checked;
        config.EnableAutoplay = field("EnableAutoplay").checked;
        config.AutoplayInterval = boundedNumber("AutoplayInterval", 10, 1, Number.MAX_SAFE_INTEGER, true);
        config.ShowDescription = field("ShowDesc").checked;
        config.ShowPlayButton = field("ShowPlayButton").checked;
        config.ReduceImageSize = field("ReduceImageSize").checked;
        config.ShowPlayed = field("ShowPlayed").checked;
        config.HideOnTvLayout = field("HideOnTvLayout").checked;
        config.UseHeroLayout = field("UseHeroLayout").checked;
        config.TransitionEffect = field("TransitionEffectSelect").value;
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
        config.Heading = field("Heading").value;
        config.PlayButtonText = field("PlayButtonText").value;
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
    field("DoScriptInject").addEventListener("change", function () {
        if (this.checked) field("FileTransformation").checked = false;
    });
    field("FileTransformation").addEventListener("change", function () {
        if (this.checked) field("DoScriptInject").checked = false;
    });
    view.addEventListener("viewshow", handleShow);
}
