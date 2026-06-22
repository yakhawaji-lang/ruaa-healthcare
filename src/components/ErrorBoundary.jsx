import { Component } from 'react';

// Catches render-time errors so a single failing component doesn't blank the
// whole app; shows the error message (helpful while developing).
export default class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('UI error:', error, info); }
  render() {
    if (this.state.error) {
      return (
        <div dir="rtl" style={{ maxWidth: 680, margin: '60px auto', padding: 24, fontFamily: 'inherit' }}>
          <h2 style={{ color: '#0b3556' }}>حدث خطأ غير متوقع في الصفحة</h2>
          <p style={{ color: '#5a6b78' }}>تم إيقاف هذا الجزء لحمايتك. يمكنك تحديث الصفحة (Ctrl+Shift+R).</p>
          <pre style={{ background: '#f3f6f8', border: '1px solid #e1e8ec', borderRadius: 10, padding: 14, whiteSpace: 'pre-wrap', color: '#b3402e', fontSize: 13, direction: 'ltr' }}>
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <button onClick={() => location.reload()} style={{ marginTop: 12, padding: '10px 18px', borderRadius: 10, border: 'none', background: '#0b3556', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
            تحديث الصفحة
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
