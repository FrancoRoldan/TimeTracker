# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Angular 19 application for managing automated file transfers between servers using various protocols (FTP, SFTP, Network). The app provides credential management and scheduled task execution with real-time monitoring.

## Backend Dependency

This frontend requires the BoardApi backend running:
- Repository: https://github.com/FrancoRoldan/BoardApi
- Default API URL: http://localhost:5083/api
- Test credentials: test@test.com / 123456

## Development Commands

```bash
# Start dev server (opens browser automatically)
npm start

# Build for production
npm run build

# Build and watch for changes
npm run watch

# Run tests
npm run test
```

## Architecture

### Module Structure

The application uses Angular's standalone component architecture with lazy-loaded feature modules:

- **auth/** - Authentication (login, register, token refresh)
- **shared/** - Common components (layout, sidebars, dialogs, theme switcher)

### Routing Hierarchy

Main routes are protected by guards:
- `/auth` - Login/register (blocked if authenticated via IsAuthenticatedGuard)

All authenticated routes use `LayoutComponent` with responsive sidebars (left: navigation, right: settings/theme).

### Key Services

**AuthService** (src/app/auth/services/auth.service.ts)
- Handles login, registration, token management
- Stores JWT token and user in localStorage
- Provides refresh token functionality

**LoginInterceptor** (src/app/shared/services/login-interceptor.interceptor.ts)
- Adds Authorization header to all HTTP requests
- Automatically refreshes expired tokens on 401 errors
- Skips interception for /login and /refresh endpoints


### Environment Configuration

The app uses Angular's environment file replacement:
- `environment.development.ts` - Used during `ng serve` and development builds
- `environment.ts` - Production configuration

Update `baseUrl` in these files when backend API changes.

### UI Framework

- Angular Material 19 with Material Design 3 (M3) theming system
- Custom SCSS theming in public/themes/styles.scss
- Material theme switcher via ThemeService
- SweetAlert2 for confirmations/alerts
- Responsive design with mobile breakpoint at 768px (CSS) and 840px (layout/sidebars)

### Forms and Validation

- Reactive Forms with custom validators in validator services
- Modal dialogs for create/edit operations using Material Dialog
- Spanish localization for Material Paginator (SpanishPaginatorIntl)

## Common Patterns

### Creating New Features

1. Use standalone components with imports array
2. Add route to appropriate .routes.ts file
3. Inject services using `inject()` function
4. Use signals for reactive state when appropriate
5. Use ChangeDetectionStrategy.OnPush for performance

### API Calls

All services extend from environment.baseUrl. HTTP calls return Observables with proper typing from interfaces in respective feature's interfaces/ folder.

### Modal Dialogs

Follow the pattern in credential-modal.component.ts or file-transfer-modal.component.ts:
- Inject MAT_DIALOG_DATA and MatDialogRef
- Use @if/@else control flow syntax
- Return data via dialogRef.close(data)

### Guards

- `LogindGuard` - Checks for valid token, redirects to /auth if missing
- `IsAuthenticatedGuard` - Prevents authenticated users from accessing auth pages

## CSS and Theming Guidelines

### Theme System Architecture

The application uses **Material Design 3 (M3)** with a sophisticated multi-theme system:

**Available Themes:**
- **Blue** (azul) - Default theme (#769CDF)
- **Pink** (#954780)
- **Green** (#396F26)
- **Ocre** (#FAE9A1)
- **Violet** (third) (#6A3B9A)
- **Orange** (#AB4100)

**Theme Implementation:**
- Themes are defined in `public/themes/*.scss` files
- Applied as CSS classes on `<body>` element (`.azul`, `.pink`, `.green`, etc.)
- Managed by `ThemeService` (shared/services/theme-service.service.ts)
- Persisted in localStorage with key `"theme"`
- Theme picker UI available in right sidebar (buttons-theme.component)

**Dark Mode:**
- Enabled by default
- Controlled via `.dark-theme` class on `<body>`
- Persisted in localStorage with key `"dark-mode"`
- All M3 CSS variables automatically adapt to dark mode
- Uses `color-scheme: dark` CSS property

### CSS Variable Usage

**ALWAYS use Material Design 3 CSS variables for colors** to ensure proper light/dark mode support:

```css
/* Surface & Background */
background-color: var(--mat-sys-surface);
background-color: var(--mat-sys-tertiary-container);

/* Text Colors */
color: var(--mat-sys-on-surface);
color: var(--mat-sys-on-tertiary-container);

/* Borders & Dividers */
border: 1px solid var(--mat-sys-outline-variant);

/* Special Uses */
background-color: var(--mat-sys-on-primary); /* For code/path displays */
```

**Common M3 Variables:**
- `--mat-sys-surface` - Main surface background
- `--mat-sys-on-surface` - Text on surface
- `--mat-sys-tertiary-container` - Container backgrounds (cards, empty states, info boxes)
- `--mat-sys-on-tertiary-container` - Text/icons on tertiary containers
- `--mat-sys-outline-variant` - Borders and dividers
- `--mat-sys-on-primary` - Used for badges/pills (e.g., folder paths)

**Exception: Status Colors**
Only hardcode colors for status indicators to maintain consistency:
```css
/* Success (green) */
color: #4caf50;

/* Error (red) */
color: #f44336;

/* Warning (orange) */
color: #ff9800;

/* Neutral (gray) */
color: #757575;
```

### Common CSS Patterns

**Container Pattern:**
```css
.container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}
```

**Header Pattern:**
```css
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
```

**Loading Spinner:**
```css
.loading-spinner {
  display: flex;
  justify-content: center;
  padding: 40px;
}
```

**Empty State Card:**
```css
.no-data {
  text-align: center;
  padding: 40px;
  background-color: var(--mat-sys-tertiary-container);
  border-radius: 4px;
  margin: 20px 0;
}
```

**Modal Form Container:**
```css
.form-content {
  max-height: 70vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.full-width {
  width: 100%;
  margin-bottom: 10px;
}
```

**Status Indicator with Dot:**
```css
.status-indicator {
  display: flex;
  align-items: center;
}

.status-indicator::before {
  content: "";
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
  background-color: #4caf50; /* or appropriate status color */
}
```

**Responsive Grid:**
```css
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}
```

### Spacing Conventions

**Gaps:**
- Small: `gap: 8px`
- Medium: `gap: 12px`
- Large: `gap: 20px`

**Padding:**
- Tight: `padding: 8px` or `padding: 12px`
- Standard: `padding: 16px` or `padding: 20px`
- Loose: `padding: 40px`

**Margins:**
- Section spacing: `margin-bottom: 20px`
- Component spacing: `margin: 16px 0`
- Form fields: `margin-bottom: 10px` or `margin-bottom: 12px`

**Border Radius:**
- Standard containers: `border-radius: 4px`
- Interactive elements: `border-radius: 8px`
- Circular elements: `border-radius: 50%`

### Responsive Design

**Breakpoint:** `768px` (primary breakpoint for mobile/desktop)

```css
@media (min-width: 768px) {
  .search-field {
    width: 400px;
  }
}
```

Use mobile-first approach: define mobile styles by default, add desktop overrides at 768px.

### CSS Best Practices

**DO:**
- Always use M3 CSS variables (`var(--mat-sys-*)`) for colors
- Use flexbox for simple layouts (headers, centering, rows)
- Use CSS Grid for multi-column responsive layouts
- Follow the spacing scale: 8px, 12px, 16px, 20px, 40px
- Use `:host { display: block; }` for component boundaries
- Apply consistent class naming (`.container`, `.header`, `.loading-spinner`, `.no-data`, `.full-width`)
- Keep border-radius consistent: 4px for containers, 8px for buttons

**DON'T:**
- Don't hardcode colors (except status indicators)
- Don't use inline styles
- Don't create custom global utility classes without adding them to `src/styles.css`
- Don't use fixed widths - prefer max-width or responsive grids
- Don't leave commented-out CSS in the codebase

### File Locations

**Theme Configuration:**
- `public/themes/styles.scss` - Master theme configuration
- `public/themes/{blue,pink,green,ocre,third,orange}.scss` - Individual theme palettes
- `src/styles.css` - Global styles and utility classes
- `src/app/shared/services/theme-service.service.ts` - Theme switching logic
- `src/app/shared/components/buttons-theme/` - Theme picker component

**Component Styles:**
All component stylesheets use `.css` extension (not `.scss`) and are scoped to the component.
