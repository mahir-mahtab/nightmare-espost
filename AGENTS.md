# Agent Instructions

React 19 SPA (esports website) - JavaScript only, no TypeScript.

## Commands

```bash
npm run dev      # Vite dev server → http://localhost:5173
npm run build    # Production build → /dist
npm run preview  # Preview production build
npm run lint     # ESLint on all .js/.jsx
```

**No testing framework** - no Vitest, Jest, or test files exist.

## Project Structure

```
src/
├── main.jsx              # Entry point
├── App.jsx               # Router config
├── index.css             # Global styles + Tailwind @theme
├── pages/                # Page components (LandingPage, EventsPage, etc.)
├── components/
│   ├── layout/           # Navbar, Footer, PageShell
│   ├── routing/          # ProtectedEventRoute
│   ├── sections/         # HeroSection, StatsSection, etc.
│   └── ui/               # GlitchText, CyberCard, etc.
├── data/                 # constants.js, eventAuthService.js, eventsService.js
└── hooks/                # Custom hooks
```

### Import Conventions

**Import Order:**
1. React core imports
2. Third-party library imports
3. Local CSS imports
4. Local component imports (with `.jsx` extension)

**Example:**
```javascript
import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Calendar, ChevronRight, Menu, X } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import './index.css';
import App from './App.jsx';
```

**Rules:**
- Always include `.jsx` file extensions in imports
- Use named imports from React (not default import)
- Use relative imports only (no path aliases configured)
- Group imports logically with blank lines between groups

### Component Patterns

**Component Definition:**
```javascript
const ComponentName = () => {
  return (
    // JSX
  );
};

export default ComponentName;
```

**Multiple Exports:**
```javascript
export default LandingPage;
export { TeamsView, AchievementsView, EventsView, AboutView };
```

**Hooks Usage:**
- Use functional components only (no class components)
- Common hooks: `useState`, `useEffect`
- Follow React Hooks rules (enforced by ESLint)

### Naming Conventions

- **Components:** PascalCase (`EventTicker`, `Navbar`)
- **Component Files:** PascalCase with `.jsx` extension (`LandingPage.jsx`)
- **Constants:** SCREAMING_SNAKE_CASE (`NAV_LINKS`)
- **Functions/Variables:** camelCase (`isOpen`, `setScrolled`)
- **CSS Classes:** kebab-case (`skew-btn`, `brutal-border`)

### Styling with Tailwind CSS

**Approach:** Utility-first with Tailwind CSS 4
- Use inline Tailwind utility classes directly in JSX
- Custom classes defined in `src/index.css` using `@layer utilities`
- Custom theme values via `@theme` directive in CSS

**Conditional Classes:**
```javascript
className={`text-xs font-bold ${
  isActive ? 'text-primary' : 'text-white/90 hover:text-primary'
}`}
```

**Utility Libraries:**
- `clsx` - Conditional className construction
- `tailwind-merge` - Merge Tailwind classes without conflicts

**Custom CSS Classes:**
- `.skew-btn` - Button with skew transform
- `.glass` - Glass morphism effect
- `.brutal-border` - Brutalist border style

**Color System:**
- Primary color: `text-primary`, `bg-primary`
- Opacity modifiers: `/10`, `/25`, `/70`, `/90`
- Custom gradients using arbitrary values

### Event Authentication

**Event Routes:** Protected by `ProtectedEventRoute` wrapper (see `App.jsx` lines 21-28)
- Authentication managed by `eventAuthService.js` (localStorage with 8hr TTL)
- Login flow: `/events/login/:eventId` → `/events/:eventId/:tab`
- Session storage key: `nm-event-auth:{eventId}`
- Protected routes redirect to login if session expired/missing

## Icons & Animation

- **Icons:** Lucide React 0.577.0 - `import { Calendar } from 'lucide-react'`
- **Animation:** Framer Motion 12.38.0 - use `<AnimatePresence>` for enter/exit
- **CSS Animations:** Custom `@keyframes` in `index.css` (glitch, float, marquee)

## ESLint Rules

- Base: `@eslint/js` recommended
- React Hooks rules enforced
- Custom: `no-unused-vars` error, except uppercase/underscore variables
- Ignored: `dist/`

## Common Tasks

**Adding a Page:**
1. Create in `src/pages/`
2. Add route in `src/App.jsx`
3. Add nav link to `NAV_LINKS` constant (if applicable)

**Modifying Styles:**
1. Use Tailwind utilities first
2. Custom styles → `src/index.css` using `@layer utilities`

## Notes

- **No testing framework** - verify changes manually in browser
- **No TypeScript** - be careful with props/data shape
- **No Prettier** - format code manually (2 spaces)
- **No PropTypes** - no runtime validation
- **Static data** - content in `/info` markdown files or hardcoded
- Git repo on branch `opus-2`
