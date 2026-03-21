/**
 * @file src/components/ui/AnimatedCounter.jsx
 * @description Animated number counter that smoothly transitions between values.
 * Used for points displays, stats, and other numeric values.
 * @importedBy src/pages/Membership.jsx, Profile.jsx, AdminInventory.jsx
 * @imports framer-motion
 */

import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

/**
 * AnimatedCounter — smoothly animates a number from 0 (or previous) to the target value.
 *
 * @param {object} props
 * @param {number} props.value - Target number to display
 * @param {string} props.className - Styling classes for the number text
 * @param {number} props.duration - Animation duration in seconds (default 1)
 * @param {boolean} props.format - Whether to add thousand separators (default true)
 * @returns {JSX.Element}
 */
export default function AnimatedCounter({ value, className = '', duration = 1, format = true }) {
  const [displayValue, setDisplayValue] = useState(0);
  const springValue = useSpring(0, {
    stiffness: 50,
    damping: 20,
    duration: duration * 1000,
  });

  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (v) => {
      setDisplayValue(Math.round(v));
    });
    return unsubscribe;
  }, [springValue]);

  const formatted = format ? displayValue.toLocaleString() : displayValue.toString();

  return <span className={className}>{formatted}</span>;
}
