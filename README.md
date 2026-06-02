# Name2Tree

Name2Tree is a generative art app that turns text into deterministic tree drawings. It was built for the ITP Spring Show 2025 project [Find Trees in Names: What if We are Trees?](https://bairui.dev/name2tree), where visitors typed a name, watched a tree grow, added it to a shared forest, downloaded it through a QR flow, and printed it as a physical keepsake.

![Find Trees in Names](./img/readme-main.webp)

## Examples

These are trees generated from different text inputs. Notice that the input is not limited to names; any text can be converted into a tree, including Chinese poems and numbers.

| ![Example tree 1](./img/readme-tree1.webp) | ![Example tree 2](./img/readme-tree2.webp) | ![Example tree 3](./img/readme-tree3.webp) |
| --- | --- | --- |
| ![Example tree 4](./img/readme-tree4.webp) | ![Example tree 5](./img/readme-tree5.webp) | ![Example tree 6](./img/readme-tree6.webp) |

## Links

- Live app: [tree.bairui.dev](https://tree.bairui.dev/)
- Project documentation: [bairui.dev/name2tree](https://bairui.dev/name2tree)
- Related landscape: [{Mountains, Trees, Names}*](https://landscape.bairui.dev/)
- Related sound sketch: [Tree Harmony](https://music.bairui.dev/tree)
- APack: [apack.bairui.dev](https://apack.bairui.dev/)

## What It Does

- Converts a name or any short text into character-code digits.
- Builds a tree where digit values determine each node's child count.
- Uses a deterministic seeded generator, so the same input always creates the same tree.
- Balances branch angles by each branch's leaf count to reduce overlap.
- Converts degenerate digit runs into flower/rose forms so edge cases still look intentional.
- Adds an APack stamp-style signature that writes English text in a Chinese-character-like grid.
- Supports saving, downloading, QR-code retrieval, and collective forest visualizations.

![Name2Tree conversion process](./img/readme-steps.webp)

## App Routes

| Route | Purpose |
| --- | --- |
| `/` | Main Name2Tree generator. Type text, preview the tree, download it, or add it to the forest. |
| `/forest` | Collective archive of submitted trees, with click-to-zoom details and admin tools. |
| `/viz` | Follow-up visualizations of the forest as a swarm, cloud, or grid. |
| `/write` | APack writing view for stamp-style text generation. |
| `/about` | Project background and explanation. |
| `/?text=...` | Download page for a specific tree, used by the QR-code flow. |

## Visualizations

The `/viz` route includes three ways to explore the collected trees from the installation:

- Swarm: a beeswarm-like timeline for exploring submitted trees temporally.
- Cloud: an organic packed layout for seeing the forest as a collective texture.
- Grid: a sortable overview by time, name, or digit-derived score.

![Tree swarm visualization](./img/readme-swarm.webp)

## Tech Stack

- [React](https://react.dev/) and [Vite](https://vite.dev/) for the web app.
- [D3](https://d3js.org/) for hierarchy, scales, random seeds, zooming, and layout work.
- [Observable Plot](https://observablehq.com/plot/) for visualization support.
- [APack](https://apack.bairui.dev/) through `apackjs` for the name stamp.
- [Charming.js](https://charmingjs.org/) helpers for SVG construction.
- `hachure-fill`, `points-on-path`, and custom SVG geometry for plotter-style output.
- `@awesomeqr/react` for QR-code generation.

## Getting Started

Install dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm dev
```

Build for production:

```bash
pnpm build
```

Preview the production build:

```bash
pnpm preview
```

Run linting:

```bash
pnpm lint
```

Clean generated artifacts:

```bash
pnpm clean
```

## Project Structure

```text
src/
  App.jsx          Route setup, shared state, and navigation
  Tree.jsx         Main text-to-tree interaction and download modal
  drawTree.js      Core deterministic text-to-tree SVG algorithm
  Forest.jsx       Collective forest archive and admin interactions
  drawForest.js    Forest layouts, zooming, cloud/grid/swarm rendering
  Viz.jsx          Visualization controls and route state
  APack.jsx        Stamp-style text component
  Download.jsx     QR-linked download page
  names.json       Seed archive data for the forest
```

## Admin Mode

Append `?admin=true` to the app URL to expose installation/admin controls. In admin mode, the forest view supports keyboard shortcuts:

| Shortcut | Action |
| --- | --- |
| `s` | Save the current forest to local storage. |
| `d` | Download the current forest as `names.json`. |
| `c` | Clear local storage. |
| `z` | Remove the selected tree. |
| `u` | Upload a `names.json` file. |

## Algorithm Notes

The generator starts by converting text into ASCII/Unicode code digits. Those digits are interpreted breadth-first as a tree: each digit becomes the number of children for the current node. To make trees feel natural, branch angles are assigned proportionally to leaf counts instead of being split evenly.

Some inputs create awkward structures, such as a single long branch or a very tall tree. Name2Tree detects digit segments made from leading `1`s or trailing `0`s, separates them from the main tree, and draws them as mathematical roses. This keeps the output balanced while preserving the deterministic relationship between text and drawing.

## Exhibition Context

Find Trees in Names was shown at ITP Spring Show 2025 as a collective generative art installation. Participants could create a tree, add it to the shared forest, download it with a QR code, and print it for the wall. The project explores digital identity, authorship, and the natural dimension of code by connecting a simple algorithm to something personal: a name.

The work later expanded into Tree Swarm, Tree Cloud, Tree Harmony, and the procedural landscape [{Mountains, Trees, Names}*](https://landscape.bairui.dev/).
