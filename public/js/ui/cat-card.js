function formatMultiplier(value) {
  if (value === 1.1) {
    return "+10%";
  }
  if (value === 0.9) {
    return "-10%";
  }
  return "기본";
}

function renderCatCard(
  catDefinition,
  selected = false,
  onSelect = () => {},
  documentRef = globalThis.document,
) {
  if (!documentRef?.createElement) {
    return null;
  }
  const card = documentRef.createElement("button");
  card.type = "button";
  card.className = "cat-card" + (selected ? " selected" : "");
  card.dataset.catId = catDefinition.id;
  card.setAttribute("aria-pressed", String(selected));
  card.addEventListener("click", () => onSelect(catDefinition.id));

  const name = documentRef.createElement("strong");
  name.textContent = catDefinition.label;
  const advantage = documentRef.createElement("span");
  advantage.className = "cat-advantage";
  advantage.textContent = "장점: " + catDefinition.advantage;
  const weakness = documentRef.createElement("span");
  weakness.className = "cat-weakness";
  weakness.textContent = "약점: " + catDefinition.weakness;
  const stats = documentRef.createElement("small");
  stats.textContent =
    "점프 " + formatMultiplier(catDefinition.jumpMultiplier) +
    " · 속도 " + formatMultiplier(catDefinition.speedMultiplier) +
    " · 슬라이드 " + formatMultiplier(catDefinition.slideMultiplier) +
    " · 아이템 " + formatMultiplier(catDefinition.itemDurationMultiplier) +
    " · 체력 " + formatMultiplier(catDefinition.healthMultiplier);
  card.append(name, advantage, weakness, stats);
  return card;
}

export { formatMultiplier, renderCatCard };
