# Folio design and architecture

Folio is a local-first card collection. A photo is the card face; it is never redrawn by OCR or generative art. The preview clips the original image to the ID-1 card ratio (1.586:1). A subtle light sweep and a spring-driven tilt give it a physical feel without changing the artwork.

The collection is the home screen. Opening a card measures its on-screen frame and animates a duplicate into the detail view. This avoids the experimental shared-element transition flag in Reanimated 4. Editing opens a sheet over the detail; saving updates the card in place.

The editor sheet slides in with a brief ease-out curve and no spring overshoot. Reduced-motion mode fades it in.

On Android, system Back closes the editor first, then closes an open card with the same transition as the on-screen back button. Back from the collection uses the platform default.

`src/model.ts` defines stored cards and NDEF records. `src/storage.ts` persists metadata with AsyncStorage and moves chosen photos to the app document directory. `src/nfc.ts` reads NDEF tags using `react-native-nfc-manager` in a native development build. Demo cards show what the experience can look like before a user adds a card.

## Card rendering research

- [React Native Skia's 3D card tutorial](https://shopify.github.io/react-native-skia/docs/tutorials/) and [shader gradients](https://shopify.github.io/react-native-skia/docs/shaders/gradients/) informed the moving light treatment. The current implementation uses gradients and transforms directly, keeping the photo untouched and the dependency set smaller.
- [Reanimated 4 shared-element transitions](https://docs.swmansion.com/react-native-reanimated/docs/category/shared-element-transitions/) are experimental, so Folio animates a measured card clone for the open/close transition.
- [Apple's reduced-motion guidance](https://developer.apple.com/documentation/accessibility/testing-system-accessibility-features-in-your-app) informs a quiet transition and disabled touch tilt when the system preference is enabled.

## NFC capability boundary

Folio reads and stores compatible NDEF records locally. The visual card and saved scan do not prove that a phone can act as the original card. Android host card emulation targets ISO-DEP APDU services, and its UID is not a stable identity mechanism ([Android documentation](https://developer.android.com/develop/connectivity/nfc/hce)). iPhone HCE requires an Apple entitlement and applies to approved use cases ([Apple developer support](https://developer.apple.com/support/hce-transactions-in-apps/)). Payment, encrypted access, and proprietary cards need issuer and platform integration. The UI uses “scan,” “link,” and “saved” accordingly.
