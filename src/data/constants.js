import { Facebook, Youtube, Globe, MessageCircle } from 'lucide-react';

export const NAV_LINKS = [
  { name: 'HOME', path: '/' },
  { name: 'ABOUT', path: '/about' },
  { name: 'TEAMS', path: '/teams' },
  { name: 'ACHIEVEMENTS', path: '/achievements' },
  { name: 'EVENTS', path: '/events' },
];

export const TOURNAMENT_DATA = {
  name: 'NMxERD T1 Elite League',
  season: 'Season 3',
  slots: 36,
  registrations: 50,
  registrationDate: 'June 2nd',
  avgLobbySize: '64-74 players',
  partners: ['Krafton', 'Tencent Games', 'Lightspeed & Quantum', 'United Nations Community'],
};

export const ACHIEVEMENTS_DATA = [
  {
    rank: '1ST RUNNERS UP',
    placement: '2nd Place',
    team: 'Quadratic Esports',
    tag: 'Q4',
    event: 'NMxERD T1 Elite League',
    date: '17/06/2025',
    color: 'silver',
    image: '/achivement/quadratic-1strunner.png',
  },
  {
    rank: '2ND RUNNERS UP',
    placement: '3rd Place',
    team: 'Before the Storm',
    tag: 'B4S',
    event: 'NMxERD T1 Elite League',
    date: '17/06/2025',
    color: 'bronze',
    image: '/achivement/b4s-2nd-runner.png',
  },
  {
    rank: '3RD RUNNERS UP',
    placement: '4th Place',
    team: 'RIP Esports',
    tag: 'RIP',
    event: 'NMxERD T1 Elite League',
    date: '17/06/2025',
    color: 'copper',
    image: '/achivement/rip-3rd.png',
  },
  {
    rank: '4TH RUNNERS UP',
    placement: '5th Place',
    team: 'Badrage Esports',
    tag: 'BRG',
    event: 'NMxERD T1 Elite League',
    date: '17/06/2025',
    color: 'steel',
    image: '/achivement/badrage_4th.png',
  },
];

export const TEAMS_DATA = [
  { name: 'Nightmare Esports', role: '1st Line-up', status: 'Active', game: 'PUBG Mobile' },
  { name: 'Nightmare Official', role: '2nd Line-up', status: 'Active', game: 'PUBG Mobile' },
];

export const INVITED_TEAMS = [
  'DS Demolition Crew',
  'ERD Raven Claw',
  'Badrage Esports',
  'Nightmare Official',
  'ERD Zeroday',
  'T4esOutrage',
  'SF71 Esports',
];

export const PRIZE_STRUCTURE = [
  { rank: 'Top 2', rewards: 'Slot in 2K Tournament Semi-Finals + Season 4 Finals' },
  { rank: 'Top 3', rewards: 'Slot in 2K Qualifier Finals' },
  { rank: 'Top 5', rewards: 'Certificates, Banners + Season 4 Quarter Finals' },
];

export const ORG_INFO = {
  location: 'Bangladesh',
  focus: 'PUBG Mobile',
  services: ['Tournament Operations', 'Team Management', 'Talent Development'],
  expansion: 'Multiple game titles planned',
  partnerships: 'Open for sponsorships and strategic partnerships',
};

export const CONTENT_CREATORS = [
  { name: 'Krull Gaming', image: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400&h=400&fit=crop', role: 'Streamer' },
  { name: 'Don Bhai', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop', role: 'Content Creator' },
  { name: 'Azim Gaming', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop', role: 'Pro Player' },
  { name: 'Gaming With Talha', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop', role: 'Entertainer' },
  { name: 'Mr Triple R', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop', role: 'Analyst' },
  { name: 'Storm Player', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop', role: 'Coach' },
];

export const SOCIAL_LINKS = [
  { name: 'Facebook', icon: Facebook, url: '#', color: 'hover:border-blue-500 hover:text-blue-500 hover:shadow-blue-500/20' },
  { name: 'YouTube', icon: Youtube, url: '#', color: 'hover:border-red-500 hover:text-red-500 hover:shadow-red-500/20' },
  { name: 'Discord', icon: MessageCircle, url: '#', color: 'hover:border-indigo-500 hover:text-indigo-500 hover:shadow-indigo-500/20' },
  { name: 'Website', icon: Globe, url: '#', color: 'hover:border-primary hover:text-primary hover:shadow-primary/20' },
];
