// apps/web/components/docs/GuidanceSection.tsx
'use client';

import { useState, useEffect, useRef } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

interface GuidanceSectionType {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  glow: string;
}

const SECTIONS: GuidanceSectionType[] = [
  {
    id: 'fundamentals',
    title: 'Shooting Fundamentals',
    subtitle: 'Master the core principles',
    icon: <TargetSvg />,
    color: '#F5A623',
    glow: 'rgba(245,166,35,0.25)',
  },
  {
    id: 'stance',
    title: 'Stance & Posture',
    subtitle: 'Build a stable foundation',
    icon: <StanceSvg />,
    color: '#4FC3F7',
    glow: 'rgba(79,195,247,0.25)',
  },
  {
    id: 'breathing',
    title: 'Breathing Control',
    subtitle: 'Steady your aim naturally',
    icon: <BreathSvg />,
    color: '#00E5A0',
    glow: 'rgba(0,229,160,0.25)',
  },
  {
    id: 'trigger',
    title: 'Trigger Discipline',
    subtitle: 'Clean, consistent release',
    icon: <TriggerSvg />,
    color: '#FF4D6D',
    glow: 'rgba(255,77,109,0.25)',
  },
  {
    id: 'mental',
    title: 'Mental Preparation',
    subtitle: 'Focus and competition mindset',
    icon: <MindSvg />,
    color: '#A78BFA',
    glow: 'rgba(167,139,250,0.25)',
  },
  {
    id: 'safety',
    title: 'Range Safety',
    subtitle: 'Essential safety protocols',
    icon: <ShieldSvg />,
    color: '#F59E0B',
    glow: 'rgba(245,158,11,0.25)',
  },
];

// ── Main Page ────────────────────────────────────────────────────────────────

export default function GuidanceSection() {
  const [activeSection, setActiveSection] = useState('fundamentals');
  const [visibleCards, setVisibleCards] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleCards((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' },
    );

    const cards = document.querySelectorAll('[data-reveal]');
    cards.forEach((card) => observerRef.current?.observe(card));

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="relative mb-10 overflow-hidden rounded-2xl" style={{ minHeight: 280 }}>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'url(https://images.pexels.com/photos/6669403/pexels-photo-6669403.jpeg?auto=compress&cs=tinysrgb&w=1400&h=700&dpr=1)',
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%',
            filter: 'brightness(0.3) saturate(0.8)',
          }}
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, var(--bg-void) 0%, var(--glass-bg) 50%, var(--bg-void) 100%)',
          }}
        />
        {/* Amber accent line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(245,166,35,0.6) 30%, rgba(79,195,247,0.4) 70%, transparent 100%)',
          }}
        />

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-16 sm:py-20">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
            style={{
              background: 'rgba(245,166,35,0.1)',
              border: '1px solid rgba(245,166,35,0.25)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#F5A623', boxShadow: '0 0 6px rgba(245,166,35,0.8)' }} />
            <span className="text-[11px] font-display font-bold uppercase tracking-[0.15em]" style={{ color: '#F5A623' }}>
              Training Guide
            </span>
          </div>

          <h1
            className="font-display font-black text-3xl sm:text-5xl tracking-tight leading-[1.1] mb-4"
            style={{
              background: 'linear-gradient(135deg, var(--text-primary) 0%, #F5A623 50%, var(--text-primary) 100%)',
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'shimmer 6s linear infinite',
            }}
          >
            Precision Shooting Guidance
          </h1>
          <p className="text-text-secondary text-sm sm:text-base max-w-xl leading-relaxed">
            Comprehensive training resources to elevate your marksmanship.
            Master fundamentals, refine technique, and build mental resilience.
          </p>
        </div>
      </section>

      {/* Section Navigation Pills */}
      <nav className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setActiveSection(s.id);
              document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl shrink-0 transition-all duration-250"
            style={{
              background: activeSection === s.id
                ? `linear-gradient(135deg, ${s.color}18, ${s.color}08)`
                : 'rgba(255,255,255,0.03)',
              border: activeSection === s.id
                ? `1px solid ${s.color}40`
                : '1px solid rgba(255,255,255,0.05)',
              color: activeSection === s.id ? s.color : 'var(--text-secondary)',
              boxShadow: activeSection === s.id ? `0 0 16px ${s.glow}` : 'none',
            }}
          >
            <span className="w-4 h-4">{s.icon}</span>
            <span className="font-display font-bold text-[12px] tracking-wide uppercase whitespace-nowrap">
              {s.title}
            </span>
          </button>
        ))}
      </nav>

      {/* ═══ SECTION 1: Shooting Fundamentals ═══ */}
      <SectionHeader id="fundamentals" section={SECTIONS[0]} visible={visibleCards.has('fundamentals')} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Sight Alignment Card */}
        <div
          id="card-sight"
          data-reveal
          className="card p-0 overflow-hidden transition-all duration-700"
          style={{
            opacity: visibleCards.has('card-sight') ? 1 : 0,
            transform: visibleCards.has('card-sight') ? 'translateY(0)' : 'translateY(24px)',
          }}
        >
          <div className="relative h-52 sm:h-64 overflow-hidden">
            <img
              src="https://images.pexels.com/photos/6091858/pexels-photo-6091858.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&dpr=1"
              alt="Shooter aiming pistol at indoor range"
              className="w-full h-full object-cover"
              style={{ filter: 'brightness(0.6) saturate(0.9)' }}
              loading="lazy"
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(0deg, var(--bg-surface) 0%, transparent 60%)' }}
            />
            <div className="absolute bottom-4 left-5 right-5">
              <span className="tag">Fundamental</span>
              <h3 className="font-display font-bold text-lg text-text-primary mt-2">
                Sight Alignment & Sight Picture
              </h3>
            </div>
          </div>
          <div className="p-5 space-y-3">
            <p className="prose-p">
              Proper sight alignment is the foundation of accurate shooting. The front sight must be
              centered within the rear notch, with equal light visible on both sides. The top of the
              front sight should be level with the top of the rear sight.
            </p>
            <div className="flex gap-3">
              <InfoChip label="Equal Height" color="#F5A623" />
              <InfoChip label="Equal Light" color="#4FC3F7" />
              <InfoChip label="Focus Front Sight" color="#00E5A0" />
            </div>
            <p className="prose-p">
              <strong className="text-text-primary">Sight picture</strong> combines sight alignment with
              target placement. For precision shooting, place the bull directly on top of the front
              sight post (6 o'clock hold) or center the target on the front sight (center hold).
            </p>
          </div>
        </div>

        {/* Natural Point of Aim Card */}
        <div
          id="card-npoa"
          data-reveal
          className="card p-0 overflow-hidden transition-all duration-700"
          style={{
            opacity: visibleCards.has('card-npoa') ? 1 : 0,
            transform: visibleCards.has('card-npoa') ? 'translateY(0)' : 'translateY(24px)',
          }}
        >
          <div className="relative h-52 sm:h-64 overflow-hidden">
            <img
              src="https://images.pexels.com/photos/6090788/pexels-photo-6090788.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&dpr=1"
              alt="Shooter aiming rifle in competition stance"
              className="w-full h-full object-cover"
              style={{ filter: 'brightness(0.55) saturate(0.9)' }}
              loading="lazy"
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(0deg, var(--bg-surface) 0%, transparent 60%)' }}
            />
            <div className="absolute bottom-4 left-5 right-5">
              <span className="tag">Fundamental</span>
              <h3 className="font-display font-bold text-lg text-text-primary mt-2">
                Natural Point of Aim (NPA)
              </h3>
            </div>
          </div>
          <div className="p-5 space-y-3">
            <p className="prose-p">
              Your natural point of aim is where the rifle naturally rests when you are in a relaxed
              shooting position. Close your eyes, take a breath, exhale, and open them — your sights
              should be aligned on target without muscular effort.
            </p>
            <div
              className="rounded-xl p-4"
              style={{ background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.15)' }}
            >
              <p className="text-[12px] font-display font-bold uppercase tracking-wider mb-2" style={{ color: '#F5A623' }}>
                Pro Tip
              </p>
              <p className="prose-p">
                If your NPA is off-target, adjust your entire body position rather than muscling the
                rifle. Small shifts at the feet or hips make a big difference downrange.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fundamentals Video */}
      <div
        id="card-fund-video"
        data-reveal
        className="card p-5 mb-10 transition-all duration-700"
        style={{
          opacity: visibleCards.has('card-fund-video') ? 1 : 0,
          transform: visibleCards.has('card-fund-video') ? 'translateY(0)' : 'translateY(24px)',
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <VideoIcon color="#F5A623" />
          <div>
            <h3 className="font-display font-bold text-text-primary text-base">Marksmanship Fundamentals</h3>
            <p className="text-text-muted text-xs">Understanding the core principles of precision shooting</p>
          </div>
        </div>
        <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
          <iframe
            src="https://www.youtube.com/embed/HSPAxItV0TY"
            title="Marksmanship Fundamentals"
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            style={{ border: 'none' }}
          />
        </div>
      </div>

      {/* ═══ SECTION 2: Stance & Posture ═══ */}
      <SectionHeader id="stance" section={SECTIONS[1]} visible={visibleCards.has('stance')} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <StanceCard
          id="card-standing"
          title="Standing (Offhand)"
          image="https://images.pexels.com/photos/6091660/pexels-photo-6091660.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1"
          visible={visibleCards.has('card-standing')}
          points={[
            'Feet shoulder-width apart, perpendicular to target',
            'Weight balanced slightly forward on balls of feet',
            'Support arm elbow rests directly under the rifle',
            'Body blade angle approximately 45 degrees to target',
          ]}
          difficulty="Advanced"
          diffColor="#FF4D6D"
        />
        <StanceCard
          id="card-kneeling"
          title="Kneeling"
          image="https://images.pexels.com/photos/6090798/pexels-photo-6090798.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1"
          visible={visibleCards.has('card-kneeling')}
          points={[
            'Strong-side knee on the ground with ankle flat',
            'Support-side elbow braced on support-side knee',
            'Sit on the heel of the rear foot for stability',
            'Maintain straight back and forward lean',
          ]}
          difficulty="Intermediate"
          diffColor="#F5A623"
        />
        <StanceCard
          id="card-prone"
          title="Prone"
          image="https://images.pexels.com/photos/6090912/pexels-photo-6090912.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1"
          visible={visibleCards.has('card-prone')}
          points={[
            'Body angled 15-25 degrees from line of fire',
            'Both elbows provide a solid bone support platform',
            'Legs spread naturally with toes pointed outward',
            'Cheek weld consistent and firm on the stock',
          ]}
          difficulty="Foundation"
          diffColor="#00E5A0"
        />
      </div>

      {/* Stance Video */}
      <div
        id="card-stance-video"
        data-reveal
        className="card p-5 mb-10 transition-all duration-700"
        style={{
          opacity: visibleCards.has('card-stance-video') ? 1 : 0,
          transform: visibleCards.has('card-stance-video') ? 'translateY(0)' : 'translateY(24px)',
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <VideoIcon color="#4FC3F7" />
          <div>
            <h3 className="font-display font-bold text-text-primary text-base">Shooting Positions Masterclass</h3>
            <p className="text-text-muted text-xs">Detailed breakdown of standing, kneeling, sitting, and prone</p>
          </div>
        </div>
        <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
          <iframe
            src="https://www.youtube.com/embed/eo_uINlK0KA"
            title="Shooting Positions Masterclass"
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            style={{ border: 'none' }}
          />
        </div>
      </div>

      {/* ═══ SECTION 3: Breathing Control ═══ */}
      <SectionHeader id="breathing" section={SECTIONS[2]} visible={visibleCards.has('breathing')} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-6">
        {/* Breathing Cycle Visual */}
        <div
          id="card-breath-cycle"
          data-reveal
          className="card p-6 lg:col-span-3 transition-all duration-700"
          style={{
            opacity: visibleCards.has('card-breath-cycle') ? 1 : 0,
            transform: visibleCards.has('card-breath-cycle') ? 'translateY(0)' : 'translateY(24px)',
          }}
        >
          <h3 className="font-display font-bold text-text-primary text-base mb-4">The Respiratory Pause</h3>
          <div className="relative overflow-hidden rounded-xl mb-5" style={{ height: 180 }}>
            <img
              src="https://images.pexels.com/photos/5202431/pexels-photo-5202431.jpeg?auto=compress&cs=tinysrgb&w=900&h=500&dpr=1"
              alt="ISSF precision shooting target"
              className="w-full h-full object-cover"
              style={{ filter: 'brightness(0.35) saturate(0.7) hue-rotate(180deg)' }}
              loading="lazy"
            />
            <div className="absolute inset-0" style={{ background: 'var(--glass-bg)' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <BreathingDiagram />
            </div>
          </div>
          <p className="prose-p mb-3">
            The key to steady aim lies in the natural respiratory pause — the brief moment at the bottom
            of your exhale where your body is naturally most still. This window typically lasts 3-5 seconds.
          </p>
          <div className="space-y-2">
            <StepItem n={1} text="Inhale normally and align your sights on target" color="#4FC3F7" />
            <StepItem n={2} text="Exhale naturally — do not force the breath out" color="#00E5A0" />
            <StepItem n={3} text="At the natural pause, refine sight picture" color="#F5A623" />
            <StepItem n={4} text="Squeeze the trigger during this 3-5 second window" color="#FF4D6D" />
            <StepItem n={5} text="If the pause expires, breathe again and restart" color="#A78BFA" />
          </div>
        </div>

        {/* Breathing Tips */}
        <div
          id="card-breath-tips"
          data-reveal
          className="lg:col-span-2 space-y-5 transition-all duration-700"
          style={{
            opacity: visibleCards.has('card-breath-tips') ? 1 : 0,
            transform: visibleCards.has('card-breath-tips') ? 'translateY(0)' : 'translateY(24px)',
          }}
        >
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,229,160,0.1)', color: '#00E5A0' }}>
                <CheckSvg />
              </span>
              <h4 className="font-display font-bold text-sm text-text-primary">Do</h4>
            </div>
            <ul className="space-y-2">
              {[
                'Breathe from your diaphragm, not your chest',
                'Maintain a consistent breathing rhythm',
                'Practice dry-fire with breathing focus',
                'Use the natural pause, never hold your breath forcefully',
              ].map((t) => (
                <li key={t} className="flex gap-2.5 text-text-secondary text-[13px] leading-relaxed">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#00E5A0' }} />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,77,109,0.1)', color: '#FF4D6D' }}>
                <XSvg />
              </span>
              <h4 className="font-display font-bold text-sm text-text-primary">Avoid</h4>
            </div>
            <ul className="space-y-2">
              {[
                'Holding breath for extended periods (causes tremors)',
                'Taking overly deep breaths before shooting',
                'Breaking rhythm under pressure',
                'Shooting during the inhale phase',
              ].map((t) => (
                <li key={t} className="flex gap-2.5 text-text-secondary text-[13px] leading-relaxed">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#FF4D6D' }} />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Breathing Video */}
      <div
        id="card-breath-video"
        data-reveal
        className="card p-5 mb-10 transition-all duration-700"
        style={{
          opacity: visibleCards.has('card-breath-video') ? 1 : 0,
          transform: visibleCards.has('card-breath-video') ? 'translateY(0)' : 'translateY(24px)',
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <VideoIcon color="#00E5A0" />
          <div>
            <h3 className="font-display font-bold text-text-primary text-base">Breathing Technique for Precision Shooters</h3>
            <p className="text-text-muted text-xs">Learn the respiratory pause and timing your shot</p>
          </div>
        </div>
        <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
          <iframe
            src="https://www.youtube.com/embed/GvuWLZx3i64"
            title="Breathing for Shooters"
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            style={{ border: 'none' }}
          />
        </div>
      </div>

      {/* ═══ SECTION 4: Trigger Discipline ═══ */}
      <SectionHeader id="trigger" section={SECTIONS[3]} visible={visibleCards.has('trigger')} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div
          id="card-trigger-control"
          data-reveal
          className="card p-6 transition-all duration-700"
          style={{
            opacity: visibleCards.has('card-trigger-control') ? 1 : 0,
            transform: visibleCards.has('card-trigger-control') ? 'translateY(0)' : 'translateY(24px)',
          }}
        >
          <h3 className="font-display font-bold text-text-primary text-lg mb-4">Trigger Control</h3>
          <div className="relative rounded-xl overflow-hidden mb-5 h-48">
            <img
              src="https://images.pexels.com/photos/5202428/pexels-photo-5202428.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&dpr=1"
              alt="Shooting target with firearm and magazines"
              className="w-full h-full object-cover"
              style={{ filter: 'brightness(0.4) saturate(0.8)' }}
              loading="lazy"
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, var(--bg-surface) 0%, transparent 70%)' }} />
          </div>
          <p className="prose-p mb-4">
            Trigger control is arguably the single most important fundamental. A perfect sight picture
            is worthless if the trigger pull disturbs the rifle's alignment. The goal is a smooth,
            straight-back press that "surprises" you when the shot breaks.
          </p>
          <div className="space-y-3">
            <TriggerStep
              title="Finger Placement"
              desc="Use the pad of your index finger's first segment (between the tip and the first joint). Contact should be centered on the trigger face."
              color="#FF4D6D"
            />
            <TriggerStep
              title="Straight-Back Press"
              desc="Apply pressure directly to the rear. Any sideways force will push the sights off-target. Think of it as a squeeze, not a pull."
              color="#F5A623"
            />
            <TriggerStep
              title="Follow Through"
              desc="Maintain trigger pressure after the shot breaks. Hold the trigger back, observe where the sights settled, then slowly release to the reset point."
              color="#4FC3F7"
            />
          </div>
        </div>

        <div
          id="card-trigger-errors"
          data-reveal
          className="card p-6 transition-all duration-700"
          style={{
            opacity: visibleCards.has('card-trigger-errors') ? 1 : 0,
            transform: visibleCards.has('card-trigger-errors') ? 'translateY(0)' : 'translateY(24px)',
          }}
        >
          <h3 className="font-display font-bold text-text-primary text-lg mb-4">Common Trigger Errors</h3>
          <div className="space-y-4">
            <ErrorCard
              title="Jerking / Slapping"
              desc="Rapidly yanking the trigger instead of a controlled press. This is often caused by anticipating the shot. Dry-fire practice is the best remedy."
              severity="Critical"
              sevColor="#FF4D6D"
            />
            <ErrorCard
              title="Flinching"
              desc="An involuntary physical response to anticipated recoil. The shooter tenses muscles or pushes forward at the moment of firing, causing low-left impacts (right-handed)."
              severity="Critical"
              sevColor="#FF4D6D"
            />
            <ErrorCard
              title="Milking the Grip"
              desc="Sympathetic tightening of the entire hand when pressing the trigger, pulling the muzzle downward. Isolate your trigger finger's movement."
              severity="Moderate"
              sevColor="#F5A623"
            />
            <ErrorCard
              title="Riding the Reset"
              desc="Not letting the trigger travel forward enough for a clean reset between shots. Listen and feel for the distinct 'click' of the trigger reset."
              severity="Minor"
              sevColor="#4FC3F7"
            />
          </div>
        </div>
      </div>

      {/* Trigger Video */}
      <div
        id="card-trigger-video"
        data-reveal
        className="card p-5 mb-10 transition-all duration-700"
        style={{
          opacity: visibleCards.has('card-trigger-video') ? 1 : 0,
          transform: visibleCards.has('card-trigger-video') ? 'translateY(0)' : 'translateY(24px)',
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <VideoIcon color="#FF4D6D" />
          <div>
            <h3 className="font-display font-bold text-text-primary text-base">Mastering Trigger Control</h3>
            <p className="text-text-muted text-xs">Techniques for a clean, consistent trigger press</p>
          </div>
        </div>
        <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
          <iframe
            src="https://www.youtube.com/embed/CmbmIi2VGgg"
            title="Trigger Control Mastery"
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            style={{ border: 'none' }}
          />
        </div>
      </div>

      {/* ═══ SECTION 5: Mental Preparation ═══ */}
      <SectionHeader id="mental" section={SECTIONS[4]} visible={visibleCards.has('mental')} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div
          id="card-mental-main"
          data-reveal
          className="card p-0 overflow-hidden transition-all duration-700"
          style={{
            opacity: visibleCards.has('card-mental-main') ? 1 : 0,
            transform: visibleCards.has('card-mental-main') ? 'translateY(0)' : 'translateY(24px)',
          }}
        >
          <div className="relative h-56 overflow-hidden">
            <img
              src="https://images.pexels.com/photos/6091854/pexels-photo-6091854.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&dpr=1"
              alt="Shooter focusing at indoor range"
              className="w-full h-full object-cover"
              style={{ filter: 'brightness(0.35) saturate(0.8)' }}
              loading="lazy"
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(0deg, var(--bg-surface) 0%, transparent 60%)' }}
            />
            <div className="absolute bottom-4 left-5 right-5">
              <span className="tag" style={{ background: 'rgba(167,139,250,0.1)', borderColor: 'rgba(167,139,250,0.3)', color: '#A78BFA' }}>
                Mental Game
              </span>
              <h3 className="font-display font-bold text-lg text-text-primary mt-2">
                Building a Competition Mindset
              </h3>
            </div>
          </div>
          <div className="p-5 space-y-3">
            <p className="prose-p">
              Elite shooters consistently cite mental preparation as the deciding factor between good
              and great performance. Developing a pre-shot routine, managing match pressure, and
              maintaining focus through long competitions separates champions from participants.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <MentalStat label="Pre-Shot Routine" value="Consistency" icon={<RepeatSvg />} />
              <MentalStat label="Shot Calling" value="Awareness" icon={<EyeSvg />} />
              <MentalStat label="Stress Management" value="Control" icon={<WaveSvg />} />
              <MentalStat label="Visualization" value="Preparation" icon={<ImageSvg />} />
            </div>
          </div>
        </div>

        <div
          id="card-mental-tips"
          data-reveal
          className="space-y-5 transition-all duration-700"
          style={{
            opacity: visibleCards.has('card-mental-tips') ? 1 : 0,
            transform: visibleCards.has('card-mental-tips') ? 'translateY(0)' : 'translateY(24px)',
          }}
        >
          <div className="card p-5">
            <h4 className="font-display font-bold text-sm text-text-primary mb-3">Pre-Shot Routine</h4>
            <p className="prose-p mb-3">
              Develop and repeat the same sequence before every shot. This creates automatic motor
              patterns and reduces cognitive load during competition.
            </p>
            <div className="space-y-2">
              {[
                'Mount the rifle and establish natural point of aim',
                'Verify sight alignment and settle into position',
                'Begin breathing cycle — inhale, exhale, pause',
                'Refine sight picture during respiratory pause',
                'Apply steady trigger pressure through the break',
                'Follow through and call the shot',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span
                    className="mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-[10px] font-display font-black"
                    style={{ background: 'rgba(167,139,250,0.12)', color: '#A78BFA', border: '1px solid rgba(167,139,250,0.2)' }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-text-secondary text-[13px] leading-relaxed">{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h4 className="font-display font-bold text-sm text-text-primary mb-3">Shot Calling</h4>
            <p className="prose-p">
              After each shot, immediately assess where you believe the shot landed based on your
              sight picture at the moment of firing. This builds self-awareness and helps diagnose
              errors without relying solely on the target.
            </p>
          </div>
        </div>
      </div>

      {/* Mental Game Video */}
      <div
        id="card-mental-video"
        data-reveal
        className="card p-5 mb-10 transition-all duration-700"
        style={{
          opacity: visibleCards.has('card-mental-video') ? 1 : 0,
          transform: visibleCards.has('card-mental-video') ? 'translateY(0)' : 'translateY(24px)',
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <VideoIcon color="#A78BFA" />
          <div>
            <h3 className="font-display font-bold text-text-primary text-base">Mental Game in Competitive Shooting</h3>
            <p className="text-text-muted text-xs">Developing focus, confidence, and composure under pressure</p>
          </div>
        </div>
        <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
          <iframe
            src="https://www.youtube.com/embed/sX8nm21Hbwk"
            title="Mental Game Shooting"
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            style={{ border: 'none' }}
          />
        </div>
      </div>

      {/* ═══ SECTION 6: Range Safety ═══ */}
      <SectionHeader id="safety" section={SECTIONS[5]} visible={visibleCards.has('safety')} />

      <div
        id="card-safety-rules"
        data-reveal
        className="card p-6 mb-6 transition-all duration-700"
        style={{
          opacity: visibleCards.has('card-safety-rules') ? 1 : 0,
          transform: visibleCards.has('card-safety-rules') ? 'translateY(0)' : 'translateY(24px)',
        }}
      >
        <div className="relative rounded-xl overflow-hidden mb-6 h-52">
          <img
            src="https://images.pexels.com/photos/6655483/pexels-photo-6655483.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&dpr=1"
            alt="Shooting range targets"
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.35) saturate(0.7)' }}
            loading="lazy"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, var(--bg-surface) 0%, var(--glass-bg) 100%)' }} />
          <div className="absolute bottom-5 left-5 right-5">
            <h3 className="font-display font-black text-2xl text-text-primary">The 4 Universal Rules</h3>
            <p className="text-text-secondary text-sm mt-1">These rules apply to every firearm, every time, without exception.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SafetyRule
            n={1}
            title="Treat Every Firearm as Loaded"
            desc="Always handle every firearm as if it is loaded, even when you believe it is not. Verify clear status yourself."
            color="#FF4D6D"
          />
          <SafetyRule
            n={2}
            title="Never Point at Anything You Won't Destroy"
            desc="Keep the muzzle pointed in a safe direction at all times. Be aware of your muzzle direction during all handling."
            color="#F5A623"
          />
          <SafetyRule
            n={3}
            title="Finger Off Trigger Until Ready"
            desc="Keep your finger straight and off the trigger until your sights are on target and you have made the decision to fire."
            color="#4FC3F7"
          />
          <SafetyRule
            n={4}
            title="Know Your Target & What's Beyond"
            desc="Identify your target and what lies in front of and behind it. Never fire at sounds, movement, or unidentified targets."
            color="#00E5A0"
          />
        </div>
      </div>

      {/* Safety Additional */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <div
          id="card-ppe"
          data-reveal
          className="card p-5 transition-all duration-700"
          style={{
            opacity: visibleCards.has('card-ppe') ? 1 : 0,
            transform: visibleCards.has('card-ppe') ? 'translateY(0)' : 'translateY(24px)',
          }}
        >
          <h4 className="font-display font-bold text-sm text-text-primary mb-3">Required Protective Equipment</h4>
          <div className="space-y-3">
            {[
              { name: 'Eye Protection', desc: 'ANSI Z87.1+ rated safety glasses or goggles', icon: <EyeShieldSvg /> },
              { name: 'Hearing Protection', desc: 'Minimum NRR 22dB earmuffs or plugs (double-up recommended)', icon: <EarSvg /> },
              { name: 'Appropriate Clothing', desc: 'Closed-toe shoes, no loose clothing near action/barrel', icon: <ShirtSvg /> },
            ].map((item) => (
              <div key={item.name} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>
                  {item.icon}
                </span>
                <div>
                  <p className="font-display font-bold text-[13px] text-text-primary">{item.name}</p>
                  <p className="text-text-secondary text-[12px] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          id="card-range-etiquette"
          data-reveal
          className="card p-5 transition-all duration-700"
          style={{
            opacity: visibleCards.has('card-range-etiquette') ? 1 : 0,
            transform: visibleCards.has('card-range-etiquette') ? 'translateY(0)' : 'translateY(24px)',
          }}
        >
          <h4 className="font-display font-bold text-sm text-text-primary mb-3">Range Commands & Etiquette</h4>
          <div className="space-y-2.5">
            {[
              { cmd: '"Cease Fire"', desc: 'Immediately stop shooting, remove finger from trigger, make firearm safe' },
              { cmd: '"Range is Hot"', desc: 'Firing may commence when ready. Stay behind the firing line.' },
              { cmd: '"Range is Cold"', desc: 'All firearms are clear and actions open. Safe to go downrange.' },
              { cmd: '"Commence Fire"', desc: 'You may begin your shooting string. Maintain lane discipline.' },
              { cmd: '"Make Safe"', desc: 'Remove magazine, clear chamber, lock action open, ground the firearm' },
            ].map((item) => (
              <div key={item.cmd} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                <span className="font-display font-bold text-[13px]" style={{ color: '#F59E0B' }}>{item.cmd}</span>
                <p className="text-text-secondary text-[12px] leading-relaxed mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Safety Video */}
      <div
        id="card-safety-video"
        data-reveal
        className="card p-5 mb-10 transition-all duration-700"
        style={{
          opacity: visibleCards.has('card-safety-video') ? 1 : 0,
          transform: visibleCards.has('card-safety-video') ? 'translateY(0)' : 'translateY(24px)',
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <VideoIcon color="#F59E0B" />
          <div>
            <h3 className="font-display font-bold text-text-primary text-base">Range Safety Essentials</h3>
            <p className="text-text-muted text-xs">Safety protocols every shooter must know before stepping on the range</p>
          </div>
        </div>
        <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
          <iframe
            src="https://www.youtube.com/embed/COvFyw-6Fqs"
            title="Range Safety"
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            style={{ border: 'none' }}
          />
        </div>
      </div>

      {/* Bottom CTA */}
      <div
        id="card-cta"
        data-reveal
        className="text-center py-12 transition-all duration-700"
        style={{
          opacity: visibleCards.has('card-cta') ? 1 : 0,
          transform: visibleCards.has('card-cta') ? 'translateY(0)' : 'translateY(24px)',
        }}
      >
        <p className="text-text-muted text-xs uppercase tracking-widest font-display font-bold mb-3">
          Ready to Apply What You've Learned?
        </p>
        <h2 className="font-display font-black text-2xl text-text-primary mb-2">
          Start a Training Session
        </h2>
        <p className="text-text-secondary text-sm max-w-md mx-auto mb-6">
          Put these techniques into practice. Track your progress, analyze your groups,
          and get AI-powered coaching feedback.
        </p>
        <a
          href="/sessions/new"
          className="btn btn-primary text-sm px-8 py-3"
        >
          New Session
        </a>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════════════

function SectionHeader({ id, section, visible }: { id: string; section: GuidanceSectionType; visible: boolean }) {
  return (
    <div
      id={id}
      data-reveal
      className="flex items-center gap-4 mb-6 pt-4 transition-all duration-700"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        scrollMarginTop: '100px',
      }}
    >
      <span
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: `${section.color}14`,
          border: `1px solid ${section.color}30`,
          color: section.color,
          boxShadow: `0 0 20px ${section.glow}`,
        }}
      >
        {section.icon}
      </span>
      <div>
        <h2 className="font-display font-bold text-xl text-text-primary leading-tight">{section.title}</h2>
        <p className="text-text-muted text-xs mt-0.5">{section.subtitle}</p>
      </div>
      <div className="flex-1 h-px ml-4" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.06), transparent)' }} />
    </div>
  );
}

function InfoChip({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-display font-bold uppercase tracking-wide"
      style={{ background: `${color}10`, border: `1px solid ${color}25`, color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function StanceCard({ id, title, image, visible, points, difficulty, diffColor }: {
  id: string; title: string; image: string; visible: boolean;
  points: string[]; difficulty: string; diffColor: string;
}) {
  return (
    <div
      id={id}
      data-reveal
      className="card p-0 overflow-hidden transition-all duration-700"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
      }}
    >
      <div className="relative h-44 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover"
          style={{ filter: 'brightness(0.4) saturate(0.8)' }}
          loading="lazy"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, var(--bg-surface) 0%, transparent 70%)' }} />
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
          <h4 className="font-display font-bold text-text-primary">{title}</h4>
          <span
            className="text-[10px] font-display font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
            style={{ background: `${diffColor}15`, color: diffColor, border: `1px solid ${diffColor}30` }}
          >
            {difficulty}
          </span>
        </div>
      </div>
      <div className="p-4">
        <ul className="space-y-2">
          {points.map((p, i) => (
            <li key={i} className="flex gap-2.5 text-text-secondary text-[12px] leading-relaxed">
              <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ background: diffColor }} />
              {p}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function StepItem({ n, text, color }: { n: number; text: string; color: string }) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-display font-black"
        style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}
      >
        {n}
      </span>
      <p className="text-text-secondary text-[13px] leading-relaxed">{text}</p>
    </div>
  );
}

function TriggerStep({ title, desc, color }: { title: string; desc: string; color: string }) {
  return (
    <div
      className="p-4 rounded-xl"
      style={{ background: `${color}06`, border: `1px solid ${color}18` }}
    >
      <h5 className="font-display font-bold text-[13px] mb-1" style={{ color }}>{title}</h5>
      <p className="text-text-secondary text-[12px] leading-relaxed">{desc}</p>
    </div>
  );
}

function ErrorCard({ title, desc, severity, sevColor }: {
  title: string; desc: string; severity: string; sevColor: string;
}) {
  return (
    <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
      <div className="flex items-center justify-between mb-2">
        <h5 className="font-display font-bold text-[14px] text-text-primary">{title}</h5>
        <span
          className="text-[10px] font-display font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
          style={{ background: `${sevColor}12`, color: sevColor, border: `1px solid ${sevColor}25` }}
        >
          {severity}
        </span>
      </div>
      <p className="text-text-secondary text-[12px] leading-relaxed">{desc}</p>
    </div>
  );
}

function MentalStat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.12)' }}>
      <span className="block mx-auto w-6 h-6 mb-2" style={{ color: '#A78BFA' }}>{icon}</span>
      <p className="font-display font-bold text-[12px] text-text-primary leading-tight">{value}</p>
      <p className="text-text-muted text-[10px] mt-0.5">{label}</p>
    </div>
  );
}

function SafetyRule({ n, title, desc, color }: { n: number; title: string; desc: string; color: string }) {
  return (
    <div className="p-4 rounded-xl" style={{ background: `${color}06`, border: `1px solid ${color}18` }}>
      <div className="flex items-center gap-3 mb-2">
        <span
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-display font-black text-sm"
          style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}
        >
          {n}
        </span>
        <h4 className="font-display font-bold text-[14px]" style={{ color }}>{title}</h4>
      </div>
      <p className="text-text-secondary text-[12px] leading-relaxed ml-11">{desc}</p>
    </div>
  );
}

function VideoIcon({ color }: { color: string }) {
  return (
    <span
      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
      style={{ background: `${color}12`, border: `1px solid ${color}25` }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill={color} stroke="none">
        <path d="M4.5 2.5v11l9-5.5-9-5.5z" />
      </svg>
    </span>
  );
}

function BreathingDiagram() {
  return (
    <svg width="280" height="80" viewBox="0 0 280 80" fill="none" className="drop-shadow-lg">
      {/* Breathing wave */}
      <path
        d="M0,60 Q20,60 30,20 Q40,60 60,60 Q70,60 80,20 Q90,60 110,60 Q120,60 130,20 Q140,60 160,60 L160,65 L200,65 L200,60 Q210,60 220,20 Q230,60 250,60 Q260,60 270,20 Q280,60 280,60"
        stroke="#00E5A0"
        strokeWidth="2"
        opacity="0.8"
      />
      {/* Pause zone highlight */}
      <rect x="155" y="52" width="50" height="22" rx="4" fill="rgba(245,166,35,0.2)" stroke="rgba(245,166,35,0.4)" strokeWidth="1" />
      <text x="180" y="67" textAnchor="middle" fill="#F5A623" fontSize="9" fontFamily="Rajdhani, sans-serif" fontWeight="700">
        FIRE
      </text>
      {/* Labels */}
      <text x="70" y="76" textAnchor="middle" fill="var(--text-muted)" fontSize="8" fontFamily="Rajdhani, sans-serif">
        Inhale / Exhale
      </text>
      <text x="240" y="76" textAnchor="middle" fill="var(--text-muted)" fontSize="8" fontFamily="Rajdhani, sans-serif">
        Inhale / Exhale
      </text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SVG Icons
// ═══════════════════════════════════════════════════════════════════════════════

function TargetSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="9" cy="9" r="7.5" />
      <circle cx="9" cy="9" r="4.5" />
      <circle cx="9" cy="9" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function StanceSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="3.5" r="1.5" />
      <line x1="9" y1="5" x2="9" y2="10" />
      <line x1="5" y1="7.5" x2="13" y2="7.5" />
      <line x1="9" y1="10" x2="6" y2="15" />
      <line x1="9" y1="10" x2="12" y2="15" />
    </svg>
  );
}

function BreathSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M2 9c2-4 4-4 5 0s3 4 5 0 3-4 4 0" />
    </svg>
  );
}

function TriggerSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h10v5a3 3 0 01-3 3H9" />
      <path d="M9 12v3" />
      <circle cx="9" cy="8" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function MindSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="9" cy="9" r="7" />
      <path d="M9 5v4l2.5 2.5" />
      <circle cx="9" cy="9" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ShieldSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2L3 5v4c0 4 2.5 6.5 6 7.5 3.5-1 6-3.5 6-7.5V5L9 2z" />
      <polyline points="6.5,9 8.5,11 12,7" />
    </svg>
  );
}

function CheckSvg() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,7 5.5,10.5 12,4" />
    </svg>
  );
}

function XSvg() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="3" x2="11" y2="11" />
      <line x1="11" y1="3" x2="3" y2="11" />
    </svg>
  );
}

function RepeatSvg() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="12,2 14,4 12,6" />
      <path d="M2 8V6a2 2 0 012-2h10" />
      <polyline points="4,14 2,12 4,10" />
      <path d="M14 8v2a2 2 0 01-2 2H2" />
    </svg>
  );
}

function EyeSvg() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  );
}

function WaveSvg() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M1 8c1.5-3 3-3 4 0s2.5 3 4 0 2.5-3 3.5 0" />
    </svg>
  );
}

function ImageSvg() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="2.5" width="13" height="11" rx="2" />
      <circle cx="5.5" cy="6" r="1.5" />
      <path d="M14.5 10.5l-3-3-4 4-2-2-4 4" />
    </svg>
  );
}

function EyeShieldSvg() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" />
      <circle cx="8" cy="8" r="2.5" />
    </svg>
  );
}

function EarSvg() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13c0-2 1-3 2-4s2-2 2-4a3 3 0 00-6 0" />
      <path d="M11 5a5 5 0 00-10 0" />
    </svg>
  );
}

function ShirtSvg() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 2L1 5v3l3-1v7h8V7l3 1V5l-4-3" />
      <path d="M5 2c0 1.5 1.5 3 3 3s3-1.5 3-3" />
    </svg>
  );
}
