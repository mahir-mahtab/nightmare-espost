import { Navigate, useParams } from 'react-router-dom';
import { eventAuthService } from '../../data/eventAuthService.js';

const ProtectedEventRoute = ({ children }) => {
  const { eventId } = useParams();

  if (!eventId) {
    return <Navigate to="/events" replace />;
  }

  if (!eventAuthService.isAuthenticated(eventId)) {
    return <Navigate to={`/events/login/${eventId}`} replace />;
  }

  return children;
};

export default ProtectedEventRoute;
