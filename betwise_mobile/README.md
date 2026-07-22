# BetWise Mobile

React Native + Expo app for iOS and Android. Mirrors the BetWise web frontend's
design system and connects to the same Django backend API.

## Design system

Same "matchday ledger" aesthetic as web — deep ink-teal background, scoreboard
cyan accent, risk-tier colors (teal/amber/rust), Big Shoulders Display for
headlines, Inter for body text, IBM Plex Mono for odds/stakes/currency.
The signature `RecommendationCard` is a perforated ticket-stub, rebuilt natively
with a dashed-dot divider between the match info and the confidence readout.

## Setup

```bash
npm install
cp .env.example .env
# edit .env — point EXPO_PUBLIC_API_BASE_URL at your running Django backend
npx expo start
```

Scan the QR code with Expo Go (iOS/Android), or press `i` / `a` to launch a
simulator/emulator if you have Xcode or Android Studio set up.

If you're testing on a physical device, `localhost` won't reach your dev
machine — use your machine's LAN IP instead, e.g.
`EXPO_PUBLIC_API_BASE_URL=http://192.168.1.20:8000/api`, and make sure Django's
`ALLOWED_HOSTS` and CORS settings permit it.

## Structure

Uses Expo Router (file-based routing), mirroring the web app's routes:

| Route                          | Screen                                          |
|----------------------------------|--------------------------------------------------|
| `/login`, `/signup`              | Auth (route group `(auth)`)                      |
| `/onboarding`                    | Season budget + target setup                     |
| `/` (tab)                        | Season overview — pace KPIs, chart, weekly target |
| `/recommendations` (tab)         | Filterable ticket-stub recommendation list         |
| `/recommendations/[id]`          | Match reasoning detail — H2H, form, squad news     |
| `/partners` (tab)                | Ranked external betting partner list               |
| `/pricing` (tab)                 | Plan selection, promo code, Pesapal checkout       |

Auth screens and `/onboarding` are outside the tab bar; everything else lives
in the `(app)` tab group, guarded by a redirect to `/login` if not authenticated.

## Notes

- JWT tokens are stored in `AsyncStorage` (not `localStorage` — RN has no DOM)
  and auto-refreshed on 401, mirroring the web client's interceptor logic.
- `lib/api.ts` is a direct RN port of the web app's API client — same types,
  same endpoints, same method names, so both apps stay in sync easily.
- Charts are custom-built with `react-native-svg` and plain `View`s (no heavy
  charting library) to keep the Expo Go dev experience fast and dependency-light.
- Checkout opens the Pesapal payment page via `expo-web-browser` (in-app
  browser), not the OS Safari/Chrome, so users stay in the flow.
- Building signed `.ipa` / `.aab` files for the App Store / Play Store requires
  an Expo/EAS account and `eas build` — not covered here, but the project is
  EAS-ready as-is.
