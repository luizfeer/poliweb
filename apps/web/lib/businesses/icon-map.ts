/**
 * Resolve nomes de string para componentes Lucide.
 * Usado em catálogos de categorias (que vivem como dados, sem importar React).
 */
import { createElement } from 'react';
import {
  Activity, Antenna, Beef, BedDouble, Bed, Brain, BriefcaseMedical, Briefcase, Building2,
  Candy, Car, CarFront, Church, Cog, Cookie, Crown,
  Disc, Droplets, Dumbbell,
  Eye, Factory, Fish, FlaskConical, Flame, Flower, Flower2, Footprints,
  GraduationCap, HardHat, HeartPulse, Home, House, IceCreamCone,
  Lamp, Languages, Laptop, Map, Microscope, MountainSnow, Package, PaintBucket,
  PaintRoller, Palette, PartyPopper, PawPrint, Pill, Pizza, Plug,
  Sandwich, School, Scissors, ShoppingBag, ShoppingCart, Shirt, Smile, Sofa, Sparkles,
  Sprout, Square, Stethoscope, Store, Tv, TreePalm,
  Utensils, UtensilsCrossed, WashingMachine, Wind, Wine, Wrench, Zap,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react';

const REGISTRY: Record<string, LucideIcon> = {
  Activity, Antenna, Beef, BedDouble, Bed, Brain, BriefcaseMedical, Briefcase, Building2,
  Candy, Car, CarFront, Church, Cog, Cookie, Crown,
  Disc, Droplets, Dumbbell,
  Eye, Factory, Fish, FlaskConical, Flame, Flower, Flower2, Footprints,
  GraduationCap, HardHat, HeartPulse, Home, House, IceCreamCone,
  Lamp, Languages, Laptop, Map, Microscope, MountainSnow, Package, PaintBucket,
  PaintRoller, Palette, PartyPopper, PawPrint, Pill, Pizza, Plug,
  Sandwich, School, Scissors, ShoppingBag, ShoppingCart, Shirt, Smile, Sofa, Sparkles,
  Sprout, Square, Stethoscope, Store, Tv, TreePalm,
  Utensils, UtensilsCrossed, WashingMachine, Wind, Wine, Wrench, Zap,
};

export const categoryIconNames = Object.keys(REGISTRY).sort((a, b) => a.localeCompare(b));

/** Resolve um nome de ícone Lucide (string) para o componente. Fallback: Store. */
export function getCategoryIcon(name: string): LucideIcon {
  return REGISTRY[name] ?? Store;
}

export function BusinessCategoryIcon({ name, ...props }: LucideProps & { name?: string }) {
  return createElement(name ? getCategoryIcon(name) : Store, props);
}
