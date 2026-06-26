# Flutter Mobile Testing

Framework-specific patterns for Flutter `integration_test`, Patrol (native interactions), and golden testing.

## Flutter Integration Testing

### Setup
Add to `dev_dependencies` in `pubspec.yaml`:
```yaml
dev_dependencies:
  integration_test:
    sdk: flutter
  flutter_test:
    sdk: flutter
```

### File Structure
```
project_root/
  integration_test/
    test_driver/
      integration_test.dart    # Test driver entry point
    app_test.dart              # Test file
    login_flow_test.dart       # Journey-specific test
  test/                        # Unit/widget tests (separate)
```

### Test Driver
```dart
// integration_test/test_driver/integration_test.dart
import 'package:integration_test/integration_test_driver.dart';

Future<void> main() => integrationDriver();
```

### Writing Tests
```dart
// integration_test/login_flow_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:my_app/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('login flow completes successfully', (tester) async {
    app.main();
    await tester.pumpAndSettle();

    // Find and interact with widgets
    await tester.enterText(find.byKey(const Key('email_field')), 'test@example.com');
    await tester.enterText(find.byKey(const Key('password_field')), 'securePass123');
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const Key('login_button')));
    await tester.pumpAndSettle(const Duration(seconds: 3));

    // Assert navigation to home screen
    expect(find.byType(HomeScreen), findsOneWidget);
    expect(find.text('Welcome'), findsOneWidget);
  });
}
```

### Key Interactions
- **Find widgets:** `find.byKey()`, `find.byType()`, `find.text()`, `find.byIcon()`
- **Tap:** `tester.tap(finder)`
- **Enter text:** `tester.enterText(finder, 'value')`
- **Scroll:** `tester.scrollUntilVisible(finder, 200.0)`
- **Drag:** `tester.drag(finder, const Offset(0, -300))`
- **Wait for animations:** `tester.pumpAndSettle()` — waits until no pending frames

### Running
```bash
# Run all integration tests
flutter test integration_test/

# Run on a specific device
flutter test integration_test/ -d <device_id>

# Run a specific test file
flutter test integration_test/login_flow_test.dart
```

---

## Patrol (Native Interactions)

Use Patrol when tests need to interact with native OS features: permission dialogs, notifications, system settings, biometrics, or app lifecycle.

### Setup
```yaml
dev_dependencies:
  patrol: ^3.0.0
  patrol_finders: ^2.0.0
```

### Writing Tests
```dart
import 'package:patrol/patrol.dart';
import 'package:my_app/main.dart' as app;

void main() {
  patrolTest('grants camera permission and takes photo', ($) async {
    app.main();
    await $.pumpAndSettle();

    // Tap the camera button (Flutter widget)
    await $(#camera_button).tap();

    // Handle native permission dialog
    await $.native.grantPermissionWhenInUse();

    // Verify camera view is shown
    await $(CameraPreview).waitUntilVisible();

    // Take a photo using native interaction
    await $.native.tap(NativeSelector(text: 'Take Photo'));
  });
}
```

### Custom Finders
```dart
// By Key
await $(#login_button).tap();

// By Type
await $(ElevatedButton).tap();

// By text content
await $('Submit').tap();

// Nested: find child within parent
await $(LoginForm).$(#email_field).enterText('user@test.com');

// Wait for visibility
await $(HomeScreen).waitUntilVisible();
```

### Running
```bash
patrol test
patrol test --target integration_test/login_flow_test.dart
```

---

## Screen Object Model (Flutter)

```dart
// integration_test/screens/login_screen.dart
import 'package:flutter_test/flutter_test.dart';

class LoginScreen {
  final WidgetTester tester;
  LoginScreen(this.tester);

  // Finders
  Finder get emailField => find.byKey(const Key('email_field'));
  Finder get passwordField => find.byKey(const Key('password_field'));
  Finder get loginButton => find.byKey(const Key('login_button'));
  Finder get errorBanner => find.byKey(const Key('error_banner'));

  // Interactions
  Future<void> enterEmail(String email) async {
    await tester.enterText(emailField, email);
    await tester.pumpAndSettle();
  }

  Future<void> enterPassword(String password) async {
    await tester.enterText(passwordField, password);
    await tester.pumpAndSettle();
  }

  Future<void> tapLogin() async {
    await tester.tap(loginButton);
    await tester.pumpAndSettle(const Duration(seconds: 3));
  }

  // Composed actions
  Future<void> loginAs(String email, String password) async {
    await enterEmail(email);
    await enterPassword(password);
    await tapLogin();
  }

  // Assertions
  void assertErrorVisible(String message) {
    expect(errorBanner, findsOneWidget);
    expect(find.text(message), findsOneWidget);
  }
}
```

### Composing Flows
```dart
testWidgets('complete purchase flow', (tester) async {
  app.main();
  await tester.pumpAndSettle();

  final login = LoginScreen(tester);
  final catalog = CatalogScreen(tester);
  final cart = CartScreen(tester);
  final checkout = CheckoutScreen(tester);

  await login.loginAs('buyer@test.com', 'password123');
  await catalog.addItemToCart('Widget Pro');
  await cart.proceedToCheckout();
  await checkout.completeOrder();
  checkout.assertOrderConfirmed();
});
```

---

## Golden Testing (Visual Regression)

### Setup
```yaml
dev_dependencies:
  golden_toolkit: ^0.15.0
```

### Creating Golden Files
```dart
import 'package:golden_toolkit/golden_toolkit.dart';

void main() {
  testGoldens('login screen matches golden', (tester) async {
    await loadAppFonts(); // Required for consistent rendering

    final builder = DeviceBuilder()
      ..overrideDevicesForAllScenarios(devices: [
        Device.phone,
        Device.iphone11,
        Device.tabletLandscape,
      ])
      ..addScenario(
        name: 'default',
        widget: const LoginScreen(),
      )
      ..addScenario(
        name: 'with_error',
        widget: const LoginScreen(showError: true),
      );

    await tester.pumpDeviceBuilder(builder);
    await screenMatchesGolden(tester, 'login_screen');
  });
}
```

### Managing Golden Files
```bash
# Generate or update golden files
flutter test --update-goldens

# Run golden comparison tests
flutter test test/goldens/
```

### CI Considerations
- Always call `loadAppFonts()` before golden tests — font rendering differs across platforms
- Set tolerance for CI vs local differences:
  ```dart
  // flutter_test_config.dart
  Future<void> testExecutable(FutureOr<void> Function() testMain) async {
    return GoldenToolkit.runWithConfiguration(
      () async {
        await loadAppFonts();
        return testMain();
      },
      config: GoldenToolkitConfiguration(
        skipGoldenAssertion: () => !Platform.environment.containsKey('CI'),
      ),
    );
  }
  ```

---

## Device Matrix (Flutter)

### Size Simulation in Tests
```dart
testWidgets('renders correctly on tablet', (tester) async {
  tester.view.physicalSize = const Size(1640, 2360);
  tester.view.devicePixelRatio = 2.0;

  addTeardown(() {
    tester.view.resetPhysicalSize();
    tester.view.resetDevicePixelRatio();
  });

  app.main();
  await tester.pumpAndSettle();

  // Verify tablet layout is used
  expect(find.byType(TabletLayout), findsOneWidget);
});
```

### Platform-Specific Testing
```dart
testWidgets('shows correct navigation for platform', (tester) async {
  // Test iOS navigation style
  debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
  app.main();
  await tester.pumpAndSettle();
  expect(find.byType(CupertinoNavigationBar), findsOneWidget);

  debugDefaultTargetPlatformOverride = null;
});
```

---

## Offline & Network Testing (Flutter)

### Mock HTTP Client
```dart
// Simulate network errors in Flutter integration tests
testWidgets('shows offline banner on network error', (tester) async {
  // Use a mock HTTP client that throws
  final mockClient = MockClient((request) async {
    throw const SocketException('No internet connection');
  });

  app.main(httpClient: mockClient);
  await tester.pumpAndSettle();

  await tester.tap(find.byKey(const Key('refresh_button')));
  await tester.pumpAndSettle();

  expect(find.text('No internet connection'), findsOneWidget);
});
```

### Android Emulator Network Simulation
```bash
# Slow network (GSM latency)
emulator -avd Pixel_7_API_34 -netdelay gprs -netspeed gsm

# High latency
emulator -avd Pixel_7_API_34 -netdelay 1000
```

### Offline-First Pattern Testing
1. Seed initial data while online
2. Disconnect network (mock client or airplane mode via Patrol)
3. Perform operations — verify they queue locally
4. Reconnect network
5. Verify queued operations sync to server

---

## CI Configuration

### GitHub Actions — Flutter Integration Tests
```yaml
# .github/workflows/mobile-e2e.yml
name: Mobile E2E Tests
on: [push, pull_request]

jobs:
  android-integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          channel: stable
      - name: Enable KVM
        run: |
          echo 'KERNEL=="kvm", GROUP="kvm", MODE="0666", OPTIONS+="static_node=kvm"' \
            | sudo tee /etc/udev/rules.d/99-kvm4all.rules
          sudo udevadm control --reload-rules
          sudo udevadm trigger --name-match=kvm
      - name: Run integration tests
        uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: 34
          arch: x86_64
          script: flutter test integration_test/ --dart-define=BASE_URL=${{ vars.STAGING_URL }}
      - name: Upload screenshots
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: integration-test-screenshots
          path: integration_test/screenshots/

  ios-integration:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          channel: stable
      - name: Boot iOS simulator
        run: |
          DEVICE_ID=$(xcrun simctl create "Test iPhone" "iPhone 15" "iOS17.5")
          xcrun simctl boot "$DEVICE_ID"
      - name: Run integration tests
        run: flutter test integration_test/ -d iPhone --dart-define=BASE_URL=${{ vars.STAGING_URL }}
      - name: Upload screenshots
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: ios-test-screenshots
          path: integration_test/screenshots/
```

### Parallel Execution
```bash
# Run different test files in parallel (CI matrix strategy)
flutter test integration_test/login_flow_test.dart &
flutter test integration_test/checkout_flow_test.dart &
wait
```

### Artifact Collection
Always collect test artifacts on failure:
- Screenshots at failure points
- Device logs (`adb logcat` / `xcrun simctl spawn booted log`)
- Test reports in machine-readable format
