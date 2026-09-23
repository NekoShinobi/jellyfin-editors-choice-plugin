const container = `
<div class="verticalSection section-1 editorsChoiceContainer">
  <div class="splide cardScalable">
    <div class="editorsChoiceScrollButtonsContainer">
      <div class="emby-scrollbuttons splide__arrows">
        <button type="button" is="paper-icon-button-light" data-ripple="false" data-direction="left" title="Previous"
          class="emby-scrollbuttons-button paper-icon-button-light splide__arrow splide__arrow--prev">
          <span class="material-icons chevron_left" aria-hidden="true"></span>
        </button>

        <button class="editorsChoicePlayPause splide__toggle emby-scrollbuttons-button paper-icon-button-light" type="button">
          <span class="splide__toggle__play material-icons play_arrow" aria-hidden="true"></span>
          <span class="splide__toggle__pause material-icons pause" aria-hidden="true"></span>
        </button>

        <button type="button" is="paper-icon-button-light" data-ripple="false" data-direction="right" title="Next"
          class="emby-scrollbuttons-button paper-icon-button-light splide__arrow splide__arrow--next">
          <span class="material-icons chevron_right" aria-hidden="true"></span>
        </button>
      </div>
    </div>

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

  /* ===== Slider controls ===== */
  .editorsChoiceScrollButtonsContainer {
    position: absolute;
    z-index: 4;
    top: 0.5rem;
    right: max(env(safe-area-inset-right), 3.3%);
  }

  .editorsChoiceScrollButtonsContainer .splide__arrows {
    display: flex;
    align-items: center;
  }

  .editorsChoiceScrollButtonsContainer .splide__arrow,
  .editorsChoiceScrollButtonsContainer .splide__toggle {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    top: auto;
    left: auto;
    right: auto;
    transform: none;
    opacity: 1;
    width: 2.5rem;
    height: 2.5rem;
    background: rgba(16, 18, 22, 0.42);
    color: #fff;
    border: 0;
    border-radius: 50%;
  }

  .editorsChoiceHeroMode .editorsChoiceScrollButtonsContainer { top: 120px; }
  .editorsChoiceSingleSlide .editorsChoiceScrollButtonsContainer { display: none; }

  @media screen and (max-width: 899px) {
    .editorsChoiceScrollButtonsContainer .splide__arrow { display: none; }
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
    color: rgba(255, 255, 255, 0.8);
    text-decoration: none;
    background-position-y: 52%;
  }

  .editorsChoiceItemBanner:nth-child(odd) { background-position-y: 48%; }

  .editorsChoiceOpeningSlide--gradient .editorsChoiceBackdrop {
    background:
      radial-gradient(circle at 78% 28%, rgba(126, 87, 194, 0.48), transparent 31%),
      radial-gradient(circle at 65% 78%, rgba(0, 164, 220, 0.3), transparent 34%),
      linear-gradient(125deg, #0d111a 8%, #1b2030 48%, #131722 100%);
  }

  .editorsChoiceOpeningSlide .editorsChoiceItemMetadata {
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .editorsChoiceOpeningAction {
    width: fit-content !important;
    display: inline-flex !important;
    align-items: center;
    gap: 0.4em;
    margin: 0 !important;
    color: inherit;
    text-decoration: none;
    justify-content: center;
    white-space: normal;
  }

  .editorsChoiceOpeningSlide .editorsChoiceItemActions {
    max-width: 100%;
    flex-wrap: wrap;
  }

  .editorsChoiceCustomButton {
    background-color: var(--ec-button-background) !important;
    color: var(--ec-button-text) !important;
    opacity: var(--ec-button-opacity, 1);
  }

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
    height: min(75%, 36vw, 37.5rem);
    width: auto;
    max-width: none;
    aspect-ratio: 2 / 3;
    align-self: center;
    object-fit: cover;
    border-radius: 0.45rem;
    box-shadow: 0 1.1rem 2.8rem rgba(4, 9, 15, 0.42), inset 0 0 0 1px rgba(255, 255, 255, 0.12);
    transition: transform 180ms ease, filter 180ms ease;
  }

  .editorsChoicePosterButton {
    position: relative;
    display: block;
    width: auto;
    height: min(75%, 36vw, 37.5rem);
    max-width: none;
    aspect-ratio: 2 / 3;
    align-self: center;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: 0.45rem;
    color: #fff;
    background: transparent;
    cursor: pointer;
  }

  .editorsChoicePosterButton .editorsChoiceItemPoster {
    width: 100%;
    height: 100%;
    max-width: none;
  }

  .editorsChoicePosterButton::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: rgba(0, 0, 0, 0.34);
    opacity: 0;
    pointer-events: none;
    transition: opacity 180ms ease;
  }

  .editorsChoicePosterButton:hover .editorsChoiceItemPoster,
  .editorsChoicePosterButton:focus-visible .editorsChoiceItemPoster {
    filter: brightness(0.72);
    transform: scale(1.025);
  }

  .editorsChoicePosterButton:hover::after,
  .editorsChoicePosterButton:focus-visible::after {
    opacity: 1;
  }

  .editorsChoicePosterButton:focus-visible {
    outline: 3px solid currentColor;
    outline-offset: 4px;
  }

  .editorsChoiceTrailerIcon {
    position: absolute;
    z-index: 1;
    top: 50%;
    left: 50%;
    padding: 0.38rem;
    border-radius: 50%;
    font-size: 2.25rem;
    opacity: 0;
    background: rgba(0, 0, 0, 0.72);
    backdrop-filter: blur(8px);
    pointer-events: none;
    transform: translate(-50%, -50%) scale(0.82);
    transition: opacity 180ms ease, transform 180ms ease;
  }

  .editorsChoicePosterButton:hover .editorsChoiceTrailerIcon,
  .editorsChoicePosterButton:focus-visible .editorsChoiceTrailerIcon {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
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
    flex-direction: row;
    align-items: flex-start;
    gap: 0.55rem;
  }

  .editorsChoicePlayAction {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  .editorsChoiceItemButton,
  .editorsChoiceInfoButton {
    width: fit-content !important;
    display: inline-flex !important;
    align-items: center;
    gap: 0.4em;
    position: relative;
    margin: 0 !important;
  }

  .editorsChoiceInfoButton {
    justify-content: center;
    min-width: 2.8rem;
    padding-right: 0.8em !important;
    padding-left: 0.8em !important;
  }

  .editorsChoiceInfoIcon {
    font-size: 1.25em;
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
      width: auto;
      height: min(65%, 40.5vw, 12rem);
      max-width: none;
    }

    .editorsChoicePosterButton {
      width: auto;
      height: min(65%, 40.5vw, 12rem);
      max-width: none;
    }

    .editorsChoicePosterButton .editorsChoiceItemPoster {
      width: 100%;
      height: 100%;
      max-height: none;
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

  .editorsChoiceThemeVideo {
    display: none;
  }

  .editorsChoiceThemeVideoToggle {
    display: none;
  }

  @media screen and (min-width: 900px) {
    .editorsChoiceHeroMode .editorsChoiceItemBanner--withThemeVideo .editorsChoiceThemeVideo {
      position: absolute;
      inset: 0 0 0 auto;
      z-index: 1;
      display: block;
      width: 56%;
      overflow: hidden;
      opacity: 0;
      clip-path: polygon(14% 0, 100% 0, 100% 100%, 0 100%);
      -webkit-mask-image: linear-gradient(
        99deg,
        transparent 0%,
        rgba(0, 0, 0, 0.14) 9%,
        rgba(0, 0, 0, 0.68) 19%,
        #000 30%
      );
      mask-image: linear-gradient(
        99deg,
        transparent 0%,
        rgba(0, 0, 0, 0.14) 9%,
        rgba(0, 0, 0, 0.68) 19%,
        #000 30%
      );
      background: #07090d;
      pointer-events: none;
      transition: opacity 360ms ease;
    }

    .editorsChoiceHeroMode .editorsChoiceItemBanner--withThemeVideo .editorsChoiceThemeVideo::after {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, rgba(7, 9, 13, 0.48) 0%, rgba(7, 9, 13, 0) 22%);
    }

    .editorsChoiceHeroMode .editorsChoiceThemeVideoPlayer {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .editorsChoiceHeroMode .editorsChoiceItemBanner.is-active.editorsChoiceSlideReady .editorsChoiceThemeVideo.editorsChoiceThemeVideoReady {
      opacity: 1;
    }

    .editorsChoiceHeroMode .editorsChoiceItemBanner.is-active .editorsChoiceThemeVideoToggle {
      position: absolute;
      right: max(1.1rem, env(safe-area-inset-right));
      bottom: 1.1rem;
      z-index: 5;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.75rem;
      height: 2.75rem;
      margin: 0;
      padding: 0;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      color: #fff;
      background: rgba(16, 18, 22, 0.52);
      box-shadow: 0 8px 28px rgba(4, 9, 15, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(14px) saturate(145%);
      -webkit-backdrop-filter: blur(14px) saturate(145%);
      cursor: pointer;
      transition: background-color 160ms ease, transform 160ms ease;
    }

    .editorsChoiceHeroMode .editorsChoiceThemeVideoToggle:hover {
      background: rgba(16, 18, 22, 0.76);
    }

    .editorsChoiceHeroMode .editorsChoiceThemeVideoToggle:active {
      transform: scale(0.94);
    }

    .editorsChoiceHeroMode .editorsChoiceThemeVideoToggle:focus-visible {
      outline: 2px solid #fff;
      outline-offset: 3px;
    }

    .editorsChoiceHeroMode .editorsChoiceThemeVideoToggle .material-icons {
      font-size: 1.35rem;
    }

    .editorsChoiceHeroMode .editorsChoiceThemeVideoHidden .editorsChoiceThemeVideo {
      opacity: 0 !important;
    }

    .editorsChoiceHeroMode .editorsChoiceItemBanner--withThemeVideo .editorsChoiceContent {
      padding-right: max(50%, env(safe-area-inset-right));
    }
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
  @media (prefers-reduced-motion: reduce) {
    .editorsChoiceThemeVideo,
    .editorsChoiceThemeVideoToggle { display: none !important; }
  }

  /* Additional dimming sits above artwork/video and below all text and controls. */
  .editorsChoiceDimming {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    background: rgba(0, 0, 0, var(--ec-dimming, 0));
  }
  .editorsChoiceItemBanner > .editorsChoiceContent,
  .editorsChoiceHeroMode .editorsChoiceItemBanner > .editorsChoiceContent { z-index: 3; }
  .editorsChoiceNoBackgroundMotion .editorsChoiceItemBanner { animation: none !important; }
  .editorsChoiceNoBackgroundMotion .editorsChoiceItemBanner .editorsChoiceBackdrop {
    transform: none !important;
    transition-property: opacity !important;
  }
  .homeSectionsContainer.editorsChoiceAdded .editorsChoiceContainer.editorsChoiceCustomHeight {
    transform: translateY(var(--ec-fullscreen-offset, 0px));
    margin-bottom: calc(1.8em + var(--ec-fullscreen-offset, 0px));
  }
  .editorsChoiceHeroMode .homeSectionsContainer.editorsChoiceAdded .editorsChoiceContainer.editorsChoiceCustomHeight {
    margin-bottom: var(--ec-fullscreen-offset, 0px);
  }
  .editorsChoiceHeroMode .editorsChoiceCustomHeight .editorsChoiceItemBanner .editorsChoiceContent {
    padding-top: 30px;
  }
  .editorsChoiceCustomHeight .editorsChoiceInfo { height: 100%; }
  .editorsChoiceCustomHeight :is(.editorsChoiceItemPoster, .editorsChoicePosterButton) {
    height: min(100%, 36vw, 37.5rem);
  }
  .editorsChoiceCustomHeight .editorsChoiceItemOverview { flex-shrink: 0; }
  .editorsChoiceCompactHeight .editorsChoiceItemOverview {
    max-height: 2.9em;
    -webkit-line-clamp: 2;
  }
  .editorsChoiceShortHeight :is(.editorsChoiceItemLogo, .editorsChoiceItemTitle) { height: 3rem; }
  .editorsChoiceShortHeight .editorsChoiceItemMetadata { margin-top: 0.4em; }
  .editorsChoiceShortHeight .editorsChoiceItemOverview { display: none; }
  @media screen and (max-width: 500px) {
    .editorsChoiceCustomHeight :is(.editorsChoiceItemPoster, .editorsChoicePosterButton) {
      height: min(100%, 40.5vw, 12rem);
    }
  }
  .editorsChoiceCustomHeight .editorsChoiceSkeleton { padding-top: 30px; }
  .editorsChoiceHeroMode .editorsChoiceCustomHeight .editorsChoiceScrollButtonsContainer { top: .5rem; }
  .editorsChoiceTransitionOutgoing .editorsChoiceBackdrop { opacity: 1 !important; }
  .editorsChoiceTransitionOutgoing :is(.editorsChoiceItemPoster, .editorsChoiceItemLogo, .editorsChoiceItemTitle, .editorsChoiceItemMetadata, .editorsChoiceItemOverview, .editorsChoiceItemActions),
  .editorsChoiceInstant .is-active.editorsChoiceSlideReady :is(.editorsChoiceItemPoster, .editorsChoiceItemLogo, .editorsChoiceItemTitle, .editorsChoiceItemMetadata, .editorsChoiceItemOverview, .editorsChoiceItemActions) {
    animation: none !important;
    opacity: 1 !important;
  }
  .editorsChoiceInstant .editorsChoiceBackdrop { transition-duration: 0ms !important; }
  @media (prefers-reduced-motion: reduce) {
    .editorsChoiceContainer .editorsChoiceItemBanner { animation: none !important; }
    .editorsChoiceContainer .editorsChoiceBackdrop { transform: none !important; transition: none !important; }
  }
  .editorsChoiceContainer .editorsChoiceItemTitle { font-family: var(--ec-font-title, inherit); }
  .editorsChoiceContainer .editorsChoiceItemMetadata { font-family: var(--ec-font-metadata, inherit); }
  .editorsChoiceContainer .editorsChoiceItemOverview { font-family: var(--ec-font-description, inherit); }
  .editorsChoiceContainer :is(.editorsChoiceItemButton, .editorsChoiceInfoButton, .editorsChoiceOpeningAction) { font-family: var(--ec-font-button, inherit); }
  .editorsChoiceOpeningSlide--center > .editorsChoiceContent { justify-content: center; }
  .editorsChoiceOpeningSlide--center .editorsChoiceInfo {
    align-items: center;
    text-align: center;
  }
  .editorsChoiceOpeningSlide--center .editorsChoiceContentMain { align-items: center; }
  .editorsChoiceOpeningSlide--center .editorsChoiceItemTitle,
  .editorsChoiceOpeningSlide--center .editorsChoiceItemMetadata { justify-content: center; }
  .editorsChoiceOpeningSlide--center .editorsChoiceItemTitle { margin-right: 0; }
  .editorsChoiceOpeningSlide--center .editorsChoiceItemActions {
    right: auto;
    left: 50%;
    justify-content: center;
    transform: translateX(-50%);
  }
  .editorsChoiceOpeningSlide--right > .editorsChoiceContent { justify-content: end; }
  .editorsChoiceOpeningSlide--right .editorsChoiceInfo {
    align-items: flex-end;
    text-align: right;
  }
  .editorsChoiceOpeningSlide--right .editorsChoiceContentMain { align-items: flex-end; }
  .editorsChoiceOpeningSlide--right .editorsChoiceItemTitle,
  .editorsChoiceOpeningSlide--right .editorsChoiceItemMetadata { justify-content: flex-end; }
  .editorsChoiceOpeningSlide--right .editorsChoiceItemTitle { margin-right: 0; }
  .editorsChoiceOpeningSlide--right .editorsChoiceItemActions {
    right: 0;
    left: auto;
    justify-content: flex-end;
    transform: none;
  }
  .editorsChoiceOpeningSlide--left .editorsChoiceItemActions {
    right: auto;
    left: 0;
    transform: none;
  }
  .editorsChoiceHeroMode .editorsChoiceOpeningSlide--right .editorsChoiceBackdrop::after {
    transform: scaleX(-1);
  }
  .editorsChoiceHeroMode .editorsChoiceOpeningSlide--center .editorsChoiceBackdrop::after {
    background: linear-gradient(90deg, rgba(0,0,0,.22), rgba(0,0,0,.78) 50%, rgba(0,0,0,.22));
  }
  .editorsChoiceIsLoading .splide, .editorsChoiceMessage .splide { position: relative; visibility: visible; }
  .editorsChoiceIsLoading .editorsChoiceScrollButtonsContainer,
  .editorsChoiceIsLoading .editorsChoiceMobilePagination,
  .editorsChoiceMessage .editorsChoiceScrollButtonsContainer,
  .editorsChoiceMessage .editorsChoiceMobilePagination { visibility: hidden; }
  .editorsChoiceMessageText { position: absolute; inset: 0; display: grid; place-content: center; text-align: center; }
</style>
`;

const GUID = "70bb2ec1-f19e-46b5-b49a-942e6b96ebae";
const HOME_CONTAINER_SELECTOR = "#indexPage:not(.hide) #homeTab.is-active .homeSectionsContainer";
const EDITORS_CHOICE_ADDED_CLASS = "editorsChoiceAdded";
const EDITORS_CHOICE_LOADING_CLASS = "editorsChoiceLoading";
const initializingContainers = new WeakSet();
const initializedContainers = new WeakSet();

/* ===== Utils ===== */

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

function buildCustomButtonStyle(backgroundColor, textColor, opacity = 100) {
    if (!/^#[0-9a-f]{6}$/i.test(backgroundColor || "") || !/^#[0-9a-f]{6}$/i.test(textColor || "")) {
        return { className: "", attribute: "" };
    }

    const normalizedOpacity = Math.min(100, Math.max(0, Number(opacity)));
    const alpha = Number.isFinite(normalizedOpacity) ? normalizedOpacity / 100 : 1;
    return {
        className: " editorsChoiceCustomButton",
        attribute: ` style="--ec-button-background:${backgroundColor};--ec-button-text:${textColor};--ec-button-opacity:${alpha}"`,
    };
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

    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const headerHeight = document.querySelector(".skinHeader")?.getBoundingClientRect().height || 0;
    const largestConfiguredHeight = Math.max(
        bannerHeightPixels(data, false, viewportHeight, headerHeight),
        bannerHeightPixels(data, true, viewportHeight, headerHeight)
    );
    const requestedHeight = Math.min(600, Math.max(180, Math.ceil(largestConfiguredHeight - 60)));
    const posterSize = data.reduceImageSizes ? `?height=${requestedHeight}` : "";
    const image = `<img class="editorsChoiceItemPoster" src="../Items/${escapeHtml(item.id)}/Images/Primary/0${posterSize}" alt="${escapeHtml(item.name)} poster" loading="lazy" decoding="async"/>`;

    if (!item.has_trailer) return image;

    const hasLocalTrailer = !!item.trailer_item_id;
    const trailerAction = hasLocalTrailer ? "play" : "playtrailer";
    const trailerItemId = item.trailer_item_id || item.id;
    const trailerItemType = item.trailer_item_type || item.item_type;
    const trailerIsFolder = hasLocalTrailer ? false : !!item.play_is_folder;

    return `<button type="button" is="emby-button" class="editorsChoicePosterButton itemAction emby-button" data-action="${trailerAction}" data-id="${escapeHtml(trailerItemId)}" data-serverid="${escapeHtml(ApiClient.serverId())}" data-type="${escapeHtml(trailerItemType)}" data-mediatype="Video" data-isfolder="${trailerIsFolder ? "true" : "false"}" data-positionticks="0" title="Play trailer" aria-label="Play trailer: ${escapeHtml(item.name)}">${image}<span class="material-icons editorsChoiceTrailerIcon play_circle_filled" aria-hidden="true"></span></button>`;
}

function buildThemeVideo(item) {
    if (!item.theme_video_id) return "";

    return `<div class="editorsChoiceThemeVideo" aria-hidden="true"><video class="editorsChoiceThemeVideoPlayer" muted loop playsinline preload="auto" data-theme-video-id="${escapeHtml(item.theme_video_id)}"></video></div><button type="button" is="emby-button" class="editorsChoiceThemeVideoToggle emby-button" aria-label="Hide theme video" title="Hide theme video" aria-pressed="false"><span class="material-icons videocam_off" aria-hidden="true"></span></button>`;
}

function buildOverview(item, fallback = "") {
    const hasOverview = item && typeof item.overview_html === "string";
    const overview = hasOverview ? item.overview_html : "";
    const content = overview || (hasOverview ? escapeHtml(fallback) : "");
    return content ? '<div class="editorsChoiceItemOverview">' + content + '</div>' : "";
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
        ? `<span class="editorsChoicePlaybackProgress" role="progressbar" aria-label="Playback progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><span class="editorsChoicePlaybackProgressFill" style="width:${progress}%"></span></span>`
        : "";
    const customStyle = data.useCustomPlayButtonColors
        ? buildCustomButtonStyle(data.playButtonBackgroundColor, data.playButtonTextColor)
        : { className: "", attribute: "" };

    return `<div class="editorsChoicePlayAction"><button type="button" is="emby-button" class="editorsChoiceItemButton itemAction raised button-submit emby-button${customStyle.className}"${customStyle.attribute} data-action="${nativeAction}" data-id="${escapeHtml(playItemId)}" data-serverid="${escapeHtml(ApiClient.serverId())}" data-type="${escapeHtml(playItemType)}" data-mediatype="Video" data-isfolder="${item.play_is_folder ? "true" : "false"}" data-positionticks="${positionTicks}" aria-label="${escapeHtml(buttonText)}: ${escapeHtml(item.name)}"><span class="material-icons editorsChoicePlayIcon play_arrow" aria-hidden="true"></span><span>${escapeHtml(buttonText)}</span></button>${progressBar}</div>`;
}

function buildInfoButton(item) {
    return `<button type="button" is="emby-button" class="editorsChoiceInfoButton itemAction raised emby-button" data-action="link" data-id="${escapeHtml(item.id)}" data-serverid="${escapeHtml(ApiClient.serverId())}" data-type="${escapeHtml(item.item_type)}" data-mediatype="Video" data-isfolder="${item.play_is_folder ? "true" : "false"}" aria-label="More information: ${escapeHtml(item.name)}"><span class="material-icons editorsChoiceInfoIcon info" aria-hidden="true"></span></button>`;
}

function buildActions(item, data) {
    return `<div class="editorsChoiceItemActions">${buildPlayButton(item, data)}${buildInfoButton(item)}</div>`;
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

function loadBackdropAsset(url, fetchPriority = "auto") {
    if (backdropLoadCache.has(url)) return backdropLoadCache.get(url);

    const loadPromise = new Promise((resolve) => {
        const image = new Image();
        let settled = false;
        const finish = (asset) => {
            if (settled) return;
            settled = true;
            window.clearTimeout(timeoutId);
            resolve(asset);
        };
        const timeoutId = window.setTimeout(() => {
            console.warn("Editors Choice: backdrop preload timed out; displaying it without brightness analysis.");
            finish({ image: null, scrim: null });
        }, 8000);

        image.decoding = "async";
        image.fetchPriority = fetchPriority;
        image.onload = () => finish({ image, scrim: measureBackdropScrim(image) });
        image.onerror = () => finish({ image: null, scrim: null });
        image.src = url;
    });

    backdropLoadCache.set(url, loadPromise);
    return loadPromise;
}

function prepareHeroBackdrop($containerElem, slide, fetchPriority = "auto") {
    const backdrop = slide && slide.querySelector(".editorsChoiceBackdrop");
    const url = backdrop && backdrop.dataset.backdropUrl;
    if (!url) {
        for (const target of $containerElem[0].querySelectorAll(".editorsChoiceBackdrop")) {
            if (!target.dataset.backdropUrl) {
                target.closest(".editorsChoiceItemBanner")?.classList.add("editorsChoiceSlideReady");
            }
        }
        return Promise.resolve();
    }

    return loadBackdropAsset(url, fetchPriority).then((asset) => {
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

function pauseThemeVideos(containerElement) {
    const videos = containerElement.querySelectorAll(".editorsChoiceThemeVideoPlayer");
    for (const video of videos) video.pause();
}

const themeVideoLoadCache = new WeakMap();

function loadThemeVideo(video) {
    if (themeVideoLoadCache.has(video)) return themeVideoLoadCache.get(video);

    const frame = video.closest(".editorsChoiceThemeVideo");
    const themeVideoId = video.dataset.themeVideoId;
    if (!frame || !themeVideoId) return Promise.resolve(false);

    const loadPromise = new Promise((resolve) => {
        let settled = false;
        const finish = (ready) => {
            if (settled) return;
            settled = true;
            video.removeEventListener("canplay", handleCanPlay);
            video.removeEventListener("error", handleError);
            frame.classList.toggle("editorsChoiceThemeVideoReady", ready);
            frame.classList.toggle("editorsChoiceThemeVideoUnavailable", !ready);
            resolve(ready);
        };
        const handleCanPlay = () => finish(true);
        const handleError = () => finish(false);

        video.addEventListener("canplay", handleCanPlay, { once: true });
        video.addEventListener("error", handleError, { once: true });
        video.src = ApiClient.getUrl(`Videos/${themeVideoId}/stream`, {
            Static: true,
            ApiKey: ApiClient.accessToken(),
        });
        video.load();

        if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) finish(true);
    });

    themeVideoLoadCache.set(video, loadPromise);
    return loadPromise;
}

async function prepareThemeVideo(slide, shouldPlay) {
    const video = slide && slide.querySelector(".editorsChoiceThemeVideoPlayer");
    if (!video || !window.matchMedia("(min-width: 900px)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ready = await loadThemeVideo(video);
    if (!ready || !shouldPlay || !slide.classList.contains("is-active")) return;
    if (slide.closest(".editorsChoiceThemeVideoHidden")) return;

    await video.play().catch((error) => {
        console.debug("Editors Choice: theme video autoplay unavailable.", error);
    });
}

function bannerNumber(value, fallback, min, max) {
    const number = Number(value);
    return value != null && Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function bannerHeightSettings(data, mobile) {
    const override = mobile && ["pixels", "viewport", "fullscreen"].includes(data.mobileBannerHeightMode);
    return {
        mode: override ? data.mobileBannerHeightMode : data.bannerHeightMode || "preset",
        pixels: bannerNumber(override ? data.mobileBannerCustomHeight : data.bannerCustomHeight, override ? 360 : 600, 240, 2160),
        percent: bannerNumber(override ? data.mobileBannerViewportHeight : data.bannerViewportHeight, override ? 60 : 75, 25, 100),
    };
}

function bannerHeightPixels(data, mobile, viewportHeight, headerHeight) {
    const settings = bannerHeightSettings(data, mobile);
    if (settings.mode === "pixels") return settings.pixels;
    if (settings.mode === "viewport") return Math.max(1, viewportHeight * settings.percent / 100);
    if (settings.mode === "fullscreen") return Math.max(1, viewportHeight - (data.bannerSubtractHeader !== false ? headerHeight : 0));
    return bannerNumber(data.bannerHeight, 360, 1, 2160) + 120;
}

// Fade layout supplies stacked, accessible slides; this component controls the
// animation and tells Splide when it finishes so navigation cannot overlap it.
function bannerTransition(effect) {
    return (slider, components) => {
        let previous = slider.index;
        let direction = 1;
        let animations = [];
        let outgoing;
        let incoming;
        let generation = 0;
        function cancel() {
            generation++;
            animations.forEach((animation) => animation.cancel());
            animations = [];
            outgoing?.classList.remove("editorsChoiceTransitionOutgoing");
            outgoing?.style.removeProperty("z-index");
            incoming?.style.removeProperty("z-index");
        }
        function init() {
            components.Slides.forEach((slide) => slide.style("transform", `translateX(-${100 * slide.index}%)`));
        }
        function captureDirection(index, previousIndex, destinationIndex) {
            let delta = (destinationIndex === previousIndex ? index : destinationIndex) - previousIndex;
            // Fade mode reports a wrapped index rather than an out-of-range
            // destination. Choose the shortest route so last → first remains
            // forward and first → last remains backward.
            if (delta > slider.length / 2) delta -= slider.length;
            if (delta < -slider.length / 2) delta += slider.length;
            direction = delta >= 0 ? 1 : -1;
        }
        return {
            mount() {
                slider.on("mounted refresh", init);
                slider.on("move", captureDirection);
            },
            start(index, done) {
                cancel();
                incoming = components.Slides.getAt(index)?.slide;
                outgoing = components.Slides.getAt(previous)?.slide;
                previous = index;
                const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : slider.options.speed;
                if (!incoming || !outgoing || incoming === outgoing || !duration || effect === "instant" || !incoming.animate) {
                    done();
                    return;
                }
                const run = generation;
                incoming.style.zIndex = "2";
                outgoing.style.zIndex = "1";
                outgoing.classList.add("editorsChoiceTransitionOutgoing");
                const position = `translateX(-${100 * index}%)`;
                const wipeStart = direction > 0 ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)";
                const frames = effect === "wipe"
                    ? [{ clipPath: wipeStart, opacity: 1 }, { clipPath: "inset(0 0% 0 0)", opacity: 1 }]
                    : [{ opacity: 0, transform: `${position} scale(1.08)` }, { opacity: 1, transform: `${position} scale(1)` }];
                const options = { duration, easing: slider.options.easing, fill: "both" };
                animations = [
                    incoming.animate(frames, options),
                    outgoing.animate([{ opacity: 1 }, { opacity: effect === "wipe" ? 1 : 0 }], options),
                ];
                Promise.all(animations.map((animation) => animation.finished)).then(() => {
                    if (run !== generation) return;
                    cancel();
                    done();
                }).catch(() => { /* Cancellation is handled by Splide's move lifecycle. */ });
            },
            cancel,
            destroy: cancel,
        };
    };
}

const bannerSliders = new Map();

const bannerFonts = {
    default: "inherit", system: "system-ui, sans-serif", noto: '"Noto Sans", sans-serif',
    arial: "Arial, Helvetica, sans-serif", verdana: "Verdana, Geneva, sans-serif",
    trebuchet: '"Trebuchet MS", sans-serif', georgia: "Georgia, serif",
    serif: '"Times New Roman", Times, serif', mono: "ui-monospace, Consolas, monospace",
};

function applyBannerFonts(data, element) {
    for (const tier of ["title", "metadata", "description", "button"]) {
        const key = data[tier + "Font"];
        element.style.setProperty("--ec-font-" + tier, Object.hasOwn(bannerFonts, key) ? bannerFonts[key] : "inherit");
    }
}

function applyBannerGeometry(data, element) {
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const mode = bannerHeightSettings(data, mobile).mode;
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const headerHeight = document.querySelector(".skinHeader")?.getBoundingClientRect().height || 0;
    const root = element.querySelector(".splide");
    const previousOffset = parseFloat(element.style.getPropertyValue("--ec-fullscreen-offset")) || 0;
    element.classList.toggle("editorsChoiceCustomHeight", mode !== "preset");
    const height = bannerHeightPixels(data, mobile, viewportHeight, headerHeight);
    element.classList.toggle("editorsChoiceCompactHeight", mode !== "preset" && height < 480);
    element.classList.toggle("editorsChoiceShortHeight", mode !== "preset" && height < 360);
    root.style.height = `${height}px`;
    let offset = 0;
    if (mode === "fullscreen") {
        let scroll = window.scrollY;
        for (let parent = element.parentElement; parent && parent !== document.body && parent !== document.documentElement; parent = parent.parentElement) scroll += parent.scrollTop;
        const top = root.getBoundingClientRect().top - previousOffset + scroll;
        offset = (data.bannerSubtractHeader !== false ? headerHeight : 0) - top;
    }
    element.style.setProperty("--ec-fullscreen-offset", `${offset}px`);
    return height;
}

const pendingBanners = new Map();

function createBannerShell(parent, data) {
    const template = document.createElement("template");
    template.innerHTML = container.trim();
    const element = template.content.querySelector(".editorsChoiceContainer");
    element.id = `editorsChoice-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    element.classList.add("editorsChoiceIsLoading");
    element.setAttribute("aria-busy", "true");
    element.setAttribute("aria-label", "Featured content");
    parent.closest("#homeTab")?.classList.add("editorsChoiceHeroMode");
    parent.classList.add(EDITORS_CHOICE_ADDED_CLASS);
    parent.prepend(template.content);
    applyBannerFonts(data, element);
    const update = () => applyBannerGeometry(data, element);
    update();
    const frame = requestAnimationFrame(update);
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    const header = document.querySelector(".skinHeader");
    const observer = header && typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    if (observer) observer.observe(header);
    pendingBanners.set(element, () => {
        cancelAnimationFrame(frame);
        window.removeEventListener("resize", update);
        window.visualViewport?.removeEventListener("resize", update);
        observer?.disconnect();
        pendingBanners.delete(element);
    });
    return element;
}

function finishBannerLoading(element) {
    element.classList.remove("editorsChoiceIsLoading");
    element.setAttribute("aria-busy", "false");
}

function showBannerMessage(element, text, retry) {
    finishBannerLoading(element);
    element.classList.add("editorsChoiceMessage");
    const message = document.createElement("div");
    message.className = "editorsChoiceMessageText";
    message.setAttribute("role", "status");
    const label = document.createElement("p");
    label.textContent = text;
    message.append(label);
    if (retry) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "emby-button raised";
        button.textContent = "Retry";
        button.addEventListener("click", retry, { once: true });
        message.append(button);
    }
    element.querySelector(".splide").append(message);
}

async function waitForBannerClient() {
    const deadline = Date.now() + 15000;
    while (!window.ApiClient?.fetch || typeof window.$ !== "function") {
        if (Date.now() >= deadline) throw new Error("Jellyfin client did not become ready.");
        await new Promise(resolve => setTimeout(resolve, 50));
    }
}

function bannerPresentation(data, element) {
    return (slider) => {
        const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
        const header = document.querySelector(".skinHeader");
        let headerObserver;
        let layoutFrame;
        const customDuration = bannerNumber(data.transitionDurationMs, 0, 0, 3000);
        function update() {
            const height = applyBannerGeometry(data, element);
            element.classList.toggle("editorsChoiceNoBackgroundMotion", data.enableBackgroundMotion === false || motion.matches);
            element.classList.toggle("editorsChoiceInstant", data.transitionEffect === "instant" || motion.matches);
            if (slider.options.height !== `${height}px`) slider.options = { height: `${height}px` };
            const speed = data.transitionEffect === "instant" || motion.matches ? 0 : customDuration || 650;
            if (slider.options.speed !== speed) slider.options = { speed };
            if (motion.matches) {
                slider.Components.Autoplay?.pause();
                pauseThemeVideos(element);
            }
        }
        return {
            mount() {
                slider.on("mounted", () => {
                    update();
                    // The home container's layout class is applied after mount.
                    layoutFrame = window.requestAnimationFrame(update);
                });
                window.addEventListener("resize", update);
                window.visualViewport?.addEventListener("resize", update);
                motion.addEventListener("change", update);
                if (header && typeof ResizeObserver !== "undefined") {
                    headerObserver = new ResizeObserver(update);
                    headerObserver.observe(header);
                }
            },
            destroy() {
                window.removeEventListener("resize", update);
                window.visualViewport?.removeEventListener("resize", update);
                motion.removeEventListener("change", update);
                headerObserver?.disconnect();
                window.cancelAnimationFrame(layoutFrame);
                pauseThemeVideos(element);
                bannerSliders.delete(element);
            },
        };
    };
}

let splideLoadPromise;
function ensureSplideLoaded() {
    if (window.Splide) return Promise.resolve();
    if (splideLoadPromise) return splideLoadPromise;

    if (!document.querySelector('link[data-editorschoice-splide="1"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/css/splide.min.css";
        link.dataset.editorschoiceSplide = "1";
        link.addEventListener("error", () => link.remove(), { once: true });
        document.head.appendChild(link);
    }
    splideLoadPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/js/splide.min.js";
        script.dataset.editorschoiceSplide = "1";
        let timer;
        const finish = (error) => {
            clearTimeout(timer);
            script.onload = script.onerror = null;
            if (error) {
                script.remove();
                reject(error);
            } else resolve();
        };
        script.onload = () => finish(window.Splide ? null : new Error("Carousel did not initialize."));
        script.onerror = () => finish(new Error("Carousel could not be downloaded."));
        timer = setTimeout(() => finish(new Error("Carousel download timed out.")), 15000);
        document.head.appendChild(script);
    }).catch(error => {
        splideLoadPromise = null;
        throw error;
    });
    return splideLoadPromise;
}

/* ===== Render ===== */
function renderHeroSlide(item, data) {
    const metadata = buildMetadata(item);
    const logoOrTitle = buildLogoOrTitle(item, data.reduceImageSizes);
    const overview = buildOverview(item, "No Description Found");
    const actions = buildActions(item, data);
    const poster = buildPoster(item, data);
    const themeVideo = data.enableThemeVideos !== false ? buildThemeVideo(item) : "";
    const bannerClass = `editorsChoiceItemBanner splide__slide${themeVideo ? " editorsChoiceItemBanner--withThemeVideo" : ""}`;
    const contentClass = `editorsChoiceContent${poster ? " editorsChoiceContent--withPoster" : ""}`;
    const infoClass = "editorsChoiceInfo editorsChoiceInfo--withAction";

    const backdropSize = buildBannerSizeParam(data.reduceImageSizes);
    const backdropUrl = `../Items/${item.id}/Images/Backdrop/0${backdropSize}`;
    const extraClass = data.heroBackdropPosition === "center" ? "editorsChoiceBackdropCenter" :
        data.heroBackdropPosition === "top" ? "editorsChoiceBackdropTop" :
        data.heroBackdropPosition === "bottom" ? "editorsChoiceBackdropBottom" : "";

    return `<article class="${bannerClass}"><div class="editorsChoiceBackdrop ${extraClass}" data-backdrop-url="${escapeHtml(backdropUrl)}"></div>${themeVideo}<div class="editorsChoiceDimming" aria-hidden="true"></div><div class="${contentClass}">${poster}<div class="${infoClass}"><div class="editorsChoiceContentMain">${logoOrTitle}${metadata}${overview}</div>${actions}</div></div></article>`;
}

function renderOpeningActions(actions) {
    if (!Array.isArray(actions) || !actions.length) return "";

    const buttons = actions.map((action) => {
        if (!action?.label || !action?.url) return "";
        const primaryClass = action.primary ? " button-submit" : "";
        const external = /^https?:\/\//i.test(action.url);
        const externalAttributes = external ? ' target="_blank" rel="noopener noreferrer"' : "";
        const icon = action.primary ? "arrow_forward" : "help_outline";
        const customStyle = buildCustomButtonStyle(action.backgroundColor, action.textColor, action.opacity);
        return `<a is="emby-linkbutton" class="editorsChoiceOpeningAction raised emby-button${primaryClass}${customStyle.className}"${customStyle.attribute} href="${escapeHtml(action.url)}"${externalAttributes}><span class="material-icons" aria-hidden="true">${icon}</span><span>${escapeHtml(action.label)}</span></a>`;
    }).join("");

    return buttons ? `<div class="editorsChoiceItemActions">${buttons}</div>` : "";
}

function renderOpeningMessage(slide, data) {
    const backdropSize = buildBannerSizeParam(data.reduceImageSizes);
    const backdropUrl = slide.backgroundType === "media" && slide.backgroundItemId
        ? `../Items/${escapeHtml(slide.backgroundItemId)}/Images/Backdrop/0${backdropSize}`
        : slide.backgroundType === "url" && slide.backgroundUrl
            ? slide.backgroundUrl
            : "";
    const backgroundClass = backdropUrl ? "" : " editorsChoiceOpeningSlide--gradient";
    const alignment = ["center", "right"].includes(slide.alignment) ? slide.alignment : "left";
    const extraClass = data.heroBackdropPosition === "top" ? "editorsChoiceBackdropTop"
        : data.heroBackdropPosition === "bottom" ? "editorsChoiceBackdropBottom"
            : "editorsChoiceBackdropCenter";
    const actions = renderOpeningActions(slide.actions);
    const infoClass = `editorsChoiceInfo${actions ? " editorsChoiceInfo--withAction" : ""}`;
    const body = slide.bodyHtml ? `<div class="editorsChoiceItemOverview">${slide.bodyHtml}</div>` : "";

    return `<article class="editorsChoiceItemBanner editorsChoiceOpeningSlide editorsChoiceOpeningSlide--${alignment}${backgroundClass} splide__slide"><div class="editorsChoiceBackdrop ${extraClass}" data-backdrop-url="${escapeHtml(backdropUrl)}"></div><div class="editorsChoiceDimming" aria-hidden="true"></div><div class="editorsChoiceContent"><div class="${infoClass}"><div class="editorsChoiceContentMain"><div class="editorsChoiceItemMetadata" role="list"><span role="listitem" class="editorsChoiceMetadataItem">${escapeHtml(slide.eyebrow || "Welcome")}</span></div><h1 class="editorsChoiceItemTitle">${escapeHtml(slide.title || "Welcome")}</h1>${body}</div>${actions}</div></div></article>`;
}

/* ===== Main setup ===== */
async function setup() {
    console.log("Attempting creation of editors choice slider.");

    // Claim each container synchronously. setup() can be scheduled again while
    // Splide is loading, so waiting before setting this marker can render the
    // same slider multiple times.
    const containers = Array.from(document.querySelectorAll(HOME_CONTAINER_SELECTOR)).filter((element) => {
        if (initializingContainers.has(element)) return false;
        if (element.querySelector(":scope > .editorsChoiceContainer")) {
            initializedContainers.add(element);
            element.classList.add(EDITORS_CHOICE_ADDED_CLASS);
            return false;
        }

        if (initializingContainers.has(element) || initializedContainers.has(element)) return false;
        if (element.classList.contains(EDITORS_CHOICE_LOADING_CLASS)) return false;

        initializingContainers.add(element);
        element.classList.add(EDITORS_CHOICE_LOADING_CLASS);
        return true;
    });
    if (!containers.length) return;

    const bootstrap = typeof editorsChoiceBootstrap === "object" ? editorsChoiceBootstrap : { bannerHeight: 360, bannerHeightMode: "preset" };
    const shells = new Map();
    for (const elem of containers) {
        if (bootstrap.hideOnTvLayout && document.documentElement.classList.contains("layout-tv")) {
            initializedContainers.add(elem);
            initializingContainers.delete(elem);
            elem.classList.remove(EDITORS_CHOICE_LOADING_CLASS);
            continue;
        }
        shells.set(elem, createBannerShell(elem, bootstrap));
    }

    for (const elem of containers) {
        if (!elem.isConnected || !elem.matches(HOME_CONTAINER_SELECTOR)) {
            initializingContainers.delete(elem);
            elem.classList.remove(EDITORS_CHOICE_LOADING_CLASS);
            continue;
        }

        console.log("Fetching favourites data from API...");
        const containerElem = shells.get(elem);
        if (!containerElem) continue;
        const retry = () => {
            pendingBanners.get(containerElem)?.();
            containerElem.remove();
            initializedContainers.delete(elem);
            initializingContainers.delete(elem);
            elem.classList.remove(EDITORS_CHOICE_LOADING_CLASS);
            setup();
        };

        Promise.all([ensureSplideLoaded(), waitForBannerClient()])
            .then(() => ApiClient.fetch({ url: ApiClient.getUrl("/EditorsChoice/favourites"), type: "GET" }))
            .then((response) => response.json())
            .then((data) => {
                if (!elem.isConnected || !elem.matches(HOME_CONTAINER_SELECTOR)) return;

                if (data.hideOnTvLayout && document.documentElement.classList.contains("layout-tv")) {
                    pendingBanners.get(containerElem)?.();
                    containerElem.remove();
                    initializedContainers.add(elem);
                    elem.classList.add(EDITORS_CHOICE_ADDED_CLASS);
                    return;
                }

                const favourites = Array.isArray(data.favourites) ? data.favourites : [];
                const openingSlide = data.openingSlide && typeof data.openingSlide === "object"
                    ? data.openingSlide : null;
                const slides = [];
                if (openingSlide?.type === "message") {
                    slides.push({ type: "message", value: openingSlide });
                } else if (openingSlide?.type === "media" && openingSlide.item) {
                    slides.push({ type: "media", value: openingSlide.item });
                }
                if (!openingSlide || openingSlide.continueToSelection !== false) {
                    const openingMediaId = openingSlide?.type === "media" ? openingSlide.item?.id : null;
                    for (const item of favourites) {
                        if (item?.id !== openingMediaId) slides.push({ type: "media", value: item });
                    }
                }
                const containerId = containerElem.id;
                applyBannerFonts(data, containerElem);
                applyBannerGeometry(data, containerElem);
                const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                const autoplayEnabled = !!data.autoplay && !prefersReducedMotion && slides.length > 1;

                containerElem.classList.add(`editorsChoiceHeight-${data.bannerHeight}`);
                containerElem.style.setProperty("--ec-dimming", data.enableBackgroundDimming
                    ? bannerNumber(data.backgroundDimmingPercent, 30, 0, 100) / 100 : 0);
                const $containerElem = $(containerElem);
                if (!slides.length) {
                    showBannerMessage(containerElem, "No featured items available.");
                    initializedContainers.add(elem);
                    return;
                }

                // TV focus workaround
                let focusResolved = false;
                containerElem.querySelectorAll(".emby-scrollbuttons button").forEach((button) => {
                    button.addEventListener("focus", () => {
                        if (focusResolved || !document.documentElement.classList.contains("layout-tv")) return;
                        document.querySelector('[is="emby-tabs"] .emby-button')?.focus();
                        focusResolved = true;
                    });
                });

                const homeTab = elem.closest("#homeTab");
                if (homeTab) homeTab.classList.add("editorsChoiceHeroMode");

                const list = containerElem.querySelector(".editorsChoiceItemsContainer");
                const $list = $(list);

                for (const slide of slides) {
                    const html = slide.type === "message"
                        ? renderOpeningMessage(slide.value, data)
                        : renderHeroSlide(slide.value, data);
                    list.insertAdjacentHTML("beforeend", html);
                }

                $list.find(".editorsChoiceItemOverview a")
                    .attr("target", "_blank")
                    .attr("rel", "noopener noreferrer");

                $containerElem.on("click", ".splide__pagination, .editorsChoiceMobilePagination", function (event) {
                    event.stopPropagation();
                });

                // Toggle slider controls independently from their behaviour.
                const playPauseBtn = containerElem.querySelector(".editorsChoicePlayPause");
                if (playPauseBtn) playPauseBtn.style.display = autoplayEnabled && data.showAutoplayButton ? "" : "none";
                containerElem.querySelectorAll(".splide__arrow, .editorsChoiceMobilePageButton").forEach((arrow) => {
                    arrow.style.display = data.showNavigationArrows ? "" : "none";
                });

                const effect = ["loop", "fade", "zoom", "wipe", "instant"].includes(data.transitionEffect) ? data.transitionEffect : "loop";
                const customTransition = ["zoom", "wipe", "instant"].includes(effect);
                const slider = new Splide(`#${containerId} .splide`, {
                    type: effect === "loop" ? "loop" : "fade",
                    autoplay: autoplayEnabled,
                    arrows: !!data.showNavigationArrows,
                    rewind: true,
                    interval: data.autoplayInterval,
                    pauseOnHover: true,
                    pauseOnFocus: true,
                    pagination: true,
                    keyboard: true,
                    waitForTransition: true,
                    speed: effect === "instant" || prefersReducedMotion ? 0 : bannerNumber(data.transitionDurationMs, 0, 0, 3000) || 650,
                    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                    height: `${bannerHeightPixels(data, window.innerWidth < 768, window.visualViewport?.height || window.innerHeight, document.querySelector(".skinHeader")?.getBoundingClientRect().height || 0)}px`,
                });

                const updateMobilePagination = () => {
                    $containerElem.find(".editorsChoiceMobilePageCurrent").text(slider.index + 1);
                    $containerElem.find(".editorsChoiceMobilePageTotal").text(slider.length);
                };

                const getOriginalSlides = () => Array.from($list[0].children)
                    .filter((slide) => !slide.classList.contains("splide__slide--clone"));

                const prepareSlideAt = (index, fetchPriority = "auto") => {
                    const slides = getOriginalSlides();
                    if (!slides.length) return Promise.resolve();
                    const normalizedIndex = ((index % slides.length) + slides.length) % slides.length;
                    const slide = slides[normalizedIndex];
                    return prepareHeroBackdrop($containerElem, slide, fetchPriority);
                };

                const activateThemeVideoAt = (index) => {
                    if (data.enableThemeVideos === false) return Promise.resolve();
                    if ($containerElem.hasClass("editorsChoiceThemeVideoHidden")) {
                        pauseThemeVideos($containerElem[0]);
                        return Promise.resolve();
                    }
                    const slides = getOriginalSlides();
                    if (!slides.length) return Promise.resolve();
                    const normalizedIndex = ((index % slides.length) + slides.length) % slides.length;
                    const originalSlide = slides[normalizedIndex];
                    const originalVideo = originalSlide.querySelector(".editorsChoiceThemeVideoPlayer");
                    pauseThemeVideos($containerElem[0]);
                    if (!originalVideo) return Promise.resolve();

                    const themeVideoId = originalVideo.dataset.themeVideoId;
                    const activeSlide = Array.from($list[0].children).find((candidate) => {
                        const candidateVideo = candidate.querySelector(".editorsChoiceThemeVideoPlayer");
                        return candidate.classList.contains("is-active")
                            && candidateVideo?.dataset.themeVideoId === themeVideoId;
                    });
                    return prepareThemeVideo(activeSlide || originalSlide, true);
                };

                const preloadFollowingSlide = () => {
                    if (slider.length > 1) {
                        prepareSlideAt(slider.index + 1, "low").catch((error) => {
                            console.debug("Editors Choice: following hero media preload unavailable.", error);
                        });
                    }
                };

                slider.on("mounted", () => {
                    updateMobilePagination();
                    $containerElem.toggleClass("editorsChoiceSingleSlide", slider.length <= 1);

                    {
                        prepareSlideAt(slider.index, "high")
                            .catch((error) => {
                                console.warn("Editors Choice: initial hero media preparation failed.", error);
                            })
                            .then(() => {
                                finishBannerLoading(containerElem);
                                return Promise.resolve().then(() => activateThemeVideoAt(slider.index));
                            })
                            .catch((error) => {
                                console.debug("Editors Choice: theme video activation unavailable.", error);
                            });
                        preloadFollowingSlide();
                    }
                });

                slider.on("move", (newIndex) => {
                    pauseThemeVideos($containerElem[0]);
                    prepareSlideAt(newIndex, "high").catch((error) => {
                        console.debug("Editors Choice: hero media preparation unavailable.", error);
                    });
                });

                slider.on("moved", () => {
                    updateMobilePagination();
                    const activeIndex = slider.index;
                    prepareSlideAt(activeIndex, "high")
                        .then(() => {
                            if (slider.index !== activeIndex) return;
                            return activateThemeVideoAt(activeIndex);
                        })
                        .catch((error) => {
                            console.debug("Editors Choice: theme video activation unavailable.", error);
                        });
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

                $containerElem.on("click", ".editorsChoiceThemeVideoToggle", function (event) {
                    event.preventDefault();
                    event.stopPropagation();

                    const hidden = !$containerElem.hasClass("editorsChoiceThemeVideoHidden");
                    $containerElem.toggleClass("editorsChoiceThemeVideoHidden", hidden);
                    $containerElem.find(".editorsChoiceThemeVideoToggle")
                        .attr("aria-label", hidden ? "Show theme video" : "Hide theme video")
                        .attr("title", hidden ? "Show theme video" : "Hide theme video")
                        .attr("aria-pressed", hidden ? "true" : "false")
                        .find(".material-icons")
                        .toggleClass("videocam_off", !hidden)
                        .toggleClass("videocam", hidden);

                    if (hidden) {
                        pauseThemeVideos($containerElem[0]);
                    } else {
                        activateThemeVideoAt(slider.index).catch((error) => {
                            console.debug("Editors Choice: theme video activation unavailable.", error);
                        });
                    }
                });

                pendingBanners.get(containerElem)?.();
                slider.mount({ Presentation: bannerPresentation(data, containerElem) }, customTransition ? bannerTransition(effect) : undefined);
                bannerSliders.set(containerElem, slider);

                initializedContainers.add(elem);
                elem.classList.add(EDITORS_CHOICE_ADDED_CLASS);
            })
            .catch((e) => {
                if (!containerElem.isConnected) return;
                showBannerMessage(containerElem, "Featured content could not be loaded.", retry);
                initializedContainers.delete(elem);
                elem.classList.remove(EDITORS_CHOICE_ADDED_CLASS);
                console.warn("Editors Choice: failed to fetch/render.", e);
            })
            .finally(() => {
                initializingContainers.delete(elem);
                elem.classList.remove(EDITORS_CHOICE_LOADING_CLASS);
            });
    }
}

let setupScheduled = false;

function scheduleSetup() {
    if (setupScheduled) return;

    setupScheduled = true;
    window.requestAnimationFrame(() => {
        setupScheduled = false;
        setup();
    });
}

function nodeContainsHomeContainer(node) {
    if (!(node instanceof Element)) return false;

    return node.matches(HOME_CONTAINER_SELECTOR)
        || !!node.querySelector(HOME_CONTAINER_SELECTOR)
        || !!node.closest(HOME_CONTAINER_SELECTOR);
}

function initializeEditorsChoice() {
    // Jellyfin 12 mounts the legacy home tab as a nested React subtree. Observe
    // the React root when available and fall back to body for older web clients.
    const target = document.getElementById("reactRoot") || document.body;
    if (!target) {
        console.warn("Editors Choice: page root not found.");
        return;
    }

    const observer = new MutationObserver((mutations) => {
        for (const [element, cleanup] of pendingBanners) {
            if (!element.isConnected) cleanup();
        }
        for (const [element, slider] of bannerSliders) {
            if (!element.isConnected) slider.destroy(true);
        }
        for (const mutation of mutations) {
            if (mutation.type === "attributes") {
                const element = mutation.target;
                if (element instanceof Element && element.matches("#indexPage, #homeTab")) {
                    scheduleSetup();
                    return;
                }
            }

            for (const node of mutation.addedNodes) {
                if (nodeContainsHomeContainer(node)) {
                    scheduleSetup();
                    return;
                }
            }
        }
    });

    observer.observe(target, {
        attributes: true,
        attributeFilter: ["class"],
        childList: true,
        subtree: true,
    });

    // Reserve space immediately when the home page is already present.
    setup();

    // Remind user that their favourites will be public when they add a new favourite.
    document.body.addEventListener("click", (event) => {
        const ratingButton = event.target.closest?.('[is="emby-ratingbutton"]');
        if (!ratingButton || ratingButton.classList.contains("ratingbutton-withrating")) return;

        ApiClient.getPluginConfiguration(GUID).then((data) => {
            if (ApiClient.getCurrentUserId() === data.EditorUserId) {
                Dashboard.confirm("You are the featured items editor! Your favourites will be displayed on the home page for all users, if enabled.");
            }
        });
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeEditorsChoice, { once: true });
} else {
    initializeEditorsChoice();
}
