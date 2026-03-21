/**
 * @file src/components/ui/PageHeader.jsx
 * @description Reusable page header component with consistent styling.
 * Renders a gradient gold title, optional subtitle, and optional right action.
 * @importedBy All page components in src/pages/
 */

/**
 * PageHeader — consistent header for all pages.
 *
 * @param {object} props
 * @param {string} props.title - Main heading text (displayed in gold gradient)
 * @param {string} props.subtitle - Secondary text below the title
 * @param {React.ReactNode} props.action - Optional right-side action (button, etc.)
 * @returns {JSX.Element}
 */
export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="font-display text-3xl text-gradient-gold">{title}</h1>
        {subtitle && (
          <p className="font-serif text-noir-300 mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
