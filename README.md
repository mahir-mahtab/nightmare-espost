# Nightmare Esports Website

A modern, responsive esports organization website built with React 19, Vite, and Tailwind CSS. This is the official web presence for Nightmare Esports - a professional esports organization based in Bangladesh.

## Overview

**Nightmare Esports** is a professional esports organization operating in Bangladesh, focused on PUBG Mobile with planned expansion into multiple game titles. The organization specializes in tournament operations, team management, and talent development.

### Key Features

- **Responsive Navigation** - Fixed navbar with scroll effects and mobile hamburger menu
- **Hero Section** - Animated landing area with tournament stats overlay
- **Stats Display** - Real-time tournament metrics and information
- **Achievements Gallery** - Team accomplishments with certificate imagery
- **Event Spotlight** - Featured tournament information (NMxERD T1 Elite League)
- **Teams Section** - Organization team lineups (Nightmare Esports, Nightmare Official)
- **Content Creators** - Featured streamers and creators section
- **Social Integration** - Connect with the community

### Technology Stack

| Category | Technology |
|----------|------------|
| Framework | React 19 |
| Build Tool | Vite 8.0.0 |
| Styling | Tailwind CSS 4.2.1 |
| Routing | React Router DOM 7.13.1 |
| Animation | Framer Motion 12.38.0 |
| Icons | Lucide React 0.577.0 |
| Language | JavaScript (JSX) |

## Project Structure

```
esports/
├── public/
│   ├── image.png                    # Organization logo
│   └── achivement/                  # Achievement certificates
│       ├── b4s-2nd-runner.png
│       ├── badrage_4th.png
│       ├── quadratic-1strunner.png
│       └── rip-3rd.png
├── src/
│   ├── main.jsx                     # Application entry point
│   ├── App.jsx                      # Root component with routing
│   ├── index.css                    # Global styles + Tailwind theme
│   ├── pages/                       # Page-level components
│   │   ├── LandingPage.jsx         # Home page
│   │   ├── TeamsPage.jsx            # Teams listing
│   │   ├── AchievementsPage.jsx     # Achievements gallery
│   │   ├── EventsPage.jsx           # Events/tournaments
│   │   └── AboutPage.jsx            # Organization info
│   ├── components/
│   │   ├── layout/                  # Layout components
│   │   │   ├── Navbar.jsx           # Navigation header
│   │   │   ├── Footer.jsx           # Site footer
│   │   │   ├── PageShell.jsx        # Page wrapper
│   │   │   ├── FeaturedEventBanner.jsx
│   │   │   └── index.jsx
│   │   ├── sections/                # Page sections
│   │   │   ├── HeroSection.jsx      # Main hero area
│   │   │   ├── StatsSection.jsx     # Statistics display
│   │   │   ├── AchievementsSection.jsx
│   │   │   ├── EventSpotlightSection.jsx
│   │   │   ├── TeamsSection.jsx
│   │   │   ├── ContentCreatorsSection.jsx
│   │   │   ├── StayConnectedSection.jsx
│   │   │   └── index.jsx
│   │   └── ui/                      # Reusable UI components
│   │       └── index.jsx            # GlitchText, CyberCard, etc.
│   └── data/
│       └── constants.js             # Static data & configuration
├── info/                            # Content markdown files
│   ├── about.md
│   ├── team.md
│   ├── event.md
│   └── achivement.md
└── package.json
```

## Getting Started

### Prerequisites

- Node.js (LTS version recommended)
- npm

### Installation

```bash
npm install
```

### Development

```bash
# Start development server
npm run dev
```

The development server runs at `http://localhost:5173` by default.

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Linting

```bash
npm run lint
```

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | LandingPage | Main landing page with all sections |
| `/teams` | TeamsPage | Organization teams and lineups |
| `/achievements` | AchievementsPage | Tournament achievements gallery |
| `/events` | EventsPage | Upcoming and past events |
| `/about` | AboutPage | Organization information |

## Key Data

### Navigation Links

- HOME (`/`)
- ABOUT (`/about`)
- TEAMS (`/teams`)
- ACHIEVEMENTS (`/achievements`)
- EVENTS (`/events`)

### Tournament Data

- **Event:** NMxERD T1 Elite League Season 3
- **Slots:** 36
- **Registrations:** 50 teams
- **Registration Date:** June 2nd
- **Average Lobby:** 64-74 players
- **Partners:** Krafton, Tencent Games, Lightspeed & Quantum, United Nations Community

### Achievements (NMxERD T1 Elite League - June 17, 2025)

| Rank | Team | Placement |
|------|------|-----------|
| 1st Runners Up | Quadratic Esports | 2nd Place |
| 2nd Runners Up | Before the Storm | 3rd Place |
| 3rd Runners Up | RIP Esports | 4th Place |
| 4th Runners Up | Badrage Esports | 5th Place |

### Teams

| Team Name | Line-up | Status | Game |
|-----------|---------|--------|------|
| Nightmare Esports | 1st Line-up | Active | PUBG Mobile |
| Nightmare Official | 2nd Line-up | Active | PUBG Mobile |

### Organization Info

- **Location:** Bangladesh
- **Focus:** PUBG Mobile
- **Services:** Tournament Operations, Team Management, Talent Development
- **Expansion:** Multiple game titles planned

## Design System

### Color Palette

| Name | Value | Usage |
|------|-------|-------|
| Primary | `#ff0000` | Accent color, CTAs, highlights |
| Background | `#000000` | Main background |
| Secondary | `#ffffff` | Text, borders |

### Typography

- **Display Font:** Orbitron (headings, titles)
- **Body Font:** Inter (body text)
- **Brutal Font:** Space Grotesk (special elements)

### Custom CSS Classes

- `.skew-btn` - Skewed button with primary color
- `.glass` - Glass morphism effect
- `.glass-dark` - Dark glass effect
- `.brutal-border` - Brutalist border style
- `.cyber-card` - Cyberpunk-style card
- `.text-glow` - Red text glow effect
- `.gradient-text` - Animated gradient text

### Animations

- `glitch` - Glitch text effect
- `float` - Floating animation
- `pulse-glow` - Pulsing glow effect
- `scan` - Scan line animation
- `marquee` - Continuous scrolling text

## Content Files

Content is stored in markdown format in the `info/` directory:

- [`info/about.md`](info/about.md) - Organization description
- [`info/team.md`](info/team.md) - Team information
- [`info/event.md`](info/event.md) - Event details
- [`info/achivement.md`](info/achivement.md) - Achievement records

## Development Notes

### Import Conventions

All imports follow a specific order:
1. React core imports
2. Third-party library imports
3. Local CSS imports
4. Local component imports (with `.jsx` extension)

Example:
```javascript
import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Calendar, ChevronRight } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import './index.css';
import App from './App.jsx';
```

### Component Patterns

Components are defined as functional components with named exports:
```javascript
const ComponentName = () => {
  return (
    // JSX
  );
};

export default ComponentName;
```

### State Management

- **Local State:** Use `useState` for component-local state
- **No Global State:** No Redux, Zustand, or Context currently configured
- **Router State:** Managed by React Router DOM

### Responsive Breakpoints

Tailwind CSS breakpoints are used throughout:
- Mobile: Default
- Tablet: `md:`
- Desktop: `lg:`
- Large Desktop: `xlg:`

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Follow the existing code style and conventions
- Use 2-space indentation
- Include `.jsx` extensions in imports
- Follow component patterns defined in AGENTS.md

2. Test changes locally before committing
3. Run linting: `npm run lint`

## License

Private - All rights reserved by Nightmare Esports

## Contact

For inquiries about sponsorships and partnerships, contact through the official social media channels listed on the website.
