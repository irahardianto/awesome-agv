---
name: browser-automation
description: >-
  Playwright browser automation via MCP. Covers E2E testing, UI review,
  web scraping, screenshot capture, and general browser interaction.
  MCP-first — CLI is fallback only.
---

# Browser Automation (Playwright MCP)

## Tool Hierarchy

**PRIMARY — MCP tools (always prefer):**
- `mcp_playwright_browser_snapshot` — read page structure, get element refs
- `mcp_playwright_browser_navigate` — go to URL
- `mcp_playwright_browser_click` — click element
- `mcp_playwright_browser_type` — type into element
- `mcp_playwright_browser_fill_form` — fill multiple form fields
- `mcp_playwright_browser_select_option` — dropdown selection
- `mcp_playwright_browser_hover` — hover element
- `mcp_playwright_browser_drag` — drag and drop
- `mcp_playwright_browser_drop` — drop files/data onto element
- `mcp_playwright_browser_press_key` — keyboard input
- `mcp_playwright_browser_evaluate` — execute JS on page
- `mcp_playwright_browser_wait_for` — wait for text/disappearance/time
- `mcp_playwright_browser_console_messages` — read console output
- `mcp_playwright_browser_network_requests` — list network activity
- `mcp_playwright_browser_network_request` — inspect single request
- `mcp_playwright_browser_file_upload` — upload files
- `mcp_playwright_browser_handle_dialog` — accept/dismiss dialogs
- `mcp_playwright_browser_tabs` — manage tabs
- `mcp_playwright_browser_resize` — change viewport
- `mcp_playwright_browser_run_code_unsafe` — arbitrary Playwright code (escape hatch)

**FALLBACK — CLI via `run_command` (only when MCP lacks capability):**
- Tracing start/stop
- Video recording
- Persistent browser profiles
- Browser installation (`npx playwright install`)

**NEVER** mix MCP and CLI for the same session. One approach per workflow.

---

## Snapshot-First Workflow

Every browser interaction follows this loop:

1. **Snapshot** — `mcp_playwright_browser_snapshot` to understand current state
2. **Act** — click/type/navigate using refs from snapshot
3. **Verify** — snapshot again to confirm mutation took effect

Rules:
- ALWAYS snapshot before first interaction on a page
- Use snapshot element refs (`ref="e5"`) for targeting — not CSS selectors
- After navigation or state mutation, snapshot again to read new state
- Use `depth` param to limit snapshot size for large pages
- Use `target` param to scope snapshot to a subtree

---

## Selector Strategy

When writing test code or `run_code_unsafe` scripts, prefer selectors in this order:

1. **Role-based** (most resilient, mirrors user experience)
   ```js
   page.getByRole('button', { name: 'Submit' })
   page.getByRole('textbox', { name: 'Email' })
   page.getByLabel('Password')
   page.getByText('Sign in')
   page.getByPlaceholder('Enter your email')
   page.getByTitle('Close dialog')
   ```
   > If you can't locate an element by role/label, it signals an accessibility gap in the component.

2. **Test ID attributes** (stable, decoupled from UI)
   ```js
   page.getByTestId('submit-button')          // uses data-testid by default
   page.locator('[data-testid="submit-button"]') // explicit attribute form
   ```

3. **Semantic HTML** (acceptable)
   ```js
   page.locator('button[type="submit"]')
   page.locator('input[name="email"]')
   ```

4. **CSS class/ID** (avoid — fragile, changes with styling)
   ```js
   page.locator('.btn-primary')  // AVOID
   page.locator('#submit')       // AVOID
   ```

5. **Complex CSS/XPath** (last resort — brittle)
   ```js
   page.locator('div.container > form > button')  // FRAGILE
   ```

---

## Waiting Strategy

### Do
- `mcp_playwright_browser_wait_for` with `text` or `textGone`
- Playwright's auto-waiting (built into click/fill/etc.)
- `waitForURL`, `waitForSelector`, `waitForLoadState` in test code
- `page.locator('.el').waitFor({ state: 'visible' })` for explicit waits

### Never
- `page.waitForTimeout(N)` — arbitrary delays cause flakiness
- `waitForLoadState('networkidle')` — unreliable, race-prone, slow
- `page.waitForTimeout` as a "fix" for timing issues
- Skipping hooks or adding sleeps as a fix for failures

---

## Assertion Patterns (E2E Tests)

### Locator-Assertion Pairing Rules
- When locator is **text-based** (getByText, text filter) → assert `toBeVisible()` (don't re-assert the text)
- When locator is **non-text** (getByTestId, getByLabel) → assert `toHaveText()`, `toContainText()`
- Input assertions → `toHaveValue()`, `toBeEmpty()`
- Checkbox/radio → `toBeChecked()` / `not.toBeChecked()`
- Structural assertions → `toMatchAriaSnapshot()` for partial page structure

### Common Assertions
```js
await expect(page).toHaveTitle('My App');
await expect(page).toHaveURL(/.*dashboard/);
await expect(page.locator('.message')).toBeVisible();
await expect(page.locator('.spinner')).toBeHidden();
await expect(page.locator('button')).toBeEnabled();
await expect(page.locator('input')).toHaveValue('test@example.com');
await expect(page.locator('.item')).toHaveCount(5);
```

---

## Network Mocking (Test Isolation)

Use `mcp_playwright_browser_run_code_unsafe` to set up route handlers:

### Mock API response
```js
async (page) => {
  await page.route('**/api/users', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 1, name: 'Test User' }])
    });
  });
}
```

### Simulate network failure
```js
async (page) => {
  await page.route('**/api/data', route => route.abort('internetdisconnected'));
}
// Abort reasons: connectionrefused, timedout, connectionreset, internetdisconnected
```

### Modify real response
```js
async (page) => {
  await page.route('**/api/user', async route => {
    const response = await route.fetch();
    const json = await response.json();
    json.isPremium = true;
    await route.fulfill({ response, json });
  });
}
```

### Block resources (speed up tests)
```js
async (page) => {
  await page.route('**/*.{png,jpg,jpeg,gif,svg}', route => route.abort());
}
```

---

## Error Diagnosis Protocol

When a browser interaction fails or produces unexpected results:

1. **Snapshot** — capture DOM state at failure point
   ```
   mcp_playwright_browser_snapshot
   ```
2. **Console** — check for app-side errors
   ```
   mcp_playwright_browser_console_messages level="error"
   ```
3. **Network** — check for failed requests
   ```
   mcp_playwright_browser_network_requests
   ```
4. **Evaluate** — inspect specific state
   ```
   mcp_playwright_browser_evaluate function="() => document.title"
   ```

Common failure causes:
- Selector drift (element renamed/moved/wrapped)
- Timing (async load not waited for)
- Network failure (API returned error)
- Dialog blocking (unhandled alert/confirm)
- iframe boundary (element in child frame)
- OS/environment rendering difference (visual regression)

**CI artifact retention** — always configure Playwright to save traces, screenshots, and videos on failure:
```typescript
// playwright.config.ts
use: {
  trace: 'on-first-retry',     // trace on first failure, not every run
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
}
```

---

## E2E Test Structure

### One test per file (AI-optimized)
Each test file contains exactly one `test()` call. This ensures:
- Single-responsibility reasoning for generation and healing
- No shared state leakage between sibling tests
- File = natural unit of parallelism
- Test name maps 1:1 to file name (zero ambiguity)

### File naming
```
tests/e2e/<group>/<kebab-case-scenario>.spec.ts
```

### Template
```typescript
import { test, expect } from '@playwright/test';

test.describe('<Group Name>', () => {
  test('<scenario description>', async ({ page }) => {
    // 1. Navigate
    await page.goto('/path');

    // 2. Act
    await page.getByRole('textbox', { name: 'Email' }).fill('user@test.com');
    await page.getByRole('button', { name: 'Submit' }).click();

    // 3. Assert
    await expect(page).toHaveURL(/.*success/);
    await expect(page.getByRole('heading')).toContainText('Welcome');
  });
});
```

### Scenario independence
- Each test starts from a clean state (no chaining between tests)
- Use fixtures for shared setup (navigation, auth)
- Clean up test data after run
- No ordering dependencies

---

## Auth State Management (storageState)

Authenticate once per suite run via API — reuse across all tests. Never log in via UI per test.

### Setup project pattern
```typescript
// tests/auth.setup.ts
import { test as setup } from '@playwright/test';

setup('authenticate', async ({ request, page }) => {
  // Prefer API auth — faster, no UI dependency
  const response = await request.post('/api/auth/login', {
    data: { email: process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD }
  });
  // OR via UI login if API not available
  // await page.goto('/login'); ...
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
```

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { storageState: 'playwright/.auth/user.json' },
      dependencies: ['setup'],
    },
  ],
});
```

Rules:
- Add `playwright/.auth/` to `.gitignore` — contains live session tokens
- Use `process.env` for credentials — never hardcode
- Keep dedicated login/logout E2E tests — auth setup skips UI, tests verify it
- **Parallel-safe**: if tests mutate server-side state, use `testInfo.parallelIndex` to map each worker to a separate test account

---

## Test Data Management

### Seeding strategy (priority order)
1. **API calls** — use `request` fixture to create/destroy data via backend endpoints (fast, no UI dependency)
2. **Unique dynamic data** — generate per-test with `crypto.randomUUID()` or `faker-js` to prevent collisions in parallel runs
3. **External JSON fixtures** — for complex static structures (product catalogs, locale strings)
4. **UI-driven setup** — last resort only; never for data that could be created via API

### Fixture pattern for data lifecycle
```typescript
// fixtures.ts
export const test = base.extend<{ createdUser: User }>({
  createdUser: async ({ request }, use) => {
    // Setup
    const user = await request.post('/api/users', {
      data: { email: `test-${crypto.randomUUID()}@example.com` }
    }).then(r => r.json());
    // Inject into test
    await use(user);
    // Teardown — runs even if test fails
    await request.delete(`/api/users/${user.id}`);
  },
});
```

### Anti-patterns
- ❌ UI-driven test data creation (login flow to create a record)
- ❌ Static shared test accounts (race conditions in parallel runs)
- ❌ Relying on pre-seeded database records by fixed ID/name
- ❌ Database transaction rollback hacks (breaks async workflows)
- ❌ Excessive `beforeEach` for setup not used by every test

---

## playwright.config.ts — Recommended CI Configuration

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,               // tests within a file run concurrently
  forbidOnly: !!process.env.CI,       // fail CI if test.only left in source
  retries: process.env.CI ? 2 : 0,   // retry flaky tests on CI only
  workers: process.env.CI ? 4 : undefined,
  reporter: process.env.CI ? 'blob' : 'html',  // blob enables shard merging

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',          // trace on first failure — not every run
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
});
```

**Sharding for large suites** (horizontal CI scaling):
```bash
# Run shard 1 of 4 — spread across 4 CI nodes
npx playwright test --shard=1/4
# Merge shard reports after all complete
npx playwright merge-reports ./blob-reports
```

---

## Visual Regression Testing

Use `toHaveScreenshot()` for pixel-level regression detection. Baselines are committed to VCS.

```typescript
test('homepage layout', async ({ page }) => {
  await page.goto('/');
  // First run creates baseline; subsequent runs diff against it
  await expect(page).toHaveScreenshot('homepage.png', {
    maxDiffPixels: 100,      // tolerate minor rendering differences
    threshold: 0.2,
    mask: [page.locator('.timestamp'), page.locator('.ad-banner')],  // hide dynamic content
  });
});

// Element-scoped screenshot (preferred over full-page for components)
await expect(page.locator('.chart')).toHaveScreenshot('chart.png');
```

Rules:
- Run in consistent environment (Docker in CI) — OS affects font rendering
- Commit baseline files to VCS — they ARE the expected truth
- Update baselines intentionally: `npx playwright test --update-snapshots`
- Mask dynamic elements (timestamps, avatars, ads) to avoid false positives
- Disable CSS animations in test config: `reducedMotion: 'reduce'`
- Full-page screenshots: unreliable for long pages — scope to component

---

## Accessibility Testing

### Layer 1: Structural regression (`toMatchAriaSnapshot`)
Built into Playwright. Validates accessibility tree — catches semantic changes axe-core misses.
```typescript
await expect(page.locator('nav')).toMatchAriaSnapshot(`
  - navigation:
    - link "Home"
    - link "Products"
    - link "Sign in"
`);
```

### Layer 2: Rule-based scanning (`@axe-core/playwright`)
Catches WCAG violations: missing labels, contrast failures, duplicate IDs.
```typescript
import { AxeBuilder } from '@axe-core/playwright';

test('no accessibility violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toHaveLength(0);
});
```

### Layer 3: Keyboard navigation
Axe-core does not verify keyboard usability — must be explicit:
```typescript
// Verify tab order and focus trap in modals
await page.keyboard.press('Tab');
await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'first-focusable');

// Escape dismisses modal
await page.keyboard.press('Escape');
await expect(page.locator('[role="dialog"]')).toBeHidden();
```

Rule: if role-based locators can't find an element during regular test writing, flag it — it means the component has an accessibility gap.

---

## API Testing Patterns

### `browserContext.request` — shares cookies with browser
Use when API action must be reflected immediately in the UI:
```typescript
test('create post then see it', async ({ page, context }) => {
  // API call shares session with the browser context
  await context.request.post('/api/posts', { data: { title: 'Test' } });
  await page.reload();
  await expect(page.getByText('Test')).toBeVisible();
});
```

### `request.newContext()` — fully isolated API context
Use for pure API/contract testing with no browser:
```typescript
test('POST /api/users returns 201', async ({ playwright }) => {
  const apiContext = await playwright.request.newContext({
    baseURL: process.env.API_URL,
    extraHTTPHeaders: { Authorization: `Bearer ${process.env.API_TOKEN}` }
  });
  const response = await apiContext.post('/api/users', {
    data: { email: 'test@example.com' }
  });
  expect(response.status()).toBe(201);
  const body = await response.json();
  expect(body).toMatchObject({ email: 'test@example.com' });
  await apiContext.dispose();
});
```

### Hybrid: API for setup, UI for assertion
```typescript
test('newly created item appears in list', async ({ request, page }) => {
  // Fast API seed
  await request.post('/api/items', { data: { name: 'Widget' } });
  // Verify UI
  await page.goto('/items');
  await expect(page.getByText('Widget')).toBeVisible();
});
```

Rules:
- Centralize `baseURL` and auth headers in `playwright.config.ts`
- Check `response.ok()` or assert status explicitly — Playwright returns response regardless of status code
- Use TypeScript interfaces for request/response bodies
- `browserContext.request` for UI-reflected API calls; `request.newContext()` for isolated API smoke tests

---

## Test Coverage Strategy (Test Pyramid)

| Layer | Target | Tool | When to Write |
|-------|--------|------|---------------|
| Unit | ~70% of logic | Vitest/Jest | Individual functions, pure logic, edge cases |
| Integration/API | ~20% | Playwright `request`, API clients | Service contracts, DB interactions, API responses |
| E2E | ~10% critical paths | Playwright UI | Money paths only — login, checkout, key user journeys |

E2E is **expensive**: slow to run, costly to maintain, prone to flakiness. Write E2E tests only when:
- The flow crosses multiple systems/services
- A regression in this flow causes direct business loss
- The flow cannot be adequately covered by integration tests

When a bug is found in E2E, ask: *could this have been caught earlier (unit/integration)?* If yes, add that lower-level test too.

---

## Page Object Model (Complex Flows)

For repeated interaction patterns across multiple tests:

```javascript
class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.getByRole('textbox', { name: 'Email' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password' });
    this.submitButton = page.getByRole('button', { name: 'Sign in' });
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

Use POM when:
- Same page interactions appear in 3+ test files
- Form has 4+ fields
- Complex multi-step flows (checkout, onboarding)

---

## Non-Testing Browser Automation

### UI Review / Visual Inspection
1. Navigate → `mcp_playwright_browser_navigate`
2. Resize for viewport → `mcp_playwright_browser_resize`
3. Snapshot for structure → `mcp_playwright_browser_snapshot`
4. Evaluate for computed styles → `mcp_playwright_browser_evaluate`

### Screenshot Capture
Use `browser_subagent` tool for screenshot workflows — it automatically records as WebP video.

### Web Scraping / Data Extraction
1. Navigate to target
2. Snapshot to identify structure
3. Evaluate to extract data:
   ```js
   async (page) => {
     return await page.$$eval('.item', els =>
       els.map(el => ({
         title: el.querySelector('h2')?.textContent?.trim(),
         link: el.querySelector('a')?.href,
       }))
     );
   }
   ```

### Form Automation
Use `mcp_playwright_browser_fill_form` for multi-field forms — single call, atomic:
```
fields: [
  { target: "ref", name: "Email", type: "textbox", value: "user@test.com" },
  { target: "ref", name: "Remember", type: "checkbox", value: "true" }
]
```

---

## Anti-Patterns

| ❌ Don't | ✅ Do Instead |
|----------|---------------|
| `page.waitForTimeout(2000)` | `page.locator('.el').waitFor({ state: 'visible' })` |
| `waitForLoadState('networkidle')` | `waitForURL()` or `waitForSelector()` |
| CSS class/ID selectors in tests | Role-based or `getByTestId()` selectors |
| Skip hooks as a "fix" | Find and fix the root cause |
| Silent `test.skip()` | `test.fixme('reason or issue link')` |
| Chain test scenarios | Independent tests from clean state |
| Assert text from text-based locator | Use `toBeVisible()` for text locators |
| Multiple tests per file | One test per file for AI predictability |
| Mix MCP and CLI in same session | Choose one approach per workflow |
| UI login in every test | `storageState` fixture via setup project |
| UI-driven test data setup | API `request` fixture for seeding |
| Static shared test accounts | Unique dynamic data per test / per-worker accounts |
| E2E tests for all business logic | E2E for critical paths only — unit/integration for the rest |
| Hardcoded credentials | `process.env.*` always |
| Committing `.auth/` files | Add `playwright/.auth/` to `.gitignore` |

---

## E2E Testing with Playwright MCP (Interactive Development)

When running E2E tests interactively (during development or verification), use Playwright MCP directly:

```
# Navigate to the page
mcp_playwright_browser_navigate(url="http://localhost:5173/login")

# Capture accessible state (better than screenshot for assertions)
mcp_playwright_browser_snapshot()

# Interact with elements by ref from snapshot
mcp_playwright_browser_type(ref="<ref>", text="test@example.com")
mcp_playwright_browser_click(ref="<ref>")

# Wait for results
mcp_playwright_browser_wait_for(text="Welcome")

# Capture snapshot for walkthrough documentation
mcp_playwright_browser_snapshot(filename="login-success.md")
```

### MCP E2E Requirements

- Capture a snapshot (`mcp_playwright_browser_snapshot`) at each major step
- Save snapshots to walkthrough as proof of functionality
- If visual proof is needed, use `browser_subagent` with `RecordingName` to produce a recorded video artifact
- Test happy path AND at least one error path
- Clean up test data after test (or use unique identifiers per test run)

> For E2E test file organization and directory structure, see the `testing-strategy` rule.

