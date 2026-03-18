import { useEffect, useState, useRef } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import { CONTENT_CREATORS } from '../../data/constants.js';

const ContentCreatorsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const containerRef = useRef(null);
  
  const visibleCount = 5;
  const maxIndex = Math.max(0, CONTENT_CREATORS.length - visibleCount);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 3000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, maxIndex]);

  const handlePrev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  return (
    <section className="relative overflow-hidden bg-black px-6 py-24">
      {/* Background Elements */}
      <div className="absolute top-8 left-8 h-3 w-3 rounded-full bg-primary animate-pulse" />
      <div className="absolute top-1/4 right-[15%] h-32 w-32 border border-primary/10 rotate-45" />
      <div className="absolute bottom-1/4 left-[10%] h-24 w-24 border border-white/5 rotate-12" />
      
      <div className="relative mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <Motion.span 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block text-[11px] font-bold tracking-[0.4em] text-primary uppercase"
          >
            Our Top Content Creators
          </Motion.span>
          <Motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-4 font-display text-4xl font-black uppercase sm:text-5xl lg:text-6xl"
          >
            Top Rated <span className="text-primary">Content Creators</span>
          </Motion.h2>
          {/* Decorative line */}
          <div className="mx-auto mt-6 flex items-center justify-center gap-2">
            <span className="h-3 w-3 rounded-full bg-primary" />
            <span className="h-1 w-16 bg-primary" />
          </div>
        </div>

        {/* Creators Carousel */}
        <div className="relative">
          <div 
            ref={containerRef}
            className="overflow-hidden"
          >
            <Motion.div 
              className="flex gap-6"
              animate={{ x: `-${currentIndex * (100 / visibleCount + 2)}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {CONTENT_CREATORS.map((creator, index) => (
                <Motion.div
                  key={creator.name}
                  className="group relative min-w-[calc(20%-1rem)] flex-shrink-0"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  {/* Card */}
                  <div className="relative overflow-hidden rounded-2xl border-2 border-white/10 bg-zinc-900/50 transition-all duration-500 group-hover:border-primary/50 group-hover:shadow-[0_0_40px_-10px_rgba(255,0,0,0.3)]">
                    {/* Corner Accents */}
                    <div className="absolute top-0 left-0 h-6 w-6 border-t-2 border-l-2 border-primary/50 rounded-tl-2xl transition-all group-hover:h-10 group-hover:w-10 group-hover:border-primary" />
                    <div className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-primary/50 rounded-br-2xl transition-all group-hover:h-10 group-hover:w-10 group-hover:border-primary" />
                    
                    {/* Image Container */}
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={creator.image}
                        alt={creator.name}
                        className="h-full w-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
                      />
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
                      
                      {/* Role Badge */}
                      <div className="absolute top-4 right-4 opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/90 px-3 py-1 text-[10px] font-bold uppercase text-black">
                          {creator.role}
                        </span>
                      </div>
                      
                      {/* Name */}
                      <div className="absolute bottom-0 left-0 right-0 p-5">
                        <h3 className="text-center font-display text-lg font-black uppercase tracking-wide transition-colors group-hover:text-primary">
                          {creator.name}
                        </h3>
                      </div>
                    </div>
                    
                    {/* Bottom Accent Line */}
                    <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent transition-all group-hover:via-primary" />
                  </div>
                </Motion.div>
              ))}
            </Motion.div>
          </div>

          {/* Navigation Controls */}
          <div className="mt-10 flex items-center justify-center gap-6">
            <button
              onClick={handlePrev}
              className="flex h-10 w-10 items-center justify-center border border-white/20 text-white/60 transition-all hover:border-primary hover:bg-primary/10 hover:text-primary"
              aria-label="Previous creator"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Dots */}
            <div className="flex items-center gap-2">
              {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setCurrentIndex(i);
                  }}
                  className={`h-2 rounded-full transition-all ${
                    i === currentIndex 
                      ? 'w-6 bg-primary' 
                      : 'w-2 bg-white/30 hover:bg-white/50'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="flex h-10 w-10 items-center justify-center border border-white/20 text-white/60 transition-all hover:border-primary hover:bg-primary/10 hover:text-primary"
              aria-label="Next creator"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContentCreatorsSection;
