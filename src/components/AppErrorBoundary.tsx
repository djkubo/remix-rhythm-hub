import React from "react";

type AppErrorBoundaryProps = {
  children: React.ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
  error: unknown;
};

export default class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // Keep this as a console error so we can debug production crashes quickly.
    console.error("App crashed:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="glass-card w-full max-w-md p-6 text-center">
          <p className="text-5xl font-black text-primary">Error</p>
          <h1 className="mt-4 font-display text-2xl font-bold">
            Algo salió mal
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Intenta recargar la página. Si el problema continúa, avísanos con una
            captura del error en la consola.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="h-11 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Recargar
            </button>
            <a
              href="/"
              className="h-11 inline-flex items-center justify-center rounded-md border border-border bg-card px-4 text-sm font-semibold hover:bg-card/70"
            >
              Volver al inicio
            </a>
          </div>

          {import.meta.env.DEV && (
            <pre className="mt-6 max-h-48 overflow-auto rounded-md bg-card/50 p-3 text-left text-xs text-muted-foreground">
              {String(this.state.error)}
            </pre>
          )}
        </div>
      </div>
    );
  }
}

