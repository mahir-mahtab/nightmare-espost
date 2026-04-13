import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import TeamsPage from './pages/TeamsPage.jsx';
import AchievementsPage from './pages/AchievementsPage.jsx';
import EventsPage from './pages/EventsPage.jsx';
import EventsHubPage from './pages/EventsHubPage.jsx';
import EventLoginPage from './pages/EventLoginPage.jsx';
import EventSignupPage from './pages/EventSignupPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import ProtectedEventRoute from './components/routing/ProtectedEventRoute.jsx';
import ProtectedAdminRoute from './components/routing/ProtectedAdminRoute.jsx';

function App() {
  return (
    <div className="min-h-screen bg-black selection:bg-primary selection:text-black">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/achievements" element={<AchievementsPage />} />
        <Route path="/events" element={<EventsHubPage />} />
        <Route path="/events/login/:eventId" element={<EventLoginPage />} />
        <Route path="/signup/:eventId/:type" element={<EventSignupPage />} />
        <Route path="/events/:eventId" element={<Navigate to="auction" replace />} />
        <Route
          path="/events/:eventId/:tab"
          element={(
            <ProtectedEventRoute>
              <EventsPage />
            </ProtectedEventRoute>
          )}
        />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          }
        />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </div>
  );
}

export default App;
