# Agent Instructions for Nightmare Esports Codebase

This document provides coding guidelines and conventions for AI agents working in this repository.

## Project Overview

- **Type:** React 19 Single Page Application (Esports Website)
- **Build Tool:** Vite 8.0.0
- **Styling:** Tailwind CSS 4.2.1 with custom theme
- **Routing:** React Router DOM 7.13.1
- **Animation:** Framer Motion 12.38.0
- **Language:** JavaScript (JSX) - **No TypeScript**
- **Module System:** ES Modules (`"type": "module"`)
- **Package Manager:** npm (standardized)

## Build, Lint, and Test Commands

### Development
```bash
npm run dev          # Start Vite dev server (default: http://localhost:5173)
```

### Build
```bash
npm run build        # Build for production to /dist
npm run preview      # Preview production build locally
```

### Linting
```bash
npm run lint         # Run ESLint on all .js/.jsx files
```

### Testing
**⚠️ NO TESTING FRAMEWORK CONFIGURED**
- No test runner (Vitest, Jest, etc.) is installed
- No test files exist in the codebase
- If adding tests, install Vitest + @testing-library/react first

## Code Style Guidelines

### File and Folder Organization

```
src/
├── main.jsx              # App entry point
├── App.jsx               # Root component with routing
├── index.css             # Global styles + Tailwind theme
├── pages/                # Page-level components
│   └── LandingPage.jsx   # Main landing + exported views
├── components/           # Reusable components
│   ├── layout/           # Layout components
│   ├── routing/          # Route protection components
│   ├── sections/         # Page sections
│   └── ui/               # UI components
├── data/                 # Static data / constants
└── hooks/                # Custom React hooks
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

### Type Handling

**⚠️ NO TYPE VALIDATION CONFIGURED**
- No TypeScript
- No PropTypes validation
- No JSDoc comments
- Consider adding PropTypes if components become complex

### Error Handling

**⚠️ NO ERROR HANDLING PATTERNS**
- No try-catch blocks currently in use
- No error boundaries implemented
- No error state management
- When adding features with potential failures:
  - Add React error boundaries for component trees
  - Use try-catch for async operations
  - Implement error states in components

### State Management

- **Local State:** Use `useState` for component-local state
- **No Global State:** No Redux, Zustand, or Context currently
- **Router State:** Managed by React Router DOM
- Keep state close to where it's used

### Event Handling

```javascript
// Preferred: Arrow functions in event handlers
onClick={() => setIsOpen((prev) => !prev)}

// For cleanup in useEffect:
useEffect(() => {
  const handler = () => { /* ... */ };
  window.addEventListener('scroll', handler);
  return () => window.removeEventListener('scroll', handler);
}, []);
```

### ESLint Rules (Enforced)

- **Base:** `@eslint/js` recommended rules
- **React Hooks:** Rules for hooks dependencies and usage
- **React Refresh:** Vite HMR compatibility rules
- **Custom Rules:**
  - `no-unused-vars`: Error, except uppercase/underscore variables

**Ignored Patterns:**
- `dist/` directory

## Animation and Motion

- **Library:** Framer Motion 12.38.0
- **Component:** `<AnimatePresence>` for enter/exit animations
- **CSS Animations:** Custom keyframes in index.css (@keyframes glitch, float, marquee)
- Use Tailwind transition utilities for simple transitions

## Icons

- **Library:** Lucide React 0.577.0
- Import icons as named exports: `import { Calendar, ChevronRight } from 'lucide-react'`
- Style with Tailwind: `<Calendar className="h-3.5 w-3.5 text-primary" />`

## Git Workflow

- `.gitignore` configured for Node.js projects
- Ignores: `node_modules`, `dist`, logs, editor configs
- Repository is initialized and active

## Best Practices

1. **Consistency:** Follow existing patterns in the codebase
2. **Accessibility:** Use semantic HTML and ARIA labels (e.g., `aria-label="Toggle menu"`)
3. **Responsive Design:** Use Tailwind breakpoints (`lg:`, `md:`, etc.)
4. **Performance:** Use React.memo, useMemo, useCallback when needed
5. **Code Splitting:** Consider lazy loading for route components
6. **Clean Up:** Remove console.logs before committing
7. **Dependencies:** Keep dependencies up to date

## Common Tasks

### Adding a New Page
1. Create component in `src/pages/`
2. Add route in `src/App.jsx`
3. Add navigation link to `NAV_LINKS` in `LandingPage.jsx`

### Adding a Reusable Component
1. Create in `src/components/` with appropriate subfolder
2. Export as default
3. Import with `.jsx` extension

### Modifying Styles
1. Use Tailwind utilities first
2. For custom styles, add to `src/index.css` using `@layer utilities`
3. Follow existing naming conventions

## Notes for Agents

- **No Testing:** Tests cannot be run. Verify changes manually in browser.
- **No TypeScript:** Type errors won't occur, but be careful with props/data shape.
- **No Prettier:** Format code manually following existing indentation (2 spaces).
- **Icons:** All from Lucide React library.
- **Static Data:** Content is hardcoded or in `/info` markdown files.
- **Build Output:** Always ignored by git, safe to rebuild.
