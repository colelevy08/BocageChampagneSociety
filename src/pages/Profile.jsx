/**
 * @file src/pages/Profile.jsx
 * @description User profile page with editable name/phone, Society membership
 * status + benefits, house account balance, admin badge, quick links, contact info, and sign out.
 * @importedBy src/App.jsx (route: /profile)
 * @imports src/context/AuthContext.jsx, src/lib/supabase.js, src/components/ui/*,
 *          src/hooks/*, framer-motion, lucide-react, date-fns
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Crown, LogOut, MapPin, Phone, Edit3,
  Check, X, Shield, Calendar, Wine, CalendarHeart, Sparkles, Gift, Users, Heart,
  CreditCard, ShoppingBag, ExternalLink, Wallet, ChevronDown, ChevronUp, Plus,
} from 'lucide-react';
import { format } from 'date-fns';

import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ui/Toast';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useHaptics } from '../hooks/useHaptics';
import { useSocietyContent, iconForName } from '../lib/societyContent';
import { useFavorites } from '../hooks/useFavorites';

/**
 * Profile page — user info, editing, member status, contact, and sign out.
 * @returns {JSX.Element}
 */
export default function Profile() {
  const { user, profile, membership, isAdmin, signOut } = useAuth();
  const toast = useToast();
  const haptics = useHaptics();
  const { benefits, giftCardUrl, giftCardBalanceUrl } = useSocietyContent();
  const { favorites } = useFavorites();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(profile?.full_name || '');
  const [editPhone, setEditPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [houseAccount, setHouseAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [showTransactions, setShowTransactions] = useState(false);
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [topupLoading, setTopupLoading] = useState(false);
  const [favoriteWines, setFavoriteWines] = useState([]);
  const [editBirthday, setEditBirthday] = useState('');
  const [editAnniversary, setEditAnniversary] = useState('');
  const [savingDates, setSavingDates] = useState(false);

  // For couples memberships the shared dining credit lives on the PRIMARY
  // buyer's house_account. The partner has their own auto-created $0 row
  // from the signup trigger, which we ignore for display + top-ups. If the
  // user has no membership row yet, we fall back to their own user id.
  const houseAccountOwnerId = membership?.user_id || user?.id || null;

  /** Fetches house account balance and recent transactions for the
   *  canonical owner (primary, for couples; otherwise self). */
  const fetchHouseAccount = useCallback(async () => {
    if (!houseAccountOwnerId) return;
    const { data: acct } = await supabase
      .from('bocage_house_accounts')
      .select('*')
      .eq('profile_id', houseAccountOwnerId)
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
  }, [houseAccountOwnerId]);

  useEffect(() => { fetchHouseAccount(); }, [fetchHouseAccount]);

  // Handle the return from Square Checkout. Square redirects back with
  // ?topup=success (or cancel) on our success/cancel URL; we surface a
  // toast, refresh the balance, and scrub the query param so a refresh
  // doesn't re-fire the toast.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const topup = params.get('topup');
    if (!topup) return;
    if (topup === 'success') {
      toast.success('Funds added to your house account.');
      haptics.success();
      fetchHouseAccount();
    } else if (topup === 'cancel') {
      toast.info('Top-up cancelled.');
    }
    params.delete('topup');
    const qs = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : ''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Kicks off a Square Online Checkout payment link for a house-account top-up */
  async function startTopup(amountDollars) {
    setTopupLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in again.');
        return;
      }
      const res = await fetch('/api/square/create-payment-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ amount_cents: amountDollars * 100 }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Could not start checkout.');
        return;
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch (e) {
      toast.error('Network error starting checkout.');
    } finally {
      setTopupLoading(false);
    }
  }

  /** Saves updated profile fields */
  async function handleSave() {
    if (!user?.id) {
      toast.error('You appear to be signed out — please sign in again.');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('bocage_profiles')
        .update({
          full_name: editName.trim(),
          phone: editPhone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      if (error) throw error;
      toast.success('Profile updated!');
      haptics.success();
      setEditing(false);
    } catch (err) {
      // Surface the real reason (network / auth / RLS) instead of a generic
      // message, so a failed save is actually diagnosable.
      toast.error(err?.message ? `Couldn't save: ${err.message}` : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  /** Handles sign out with toast */
  async function handleSignOut() {
    await signOut();
    toast.info('You\'ve been signed out.');
  }

  // Load full details for the member's favorited wines (hearted on the menu)
  // so we can list them here. Re-runs whenever the favorites set changes.
  useEffect(() => {
    const ids = [...favorites];
    if (ids.length === 0) { setFavoriteWines([]); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('bocage_wines')
        .select('id, name, producer, region, vintage, price_glass, is_member_pour')
        .in('id', ids);
      if (!cancelled) setFavoriteWines(data || []);
    })();
    return () => { cancelled = true; };
  }, [favorites]);

  // Keep the celebration date inputs in sync if profile/membership load late.
  useEffect(() => { setEditBirthday(profile?.birthday || ''); }, [profile?.birthday]);
  useEffect(() => { setEditAnniversary(membership?.anniversary_date || ''); }, [membership?.anniversary_date]);

  const isCouple = membership?.tier === 'couple';
  const isPrimaryMember = !!user?.id && user.id === membership?.user_id;

  /** Save birthday (on the profile) and, for the primary on a couples plan, the
   *  shared anniversary (on the membership). Only writes fields that changed. */
  async function saveCelebrations() {
    setSavingDates(true);
    try {
      const ops = [];
      if (editBirthday !== (profile?.birthday || '')) {
        ops.push(
          supabase.from('bocage_profiles')
            .update({ birthday: editBirthday || null, updated_at: new Date().toISOString() })
            .eq('id', user.id),
        );
      }
      if (isCouple && isPrimaryMember && editAnniversary !== (membership?.anniversary_date || '')) {
        ops.push(
          supabase.from('bocage_memberships')
            .update({ anniversary_date: editAnniversary || null })
            .eq('id', membership.id),
        );
      }
      if (ops.length === 0) { toast.info('Nothing to save.'); return; }
      const results = await Promise.all(ops);
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
      toast.success('Saved.');
    } catch (e) {
      toast.error(e.message || 'Could not save your dates.');
    } finally {
      setSavingDates(false);
    }
  }

  // Stats for the profile card
  const memberSince = membership?.joined_at
    ? format(new Date(membership.joined_at), 'MMMM yyyy')
    : 'Just joined';

  return (
    <div className="px-4 pt-6 pb-4 max-w-3xl mx-auto">
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

      {/* Celebrations — birthday (everyone) + anniversary (couples). Birthday
          can be added here if it wasn't captured at signup. */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="mb-4"
      >
        <h3 className="font-display text-lg text-white mb-3">Celebrations</h3>
        <div className="glass rounded-xl p-4 space-y-3">
          <div>
            <label className="font-sans text-xs text-noir-400 block mb-1">Your birthday</label>
            <input
              type="date"
              value={editBirthday}
              onChange={(e) => setEditBirthday(e.target.value)}
              className="w-full bg-noir-800 border border-noir-700 rounded-lg px-3 py-2 text-white font-sans text-sm focus:outline-none focus:border-champagne-500"
            />
            {!profile?.birthday && (
              <p className="font-sans text-[11px] text-champagne-500/80 mt-1">
                Add your birthday so we can celebrate it with you.
              </p>
            )}
          </div>

          {isCouple && (
            <div>
              <label className="font-sans text-xs text-noir-400 block mb-1">
                Anniversary <span className="text-noir-500">(optional)</span>
              </label>
              {isPrimaryMember ? (
                <input
                  type="date"
                  value={editAnniversary}
                  onChange={(e) => setEditAnniversary(e.target.value)}
                  className="w-full bg-noir-800 border border-noir-700 rounded-lg px-3 py-2 text-white font-sans text-sm focus:outline-none focus:border-champagne-500"
                />
              ) : (
                <p className="font-sans text-sm text-white">
                  {membership?.anniversary_date
                    ? format(new Date(membership.anniversary_date + 'T00:00:00'), 'MMMM d')
                    : 'Not set — your partner can add it.'}
                </p>
              )}
            </div>
          )}

          <button
            onClick={saveCelebrations}
            disabled={savingDates}
            className="px-4 py-2 rounded-lg bg-champagne-500 text-noir-900 font-sans text-xs font-semibold hover:bg-champagne-400 disabled:opacity-50 transition-colors"
          >
            {savingDates ? 'Saving…' : 'Save'}
          </button>
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

        {/* Add funds CTA — always visible so members can top up whether
            the balance is zero or just running low. Opens an amount picker
            that redirects to Stripe-hosted Checkout. */}
        <div className="px-4 pb-4 border-t border-noir-700 pt-3">
          {!addFundsOpen && (
            <>
              <button
                onClick={() => setAddFundsOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-champagne-500 text-noir-900 font-sans text-xs font-semibold hover:bg-champagne-400 transition-colors"
              >
                <Plus size={14} />
                Add funds
              </button>
              <p className="font-sans text-[10px] text-noir-500 mt-2 leading-snug">
                Secure checkout by Square. Funds are available at the bar immediately.
              </p>
            </>
          )}

          {addFundsOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="font-sans text-xs text-noir-300 mb-3 leading-snug">
                Choose an amount to add to your house account.
              </p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[25, 50, 100, 150, 200, 500].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => startTopup(amt)}
                    disabled={topupLoading}
                    className="py-3 rounded-lg border border-champagne-500/30 bg-noir-800/50 flex items-center justify-center font-display text-base text-gradient-gold active:scale-95 transition-transform disabled:opacity-50"
                  >
                    ${amt}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setAddFundsOpen(false)}
                disabled={topupLoading}
                className="text-[11px] font-sans text-noir-400 hover:text-noir-200 transition-colors"
              >
                Cancel
              </button>
              {topupLoading && (
                <p className="font-sans text-[11px] text-champagne-500 mt-2">Redirecting to secure checkout…</p>
              )}
            </motion.div>
          )}
        </div>

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
          {benefits.map(({ icon, title, body }, i) => {
            const Icon = iconForName(icon);
            return (
              <div key={title + i} className="glass rounded-xl p-3 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-champagne-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon size={14} className="text-champagne-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm text-white">{title}</p>
                  <p className="font-serif text-xs text-noir-400 mt-0.5 leading-relaxed">{body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* My favorites — wines the member hearted from the menu / member pours. */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        className="mb-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg text-white">Your Favorites</h3>
          <Link to="/" className="font-sans text-xs text-champagne-500 hover:text-champagne-400">
            Browse menu
          </Link>
        </div>
        {favoriteWines.length === 0 ? (
          <div className="glass rounded-xl p-4 text-center">
            <Wine size={22} className="text-noir-500 mx-auto mb-2" />
            <p className="font-sans text-xs text-noir-400">
              Tap the heart on any wine to save it here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {favoriteWines.map((w) => (
              <div key={w.id} className="glass rounded-xl p-3 flex items-center gap-3">
                <Heart size={14} className="text-rose-500 flex-shrink-0" fill="currentColor" />
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm text-white truncate">
                    {w.name}
                    {w.is_member_pour && (
                      <span className="ml-1.5 font-sans text-[10px] uppercase tracking-wider text-champagne-500/80">
                        pour
                      </span>
                    )}
                  </p>
                  <p className="font-sans text-xs text-noir-400 truncate">
                    {[w.producer, w.region, w.vintage || (w.is_member_pour ? 'NV' : null)]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                {w.price_glass != null && (
                  <span className="font-sans text-sm text-champagne-500 whitespace-nowrap">
                    ${Number(w.price_glass).toFixed(0)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Gift cards — buy a gift card in ANY amount, or check a card balance.
          The value is chosen on Toast's hosted checkout (one custom-amount CTA,
          no fixed denominations — Bocage sells gift cards at any amount). */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass rounded-2xl p-5 mb-4 border border-champagne-500/20"
      >
        <div className="flex items-center gap-2 mb-1">
          <Gift size={18} className="text-champagne-500" />
          <h3 className="font-display text-lg text-white">Gift Cards</h3>
        </div>
        <p className="font-sans text-xs text-noir-400 mb-4">
          Give the gift of Bocage, in any amount — delivered by email. You
          choose the value at checkout.
        </p>

        {/* Single custom-amount CTA — no fixed denominations. */}
        <a
          href={giftCardUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-1.5 py-3 rounded-lg bg-champagne-500 text-noir-900 font-sans text-sm font-semibold hover:bg-champagne-400 transition-colors"
        >
          <Gift size={14} />
          Buy a gift card — any amount
          <ExternalLink size={12} />
        </a>

        {/* Secondary: check the balance of an existing card. */}
        <a
          href={giftCardBalanceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 text-champagne-500 font-sans text-xs font-semibold hover:underline"
        >
          <CreditCard size={13} />
          Check a card balance
          <ExternalLink size={11} />
        </a>
      </motion.div>

      {/* Quick links — ordering + reservations */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="mb-4"
      >
        <h3 className="font-display text-lg text-white mb-3">Quick Links</h3>
        <div className="grid grid-cols-2 gap-3">
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
          <a href="mailto:clark@bocagechampagnebar.com" className="flex items-center gap-3 text-sm font-sans text-noir-300 hover:text-white transition-colors">
            <Mail size={16} className="text-champagne-600 flex-shrink-0" />
            clark@bocagechampagnebar.com
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

      {/* Legal + return-to-site footer */}
      <div className="mt-8 flex items-center justify-center gap-4 text-[11px] font-sans text-noir-500">
        <Link to="/privacy" className="hover:text-champagne-500 transition-colors">Privacy</Link>
        <span className="text-noir-700">·</span>
        <Link to="/terms" className="hover:text-champagne-500 transition-colors">Terms</Link>
        <span className="text-noir-700">·</span>
        <a
          href="https://bocagechampagnebar.com/"
          className="hover:text-champagne-500 transition-colors"
        >
          Main site
        </a>
      </div>

      {/* App version */}
      <p className="text-center text-xs text-noir-600 font-sans mt-3">
        Bocage Society v1.2.0
      </p>
    </div>
  );
}
