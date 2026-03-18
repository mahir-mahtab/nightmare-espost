import { Routes, Route } from 'react-router-dom';
import LandingPage, { TeamsView, AchievementsView, EventsView, AboutView } from './pages/LandingPage';

function App() {
  return (
    <div className="min-h-screen bg-black selection:bg-primary selection:text-black">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/teams" element={<TeamsView />} />
        <Route path="/achievements" element={<AchievementsView />} />
        <Route path="/events" element={<EventsView />} />
        <Route path="/about" element={<AboutView />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </div>
  );
}

export default App;