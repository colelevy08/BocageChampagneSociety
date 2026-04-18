/**
 * @file src/pages/Profile.jsx
 * @description User profile page with editable name/phone, Society membership
 * status + benefits, admin badge, Bocage contact info, and sign out.
 * Combines profile editing with the membership overview (formerly its own tab).
 * @importedBy src/App.jsx (route: /profile)
 * @imports src/context/AuthContext.jsx, src/lib/supabase.js, src/components/ui/*,
 *          src/hooks/*, framer-motion, lucide-react, date-fns
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Mail, Crown, LogOut, MapPin, Phone, Edit3,
  Check, X, Shield, Calendar, Wine, CalendarHeart, Sparkles, Gift, Users,
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

      {/* Contact info */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
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
