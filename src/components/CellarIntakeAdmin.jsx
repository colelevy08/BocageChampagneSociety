/**
 * @file src/components/CellarIntakeAdmin.jsx
 * @description "Cellar" tab of the AdminCRM — lists Private Cellar Curation
 * questionnaire submissions (bocage_cellar_intake) and lets admins review,
 * edit any answer, track workflow status, keep notes, and delete.
 * Submissions come from the unlisted marketing-site page
 * bocagechampagnebar.com/CellarCuration (shared privately by the owners).
 * Self-contained: fetches its own data so AdminCRM.jsx stays untouched.
 * @importedBy src/pages/AdminCRM.jsx (rendered when tab === 'cellar')
 * @imports src/lib/supabase.js, src/components/ui/*, framer-motion, lucide-react, date-fns
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wine, Mail, Phone, Calendar, Edit3, Trash2, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useToast } from './ui/Toast';
import EmptyState from './ui/EmptyState';

/** Workflow badge colors — same visual language as the At-Home tab */
const STATUS_COLORS = {
  new:       'bg-champagne-500/20 text-champagne-300 border border-champagne-500/30',
  contacted: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  scheduled: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  completed: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  archived:  'bg-noir-500/30 text-noir-300 border border-noir-600',
};

const STATUSES = ['new', 'contacted', 'scheduled', 'completed', 'archived'];

// Option labels — verbatim from the printed intake form, mirrored from the
// public page (bocage repo, src/pages/CellarCurationPage.jsx). Keep in sync.
const OPTIONS = {
  bottle_frequency: ['A few times a week', 'Once a week or so', 'A few times a month', 'Mostly for special occasions'],
  perfect_evening: ['Quiet dinner for two', 'A table full of friends', 'Solo, winding down', 'Celebrating something'],
  entertaining_frequency: ["Regularly — it's a big part of life", 'Occasionally, for the right reason', "Rarely, but I'd like to more", 'Mostly small gatherings'],
  wine_experience: ['Just getting curious', 'Comfortable — I know what I like', 'Knowledgeable and always learning', 'Serious collector'],
  reach_for_most: ['Sparkling above all', 'Whites primarily', 'Reds primarily', 'Genuinely all three'],
  champagne_occasion: ['Any occasion worth celebrating', 'Mostly as an aperitif', 'Throughout a meal', 'Whenever I feel like it'],
  champagne_style: ['Blanc de Blancs (all Chardonnay, crisp)', 'Blanc de Noirs (Pinot-forward, full)', 'Rosé', 'Classic NV blend', 'Grower-producers', 'Still discovering'],
  still_regions: ['Burgundy', 'Bordeaux', 'Barolo / Barbaresco', 'Rhône Valley', 'Loire Valley', 'California', 'Other Europe', 'Still exploring'],
  collection_description: ['Starting fresh — nothing at home', 'A few bottles, nothing organized', "A modest collection I've been building", 'A meaningful cellar with real depth'],
  bottle_count: ['Fewer than 12', '12–36', '36–100', '100–300', '300+'],
  collection_categories: ['Champagne & sparkling', 'White Burgundy / Chardonnay', 'Red Burgundy / Pinot Noir', 'Bordeaux / Cabernet-based', 'Italian reds (Barolo, Brunello…)', 'Rhône / Syrah', 'Rosé', 'Eclectic / mixed'],
  missing_most: ['More great Champagne', 'Wines that age well', 'Reliable everyday bottles', 'Special-occasion showstoppers', 'More variety and range', 'Organization and intention'],
  collection_help: ['Build on what I have — fill the gaps', 'Start fresh with a clear vision', 'Help me understand what I own', 'A mix of both'],
  storage_method: ['Dedicated wine cellar', 'Wine refrigerator (1–2 units)', 'Temperature-controlled space', 'Nowhere great, honestly', 'Looking to set something up'],
  bottles_on_hand: ['12–24 (drinking cellar)', '24–60 (rotation + some holding)', '60–120 (building something real)', '120+ (serious collection)'],
  collection_priority: ['Always have something great to open', 'Building for long-term aging', 'A mix — some to drink, some to hold', 'Champagne-focused above all'],
  per_bottle_range: ['Under $30', '$30–$75', '$75–$150', '$150–$300', '$300+ for the right bottles'],
  aging_preference: ['Love the idea — part of the point', 'Some aging is fine; I want bottles now', "I'd rather drink sooner than wait", 'Not sure — advise me'],
};

/**
 * Field layout for both the read view and the edit form, grouped exactly like
 * the printed questionnaire. type: 'choice' (single select), 'multi'
 * (checkbox set), 'scale' (1–5 with endpoint labels), 'text' (free text).
 */
const SECTIONS = [
  {
    title: 'Part One — About You',
    fields: [
      { key: 'bottle_frequency',       label: 'Opens a bottle at home',  type: 'choice' },
      { key: 'perfect_evening',        label: 'Perfect evening',         type: 'choice' },
      { key: 'entertaining_frequency', label: 'Entertains at home',      type: 'choice' },
      { key: 'wine_experience',        label: 'Wine experience',         type: 'choice' },
      { key: 'loved_wines',            label: 'Already loves',           type: 'text' },
      { key: 'avoid_wines',            label: "Doesn't want more of",    type: 'text' },
    ],
  },
  {
    title: 'Part Two — Your Palate',
    fields: [
      { key: 'reach_for_most',        label: 'Reaches for most',        type: 'choice' },
      { key: 'style_scale',           label: 'Overall style',           type: 'scale', left: 'Bright & fresh',     right: 'Rich & textured' },
      { key: 'earthy_scale',          label: 'Earthy, savory notes',    type: 'scale', left: 'Not for me',         right: 'Love them' },
      { key: 'oak_scale',             label: 'Oak',                     type: 'scale', left: 'Minimal oak',        right: 'Embrace the oak' },
      { key: 'tannin_scale',          label: 'Tannins',                 type: 'scale', left: 'Prefer soft & silky', right: 'Love structure & grip' },
      { key: 'champagne_occasion',    label: 'Opens Champagne',         type: 'choice' },
      { key: 'champagne_style_scale', label: 'Champagne style',         type: 'scale', left: 'Fresh & mineral',    right: 'Rich & creamy' },
      { key: 'champagne_style',       label: 'Most intriguing style',   type: 'choice' },
      { key: 'still_regions',         label: 'Still wine regions',      type: 'multi' },
    ],
  },
  {
    title: 'Part Three — Your Existing Cellar',
    fields: [
      { key: 'collection_description', label: 'Current collection',     type: 'choice' },
      { key: 'bottle_count',           label: 'Bottle count',           type: 'choice' },
      { key: 'collection_categories',  label: 'Main categories',        type: 'multi' },
      { key: 'proud_bottles',          label: 'Proud of',               type: 'text' },
      { key: 'unsure_bottles',         label: 'Unsure what to do with', type: 'text' },
      { key: 'missing_most',           label: 'Most missing',           type: 'choice' },
      { key: 'collection_help',        label: 'Most helpful',           type: 'choice' },
      { key: 'cellar_notes',           label: 'Cellar notes',           type: 'text' },
    ],
  },
  {
    title: 'Part Four — The Practical Side',
    fields: [
      { key: 'storage_method',      label: 'Storage at home',       type: 'choice' },
      { key: 'bottles_on_hand',     label: 'Bottles on hand',       type: 'choice' },
      { key: 'collection_priority', label: 'Most important',        type: 'choice' },
      { key: 'per_bottle_range',    label: 'Per-bottle range',      type: 'choice' },
      { key: 'aging_preference',    label: 'Aging 5–10+ years',     type: 'choice' },
      { key: 'dream_bottle',        label: 'Dream bottle moment',   type: 'text' },
    ],
  },
];

const inputClasses =
  'w-full bg-noir-700 border border-noir-600 rounded px-2 py-1.5 text-white font-sans text-xs placeholder:text-noir-500 focus:outline-none focus:border-champagne-500';

function Field({ label, children }) {
  return (
    <div>
      <label className="block font-sans text-[10px] text-noir-400 uppercase tracking-wider mb-1">{label}</label>
      {children}
    </div>
  );
}

/**
 * CellarIntakeAdmin — list + expand + edit for cellar-curation submissions.
 * @returns {JSX.Element}
 */
export default function CellarIntakeAdmin() {
  const toast = useToast();

  const [intakes, setIntakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchIntakes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bocage_cellar_intake')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast.error(`Could not load submissions: ${error.message}`);
    setIntakes(data || []);
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchIntakes(); }, [fetchIntakes]);

  function startEditing(intake) {
    setEditingId(intake.id);
    // Copy the row into the form; null scalars become '' so inputs stay controlled.
    const copy = {};
    for (const [k, v] of Object.entries(intake)) {
      copy[k] = v === null ? '' : v;
    }
    setForm(copy);
  }

  async function saveIntake(id) {
    setSaving(true);
    // Strip non-editable columns and turn '' back into NULL for the database.
    const { id: _id, created_at, ...rest } = form;
    const patch = Object.fromEntries(
      Object.entries(rest).map(([k, v]) => [k, v === '' ? null : v])
    );
    patch.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('bocage_cellar_intake')
      .update(patch)
      .eq('id', id);

    setSaving(false);
    if (error) {
      toast.error(`Save failed: ${error.message}`);
      return;
    }
    toast.success('Submission updated.');
    setEditingId(null);
    fetchIntakes();
  }

  async function setStatus(intake, status) {
    const { error } = await supabase
      .from('bocage_cellar_intake')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', intake.id);
    if (error) toast.error(`Update failed: ${error.message}`);
    else fetchIntakes();
  }

  async function deleteIntake(intake) {
    if (!confirm(`Delete the cellar questionnaire from ${intake.guest_name}? This cannot be undone.`)) return;
    const { error } = await supabase
      .from('bocage_cellar_intake')
      .delete()
      .eq('id', intake.id);
    if (error) toast.error(`Delete failed: ${error.message}`);
    else { toast.success('Submission deleted.'); fetchIntakes(); }
  }

  /** Read-only renderer for one answer, by field type */
  function renderValue(intake, field) {
    const v = intake[field.key];
    if (field.type === 'multi') {
      return v?.length ? v.join(' · ') : '—';
    }
    if (field.type === 'scale') {
      return v ? `${v} / 5  (${field.left} → ${field.right})` : '—';
    }
    return v || '—';
  }

  /** Edit-mode input for one answer, by field type */
  function renderInput(field) {
    if (field.type === 'choice') {
      return (
        <select
          value={form[field.key] || ''}
          onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
          className={inputClasses}
        >
          <option value="">—</option>
          {OPTIONS[field.key].map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }
    if (field.type === 'multi') {
      const values = form[field.key] || [];
      const toggle = (o) =>
        setForm((f) => ({
          ...f,
          [field.key]: values.includes(o) ? values.filter((x) => x !== o) : [...values, o],
        }));
      return (
        <div className="flex flex-wrap gap-1">
          {OPTIONS[field.key].map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => toggle(o)}
              className={`px-2 py-1 rounded font-sans text-[10px] border transition-colors ${
                values.includes(o)
                  ? 'bg-champagne-500/20 text-champagne-300 border-champagne-500/40'
                  : 'bg-noir-700 text-noir-400 border-noir-600 hover:text-white'
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      );
    }
    if (field.type === 'scale') {
      const current = form[field.key] || '';
      return (
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setForm((f) => ({ ...f, [field.key]: current === n ? '' : n }))}
              className={`w-7 h-7 rounded-full font-sans text-xs border transition-colors ${
                current === n
                  ? 'bg-champagne-500 text-noir-900 border-champagne-500 font-semibold'
                  : 'bg-noir-700 text-noir-400 border-noir-600 hover:text-white'
              }`}
            >
              {n}
            </button>
          ))}
          <span className="font-sans text-[10px] text-noir-500 ml-2">{field.left} → {field.right}</span>
        </div>
      );
    }
    return (
      <textarea
        value={form[field.key] || ''}
        onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
        rows={2}
        className={`${inputClasses} resize-none`}
      />
    );
  }

  return (
    <div className="space-y-3">
      {loading && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 skeleton rounded-xl" />)}
        </div>
      )}

      {!loading && intakes.length === 0 && (
        <EmptyState
          icon={<Wine className="text-noir-500" size={28} />}
          title="No cellar questionnaires yet"
          description="Submissions from the private Cellar Curation link will appear here"
        />
      )}

      {!loading && intakes.map((intake) => {
        const isExpanded = expandedId === intake.id;
        const isEditing  = editingId  === intake.id;

        return (
          <motion.div key={intake.id} layout className="glass rounded-xl overflow-hidden">
            {/* Collapsed header — name, contact, status */}
            <button
              className="w-full p-3 flex items-start justify-between gap-2 text-left"
              onClick={() => {
                setExpandedId(isExpanded ? null : intake.id);
                if (isExpanded) setEditingId(null);
              }}
            >
              <div className="flex-1 min-w-0">
                <p className="font-display text-sm text-white">{intake.guest_name}</p>
                <p className="font-sans text-xs text-noir-400 mt-0.5 truncate">
                  {[intake.email, intake.phone].filter(Boolean).join(' · ') || 'No contact info'}
                </p>
                <p className="font-sans text-[10px] text-noir-500 mt-0.5">
                  {format(new Date(intake.created_at), 'MMM d, yyyy')}
                  {intake.referred_by ? ` · referred by ${intake.referred_by}` : ''}
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded-full font-sans text-xs capitalize flex-shrink-0 ${STATUS_COLORS[intake.status] || STATUS_COLORS.new}`}>
                {intake.status}
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
                  <div className="px-3 pb-3 border-t border-noir-700 pt-3 space-y-4">
                    {!isEditing ? (
                      <>
                        {/* Contact + cover details */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-sans text-xs text-noir-400">
                          {intake.email && (
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Mail size={11} className="flex-shrink-0" />
                              <span className="truncate">{intake.email}</span>
                            </div>
                          )}
                          {intake.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone size={11} className="flex-shrink-0" /> {intake.phone}
                            </div>
                          )}
                          {intake.intake_date && (
                            <div className="flex items-center gap-1.5">
                              <Calendar size={11} className="flex-shrink-0" />
                              {format(new Date(`${intake.intake_date}T12:00:00`), 'MMM d, yyyy')}
                            </div>
                          )}
                        </div>

                        {/* All four parts of the questionnaire, read-only */}
                        {SECTIONS.map((section) => (
                          <div key={section.title}>
                            <p className="font-sans text-[10px] text-champagne-500 uppercase tracking-wider mb-1.5">
                              {section.title}
                            </p>
                            <div className="space-y-1">
                              {section.fields.map((field) => (
                                <div key={field.key} className="grid grid-cols-[40%_60%] gap-2 font-sans text-xs">
                                  <span className="text-noir-500">{field.label}</span>
                                  <span className="text-noir-300 whitespace-pre-wrap">{renderValue(intake, field)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}

                        {/* Admin notes */}
                        {intake.admin_notes && (
                          <div>
                            <p className="font-sans text-[10px] text-champagne-500 uppercase tracking-wider mb-1.5">
                              Admin Notes
                            </p>
                            <p className="font-sans text-xs text-noir-300 whitespace-pre-wrap">{intake.admin_notes}</p>
                          </div>
                        )}

                        {/* Quick status changes + actions */}
                        <div className="flex gap-1.5 flex-wrap pt-1">
                          {STATUSES.filter((s) => s !== intake.status).map((s) => (
                            <button
                              key={s}
                              onClick={() => setStatus(intake, s)}
                              className="px-2 py-1 rounded font-sans text-[10px] capitalize bg-noir-700 text-noir-300 hover:text-white border border-noir-600 transition-colors"
                            >
                              Mark {s}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => startEditing(intake)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded font-sans text-xs bg-champagne-500/15 text-champagne-300 border border-champagne-500/30 hover:bg-champagne-500/25 transition-colors"
                          >
                            <Edit3 size={11} /> Edit
                          </button>
                          <button
                            onClick={() => deleteIntake(intake)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded font-sans text-xs bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-colors"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </>
                    ) : (
                      /* Full edit form — every answer is editable */
                      <div className="space-y-3 bg-noir-800 rounded-lg p-3">
                        <div className="grid grid-cols-2 gap-2">
                          <Field label="Guest name">
                            <input
                              type="text"
                              value={form.guest_name || ''}
                              onChange={(e) => setForm((f) => ({ ...f, guest_name: e.target.value }))}
                              className={inputClasses}
                            />
                          </Field>
                          <Field label="Intake date">
                            <input
                              type="date"
                              value={form.intake_date || ''}
                              onChange={(e) => setForm((f) => ({ ...f, intake_date: e.target.value }))}
                              className={inputClasses}
                            />
                          </Field>
                          <Field label="Email">
                            <input
                              type="email"
                              value={form.email || ''}
                              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                              className={inputClasses}
                            />
                          </Field>
                          <Field label="Phone">
                            <input
                              type="tel"
                              value={form.phone || ''}
                              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                              className={inputClasses}
                            />
                          </Field>
                          <Field label="Referred by">
                            <input
                              type="text"
                              value={form.referred_by || ''}
                              onChange={(e) => setForm((f) => ({ ...f, referred_by: e.target.value }))}
                              className={inputClasses}
                            />
                          </Field>
                          <Field label="Status">
                            <select
                              value={form.status || 'new'}
                              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                              className={inputClasses}
                            >
                              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </Field>
                        </div>

                        {SECTIONS.map((section) => (
                          <div key={section.title} className="space-y-2">
                            <p className="font-sans text-[10px] text-champagne-500 uppercase tracking-wider pt-1">
                              {section.title}
                            </p>
                            {section.fields.map((field) => (
                              <Field key={field.key} label={field.label}>
                                {renderInput(field)}
                              </Field>
                            ))}
                          </div>
                        ))}

                        <Field label="Admin notes (never shown to the guest)">
                          <textarea
                            value={form.admin_notes || ''}
                            onChange={(e) => setForm((f) => ({ ...f, admin_notes: e.target.value }))}
                            rows={3}
                            className={`${inputClasses} resize-none`}
                          />
                        </Field>

                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => saveIntake(intake.id)}
                            disabled={saving}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded font-sans text-xs bg-champagne-500 text-noir-900 font-semibold hover:bg-champagne-400 disabled:opacity-50 transition-colors"
                          >
                            <Save size={11} /> {saving ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded font-sans text-xs bg-noir-700 text-noir-300 border border-noir-600 hover:text-white transition-colors"
                          >
                            <X size={11} /> Cancel
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
  );
}
