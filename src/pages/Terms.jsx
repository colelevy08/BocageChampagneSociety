/**
 * @file src/pages/Terms.jsx
 * @description Society terms of service. Mirrors the marketing-site version
 * for members surfacing the terms from inside the app (Profile footer).
 * @importedBy src/App.jsx (route: /terms)
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

export default function Terms() {
  return (
    <div className="px-4 pt-6 pb-24">
      <PageHeader title="Terms" subtitle={`Effective ${EFFECTIVE_DATE}`} />

      <p className="font-serif text-sm text-noir-300 leading-relaxed mb-6">
        These Terms govern your use of the Bocage Champagne Society membership app, the public
        site at bocagechampagnebar.com, and related services offered by Bocage Champagne Bar
        LLC at 10 Phila Street, Saratoga Springs, New York. By signing up or funding a house
        account, you agree to these Terms.
      </p>

      <Section title="Eligibility" delay={0.05}>
        <p>
          Bocage is a 21-and-over establishment. You must be at least 21 to create a Society
          membership, fund a house account, or attend an event where alcohol is served. We may
          verify age on premises.
        </p>
      </Section>

      <Section title="Your account" delay={0.1}>
        <p>
          You are responsible for your login credentials and all activity under your account.
          Tell us immediately if your account is accessed without permission. We may suspend
          accounts that violate these Terms or appear to be used to defraud the business.
        </p>
      </Section>

      <Section title="House accounts" delay={0.15}>
        <p>
          A Society house account is a prepaid balance redeemable at Bocage Champagne Bar in
          Saratoga Springs, New York. By funding or using one, you agree that:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Funds are loaded in U.S. dollars and have no expiration.</li>
          <li>
            <strong className="text-noir-100">Funds are non-refundable and non-transferable</strong>
            {' '}except where required by law. If your membership closes with a positive balance,
            redeem it in person at the bar.
          </li>
          <li>Funds are redeemable only at the Saratoga Springs location — not transferable to other venues or exchangeable for cash.</li>
          <li>A house account is not a bank account. No interest accrues. Balances are not insured; they represent store credit with Bocage only.</li>
          <li>Credits and debits recorded by Bocage staff are final. If you believe an entry is wrong, contact us within 60 days and we'll investigate in good faith.</li>
        </ul>
      </Section>

      <Section title="Gift cards" delay={0.2}>
        <p>
          Bocage gift cards are issued and processed by Toast. Purchase, balance-check, and
          redemption follow the Toast gift-card terms shown at checkout. In general: non-refundable,
          non-transferable except to the recipient, no expiration, redeemable only at Bocage
          Saratoga Springs, not redeemable for cash except where required by law.
        </p>
      </Section>

      <Section title="Reservations and events" delay={0.25}>
        <p>
          Reservations are handled by Resy under their terms. Private events, At-Home bookings,
          and Society RSVPs are subject to the cancellation and deposit terms disclosed at the
          time of booking. RSVP does not guarantee entry if you arrive after a stated cutoff.
        </p>
      </Section>

      <Section title="Payments" delay={0.3}>
        <p>
          All payments are processed by third-party providers (Toast). Bocage does not store or
          transmit raw credit card numbers. Your use of a payment provider is governed by their
          terms and privacy policy.
        </p>
      </Section>

      <Section title="Acceptable use" delay={0.35}>
        <p>You agree not to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Harass, threaten, or defame others through the platform.</li>
          <li>Access another member's account or information.</li>
          <li>Interfere with, disrupt, or reverse engineer the service.</li>
          <li>Scrape, overload, or probe the service with automation.</li>
          <li>Use the service to violate any law or third-party rights.</li>
        </ul>
      </Section>

      <Section title="Intellectual property" delay={0.4}>
        <p>
          Bocage's name, logo, photography, menus, and written content are our property or
          our licensors'. Don't reproduce without permission. You keep ownership of anything
          you submit, and grant Bocage a non-exclusive license to use it to operate the service.
        </p>
      </Section>

      <Section title="Limitation of liability" delay={0.45}>
        <p>
          The service is provided "as is." To the extent permitted by law, Bocage disclaims
          implied warranties of merchantability, fitness, and non-infringement, and is not
          liable for indirect or consequential damages. Our total liability for any claim
          related to the service will not exceed the greater of $50 or what you paid us in
          the preceding twelve months.
        </p>
        <p>Nothing here limits liability that can't be limited by applicable law.</p>
      </Section>

      <Section title="Governing law" delay={0.5}>
        <p>
          These Terms are governed by the laws of New York State. Disputes will be brought
          exclusively in the state or federal courts in Saratoga County, New York.
        </p>
      </Section>

      <Section title="Changes" delay={0.55}>
        <p>
          We may update these Terms. For material changes we'll notify active members by email
          at least thirty days before the effective date. Continued use after that date means
          you accept the update.
        </p>
      </Section>

      <Section title="Contact" delay={0.6}>
        <p>
          <strong className="text-noir-100">Bocage Champagne Bar LLC</strong><br />
          10 Phila Street, Saratoga Springs, NY 12866<br />
          <a href="mailto:hello@bocagechampagnebar.com" className="text-champagne-500 hover:text-champagne-400 underline">
            hello@bocagechampagnebar.com
          </a>
        </p>
      </Section>
    </div>
  );
}
