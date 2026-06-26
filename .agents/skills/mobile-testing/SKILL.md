---
name: mobile-testing
description: >-
  Mobile E2E testing patterns — Flutter integration_test, Patrol, Maestro,
  golden testing, device matrix, and test data management.
  Use when writing E2E tests for mobile applications.
---

# Mobile Testing

## Overview

Load this skill when writing E2E or integration tests for mobile applications (Flutter, React Native, or native iOS/Android). This skill complements the `browser-automation` skill which covers web — this skill covers native mobile.

**Framework references:** This file covers patterns and strategies. For framework-specific setup, API, and code examples, see:
- [Flutter (integration_test, Patrol, Golden Testing)](file:///Users/irahardianto/works/awesome-agv/.agents/skills/mobile-testing/references/flutter.md)
- [Maestro (cross-platform YAML flows)](file:///Users/irahardianto/works/awesome-agv/.agents/skills/mobile-testing/references/maestro.md)

## Screen Object Model

The mobile equivalent of Page Object Model. Encapsulates screen-specific finders, interactions, and assertions in reusable classes.

### Principles
- **One class per screen** — mirrors the app's navigation structure
- **Encapsulate finders** — expose semantic methods, not raw selectors
- **Compose flows** — tests chain screen objects into user journeys
- **Assert at the screen level** — each screen knows its own success/error states

### Structure
```
integration_test/
  screens/
    login_screen.dart       # Finders + interactions for login
    home_screen.dart        # Finders + interactions for home
    checkout_screen.dart    # Finders + interactions for checkout
  flows/
    purchase_flow_test.dart # Composes screen objects into journey
```

### Pattern (language-agnostic)
Each screen object exposes:
1. **Finders** — locators for key UI elements (by key, type, text, accessibility ID)
2. **Interactions** — methods for user actions (`enterEmail()`, `tapLogin()`, `scrollToItem()`)
3. **Composed actions** — higher-level methods combining multiple interactions (`loginAs(email, password)`)
4. **Assertions** — methods to verify screen state (`assertErrorVisible()`, `assertWelcomeShown()`)

For framework-specific implementations, see the references:
- **Flutter/Patrol:** See [flutter.md § Screen Object Model](file:///Users/irahardianto/works/awesome-agv/.agents/skills/mobile-testing/references/flutter.md)
- **Maestro:** Uses YAML sub-flows rather than code classes — see [maestro.md](file:///Users/irahardianto/works/awesome-agv/.agents/skills/mobile-testing/references/maestro.md)

## Test Data Management

### API Seeding
Call backend API to create test state before tests run:
- Create test users with specific roles/permissions
- Seed catalog/inventory data
- Set up payment test scenarios (test cards, etc.)

**Pattern:** Create a `TestApi` helper class that wraps seeding endpoints. Inject the base URL via environment configuration.

### State Reset
- Reset between tests to ensure isolation — call a cleanup endpoint or use database rollback
- Use `setUp()`/`tearDown()` (or framework equivalent) to automate reset
- Never rely on test execution order

### Environment Configuration
- Use build-time environment variables to switch between local and staging backends
- Keep test API keys separate from production keys
- Example: `BASE_URL` and `API_KEY` injected via `--dart-define` (Flutter) or `.env` (React Native)

### Test Fixtures
- Create factory functions for common test data (test users, orders, products)
- Prefer deterministic data over random — random data makes failures hard to reproduce
- Use unique identifiers per test run to avoid cross-test contamination

## Device Matrix Testing

### Screen Sizes to Cover

| Category | Example | Resolution |
|----------|---------|------------|
| Small phone | iPhone SE | 375×667 |
| Medium phone | iPhone 14 | 390×844 |
| Large phone | iPhone 14 Pro Max | 430×932 |
| Tablet | iPad Air | 820×1180 |
| Foldable | Galaxy Fold (open) | 717×512 |

### Testing Strategy
- **P0 tests:** Run on medium phone (most common) — minimum viable matrix
- **P1 tests:** Add small phone + tablet — catch responsive layout breakpoints
- **P2 tests:** Add foldable + landscape orientation — catch edge layout issues
- **Platform differences:** Test on both iOS and Android when behavior diverges (navigation style, permissions UX, keyboard behavior)

### Orientation Testing
- Test portrait (default) and landscape for screens that should support rotation
- Verify layout adapts correctly — no overflow, no clipped content
- Some screens should lock orientation — verify rotation is ignored

For framework-specific size simulation APIs, see the [Flutter reference](file:///Users/irahardianto/works/awesome-agv/.agents/skills/mobile-testing/references/flutter.md).

## Offline & Network Testing

### Patterns to Test
1. **Offline detection** — app shows offline banner or indicator
2. **Offline-first operations** — user can perform actions that queue locally
3. **Reconnection sync** — queued operations sync when connection restores
4. **Graceful degradation** — app disables features requiring network with clear UX
5. **Slow network** — loading states appear, no premature timeouts, no duplicate submissions

### Testing Approach
- **Mock HTTP client:** Inject a client that throws network errors — test offline UI states without device manipulation
- **Patrol native interactions:** Use `$.native.disableWifi()` / `$.native.enableWifi()` for real airplane mode testing on physical devices or emulators
- **Android emulator flags:** Use `-netdelay` and `-netspeed` flags for slow network simulation

For code examples, see the [Flutter reference](file:///Users/irahardianto/works/awesome-agv/.agents/skills/mobile-testing/references/flutter.md).

## CI Configuration

### Key Considerations
- **Android emulator in CI:** Requires KVM hardware acceleration on Linux runners. Use `reactivecircus/android-emulator-runner` GitHub Action.
- **iOS simulator in CI:** Requires macOS runners. Create and boot simulator via `xcrun simctl`.
- **Parallel execution:** Split test files across CI matrix jobs for faster runs.
- **Artifact collection:** Always upload screenshots and device logs on failure (`actions/upload-artifact`).
- **Golden tests:** Generate golden files locally, commit to repo, compare in CI. Set tolerance for cross-platform rendering differences.

For CI workflow YAML examples, see the [Flutter reference § CI Configuration](file:///Users/irahardianto/works/awesome-agv/.agents/skills/mobile-testing/references/flutter.md).

## Framework Selection Guide

| Stack | Recommended Framework | Native Interactions | Visual Regression |
|-------|----------------------|--------------------|--------------------|
| **Flutter** | `integration_test` + Patrol | Patrol | `golden_toolkit` |
| **React Native** | Detox or Maestro | Maestro | Screenshot comparison |
| **Native iOS** | XCUITest or Maestro | XCUITest / Maestro | Snapshot testing |
| **Native Android** | Espresso or Maestro | Espresso / Maestro | Screenshot testing |
| **Cross-platform** | Maestro | Maestro | Maestro screenshots |
