/**
 * @file src/pages/Privacy.jsx
 * @description Society privacy policy. Mirrors the marketing-site version
 * for members who surface the policy from inside the app (Profile footer).
 * @importedBy src/App.jsx (route: /privacy)
 * @imports framer-motion, src/components/ui/PageHeader.jsx
 */

import { motion } from 'framer-motion';
import PageHeader from '../components/ui/PageHeader';

const EFFECTIVE_DATE = 'April 22, 2026';

function Section({ title, children, delay = 0 }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass rounded-xl p-5 mb-4"
    >
      <h2 className="font-display text-lg text-white mb-3">{title}</h2>
      <div className="font-serif text-sm text-noir-200 leading-relaxed space-y-2">
        {children}
      </div>
    </motion.section>
  );
}

export default function Privacy() {
  return (
    <div className="px-4 pt-6 pb-24">
      <PageHeader title="Privacy" subtitle={`Effective ${EFFECTIVE_DATE}`} />

      <p className="font-serif text-sm text-noir-300 leading-relaxed mb-6">
        Bocage Champagne Bar LLC operates the Society membership platform along with the
        public site at bocagechampagnebar.com. This is what we collect and how we handle it.
      </p>

      <Section title="What we collect" delay={0.05}>
        <p><strong className="text-noir-100">You tell us directly:</strong> name, email, phone,
        optional birthday, and anything you submit through a form. Your password is stored only
        as a cryptographic hash by our auth provider.</p>
        <p><strong className="text-noir-100">We record as you use the app:</strong> membership
        status, house-account balance, credits and debits applied by staff, event RSVPs, and
        booking requests.</p>
        <p><strong className="text-noir-100">Captured automatically:</strong> device type,
        browser, IP address — used for security and basic analytics only.</p>
        <p className="text-noir-300">
          We do <strong>not</strong> store payment card numbers. All card transactions run on
          Toast-hosted pages; card data never touches our infrastructure.
        </p>
      </Section>

      <Section title="How we use it" delay={0.1}>
        <ul className="list-disc pl-5 space-y-1">
          <li>Run your Society account and the house-account ledger.</li>
          <li>Process reservations, event bookings, and gift-card delivery.</li>
          <li>Send receipts, event invitations, and service notices. Marketing email only with your consent.</li>
          <li>Keep the platform secure and prevent fraud.</li>
        </ul>
      </Section>

      <Section title="Who we share it with" delay={0.15}>
        <p>We do not sell your data. We use a small set of vendors to run the business:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong className="text-noir-100">Supabase</strong> — database and authentication.</li>
          <li><strong className="text-noir-100">Vercel</strong> — site and app hosting.</li>
          <li><strong className="text-noir-100">Toast</strong> — point-of-sale, gift cards, payments.</li>
          <li><strong className="text-noir-100">Resy</strong> — reservations (only when you book via our link).</li>
        </ul>
        <p>We may disclose information if required by law or to protect Bocage, our guests, or others.</p>
      </Section>

      <Section title="Security and retention" delay={0.2}>
        <p>
          Data is stored encrypted at rest in Supabase and transmitted over HTTPS. Access to
          member data is limited to Bocage owner-designated administrators. We keep account
          information while your membership is active and will delete it within thirty days of a
          request — except records we are required to keep for tax and accounting (generally
          seven years).
        </p>
      </Section>

      <Section title="Your rights" delay={0.25}>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong className="text-noir-100">Access</strong> — email us for a copy of your file.</li>
          <li><strong className="text-noir-100">Correction</strong> — edit your name and phone in Profile; email for anything else.</li>
          <li><strong className="text-noir-100">Deletion</strong> — email us to close the account.</li>
          <li><strong className="text-noir-100">Marketing opt-out</strong> — unsubscribe link on every email we send.</li>
        </ul>
      </Section>

      <Section title="21+ only" delay={0.3}>
        <p>
          Bocage is a bar. Society membership is intended for adults 21 or older. We don't
          knowingly collect information from children.
        </p>
      </Section>

      <Section title="Changes" delay={0.35}>
        <p>
          If we update this policy in a material way, we'll email active members. The effective
          date at the top always reflects the current version.
        </p>
      </Section>

      <Section title="Contact" delay={0.4}>
        <p>
          <strong className="text-noir-100">Bocage Champagne Bar</strong><br />
          10 Phila Street, Saratoga Springs, NY 12866<br />
          <a href="mailto:hello@bocagechampagnebar.com" className="text-champagne-500 hover:text-champagne-400 underline">
            hello@bocagechampagnebar.com
          </a>
        </p>
      </Section>
    </div>
  );
}
