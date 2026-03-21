/**
 * @file src/pages/GitHubDashboard.jsx
 * @description GitHub Repository Dashboard — fetches the user's top 8 most recently
 * edited GitHub repos and displays them with recent commits and AI-generated improvement
 * suggestions. Each refresh fetches the latest state from GitHub's API.
 * @importedBy src/App.jsx (route: /github)
 * @imports react, framer-motion, lucide-react
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch,
  GitCommit,
  RefreshCw,
  ExternalLink,
  Star,
  Code2,
  Clock,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  AlertCircle,
  Loader2,
  FolderGit2,
  Zap,
  Shield,
  BookOpen,
  Layers,
} from 'lucide-react';

/** GitHub username — hardcoded for this user's dashboard */
const GITHUB_USERNAME = 'colelevy08';

/** GitHub public API base URL */
const API_BASE = 'https://api.github.com';

/**
 * Language color map for visual indicators
 * @type {Object.<string, string>}
 */
const LANG_COLORS = {
  JavaScript: '#F7DF1E',
  TypeScript: '#3178C6',
  Python: '#3776AB',
  HTML: '#E34F26',
  CSS: '#1572B6',
  Unknown: '#6B7280',
};

/**
 * Generates smart improvement suggestions based on repo metadata and recent commits.
 * Analyzes language, commit patterns, description, and activity to provide actionable advice.
 * @param {Object} repo - GitHub repo object
 * @param {Array} commits - Recent commits array
 * @returns {Array<{icon: string, text: string, priority: string}>}
 */
function generateSuggestions(repo, commits) {
  const suggestions = [];
  const commitMessages = commits.map((c) => c.commit.message.toLowerCase());
  const lastPush = new Date(repo.pushed_at);
  const daysSinceLastPush = Math.floor((Date.now() - lastPush) / (1000 * 60 * 60 * 24));

  // No description
  if (!repo.description) {
    suggestions.push({
      icon: 'docs',
      text: 'Add a repository description to improve discoverability and clarity.',
      priority: 'medium',
    });
  }

  // Stale repo
  if (daysSinceLastPush > 30) {
    suggestions.push({
      icon: 'alert',
      text: `Last updated ${daysSinceLastPush} days ago — consider archiving or adding a status badge.`,
      priority: 'low',
    });
  }

  // No topics/tags (GitHub API returns topics)
  if (!repo.topics || repo.topics.length === 0) {
    suggestions.push({
      icon: 'docs',
      text: 'Add GitHub topics/tags to help others find this project.',
      priority: 'low',
    });
  }

  // Commit message quality
  const hasVagueCommits = commitMessages.some(
    (m) => m.length < 10 || ['fix', 'update', 'wip', 'test', 'stuff'].includes(m.trim())
  );
  if (hasVagueCommits) {
    suggestions.push({
      icon: 'zap',
      text: 'Some commit messages are vague — use conventional commits (feat:, fix:, docs:) for clarity.',
      priority: 'medium',
    });
  }

  // No license
  if (!repo.license) {
    suggestions.push({
      icon: 'shield',
      text: 'Add a LICENSE file to clarify usage rights and protect your work.',
      priority: 'medium',
    });
  }

  // Large gaps between commits (burst development)
  if (commits.length >= 3) {
    const dates = commits.map((c) => new Date(c.commit.author.date));
    const sameDay = dates.every(
      (d) => d.toDateString() === dates[0].toDateString()
    );
    if (sameDay) {
      suggestions.push({
        icon: 'zap',
        text: 'Recent commits are all on the same day — consider smaller, more frequent pushes.',
        priority: 'low',
      });
    }
  }

  // Language-specific suggestions
  if (repo.language === 'JavaScript' || repo.language === 'TypeScript') {
    const hasLinting = commitMessages.some(
      (m) => m.includes('lint') || m.includes('eslint') || m.includes('prettier')
    );
    if (!hasLinting) {
      suggestions.push({
        icon: 'layers',
        text: 'Consider adding ESLint + Prettier for consistent code style.',
        priority: 'low',
      });
    }
  }

  if (repo.language === 'Python') {
    const hasTyping = commitMessages.some(
      (m) => m.includes('type') || m.includes('mypy') || m.includes('pydantic')
    );
    if (!hasTyping) {
      suggestions.push({
        icon: 'layers',
        text: 'Consider adding type hints and mypy for better code safety.',
        priority: 'low',
      });
    }
  }

  // CI/CD check
  const hasCI = commitMessages.some(
    (m) =>
      m.includes('ci') ||
      m.includes('deploy') ||
      m.includes('github action') ||
      m.includes('workflow')
  );
  if (!hasCI && commits.length > 3) {
    suggestions.push({
      icon: 'zap',
      text: 'Set up GitHub Actions for automated testing and deployment.',
      priority: 'medium',
    });
  }

  // Always return at least one suggestion
  if (suggestions.length === 0) {
    suggestions.push({
      icon: 'star',
      text: 'This repo looks well-maintained! Consider adding integration tests or a contributing guide.',
      priority: 'low',
    });
  }

  return suggestions.slice(0, 4);
}

/**
 * Suggestion icon component mapper
 * @param {string} iconName - Icon identifier
 * @returns {JSX.Element}
 */
function SuggestionIcon({ name }) {
  const iconProps = { size: 14, className: 'shrink-0' };
  switch (name) {
    case 'zap': return <Zap {...iconProps} />;
    case 'shield': return <Shield {...iconProps} />;
    case 'docs': return <BookOpen {...iconProps} />;
    case 'layers': return <Layers {...iconProps} />;
    case 'alert': return <AlertCircle {...iconProps} />;
    case 'star': return <Star {...iconProps} />;
    default: return <Lightbulb {...iconProps} />;
  }
}

/**
 * Priority badge color mapper
 * @param {string} priority - 'high' | 'medium' | 'low'
 * @returns {string} Tailwind classes
 */
function priorityColor(priority) {
  switch (priority) {
    case 'high': return 'text-red-400 bg-red-400/10';
    case 'medium': return 'text-champagne-400 bg-champagne-400/10';
    default: return 'text-noir-300 bg-noir-700';
  }
}

/**
 * Formats a date string into a relative time string (e.g., "2h ago", "3d ago")
 * @param {string} dateStr - ISO date string
 * @returns {string} Relative time string
 */
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

/**
 * RepoCard — expandable card showing repo info, recent commits, and suggestions.
 * @param {Object} props
 * @param {Object} props.repo - GitHub repo data
 * @param {Array} props.commits - Recent commits
 * @param {number} props.index - Card index for stagger animation
 * @returns {JSX.Element}
 */
function RepoCard({ repo, commits, index }) {
  const [expanded, setExpanded] = useState(false);
  const suggestions = generateSuggestions(repo, commits);
  const langColor = LANG_COLORS[repo.language] || LANG_COLORS.Unknown;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className="glass rounded-2xl overflow-hidden hover-lift"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <FolderGit2 size={16} className="text-champagne-500 shrink-0" />
              <h3 className="font-display text-lg text-white truncate">
                {repo.name}
              </h3>
            </div>
            <p className="text-xs text-noir-300 font-sans line-clamp-1 mb-2">
              {repo.description || 'No description'}
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Language badge */}
              <span className="flex items-center gap-1.5 text-xs font-sans text-noir-200">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: langColor }}
                />
                {repo.language || 'Unknown'}
              </span>
              {/* Last updated */}
              <span className="flex items-center gap-1 text-xs font-sans text-noir-400">
                <Clock size={11} />
                {timeAgo(repo.pushed_at)}
              </span>
              {/* Stars */}
              {repo.stargazers_count > 0 && (
                <span className="flex items-center gap-1 text-xs font-sans text-champagne-400">
                  <Star size={11} />
                  {repo.stargazers_count}
                </span>
              )}
              {/* Default branch */}
              <span className="flex items-center gap-1 text-xs font-sans text-noir-400">
                <GitBranch size={11} />
                {repo.default_branch}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg bg-noir-700/50 text-noir-300 hover:text-champagne-500 transition-colors"
            >
              <ExternalLink size={14} />
            </a>
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-noir-400"
            >
              <ChevronDown size={18} />
            </motion.div>
          </div>
        </div>
      </button>

      {/* Expandable content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-champagne-500/20 to-transparent" />

              {/* Recent Commits Section */}
              <div>
                <h4 className="flex items-center gap-2 text-xs font-sans font-medium text-champagne-400 uppercase tracking-wider mb-2">
                  <GitCommit size={12} />
                  Recent Updates
                </h4>
                <div className="space-y-2">
                  {commits.slice(0, 5).map((commit, i) => (
                    <div
                      key={commit.sha}
                      className="flex items-start gap-2.5 group"
                    >
                      {/* Timeline dot + line */}
                      <div className="flex flex-col items-center pt-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-champagne-500/60 group-hover:bg-champagne-500 transition-colors" />
                        {i < commits.length - 1 && (
                          <div className="w-px h-full bg-noir-700 mt-1" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 pb-2">
                        <p className="text-sm text-noir-100 font-sans line-clamp-2 leading-snug">
                          {commit.commit.message.split('\n')[0]}
                        </p>
                        <p className="text-[10px] text-noir-500 font-sans mt-0.5">
                          {timeAgo(commit.commit.author.date)}
                          {commit.author && (
                            <span> by {commit.author.login}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggestions Section */}
              <div>
                <h4 className="flex items-center gap-2 text-xs font-sans font-medium text-rose-400 uppercase tracking-wider mb-2">
                  <Lightbulb size={12} />
                  Suggested Improvements
                </h4>
                <div className="space-y-1.5">
                  {suggestions.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 p-2 rounded-lg bg-noir-800/50"
                    >
                      <span className={`mt-0.5 p-1 rounded ${priorityColor(s.priority)}`}>
                        <SuggestionIcon name={s.icon} />
                      </span>
                      <p className="text-xs text-noir-200 font-sans leading-relaxed">
                        {s.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * GitHubDashboard — main page component.
 * Fetches top 8 recently updated repos and their commits on mount and on refresh.
 * @returns {JSX.Element}
 */
export default function GitHubDashboard() {
  const [repos, setRepos] = useState([]);
  const [commitsMap, setCommitsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  /**
   * Fetches top 8 repos sorted by push date, then fetches recent commits for each.
   * Uses cache-busting headers to ensure fresh data on every call.
   * @param {boolean} isRefresh - Whether this is a manual refresh
   */
  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError(null);

    try {
      // Fetch repos sorted by most recently pushed — cache-bust with timestamp
      const repoRes = await fetch(
        `${API_BASE}/users/${GITHUB_USERNAME}/repos?sort=pushed&per_page=8&_t=${Date.now()}`,
        {
          headers: {
            Accept: 'application/vnd.github.v3+json',
            'If-None-Match': '', // Force fresh response, bypass ETag cache
          },
          cache: 'no-store',
        }
      );

      if (!repoRes.ok) {
        throw new Error(`GitHub API error: ${repoRes.status}`);
      }

      const repoData = await repoRes.json();
      setRepos(repoData);

      // Fetch recent commits for each repo in parallel — also cache-busted
      const commitResults = await Promise.allSettled(
        repoData.map((repo) =>
          fetch(
            `${API_BASE}/repos/${GITHUB_USERNAME}/${repo.name}/commits?per_page=5&_t=${Date.now()}`,
            {
              headers: {
                Accept: 'application/vnd.github.v3+json',
                'If-None-Match': '',
              },
              cache: 'no-store',
            }
          ).then((r) => (r.ok ? r.json() : []))
        )
      );

      // Build commits map keyed by repo name
      const newCommitsMap = {};
      repoData.forEach((repo, i) => {
        const result = commitResults[i];
        newCommitsMap[repo.name] =
          result.status === 'fulfilled' ? result.value : [];
      });

      setCommitsMap(newCommitsMap);
      setLastFetched(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen px-4 pt-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-gradient-gold">
            GitHub Repos
          </h1>
          <p className="text-xs text-noir-400 font-sans mt-1">
            {lastFetched
              ? `Last synced ${timeAgo(lastFetched.toISOString())}`
              : 'Loading...'}
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-xl glass text-sm font-sans text-champagne-400 hover:text-champagne-300 disabled:opacity-50 transition-colors"
        >
          <motion.div
            animate={refreshing ? { rotate: 360 } : {}}
            transition={
              refreshing
                ? { duration: 1, repeat: Infinity, ease: 'linear' }
                : {}
            }
          >
            <RefreshCw size={14} />
          </motion.div>
          {refreshing ? 'Syncing...' : 'Refresh'}
        </button>
      </div>

      {/* Error State */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2"
          >
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <p className="text-sm text-red-300 font-sans">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Skeletons */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-4 h-4 rounded skeleton" />
                <div className="h-5 w-40 rounded skeleton" />
              </div>
              <div className="h-3 w-56 rounded skeleton mb-2" />
              <div className="flex gap-3">
                <div className="h-3 w-16 rounded skeleton" />
                <div className="h-3 w-12 rounded skeleton" />
                <div className="h-3 w-14 rounded skeleton" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Repo Cards */}
      {!loading && repos.length > 0 && (
        <div className="space-y-3">
          {repos.map((repo, index) => (
            <RepoCard
              key={repo.id}
              repo={repo}
              commits={commitsMap[repo.name] || []}
              index={index}
            />
          ))}
        </div>
      )}

      {/* Stats Footer */}
      {!loading && repos.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 p-4 glass rounded-2xl"
        >
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="font-display text-xl text-champagne-500">
                {repos.length}
              </p>
              <p className="text-[10px] text-noir-400 font-sans uppercase tracking-wider">
                Repos
              </p>
            </div>
            <div>
              <p className="font-display text-xl text-champagne-500">
                {Object.values(commitsMap).reduce(
                  (acc, c) => acc + c.length,
                  0
                )}
              </p>
              <p className="text-[10px] text-noir-400 font-sans uppercase tracking-wider">
                Recent Commits
              </p>
            </div>
            <div>
              <p className="font-display text-xl text-champagne-500">
                {[...new Set(repos.map((r) => r.language).filter(Boolean))]
                  .length}
              </p>
              <p className="text-[10px] text-noir-400 font-sans uppercase tracking-wider">
                Languages
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {!loading && repos.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20">
          <Code2 size={48} className="text-noir-600 mb-4" />
          <p className="font-display text-lg text-noir-400">
            No repos found
          </p>
        </div>
      )}
    </div>
  );
}
