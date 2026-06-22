// Convenience hook to read bilingual site settings.
import { useSite } from './App.jsx';
import { useLang } from './i18n.jsx';

export function useSettings() {
  const site = useSite();
  const { lang } = useLang();
  const settings = site?.settings || {};
  // s('phone') -> language-appropriate value, with Arabic fallback.
  const s = (key) => settings[key]?.[lang] ?? settings[key]?.ar ?? '';
  return { s, settings };
}
