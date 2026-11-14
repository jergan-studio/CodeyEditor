import { BLOCK_DEFINITIONS, CATEGORIES, getBlockDefinition } from "./blocks.js";

const clone = (value) => JSON.parse(JSON.stringify(value));
const makeId = () => globalThis.crypto?.randomUUID?.() ?? `block-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export class CodeyEditor {
  constructor(options = {}) {
    this.root = typeof options.root === "string" ? document.querySelector(options.root) : options.root;
    if (!this.root) throw new Error("CodeyEditor requires a root element.");
    this.definitions = options.blocks ?? BLOCK_DEFINITIONS;
    this.categories = options.categories ?? CATEGORIES;
    this.blocks = [];
    this.selectedId = null;
    this.activeCategory = "All";
    this.searchTerm = "";
    this.history = [];
    this.historyIndex = -1;
    this.onChange = options.onChange ?? (() => {});
    this.renderShell();
    this.bindEvents();
    this.render();
    this.commitHistory();
  }

  renderShell() {
    this.root.classList.add("codey-root");
    this.root.innerHTML = `
      <div class="codey-categories"></div>
      <div class="codey-library"></div>
      <div class="codey-workspace" tabindex="0">
        <div class="codey-empty">Drag blocks here or click a block in the library.</div>
        <div class="codey-stack"></div>
      </div>
      <div class="codey-inspector"><p>Select a block to edit it.</p></div>
    `;
    this.categoryElement = this.root.querySelector(".codey-categories");
    this.libraryElement = this.root.querySelector(".codey-library");
    this.workspaceElement = this.root.querySelector(".codey-workspace");
    this.stackElement = this.root.querySelector(".codey-stack");
    this.emptyElement = this.root.querySelector(".codey-empty");
    this.inspectorElement = this.root.querySelector(".codey-inspector");
  }

  bindEvents() {
    this.root.addEventListener("click", (event) => {
      const category = event.target.closest("[data-category]");
      if (category) {
        this.activeCategory = category.dataset.category;
        this.renderLibrary();
        return;
      }
      const add = event.target.closest("[data-add]");
      if (add) {
        this.addBlock(add.dataset.add);
        return;
      }
      const block = event.target.closest("[data-block-id]");
      if (block && this.stackElement.contains(block)) this.selectBlock(block.dataset.blockId);
      const remove = event.target.closest("[data-remove]");
      if (remove) {
        event.stopPropagation();
        this.removeBlock(remove.dataset.remove);
      }
    });

    this.root.addEventListener("input", (event) => {
      if (event.target.matches("[data-search]")) {
        this.searchTerm = event.target.value.toLowerCase();
        this.renderLibrary();
      }
      const field = event.target.closest("[data-field]");
      if (field && this.selectedId) this.updateField(this.selectedId, field.dataset.field, field.type === "checkbox" ? field.checked : field.value, false);
    });

    this.root.addEventListener("change", (event) => {
      const field = event.target.closest("[data-field]");
      if (field && this.selectedId) this.commitHistory();
    });

    this.root.addEventListener("dragstart", (event) => {
      const source = event.target.closest("[data-add]");
      if (!source) return;
      event.dataTransfer.setData("text/codey-block", source.dataset.add);
      event.dataTransfer.effectAllowed = "copy";
    });
    this.workspaceElement.addEventListener("dragover", (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      this.workspaceElement.classList.add("is-drop-target");
    });
    this.workspaceElement.addEventListener("dragleave", (event) => {
      if (!this.workspaceElement.contains(event.relatedTarget)) this.workspaceElement.classList.remove("is-drop-target");
    });
    this.workspaceElement.addEventListener("drop", (event) => {
      event.preventDefault();
      this.workspaceElement.classList.remove("is-drop-target");
      const type = event.dataTransfer.getData("text/codey-block");
      if (type) this.addBlock(type);
    });
    this.workspaceElement.addEventListener("click", (event) => {
      if (event.target === this.workspaceElement || event.target === this.stackElement) this.selectBlock(null);
    });
  }

  render() {
    this.renderCategories();
    this.renderLibrary();
    this.renderWorkspace();
    this.renderInspector();
    this.onChange(this.getProject());
  }

  renderCategories() {
    this.categoryElement.innerHTML = this.categories.map((item) => `
      <button class="codey-category ${this.activeCategory === item.name ? "active" : ""}" data-category="${item.name}">
        <span style="--category-color:${item.color}"></span>${item.name}
      </button>`).join("");
  }

  renderLibrary() {
    const filtered = this.definitions.filter((block) =>
      (this.activeCategory === "All" || block.category === this.activeCategory) &&
      `${block.label} ${block.category}`.toLowerCase().includes(this.searchTerm)
    );
    this.libraryElement.innerHTML = `
      <input class="codey-search" data-search placeholder="Search blocks..." value="${this.escape(this.searchTerm)}">
      ${filtered.map((block) => `
        <button class="codey-library-block ${block.shape === "hat" ? "hat" : ""}" draggable="true" data-add="${block.type}" style="--block-color:${block.color}">
          <span>${this.escape(block.label)}</span><span class="codey-add-mark">+</span>
        </button>`).join("") || '<p class="codey-no-results">No matching blocks.</p>'}
    `;
  }

  renderWorkspace() {
    this.emptyElement.hidden = this.blocks.length > 0;
    this.stackElement.innerHTML = this.blocks.map((block) => {
      const def = getBlockDefinition(block.type);
      if (!def) return "";
      return `<article class="codey-block ${def.shape === "hat" ? "hat" : ""} ${def.shape === "comment" ? "comment" : ""} ${this.selectedId === block.id ? "selected" : ""}" data-block-id="${block.id}" style="--block-color:${def.color}" tabindex="0">
        <span class="codey-block-label">${this.escape(def.label)}</span>
        <span class="codey-block-values">${def.inputs.map((input) => `<span class="codey-value">${this.escape(String(block.fields[input.name] ?? input.default))}</span>`).join("")}</span>
        <button class="codey-delete" data-remove="${block.id}" title="Delete block" aria-label="Delete block">×</button>
      </article>`;
    }).join("");
    this.root.querySelector(".codey-workspace").classList.toggle("has-blocks", this.blocks.length > 0);
  }

  renderInspector() {
    const block = this.blocks.find((item) => item.id === this.selectedId);
    const def = block && getBlockDefinition(block.type);
    if (!block || !def) {
      this.inspectorElement.innerHTML = "<p>Select a block to edit its properties.</p>";
      return;
    }
    this.inspectorElement.innerHTML = `<h3>${this.escape(def.label)}</h3><p class="codey-inspector-type">${this.escape(def.category)} block</p>
      ${def.inputs.map((input) => `<label class="codey-field"><span>${this.escape(input.label)}</span><input data-field="${input.name}" type="${input.kind === "number" ? "number" : "text"}" value="${this.escape(String(block.fields[input.name] ?? input.default))}"></label>`).join("")}
      <button class="codey-remove-button" data-remove="${block.id}">Delete block</button>`;
  }

  addBlock(type, index = this.blocks.length) {
    const def = getBlockDefinition(type);
    if (!def) throw new Error(`Unknown block type: ${type}`);
    const block = { id: makeId(), type, fields: Object.fromEntries(def.inputs.map((input) => [input.name, input.default])) };
    this.blocks.splice(Math.max(0, Math.min(index, this.blocks.length)), 0, block);
    this.selectedId = block.id;
    this.commitHistory();
    this.render();
    return block.id;
  }

  removeBlock(id) {
    this.blocks = this.blocks.filter((block) => block.id !== id);
    if (this.selectedId === id) this.selectedId = null;
    this.commitHistory();
    this.render();
  }

  selectBlock(id) {
    this.selectedId = id;
    this.renderWorkspace();
    this.renderInspector();
  }

  updateField(id, name, value, record = true) {
    const block = this.blocks.find((item) => item.id === id);
    if (!block) return;
    block.fields[name] = value;
    this.renderWorkspace();
    if (record) this.commitHistory();
    this.onChange(this.getProject());
  }

  commitHistory() {
    const snapshot = clone(this.blocks);
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(snapshot);
    if (this.history.length > 100) this.history.shift();
    this.historyIndex = this.history.length - 1;
    this.onChange(this.getProject());
  }

  undo() {
    if (this.historyIndex <= 0) return false;
    this.historyIndex--;
    this.blocks = clone(this.history[this.historyIndex]);
    this.selectedId = null;
    this.render();
    return true;
  }

  redo() {
    if (this.historyIndex >= this.history.length - 1) return false;
    this.historyIndex++;
    this.blocks = clone(this.history[this.historyIndex]);
    this.selectedId = null;
    this.render();
    return true;
  }

  clear() {
    this.blocks = [];
    this.selectedId = null;
    this.commitHistory();
    this.render();
  }

  getProject() {
    return { format: "codey-project", version: 1, blocks: clone(this.blocks) };
  }

  loadProject(project) {
    if (!project || project.format !== "codey-project" || !Array.isArray(project.blocks)) {
      throw new Error("This is not a valid CodeyEditor project.");
    }
    const valid = project.blocks.every((block) => getBlockDefinition(block.type) && block.fields && typeof block.fields === "object");
    if (!valid) throw new Error("The project contains an unknown or invalid block.");
    this.blocks = clone(project.blocks);
    this.selectedId = null;
    this.commitHistory();
    this.render();
  }

  toJSON() {
    return JSON.stringify(this.getProject(), null, 2);
  }

  toCode() {
    return this.blocks.map((block) => {
      const f = block.fields;
      switch (block.type) {
        case "when-start": return "whenStart(() => {";
        case "when-key": return `whenKey("${f.key}", () => {`;
        case "move": return `  move(${Number(f.steps) || 0});`;
        case "turn": return `  turn(${Number(f.degrees) || 0});`;
        case "go-to": return `  goTo(${Number(f.x) || 0}, ${Number(f.y) || 0});`;
        case "say": return `  say(${JSON.stringify(f.message)});`;
        case "show": return "  show();";
        case "hide": return "  hide();";
        case "wait": return `  await wait(${Number(f.seconds) || 0});`;
        case "repeat": return `  repeat(${Number(f.times) || 0}, () => {`;
        case "comment": return `// ${String(f.text).replaceAll("\n", " ")}`;
        default: return "";
      }
    }).join("\n");
  }

  escape(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }
}
