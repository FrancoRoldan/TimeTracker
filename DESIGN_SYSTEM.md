# TimeTracker — Design System & Visual Spec

> Documento de referencia para replicar el look & feel en Flutter u otro framework. Implementación por fases.

---

## Fase 1: Fundamentos del Sistema de Diseño

### 1.1 Filosofía
Material Design 3 (M3). Todos los colores van por tokens/variables — nunca hardcodeados (excepto status indicators). Un solo sistema de temas controla todo: 6 paletas × 2 modos (light/dark).

### 1.2 Tipografía

| Rol | Fuente | Tamaño | Peso |
|-----|--------|--------|------|
| Global body | Poppins | 16px | 400 |
| H1 (dashboard, reports) | Poppins | 32px | 500 |
| H2 (section titles) | Poppins | 24px | 500 |
| H3 (subsections) | Poppins | 20px | 500 |
| Label / secondary | Poppins | 14px | 400 |
| Caption | Poppins | 12px | 400 |
| Timer display | Courier New (monospace) | 64px | 700 |
| Floating timer | Courier New (monospace) | 20px | 600 |

> Flutter: `google_fonts` → `GoogleFonts.poppins()`. Timer: `GoogleFonts.robotoMono()`.

### 1.3 Espaciado (escala base 4px)

| Token | Valor | Uso |
|-------|-------|-----|
| xs | 4px | Gaps internos mínimos |
| sm | 8px | Gaps entre elementos |
| md | 12px | Padding tight |
| base | 16px | Padding estándar |
| lg | 20px | Padding containers |
| xl | 24px | Márgenes de sección |
| 2xl | 32px | Entre secciones |
| 3xl | 40px | Empty states, grandes secciones |

### 1.4 Border Radius

| Tipo | Valor |
|------|-------|
| Sharp (tablas, chips) | 4px |
| Standard (botones, cards) | 8px |
| Dialogs | 12px |
| FAB / floating widgets | 28px |
| Avatar | 50% (círculo) |

### 1.5 Sombras

```
Hover elevation:    0 4px 12px rgba(0,0,0,0.15)
Dialog:             0 8px 32px rgba(0,0,0,0.2)
Floating widget:    0 4px 16px rgba(0,0,0,0.25)
```

---

## Fase 2: Sistema de Colores y Temas

### 2.1 Tokens M3 requeridos (todos los temas los exponen)

```
Surface & Backgrounds:
  surface                   → fondo principal de la app
  surface-container-high    → fondo del sidebar izquierdo
  tertiary-container        → cards secundarias, info boxes
  primary-container         → action backgrounds

Text:
  on-surface               → texto principal
  on-surface-variant       → texto secundario / hint
  on-primary               → texto sobre botones primary
  on-tertiary-container    → texto sobre tertiary-container

Interactive:
  primary                  → color de marca, botones, links
  tertiary                 → color acento/complementario
  error                    → errores y advertencias
  outline-variant          → bordes y divisores
```

> En Flutter: `Theme.of(context).colorScheme.surface`, `.tertiary`, etc.

### 2.2 Paletas de colores (primary tono 40 = principal)

| Tema | Primary (40) | Uso del token |
|------|-------------|---------------|
| Azul (default) | `#365e9d` | Clase CSS: `azul` |
| Pink | `#90427b` | Clase CSS: `pink` |
| Green | `#356a22` | Clase CSS: `green` |
| Orange | `#a33e00` | Clase CSS: `orange` |
| Ocre | `#6a5e25` | Clase CSS: `ocre` |
| Violet | `#7748a7` | Clase CSS: `third` |

Archivos completos de paletas: `Frontend/timeTrackerApp/public/themes/*.scss`

### 2.3 Colores de status (hardcoded — iguales en todos los temas y modos)

```
Success:  #4caf50
Error:    #f44336
Warning:  #ff9800
Info:     #2196f3
```

Snackbar backgrounds usan estos colores con texto blanco.

### 2.4 Dark Mode

- Default: **dark mode activado**
- Web: clase `.dark-theme` en `<body>`
- Flutter: `ThemeMode.dark`
- Todas las variables M3 cambian automáticamente
- Persistencia: `localStorage["dark-mode"]` / `SharedPreferences`

### 2.5 Avatar de usuario

```
Background:  LinearGradient(135°, primary → tertiary)
Size:        40×40px
Shape:       círculo
Content:     2 iniciales del nombre, uppercase, texto blanco
Font:        Poppins 16px, weight 500
```

---

## Fase 3: Layout y Navegación

### 3.1 Estructura general

```
┌──────────────────────────────────────────────────────────┐
│  TOOLBAR (64px)                           [Avatar] [⚙️]  │
├──────────────────────────────────────────────────────────┤
│          │                                               │
│  LEFT    │         MAIN CONTENT                         │
│  SIDEBAR │        (pantalla activa)                     │
│  230px   │                                              │
│          │                                 [FLOATING    │
│  [Cmp ▼] │                                  TIMER FAB]  │
│  Nav     │                                              │
│  Items   │                                              │
│          │                                              │
└──────────┴──────────────────────────────────────────────┘
                          RIGHT SIDEBAR 230px (settings, hidden)
```

### 3.2 Toolbar / AppBar

- Height: 64px
- Background: `surface` (se funde con el fondo)
- Contenido izquierda→derecha: `[Menu icon (mobile)] → [spacer] → [Avatar] → [Settings icon]`
- Mobile (<840px): muestra icono hamburguesa

### 3.3 Left Sidebar (Navigation Drawer)

- Width: 230px fijo
- Background: `surface-container-high`
- Mobile (<840px): overlay/drawer, oculto por defecto
- Desktop (≥840px): siempre visible, modo "side"

**Secciones:**
1. Company Selector (dropdown) — `padding: 16px`, `border-bottom: 1px solid outline-variant`, `margin-bottom: 8px`
2. Nav items lista

**Nav item activo:** icono color primary + texto bold

#### Nav Items

| # | Label | Icono Material | Ruta |
|---|-------|----------------|------|
| 1 | Panel de control | `home` | /dashboard |
| 2 | Empresas | `business` | /companies |
| 3 | Proyectos | `folder` | /projects |
| 4 | Registro de tiempo | `timer` | /time-entries |
| 5 | Mis reportes | `bar_chart` | /reports/user |
| 6 | Reportes de proyecto | `pie_chart` | /reports/project |
| 7 | Reportes de empresa | `assessment` | /reports/company |
| 8 | Mi cuenta | `person` | /user |

### 3.4 Right Sidebar (Settings Panel)

- Width: 230px
- Background: `surface`
- Oculto por defecto, toggle con botón ⚙️ en toolbar

**Contenido:**
1. Toggle dark/light mode (switch con iconos `dark_mode` / `light_mode`)
2. Grid de 6 swatches de color — `50×50px`, `border-radius: 8px`, hover `scale(1.1)`
3. Botón Logout — icono `logout` + texto

### 3.5 Responsive Breakpoints

| Breakpoint | Comportamiento |
|-----------|----------------|
| ≥840px | Sidebars siempre visibles (side mode) |
| <840px | Sidebars como drawer/overlay |
| <768px | Grids de 1 columna, headers verticales, fonts reducidos (H1: 24px) |

---

## Fase 4: Componentes Base

### 4.1 Botones

| Tipo | Estilo | Uso |
|------|--------|-----|
| Primary | Filled / Raised | Acciones principales |
| Secondary | Text / Flat | Cancel, acciones secundarias |
| Icon Button | Circular, sin fondo | Acciones de icono |
| FAB grande | 56px círculo | Start timer (floating) |
| FAB pequeño | 40px círculo | Stop timer |
| Warn | Filled, color error | Destructivo |

### 4.2 Cards

```
Standard card:
  background:     surface
  border-radius:  8px
  padding:        16-20px

Dashboard cards (hover lift):
  hover: transform translateY(-4px)
  hover: box-shadow 0 4px 12px rgba(0,0,0,0.15)
  transition: 200ms ease

Info / Tertiary cards:
  background:  tertiary-container
  color:       on-tertiary-container
```

### 4.3 Forms

```
Layout:        flex column, gap: 16px
Field style:   fill (default) / outline
Width:         100%
Margin bottom: 10-12px
Validation:    error text rojo al submit o al perder foco
```

### 4.4 Tablas

```
Header:    bold, sticky al hacer scroll
Row height: ~48px
Cell padding: 12px
Filas alternadas: background leve
Mobile: scroll horizontal
```

### 4.5 Dialogs / Modales

```
Width:         500px desktop / 300px mobile
Max-height:    70vh
Overflow:      auto
Border-radius: 12px
Padding:       20px
Actions:       alineadas derecha, gap 8px
Botones:       [Cancelar (text)] [Confirmar (raised primary)]
```

### 4.6 Chips de Status

```
Style base: padding 4px 8px, border-radius 4px, font-weight 600, font-size 12px

Priority:
  Low:    color verde (#4caf50)
  Medium: color naranja (#ff9800)
  High:   color rojo (#f44336)

Issue Type:
  Bug:     rojo (#f44336)
  Feature: azul (#2196f3)
  Task:    gris (#9e9e9e)

Status:
  ToDo:       gris (#9e9e9e)
  InProgress: azul (#2196f3)
  Done:       verde (#4caf50)
```

### 4.7 Snackbars / Toasts

```
Success: background #4caf50, texto blanco
Error:   background #f44336, texto blanco
Info:    background #2196f3, texto blanco
Duración: 3-4 segundos
Posición: bottom-center
Animación: slide-up desde abajo, 300ms
```

### 4.8 Loading Spinner

```
Circular, color primary
Small (30px): inline en contenido
Medium (50px): page-level
Centrado, padding: 20px alrededor
```

---

## Fase 5: Componentes Específicos de la App

### 5.1 Floating Timer Button (global)

**Sin timer activo** (solo visible en /time-entries):
```
FAB grande, color primary, icono play_arrow
Posición: fixed bottom-right
Desktop: bottom 24px, right 24px
Mobile:  bottom 16px, right 16px
z-index: 1000
```

**Con timer activo** (visible en todas las rutas):
```
Widget pill flotante:
  background:    surface
  border:        2px solid primary
  border-radius: 28px
  min-width:     280px, max-width: 350px
  padding:       12px 16px
  shadow:        0 4px 16px rgba(0,0,0,0.25)

Layout interno:
  ┌─────────────────────────────────┐
  │ ⏱ 02:15:43              [Stop ⏹]│
  │ Project Name                    │
  │ Issue Title (si existe)         │
  └─────────────────────────────────┘

Timer font: monospace, 20px, weight 600
Stop button: mini FAB, color error (rojo)
```

### 5.2 Timer Display (pantalla /time-entries)

```
Área central:
  background:    tertiary-container
  border-radius: 8px
  padding:       24px
  text-align:    center

Número del timer:
  font-family:   Courier New / monospace
  font-size:     64px
  font-weight:   700
  color:         on-tertiary-container

Cuando timer activo:
  border: 2px solid primary
```

### 5.3 Dashboard Grid

```
Grid: repeat(auto-fill, minmax(320px, 1fr))
Gap: 16px
Mobile: 1 columna

Cards con hover lift
Quick-start card: background tertiary-container
```

### 5.4 Reports

```
Summary section:
  grid: auto-fit, minmax(250px, 1fr)
  gap: 16px
  Card: icono 48px + info en fila
  Total-hours card: background primary-container

Charts section:
  grid: 2 columnas desktop / 1 columna mobile
  min-height: 300px por chart
  Tipos: barra, línea, doughnut, pie
  Flutter: librería fl_chart
```

### 5.5 Kanban Board

```
Columnas: ToDo | InProgress | Done
Column min-width: 280px
Column header: bold, color según estado
Cards: arrastrables, elevation on drag
```

### 5.6 Error Dialog

```
Icono: error_outline, 64px, color error
Animación: pulse — scale(1→1.05→1), 1.5s infinite
Texto:  centrado
Botón:  Aceptar, primary, centrado
```

---

## Fase 6: Animaciones y Microinteracciones

| Interacción | Animación |
|-------------|-----------|
| Card hover | `translateY(-4px)` + shadow, 200ms ease |
| Theme swatch hover | `scale(1.1)` + shadow, 150ms |
| Error icon | pulse keyframe, 1.5s infinite |
| Sidebar open/close | slide horizontal, 300ms ease |
| Snackbar aparece | slide-up desde abajo, 300ms |
| FAB tap | ripple |
| Skeleton loading | shimmer (opcional) |

---

## Orden de Implementación Recomendado en Flutter

1. Configurar `ThemeData` M3 con las 6 paletas de colores + dark mode
2. Fuentes: `google_fonts` → Poppins + RobotoMono (timer)
3. Constantes de design tokens: spacing, radii, shadows
4. Layout `Scaffold` con `NavigationDrawer` izquierdo + `AppBar`
5. Right settings `Drawer` (tema + logout)
6. Nav items con `go_router`
7. Botones, cards, forms, tablas base
8. Status chips con colores hardcoded
9. Dialogs: confirm, error, form modal
10. Floating timer FAB con ambos estados
11. Dashboard grid responsive
12. Time tracker screen con timer display
13. Reports con `fl_chart` (bar, line, doughnut, pie)
14. Kanban board
15. Responsive con `LayoutBuilder` / `AdaptiveScaffold`

---

## Archivos de Referencia Angular

| Qué | Archivo |
|-----|---------|
| Paletas M3 completas | `Frontend/timeTrackerApp/public/themes/*.scss` |
| Estilos globales | `Frontend/timeTrackerApp/src/styles.css` |
| Layout principal | `src/app/shared/layouts/layout.component.ts` |
| Nav sidebar | `src/app/shared/components/left-side-bar/` |
| Settings sidebar | `src/app/shared/components/right-side-bar/` |
| Timer flotante | `src/app/shared/components/floating-timer-button/` |
| Theme switcher | `src/app/shared/components/buttons-theme/` |
| Start timer modal | `src/app/shared/components/start-timer-modal/` |
| Rutas | `src/app/app.routes.ts` |
