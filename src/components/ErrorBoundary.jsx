import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // 这里可以集成 Sentry 等错误监控服务
    // Sentry.captureException(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex items-center justify-center bg-[#e0e5ec]">
          <div className="neu-card p-12 rounded-3xl shadow-2xl max-w-2xl">
            <div className="text-center">
              <div className="text-6xl mb-6">⚠️</div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                应用遇到错误
              </h1>
              <p className="text-gray-600 mb-6">
                很抱歉,应用遇到了一个意外错误。请刷新页面重试。
              </p>
              <details className="text-left bg-gray-100 p-4 rounded-lg mb-6">
                <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                  错误详情
                </summary>
                <pre className="text-xs text-gray-600 overflow-auto">
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 neu-button rounded-xl text-blue-600 font-medium"
              >
                刷新页面
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
