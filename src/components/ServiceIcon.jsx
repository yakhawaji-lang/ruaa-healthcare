// Maps a service icon key to a lucide-react icon.
import {
  Stethoscope, HeartPulse, FlaskConical, Activity, Pill, Apple, HandHeart,
  Ribbon, BookOpen, Dumbbell, Syringe, Bandage, ShieldCheck, Wind, Plus,
} from 'lucide-react';

const map = {
  stethoscope: Stethoscope,
  'heart-pulse': HeartPulse,
  flask: FlaskConical,
  activity: Activity,
  pill: Pill,
  apple: Apple,
  'hand-heart': HandHeart,
  ribbon: Ribbon,
  'book-open': BookOpen,
  dumbbell: Dumbbell,
  syringe: Syringe,
  bandage: Bandage,
  'shield-check': ShieldCheck,
  lungs: Wind,
};

export default function ServiceIcon({ name, size = 28, ...props }) {
  const Icon = map[name] || Plus;
  return <Icon size={size} {...props} />;
}

export const iconKeys = Object.keys(map);
