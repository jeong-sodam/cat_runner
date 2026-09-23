import { CAT_STAT_KEYS } from "../game/constants.js";

const STAT_LABELS = Object.freeze({
  jump: "점프력",
  speed: "속도",
  health: "체력",
  itemDuration: "아이템 지속",
  magnetRange: "자석 범위",
});

function formatMultiplier(value) {
  if (value === 1.2) {
    return "+20%";
  }
  if (value === 1.1) {
    return "+10%";
  }
  if (value === 0.9) {
    return "-10%";
  }
  if (value === 0.8) {
    return "-20%";
  }
  return "기본";
}

function renderStatRow(documentRef, statKey, rating) {
  const row = documentRef.createElement("li");
  row.className = "cat-stat";
  row.dataset.statKey = statKey;
  row.setAttribute("aria-label", `${STAT_LABELS[statKey]} ${rating}/5`);

  const label = documentRef.createElement("span");
  label.className = "cat-stat-label";
  label.textContent = STAT_LABELS[statKey];

  const bar = documentRef.createElement("span");
  bar.className = "cat-stat-bar";
  bar.setAttribute("aria-hidden", "true");
  for (let index = 1; index <= 5; index += 1) {
    const segment = documentRef.createElement("span");
    segment.className = "cat-stat-segment" + (index <= rating ? " filled" : "");
    bar.append(segment);
  }

  const value = documentRef.createElement("span");
  value.className = "cat-stat-value";
  value.textContent = `${rating}/5`;
  row.append(label, bar, value);
  return row;
}

function renderCatCard(
  catDefinition,
  selected = false,
  onSelect = () => {},
  documentRef = globalThis.document,
  options = {},
) {
  if (!documentRef?.createElement) {
    return null;
  }
  const card = documentRef.createElement("button");
  card.type = "button";
  card.className = "cat-card" + (selected ? " selected" : "");
  card.dataset.catId = catDefinition.id;
  card.dataset.statCount = String(CAT_STAT_KEYS.length);
  if (catDefinition.englishName) {
    card.dataset.englishName = catDefinition.englishName;
  }
  card.setAttribute("aria-pressed", String(selected));
  card.addEventListener("click", () => onSelect(catDefinition.id));

  if (options.previewSrc) {
    const preview = documentRef.createElement("img");
    preview.className = "cat-preview";
    preview.src = options.previewSrc;
    preview.alt = catDefinition.label + " 고양이 모습";
    preview.loading = "eager";
    preview.decoding = "async";
    preview.addEventListener("error", () => {
      preview.hidden = true;
      preview.setAttribute("aria-hidden", "true");
    });
    card.append(preview);
  }

  const name = documentRef.createElement("strong");
  name.textContent = catDefinition.label;
  const advantage = documentRef.createElement("span");
  advantage.className = "cat-advantage";
  advantage.textContent = "장점: " + catDefinition.advantage;
  const weakness = documentRef.createElement("span");
  weakness.className = "cat-weakness";
  weakness.textContent = "약점: " + catDefinition.weakness;
  const stats = documentRef.createElement("ul");
  stats.className = "cat-stat-grid";
  stats.setAttribute("aria-label", "고양이 능력치");
  for (const statKey of CAT_STAT_KEYS) {
    stats.append(renderStatRow(documentRef, statKey, catDefinition.statRatings[statKey]));
  }
  card.append(name, advantage, weakness, stats);
  return card;
}

export { STAT_LABELS, formatMultiplier, renderCatCard };
