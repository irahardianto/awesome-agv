---
trigger: model_decision
description: When working on a Flutter or React Native mobile application, setting up mobile project structure
---

## Flutter/Mobile Layout

Use this structure for Flutter or React Native mobile applications. The vertical slice principle applies — features are self-contained modules.

```
  apps/
    mobile/                           # Mobile application source code (Flutter)
      lib/
        core/                         # Foundational concerns (the "Framework")
          di/                         # Dependency injection — Riverpod ProviderScope setup
            injection.dart            # Service locator / provider registration
          network/                    # HTTP client setup, interceptors
            api_client.dart           # Dio/http client with base config
            api_interceptor.dart      # Auth token, logging interceptors
          storage/                    # Local storage abstractions
            local_storage.dart        # SharedPreferences / Hive wrapper
          theme/                      # App theming
            app_theme.dart            # ThemeData, color schemes
            app_typography.dart       # TextStyles, font families
          router/                     # Navigation / routing
            app_router.dart           # GoRouter / auto_route config
          constants/                  # App-wide constants

        features/                     # Business Features (Vertical Slices)
          task/                       # Task management feature
            # --- Presentation ---
            screens/
              task_list_screen.dart    # Full screen (route target)
              task_detail_screen.dart
            widgets/                  # Feature-specific widgets
              task_card.dart
              task_form.dart
              task_card_test.dart      # Widget tests
            # --- State Management ---
            state/
              task_notifier.dart       # Riverpod AsyncNotifier
              task_state.dart          # State classes (generated via freezed)
              task_notifier_test.dart  # Unit tests for state logic
            # --- Domain (Business Logic) ---
            models/
              task.dart               # Domain model (freezed/equatable)
              task.g.dart             # Generated code (json_serializable)
            logic/
              task_logic.dart         # Pure business rules
              task_logic_test.dart    # Unit tests (pure functions)
            # --- Data (I/O Abstraction) ---
            repository/
              task_repository.dart    # Abstract repository interface
              task_repository_impl.dart # Implementation (API + cache)
              task_repository_mock.dart # Mock for testing
            api/
              task_api.dart           # REST API calls (Dio)
              task_api_test.dart      # API integration tests
          auth/                       # Authentication feature
            ...
          settings/                   # Settings feature
            ...

        shared/                       # Shared across features
          widgets/                    # Reusable UI components (NO domain logic)
            app_button.dart
            app_text_field.dart
            loading_indicator.dart
          utils/                      # Pure utility functions
            date_formatter.dart
            validators.dart
          models/                     # Shared data models
            api_response.dart
            pagination.dart

      test/                           # Test directory (mirrors lib/)
        features/
          task/
            task_notifier_test.dart
            task_logic_test.dart
        integration_test/             # Integration / E2E tests
          task_flow_test.dart

      pubspec.yaml                    # Dependencies
      analysis_options.yaml           # Lint rules
```

**Key differences from web frontend:**
- `screens/` replaces `views/` — mobile uses screen-based navigation
- `widgets/` replaces `components/` — Flutter's terminology
- `state/` replaces `store/` — Riverpod `AsyncNotifier`/`Notifier` instead of Pinia/Redux
- `repository/` replaces `api/` — mobile often caches data locally
- `core/di/` handles dependency injection (Riverpod `ProviderScope`)

### Related Principles
- Project Structure @project-structure.md (core philosophy)
- Flutter Idioms and Patterns @flutter-idioms-and-patterns.md (Riverpod patterns, widget idioms)
