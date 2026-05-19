# Contribution Guidelines

Thank you for contributing to PayReality! As we aim to maintain our "gold standard" software quality and aesthetics, please adhere to the following guidelines strictly.

## AI SecureWatch Brand Bible & Visual Language

All UI/UX development MUST align entirely with the AI SecureWatch Design System. 

### Core Aesthetics
- **Dark Mode First**: The default operating aesthetic is a deep `#0a0e17` background with `#D1D5DB` text.
- **Forensic Rigid Forms**: Form inputs, textareas, and select components must use the `.form-input` styling: no curved corners (`border-radius: 2px`), high-contrast focus rings (`rgba(217, 64, 40, 0.4)`), and monospace uppercase labels (`font-mono text-[11px]`).
- **Accent Colors**: The primary brand accent is `var(--accent-red)` (`#D94028`). Use this for `.form-action` buttons, critical toast indicators, and alert text.
- **Glassmorphism**: Modals, panels, and secondary buttons should utilize `.glass-panel` or `bg-white/5` with slight transparency to construct a forensic HUD effect.
- **Custom Icons**: DO NOT use generic SVG icon libraries. Always reference the pre-loaded custom SVG pack defined in `app/layout.tsx` (e.g. `<use href="#icon-database"/>`).

### Testing & Code Integrity
- **Regression Tests**: Before pushing any changes, execute `npm run test` (Jest) and `npm run test:e2e` (Playwright) to ensure no regressions occur.
- **Zero Hydration Warnings**: React components must mount flawlessly. Do not rely on inline script hacks unless safely wrapped in hydration-safe patterns.
- **Commit Standards**: We employ conventional commits. Ensure your changes are batched logically.

Failure to follow the visual guidelines will result in pull requests being rejected for failing to meet the "gold standard" metric.
