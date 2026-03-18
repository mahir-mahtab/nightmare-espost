import { motion as Motion } from 'framer-motion';
import PageShell from '../components/layout/PageShell.jsx';
import { CyberCard, AchievementCard, PrizeRow } from '../components/ui/index.jsx';
import { ACHIEVEMENTS_DATA, PRIZE_STRUCTURE } from '../data/constants.js';

const AchievementsPage = () => (
  <PageShell
    title="Achievements"
    subtitle="Tournament recognition and podium records from the NMxERD T1 Elite League and competitive events."
    accent="Hall of Fame"
  >
    <section className="px-6 pb-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ACHIEVEMENTS_DATA.map((achievement, i) => (
            <Motion.div
              key={achievement.team}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <AchievementCard {...achievement} />
            </Motion.div>
          ))}
        </div>

        {/* <div className="mt-16">
          <h2 className="mb-8 font-display text-2xl font-black uppercase">
            Prize <span className="text-primary">Structure</span>
          </h2>
          <CyberCard>
            <div className="p-8">
              {PRIZE_STRUCTURE.map((prize, i) => (
                <PrizeRow key={prize.rank} {...prize} index={i} />
              ))}
            </div>
          </CyberCard>
        </div> */}
      </div>
    </section>
  </PageShell>
);

export default AchievementsPage;
