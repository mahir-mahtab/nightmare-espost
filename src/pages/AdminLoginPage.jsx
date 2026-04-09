import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import PageShell from '../components/layout/PageShell.jsx';
import { CyberCard } from '../components/ui/index.jsx';
import { config } from '../config.js';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${config.apiUrl}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store admin token
      localStorage.setItem('admin-token', data.data.token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell accent="Admin Access" showNavbar={false}>
      <section className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <CyberCard className="p-8">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center border-2 border-primary bg-primary/10">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <h1 className="font-display text-3xl font-black uppercase text-white">
                Admin Login
              </h1>
              <p className="mt-2 text-sm text-white/60">
                Enter admin password to access dashboard
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="password" className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/70">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                  className="h-12 w-full border border-white/30 bg-black/50 px-4 text-white outline-none transition-colors focus:border-primary rounded"
                />
              </div>

              {error && (
                <Motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                >
                  {error}
                </Motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full border border-primary bg-primary text-sm font-bold uppercase tracking-wider text-black transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 rounded"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </CyberCard>
        </Motion.div>
      </section>
    </PageShell>
  );
};

export default AdminLoginPage;
