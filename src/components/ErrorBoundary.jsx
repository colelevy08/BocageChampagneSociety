/**
 * @file src/components/ErrorBoundary.jsx
 * @description React error boundary that catches rendering errors and displays
 * a styled fallback UI with retry functionality.
 * @importedBy src/App.jsx
 */

import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * ErrorBoundary — catches JS errors in child components and shows a fallback.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-noir-900 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-4">
            <AlertTriangle className="text-rose-500" size={32} />
          </div>
          <h2 className="font-display text-2xl text-white mb-2">Something went wrong</h2>
          <p className="font-serif text-noir-300 mb-6 max-w-sm">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="inline-flex items-center gap-2 bg-champagne-500 text-noir-900 font-sans font-semibold px-6 py-3 rounded-lg hover:bg-champagne-400 transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
