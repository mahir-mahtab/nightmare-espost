import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import { AchievementCard } from '../ui/index.jsx';
import { ACHIEVEMENTS_DATA } from '../../data/constants.js';

const AchievementsSection = () => (
  <section className="bg-zinc-950 px-6 py-20">
    <div className="mx-auto max-w-7xl">
      <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-[10px] font-bold tracking-[0.4em] text-primary/80 uppercase">Recognition</span>
          <h2 className="mt-2 font-display text-4xl font-black uppercase sm:text-5xl">
            Achieve<span className="text-primary">ments</span>
          </h2>
        </div>
        <Link
          to="/achievements"
          className="group inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-white/60 uppercase transition-colors hover:text-primary"
        >
          Full Records
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {ACHIEVEMENTS_DATA.map((achievement, i) => (
          <Motion.div
            key={achievement.team}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            viewport={{ once: true }}
          >
            <AchievementCard {...achievement} />
          </Motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default AchievementsSection;
