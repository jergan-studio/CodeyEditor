import { CodeyEditor } from "./src/CodeyEditor.js";

const editor = new CodeyEditor({
  root: "#codey-app",
  onChange(project) {
    const count = document.querySelector("#block-count");
    if (count) count.textContent = `${project.blocks.length} block${project.blocks.length === 1 ? "" : "s"}`;
  }
});


const spriteDock = document.querySelector("#sprite-dock");
let sprites = [{ id: "sprite-1", name: "Sprite 1", emoji: "🐱", image: "", blocks: [] }];
let activeSpriteId = sprites[0].id;
function activeSprite() { return sprites.find((sprite) => sprite.id === activeSpriteId); }
function saveActiveSprite() { const sprite = activeSprite(); if (sprite) sprite.blocks = structuredClone(editor.blocks); }
function renderSprites() {
  const current = activeSprite();
  spriteDock.innerHTML = '<div class="sprite-stage"><div class="sprite-stage-title">STAGE</div><div class="sprite-stage-art">' +
    (current?.image ? '<img src="' + current.image + '" alt="">' : '<span>' + (current?.emoji || "👾") + '</span>') +
    '</div></div><div class="sprite-tools"><div class="sprite-heading">SPRITES</div><div class="sprite-list">' +
    sprites.map((sprite) => '<button class="sprite-card ' + (sprite.id === activeSpriteId ? "active" : "") + '" data-sprite="' + sprite.id + '">' +
      (sprite.image ? '<img src="' + sprite.image + '" alt="">' : '<span>' + sprite.emoji + '</span>') +
      '<small>' + sprite.name.replace(/[&<>"]/g, "") + '</small></button>').join("") +
    '</div><div class="sprite-actions"><button id="add-sprite" class="tool-button">＋ Add sprite</button>' +
    '<button id="upload-sprite" class="tool-button">Upload image</button><button id="delete-sprite" class="tool-button"' +
    (sprites.length < 2 ? " disabled" : "") + '>Delete</button><input id="sprite-file" type="file" accept="image/*" hidden></div>' +
    '<label class="sprite-name">Name<input id="sprite-name" value="' + (current?.name || "") + '"></label></div>';
}
spriteDock.addEventListener("click", (event) => {
  const card = event.target.closest("[data-sprite]");
  if (card && card.dataset.sprite !== activeSpriteId) {
    saveActiveSprite();
    activeSpriteId = card.dataset.sprite;
    editor.loadProject({ format: "codey-project", version: 1, blocks: activeSprite().blocks });
    renderSprites();
  }
  if (event.target.closest("#add-sprite")) {
    saveActiveSprite();
    const sprite = { id: "sprite-" + Date.now(), name: "Sprite " + (sprites.length + 1), emoji: ["🐱", "🐶", "🐸", "🚀", "👾"][sprites.length % 5], image: "", blocks: [] };
    sprites.push(sprite); activeSpriteId = sprite.id;
    editor.loadProject({ format: "codey-project", version: 1, blocks: [] }); renderSprites();
  }
  if (event.target.closest("#upload-sprite")) document.querySelector("#sprite-file").click();
  if (event.target.closest("#delete-sprite") && sprites.length > 1) {
    sprites = sprites.filter((sprite) => sprite.id !== activeSpriteId);
    activeSpriteId = sprites[0].id;
    editor.loadProject({ format: "codey-project", version: 1, blocks: sprites[0].blocks }); renderSprites();
  }
});
spriteDock.addEventListener("input", (event) => {
  if (event.target.id === "sprite-name") {
    const sprite = activeSprite(); if (sprite) { sprite.name = event.target.value; }
  }
});
spriteDock.addEventListener("change", (event) => {
  if (event.target.id === "sprite-name") renderSprites();
  if (event.target.id === "sprite-file") {
    const file = event.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Choose an image file."); return; }
    const reader = new FileReader();
    reader.onload = () => { const sprite = activeSprite(); sprite.image = String(reader.result); sprite.emoji = ""; renderSprites(); };
    reader.readAsDataURL(file); event.target.value = "";
  }
});
renderSprites();

document.querySelector("#undo").addEventListener("click", () => editor.undo());
document.querySelector("#redo").addEventListener("click", () => editor.redo());
document.querySelector("#new-project").addEventListener("click", () => {
  if (!editor.getProject().blocks.length || confirm("Start a new project? Unsaved blocks will be cleared.")) editor.clear();
});
document.querySelector("#save-project").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify((saveActiveSprite(), { format: "codey-project", version: 2, sprites, activeSpriteId }), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "codey-project.json";
  link.click();
  URL.revokeObjectURL(url);
});
document.querySelector("#load-project").addEventListener("click", () => document.querySelector("#file-input").click());
document.querySelector("#file-input").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const project = JSON.parse(await file.text());
    if (Array.isArray(project.sprites) && project.sprites.length) { sprites = project.sprites; activeSpriteId = project.activeSpriteId || sprites[0].id; editor.loadProject({ format: "codey-project", version: 1, blocks: activeSprite().blocks || [] }); renderSprites(); }
    else editor.loadProject(project);
  } catch (error) {
    alert(error.message);
  }
  event.target.value = "";
});
document.querySelector("#export-code").addEventListener("click", () => {
  document.querySelector("#export-output").value = editor.toCode();
  document.querySelector("#export-dialog").showModal();
});
document.querySelector("#copy-export").addEventListener("click", async () => {
  await navigator.clipboard.writeText(document.querySelector("#export-output").value);
  document.querySelector("#copy-export").textContent = "Copied!";
});
document.addEventListener("keydown", (event) => {
  if (event.target.matches("input, textarea")) return;
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
    event.preventDefault();
    event.shiftKey ? editor.redo() : editor.undo();
  } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
    event.preventDefault();
    editor.redo();
  } else if (event.key === "Delete" || event.key === "Backspace") {
    if (editor.selectedId) editor.removeBlock(editor.selectedId);
  }
});
