/**
 * @file src/pages/Profile.jsx
 * @description User profile page with editable name/phone, Society membership
 * status + benefits, house account balance, admin badge, quick links, contact info, and sign out.
 * @importedBy src/App.jsx (route: /profile)
 * @imports src/context/AuthContext.jsx, src/lib/supabase.js, src/components/ui/*,
 *          src/hooks/*, framer-motion, lucide-react, date-fns
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Crown, LogOut, MapPin, Phone, Edit3,
  Check, X, Shield, Calendar, Wine, CalendarHeart, Sparkles, Gift, Users,
  CreditCard, ShoppingBag, ExternalLink, Wallet, ChevronDown, ChevronUp, Plus,
} from 'lucide-react';
import { format } from 'date-fns';

/** Society membership benefits shown on the profile */
const BENEFITS = [
  { icon: Wine, title: 'Member pours', body: 'Access to allocations and rare bottles reserved for the Society.' },
  { icon: CalendarHeart, title: 'Private events', body: 'First seat at producer dinners, library tastings, and Society nights.' },
  { icon: Sparkles, title: 'Birthday toast', body: 'A complimentary glass of champagne to mark your birthday with us.' },
  { icon: Gift, title: 'Early access', body: 'New arrivals, vintage releases, and At-Home dates open to members first.' },
  { icon: Users, title: 'Bring a guest', body: 'Member-rate guest passes for Society events when you reserve in advance.' },
];
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ui/Toast';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useHaptics } from '../hooks/useHaptics';

/**
 * Profile page — user info, editing, member status, contact, and sign out.
 * @returns {JSX.Element}
 */
export default function Profile() {
  const { user, profile, membership, isAdmin, signOut } = useAuth();
  const toast = useToast();
  const haptics = useHaptics();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(profile?.full_name || '');
  const [editPhone, setEditPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [houseAccount, setHouseAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [showTransactions, setShowTransactions] = useState(false);

  /** Fetches house account balance and recent transactions */
  const fetchHouseAccount = useCallback(async () => {
    if (!user) return;
    const { data: acct } = await supabase
      .from('bocage_house_accounts')
      .select('*')
      .eq('profile_id', user.id)
      .maybeSingle();
    setHouseAccount(acct);

    if (acct) {
      const { data: txns } = await supabase
        .from('bocage_house_transactions')
        .select('*')
        .eq('account_id', acct.id)
        .order('created_at', { ascending: false })
        .limit(10);
      setTransactions(txns || []);
    }
  }, [user]);

  useEffect(() => { fetchHouseAccount(); }, [fetchHouseAccount]);

  /** Saves updated profile fields */
  async function handleSave() {
    setSaving(true);
    const { error } = await supabase
      .from('bocage_profiles')
      .update({
        full_name: editName.trim(),
        phone: editPhone.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      toast.error('Failed to update profile.');
    } else {
      toast.success('Profile updated!');
      haptics.success();
      setEditing(false);
    }
    setSaving(false);
  }

  /** Handles sign out with toast */
  async function handleSignOut() {
    await signOut();
    toast.info('You\'ve been signed out.');
  }

  // Stats for the profile card
  const memberSince = membership?.joined_at
    ? format(new Date(membership.joined_at), 'MMMM yyyy')
    : 'Just joined';

  return (
    <div className="px-4 pt-6 pb-4">
      <PageHeader title="Profile" />

      {/* User card with edit mode */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 mb-4"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-champagne-500/10 border border-champagne-500/20 flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="text-champagne-500" size={28} />
                )}
              </div>
              {isAdmin && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-champagne-500 flex items-center justify-center">
                  <Shield size={12} className="text-noir-900" />
                </div>
              )}
            </div>

            <div>
              {editing ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-noir-800 border border-champagne-500/50 rounded-lg px-3 py-1.5 text-white font-display text-lg w-40 focus:outline-none"
                  autoFocus
                />
              ) : (
                <h2 className="font-display text-xl text-white">
                  {profile?.full_name || 'Member'}
                </h2>
              )}
              <div className="flex items-center gap-1 text-noir-400 text-sm font-sans mt-0.5">
                <Mail size={13} />
                <span className="truncate max-w-[180px]">{user?.email}</span>
              </div>
            </div>
          </div>

          {/* Edit toggle */}
          {!editing ? (
            <button
              onClick={() => {
                setEditing(true);
                setEditName(profile?.full_name || '');
                setEditPhone(profile?.phone || '');
              }}
              className="p-2 text-noir-400 hover:text-champagne-500 transition-colors"
            >
              <Edit3 size={16} />
            </button>
          ) : (
            <div className="flex gap-1">
              <button
                onClick={() => setEditing(false)}
                className="p-2 text-noir-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="p-2 text-champagne-500 hover:text-champagne-400 transition-colors"
              >
                <Check size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Phone field (edit mode) */}
        {editing && (
          <div className="mb-4">
            <label className="flex items-center gap-1.5 text-xs font-sans text-noir-300 mb-1.5 uppercase tracking-wider">
              <Phone size={12} /> Phone
            </label>
            <input
              type="tel"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full bg-noir-800 border border-noir-700 rounded-lg px-4 py-2.5 text-white font-sans text-sm placeholder:text-noir-500 focus:outline-none focus:border-champagne-500 transition-colors"
            />
          </div>
        )}

        {/* Society member status */}
        <div className="flex items-center gap-2 bg-noir-800 rounded-lg px-3 py-2.5">
          <Crown className="text-champagne-500" size={16} />
          <span className="font-sans text-sm text-white">Society Member</span>
          <span className="ml-auto font-sans text-xs text-champagne-400">Active</span>
        </div>
      </motion.div>

      {/* Member-since stat */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-xl p-4 mb-4 flex items-center gap-3"
      >
        <Calendar size={18} className="text-champagne-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-sans text-xs text-noir-500 uppercase tracking-wider">Member Since</p>
          <p className="font-display text-base text-white mt-0.5">{memberSince}</p>
        </div>
      </motion.div>

      {/* House account balance — always rendered. Row is seeded at signup
          via bocage_handle_new_user(). Falls back to $0.00 if the fetch
          hasn't returned yet or the row is missing for any reason. */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="glass rounded-xl mb-4 overflow-hidden border border-champagne-500/20"
      >
        <div className="p-4 flex items-center gap-3">
          <Wallet size={18} className="text-champagne-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-sans text-xs text-noir-500 uppercase tracking-wider">House Account</p>
            <p className="font-display text-xl text-white mt-0.5">
              ${Number(houseAccount?.balance ?? 0).toFixed(2)}
            </p>
          </div>
          {transactions.length > 0 && (
            <button
              onClick={() => setShowTransactions(!showTransactions)}
              className="p-1 text-noir-400"
              aria-label="Toggle transaction history"
            >
              {showTransactions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </div>

        {/* Add funds CTA — shown when balance is 0 or the account isn't
            linked to a Toast tab yet. Opens a pre-filled email so staff
            can top up on the POS (online funding not wired up yet). */}
        {(!houseAccount?.balance || Number(houseAccount.balance) === 0) && (
          <div className="px-4 pb-4 border-t border-noir-700 pt-3">
            <p className="font-sans text-[12px] text-noir-300 leading-snug mb-3">
              Your house account is ready. Top it up to use it toward drinks,
              bottles, and Society events — no card at the bar required.
            </p>
            <a
              href={`mailto:hello@bocagechampagnebar.com?subject=Add%20funds%20to%20my%20house%20account&body=Hi%20Bocage%20team%2C%0A%0AI%27d%20like%20to%20add%20funds%20to%20the%20house%20account%20for%20${encodeURIComponent(user?.email || '')}.%20Please%20let%20me%20know%20the%20next%20step.%0A%0AThanks!`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-champagne-500 text-noir-900 font-sans text-xs font-semibold hover:bg-champagne-400 transition-colors"
            >
              <Plus size={14} />
              Add funds
            </a>
            <p className="font-sans text-[10px] text-noir-500 mt-2 leading-snug">
              Or add funds in person on your next visit — ask for {user?.email}.
            </p>
          </div>
        )}

        <AnimatePresence>
          {showTransactions && transactions.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-3 space-y-2 border-t border-noir-700 pt-3">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-sans text-xs text-white">{tx.description || tx.type}</p>
                      <p className="font-sans text-[10px] text-noir-500">
                        {format(new Date(tx.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <span className={`font-sans text-sm font-medium ${
                      tx.type === 'credit' || tx.type === 'refund'
                        ? 'text-green-400' : 'text-rose-400'
                    }`}>
                      {tx.type === 'debit' ? '-' : '+'}${Math.abs(Number(tx.amount)).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Admin badge */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-3 mb-4 flex items-center gap-3 border border-champagne-500/20"
        >
          <Shield className="text-champagne-500" size={18} />
          <div>
            <p className="font-sans text-sm text-white">Admin Access</p>
            <p className="font-sans text-xs text-noir-400">You have inventory management privileges</p>
          </div>
        </motion.div>
      )}

      {/* Society benefits */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-4"
      >
        <h3 className="font-display text-lg text-white mb-3">What's Included</h3>
        <div className="space-y-2">
          {BENEFITS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="glass rounded-xl p-3 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-champagne-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon size={14} className="text-champagne-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-sm text-white">{title}</p>
                <p className="font-serif text-xs text-noir-400 mt-0.5 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Quick links — gift cards + ordering */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-4"
      >
        <h3 className="font-display text-lg text-white mb-3">Quick Links</h3>
        <div className="grid grid-cols-2 gap-3">
          <a
            href="https://www.toasttab.com/bocage-10-phila-street/giftcards"
            target="_blank"
            rel="noopener noreferrer"
            className="glass rounded-xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform"
          >
            <div className="w-10 h-10 rounded-full bg-champagne-500/10 flex items-center justify-center">
              <Gift size={18} className="text-champagne-500" />
            </div>
            <span className="font-sans text-xs text-white text-center">Buy Gift Card</span>
          </a>
          <a
            href="https://www.toasttab.com/bocage-10-phila-street/findcard"
            target="_blank"
            rel="noopener noreferrer"
            className="glass rounded-xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform"
          >
            <div className="w-10 h-10 rounded-full bg-champagne-500/10 flex items-center justify-center">
              <CreditCard size={18} className="text-champagne-500" />
            </div>
            <span className="font-sans text-xs text-white text-center">Check Balance</span>
          </a>
          <a
            href="https://www.toasttab.com/bocage-10-phila-street/"
            target="_blank"
            rel="noopener noreferrer"
            className="glass rounded-xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform"
          >
            <div className="w-10 h-10 rounded-full bg-champagne-500/10 flex items-center justify-center">
              <ShoppingBag size={18} className="text-champagne-500" />
            </div>
            <span className="font-sans text-xs text-white text-center">Order Online</span>
          </a>
          <a
            href="https://resy.com/cities/saratoga-springs-ny/venues/bocage-champagne-bar"
            target="_blank"
            rel="noopener noreferrer"
            className="glass rounded-xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform"
          >
            <div className="w-10 h-10 rounded-full bg-champagne-500/10 flex items-center justify-center">
              <Calendar size={18} className="text-champagne-500" />
            </div>
            <span className="font-sans text-xs text-white text-center">Reserve a Seat</span>
          </a>
        </div>
      </motion.div>

      {/* Contact info */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl p-5 mb-4"
      >
        <h3 className="font-display text-lg text-white mb-3">Bocage Champagne Bar</h3>
        <div className="space-y-2.5">
          <a href="https://maps.apple.com/?q=10+Phila+St+Saratoga+Springs+NY" className="flex items-center gap-3 text-sm font-sans text-noir-300 hover:text-white transition-colors">
            <MapPin size={16} className="text-champagne-600 flex-shrink-0" />
            10 Phila St, Saratoga Springs, NY 12866
          </a>
          <a href="mailto:Zac@SureThingHospitality.com" className="flex items-center gap-3 text-sm font-sans text-noir-300 hover:text-white transition-colors">
            <Mail size={16} className="text-champagne-600 flex-shrink-0" />
            Zac@SureThingHospitality.com
          </a>
        </div>
      </motion.div>

      {/* Sign out */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Button
          variant="danger"
          size="full"
          icon={<LogOut size={16} />}
          onClick={() => setShowSignOutConfirm(true)}
        >
          Sign Out
        </Button>
      </motion.div>

      {/* Sign out confirmation */}
      <ConfirmDialog
        isOpen={showSignOutConfirm}
        onClose={() => setShowSignOutConfirm(false)}
        onConfirm={handleSignOut}
        title="Sign Out?"
        message="You'll need to sign in again to access your membership."
        confirmLabel="Sign Out"
        destructive
      />

      {/* App version */}
      <p className="text-center text-xs text-noir-600 font-sans mt-6">
        Bocage Society v1.1.0
      </p>
    </div>
  );
}
