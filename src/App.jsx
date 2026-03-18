import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import TeamsPage from './pages/TeamsPage.jsx';
import AchievementsPage from './pages/AchievementsPage.jsx';
import EventsPage from './pages/EventsPage.jsx';
import AboutPage from './pages/AboutPage.jsx';

function App() {
  return (
    <div className="min-h-screen bg-black selection:bg-primary selection:text-black">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/achievements" element={<AchievementsPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </div>
  );
}

export default App;
