const container = `
<div class="verticalSection section-1 editorsChoiceContainer">
  <div class="splide cardScalable">
    <div class="splide__track">
      <div is="emby-itemscontainer" class="editorsChoiceItemsContainer splide__list animatedScrollX"></div>
    </div>
    <div class="editorsChoiceMobilePagination" aria-label="Carousel pages">
      <button type="button" class="editorsChoiceMobilePageButton editorsChoiceMobilePagePrev" aria-label="Previous item">
        <span class="material-icons chevron_left" aria-hidden="true"></span>
      </button>
      <span class="editorsChoiceMobilePageStatus" aria-live="polite" aria-atomic="true">
        <span class="editorsChoiceMobilePageCurrent">1</span><span aria-hidden="true"> / </span><span class="editorsChoiceMobilePageTotal">1</span>
      </span>
      <button type="button" class="editorsChoiceMobilePageButton editorsChoiceMobilePageNext" aria-label="Next item">
        <span class="material-icons chevron_right" aria-hidden="true"></span>
      </button>
    </div>
    <div class="editorsChoiceSkeleton" aria-hidden="true">
      <div class="editorsChoiceSkeletonPoster"></div>
      <div class="editorsChoiceSkeletonCopy">
        <span class="editorsChoiceSkeletonLogo"></span>
        <span class="editorsChoiceSkeletonMeta"></span>
        <span class="editorsChoiceSkeletonLine"></span>
        <span class="editorsChoiceSkeletonLine editorsChoiceSkeletonLineShort"></span>
        <span class="editorsChoiceSkeletonButton"></span>
      </div>
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

  .editorsChoiceMobilePagination {
    display: none;
    position: absolute;
    z-index: 4;
    bottom: 1.1rem;
    left: 50%;
    align-items: center;
    gap: 0.15rem;
    min-height: 2.75rem;
    padding: 0.18rem;
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 999px;
    background: rgba(16, 18, 22, 0.48);
    box-shadow: 0 8px 28px rgba(4, 9, 15, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(14px) saturate(145%);
    -webkit-backdrop-filter: blur(14px) saturate(145%);
    transform: translateX(-50%);
    touch-action: manipulation;
  }

  .editorsChoiceMobilePageButton {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.75rem;
    height: 2.75rem;
    padding: 0;
    border: 0;
    border-radius: 50%;
    color: #fff;
    background: transparent;
  }

  .editorsChoiceMobilePageButton:active { transform: scale(0.94); }
  .editorsChoiceMobilePageButton:focus-visible { outline: 2px solid #fff; }
  .editorsChoiceMobilePageButton .material-icons { font-size: 1.35rem; }

  .editorsChoiceMobilePageStatus {
    min-width: 3.25rem;
    text-align: center;
    color: rgba(255, 255, 255, 0.92);
    font-size: 0.82rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  .editorsChoiceSingleSlide .splide__pagination,
  .editorsChoiceSingleSlide .editorsChoiceMobilePagination {
    display: none !important;
  }

  @media (prefers-reduced-motion: reduce) {
    .editorsChoiceContainer .splide__pagination__page { transition: none; }
  }

  .splide__track { border-radius: 0.2em; }

  .editorsChoiceContainer .splide {
    isolation: isolate;
  }

  .editorsChoiceSkeleton {
    position: absolute;
    inset: 0;
    z-index: 3;
    display: grid;
    grid-template-columns: auto minmax(0, 32rem);
    align-items: center;
    justify-content: start;
    gap: clamp(1rem, 2.5vw, 2.5rem);
    padding: 120px max(env(safe-area-inset-right), 3.3%) 30px max(env(safe-area-inset-left), 3.3%);
    box-sizing: border-box;
    overflow: hidden;
    color: rgba(255, 255, 255, 0.12);
    background: #101319;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity 240ms ease, visibility 0s linear 240ms;
  }

  .editorsChoiceSkeleton::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(105deg, transparent 25%, rgba(255, 255, 255, 0.08) 42%, transparent 60%);
    transform: translateX(-100%);
    animation: editorsChoiceSkeletonSweep 1.45s ease-in-out infinite;
  }

  .editorsChoiceIsLoading .editorsChoiceSkeleton {
    opacity: 1;
    visibility: visible;
    transition-delay: 0s;
  }

  .editorsChoiceSkeletonPoster {
    height: 75%;
    max-height: 25rem;
    aspect-ratio: 2 / 3;
    border-radius: 0.45rem;
    background: currentColor;
  }

  .editorsChoiceSkeletonCopy {
    display: flex;
    width: min(100%, 32rem);
    flex-direction: column;
    gap: 0.7rem;
  }

  .editorsChoiceSkeletonCopy span {
    display: block;
    border-radius: 999px;
    background: currentColor;
  }

  .editorsChoiceSkeletonLogo { width: 52%; height: 4.5rem; border-radius: 0.35rem !important; }
  .editorsChoiceSkeletonMeta { width: 44%; height: 1.5rem; }
  .editorsChoiceSkeletonLine { width: 92%; height: 0.8rem; }
  .editorsChoiceSkeletonLineShort { width: 68%; }
  .editorsChoiceSkeletonButton { width: 8.5rem; height: 2.6rem; margin-top: 0.6rem; }

  @keyframes editorsChoiceSkeletonSweep {
    to { transform: translateX(100%); }
  }

  @media screen and (max-width: 500px) {
    .editorsChoiceContainer .splide__pagination { display: none; }
    .editorsChoiceMobilePagination { display: flex; }

    .editorsChoiceSkeleton {
      grid-template-columns: min(27vw, 8rem) minmax(0, 1fr);
      gap: 0.85rem;
      padding-right: max(env(safe-area-inset-right), 20px);
      padding-left: max(env(safe-area-inset-left), 20px);
    }

    .editorsChoiceSkeletonPoster { width: 100%; height: auto; }
    .editorsChoiceSkeletonLogo { width: 72%; height: 3.75rem; }
    .editorsChoiceSkeletonLine { display: none !important; }
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
    height: 75%;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;
  }

  .editorsChoiceInfo--withAction {
    padding-bottom: 3.25rem;
    box-sizing: border-box;
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
    width: min(300px, 100%);
    height: 5rem;
    flex: none;
    object-fit: contain;
    object-position: left center;
  }

  .editorsChoiceItemTitle {
    display: flex;
    align-items: center;
    height: 5rem;
    max-width: 100%;
    margin: 0 60px 0 0;
    line-height: 1.08;
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
    position: absolute;
    z-index: 3;
    left: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .editorsChoiceItemButton {
    width: fit-content !important;
    display: inline-flex !important;
    align-items: center;
    gap: 0.4em;
    position: relative;
    margin: 0 !important;
  }

  .editorsChoicePlaybackProgress {
    display: block;
    width: 100%;
    height: 0.18rem;
    margin-top: 0.38rem;
    overflow: hidden;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.24);
  }

  .editorsChoicePlaybackProgressFill {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: rgba(255, 255, 255, 0.92);
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
      height: 82%;
    }

    .editorsChoiceItemLogo {
      max-width: 100%;
      height: 3.75rem;
      filter: drop-shadow(3px 3px 15px black);
    }

    .editorsChoiceItemTitle {
      height: 3.75rem;
      margin-right: 0;
    }

    .editorsChoiceInfo--withAction {
      padding-bottom: 3.75rem;
    }

    .editorsChoiceItemActions {
      left: 50%;
      align-items: center;
      transform: translateX(-50%);
    }

    .editorsChoiceContent--withPoster .editorsChoiceItemActions {
      left: calc(50% - min(13.5vw, 4rem) - 0.425rem);
    }
  }

  /* ===== Hero mode ===== */
  .editorsChoiceHeroMode .homeSectionsContainer.editorsChoiceAdded {
    margin-top: 0;
  }

  .editorsChoiceHeroMode .homeSectionsContainer.editorsChoiceAdded .editorsChoiceContainer {
    transform: translateY(-120px);
    margin-bottom: -120px;
    padding: 0 !important;
  }

  .editorsChoiceHeroMode .splide.cardScalable {
    border-radius: unset !important;
    border: 0 !important;
    background: transparent;
    box-shadow: none !important;
    margin-bottom: 0;
  }


  .editorsChoiceHeroMode .editorsChoiceItemBanner { background-position-y: 15% !important; }
  .editorsChoiceHeroMode .editorsChoiceItemBanner.is-visible { animation: none; }
  .editorsChoiceHeroMode .editorsChoiceContainer .splide__pagination { bottom: 1.1rem; }

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
    opacity: 0;
    transform: scale(1.018);
    transition: opacity 360ms ease, transform 900ms cubic-bezier(0.22, 1, 0.36, 1);
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
      rgba(0,0,0,var(--editors-choice-scrim-strong, 0.95)) 0%,
      rgba(0,0,0,var(--editors-choice-scrim-mid, 0.85)) 15%,
      rgba(0,0,0,var(--editors-choice-scrim-soft, 0.55)) 30%,
      rgba(0,0,0,var(--editors-choice-scrim-faint, 0.25)) 50%,
      rgba(0,0,0,0.08) 65%,
      rgba(0,0,0,0) 80%
    );
  }

  .editorsChoiceHeroMode .editorsChoiceItemBanner.is-active.editorsChoiceSlideReady .editorsChoiceBackdrop {
    opacity: 1;
    transform: scale(1);
  }

  .editorsChoiceHeroMode .editorsChoiceItemPoster,
  .editorsChoiceHeroMode .editorsChoiceItemLogo,
  .editorsChoiceHeroMode .editorsChoiceItemTitle,
  .editorsChoiceHeroMode .editorsChoiceItemMetadata,
  .editorsChoiceHeroMode .editorsChoiceItemOverview {
    opacity: 0;
    transform: translateY(0.7rem);
  }

  .editorsChoiceHeroMode .editorsChoiceItemActions {
    opacity: 0;
  }

  .editorsChoiceHeroMode .editorsChoiceItemBanner.is-active.editorsChoiceSlideReady .editorsChoiceItemPoster {
    animation: editorsChoiceContentReveal 420ms 70ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .editorsChoiceHeroMode .editorsChoiceItemBanner.is-active.editorsChoiceSlideReady .editorsChoiceItemLogo,
  .editorsChoiceHeroMode .editorsChoiceItemBanner.is-active.editorsChoiceSlideReady .editorsChoiceItemTitle {
    animation: editorsChoiceContentReveal 420ms 120ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .editorsChoiceHeroMode .editorsChoiceItemBanner.is-active.editorsChoiceSlideReady .editorsChoiceItemMetadata {
    animation: editorsChoiceContentReveal 420ms 175ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .editorsChoiceHeroMode .editorsChoiceItemBanner.is-active.editorsChoiceSlideReady .editorsChoiceItemOverview {
    animation: editorsChoiceContentReveal 420ms 225ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .editorsChoiceHeroMode .editorsChoiceItemBanner.is-active.editorsChoiceSlideReady .editorsChoiceItemActions {
    animation: editorsChoiceActionReveal 360ms 275ms ease both;
  }

  @keyframes editorsChoiceContentReveal {
    from { opacity: 0; transform: translateY(0.7rem); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes editorsChoiceActionReveal {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .editorsChoiceHeroMode .editorsChoiceItemBanner .editorsChoiceContent {
    position: relative;
    z-index: 2;
    height: 100%;
    padding: 120px max(env(safe-area-inset-right), 3.3%) 30px max(env(safe-area-inset-left), 3.3%);
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

  @media (prefers-reduced-motion: reduce) {
    .editorsChoiceSkeleton::after,
    .editorsChoiceHeroMode .editorsChoiceItemPoster,
    .editorsChoiceHeroMode .editorsChoiceItemLogo,
    .editorsChoiceHeroMode .editorsChoiceItemTitle,
    .editorsChoiceHeroMode .editorsChoiceItemMetadata,
    .editorsChoiceHeroMode .editorsChoiceItemOverview,
    .editorsChoiceHeroMode .editorsChoiceItemActions {
      animation: none !important;
    }

    .editorsChoiceHeroMode .editorsChoiceItemBanner.is-active.editorsChoiceSlideReady .editorsChoiceItemPoster,
    .editorsChoiceHeroMode .editorsChoiceItemBanner.is-active.editorsChoiceSlideReady .editorsChoiceItemLogo,
    .editorsChoiceHeroMode .editorsChoiceItemBanner.is-active.editorsChoiceSlideReady .editorsChoiceItemTitle,
    .editorsChoiceHeroMode .editorsChoiceItemBanner.is-active.editorsChoiceSlideReady .editorsChoiceItemMetadata,
    .editorsChoiceHeroMode .editorsChoiceItemBanner.is-active.editorsChoiceSlideReady .editorsChoiceItemOverview {
      opacity: 1;
      transform: none;
    }

    .editorsChoiceHeroMode .editorsChoiceItemBanner.is-active.editorsChoiceSlideReady .editorsChoiceItemActions {
      opacity: 1;
    }

    .editorsChoiceHeroMode .editorsChoiceItemBanner .editorsChoiceBackdrop {
      transform: none;
      transition: opacity 120ms linear;
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
        left: {
            en: "left",
            fr: "restantes",
            es: "restantes",
            de: "übrig",
            it: "rimanenti",
            pt: "restantes",
            zh: "剩余",
            ja: "残り",
            ru: "осталось",
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
    const remaining = Number.isInteger(item.playback_remaining_minutes) && item.playback_remaining_minutes > 0
        ? " · " + formatRuntime(item.playback_remaining_minutes) + " " + getLocalizedString("left")
        : "";

    if (item.playback_action === "resume") return getLocalizedString("resume") + episode + remaining;
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
    const progress = Number.isFinite(item.playback_progress_percent)
        ? Math.max(0, Math.min(100, item.playback_progress_percent))
        : 0;
    const progressBar = progress > 0
        ? '<span class="editorsChoicePlaybackProgress" role="progressbar" aria-label="Playback progress" ' +
            'aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + progress + '">' +
            '<span class="editorsChoicePlaybackProgressFill" style="width:' + progress + '%"></span></span>'
        : "";
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
        '</button>' + progressBar + '</div>';
}

function buildBannerSizeParam(reduceImageSizes) {
    if (!reduceImageSizes) return "";
    const w = Math.max(window.screen.width, window.screen.height);
    return `?width=${w}`;
}

const backdropLoadCache = new Map();

function measureBackdropScrim(image) {
    const fallback = { strong: 0.95, mid: 0.85, soft: 0.55, faint: 0.25 };

    try {
        const canvas = document.createElement("canvas");
        const width = 48;
        const height = 27;
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) return fallback;

        context.drawImage(image, 0, 0, width, height);
        const pixels = context.getImageData(0, 0, width, height).data;
        const sampleWidth = Math.floor(width * 0.625);
        let luminance = 0;
        let samples = 0;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < sampleWidth; x++) {
                const offset = (y * width + x) * 4;
                if (pixels[offset + 3] < 32) continue;
                luminance += (0.2126 * pixels[offset]) + (0.7152 * pixels[offset + 1]) + (0.0722 * pixels[offset + 2]);
                samples++;
            }
        }

        const brightness = samples ? luminance / samples / 255 : 0.7;
        return {
            strong: 0.7 + (brightness * 0.28),
            mid: 0.58 + (brightness * 0.3),
            soft: 0.3 + (brightness * 0.3),
            faint: 0.08 + (brightness * 0.18),
        };
    } catch (error) {
        console.debug("Editors Choice: backdrop brightness analysis unavailable.", error);
        return fallback;
    }
}

function loadBackdropAsset(url) {
    if (backdropLoadCache.has(url)) return backdropLoadCache.get(url);

    const loadPromise = new Promise((resolve) => {
        const image = new Image();
        image.decoding = "async";
        image.onload = () => resolve({ image, scrim: measureBackdropScrim(image) });
        image.onerror = () => resolve({ image: null, scrim: null });
        image.src = url;
    });

    backdropLoadCache.set(url, loadPromise);
    return loadPromise;
}

function prepareHeroBackdrop($containerElem, slide) {
    const backdrop = slide && slide.querySelector(".editorsChoiceBackdrop");
    const url = backdrop && backdrop.dataset.backdropUrl;
    if (!url) return Promise.resolve();

    return loadBackdropAsset(url).then((asset) => {
        const backdrops = $containerElem[0].querySelectorAll(".editorsChoiceBackdrop[data-backdrop-url]");

        for (const target of backdrops) {
            if (target.dataset.backdropUrl !== url) continue;

            target.style.backgroundImage = 'url("' + url.replace(/"/g, "%22") + '")';
            const targetSlide = target.closest(".editorsChoiceItemBanner");
            if (!targetSlide) continue;

            if (asset.scrim) {
                targetSlide.style.setProperty("--editors-choice-scrim-strong", asset.scrim.strong.toFixed(3));
                targetSlide.style.setProperty("--editors-choice-scrim-mid", asset.scrim.mid.toFixed(3));
                targetSlide.style.setProperty("--editors-choice-scrim-soft", asset.scrim.soft.toFixed(3));
                targetSlide.style.setProperty("--editors-choice-scrim-faint", asset.scrim.faint.toFixed(3));
            }

            targetSlide.classList.add("editorsChoiceSlideReady");
        }
    });
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
    const infoClass = "editorsChoiceInfo" + (button ? " editorsChoiceInfo--withAction" : "");

    const backdropSize = buildBannerSizeParam(data.reduceImageSizes);
    const backdropUrl = `../Items/${item.id}/Images/Backdrop/0${backdropSize}`;
    const extraClass = data.heroBackdropPosition === "center" ? "editorsChoiceBackdropCenter" :
        data.heroBackdropPosition === "top" ? "editorsChoiceBackdropTop" :
        data.heroBackdropPosition === "bottom" ? "editorsChoiceBackdropBottom" : "";

    return '<article class="editorsChoiceItemBanner splide__slide" ' +
        'role="link" tabindex="0" data-details-item-id="' + escapeHtml(item.id) + '">' +
        '<div class="editorsChoiceBackdrop ' + extraClass +
        '" data-backdrop-url="' + escapeHtml(backdropUrl) + '"></div>' +
        '<div class="' + contentClass + '">' +
        poster + '<div class="' + infoClass + '">' +
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
    const infoClass = "editorsChoiceInfo" + (button ? " editorsChoiceInfo--withAction" : "");

    return '<article class="editorsChoiceItemBanner splide__slide" ' +
        'role="link" tabindex="0" data-details-item-id="' + escapeHtml(item.id) + '" ' +
        'style="background-image:url(\'../Items/' + item.id + '/Images/Backdrop/0' + bannerSize + '\');">' +
        '<div class="' + contentClass + '">' +
        poster + '<div class="' + infoClass + '">' +
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
                const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                const autoplayEnabled = !!data.autoplay && !prefersReducedMotion && favourites.length > 1;

                $containerElem.first().attr("id", containerId);
                $containerElem.first().addClass(`editorsChoiceHeight-${data.bannerHeight}`);
                $containerElem.toggleClass("editorsChoiceIsLoading", !!data.useHeroLayout);
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

                $containerElem.on("click", ".splide__pagination, .editorsChoiceMobilePagination", function (event) {
                    event.stopPropagation();
                });

                $list.on("click", ".editorsChoiceItemBanner", function (event) {
                    if ($(event.target).closest(".splide__pagination, .editorsChoiceMobilePagination").length) return;
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

                const slider = new Splide(`#${containerId} .splide`, {
                    type: data.transitionEffect ?? "loop",
                    autoplay: autoplayEnabled,
                    arrows: false,
                    rewind: true,
                    interval: data.autoplayInterval,
                    pauseOnHover: true,
                    pauseOnFocus: true,
                    pagination: true,
                    keyboard: true,
                    speed: data.useHeroLayout ? 650 : 400,
                    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                    height: `${data.bannerHeight + (data.useHeroLayout ? 120 : 0)}px`,
                });

                const updateMobilePagination = () => {
                    $containerElem.find(".editorsChoiceMobilePageCurrent").text(slider.index + 1);
                    $containerElem.find(".editorsChoiceMobilePageTotal").text(slider.length);
                };

                const getOriginalSlides = () => Array.from($list[0].children)
                    .filter((slide) => !slide.classList.contains("splide__slide--clone"));

                const prepareSlideAt = (index) => {
                    if (!data.useHeroLayout) return Promise.resolve();
                    const slides = getOriginalSlides();
                    if (!slides.length) return Promise.resolve();
                    const normalizedIndex = ((index % slides.length) + slides.length) % slides.length;
                    return prepareHeroBackdrop($containerElem, slides[normalizedIndex]);
                };

                const preloadFollowingSlide = () => {
                    if (slider.length > 1) prepareSlideAt(slider.index + 1);
                };

                slider.on("mounted", () => {
                    updateMobilePagination();
                    $containerElem.toggleClass("editorsChoiceSingleSlide", slider.length <= 1);

                    if (data.useHeroLayout) {
                        prepareSlideAt(slider.index).then(() => {
                            $containerElem.removeClass("editorsChoiceIsLoading");
                        });
                        preloadFollowingSlide();
                    } else {
                        $containerElem.removeClass("editorsChoiceIsLoading");
                    }
                });

                slider.on("move", (newIndex) => {
                    prepareSlideAt(newIndex);
                });

                slider.on("moved", () => {
                    updateMobilePagination();
                    preloadFollowingSlide();
                });

                $containerElem.on("click", ".editorsChoiceMobilePagePrev", function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    slider.go("<");
                });

                $containerElem.on("click", ".editorsChoiceMobilePageNext", function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    slider.go(">");
                });

                slider.mount();
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
