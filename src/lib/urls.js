/**
 * @file src/lib/urls.js
 * @description Single source of truth for the marketing-site origin that hosts
 * the shared /api/* endpoints (admin-society, society-request-password-reset)
 * and the membership sales page at /society. Defaults to the REAL custom domain
 * so members never see a *.vercel.app URL.
 *
 * Override with the VITE_MARKETING_ORIGIN env var (set in Vercel) WITHOUT a code
 * change if we ever need to route around an ISP-level block — e.g.
 * VITE_MARKETING_ORIGIN=https://bocage.vercel.app. The default works with no env
 * var set.
 * @importedBy src/pages/Auth.jsx, src/pages/AdminCRM.jsx
 */

/** Marketing-site origin (no trailing slash). */
export const MARKETING_ORIGIN = (
  import.meta.env.VITE_MARKETING_ORIGIN || 'https://www.bocagechampagnebar.com'
).replace(/\/+$/, '');
