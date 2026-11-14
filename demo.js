import { CodeyEditor } from "./src/CodeyEditor.js";

const editor = new CodeyEditor({
  root: "#codey-app",
  onChange(project) {
    const count = document.querySelector("#block-count");
    if (count) count.textContent = `${project.blocks.length} block${project.blocks.length === 1 ? "" : "s"}`;
  }
});

document.querySelector("#undo").addEventListener("click", () => editor.undo());
document.querySelector("#redo").addEventListener("click", () => editor.redo());
document.querySelector("#new-project").addEventListener("click", () => {
  if (!editor.getProject().blocks.length || confirm("Start a new project? Unsaved blocks will be cleared.")) editor.clear();
});
document.querySelector("#save-project").addEventListener("click", () => {
  const blob = new Blob([editor.toJSON()], { type: "application/json" });
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
    editor.loadProject(JSON.parse(await file.text()));
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
