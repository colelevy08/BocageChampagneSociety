/**
 * @file src/pages/AdminCRM.jsx
 * @description Admin CRM page for Bocage Champagne Society.
 * Shows all members (single-product membership — no tiers, no points),
 * pending at-home bookings, and event booking activity.
 * Admin-only — non-admins see an empty state.
 * @importedBy src/App.jsx (route: /admin/crm, guarded by isAdmin)
 * @imports src/lib/supabase.js, src/context/AuthContext.jsx,
 *          src/components/ui/*, framer-motion, lucide-react, date-fns
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Crown, Calendar, Home, Search,
  RefreshCw, ChevronDown, ChevronUp, Phone,
  Clock, Check, X, Package, Wallet, Plus, Minus,
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';

/** Status badge color mapping for at-home bookings */
const STATUS_COLORS = {
  pending:   'bg-champagne-500/20 text-champagne-300 border border-champagne-500/30',
  confirmed: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  cancelled: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
  completed: 'bg-noir-500/30 text-noir-300 border border-noir-600',
};

/**
 * AdminCRM — member management, at-home booking queue, and event booking log.
 * @returns {JSX.Element}
 */
export default function AdminCRM() {
  const { isAdmin } = useAuth();
  const toast = useToast();

  const [tab, setTab] = useState('members'); // 'members' | 'athome' | 'events'
  const [members, setMembers] = useState([]);
  const [atHomeBookings, setAtHomeBookings] = useState([]);
  const [eventBookings, setEventBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedMember, setExpandedMember] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [houseAccounts, setHouseAccounts] = useState({});
  const [creditAmount, setCreditAmount] = useState('');
  const [creditNote, setCreditNote] = useState('');
  const [creditType, setCreditType] = useState('credit');
  const [creditLoading, setCreditLoading] = useState(false);

  /**
   * Fetches all CRM data in parallel: members, at-home bookings, event bookings.
   */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [membersRes, atHomeRes, eventRes] = await Promise.all([
      supabase
        .from('bocage_memberships')
        .select(`
          *,
          bocage_profiles ( id, full_name, phone, role, created_at )
        `)
        .order('joined_at', { ascending: false }),

      supabase
        .from('bocage_at_home_bookings')
        .select(`*, bocage_profiles ( full_name, phone )`)
        .order('created_at', { ascending: false }),

      supabase
        .from('bocage_event_bookings')
        .select(`
          *,
          bocage_events ( title, event_date ),
          bocage_profiles ( full_name )
        `)
        .order('booked_at', { ascending: false })
        .limit(100),
    ]);

    if (membersRes.data) setMembers(membersRes.data);
    if (atHomeRes.data)  setAtHomeBookings(atHomeRes.data);
    if (eventRes.data)   setEventBookings(eventRes.data);

    // Fetch house accounts keyed by profile_id
    const { data: accts } = await supabase
      .from('bocage_house_accounts')
      .select('*');
    if (accts) {
      const map = {};
      for (const a of accts) map[a.profile_id] = a;
      setHouseAccounts(map);
    }

    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /**
   * Updates the status of an at-home booking.
   * @param {string} id - Booking ID
   * @param {string} status - New status value
   */
  async function updateBookingStatus(id, status) {
    setUpdatingId(id);
    const { error } = await supabase
      .from('bocage_at_home_bookings')
      .update({ status })
      .eq('id', id);
    if (error) {
      toast.error('Failed to update status.');
    } else {
      toast.success(`Booking marked as ${status}.`);
      fetchAll();
    }
    setUpdatingId(null);
  }

  /**
   * Credits or debits a member's house account.
   * Creates the account if it doesn't exist yet.
   */
  async function handleHouseAccountAction(profileId) {
    const amt = parseFloat(creditAmount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount.'); return; }
    setCreditLoading(true);

    let acct = houseAccounts[profileId];

    // Create account if it doesn't exist
    if (!acct) {
      const { data, error } = await supabase
        .from('bocage_house_accounts')
        .insert({ profile_id: profileId, balance: 0 })
        .select()
        .single();
      if (error) { toast.error('Failed to create account.'); setCreditLoading(false); return; }
      acct = data;
    }

    // Calculate new balance
    const delta = creditType === 'debit' ? -amt : amt;
    const newBalance = Number(acct.balance) + delta;
    if (newBalance < 0) { toast.error('Insufficient balance for debit.'); setCreditLoading(false); return; }

    // Update balance + insert transaction
    const [balRes, txRes] = await Promise.all([
      supabase
        .from('bocage_house_accounts')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('id', acct.id),
      supabase
        .from('bocage_house_transactions')
        .insert({
          account_id: acct.id,
          amount: amt,
          type: creditType,
          description: creditNote || (creditType === 'credit' ? 'Account credit' : 'Account debit'),
        }),
    ]);

    if (balRes.error || txRes.error) {
      toast.error('Failed to update account.');
    } else {
      toast.success(`$${amt.toFixed(2)} ${creditType} applied.`);
      setCreditAmount('');
      setCreditNote('');
      fetchAll();
    }
    setCreditLoading(false);
  }

  // ── Derived data ──────────────────────────────────────────────────────────
  const filteredMembers = members.filter((m) => {
    const q = search.toLowerCase();
    return !q || m.bocage_profiles?.full_name?.toLowerCase().includes(q);
  });

  const stats = {
    total: members.length,
    admins: members.filter((m) => m.bocage_profiles?.role === 'admin').length,
    pendingAtHome: atHomeBookings.filter((b) => b.status === 'pending').length,
    upcomingEvents: eventBookings.filter((b) => b.status === 'confirmed').length,
  };

  if (!isAdmin) {
    return (
      <EmptyState
        icon={<Package className="text-noir-500" size={32} />}
        title="Admin access required"
        description="Contact an administrator for access"
      />
    );
  }

  return (
    <div className="px-4 pt-6 pb-4">
      <PageHeader
        title="CRM"
        subtitle="Member Management"
        action={
          <button
            onClick={fetchAll}
            className="p-2 text-noir-400 hover:text-champagne-500 transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        }
      />

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {[
          { label: 'Members',  value: stats.total,          color: 'text-champagne-400' },
          { label: 'Admins',   value: stats.admins,         color: 'text-champagne-300' },
          { label: 'Pending',  value: stats.pendingAtHome,  color: 'text-amber-400'     },
          { label: 'Booked',   value: stats.upcomingEvents, color: 'text-emerald-400'   },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-xl p-2 text-center"
          >
            <p className={`font-display text-lg ${s.color}`}>{s.value}</p>
            <p className="font-sans text-[10px] text-noir-500 leading-tight">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-4 bg-noir-800 rounded-xl p-1">
        {[
          { key: 'members', label: 'Members',   icon: Users    },
          { key: 'athome',  label: 'At-Home',   icon: Home     },
          { key: 'events',  label: 'Events',    icon: Calendar },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-sans text-xs transition-all ${
              tab === key
                ? 'bg-champagne-500 text-noir-900 font-semibold'
                : 'text-noir-400 hover:text-white'
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* ── MEMBERS TAB ── */}
      {tab === 'members' && (
        <div>
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-noir-400" size={15} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name..."
              className="w-full bg-noir-800 border border-noir-700 rounded-lg pl-9 pr-4 py-2.5 text-white font-sans text-sm placeholder:text-noir-500 focus:outline-none focus:border-champagne-500"
            />
          </div>
          <p className="text-xs font-sans text-noir-500 mb-3">{filteredMembers.length} members</p>

          {loading && (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 skeleton rounded-xl" />
              ))}
            </div>
          )}

          {!loading && filteredMembers.length === 0 && (
            <EmptyState
              icon={<Users className="text-noir-500" size={28} />}
              title="No members yet"
              description="Members will appear here after signing up"
            />
          )}

          <div className="space-y-2">
            {filteredMembers.map((m) => {
              const isExpanded = expandedMember === m.user_id;
              const joined = m.joined_at || m.bocage_profiles?.created_at;

              return (
                <motion.div
                  key={m.user_id}
                  layout
                  className="glass rounded-xl overflow-hidden"
                >
                  {/* Row */}
                  <button
                    className="w-full flex items-center gap-3 p-3 text-left"
                    onClick={() => setExpandedMember(isExpanded ? null : m.user_id)}
                  >
                    {/* Member icon */}
                    <div className="w-9 h-9 rounded-full bg-champagne-500/10 flex items-center justify-center flex-shrink-0">
                      <Crown size={16} className="text-champagne-500" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-display text-sm text-white truncate">
                        {m.bocage_profiles?.full_name || 'Unnamed Member'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock size={11} className="text-noir-500" />
                        <span className="font-sans text-xs text-noir-400">
                          Joined {joined ? format(new Date(joined), 'MMM d, yyyy') : '—'}
                        </span>
                      </div>
                    </div>

                    {isExpanded
                      ? <ChevronUp size={15} className="text-noir-500 flex-shrink-0" />
                      : <ChevronDown size={15} className="text-noir-500 flex-shrink-0" />
                    }
                  </button>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 border-t border-noir-700 pt-3 space-y-3">
                          {/* Contact info */}
                          <div className="flex items-center gap-3 text-xs font-sans flex-wrap">
                            {m.bocage_profiles?.phone && (
                              <div className="flex items-center gap-1.5 text-noir-400">
                                <Phone size={11} />
                                {m.bocage_profiles.phone}
                              </div>
                            )}
                            {m.bocage_profiles?.role === 'admin' && (
                              <Badge variant="gold" size="sm">Admin</Badge>
                            )}
                          </div>

                          {/* House account */}
                          <div className="bg-noir-800 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5">
                                <Wallet size={13} className="text-champagne-500" />
                                <span className="font-sans text-xs text-noir-300">House Account</span>
                              </div>
                              <span className="font-display text-base text-white">
                                ${Number(houseAccounts[m.user_id]?.balance || 0).toFixed(2)}
                              </span>
                            </div>

                            {/* Credit/debit form */}
                            <div className="flex gap-1.5 mb-2">
                              <button
                                onClick={() => setCreditType('credit')}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-sans transition-colors ${
                                  creditType === 'credit'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-noir-700 text-noir-400 border border-noir-600'
                                }`}
                              >
                                <Plus size={10} /> Credit
                              </button>
                              <button
                                onClick={() => setCreditType('debit')}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-sans transition-colors ${
                                  creditType === 'debit'
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                    : 'bg-noir-700 text-noir-400 border border-noir-600'
                                }`}
                              >
                                <Minus size={10} /> Debit
                              </button>
                            </div>
                            <div className="flex gap-1.5">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={creditAmount}
                                onChange={(e) => setCreditAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-20 bg-noir-700 border border-noir-600 rounded px-2 py-1.5 text-white font-sans text-xs focus:outline-none focus:border-champagne-500"
                              />
                              <input
                                type="text"
                                value={creditNote}
                                onChange={(e) => setCreditNote(e.target.value)}
                                placeholder="Note (optional)"
                                className="flex-1 bg-noir-700 border border-noir-600 rounded px-2 py-1.5 text-white font-sans text-xs placeholder:text-noir-500 focus:outline-none focus:border-champagne-500"
                              />
                              <button
                                disabled={creditLoading || !creditAmount}
                                onClick={() => handleHouseAccountAction(m.user_id)}
                                className="px-3 py-1.5 rounded bg-champagne-500 text-noir-900 font-sans text-xs font-medium disabled:opacity-40 hover:bg-champagne-400 transition-colors"
                              >
                                {creditLoading ? '...' : 'Apply'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── AT-HOME BOOKINGS TAB ── */}
      {tab === 'athome' && (
        <div className="space-y-3">
          {loading && (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-24 skeleton rounded-xl" />)}
            </div>
          )}

          {!loading && atHomeBookings.length === 0 && (
            <EmptyState
              icon={<Home className="text-noir-500" size={28} />}
              title="No at-home bookings yet"
              description="Booking requests will appear here"
            />
          )}

          {atHomeBookings.map((b) => (
            <motion.div
              key={b.id}
              layout
              className="glass rounded-xl p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm text-white">
                    {b.bocage_profiles?.full_name || 'Unknown Member'}
                  </p>
                  <p className="font-sans text-xs text-champagne-500 mt-0.5 capitalize">
                    {b.service_tier?.replace(/-/g, ' ')}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full font-sans text-xs capitalize flex-shrink-0 ${STATUS_COLORS[b.status] || STATUS_COLORS.pending}`}>
                  {b.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-sans text-xs text-noir-400">
                {b.preferred_date && (
                  <div className="flex items-center gap-1.5">
                    <Calendar size={11} />
                    {format(new Date(b.preferred_date), 'MMM d, yyyy')}
                  </div>
                )}
                {b.guest_count && (
                  <div className="flex items-center gap-1.5">
                    <Users size={11} />
                    {b.guest_count} guests
                  </div>
                )}
                {b.location && (
                  <div className="flex items-center gap-1.5 col-span-2 truncate">
                    <Home size={11} className="flex-shrink-0" />
                    <span className="truncate">{b.location}</span>
                  </div>
                )}
                {b.bocage_profiles?.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone size={11} />
                    {b.bocage_profiles.phone}
                  </div>
                )}
              </div>

              {b.notes && (
                <p className="font-sans text-xs text-noir-400 italic bg-noir-800/60 rounded-lg px-2.5 py-2">
                  "{b.notes}"
                </p>
              )}

              {/* Status actions */}
              {b.status === 'pending' && (
                <div className="flex gap-2 pt-1">
                  <button
                    disabled={updatingId === b.id}
                    onClick={() => updateBookingStatus(b.id, 'confirmed')}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-sans text-xs hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
                  >
                    <Check size={11} /> Confirm
                  </button>
                  <button
                    disabled={updatingId === b.id}
                    onClick={() => updateBookingStatus(b.id, 'cancelled')}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 font-sans text-xs hover:bg-rose-500/25 transition-colors disabled:opacity-50"
                  >
                    <X size={11} /> Cancel
                  </button>
                </div>
              )}
              {b.status === 'confirmed' && (
                <button
                  disabled={updatingId === b.id}
                  onClick={() => updateBookingStatus(b.id, 'completed')}
                  className="w-full py-1.5 rounded-lg bg-noir-700 border border-noir-600 text-noir-300 font-sans text-xs hover:bg-noir-600 transition-colors disabled:opacity-50"
                >
                  Mark Completed
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* ── EVENT BOOKINGS TAB ── */}
      {tab === 'events' && (
        <div className="space-y-2">
          {loading && (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => <div key={i} className="h-14 skeleton rounded-xl" />)}
            </div>
          )}

          {!loading && eventBookings.length === 0 && (
            <EmptyState
              icon={<Calendar className="text-noir-500" size={28} />}
              title="No event bookings yet"
              description="RSVPs will appear here as members book events"
            />
          )}

          {eventBookings.map((b) => (
            <div key={b.id} className="glass rounded-xl px-3 py-2.5 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-display text-sm text-white truncate">
                  {b.bocage_profiles?.full_name || 'Unknown Member'}
                </p>
                <p className="font-sans text-xs text-noir-400 truncate mt-0.5">
                  {b.bocage_events?.title || 'Unknown Event'}
                  {b.bocage_events?.event_date && (
                    <span className="text-noir-600">
                      {' · '}{format(new Date(b.bocage_events.event_date), 'MMM d')}
                    </span>
                  )}
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded-full font-sans text-xs flex-shrink-0 ${STATUS_COLORS[b.status] || STATUS_COLORS.pending}`}>
                {b.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
