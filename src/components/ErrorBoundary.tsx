import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
          <div className="w-full max-w-sm space-y-4 text-center">
            <div className="text-4xl">:(</div>
            <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">
              An unexpected error occurred. Try refreshing the page.
            </p>
            {this.state.error && (
              <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
              className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Go to homepage
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
