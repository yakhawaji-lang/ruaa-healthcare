import { useEffect, useRef } from 'react';
import { useLang } from '../i18n.jsx';

const T = {
  ar: { hint: 'انقر على الخريطة أو اسحب المؤشر لضبط موقعك بدقة.' },
  en: { hint: 'Click the map or drag the pin to set your location precisely.' },
};

// Load Leaflet (map library) once from CDN — no API key, free OpenStreetMap tiles.
let leafletPromise;
function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
    document.head.appendChild(css);
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    s.onload = () => resolve(window.L);
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return leafletPromise;
}

// Interactive picker: click anywhere or drag the pin to set an exact location.
export default function LocationMap({ lat, lng, onPick }) {
  const { lang } = useLang();
  const tt = T[lang];
  const ref = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    let dead = false;
    loadLeaflet().then((L) => {
      if (dead || !ref.current || map.current) return;
      const has = lat && lng;
      const start = [Number(lat) || 24.7136, Number(lng) || 46.6753];
      map.current = L.map(ref.current, { scrollWheelZoom: true }).setView(start, has ? 15 : 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, attribution: '© OpenStreetMap',
      }).addTo(map.current);
      const icon = L.divIcon({ className: 'loc-pin-wrap', html: '<span class="loc-pin"></span>', iconSize: [30, 30], iconAnchor: [15, 28] });
      marker.current = L.marker(start, { draggable: true, icon }).addTo(map.current);
      marker.current.on('dragend', () => { const p = marker.current.getLatLng(); onPickRef.current(p.lat, p.lng); });
      map.current.on('click', (e) => { marker.current.setLatLng(e.latlng); onPickRef.current(e.latlng.lat, e.latlng.lng); });
      setTimeout(() => map.current && map.current.invalidateSize(), 250);
    });
    return () => { dead = true; if (map.current) { map.current.remove(); map.current = null; marker.current = null; } };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reflect external changes (geolocation / paste / typed coordinates) onto the map.
  useEffect(() => {
    if (!map.current || !marker.current || !lat || !lng) return;
    const ll = [Number(lat), Number(lng)];
    if (Number.isNaN(ll[0]) || Number.isNaN(ll[1])) return;
    marker.current.setLatLng(ll);
    map.current.setView(ll, Math.max(map.current.getZoom(), 15));
  }, [lat, lng]);

  return (
    <div className="loc-map-box">
      <div className="loc-map" ref={ref} />
      <p className="loc-hint">{tt.hint}</p>
    </div>
  );
}
