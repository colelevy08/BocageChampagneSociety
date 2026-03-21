/**
 * @file src/pages/Onboarding.jsx
 * @description Swipeable onboarding welcome slides shown to new members on first login.
 * Features animated illustrations, progress dots, and skip functionality.
 * Stores completion state in localStorage so it only shows once.
 * @importedBy src/App.jsx (shown after first auth if not completed)
 * @imports framer-motion, lucide-react
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wine, Crown, CalendarDays, Sparkles, ArrowRight, ChevronLeft } from 'lucide-react';
import Button from '../components/ui/Button';

/** Onboarding slide data */
const SLIDES = [
  {
    icon: Wine,
    title: 'Welcome to Bocage',
    subtitle: 'Champagne Society',
    description: 'Your exclusive membership to Saratoga\'s premier champagne bar at 10 Phila Street. Discover rare wines, earn rewards, and experience luxury since 2021.',
    color: 'champagne-500',
    bg: 'bg-champagne-500/5',
  },
  {
    icon: Crown,
    title: 'Earn & Rise',
    subtitle: 'Three Tiers of Luxury',
    description: 'Start as a Flûte member and earn points with every visit. Rise to Magnum and Jeroboam for exclusive perks like complimentary bottles and personal sommelier service.',
    color: 'champagne-400',
    bg: 'bg-champagne-400/5',
  },
  {
    icon: CalendarDays,
    title: 'Exclusive Events',
    subtitle: 'Curated Experiences',
    description: 'From intimate tastings to grand celebrations — access member-only events, reserve your seat, and be part of the Bocage community.',
    color: 'rose-400',
    bg: 'bg-rose-400/5',
  },
  {
    icon: Sparkles,
    title: 'At Home With Bocage',
    subtitle: 'Luxury at Your Door',
    description: 'Bring the Bocage experience to your home. Our sommelier team will curate a private champagne experience for any occasion.',
    color: 'champagne-300',
    bg: 'bg-champagne-300/5',
  },
];

/** localStorage key to track onboarding completion */
const ONBOARDING_KEY = 'bocage_onboarding_complete';

/**
 * Checks if the user has completed onboarding.
 * @returns {boolean}
 */
export function hasCompletedOnboarding() {
  return localStorage.getItem(ONBOARDING_KEY) === 'true';
}

/**
 * Marks onboarding as complete in localStorage.
 */
export function completeOnboarding() {
  localStorage.setItem(ONBOARDING_KEY, 'true');
}

/**
 * Onboarding page — swipeable welcome slides with animated transitions.
 *
 * @param {object} props
 * @param {Function} props.onComplete - Called when user finishes or skips onboarding
 * @returns {JSX.Element}
 */
export default function Onboarding({ onComplete }) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back

  const isLast = current === SLIDES.length - 1;

  /**
   * Advances to the next slide or completes onboarding on last slide.
   */
  function handleNext() {
    if (isLast) {
      completeOnboarding();
      onComplete();
    } else {
      setDirection(1);
      setCurrent(current + 1);
    }
  }

  /**
   * Goes back to the previous slide.
   */
  function handleBack() {
    if (current > 0) {
      setDirection(-1);
      setCurrent(current - 1);
    }
  }

  /**
   * Skips onboarding entirely.
   */
  function handleSkip() {
    completeOnboarding();
    onComplete();
  }

  const slide = SLIDES[current];
  const Icon = slide.icon;

  /** Slide animation variants */
  const variants = {
    enter: (dir) => ({ x: dir > 0 ? 200 : -200, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -200 : 200, opacity: 0 }),
  };

  return (
    <div className="min-h-screen bg-noir-900 flex flex-col safe-top safe-bottom">
      {/* Skip button */}
      <div className="flex justify-end px-6 pt-4">
        <button
          onClick={handleSkip}
          className="font-sans text-sm text-noir-400 hover:text-champagne-500 transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="text-center w-full max-w-sm"
          >
            {/* Animated icon */}
            <motion.div
              animate={{
                rotate: [0, 8, -8, 0],
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${slide.bg} border border-${slide.color}/20 mb-8 glow-gold`}
            >
              <Icon className={`text-${slide.color}`} size={44} />
            </motion.div>

            {/* Text */}
            <h1 className="font-display text-4xl text-gradient-gold mb-2">
              {slide.title}
            </h1>
            <h2 className="font-serif text-lg text-champagne-400 mb-6">
              {slide.subtitle}
            </h2>
            <p className="font-serif text-base text-noir-300 leading-relaxed">
              {slide.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="px-8 pb-8">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {SLIDES.map((_, i) => (
            <motion.div
              key={i}
              animate={{
                width: i === current ? 24 : 8,
                backgroundColor: i === current ? '#D4A843' : '#2A2A2A',
              }}
              transition={{ duration: 0.3 }}
              className="h-2 rounded-full"
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-3">
          {current > 0 && (
            <button
              onClick={handleBack}
              className="p-3 rounded-lg bg-noir-800 border border-noir-700 text-noir-300 hover:text-white transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <Button
            variant="primary"
            size="full"
            onClick={handleNext}
            icon={isLast ? <Sparkles size={16} /> : <ArrowRight size={16} />}
          >
            {isLast ? 'Get Started' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}
