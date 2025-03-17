// components/common/ErrorBoundary.jsx
import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    const { fallback, children } = this.props;
    
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (fallback) {
        return fallback(this.state.error, this.state.errorInfo);
      }
      
      return (
        <div className="p-6 bg-red-900/30 border border-red-800 rounded-lg text-white">
          <h2 className="text-xl font-bold mb-3">Something went wrong</h2>
          <p className="mb-4">The application encountered an error. Please try refreshing the page.</p>
          <details className="bg-slate-900 p-3 rounded-md text-sm overflow-auto">
            <summary className="cursor-pointer mb-2 text-red-300">Error details</summary>
            <p className="mb-2 text-red-200">{this.state.error?.toString()}</p>
            <div className="text-slate-400 font-mono text-xs whitespace-pre-wrap">
              {this.state.errorInfo?.componentStack}
            </div>
          </details>
          <button 
            className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-md transition-colors"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;