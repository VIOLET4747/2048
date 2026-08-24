# Project Guidance

## Scope

This repository contains a single-page 2048 game built with React, Vinext, and Vite. Keep the game playable without a database or external service.

## Key files

- `app/page.tsx`: game rules, tile identity, movement, persistence, keyboard, and touch input.
- `app/globals.css`: responsive UI and coordinate-based tile transitions.
- `worker/index.ts`: Vinext/Cloudflare runtime entry.
- `tests/rendered-html.test.mjs`: production-render smoke test.

## Invariants

- Preserve stable tile IDs across moves. CSS transitions depend on the same DOM tile moving between coordinates.
- A tile may merge only once per move.
- Invalid moves must not add a tile, change the score, or increment the move count.
- Keep input locked until the selected movement animation completes.
- Persist only serializable numeric grid values, score, moves, best score, and speed preference in `localStorage`.
- Do not add a database unless online identity, cross-device saves, or server-validated leaderboards are explicitly requested.

## Validation

Run `npm test` after game or rendering changes. Run `npm run lint` after TypeScript or React changes.
