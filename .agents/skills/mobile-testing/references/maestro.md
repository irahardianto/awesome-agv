# Maestro Mobile Testing

Cross-platform declarative E2E testing framework. Works across Flutter, React Native, and native iOS/Android with YAML-based flow definitions.

## When to Use Maestro

- **Cross-platform testing** — one test definition works on both iOS and Android
- **Non-Flutter apps** — React Native, native iOS, native Android
- **Simple, readable tests** — YAML flows are accessible to non-developers (QA, product)
- **Quick prototyping** — no build step needed, flows execute against running app

## Flow Definition

```yaml
# .maestro/login_flow.yaml
appId: com.example.myapp
---
- launchApp
- tapOn: "Email"
- inputText: "test@example.com"
- tapOn: "Password"
- inputText: "securePass123"
- tapOn: "Log In"
- assertVisible: "Welcome"
- takeScreenshot: login_success
```

## Common Commands

### App Lifecycle
```yaml
# Launch app
- launchApp

# Launch with cleared state (fresh install experience)
- launchApp:
    clearState: true

# Stop app
- stopApp
```

### Interactions
```yaml
# Tap by visible text
- tapOn: "Button Text"

# Tap by accessibility ID
- tapOn:
    id: "login_button"

# Tap by index (when multiple matches)
- tapOn:
    text: "Item"
    index: 0

# Enter text
- inputText: "hello"

# Long press
- longPressOn: "Item"

# Swipe
- swipe:
    direction: UP
    duration: 500

# Back button (Android)
- pressKey: back
```

### Assertions
```yaml
# Element is visible
- assertVisible: "Welcome"

# Element is NOT visible
- assertNotVisible: "Error"

# Element is visible by ID
- assertVisible:
    id: "success_banner"
```

### Scrolling
```yaml
# Scroll until element is visible
- scrollUntilVisible:
    element: "Last Item"
    direction: DOWN
    timeout: 10000
```

### Screenshots & Waiting
```yaml
# Take screenshot
- takeScreenshot: descriptive_name

# Wait for element with timeout
- extendedWaitUntil:
    visible: "Loading Complete"
    timeout: 15000
```

### Conditional Logic
```yaml
# Run command only if element is visible
- runFlow:
    when:
      visible: "Cookie Banner"
    commands:
      - tapOn: "Accept"
```

### Sub-flows (Reusable)
```yaml
# .maestro/flows/login.yaml
- tapOn: "Email"
- inputText: "test@example.com"
- tapOn: "Password"
- inputText: "securePass123"
- tapOn: "Log In"
- assertVisible: "Welcome"
```

```yaml
# .maestro/purchase_flow.yaml
appId: com.example.myapp
---
- launchApp
- runFlow: flows/login.yaml
- tapOn: "Shop"
- tapOn: "Add to Cart"
- tapOn: "Checkout"
- assertVisible: "Order Confirmed"
```

## File Structure
```
.maestro/
  login_flow.yaml        # Standalone flow
  purchase_flow.yaml     # Journey composing sub-flows
  flows/                 # Reusable sub-flows
    login.yaml
    add_to_cart.yaml
    checkout.yaml
```

## Running

```bash
# Run all flows in directory
maestro test .maestro/

# Run a specific flow
maestro test .maestro/login_flow.yaml

# Record video while running
maestro record .maestro/login_flow.yaml

# Run against a specific device
maestro test .maestro/ --device <device_id>
```

## CI Integration

```yaml
# GitHub Actions
- name: Run Maestro tests
  uses: mobile-dev-inc/action-maestro-cloud@v1
  with:
    api-key: ${{ secrets.MAESTRO_CLOUD_API_KEY }}
    app-file: build/app.apk
    workspace: .maestro/
```

## Maestro vs Patrol vs integration_test

| Feature | Maestro | Patrol | integration_test |
|---------|---------|--------|-----------------|
| Language | YAML | Dart | Dart |
| Cross-platform definition | ✅ | ❌ (Flutter only) | ❌ (Flutter only) |
| Native OS interactions | ✅ | ✅ | ❌ |
| Compile-time type safety | ❌ | ✅ | ✅ |
| IDE support | Limited | Full | Full |
| Non-developer friendly | ✅ | ❌ | ❌ |
| Golden testing | ❌ | ❌ | ✅ (via golden_toolkit) |
