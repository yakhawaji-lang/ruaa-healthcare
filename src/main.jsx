import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { LangProvider } from './i18n.jsx';
import './styles.css';

// --- Latin numeral enforcement (mirrors PlayTix 2.0) ---
// Some Arabic keyboards/inputs emit Arabic-Indic digits (٠-٩). We normalize all
// numeric input fields to Latin digits (0-9) via a DOM observer.
const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
const toLatin = (str) => str.replace(/[٠-٩]/g, (d) => String(arabicDigits.indexOf(d)));
document.addEventListener('input', (e) => {
  const el = e.target;
  if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
    if (/[٠-٩]/.test(el.value)) {
      const pos = el.selectionStart;
      el.value = toLatin(el.value);
      try { el.setSelectionRange(pos, pos); } catch {}
    }
  }
}, true);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LangProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </LangProvider>
  </React.StrictMode>
);

// --- PWA service worker (enables installable app + Web Push notifications) ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
