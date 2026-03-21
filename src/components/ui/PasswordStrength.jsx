/**
 * @file src/components/ui/PasswordStrength.jsx
 * @description Visual password strength indicator for the signup form.
 * Evaluates password length, character variety, and provides color-coded feedback.
 * @importedBy src/pages/Auth.jsx
 */

/**
 * Evaluates password strength on a 0–4 scale.
 * @param {string} password
 * @returns {{ score: number, label: string }}
 */
function evaluateStrength(password) {
  if (!password) return { score: 0, label: '' };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  return { score: Math.min(score, 4), label: labels[Math.min(score, 5)] };
}

/** Strength bar colors */
const COLORS = ['bg-noir-600', 'bg-red-500', 'bg-amber-500', 'bg-champagne-500', 'bg-emerald-500'];

/**
 * PasswordStrength — visual strength meter for password fields.
 *
 * @param {object} props
 * @param {string} props.password - The current password value
 * @returns {JSX.Element|null}
 */
export default function PasswordStrength({ password }) {
  const { score, label } = evaluateStrength(password);
  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              level <= score ? COLORS[score] : 'bg-noir-700'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-sans mt-1 ${score <= 1 ? 'text-red-400' : score <= 2 ? 'text-amber-400' : 'text-champagne-400'}`}>
        {label}
      </p>
    </div>
  );
}
