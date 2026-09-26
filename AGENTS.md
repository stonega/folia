# Project instructions

This is Folio, a standalone Expo mobile app. Keep the experience calm, tactile, and fast.

## Structure

- `src/` holds application code, components, data, and platform integrations.
- `tests/` holds deterministic unit tests.
- `docs/design/` explains product and architecture decisions.
- `docs/implementation/` contains setup and native integration notes.
- `docs/user/` contains the user guide.
- `examples/` contains runnable workflow examples.
- `scripts/` contains repeatable project scripts.
- `postmortem/` is reserved for incident reports.

## Workflow

Read relevant design and implementation docs before changing a feature. Implement a small end-to-end slice, then complete the related flows. Keep modules small and readable. Update tests and docs for changed behavior. Run `bun run check` and `bun test` before finishing.

Use Expo SDK compatible packages through `bunx expo install`. Use Biome for formatting and linting. Native NFC needs a development build; Expo Go cannot provide the NFC module. Preserve a usable photo-card experience when NFC is unavailable.

Never describe a saved NFC scan as proof that the phone can emulate the original card. Only describe verified platform capabilities.

Use CodeGraph for structural code questions when this repo has a `.codegraph/` index. Do not initialize an absent index without asking the user. Use `rg` for literal text searches. Fetch current library and framework documentation through Context7 before relying on API details. Prefer `git` for version-control operations.
