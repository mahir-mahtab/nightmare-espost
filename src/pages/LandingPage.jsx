import { Navbar, Footer, FeaturedEventBanner } from '../components/layout/index.jsx';
import {
  HeroSection,
  StatsSection,
  AchievementsSection,
  EventSpotlightSection,
  TeamsSection,
  ContentCreatorsSection,
  StayConnectedSection,
} from '../components/sections/index.jsx';

const LandingPage = () => (
  <div className="min-h-screen bg-black text-white">
    <Navbar />
    <main className="pt-24">
      <HeroSection />
      <StatsSection />
      <AchievementsSection />
      <EventSpotlightSection />
      <TeamsSection />
      <ContentCreatorsSection />
      <StayConnectedSection />
    </main>
    <Footer />
  </div>
);

export default LandingPage;
