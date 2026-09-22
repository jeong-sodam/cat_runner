import { CAT_DEFINITIONS } from "../game/constants.js";
import { CAT_ASSET_MANIFEST } from "../render/asset-manifest.js";
import { renderCatCard } from "./cat-card.js";

const CAT_IDS = ["black", "white", "calico", "cheese", "mackerel", "chaos"];

function createCharacterSelect(onStart, options = {}) {
  const documentRef = options.documentRef || globalThis.document;
  let root = null;
  let selectedCatId = "black";
  let startButton = null;
  let cardsRoot = null;

  function renderCards() {
    cardsRoot?.replaceChildren?.();
    for (const catId of CAT_IDS) {
      const card = renderCatCardWithDocument(CAT_DEFINITIONS[catId], selectedCatId === catId);
      cardsRoot?.append(card);
    }
    if (startButton) {
      startButton.disabled = !selectedCatId;
    }
  }

  function renderCatCardWithDocument(definition, selected) {
    return renderCatCard(definition, selected, (catId) => {
      selectedCatId = catId;
      renderCards();
    }, documentRef, {
      previewSrc: CAT_ASSET_MANIFEST[definition.id]?.src || null,
    });
  }

  function mount(nextRoot) {
    root = nextRoot;
    if (!root || !documentRef?.createElement) {
      return null;
    }
    root.replaceChildren();
    root.hidden = false;
    const section = documentRef.createElement("section");
    section.className = "character-screen flow-card wide-card";
    const heading = documentRef.createElement("h1");
    heading.textContent = "이번 달리기의 고양이를 골라주세요";
    const intro = documentRef.createElement("p");
    intro.textContent = "매 판 새롭게 선택하며, 고양이별 장단점을 살펴보세요.";
    cardsRoot = documentRef.createElement("div");
    cardsRoot.className = "cat-grid";
    startButton = documentRef.createElement("button");
    startButton.type = "button";
    startButton.className = "game-button primary start-game-button";
    startButton.textContent = "이 고양이로 달리기";
    startButton.addEventListener("click", () => onStart?.({ catId: selectedCatId }));
    section.append(heading, intro, cardsRoot, startButton);
    root.append(section);
    renderCards();
    return section;
  }

  return {
    mount,
    getSelectedCatId: () => selectedCatId,
    getCatIds: () => [...CAT_IDS],
  };
}

export { CAT_IDS, createCharacterSelect };
