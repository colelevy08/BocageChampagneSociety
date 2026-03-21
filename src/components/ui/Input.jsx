/**
 * @file src/components/ui/Input.jsx
 * @description Styled form input component matching the luxury dark theme.
 * Supports labels, icons, error states, and textarea mode.
 * @importedBy src/pages/Auth.jsx, AtHome.jsx, AdminInventory.jsx, Profile.jsx
 */

import { forwardRef } from 'react';

/**
 * Input — themed form field with label, icon, and error display.
 *
 * @param {object} props
 * @param {string} props.label - Field label text
 * @param {React.ReactNode} props.icon - Optional left icon in label
 * @param {string} props.error - Error message to display below
 * @param {boolean} props.textarea - Render as textarea instead of input
 * @param {string} props.className - Additional classes
 * @param {object} props.rest - Passed to the input/textarea element
 */
const Input = forwardRef(function Input(
  { label, icon, error, textarea = false, className = '', ...rest },
  ref
) {
  const Tag = textarea ? 'textarea' : 'input';
  const baseClasses =
    'w-full bg-noir-800 border rounded-lg px-4 py-3 text-white font-sans text-sm placeholder:text-noir-500 focus:outline-none transition-colors';
  const borderClasses = error
    ? 'border-red-500/50 focus:border-red-500'
    : 'border-noir-700 focus:border-champagne-500';

  return (
    <div className={className}>
      {label && (
        <label className="flex items-center gap-1.5 text-xs font-sans text-noir-300 mb-1.5 uppercase tracking-wider">
          {icon}
          {label}
        </label>
      )}
      <Tag
        ref={ref}
        className={`${baseClasses} ${borderClasses} ${textarea ? 'resize-none' : ''}`}
        {...rest}
      />
      {error && (
        <p className="mt-1 text-xs font-sans text-red-400">{error}</p>
      )}
    </div>
  );
});

export default Input;
