const container = `
<div class="verticalSection section-1 editorsChoiceContainer">
  <div class="splide cardScalable">
    <div class="splide__track">
      <div is="emby-itemscontainer" class="editorsChoiceItemsContainer splide__list animatedScrollX"></div>
    </div>
  </div>
</div>

<style>
  /* ===== Layout / spacing ===== */
  .homeSectionsContainer.editorsChoiceAdded { padding-top: 0 !important; }

  .homeSectionsContainer.editorsChoiceAdded .editorsChoiceContainer {
    padding-left: max(env(safe-area-inset-left), 3.3%);
    padding-right: max(env(safe-area-inset-right), 3.3%);
    margin-bottom: 1.8em;
  }

  .editorsChoiceContainer .sectionTitle-cards { padding-bottom: 0.35em; }
  .editorsChoiceItemsContainer { column-gap: normal !important; }

  @media screen and (max-width: 1600px) {
    .homeSectionsContainer.editorsChoiceAdded { margin-top: 30px; }
  }

  /* ===== Pagination ===== */
  .editorsChoiceContainer .splide__pagination {
    z-index: 4;
    bottom: 1.25rem;
    left: 50%;
    right: auto;
    width: auto;
    min-height: 1.75rem;
    margin: 0;
    padding: 0.35rem 0.5rem;
    gap: 0.35rem;
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 999px;
    background: rgba(16, 18, 22, 0.42);
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.24);
    backdrop-filter: blur(14px) saturate(145%);
    -webkit-backdrop-filter: blur(14px) saturate(145%);
    transform: translateX(-50%);
    pointer-events: auto;
    touch-action: manipulation;
  }

  .editorsChoiceContainer .splide__pagination__page {
    display: block;
    width: 0.45rem;
    height: 0.45rem;
    margin: 0;
    padding: 0.3rem !important;
    box-sizing: content-box;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.55);
    background-clip: content-box;
    opacity: 1;
    transform: none;
    transition: width 180ms ease, background-color 180ms ease, transform 180ms ease;
  }

  .editorsChoiceContainer .splide__pagination__page.is-active {
    width: 1.6rem;
    background: rgba(255, 255, 255, 0.96);
    transform: none;
  }

  .editorsChoiceContainer .splide__pagination__page:focus-visible {
    outline: 2px solid #fff;
    outline-offset: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    .editorsChoiceContainer .splide__pagination__page { transition: none; }
  }

  .splide__track { border-radius: 0.2em; }

  .editorsChoiceContainer .splide {
    isolation: isolate;
  }

  /* ===== Banner ===== */
  .editorsChoiceItemBanner {
    position: relative;
    width: 100%;
    height: 100%;
    flex: none;
    background-size: cover;
    background-position-x: center;
    cursor: pointer;
    color: rgba(255, 255, 255, 0.8);
    text-decoration: none;
    background-position-y: 52%;
  }

  .editorsChoiceItemBanner:focus-visible {
    outline: 3px solid currentColor;
    outline-offset: -3px;
  }

  .editorsChoiceItemBanner:nth-child(odd) { background-position-y: 48%; }

  @keyframes banner {
    0% { background-position-y: 52%; }
    100% { background-position-y: 48%; }
  }

  .editorsChoiceItemBanner.is-visible {
    animation: banner 10s infinite alternate both;
  }

  .editorsChoiceItemBanner:nth-child(odd).is-visible {
    animation-direction: alternate-reverse;
  }

  .editorsChoiceItemBanner > .editorsChoiceContent {
    position: relative;
    width: 100%;
    height: 100%;
    padding: 0 30px;
    box-sizing: border-box;
    background: linear-gradient(90deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 60%, rgba(0,0,0,0) 100%);
    display: grid;
    grid-template-columns: minmax(0, min(650px, 100%));
    align-items: center;
    justify-content: start;
    column-gap: clamp(1.1rem, 2.5vw, 2.5rem);
    overflow: hidden;
  }

  /* ===== Content ===== */
  .editorsChoiceItemBanner > .editorsChoiceContent--withPoster {
    grid-template-columns: auto minmax(0, min(650px, 100%));
  }

  .editorsChoiceItemPoster {
    display: block;
    height: 75%;
    width: auto;
    max-width: min(24vw, 25rem);
    aspect-ratio: 2 / 3;
    align-self: center;
    object-fit: cover;
    border-radius: 0.45rem;
    box-shadow: 0 1.1rem 2.8rem rgba(4, 9, 15, 0.42), inset 0 0 0 1px rgba(255, 255, 255, 0.12);
  }

  .editorsChoiceInfo {
    width: min(650px, 100%);
    max-height: 75%;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .editorsChoiceContentMain {
    width: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .editorsChoiceItemLogo {
    display: block;
    max-width: 300px;
    max-height: calc(50% - 45px);
    min-height: 0;
    flex-shrink: 1;
    object-fit: contain;
    object-position: left center;
  }

  .editorsChoiceItemTitle {
    max-width: 100%;
    margin: 0 60px 0 0;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .editorsChoiceItemMetadata {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.4rem;
    min-height: 1.6em;
    margin-top: 0.7em;
    font-size: 0.82em;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    flex: none;
  }

  .editorsChoiceMetadataItem {
    display: inline-flex;
    align-items: center;
    min-height: 1.55rem;
    padding: 0.14rem 0.6rem;
    box-sizing: border-box;
    white-space: nowrap;
    line-height: 1;
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 999px;
    background: rgba(18, 23, 31, 0.46);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(8px) saturate(125%);
    -webkit-backdrop-filter: blur(8px) saturate(125%);
  }

  .editorsChoiceMediaType {
    background: rgba(255, 255, 255, 0.17);
  }

  .editorsChoiceOfficialRating {
    letter-spacing: 0.02em;
  }

  .editorsChoiceItemOverview {
    white-space: normal;
    width: 100%;
    max-width: 100%;
    max-height: 5.8em;
    margin-top: 0.75em;
    line-height: 1.45;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 4;
    flex-shrink: 1;
    min-height: 0;
    overflow: hidden;
  }

  .editorsChoiceItemOverview > :first-child { margin-top: 0; }
  .editorsChoiceItemOverview > :last-child { margin-bottom: 0; }
  .editorsChoiceItemOverview p { margin: 0 0 0.55em; }
  .editorsChoiceItemOverview h1,
  .editorsChoiceItemOverview h2,
  .editorsChoiceItemOverview h3,
  .editorsChoiceItemOverview h4,
  .editorsChoiceItemOverview h5,
  .editorsChoiceItemOverview h6 {
    margin: 0 0 0.35em;
    font-size: 1em;
  }
  .editorsChoiceItemOverview ul,
  .editorsChoiceItemOverview ol {
    margin: 0.25em 0;
    padding-left: 1.5em;
  }
  .editorsChoiceItemOverview blockquote {
    margin: 0.25em 0;
    padding-left: 0.75em;
    border-left: 2px solid rgba(255, 255, 255, 0.55);
  }
  .editorsChoiceItemOverview pre,
  .editorsChoiceItemOverview code {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .editorsChoiceItemOverview a {
    position: relative;
    z-index: 3;
    color: inherit;
    text-decoration: underline;
  }

  .layout-tv .editorsChoiceItemOverview {
    max-height: 2.9em;
    -webkit-line-clamp: 2;
  }

  .editorsChoiceItemActions {
    flex: none;
    margin-top: 0.9rem;
  }

  .editorsChoiceItemButton {
    width: fit-content !important;
    display: inline-flex !important;
    align-items: center;
    gap: 0.4em;
    position: relative;
    margin: 0 !important;
  }

  .starIcon {
    color: #f2b01e;
    font-size: 1em;
    margin-right: 0.25em;
  }

  .editorsChoicePlayIcon {
    font-size: 1.25em;
  }

  @media screen and (max-width: 500px) {
    .editorsChoiceItemBanner > .editorsChoiceContent--withPoster {
      grid-template-columns: auto minmax(0, 1fr);
      column-gap: 0.85rem;
    }

    .editorsChoiceItemPoster {
      width: min(27vw, 8rem);
      height: auto;
      max-width: none;
      max-height: 65%;
    }

    .editorsChoiceInfo {
      max-height: 82%;
    }

    .editorsChoiceItemLogo {
      max-width: 100%;
      max-height: 100px;
      height: auto;
      filter: drop-shadow(3px 3px 15px black);
    }
  }

  /* ===== Hero mode ===== */
  #homeTab.editorsChoiceHeroMode {
    transform: translateY(-120px);
  }

  .editorsChoiceHeroMode .editorsChoiceContainer { padding: 0 !important; }

  .editorsChoiceHeroMode .splide.cardScalable {
    border-radius: unset !important;
    border: 0 !important;
    background: transparent;
    box-shadow: none !important;
    margin-bottom: -170px;
  }

  .editorsChoiceHeroMode .editorsChoiceHeight-360 .splide.cardScalable {
    margin-bottom: -75px;
  }

  .editorsChoiceHeroMode .editorsChoiceHeight-400 .splide.cardScalable {
    margin-bottom: -105px;
  }

  .editorsChoiceHeroMode .editorsChoiceHeight-500 .splide.cardScalable {
    margin-bottom: -150px;
  }


  .editorsChoiceHeroMode .editorsChoiceItemBanner { background-position-y: 15% !important; }
  .editorsChoiceHeroMode .editorsChoiceContainer .splide__pagination { bottom: 9rem; }

  .editorsChoiceHeroMode  .editorsChoiceBackdropCenter {
      background-position: center;
  }

  .editorsChoiceHeroMode .editorsChoiceBackdropTop {
      background-position: top;
  }

  .editorsChoiceHeroMode .editorsChoiceBackdropBottom {
      background-position: bottom;
  }

  .editorsChoiceHeroMode .editorsChoiceItemBanner .editorsChoiceBackdrop {
    position: absolute;
    inset: 0;
    z-index: 0;
    background-size: cover;

    background-repeat: no-repeat;
    mask-image: linear-gradient(
      to bottom,
      rgba(0,0,0,1) 40%,
      rgba(0,0,0,0.9) 55%,
      rgba(0,0,0,0.4) 70%,
      rgba(0,0,0,0) 100%
    );
  }

  .editorsChoiceHeroMode .editorsChoiceItemBanner .editorsChoiceBackdrop::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 1;
    background: linear-gradient(
      135deg,
      rgba(0,0,0,0.95) 0%,
      rgba(0,0,0,0.85) 15%,
      rgba(0,0,0,0.55) 30%,
      rgba(0,0,0,0.25) 50%,
      rgba(0,0,0,0.08) 65%,
      rgba(0,0,0,0) 80%
    );
  }

  .editorsChoiceHeroMode .editorsChoiceItemBanner .editorsChoiceContent {
    position: relative;
    z-index: 2;
    height: 100%;
    padding: 90px max(env(safe-area-inset-right), 3.3%);
    box-sizing: border-box;
    background: none !important;
  }

  @media screen and (max-width: 500px) {
    .editorsChoiceItemBanner > .editorsChoiceContent {
      padding-right: 20px;
      padding-left: 20px;
    }

    .editorsChoiceHeroMode .editorsChoiceItemBanner .editorsChoiceContent {
      padding-right: max(env(safe-area-inset-right), 20px);
      padding-left: max(env(safe-area-inset-left), 20px);
    }
  }
</style>
`;

const GUID = "70bb2ec1-f19e-46b5-b49a-942e6b96ebae";

/* ===== Utils ===== */
function shuffle(input) {
    const array = input.slice(); // don't mutate original
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getLocalizedString(key) {
    const localization = {
        watchNow: {
            en: "Watch Now",
            fr: "Regarder",
            es: "Ver",
            de: "Ansehen",
            it: "Guarda",
            pt: "Assistir",
            zh: "观看",
            ja: "見る",
            ru: "Смотреть",
        },
        resume: {
            en: "Resume",
            fr: "Reprendre",
            es: "Reanudar",
            de: "Fortsetzen",
            it: "Riprendi",
            pt: "Retomar",
            zh: "继续播放",
            ja: "再開",
            ru: "Продолжить",
        },
        continueWatching: {
            en: "Continue",
            fr: "Continuer",
            es: "Continuar",
            de: "Weiter",
            it: "Continua",
            pt: "Continuar",
            zh: "继续",
            ja: "続ける",
            ru: "Продолжить",
        },
        watchAgain: {
            en: "Watch Again",
            fr: "Revoir",
            es: "Ver de nuevo",
            de: "Erneut ansehen",
            it: "Guarda di nuovo",
            pt: "Assistir novamente",
            zh: "再次观看",
            ja: "もう一度見る",
            ru: "Смотреть снова",
        },
        episode: {
            en: "episode",
            fr: "épisode",
            es: "episodio",
            de: "Folge",
            it: "episodio",
            pt: "episódio",
            zh: "集",
            ja: "話",
            ru: "эпизод",
        },
        episodes: {
            en: "episodes",
            fr: "épisodes",
            es: "episodios",
            de: "Folgen",
            it: "episodi",
            pt: "episódios",
            zh: "集",
            ja: "話",
            ru: "эпизодов",
        },
    };

    const lang = (navigator.language || "en").slice(0, 2);
    return (localization[key] && (localization[key][lang] || localization[key].en)) || "";
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatRuntime(totalMinutes) {
    if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return "";
    const minutes = Math.round(totalMinutes);
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    if (!hours) return minutes + "m";
    return remainder ? hours + "h " + remainder + "m" : hours + "h";
}

function buildMetadata(item) {
    const metadata = [];
    const rating = typeof item.community_rating === "number" ? Number(item.community_rating.toFixed(1)) : 0;

    if (item.item_type) {
        metadata.push(
            '<span role="listitem" class="editorsChoiceMetadataItem editorsChoiceMediaType">' +
            escapeHtml(item.item_type) +
            '</span>'
        );
    }

    if (rating > 0) {
        metadata.push(
            '<span role="listitem" class="editorsChoiceMetadataItem">' +
            '<span class="material-icons starIcon star" aria-hidden="true"></span>' +
            rating +
            '</span>'
        );
    }

    if (Number.isInteger(item.year) && item.year > 0) {
        metadata.push('<span role="listitem" class="editorsChoiceMetadataItem">' + item.year + '</span>');
    }

    if (item.item_type === "Movie") {
        const runtime = formatRuntime(item.runtime_minutes);
        if (runtime) metadata.push('<span role="listitem" class="editorsChoiceMetadataItem">' + runtime + '</span>');
    } else if (item.item_type === "Series" && Number.isInteger(item.episode_count) && item.episode_count > 0) {
        const episodeLabel = getLocalizedString(item.episode_count === 1 ? "episode" : "episodes");
        metadata.push(
            '<span role="listitem" class="editorsChoiceMetadataItem">' +
            item.episode_count + " " + escapeHtml(episodeLabel) +
            '</span>'
        );
    }

    if (item.official_rating) {
        metadata.push(
            '<span role="listitem" class="editorsChoiceMetadataItem editorsChoiceOfficialRating">' +
            escapeHtml(item.official_rating) +
            '</span>'
        );
    }

    return metadata.length
        ? '<div class="editorsChoiceItemMetadata" role="list">' + metadata.join("") + '</div>'
        : "";
}

function buildLogoOrTitle(item, reduceImageSizes) {
    if (!item.hasLogo) return '<h1 class="editorsChoiceItemTitle">' + escapeHtml(item.name) + '</h1>';
    const logoSize = reduceImageSizes ? "?width=300" : "";
    return '<img class="editorsChoiceItemLogo" src="../Items/' + item.id +
        '/Images/Logo/0' + logoSize + '" alt="' + escapeHtml(item.name) + '"/>';
}

function buildPoster(item, data) {
    if (!item.hasPoster) return "";

    const configuredHeight = Number(data.bannerHeight) || 360;
    const posterSize = data.reduceImageSizes ? "?height=" + Math.ceil(configuredHeight * 0.75) : "";

    return '<img class="editorsChoiceItemPoster" src="../Items/' + item.id +
        '/Images/Primary/0' + posterSize + '" alt="' + escapeHtml(item.name) +
        ' poster" loading="lazy" decoding="async"/>';
}

function buildOverview(item) {
    const overview = (item && typeof item.overview_html === "string") ? item.overview_html : "";
    return overview ? '<div class="editorsChoiceItemOverview">' + overview + '</div>' : "";
}

function getPlayButtonLabel(item, data) {
    const hasEpisode = Number.isInteger(item.progress_season) && Number.isInteger(item.progress_episode);
    const episode = hasEpisode ? " S" + item.progress_season + " E" + item.progress_episode : "";

    if (item.playback_action === "resume") return getLocalizedString("resume") + episode;
    if (item.playback_action === "continue") return getLocalizedString("continueWatching") + episode;
    if (item.playback_action === "replay") return getLocalizedString("watchAgain");
    return data.playButtonText || getLocalizedString("watchNow");
}

function buildPlayButton(item, data) {
    if (!data.showPlayButton) return "";

    const buttonText = getPlayButtonLabel(item, data);
    const playItemId = item.play_item_id || item.id;
    const playItemType = item.play_item_type || item.item_type;
    const nativeAction = item.playback_action === "resume" ? "resume" : "play";
    const positionTicks = Number.isFinite(item.playback_position_ticks) ? item.playback_position_ticks : 0;
    return '<div class="editorsChoiceItemActions">' +
        '<button type="button" is="emby-button" ' +
        'class="editorsChoiceItemButton itemAction raised button-submit emby-button" ' +
        'data-action="' + nativeAction + '" ' +
        'data-id="' + escapeHtml(playItemId) + '" ' +
        'data-serverid="' + escapeHtml(ApiClient.serverId()) + '" ' +
        'data-type="' + escapeHtml(playItemType) + '" ' +
        'data-mediatype="Video" ' +
        'data-isfolder="' + (item.play_is_folder ? "true" : "false") + '" ' +
        'data-positionticks="' + positionTicks + '" ' +
        'aria-label="' + escapeHtml(buttonText) + ': ' + escapeHtml(item.name) + '">' +
        '<span class="material-icons editorsChoicePlayIcon play_arrow" aria-hidden="true"></span>' +
        '<span>' + escapeHtml(buttonText) + '</span>' +
        '</button></div>';
}

function buildBannerSizeParam(reduceImageSizes) {
    if (!reduceImageSizes) return "";
    const w = Math.max(window.screen.width, window.screen.height);
    return `?width=${w}`;
}

function ensureSplideLoaded() {
    return new Promise((resolve, reject) => {
        if (window.Splide) return resolve();

        const existing = document.querySelector('script[data-editorschoice-splide="1"]');
        if (existing) {
            existing.addEventListener("load", resolve, { once: true });
            existing.addEventListener("error", reject, { once: true });
            return;
        }

        const s = document.createElement("script");
        s.type = "text/javascript";
        s.src = "https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/js/splide.min.js";
        s.setAttribute("data-editorschoice-splide", "1");
        s.addEventListener("load", resolve, { once: true });
        s.addEventListener("error", reject, { once: true });
        document.head.appendChild(s);

        if (!document.querySelector('link[data-editorschoice-splide="1"]')) {
            const l = document.createElement("link");
            l.rel = "stylesheet";
            l.href = "https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/css/splide.min.css";
            l.setAttribute("data-editorschoice-splide", "1");
            document.head.appendChild(l);
        }
    });
}

/* ===== Render ===== */
function renderHeroSlide(item, data) {
    const metadata = buildMetadata(item);
    const logoOrTitle = buildLogoOrTitle(item, data.reduceImageSizes);
    const overview = buildOverview(item);
    const button = buildPlayButton(item, data);
    const poster = buildPoster(item, data);
    const contentClass = "editorsChoiceContent" + (poster ? " editorsChoiceContent--withPoster" : "");

    const backdropSize = buildBannerSizeParam(data.reduceImageSizes);
    const backdropUrl = `../Items/${item.id}/Images/Backdrop/0${backdropSize}`;
    const extraClass = data.heroBackdropPosition === "center" ? "editorsChoiceBackdropCenter" :
        data.heroBackdropPosition === "top" ? "editorsChoiceBackdropTop" :
        data.heroBackdropPosition === "bottom" ? "editorsChoiceBackdropBottom" : "";

    return '<article class="editorsChoiceItemBanner splide__slide" ' +
        'role="link" tabindex="0" data-details-item-id="' + escapeHtml(item.id) + '">' +
        '<div class="editorsChoiceBackdrop ' + extraClass +
        '" style="background-image:url(\'' + backdropUrl + '\');"></div>' +
        '<div class="' + contentClass + '">' +
        poster + '<div class="editorsChoiceInfo">' +
        '<div class="editorsChoiceContentMain">' +
        logoOrTitle + metadata + overview +
        '</div>' + button +
        '</div></div></article>';
}

function renderNormalSlide(item, data) {
    const metadata = buildMetadata(item);
    const logoOrTitle = buildLogoOrTitle(item, data.reduceImageSizes);
    const overview = buildOverview(item);

    const bannerSize = buildBannerSizeParam(data.reduceImageSizes);
    const button = buildPlayButton(item, data);
    const poster = buildPoster(item, data);
    const contentClass = "editorsChoiceContent" + (poster ? " editorsChoiceContent--withPoster" : "");

    return '<article class="editorsChoiceItemBanner splide__slide" ' +
        'role="link" tabindex="0" data-details-item-id="' + escapeHtml(item.id) + '" ' +
        'style="background-image:url(\'../Items/' + item.id + '/Images/Backdrop/0' + bannerSize + '\');">' +
        '<div class="' + contentClass + '">' +
        poster + '<div class="editorsChoiceInfo">' +
        '<div class="editorsChoiceContentMain">' +
        logoOrTitle + metadata + overview +
        '</div>' + button +
        '</div></div></article>';
}

/* ===== Main setup ===== */
async function setup() {
    console.log("Attempting creation of editors choice slider.");

    const $containers = $(".homeSectionsContainer").filter((_, el) => !$(el).hasClass("editorsChoiceAdded"));
    if (!$containers.length) return;

    try {
        await ensureSplideLoaded();
    } catch (e) {
        console.warn("Editors Choice: Splide failed to load.", e);
        return;
    }

    $containers.each((_, elem) => {
        console.log("Fetching favourites data from API...");

        ApiClient.fetch({ url: ApiClient.getUrl("/EditorsChoice/favourites"), type: "GET" })
            .then((response) => response.json())
            .then((data) => {
                if (data.hideOnTvLayout && document.documentElement.classList.contains("layout-tv")) {
                    console.log("Editors Choice: hidden on TV layout by configuration.");
                    return;
                }

                const favourites = shuffle(data.favourites || []);
                const $containerElem = $(container);
                const containerId = `editorsChoice-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

                $containerElem.first().attr("id", containerId);
                $containerElem.first().addClass(`editorsChoiceHeight-${data.bannerHeight}`);
                $(elem).prepend($containerElem);

                $(elem).closest("#homeTab")
                    .toggleClass("editorsChoiceHeroMode", !!data.useHeroLayout);

                if ("heading" in data && data.heading && !data.useHeroLayout) {
                    $($containerElem).prepend(
                        '<h2 class="sectionTitle sectionTitle-cards">' + escapeHtml(data.heading) + '</h2>'
                    );
                }

                const $list = $(`#${containerId} .editorsChoiceItemsContainer`);

                for (const item of favourites) {
                    const html = data.useHeroLayout
                        ? renderHeroSlide(item, data)
                        : renderNormalSlide(item, data);

                    $list.append(html);
                }

                $list.find(".editorsChoiceItemOverview a")
                    .attr("target", "_blank")
                    .attr("rel", "noopener noreferrer");

                $containerElem.on("click", ".splide__pagination", function (event) {
                    event.stopPropagation();
                });

                $list.on("click", ".editorsChoiceItemBanner", function (event) {
                    if ($(event.target).closest(".splide__pagination").length) return;
                    if ($(event.target).closest(".editorsChoiceItemOverview a").length) return;
                    if ($(event.target).closest(".editorsChoiceItemButton").length) return;

                    event.preventDefault();
                    const itemId = this.dataset.detailsItemId;
                    if (itemId) Emby.Page.showItem(itemId);
                });

                $list.on("keydown", ".editorsChoiceItemBanner", function (event) {
                    if (event.target !== this || (event.key !== "Enter" && event.key !== " ")) return;
                    event.preventDefault();
                    const itemId = this.dataset.detailsItemId;
                    if (itemId) Emby.Page.showItem(itemId);
                });

                $(elem).addClass("editorsChoiceAdded");

                new Splide(`#${containerId} .splide`, {
                    type: data.transitionEffect ?? "loop",
                    autoplay: !!data.autoplay,
                    arrows: false,
                    rewind: true,
                    interval: data.autoplayInterval,
                    pagination: true,
                    keyboard: true,
                    height: `${data.bannerHeight + (data.useHeroLayout ? 180 : 0)}px`, // Add 80px to the banner image height in hero mode to compensate for navbar overlay
                }).mount();
            })
            .catch((e) => console.warn("Editors Choice: failed to fetch/render.", e));
    });
}

window.onload = function () {
    // Detect if container is ready to setup slider
    const target = document.getElementById("reactRoot");
    if (!target) {
        console.warn("Editors Choice: reactRoot not found.");
        return;
    }

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            const newNodes = mutation.addedNodes;
            if (!newNodes || !newNodes.length) continue;

            $(newNodes).each(function () {
                const $node = $(this);
                if ($node.hasClass("section0") && !$node.hasClass("editorsChoiceAdded")) {
                    setup();
                }
            });
        }
    });

    observer.observe(target, { attributes: true, childList: true, characterData: true, subtree: true });

    // Remind user that their favourites will be public when they add a new favourite.
    $("body").on("click", '[is="emby-ratingbutton"]', function () {
        if ($(this).hasClass("ratingbutton-withrating")) return;

        ApiClient.getPluginConfiguration(GUID).then((data) => {
            if (ApiClient.getCurrentUserId() === data.EditorUserId) {
                Dashboard.confirm("You are the featured items editor! Your favourites will be displayed on the home page for all users, if enabled.");
            }
        });
    });
};
