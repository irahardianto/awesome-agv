---
description: End-to-end testing with Playwright MCP
---

# E2E Testing Workflow

## Purpose
Validate complete user journeys through the full system using Playwright MCP.

## When to Use
- After completing an epic/milestone
- Before release/deploy
- When adding critical user flows

## Prerequisites
- Services running (docker compose up or local dev)
- Feature implementation complete
- Unit and integration tests passing

## Steps

### 1. Start Services
Ensure the full stack is running:
```bash
docker compose up -d
# Wait for health checks
docker compose ps
```

Or local development:
```bash
# Terminal 1: Backend
cd apps/backend && go run cmd/api/main.go

# Terminal 2: Frontend  
cd apps/frontend && pnpm run dev
```

### 2. Create E2E Test Plan
Document test cases in `e2e/{feature}-{ui|api}.e2e.test.ts`:
- Happy path flows
- Error handling
- Edge cases

### 3. Execute with Playwright MCP

**Navigate to page:**
```
mcp_playwright_browser_navigate(url="http://localhost:5173/login")
```

**Capture page state:**
```
mcp_playwright_browser_snapshot()
```

**Interact with elements (use refs from snapshot):**
```
mcp_playwright_browser_type(ref="<ref>", text="test@example.com")
mcp_playwright_browser_click(ref="<ref>")
```

**Wait for results:**
```
mcp_playwright_browser_wait_for(text="Welcome")
```

**Take screenshot for documentation:**
```
mcp_playwright_browser_take_screenshot(filename="login-success.png")
```

### 4. Document Results
- Save screenshots to walkthrough
- Note any failures or issues
- Update test files if needed

## E2E Test Structure

```
e2e/
├── api/
│   └── task-crud-api.e2e.test.ts    # API-only E2E
└── ui/
    ├── auth-flow-ui.e2e.test.ts     # Browser E2E
    └── task-flow-ui.e2e.test.ts
```

## Example: Auth Flow E2E

```typescript
// e2e/ui/auth-flow-ui.e2e.test.ts
describe('Authentication Flow', () => {
  it('should register a new user', async () => {
    // Navigate to register
    // Fill form
    // Submit
    // Verify redirect to dashboard
  });

  it('should login existing user', async () => {
    // Navigate to login
    // Fill credentials
    // Submit
    // Verify dashboard loads
  });

  it('should show error for invalid credentials', async () => {
    // Navigate to login
    // Fill wrong password
    // Submit
    // Verify error message
  });
});
```

## Completion Criteria
- [ ] All critical user flows tested
- [ ] Screenshots captured for walkthrough
- [ ] No blocking issues found
