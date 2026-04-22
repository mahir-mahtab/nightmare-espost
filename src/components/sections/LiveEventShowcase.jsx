import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { Zap, Users, Trophy, Clock, ArrowRight } from 'lucide-react';
import { liveEventService } from '../../data/liveEventService.js';

const LiveEventShowcase = () => {
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      setIsLoading(true);
      const liveEvent = await liveEventService.getLatestLiveEvent();
      setEvent(liveEvent);
      setIsLoading(false);
    };

    fetchEvent();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6, delay: 0.2 },
    },
  };

  const pulseVariants = {
    pulse: {
      boxShadow: [
        '0 0 0 0 rgba(255, 0, 0, 0.7)',
        '0 0 0 20px rgba(255, 0, 0, 0)',
      ],
      transition: { duration: 1.5, repeat: Infinity },
    },
  };

  if (isLoading) {
    return (
      <div className="relative space-y-6">
        {/* Skeleton Loading State */}
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-24 rounded bg-white/10" />
          <div className="h-10 w-3/4 rounded bg-white/10" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 rounded bg-white/10" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="relative space-y-6 rounded border border-white/10 bg-white/5 p-6 text-center">
        <p className="text-sm text-white/50">No events available at the moment</p>
      </div>
    );
  }

  const liveStatus = event.status === 'LIVE' ? 'Live Now' : event.status;

  const eventData = {
    title: event.title,
    season: event.season,
    game: event.game,
    mode: event.mode,
    registrationCount: event.registrationCount,
    maxSlots: event.maxSlots,
    streamStartTime: event.streamStartTime,
  };

  return (
    <Motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative"
    >
      {/* Glitch Background Effect */}
      <div className="absolute -inset-6 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 blur-2xl" />
      
      {/* Main Container */}
      <div className="relative space-y-6">
        {/* Live Indicator */}
        <div className="flex items-center gap-3">
          <Motion.div
            variants={pulseVariants}
            animate="pulse"
            className="relative inline-block"
          >
            <div className="h-3 w-3 rounded-full bg-primary" />
          </Motion.div>
          <span className="font-display text-xs font-black tracking-[0.25em] text-primary uppercase">
            {liveStatus}
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-primary/50 to-transparent" />
        </div>

        {/* Event Title */}
        <div className="space-y-2 border-l-2 border-primary pl-4">
          <h2 className="font-display text-2xl font-black uppercase leading-tight text-white lg:text-3xl">
            {eventData.title}
          </h2>
          <p className="text-xs font-bold tracking-[0.1em] text-white/60 uppercase">
            {eventData.season} • {eventData.game}
          </p>
        </div>

        {/* Event Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Registration */}
          <Motion.div
            whileHover={{ y: -4 }}
            className="group relative border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 backdrop-blur transition-all hover:border-primary/50 hover:bg-primary/5"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="font-display text-2xl font-black text-primary">
                  {eventData.registrationCount}
                </div>
                <div className="mt-1 text-[9px] font-bold tracking-[0.1em] text-white/50 uppercase">
                  Registrations
                </div>
              </div>
              <Users className="h-4 w-4 opacity-30 transition-opacity group-hover:opacity-60" />
            </div>
            <div className="absolute inset-0 border border-primary/0 transition-all group-hover:border-primary/30" />
          </Motion.div>

          {/* Slots */}
          <Motion.div
            whileHover={{ y: -4 }}
            className="group relative border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 backdrop-blur transition-all hover:border-primary/50 hover:bg-primary/5"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="font-display text-2xl font-black text-primary">
                  {eventData.maxSlots}
                </div>
                <div className="mt-1 text-[9px] font-bold tracking-[0.1em] text-white/50 uppercase">
                  Slots
                </div>
              </div>
              <Trophy className="h-4 w-4 opacity-30 transition-opacity group-hover:opacity-60" />
            </div>
            <div className="absolute inset-0 border border-primary/0 transition-all group-hover:border-primary/30" />
          </Motion.div>

          {/* Game Mode */}
          <Motion.div
            whileHover={{ y: -4 }}
            className="group relative border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 backdrop-blur transition-all hover:border-primary/50 hover:bg-primary/5"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="font-display text-sm font-black uppercase text-primary">
                  {eventData.mode}
                </div>
                <div className="mt-1 text-[9px] font-bold tracking-[0.1em] text-white/50 uppercase">
                  Mode
                </div>
              </div>
              <Zap className="h-4 w-4 opacity-30 transition-opacity group-hover:opacity-60" />
            </div>
            <div className="absolute inset-0 border border-primary/0 transition-all group-hover:border-primary/30" />
          </Motion.div>

          {/* Stream Start */}
          <Motion.div
            whileHover={{ y: -4 }}
            className="group relative border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 backdrop-blur transition-all hover:border-primary/50 hover:bg-primary/5"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="font-display text-sm font-black uppercase text-primary">
                  {eventData.streamStartTime}
                </div>
                <div className="mt-1 text-[9px] font-bold tracking-[0.1em] text-white/50 uppercase">
                  Stream
                </div>
              </div>
              <Clock className="h-4 w-4 opacity-30 transition-opacity group-hover:opacity-60" />
            </div>
            <div className="absolute inset-0 border border-primary/0 transition-all group-hover:border-primary/30" />
          </Motion.div>
        </div>

        {/* Animated Bottom Border */}
        <div className="relative h-1 overflow-hidden bg-gradient-to-r from-primary/20 via-primary to-primary/20">
          <Motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="h-full w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent"
          />
        </div>

        {/* Event Status Info */}
        <Motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="relative border-l-2 border-primary/30 pl-3 text-[11px] text-white/70"
        >
          <span className="font-bold text-primary">Event Status:</span> {liveStatus}
        </Motion.div>

        {/* Enter Event Button */}
        <Motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Link
            to={`/events/${event.slug || event.id}/login`}
            className="group relative inline-flex w-full items-center justify-center gap-2 border border-primary bg-primary/10 px-6 py-3 text-[10px] font-black tracking-[0.2em] text-primary uppercase transition-all hover:border-primary hover:bg-primary hover:text-black"
          >
            Enter Event
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Motion.div>
      </div>

      {/* Top-Right Accent */}
      <div className="absolute -right-4 -top-4 h-16 w-16 border-r-2 border-t-2 border-primary/30" />
      
      {/* Bottom-Left Accent */}
      <div className="absolute -bottom-4 -left-4 h-12 w-12 border-l-2 border-b-2 border-primary/30" />
    </Motion.div>
  );
};

export default LiveEventShowcase;
