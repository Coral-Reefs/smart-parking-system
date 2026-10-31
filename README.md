# Smart Parking System

An interactive, browser-based smart-parking MVP for a fictional mall, **Grand Galleria Level B1**. The simulation walks through the complete driver journey: plate lookup, automatic bay assignment with conflict avoidance, illuminated floor-strip guidance, and a drive-to-park animation.

> **Status:** core simulation is fully functional. The marketing landing page described in [docs/README.md](docs/README.md) is planned but not implemented yet.

## Overview

The app is a single-page React + TypeScript simulation. It starts with a waiting shopper, assigns the closest available bay, and visualizes the route across the parking floor. There is no backend and no external API required.

### What you can do

- **Look up a customer by plate** from 15 pre-filled sample records, or enter any plate and car model manually.
- **Assign a bay automatically.** The closest available spot (by walking distance to the mall lobby) is selected.
- **Test the conflict rule.** Tap an occupied bay, or use **Test Rule: Spot Taken**, to simulate a rival car taking the assigned spot. The app re-routes to the next closest free bay and explains why.
- **Follow the floor light strips.** The map renders the assigned bay, the current route, and animated teal/purple guidance strips.
- **Drive and park.** Start or pause the drive, complete parking instantly, release the bay, or reset for the next car.
- **Track capacity.** Live totals show parked, assigned, and available bays on the floor.

## Tech Stack

| Layer | Tool |
| --- | --- |
| UI | React 19 + TypeScript |
| Build / dev server | Vite 8 (Rolldown-based) |
| Styling | Tailwind CSS 4 via `@tailwindcss/vite` |
| Icons | `lucide-react` |
| Package manager | Bun 1.4+ |

The project deliberately has **no runtime server dependencies**. Everything runs client-side.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) 1.4 or newer
- Node.js 22.12 or newer (for tooling compatibility)

### Install

```bash
bun install
```

For a reproducible install from the committed lockfile:

```bash
bun install --frozen-lockfile
```

No environment variables or API keys are required for the current simulation.

### Run locally

```bash
bun run dev
```

Open <http://localhost:3000>. The dev server is bound to `0.0.0.0` so it can also be reached from another device on the network.

### Verify the project

```bash
bun run lint   # TypeScript type-check (tsc --noEmit)
bun run test   # Vitest unit tests
bun run build  # Production bundle into dist/
bun run preview
```

### Other scripts

```bash
bun run test:watch  # Re-run tests on change
bun run clean       # Remove the dist/ build output
```

## Testing

Allocation and rerouting are implemented as pure functions in [`src/hooks/useParkingSimulation.ts`](src/hooks/useParkingSimulation.ts) so they can be tested without rendering React. The suite in [`src/hooks/useParkingSimulation.test.ts`](src/hooks/useParkingSimulation.test.ts) covers:

- nearest-free-bay allocation;
- preferred-bay assignment;
- fallback when a preferred bay is occupied or missing;
- releasing a previous provisional assignment;
- full-floor handling;
- contention rerouting, including a completely full floor;
- input immutability.

## Project Structure

```text
.
├── docs/
│   └── README.md                  # Product/design notes and roadmap
├── src/
│   ├── components/
│   │   ├── DriveAndParkController.tsx   # Drive/pause/park controls
│   │   ├── FloorLightStripGuidance.tsx  # LED strip guidance panel
│   │   ├── ParkingFloorMap.tsx          # SVG floor map and route
│   │   ├── SampleCustomersList.tsx      # Customer records modal
│   │   └── SpotAssignmentPanel.tsx      # Plate lookup and assignment
│   ├── data/
│   │   └── sampleRecords.ts       # Bay layout and sample customers
│   ├── hooks/
│   │   ├── useParkingSimulation.ts        # State machine + pure algorithms
│   │   └── useParkingSimulation.test.ts   # Vitest unit tests
│   ├── App.tsx                    # Page layout and composition
│   ├── index.css                  # Tailwind entry and custom animations
│   ├── main.tsx                   # React root
│   └── types.ts                   # Shared domain types
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

## Roadmap

Planned improvements, tracked in [docs/README.md](docs/README.md):

- [ ] Add a marketing landing page before the simulation, with a clear **MVP-only** entry point from `index.html`.
- [ ] Add smooth scrolling with [Lenis](https://github.com/darkroomengineering/lenis).
- [ ] Add scroll-reveal animations with [AOS](https://michalsnik.github.io/aos/).
- [ ] Keep the simulation reachable from the landing page as the primary call to action.
- [ ] Change car simulation to use wheresryan22 anatomy skills.

## Notes

- The floor layout, customers, and bay assignments are deterministic sample data in `src/data/sampleRecords.ts`.
- Tailwind CSS 4 is configured entirely through the Vite plugin; there is no `tailwind.config.js` or PostCSS pipeline.
- The `@` import alias points to the repository root (see `vite.config.ts` and `tsconfig.json`).
