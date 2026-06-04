# Name2Tree

Name2Tree is a generative art app that turns text into deterministic tree drawings. It began as the ITP Spring Show 2025 project [Find Trees in Names: What if We are Trees?](https://bairui.dev/name2tree), where visitors typed a name, watched a tree grow, added it to a shared forest, downloaded it through a QR flow, and printed it as a physical keepsake. The project explores digital identity, authorship, and the natural dimension of code by connecting a simple algorithm to something personal: a name.

![Find Trees in Names](./img/readme-main.webp)

## Links

- Live app: [tree.bairui.dev](https://tree.bairui.dev/)
- Project documentation: [bairui.dev/name2tree](https://bairui.dev/name2tree)
- Related landscape: [{Mountains, Trees, Names}*](https://landscape.bairui.dev/)
- Related sound sketch: [Tree Harmony](https://music.bairui.dev/tree)
- APack: [apack.bairui.dev](https://apack.bairui.dev/)

## Why Is It

Chinese characters often carry semantic cues beyond their phonetic value. In Bairui Su's Chinese name, the first character of the last name, `柏`, means cypress tree. This project starts from that personal connection and asks what trees might be hidden in other names.

Name2Tree treats names and short text as both identity and data. By turning text into natural forms, it makes the relationship between code, language, and authorship visible, then extends the result into a shared forest, visualizations, sound, and landscape.

## What It Does

- Converts a name or any short text into ASCII/Unicode code digits.
- Builds a tree breadth-first, where each digit becomes the number of children for the current node.
- Uses a deterministic seeded generator, so the same input always creates the same tree.
- Balances branch angles by each branch's leaf count to reduce overlap and make the tree feel natural.
- Converts degenerate digit runs, such as leading `1`s or trailing `0`s, into flower-like mathematical roses so edge cases still look intentional.
- Adds an APack stamp-style signature that writes English text in a Chinese-character-like grid.
- Supports saving, downloading, QR-code retrieval, and collective forest visualizations.

![Name2Tree conversion process](./img/readme-steps.webp)

## Examples

These are trees generated from different text inputs. Notice that the input is not limited to names; any text can be converted into a tree, including Chinese poems and numbers.

| ![Example tree 1](./img/readme-tree1.webp) | ![Example tree 2](./img/readme-tree2.webp) | ![Example tree 3](./img/readme-tree3.webp) |
| --- | --- | --- |
| ![Example tree 4](./img/readme-tree4.webp) | ![Example tree 5](./img/readme-tree5.webp) | ![Example tree 6](./img/readme-tree6.webp) |

## Visualizations

The `/viz` route includes three ways to explore the collected trees from the installation:

- Swarm: a beeswarm-like timeline for exploring submitted trees temporally.
- Cloud: an organic packed layout for seeing the forest as a collective texture.
- Grid: a sortable overview by time, name, or digit-derived score.

![Tree swarm visualization](./img/readme-swarm.webp)

The work also expands into Tree Harmony and the procedural landscape [{Mountains, Trees, Names}*](https://landscape.bairui.dev/).

![Procedural landscape made from Name2Tree trees](./img/readme-landscape.webp)

## App Routes

| Route | Purpose |
| --- | --- |
| `/` | Main Name2Tree generator. Type text, preview the tree, download it, or add it to the forest. |
| `/forest` | Collective forest: community trees from Supabase (newest first), then the bundled archive from `names.json`. Click to zoom; delete your own community trees on hover. |
| `/viz` | Follow-up visualizations of the **archive** (`names.json` only) as a swarm, cloud, or grid. |
| `/write` | APack writing view for stamp-style text generation. |
| `/about` | Project background and explanation. |
| `/?text=...` | Download page for a specific tree, used by the QR-code flow. |

Admin mode is available by appending `?admin=true` to the app URL. In admin mode, the forest view supports shortcuts for saving, downloading, clearing, removing, and uploading `names.json` data.

## Tech Stack

- [React](https://react.dev/) and [Vite](https://vite.dev/) for the web app.
- [D3](https://d3js.org/) for hierarchy, scales, random seeds, zooming, and layout work.
- [Observable Plot](https://observablehq.com/plot/) for visualization support.
- [APack](https://apack.bairui.dev/) through `apackjs` for the name stamp.
- [Charming.js](https://charmingjs.org/) helpers for SVG construction.
- `hachure-fill`, `points-on-path`, and custom SVG geometry for plotter-style output.
- `@awesomeqr/react` for QR-code generation.
- [Supabase](https://supabase.com/) for community-submitted trees on `/forest` (shared project; one table per app).

## Community trees (Supabase)

Public visitors can add a tree from `/` without opening a GitHub PR. Submissions are stored in a Supabase `trees` table and shown at the top of `/forest`. The installation archive in `names.json` still ships with the app and appears below community trees. `/viz` uses only `names.json`.

Ownership uses a stable browser ID in `localStorage` (`name2tree_browser_id`). Your trees show a small mark and a **Delete** button on hover. Names are validated client-side (length, no links/email, profanity filter).

### Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run [`supabase/trees.sql`](supabase/trees.sql).
3. Copy the project URL and anon (publishable) key.
4. Add environment variables (local and Vercel):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Copy [`.env.example`](.env.example) to `.env.local` for local development (`.env.local` is gitignored).

Without these variables, the app still runs; adding community trees shows a friendly error.

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
  lib/             Supabase client, validation, community trees API
supabase/
  trees.sql        Postgres schema and RLS for community trees
```

## License

MIT
