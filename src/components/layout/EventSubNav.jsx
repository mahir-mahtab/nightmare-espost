import { NavLink } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { EVENT_ROUTE_TABS } from '../../data/eventsMockData.js';

const EventSubNav = ({ eventId }) => (
  <section className="border-y border-primary/20 bg-gradient-to-r from-primary/12 via-black to-primary/12">
    <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-5 py-3 lg:px-8">
      {EVENT_ROUTE_TABS.map((tab, index) => (
        <NavLink
          key={tab.id}
          to={`/events/${eventId}/${tab.id}`}
          className={({ isActive }) =>
            `group relative overflow-hidden border px-4 py-2 text-[10px] font-black tracking-[0.22em] uppercase transition-colors ${
              isActive
                ? 'border-primary/70 bg-primary/15 text-primary'
                : 'border-white/12 bg-black/35 text-white/70 hover:border-primary/40 hover:text-white'
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
                  className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/25 to-primary/10"
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
