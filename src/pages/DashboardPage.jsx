import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Trophy, LogOut, Plus, Menu, X } from 'lucide-react';
import apiService from '../services/api.js';
import EventList from '../components/sections/dashboard/EventList.jsx';
import EventForm from '../components/sections/dashboard/EventForm.jsx';
import AuctionManager from '../components/sections/dashboard/AuctionManager.jsx';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('events');
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [stats, setStats] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const adminUser = apiService.getAdminUser();

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const data = await apiService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleLogout = () => {
    apiService.adminLogout();
    navigate('/admin/login');
  };

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setShowEventForm(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setShowEventForm(true);
  };

  const handleFormClose = () => {
    setShowEventForm(false);
    setEditingEvent(null);
  };

  const handleManageAuction = (event) => {
    setSelectedEvent(event);
    setActiveTab('auction');
  };

  const tabs = [
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'auction', label: 'Auction Manager', icon: Trophy, disabled: !selectedEvent },
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-black/50 border-b-2 border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary flex items-center justify-center">
                <Trophy className="w-6 h-6 text-black" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white">ADMIN DASHBOARD</h1>
                <p className="text-xs text-white/60">Event Management</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              {adminUser && (
                <div className="text-right mr-4">
                  <p className="text-sm font-bold text-white">{adminUser.name || adminUser.username}</p>
                  <p className="text-xs text-white/60">{adminUser.role || 'Administrator'}</p>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>LOGOUT</span>
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t-2 border-white/10">
              {adminUser && (
                <div className="px-2 py-3 mb-3">
                  <p className="text-sm font-bold text-white">{adminUser.name || adminUser.username}</p>
                  <p className="text-xs text-white/60">{adminUser.role || 'Administrator'}</p>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-2 py-3 text-white hover:bg-white/10"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-bold">LOGOUT</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Stats Bar */}
      {stats && (
        <div className="bg-black/30 border-b-2 border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-black text-primary">{stats.totalEvents || 0}</p>
                <p className="text-xs text-white/60 font-bold">TOTAL EVENTS</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-primary">{stats.activeEvents || 0}</p>
                <p className="text-xs text-white/60 font-bold">ACTIVE EVENTS</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-primary">{stats.totalPlayers || 0}</p>
                <p className="text-xs text-white/60 font-bold">TOTAL PLAYERS</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-primary">{stats.totalTeams || 0}</p>
                <p className="text-xs text-white/60 font-bold">TOTAL TEAMS</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b-2 border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => !tab.disabled && setActiveTab(tab.id)}
                  disabled={tab.disabled}
                  className={`flex items-center gap-2 px-6 py-4 font-bold transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-primary text-black'
                      : tab.disabled
                      ? 'text-white/30 cursor-not-allowed'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'events' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-white">EVENT MANAGEMENT</h2>
              <button
                onClick={handleCreateEvent}
                className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-black font-bold transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>CREATE EVENT</span>
              </button>
            </div>

            {showEventForm ? (
              <EventForm
                event={editingEvent}
                onClose={handleFormClose}
                onSuccess={() => {
                  handleFormClose();
                  loadDashboardStats();
                }}
              />
            ) : (
              <EventList
                onEdit={handleEditEvent}
                onManageAuction={handleManageAuction}
                onUpdate={loadDashboardStats}
              />
            )}
          </div>
        )}

        {activeTab === 'auction' && selectedEvent && (
          <div>
            <div className="mb-6">
              <button
                onClick={() => {
                  setActiveTab('events');
                  setSelectedEvent(null);
                }}
                className="text-primary hover:text-primary/80 font-bold mb-2"
              >
                ← BACK TO EVENTS
              </button>
              <h2 className="text-2xl font-black text-white">
                AUCTION MANAGER - {selectedEvent.name}
              </h2>
              <p className="text-white/60">{selectedEvent.description}</p>
            </div>

            <AuctionManager event={selectedEvent} />
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
