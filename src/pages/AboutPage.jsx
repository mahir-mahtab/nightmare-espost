import { Target, Zap, Users, ChevronRight } from 'lucide-react';
import PageShell from '../components/layout/PageShell.jsx';
import { CyberCard } from '../components/ui/index.jsx';
import { ORG_INFO } from '../data/constants.js';

const AboutPage = () => (
  <PageShell
    title="About"
    subtitle={`Professional esports organization based in ${ORG_INFO.location}. ${ORG_INFO.partnerships}.`}
    accent="Who We Are"
  >
    <section className="px-6 pb-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-3">
          <CyberCard accent>
            <div className="p-8">
              <Target className="mb-4 h-8 w-8 text-primary" />
              <h3 className="font-display text-xl font-black uppercase">Our Focus</h3>
              <p className="mt-4 text-sm leading-relaxed text-white/60">
                Currently focused on <span className="text-primary">{ORG_INFO.focus}</span> with {ORG_INFO.expansion}.
              </p>
            </div>
          </CyberCard>

          <CyberCard>
            <div className="p-8">
              <Zap className="mb-4 h-8 w-8 text-primary" />
              <h3 className="font-display text-xl font-black uppercase">Services</h3>
              <ul className="mt-4 space-y-2">
                {ORG_INFO.services.map((service) => (
                  <li key={service} className="flex items-center gap-2 text-sm text-white/60">
                    <ChevronRight className="h-3 w-3 text-primary" />
                    {service}
                  </li>
                ))}
              </ul>
            </div>
          </CyberCard>

          <CyberCard>
            <div className="p-8">
              <Users className="mb-4 h-8 w-8 text-primary" />
              <h3 className="font-display text-xl font-black uppercase">Partnerships</h3>
              <p className="mt-4 text-sm leading-relaxed text-white/60">
                {ORG_INFO.partnerships}. Contact us for sponsorship opportunities and collaborations.
              </p>
            </div>
          </CyberCard>
        </div>
      </div>
    </section>
  </PageShell>
);

export default AboutPage;
