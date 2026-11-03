import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error("ErrorBoundary caught:", error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                this.props.fallback || (
                    <div className="flex items-center justify-center h-2/3">
                        <div className="text-center border-(--crm-white) border p-10 rounded-2xl">
                            <h2 className="text-lg font-semibold text-red-500 mb-2">
                                Ceva nu a mers bine - eroare la randare
                            </h2>
                            <p className="text-sm text-(--crm-surface-color) mb-4">
                                Eroare: {this.state.error?.message}
                            </p>
                            <button
                                onClick={() => this.setState({ hasError: false, error: null })}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm mb-4"
                            >
                                Încearcă din nou
                            </button>
                            <p>Extra info: ErrorBoundary Error</p>
                        </div>
                    </div>
                )
            );
        }

        return this.props.children;
    }
}