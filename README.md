# CodeyEditor

**CodeyEditor** is a standalone JavaScript engine for building visual programs with connected, puzzle-shaped blocks. It is designed to be reusable in projects such as Tribble without requiring Tribble itself.

## V0.1

- Block library with categories and search
- Click or drag blocks into a connected vertical stack
- Select blocks and edit their properties
- Delete blocks
- Undo and redo
- Export and import project JSON
- Generate starter JavaScript-like output
- Keyboard shortcuts

## Run the demo

This project uses browser-native JavaScript modules. Serve the folder over HTTP:

```bash
npm start
```

Then open the local URL printed by the server.

## Use the engine

```js
import { CodeyEditor } from "./src/CodeyEditor.js";

const editor = new CodeyEditor({
  root: "#editor",
  onChange(project) {
    console.log("Project changed", project);
  }
});

editor.addBlock("when-start");
editor.addBlock("move");
console.log(editor.toJSON());
console.log(editor.toCode());
```

## Project format

```json
{
  "format": "codey-project",
  "version": 1,
  "blocks": [
    {
      "id": "unique-id",
      "type": "move",
      "fields": { "steps": 10 }
    }
  ]
}
```

## Architecture

- `src/CodeyEditor.js` — reusable editor engine and public API
- `src/blocks.js` — block and category definitions
- `demo.js` — standalone demo wiring
- `styles.css` — demo and block styling
- `index.html` — demo shell

## Roadmap

- V0.2: true nested statement connections, block reordering, keyboard navigation
- V0.3: extension API, custom block registration, generators
- V0.4: SVG/block asset support, themes, localization
- V1.0: stable public API and Tribble integration

## License

MIT
