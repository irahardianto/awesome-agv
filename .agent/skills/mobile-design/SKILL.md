---
name: mobile-design
description: Generates distinctive, production-grade mobile interfaces for Flutter and React Native. Prioritizes platform-native patterns, adaptive layouts, and fluid motion. Use when building mobile apps, screens, widgets, or when the user requests to style or create visually striking mobile UI.
---

# Mobile Design Skill

This skill guides creation of distinctive, production-grade mobile interfaces that feel native to the platform while maintaining a unique aesthetic identity. Implement real working code with exceptional attention to platform conventions and creative design choices.

The user provides mobile UI requirements: a screen, widget, feature, or complete app interface. They may include context about the platform (iOS/Android), audience, or technical constraints.

## Design Thinking

Before coding, understand the context and commit to a platform-aware aesthetic direction:
- **Platform**: iOS (Cupertino), Android (Material 3), or cross-platform? Each has distinct expectations.
- **Tone**: Pick a direction — refined luxury, playful/energetic, utilitarian/efficient, editorial/content-first, organic/warm, bold/geometric, soft/pastel, etc.
- **Constraints**: Performance on low-end devices, offline capability, accessibility.
- **Differentiation**: What makes this app memorable? What's the signature interaction?

**CRITICAL**: Mobile users have muscle memory. Respect platform conventions (navigation patterns, gesture zones, system UI) while injecting personality through typography, color, motion, and layout composition.

## Mobile Design Guidelines

### Platform Conventions
- **iOS**: Bottom tab bar, large title navigation, swipe-to-go-back, Cupertino widgets
- **Android**: Material 3, navigation rail/drawer, FAB, top app bar
- **Cross-platform**: Use adaptive widgets that render platform-appropriate UI

### Typography
- Choose distinctive but highly readable fonts at mobile sizes (16px+ body)
- Respect dynamic type / font scaling — never hardcode font sizes
- Use `TextTheme` in Flutter, keep a consistent type scale
- Pair a characterful display font with a supremely legible body font

### Color & Theme
- Support **both light and dark themes** — always
- Use `ColorScheme` / `ThemeData` for consistency
- Ensure contrast ratios work on OLED (pure black) and LCD displays
- Use color purposefully — primary actions, status indicators, brand identity

### Motion & Animation
- Use **meaningful motion** — animations should communicate state changes, not decorate
- Keep animations under 300ms for interactions, up to 500ms for transitions
- Use `Hero` animations for shared element transitions
- Stagger list item animations for visual polish
- Respect `reduceMotion` / accessibility settings — always provide a static fallback

### Layout & Spacing
- Design for **one-handed use** — critical actions in thumb-reach zone (bottom 60% of screen)
- Use safe area insets — never overlap system UI (notch, home indicator, status bar)
- Design for varying screen sizes — phones, tablets, foldables
- Use responsive breakpoints: compact (<600dp), medium (600-840dp), expanded (>840dp)
- Generous touch targets: minimum 48x48dp

### Performance
- Avoid rebuilding expensive widget trees — use `const` constructors
- Lazy-load lists with `ListView.builder` (never `ListView` for large lists)
- Optimize images — use `cached_network_image`, proper resolution variants
- Profile on real devices, not just emulators

## Flutter-Specific Patterns

```dart
// ✅ Good: Adaptive widget that respects platform
Widget buildButton(BuildContext context) {
  return Platform.isIOS
    ? CupertinoButton(child: text, onPressed: onTap)
    : ElevatedButton(child: text, onPressed: onTap);
}

// ✅ Good: Responsive layout with breakpoints
Widget build(BuildContext context) {
  final width = MediaQuery.of(context).size.width;
  if (width >= 840) return _expandedLayout();
  if (width >= 600) return _mediumLayout();
  return _compactLayout();
}

// ❌ Bad: Hardcoded sizes that break on different devices
Container(width: 375, height: 812) // iPhone X only!
```

## Rule Compliance
Before implementing, verify against:
- Project Structure @project-structure.md (Flutter/Mobile layout, feature organization)
- Testing Strategy @testing-strategy.md (widget tests, integration tests)
- Security Principles @security-principles.md (secure storage, API key handling)
- Accessibility Principles @accessibility-principles.md (screen reader, dynamic type, contrast)
- Architectural Patterns @architectural-pattern.md (BLoC/Cubit, repository pattern)

**IMPORTANT**: Mobile has unique constraints — battery life, network variability, and user context (one-handed, on-the-go). Every design choice should respect these realities. Beautiful UI that drains battery or stutters on scroll is a failure.

Remember: The best mobile apps feel like they were designed specifically for the device in your hand. Make every pixel and every interaction intentional.
