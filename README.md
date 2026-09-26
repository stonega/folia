# Folio

A tactile, local-first mobile collection for the cards you carry. Photograph a card to preserve its exact face, then open it with a fluid card-to-detail transition. Compatible NDEF tag records can be scanned and saved in a native development build.

## Run

```sh
bun install
bun start
```

Open the Expo development server on Android or iOS. Use `bun run web` for a visual browser preview. NFC requires a native development build (`bunx expo run:android` on an NFC-capable Android device); Expo Go cannot load the NFC module.

## Quality checks

```sh
bun run check
bun test
```

## What it does

- Saves card photos and details locally.
- Shows the photo at standard card proportions with a light and tilt interaction.
- Opens and closes cards with a measured spring transition.
- Scans and stores compatible NDEF records in native builds.
- Lets you edit, recategorize, rescan, and remove cards.

Folio does **not** emulate arbitrary NFC cards. A photo or NDEF scan cannot reproduce encrypted credentials, payment cards, or a card's hardware UID. See [architecture](docs/design/architecture.md), [setup](docs/implementation/setup.md), and the [user guide](docs/user/guide.md).
