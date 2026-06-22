// RU-MD brand mark (the official kufic "رؤى" square + roof).
export default function Logo({ size = 40 }) {
  return (
    <img src="/logo-mark.png" alt="RU-MD" width={size} height={size} className="logo" style={{ display: 'block' }} />
  );
}

// Full horizontal logo (mark + RU·MD wordmark), used on light backgrounds.
export function LogoFull({ height = 48 }) {
  return <img src="/logo-full.png" alt="رؤى للرعاية الصحية المنزلية — RU-MD" style={{ height, width: 'auto', display: 'block' }} />;
}
