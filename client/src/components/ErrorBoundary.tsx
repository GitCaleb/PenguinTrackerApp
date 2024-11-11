import React from 'react';
import { AlertCard } from "@/components/ui/alert-card";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', {
      error: error.message,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });
  }

  render() {
    if (this.state.hasError) {
      const isNetworkError = this.state.error?.message.toLowerCase().includes('network') ||
                            this.state.error?.message.toLowerCase().includes('fetch');
      
      const errorMessage = isNetworkError
        ? "We're having trouble connecting to our servers. Please check your internet connection and try again."
        : "Something unexpected happened. We've been notified and are working on a fix.";

      return (
        <div className="container py-10">
          <AlertCard
            variant="destructive"
            title="Oops! Something went wrong"
            description={errorMessage}
            action={{
              label: "Try Again",
              onClick: () => window.location.reload()
            }}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
