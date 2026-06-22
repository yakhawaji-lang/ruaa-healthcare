import { MessageCircle } from 'lucide-react';
import { useSettings } from '../useSettings.js';

export default function WhatsAppButton() {
  const { s } = useSettings();
  const wa = s('whatsapp');
  if (!wa) return null;
  return (
    <a className="whatsapp-fab" href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" aria-label="WhatsApp">
      <MessageCircle size={26} />
    </a>
  );
}
