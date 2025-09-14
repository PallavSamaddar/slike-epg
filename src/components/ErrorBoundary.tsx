import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log browser extension errors silently
    if (error.message.includes('message channel closed') || 
        error.message.includes('asynchronous response')) {
      console.debug('Browser extension error caught and handled:', error.message);
      return;
    }
    
    // Log other errors normally
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // Silently recover from browser extension errors
      if (this.state.error?.message.includes('message channel closed') || 
          this.state.error?.message.includes('asynchronous response')) {
        this.setState({ hasError: false });
        return this.props.children;
      }
      
      return this.props.fallback || (
        <div className="p-4 text-center">
          <h2 className="text-lg font-semibold text-red-600 mb-2">Something went wrong</h2>
          <p className="text-gray-600">Please refresh the page to continue.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
