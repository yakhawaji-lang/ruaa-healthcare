import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { LangProvider } from './i18n.jsx';
import './styles.css';

// --- Guard against browser extensions (page translators, grammar tools) that move
// or wrap React-owned DOM nodes. Without this React throws
// "Failed to execute 'removeChild' on 'Node'" and the whole screen falls over.
if (typeof Node === 'function' && Node.prototype) {
  const origRemove = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (child && child.parentNode !== this) {
      if (child.parentNode) return origRemove.call(child.parentNode, child);
      return child;
    }
    return origRemove.call(this, child);
  };
  const origInsert = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (newNode, ref) {
    if (ref && ref.parentNode !== this) return origInsert.call(this, newNode, null);
    return origInsert.call(this, newNode, ref);
  };
}

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
