import { motion as Motion } from 'framer-motion';

const SponsorShowcaseSection = () => {
  const sponsorImageUrl = '/sponsor.png';

  return (
    <section className="relative overflow-hidden bg-black px-6 py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,0,0,0.14),transparent_55%),radial-gradient(circle_at_80%_85%,rgba(255,0,0,0.1),transparent_50%)]" />

      <div className="relative mx-auto max-w-7xl">
        <Motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 text-center"
        >
          <p className="text-[11px] font-black tracking-[0.34em] text-primary/85 uppercase">Official Sponsor</p>
          <h2 className="mt-4 font-display text-4xl font-black uppercase text-white sm:text-5xl lg:text-6xl">
            Proudly Presented <span className="text-primary">By</span>
          </h2>
        </Motion.div>

        <Motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          className="border-y border-primary/40 bg-[linear-gradient(95deg,rgba(255,0,0,0.12),rgba(0,0,0,0.2)_55%,rgba(255,0,0,0.1))] px-4 py-8 sm:px-8 sm:py-10"
        >
          <img
            src={sponsorImageUrl}
            alt="Event sponsor"
            className="mx-auto h-24 w-full max-w-5xl object-contain sm:h-32 lg:h-40"
            onError={(event) => {
              event.currentTarget.src = '/sponsor.png';
            }}
          />
        </Motion.div>
      </div>
    </section>
  );
};

export default SponsorShowcaseSection;