"use client";

import { Component, ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
	children: ReactNode;
	fallback?: ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

export default class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	state: ErrorBoundaryState = {
		hasError: false,
		error: null,
	};

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error("Error caught by ErrorBoundary:", error, errorInfo);
		// Optionally log to an error reporting service here
	}

	render() {
		if (this.state.hasError) {
			return (
				this.props.fallback || (
					<div className="p-6 bg-red-50 border border-red-200 rounded-md text-center">
						<h2 className="text-lg font-semibold text-red-800">
							Something went wrong
						</h2>
						<p className="mt-2 text-sm text-red-600">
							{this.state.error?.message || "An unexpected error occurred."}
						</p>
						<button
							onClick={() => this.setState({ hasError: false, error: null })}
							className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
						>
							Try Again
						</button>
					</div>
				)
			);
		}

		return this.props.children;
	}
}
