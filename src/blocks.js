export const BLOCK_DEFINITIONS = [
  { type: "when-start", category: "Events", label: "when start clicked", color: "#d9a52e", shape: "hat", inputs: [] },
  { type: "when-key", category: "Events", label: "when key pressed", color: "#d9a52e", shape: "hat", inputs: [{ name: "key", label: "Key", kind: "text", default: "space" }] },
  { type: "move", category: "Motion", label: "move steps", color: "#4388d8", inputs: [{ name: "steps", label: "Steps", kind: "number", default: 10 }] },
  { type: "turn", category: "Motion", label: "turn degrees", color: "#4388d8", inputs: [{ name: "degrees", label: "Degrees", kind: "number", default: 15 }] },
  { type: "go-to", category: "Motion", label: "go to position", color: "#4388d8", inputs: [{ name: "x", label: "X", kind: "number", default: 0 }, { name: "y", label: "Y", kind: "number", default: 0 }] },
  { type: "say", category: "Looks", label: "say message", color: "#9858c8", inputs: [{ name: "message", label: "Message", kind: "text", default: "Hello!" }] },
  { type: "show", category: "Looks", label: "show sprite", color: "#9858c8", inputs: [] },
  { type: "hide", category: "Looks", label: "hide sprite", color: "#9858c8", inputs: [] },
  { type: "wait", category: "Control", label: "wait seconds", color: "#d58a38", inputs: [{ name: "seconds", label: "Seconds", kind: "number", default: 1 }] },
  { type: "repeat", category: "Control", label: "repeat times", color: "#d58a38", inputs: [{ name: "times", label: "Times", kind: "number", default: 10 }] },
  { type: "comment", category: "Comments", label: "comment", color: "#7b8798", shape: "comment", inputs: [{ name: "text", label: "Note", kind: "text", default: "Write a note..." }] }
];

export const CATEGORIES = [
  { name: "All", color: "#8b95a5" },
  { name: "Events", color: "#d9a52e" },
  { name: "Motion", color: "#4388d8" },
  { name: "Looks", color: "#9858c8" },
  { name: "Control", color: "#d58a38" },
  { name: "Comments", color: "#7b8798" }
];

export function getBlockDefinition(type) {
  return BLOCK_DEFINITIONS.find((block) => block.type === type);
}
