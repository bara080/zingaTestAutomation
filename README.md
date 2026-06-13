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

## CI

Two coordinated workflows:

- **Zinga repo** → `.github/workflows/tests-dispatch.yml` fires on PR, dispatches to this repo with the SHA.
- **zingaTest repo** → `.github/workflows/tests.yml` (here) checks out the submodule at that SHA, runs the suite, reports status back to the Zinga PR.

Required secrets:

- In **Zinga** repo settings: `ZINGATEST_DISPATCH_TOKEN` (PAT with `repo` scope on this repo).
- In **zingaTest** repo settings: `ZINGA_STATUS_TOKEN` (PAT with `repo:status` scope on Zinga).
# zingaTestAutomation
