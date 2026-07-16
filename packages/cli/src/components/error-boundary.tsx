import { Component, type ReactNode } from "react";
import fs from "fs"; // Add this

export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  override componentDidCatch(error: any, errorInfo: any) {
    // 1. Write the error to a file that won't disappear
    const logData = `CRASH: ${error.message}\nSTACK: ${error.stack}\nINFO: ${JSON.stringify(errorInfo)}`;
    fs.writeFileSync('crash-report.txt', logData);
    
    // 2. Force the process to exit immediately so the terminal unfreezes
    console.error("🚨 UI CRASHED. Error details saved to crash-report.txt");
    process.exit(1);
  }

  override render() {
    if (this.state.hasError) return <text>UI Crashed. Check crash-report.txt</text>;
    return this.props.children;
  }
}