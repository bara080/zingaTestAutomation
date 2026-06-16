# zingaTest

Automation test suite for the Zinga app. Owned by QA. Independent repo coupled to Zinga via a git submodule.

Design doc: `zingaLocalDocs/testingArchitecture.md` in the Zinga repo. Read that first.

## Layout

```
zingaTest/
├── zinga/                  ← git submodule → Zinga@<sha> (read-only at test time)
├── unit/{frontend,backend} ← Jest unit tests
├── component/              ← React Native Testing Library
├── integration/            ← supertest + Mongo + Redis + nock
├── e2e/                    ← Detox specs
├── fixtures/               ← seed data + Stripe webhook JSON
├── factories/              ← fishery factories
├── helpers/                ← shared utilities
└── .github/workflows/      ← CI gate
```

## First-time setup

```bash
# 1. Clone with submodule
git clone --recurse-submodules git@github.com:bara080/zingaTest.git
cd zingaTest

# 2. Install
npm install

# 3. Verify the submodule points at a real Zinga commit
ls zinga/Frontend/package.json

# 4. Run the tests
npm test
```

If you already cloned without `--recurse-submodules`:

```bash
git submodule update --init --recursive
```

## Updating the submodule pin

Tests run against whatever Zinga commit the submodule points at. To bump:

```bash
npm run submodule:update          # fetch the latest from Zinga/main
cd zinga && git log -1            # confirm the commit
cd ..
git add zinga
git commit -m "bump zinga submodule to <sha>"
git push
```

CI on Zinga PRs pins the submodule to the PR's HEAD SHA automatically (see workflow).

## Layer commands

```bash
npm run test:unit          # fast — < 60s
npm run test:component     # fast — < 60s
npm run test:integration   # ~3 min (boots in-memory Mongo + Redis)
npm run test:e2e           # ~10–15 min (builds + runs app on simulator)
npm run test:ci            # CI mode with coverage
npm run typecheck          # tsc --noEmit
```

## Critical-path tests (Day 1 coverage)

The P0 reference tests cover the bug patterns that have hit production. If any of these regress, the PR is blocked.

| Layer | Test | Covers |
|---|---|---|
| `unit/backend/` | `stripePayment.handleStripePaymentIntentSuccess.test.ts` | ACK on unknown pi instead of 500 |
| `unit/backend/` | `stripeAccount.handleStripeAccountUpdate.test.ts` | Cache bump after account.updated |
| `unit/backend/` | `stripeIdentity.stripeIdentityVerification.test.ts` | findOneAndUpdate + cache bump |
| `unit/frontend/` | `services/stripe/pollVerification.test.ts` | Polling state machine + timeout |
| `component/` | `dashboard/StripeAlertBanner.test.tsx` | `verifying` prop drives optimistic copy |
| `component/` | `auth/RegisterAccountSelectedRoleRace.test.tsx` | `selectedRoleReady` race + redirect |
| `integration/` | `auth/registerUser.flow.test.ts` | POST /api/auth/register with full body |

## Gotchas

- Tests import from `@/...` which resolves to `<rootDir>/zinga/Frontend/`. If you see "Cannot find module @/...", run `git submodule update --init`.
- Backend tests use CommonJS — import via `require('../../zinga/Backend/api/...')`.
- Sentry is auto-mocked in test setup (`helpers/sentryNoop.ts`) so tests don't fire breadcrumbs.
- The submodule is **read-only at test time**. If a test needs to modify Zinga code, the PR should land in Zinga first, then bump the submodule pin here.

## E2E with Detox

### One-time setup (per machine)

```bash
# 1. Apple developer tooling — needed even for simulator builds
xcode-select --install

# 2. CocoaPods (for iOS) — already installed if you use Expo locally
sudo gem install cocoapods

# 3. (Android only) Android Studio + Pixel 6 API 34 emulator from AVD Manager

# 4. Detox CLI globally (optional, scripts work without it)
npm install -g detox-cli
```

### Build the test target

```bash
cd /Users/bara080/bara/zingaTest

# Make sure the submodule is up to date with the branch you want to test
cd zinga && git checkout main-test && git pull && cd ..

# Generate native iOS/Android projects from Expo
cd zinga/Frontend && npx expo prebuild --platform ios --no-install && cd ../..

# Install CocoaPods deps
cd zinga/Frontend/ios && pod install && cd ../../..

# Build the iOS test app (~10 min first time, ~2 min thereafter)
npm run detox:build:ios
```

### Run the suite

```bash
# Make sure an iOS simulator is bootable (Xcode → Open Developer Tool → Simulator)
npm run detox:test:ios

# Or one spec
npx detox test --configuration ios.sim.debug e2e/app-launch.test.ts
```

### Current E2E tests

| File | What it covers |
|---|---|
| `e2e/app-launch.test.ts` | Smoke — app launches, welcome screen visible |
| `e2e/sp-onboarding.test.ts` | SP signup → identity sheet → optimistic "verifying" state → banner clears |

### testIDs required in Frontend (separate PR)

The E2E specs reference testIDs that **do not yet exist** in the Frontend code. Before these tests pass, add `testID="..."` props in the matching components:

| testID | File |
|---|---|
| `welcomeSignIn` | `Frontend/app/(auth)/welcome.tsx` |
| `welcomeSignUp` | `Frontend/app/(auth)/welcome.tsx` |
| `roleCardServiceProvider`, `roleContinue` | `Frontend/app/(auth)/register/role.tsx` |
| `registerFirstName`, `registerLastName`, `registerEmail`, `registerPassword`, `registerTermsCheckbox`, `registerCreateAccount` | `Frontend/components/registration/RegistrationAccountCustomer.tsx` + SP equivalent |
| `stripeIdentityBanner`, `stripeIdentityBannerCTA` | `Frontend/components/dashboard/StripeAlertBanner.tsx` |

File these as a TODO once you decide the testID naming convention. Treat the E2E test as a contract — when each testID lands, the corresponding step starts passing.

### Why Detox for this work (and not RNTL component tests)

RNTL v12 + Expo SDK 54's `winter/fetch` polyfill clash inside jest-expo. Component tests at the React-renderer level can't currently boot the app without crashing on the polyfill. Detox bypasses this — it tests the *built* app from outside, not the JS module graph. Trade-off: slower, but more realistic and immune to bundler issues.

## CI

Two coordinated workflows:

- **Zinga repo** → `.github/workflows/tests-dispatch.yml` fires on PR, dispatches to this repo with the SHA.
- **zingaTest repo** → `.github/workflows/tests.yml` (here) checks out the submodule at that SHA, runs the suite, reports status back to the Zinga PR.

Required secrets:

- In **Zinga** repo settings: `ZINGATEST_DISPATCH_TOKEN` (PAT with `repo` scope on this repo).
- In **zingaTest** repo settings: `ZINGA_STATUS_TOKEN` (PAT with `repo:status` scope on Zinga).
# zingaTestAutomation
