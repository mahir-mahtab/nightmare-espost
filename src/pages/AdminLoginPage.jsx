import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, AlertCircle } from 'lucide-react';
import apiService from '../services/api.js';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // DEVELOPMENT MODE: Bypass API and use mock credentials
      // Remove this block when backend is ready
      if (import.meta.env.DEV) {
        if (formData.username === 'admin' && formData.password === 'admin123') {
          // Mock successful login
          localStorage.setItem('adminToken', 'dev-token-' + Date.now());
          localStorage.setItem('adminUser', JSON.stringify({
            _id: 'dev-admin-id',
            username: 'admin',
            name: 'Development Admin',
            role: 'Administrator'
          }));
          navigate('/dashboard');
          return;
        } else {
          throw new Error('Invalid credentials. Use admin/admin123 for development.');
        }
      }

      // Production mode: Use actual API
      await apiService.adminLogin(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-lg mb-4">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-black text-white mb-2">
            ADMIN LOGIN
          </h1>
          <p className="text-white/60">
            Access the event management dashboard
          </p>
        </div>

        {/* Login Form */}
        <div className="brutal-border bg-black/50 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-bold text-white/90 mb-2">
                USERNAME
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-white/40" />
                </div>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-black/50 border-2 border-white/10 text-white placeholder-white/40 focus:border-primary focus:outline-none transition-colors"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-white/90 mb-2">
                PASSWORD
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-white/40" />
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-black/50 border-2 border-white/10 text-white placeholder-white/40 focus:border-primary focus:outline-none transition-colors"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border-2 border-red-500/50 p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-black font-black py-4 px-6 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
            >
              {loading ? 'LOGGING IN...' : 'LOGIN'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-white/40 text-sm">
            Authorized personnel only
          </p>
          {import.meta.env.DEV && (
            <div className="mt-4 p-3 bg-primary/10 border border-primary/30">
              <p className="text-primary text-xs font-bold">
                DEV MODE: Use admin / admin123
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
