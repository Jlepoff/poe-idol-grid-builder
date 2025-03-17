import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import ErrorBoundary from './components/common/ErrorBoundary';

// Lazy load the main App component
const App = lazy(() => import('./App'));

// Loading component for suspense fallback
const LoadingScreen = () => (
  <div className="h-screen bg-slate-950 flex items-center justify-center">
    <div className="text-center">
      <svg
        className="animate-spin h-12 w-12 mx-auto mb-4 text-indigo-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      <p className="text-white text-xl">Loading Idol Grid Builder...</p>
    </div>
  </div>
);

// Error fallback component
const ErrorFallback = (error, errorInfo) => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
    <div className="bg-red-900/30 border border-red-800 rounded-lg p-6 max-w-lg w-full text-white">
      <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
      <p className="mb-4">
        The application encountered an error. Please try refreshing the page.
      </p>
      <details className="bg-slate-900 p-4 rounded-md text-sm mb-4">
        <summary className="cursor-pointer mb-2 text-red-300 font-medium">Error details</summary>
        <p className="mb-2 text-red-200">{error?.toString()}</p>
        <pre className="text-slate-400 font-mono text-xs whitespace-pre-wrap overflow-auto p-2 bg-slate-950 rounded">
          {errorInfo?.componentStack}
        </pre>
      </details>
      <button
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors"
        onClick={() => window.location.reload()}
      >
        Refresh Page
      </button>
    </div>
  </div>
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary fallback={ErrorFallback}>
      <Suspense fallback={<LoadingScreen />}>
        <App />
      </Suspense>
    </ErrorBoundary>
  </React.StrictMode>
);