import { NavLink } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { EVENT_ROUTE_TABS } from '../../data/eventsMockData.js';

const EventSubNav = ({ eventId }) => (
  <section className="border-y border-primary/20 bg-black/70 backdrop-blur-sm">
    <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2.5 sm:px-5 lg:px-6">
      {EVENT_ROUTE_TABS.map((tab, index) => (
        <NavLink
          key={tab.id}
          to={`/events/${eventId}/${tab.id}`}
          className={({ isActive }) =>
            `group relative shrink-0 overflow-hidden rounded-md border px-3 py-2 text-[10px] font-bold tracking-[0.2em] uppercase transition-colors ${
              isActive
                ? 'border-primary/70 bg-primary/15 text-primary'
                : 'border-white/15 bg-black/35 text-white/75 hover:border-primary/45 hover:text-white'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className="relative z-10">{tab.label}</span>
              {tab.badge && (
                <span className="ml-2 rounded-sm border border-primary/60 bg-primary/12 px-1.5 py-0.5 text-[8px] tracking-[0.16em] text-primary">
                  {tab.badge}
                </span>
              )}
              {isActive && (
                <Motion.span
                  layoutId="active-event-tab"
                  className="absolute inset-0 rounded-md bg-gradient-to-r from-primary/8 via-primary/20 to-primary/8"
                  transition={{ type: 'spring', stiffness: 300, damping: 28, delay: index * 0.01 }}
                />
              )}
            </>
          )}
        </NavLink>
      ))}
    </div>
  </section>
);

export default EventSubNav;
