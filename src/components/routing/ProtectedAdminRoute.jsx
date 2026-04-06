import { Navigate } from 'react-router-dom';
import apiService from '../../services/api.js';

const ProtectedAdminRoute = ({ children }) => {
  const isAuthenticated = apiService.isAdminAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default ProtectedAdminRoute;
