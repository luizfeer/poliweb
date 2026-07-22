/**
 * Carmo Local — design tokens espelhando apps/web (globals.css + carmo-local-design).
 */
export const palette = {
  paper: '#FAF8F5',
  paperDeep: '#F2EEE7',
  ink900: '#191919',
  ink700: '#2F2F2F',
  ink600: '#5A5A5A',
  ink400: '#9A9A9A',
  ink100: '#E4E4E4',
  white: '#FFFFFF',
  cerrado100: '#E1EEDE',
  cerrado500: '#3C6B36',
  cerrado700: '#1F4A2C',
  sky100: '#DCEAF7',
  sky500: '#2E78C2',
  sky700: '#0F4C81',
  clay50: '#FFF1E8',
  clay100: '#FFD9BF',
  clay500: '#E0561B',
  clay600: '#C84810',
  sun100: '#FFF1CC',
  sun500: '#F4B73A',
  discount: '#C81E4A',
  destructive: '#B23A3A',
} as const;

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const shadows = {
  card: {
    shadowColor: '#191919',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  pop: {
    shadowColor: '#191919',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  banner: {
    shadowColor: '#C84810',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
} as const;

export const typography = {
  display: { fontWeight: '800' as const, letterSpacing: -0.4 },
  title: { fontWeight: '800' as const },
  body: { fontWeight: '500' as const },
  caption: { fontWeight: '600' as const },
};
