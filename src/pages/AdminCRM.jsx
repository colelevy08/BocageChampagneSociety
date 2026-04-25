/**
 * @file src/pages/AdminCRM.jsx
 * @description Admin CRM page for Bocage Champagne Society. Fully editable.
 * Three tabs:
 *   - Members: edit name/phone, toggle admin role, credit/debit house account.
 *   - Events: create / edit / delete events, view RSVPs.
 *   - At-Home: edit full booking details (tier/date/guests/location/notes/status).
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
  Edit3, Trash2, Save, Shield, ShieldOff, MapPin, Image, Eye, EyeOff,
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';

/** Status badge color mapping */
const STATUS_COLORS = {
  pending:   'bg-champagne-500/20 text-champagne-300 border border-champagne-500/30',
  confirmed: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  cancelled: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
  completed: 'bg-noir-500/30 text-noir-300 border border-noir-600',
};

/** Convert a timestamptz string to a value the datetime-local input accepts */
function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 16);
}

/** Convert a date-only string for the date input */
function toDateInput(d) {
  if (!d) return '';
  return d.length >= 10 ? d.slice(0, 10) : '';
}

const EMPTY_EVENT = {
  title: '',
  description: '',
  event_date: '',
  location: '10 Phila St, Saratoga Springs',
  image_url: '',
  max_seats: '',
  seats_remaining: '',
  price: '',
  is_active: true,
};

/**
 * AdminCRM — full editing for members, events, and at-home bookings.
 * @returns {JSX.Element}
 */
export default function AdminCRM() {
  const { isAdmin, user } = useAuth();
  const toast = useToast();

  const [tab, setTab] = useState('members'); // 'members' | 'events' | 'athome'
  const [eventsTab, setEventsTab] = useState('manage'); // 'manage' | 'bookings'

  // Data
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventBookings, setEventBookings] = useState([]);
  const [atHomeBookings, setAtHomeBookings] = useState([]);
  const [houseAccounts, setHouseAccounts] = useState({});

  // UI state
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedMember, setExpandedMember] = useState(null);
  const [expandedBooking, setExpandedBooking] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // Member edit
  const [editingMember, setEditingMember] = useState(null); // user_id when editing
  const [memberForm, setMemberForm] = useState({ full_name: '', phone: '', joined_at: '' });

  // House account
  const [creditAmount, setCreditAmount] = useState('');
  const [creditNote, setCreditNote] = useState('');
  const [creditType, setCreditType] = useState('credit');
  const [creditLoading, setCreditLoading] = useState(false);

  // Event edit / create
  const [editingEvent, setEditingEvent] = useState(null); // null | 'new' | <event_id>
  const [eventForm, setEventForm] = useState(EMPTY_EVENT);

  // At-home edit
  const [editingBooking, setEditingBooking] = useState(null); // booking id
  const [bookingForm, setBookingForm] = useState({});

  /** Fetches all CRM data in parallel */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [membersRes, eventsRes, eventBookingsRes, atHomeRes, acctsRes] = await Promise.all([
      supabase
        .from('bocage_memberships')
        .select(`*, bocage_profiles ( id, full_name, phone, role, created_at )`)
        .order('joined_at', { ascending: false }),
      supabase
        .from('bocage_events')
        .select('*')
        .order('event_date', { ascending: false, nullsFirst: false }),
      supabase
        .from('bocage_event_bookings')
        .select(`*, bocage_events ( title, event_date ), bocage_profiles ( full_name )`)
        .order('booked_at', { ascending: false })
        .limit(200),
      supabase
        .from('bocage_at_home_bookings')
        .select(`*, bocage_profiles ( full_name, phone )`)
        .order('created_at', { ascending: false }),
      supabase
        .from('bocage_house_accounts')
        .select('*'),
    ]);

    if (membersRes.data)       setMembers(membersRes.data);
    if (eventsRes.data)        setEvents(eventsRes.data);
    if (eventBookingsRes.data) setEventBookings(eventBookingsRes.data);
    if (atHomeRes.data)        setAtHomeBookings(atHomeRes.data);

    if (acctsRes.data) {
      const map = {};
      for (const a of acctsRes.data) map[a.profile_id] = a;
      setHouseAccounts(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─────────────────────── Member edits ───────────────────────

  function startEditingMember(m) {
    setEditingMember(m.user_id);
    setMemberForm({
      full_name: m.bocage_profiles?.full_name || '',
      phone: m.bocage_profiles?.phone || '',
      joined_at: toDateInput(m.joined_at),
    });
  }

  async function saveMember(profileId, membershipId) {
    setUpdatingId(profileId);
    const profilePromise = supabase
      .from('bocage_profiles')
      .update({
        full_name: memberForm.full_name.trim(),
        phone: memberForm.phone.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId);

    // Only update membership row if joined_at changed and we have a membership row
    const promises = [profilePromise];
    if (membershipId && memberForm.joined_at) {
      promises.push(
        supabase
          .from('bocage_memberships')
          .update({
            joined_at: new Date(memberForm.joined_at + 'T12:00:00').toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', membershipId),
      );
    }

    const results = await Promise.all(promises);
    const err = results.find(r => r.error)?.error;
    if (err) toast.error(`Failed to save member: ${err.message}`);
    else { toast.success('Member updated.'); setEditingMember(null); fetchAll(); }
    setUpdatingId(null);
  }

  async function toggleAdmin(profileId, currentRole) {
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    if (profileId === user?.id && newRole === 'member') {
      if (!confirm("This will remove your own admin access. Continue?")) return;
    }
    setUpdatingId(profileId);
    const { error } = await supabase
      .from('bocage_profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', profileId);
    if (error) toast.error('Failed to change role.');
    else { toast.success(`Role set to ${newRole}.`); fetchAll(); }
    setUpdatingId(null);
  }

  /**
   * Removes a member from the Society — clears the bocage_* rows but
   * leaves the auth.users row intact (deleting an auth user requires
   * service-role access, which the client SDK doesn't have). Practically
   * this means the email can sign up again fresh; their old data is gone.
   */
  async function deleteMember(m) {
    const name = m.bocage_profiles?.full_name || 'this member';
    if (!confirm(
      `Remove ${name} from the Society?\n\n` +
      `This deletes their profile, membership, house-account balance + history, ` +
      `event RSVPs, and at-home bookings. The auth login still exists; if they ` +
      `sign in again they'll start over with a blank profile.`
    )) return;

    setUpdatingId(m.user_id);
    // Delete in dependency order: house transactions cascade with the
    // account, but the other tables reference auth.users(id) directly,
    // so we have to clear them explicitly.
    const acct = houseAccounts[m.user_id];
    const ops = [];
    if (acct) {
      ops.push(supabase.from('bocage_house_transactions').delete().eq('account_id', acct.id));
      ops.push(supabase.from('bocage_house_accounts').delete().eq('id', acct.id));
    }
    ops.push(supabase.from('bocage_event_bookings').delete().eq('user_id', m.user_id));
    ops.push(supabase.from('bocage_at_home_bookings').delete().eq('user_id', m.user_id));
    ops.push(supabase.from('bocage_memberships').delete().eq('user_id', m.user_id));
    ops.push(supabase.from('bocage_profiles').delete().eq('id', m.user_id));

    const results = await Promise.all(ops);
    const err = results.find(r => r.error)?.error;
    if (err) toast.error(`Delete failed: ${err.message}`);
    else { toast.success(`${name} removed.`); setExpandedMember(null); fetchAll(); }
    setUpdatingId(null);
  }

  /** Credit or debit a member's house account. Auto-creates the row if absent. */
  async function handleHouseAccountAction(profileId) {
    const amt = parseFloat(creditAmount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount.'); return; }
    setCreditLoading(true);

    let acct = houseAccounts[profileId];
    if (!acct) {
      const { data, error } = await supabase
        .from('bocage_house_accounts')
        .insert({ profile_id: profileId, balance: 0 })
        .select()
        .single();
      if (error) { toast.error('Failed to create account.'); setCreditLoading(false); return; }
      acct = data;
    }

    const delta = creditType === 'debit' ? -amt : amt;
    const newBalance = Number(acct.balance) + delta;
    if (newBalance < 0) { toast.error('Insufficient balance for debit.'); setCreditLoading(false); return; }

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

    if (balRes.error || txRes.error) toast.error('Failed to update account.');
    else {
      toast.success(`$${amt.toFixed(2)} ${creditType} applied.`);
      setCreditAmount(''); setCreditNote('');
      fetchAll();
    }
    setCreditLoading(false);
  }

  // ─────────────────────── Event CRUD ───────────────────────

  function startNewEvent() {
    setEditingEvent('new');
    setEventForm(EMPTY_EVENT);
  }

  function startEditingEvent(e) {
    setEditingEvent(e.id);
    setEventForm({
      title: e.title || '',
      description: e.description || '',
      event_date: toLocalInput(e.event_date),
      location: e.location || '',
      image_url: e.image_url || '',
      max_seats: e.max_seats ?? '',
      seats_remaining: e.seats_remaining ?? '',
      price: e.price ?? '',
      is_active: e.is_active ?? true,
    });
  }

  function cancelEventEdit() {
    setEditingEvent(null);
    setEventForm(EMPTY_EVENT);
  }

  async function saveEvent() {
    if (!eventForm.title.trim()) { toast.error('Title is required.'); return; }
    setUpdatingId(editingEvent);

    const payload = {
      title: eventForm.title.trim(),
      description: eventForm.description.trim() || null,
      event_date: eventForm.event_date ? new Date(eventForm.event_date).toISOString() : null,
      location: eventForm.location.trim() || null,
      image_url: eventForm.image_url.trim() || null,
      max_seats: eventForm.max_seats === '' ? null : parseInt(eventForm.max_seats, 10),
      seats_remaining: eventForm.seats_remaining === '' ? null : parseInt(eventForm.seats_remaining, 10),
      price: eventForm.price === '' ? null : parseFloat(eventForm.price),
      is_active: !!eventForm.is_active,
    };

    let err;
    if (editingEvent === 'new') {
      ({ error: err } = await supabase.from('bocage_events').insert(payload));
    } else {
      ({ error: err } = await supabase.from('bocage_events').update(payload).eq('id', editingEvent));
    }

    if (err) toast.error(`Save failed: ${err.message}`);
    else {
      toast.success(editingEvent === 'new' ? 'Event created.' : 'Event saved.');
      cancelEventEdit();
      fetchAll();
    }
    setUpdatingId(null);
  }

  async function toggleEventActive(e) {
    setUpdatingId(e.id);
    const { error } = await supabase
      .from('bocage_events')
      .update({ is_active: !e.is_active })
      .eq('id', e.id);
    if (error) toast.error('Failed to toggle.');
    else { toast.success(e.is_active ? 'Event hidden.' : 'Event published.'); fetchAll(); }
    setUpdatingId(null);
  }

  async function deleteEvent(e) {
    if (!confirm(`Delete "${e.title}"? Existing RSVPs will be deleted too.`)) return;
    setUpdatingId(e.id);
    const { error } = await supabase.from('bocage_events').delete().eq('id', e.id);
    if (error) toast.error(`Delete failed: ${error.message}`);
    else { toast.success('Event deleted.'); fetchAll(); }
    setUpdatingId(null);
  }

  // ─────────────────────── RSVP mutations ───────────────────────

  async function updateRsvpStatus(rsvpId, status) {
    setUpdatingId(rsvpId);
    const { error } = await supabase
      .from('bocage_event_bookings')
      .update({ status })
      .eq('id', rsvpId);
    if (error) toast.error('Failed to update RSVP.');
    else { toast.success(`RSVP marked ${status}.`); fetchAll(); }
    setUpdatingId(null);
  }

  async function deleteRsvp(rsvp) {
    const member = rsvp.bocage_profiles?.full_name || 'this member';
    const event = rsvp.bocage_events?.title || 'this event';
    if (!confirm(`Remove ${member}'s RSVP for ${event}?`)) return;
    setUpdatingId(rsvp.id);
    const { error } = await supabase
      .from('bocage_event_bookings')
      .delete()
      .eq('id', rsvp.id);
    if (error) toast.error(`Delete failed: ${error.message}`);
    else { toast.success('RSVP removed.'); fetchAll(); }
    setUpdatingId(null);
  }

  // ─────────────────────── At-home booking edits ───────────────────────

  function startEditingBooking(b) {
    setEditingBooking(b.id);
    setBookingForm({
      service_tier:   b.service_tier   || '',
      preferred_date: toDateInput(b.preferred_date),
      guest_count:    b.guest_count ?? '',
      location:       b.location       || '',
      notes:          b.notes          || '',
      status:         b.status         || 'pending',
    });
  }

  async function saveBooking(id) {
    setUpdatingId(id);
    const payload = {
      service_tier:   bookingForm.service_tier?.trim() || null,
      preferred_date: bookingForm.preferred_date || null,
      guest_count:    bookingForm.guest_count === '' ? null : parseInt(bookingForm.guest_count, 10),
      location:       bookingForm.location?.trim()    || null,
      notes:          bookingForm.notes?.trim()       || null,
      status:         bookingForm.status              || 'pending',
    };
    const { error } = await supabase.from('bocage_at_home_bookings').update(payload).eq('id', id);
    if (error) toast.error(`Save failed: ${error.message}`);
    else { toast.success('Booking updated.'); setEditingBooking(null); fetchAll(); }
    setUpdatingId(null);
  }

  async function updateBookingStatus(id, status) {
    setUpdatingId(id);
    const { error } = await supabase
      .from('bocage_at_home_bookings')
      .update({ status })
      .eq('id', id);
    if (error) toast.error('Failed to update status.');
    else { toast.success(`Marked ${status}.`); fetchAll(); }
    setUpdatingId(null);
  }

  async function deleteBooking(b) {
    if (!confirm(`Delete this booking from ${b.bocage_profiles?.full_name || 'this member'}?`)) return;
    setUpdatingId(b.id);
    const { error } = await supabase.from('bocage_at_home_bookings').delete().eq('id', b.id);
    if (error) toast.error(`Delete failed: ${error.message}`);
    else { toast.success('Booking deleted.'); fetchAll(); }
    setUpdatingId(null);
  }

  // ─────────────────────── Derived ───────────────────────

  const filteredMembers = members.filter((m) => {
    const q = search.toLowerCase();
    if (!q) return true;
    const name  = m.bocage_profiles?.full_name?.toLowerCase() || '';
    const phone = m.bocage_profiles?.phone?.toLowerCase() || '';
    return name.includes(q) || phone.includes(q);
  });

  const stats = {
    total: members.length,
    admins: members.filter((m) => m.bocage_profiles?.role === 'admin').length,
    pendingAtHome: atHomeBookings.filter((b) => b.status === 'pending').length,
    upcomingEvents: events.filter((e) => e.is_active && e.event_date && new Date(e.event_date) > new Date()).length,
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

  // ─────────────────────── Render ───────────────────────

  return (
    <div className="px-4 pt-6 pb-4">
      <PageHeader
        title="CRM"
        subtitle="Member &amp; Event Management"
        action={
          <button
            onClick={fetchAll}
            className="p-2 text-noir-400 hover:text-champagne-500 transition-colors"
            aria-label="Refresh"
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
          { label: 'Upcoming', value: stats.upcomingEvents, color: 'text-emerald-400'   },
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
          { key: 'members', label: 'Members', icon: Users    },
          { key: 'events',  label: 'Events',  icon: Calendar },
          { key: 'athome',  label: 'At-Home', icon: Home     },
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

      {/* ─────────────────── MEMBERS TAB ─────────────────── */}
      {tab === 'members' && (
        <div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-noir-400" size={15} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or phone..."
              className="w-full bg-noir-800 border border-noir-700 rounded-lg pl-9 pr-4 py-2.5 text-white font-sans text-sm placeholder:text-noir-500 focus:outline-none focus:border-champagne-500"
            />
          </div>
          <p className="text-xs font-sans text-noir-500 mb-3">{filteredMembers.length} members</p>

          {loading && <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}</div>}

          {!loading && filteredMembers.length === 0 && (
            <EmptyState
              icon={<Users className="text-noir-500" size={28} />}
              title="No members yet"
              description="Members will appear here after signing up"
            />
          )}

          <div className="space-y-2">
            {filteredMembers.map((m) => {
              const profile = m.bocage_profiles || {};
              const isExpanded = expandedMember === m.user_id;
              const isEditing  = editingMember  === m.user_id;
              const joined = m.joined_at || profile.created_at;
              const isAdminMember = profile.role === 'admin';

              return (
                <motion.div key={m.user_id} layout className="glass rounded-xl overflow-hidden">
                  <button
                    className="w-full flex items-center gap-3 p-3 text-left"
                    onClick={() => { setExpandedMember(isExpanded ? null : m.user_id); if (isExpanded) setEditingMember(null); }}
                  >
                    <div className="w-9 h-9 rounded-full bg-champagne-500/10 flex items-center justify-center flex-shrink-0">
                      <Crown size={16} className="text-champagne-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-sm text-white truncate flex items-center gap-2">
                        {profile.full_name || 'Unnamed Member'}
                        {isAdminMember && <Badge variant="gold" size="sm">Admin</Badge>}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock size={11} className="text-noir-500" />
                        <span className="font-sans text-xs text-noir-400">
                          Joined {joined ? format(new Date(joined), 'MMM d, yyyy') : '—'}
                        </span>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={15} className="text-noir-500" /> : <ChevronDown size={15} className="text-noir-500" />}
                  </button>

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

                          {/* Profile fields */}
                          {!isEditing ? (
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex-1 flex items-center gap-3 text-xs font-sans text-noir-300 flex-wrap">
                                {profile.phone ? (
                                  <span className="flex items-center gap-1.5"><Phone size={11} /> {profile.phone}</span>
                                ) : (
                                  <span className="text-noir-500 italic">No phone</span>
                                )}
                              </div>
                              <div className="flex gap-1.5 flex-shrink-0">
                                <button
                                  onClick={() => startEditingMember(m)}
                                  className="px-2.5 py-1 rounded-md bg-noir-700 hover:bg-noir-600 text-noir-200 font-sans text-xs flex items-center gap-1"
                                  title="Edit member"
                                >
                                  <Edit3 size={11} /> Edit
                                </button>
                                <button
                                  disabled={updatingId === m.user_id}
                                  onClick={() => toggleAdmin(m.user_id, profile.role)}
                                  className={`px-2.5 py-1 rounded-md font-sans text-xs flex items-center gap-1 transition-colors ${
                                    isAdminMember
                                      ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30'
                                      : 'bg-champagne-500/15 hover:bg-champagne-500/25 text-champagne-400 border border-champagne-500/30'
                                  } disabled:opacity-50`}
                                  title={isAdminMember ? 'Revoke admin' : 'Grant admin'}
                                >
                                  {isAdminMember ? <ShieldOff size={11} /> : <Shield size={11} />}
                                  {isAdminMember ? 'Revoke' : 'Make admin'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2 bg-noir-800 rounded-lg p-3">
                              <Field label="Full name">
                                <input
                                  type="text"
                                  value={memberForm.full_name}
                                  onChange={(e) => setMemberForm(f => ({ ...f, full_name: e.target.value }))}
                                  className={inputClasses}
                                />
                              </Field>
                              <Field label="Phone">
                                <input
                                  type="tel"
                                  value={memberForm.phone}
                                  onChange={(e) => setMemberForm(f => ({ ...f, phone: e.target.value }))}
                                  className={inputClasses}
                                />
                              </Field>
                              <Field label="Member since">
                                <input
                                  type="date"
                                  value={memberForm.joined_at}
                                  onChange={(e) => setMemberForm(f => ({ ...f, joined_at: e.target.value }))}
                                  className={inputClasses}
                                />
                              </Field>
                              <div className="flex gap-2 pt-1">
                                <button
                                  disabled={updatingId === m.user_id}
                                  onClick={() => saveMember(m.user_id, m.id)}
                                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded bg-champagne-500 text-noir-900 font-sans text-xs font-medium disabled:opacity-50"
                                >
                                  <Save size={11} /> Save
                                </button>
                                <button
                                  onClick={() => setEditingMember(null)}
                                  className="px-3 py-1.5 rounded bg-noir-700 text-noir-300 font-sans text-xs"
                                >
                                  Cancel
                                </button>
                              </div>
                              <button
                                disabled={updatingId === m.user_id}
                                onClick={() => deleteMember(m)}
                                className="w-full mt-2 py-1.5 rounded bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 font-sans text-xs flex items-center justify-center gap-1 disabled:opacity-50"
                              >
                                <Trash2 size={11} /> Remove from Society
                              </button>
                            </div>
                          )}

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
                                type="number" min="0" step="0.01"
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

      {/* ─────────────────── EVENTS TAB ─────────────────── */}
      {tab === 'events' && (
        <div>
          <div className="flex gap-1 mb-3 bg-noir-800 rounded-xl p-1">
            {[
              { key: 'manage',   label: 'Manage events', icon: Edit3    },
              { key: 'bookings', label: 'RSVPs',         icon: Calendar },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setEventsTab(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-sans text-xs transition-all ${
                  eventsTab === key
                    ? 'bg-champagne-500/20 text-champagne-300 font-semibold border border-champagne-500/40'
                    : 'text-noir-400 hover:text-white'
                }`}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>

          {/* MANAGE */}
          {eventsTab === 'manage' && (
            <div className="space-y-3">
              {/* Create / edit form */}
              <AnimatePresence>
                {editingEvent && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="glass rounded-xl p-4 border border-champagne-500/30 space-y-2"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-display text-base text-white">
                        {editingEvent === 'new' ? 'Create event' : 'Edit event'}
                      </h3>
                      <button onClick={cancelEventEdit} className="text-noir-400 hover:text-white"><X size={16} /></button>
                    </div>

                    <Field label="Title *">
                      <input
                        type="text"
                        value={eventForm.title}
                        onChange={(e) => setEventForm(f => ({ ...f, title: e.target.value }))}
                        className={inputClasses}
                      />
                    </Field>
                    <Field label="Description">
                      <textarea
                        value={eventForm.description}
                        onChange={(e) => setEventForm(f => ({ ...f, description: e.target.value }))}
                        rows={3}
                        className={inputClasses}
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Date &amp; time">
                        <input
                          type="datetime-local"
                          value={eventForm.event_date}
                          onChange={(e) => setEventForm(f => ({ ...f, event_date: e.target.value }))}
                          className={inputClasses}
                        />
                      </Field>
                      <Field label="Price ($)">
                        <input
                          type="number" min="0" step="0.01"
                          value={eventForm.price}
                          onChange={(e) => setEventForm(f => ({ ...f, price: e.target.value }))}
                          className={inputClasses}
                        />
                      </Field>
                    </div>
                    <Field label="Location">
                      <input
                        type="text"
                        value={eventForm.location}
                        onChange={(e) => setEventForm(f => ({ ...f, location: e.target.value }))}
                        className={inputClasses}
                      />
                    </Field>
                    <Field label="Image URL">
                      <input
                        type="url"
                        value={eventForm.image_url}
                        onChange={(e) => setEventForm(f => ({ ...f, image_url: e.target.value }))}
                        placeholder="https://…"
                        className={inputClasses}
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Max seats">
                        <input
                          type="number" min="0" step="1"
                          value={eventForm.max_seats}
                          onChange={(e) => {
                            const v = e.target.value;
                            setEventForm(f => ({
                              ...f,
                              max_seats: v,
                              seats_remaining: f.seats_remaining === '' ? v : f.seats_remaining,
                            }));
                          }}
                          className={inputClasses}
                        />
                      </Field>
                      <Field label="Seats remaining">
                        <input
                          type="number" min="0" step="1"
                          value={eventForm.seats_remaining}
                          onChange={(e) => setEventForm(f => ({ ...f, seats_remaining: e.target.value }))}
                          className={inputClasses}
                        />
                      </Field>
                    </div>
                    <label className="flex items-center gap-2 pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={eventForm.is_active}
                        onChange={(e) => setEventForm(f => ({ ...f, is_active: e.target.checked }))}
                        className="accent-champagne-500"
                      />
                      <span className="font-sans text-xs text-noir-200">Visible to members</span>
                    </label>

                    <div className="flex gap-2 pt-2">
                      <button
                        disabled={updatingId === editingEvent}
                        onClick={saveEvent}
                        className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-champagne-500 text-noir-900 font-sans text-xs font-medium disabled:opacity-50"
                      >
                        <Save size={12} /> {editingEvent === 'new' ? 'Create event' : 'Save changes'}
                      </button>
                      <button
                        onClick={cancelEventEdit}
                        className="px-4 py-2 rounded-lg bg-noir-700 text-noir-300 font-sans text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!editingEvent && (
                <button
                  onClick={startNewEvent}
                  className="w-full py-2.5 rounded-lg border border-dashed border-champagne-500/40 text-champagne-400 font-sans text-xs flex items-center justify-center gap-1.5 hover:bg-champagne-500/10 transition-colors"
                >
                  <Plus size={13} /> New event
                </button>
              )}

              {loading && <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-20 skeleton rounded-xl" />)}</div>}

              {!loading && events.length === 0 && !editingEvent && (
                <EmptyState
                  icon={<Calendar className="text-noir-500" size={28} />}
                  title="No events yet"
                  description="Tap “New event” to create one"
                />
              )}

              {events.map((e) => {
                const rsvpCount = eventBookings.filter((b) => b.event_id === e.id && b.status === 'confirmed').length;
                return (
                  <motion.div key={e.id} layout className="glass rounded-xl p-3 space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-sm text-white truncate flex items-center gap-2">
                          {e.title}
                          {!e.is_active && <Badge variant="silver" size="sm">Hidden</Badge>}
                        </p>
                        <div className="flex items-center gap-3 flex-wrap mt-0.5 font-sans text-xs text-noir-400">
                          {e.event_date && (
                            <span className="flex items-center gap-1"><Calendar size={11} /> {format(new Date(e.event_date), 'MMM d, yyyy · h:mm a')}</span>
                          )}
                          {e.location && (
                            <span className="flex items-center gap-1 truncate"><MapPin size={11} /> {e.location}</span>
                          )}
                          {e.price != null && (
                            <span className="text-champagne-400">${Number(e.price).toFixed(2)}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 font-sans text-xs text-noir-500">
                          <span>{rsvpCount} RSVP{rsvpCount === 1 ? '' : 's'}</span>
                          {e.max_seats != null && <span>· {e.seats_remaining ?? e.max_seats} / {e.max_seats} seats left</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1.5 pt-1">
                      <button
                        onClick={() => startEditingEvent(e)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md bg-noir-700 hover:bg-noir-600 text-noir-200 font-sans text-xs"
                      >
                        <Edit3 size={11} /> Edit
                      </button>
                      <button
                        disabled={updatingId === e.id}
                        onClick={() => toggleEventActive(e)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md bg-noir-700 hover:bg-noir-600 text-noir-200 font-sans text-xs disabled:opacity-50"
                      >
                        {e.is_active ? <><EyeOff size={11} /> Hide</> : <><Eye size={11} /> Publish</>}
                      </button>
                      <button
                        disabled={updatingId === e.id}
                        onClick={() => deleteEvent(e)}
                        className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-md bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 font-sans text-xs disabled:opacity-50"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* RSVPS */}
          {eventsTab === 'bookings' && (
            <div className="space-y-2">
              {loading && <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-14 skeleton rounded-xl" />)}</div>}

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
                  <select
                    disabled={updatingId === b.id}
                    value={b.status || 'confirmed'}
                    onChange={(e) => updateRsvpStatus(b.id, e.target.value)}
                    className={`flex-shrink-0 rounded-full font-sans text-xs px-2 py-0.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-champagne-500 disabled:opacity-50 ${
                      STATUS_COLORS[b.status] || STATUS_COLORS.pending
                    }`}
                    aria-label="RSVP status"
                  >
                    <option value="confirmed">confirmed</option>
                    <option value="pending">pending</option>
                    <option value="cancelled">cancelled</option>
                    <option value="completed">completed</option>
                  </select>
                  <button
                    disabled={updatingId === b.id}
                    onClick={() => deleteRsvp(b)}
                    className="flex-shrink-0 p-1.5 rounded-md text-rose-400 hover:bg-rose-500/15 transition-colors disabled:opacity-50"
                    aria-label="Delete RSVP"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────── AT-HOME TAB ─────────────────── */}
      {tab === 'athome' && (
        <div className="space-y-3">
          {loading && <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-24 skeleton rounded-xl" />)}</div>}

          {!loading && atHomeBookings.length === 0 && (
            <EmptyState
              icon={<Home className="text-noir-500" size={28} />}
              title="No at-home bookings yet"
              description="Booking requests will appear here"
            />
          )}

          {atHomeBookings.map((b) => {
            const isExpanded = expandedBooking === b.id;
            const isEditing  = editingBooking  === b.id;

            return (
              <motion.div key={b.id} layout className="glass rounded-xl overflow-hidden">
                <button
                  className="w-full p-3 flex items-start justify-between gap-2 text-left"
                  onClick={() => { setExpandedBooking(isExpanded ? null : b.id); if (isExpanded) setEditingBooking(null); }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm text-white">
                      {b.bocage_profiles?.full_name || 'Unknown Member'}
                    </p>
                    <p className="font-sans text-xs text-champagne-500 mt-0.5 capitalize">
                      {b.service_tier?.replace(/-/g, ' ') || '—'}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full font-sans text-xs capitalize flex-shrink-0 ${STATUS_COLORS[b.status] || STATUS_COLORS.pending}`}>
                    {b.status}
                  </span>
                </button>

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
                        {!isEditing ? (
                          <>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-sans text-xs text-noir-400">
                              {b.preferred_date && (
                                <div className="flex items-center gap-1.5">
                                  <Calendar size={11} /> {format(new Date(b.preferred_date), 'MMM d, yyyy')}
                                </div>
                              )}
                              {b.guest_count && (
                                <div className="flex items-center gap-1.5">
                                  <Users size={11} /> {b.guest_count} guests
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
                                  <Phone size={11} /> {b.bocage_profiles.phone}
                                </div>
                              )}
                            </div>

                            {b.notes && (
                              <p className="font-sans text-xs text-noir-400 italic bg-noir-800/60 rounded-lg px-2.5 py-2">
                                "{b.notes}"
                              </p>
                            )}

                            <div className="flex gap-2 pt-1 flex-wrap">
                              {b.status === 'pending' && (
                                <>
                                  <button
                                    disabled={updatingId === b.id}
                                    onClick={() => updateBookingStatus(b.id, 'confirmed')}
                                    className="flex-1 min-w-[120px] flex items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-sans text-xs hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
                                  >
                                    <Check size={11} /> Confirm
                                  </button>
                                  <button
                                    disabled={updatingId === b.id}
                                    onClick={() => updateBookingStatus(b.id, 'cancelled')}
                                    className="flex-1 min-w-[120px] flex items-center justify-center gap-1 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 font-sans text-xs hover:bg-rose-500/25 transition-colors disabled:opacity-50"
                                  >
                                    <X size={11} /> Cancel
                                  </button>
                                </>
                              )}
                              {b.status === 'confirmed' && (
                                <button
                                  disabled={updatingId === b.id}
                                  onClick={() => updateBookingStatus(b.id, 'completed')}
                                  className="flex-1 py-1.5 rounded-lg bg-noir-700 border border-noir-600 text-noir-300 font-sans text-xs hover:bg-noir-600 transition-colors disabled:opacity-50"
                                >
                                  Mark Completed
                                </button>
                              )}
                              <button
                                onClick={() => startEditingBooking(b)}
                                className="px-3 py-1.5 rounded-lg bg-noir-700 hover:bg-noir-600 text-noir-200 font-sans text-xs flex items-center gap-1"
                              >
                                <Edit3 size={11} /> Edit
                              </button>
                              <button
                                disabled={updatingId === b.id}
                                onClick={() => deleteBooking(b)}
                                className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 font-sans text-xs flex items-center gap-1 disabled:opacity-50"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="space-y-2 bg-noir-800 rounded-lg p-3">
                            <Field label="Service tier">
                              <input
                                type="text"
                                value={bookingForm.service_tier}
                                onChange={(e) => setBookingForm(f => ({ ...f, service_tier: e.target.value }))}
                                className={inputClasses}
                              />
                            </Field>
                            <div className="grid grid-cols-2 gap-2">
                              <Field label="Date">
                                <input
                                  type="date"
                                  value={bookingForm.preferred_date}
                                  onChange={(e) => setBookingForm(f => ({ ...f, preferred_date: e.target.value }))}
                                  className={inputClasses}
                                />
                              </Field>
                              <Field label="Guests">
                                <input
                                  type="number" min="0" step="1"
                                  value={bookingForm.guest_count}
                                  onChange={(e) => setBookingForm(f => ({ ...f, guest_count: e.target.value }))}
                                  className={inputClasses}
                                />
                              </Field>
                            </div>
                            <Field label="Location">
                              <input
                                type="text"
                                value={bookingForm.location}
                                onChange={(e) => setBookingForm(f => ({ ...f, location: e.target.value }))}
                                className={inputClasses}
                              />
                            </Field>
                            <Field label="Notes">
                              <textarea
                                value={bookingForm.notes}
                                onChange={(e) => setBookingForm(f => ({ ...f, notes: e.target.value }))}
                                rows={2}
                                className={inputClasses}
                              />
                            </Field>
                            <Field label="Status">
                              <select
                                value={bookingForm.status}
                                onChange={(e) => setBookingForm(f => ({ ...f, status: e.target.value }))}
                                className={inputClasses}
                              >
                                <option value="pending">pending</option>
                                <option value="confirmed">confirmed</option>
                                <option value="cancelled">cancelled</option>
                                <option value="completed">completed</option>
                              </select>
                            </Field>
                            <div className="flex gap-2 pt-1">
                              <button
                                disabled={updatingId === b.id}
                                onClick={() => saveBooking(b.id)}
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded bg-champagne-500 text-noir-900 font-sans text-xs font-medium disabled:opacity-50"
                              >
                                <Save size={11} /> Save
                              </button>
                              <button
                                onClick={() => setEditingBooking(null)}
                                className="px-3 py-1.5 rounded bg-noir-700 text-noir-300 font-sans text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────── helpers ───────────────────────

const inputClasses =
  "w-full bg-noir-700 border border-noir-600 rounded px-2 py-1.5 text-white font-sans text-xs placeholder:text-noir-500 focus:outline-none focus:border-champagne-500";

function Field({ label, children }) {
  return (
    <div>
      <label className="block font-sans text-[10px] text-noir-400 uppercase tracking-wider mb-1">{label}</label>
      {children}
    </div>
  );
}
