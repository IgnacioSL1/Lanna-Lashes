export const Colors = {
  black: '#000000',
  white: '#FFFFFF',
  dark: '#343433',
  mid: '#cbc8c1',
  light: '#b1afac',
  offWhite: '#F5F4F2',
  surface: '#FAFAF9',
  border: '#E8E6E2',
  borderLight: '#F0EEE9',
};

export const Typography = {
  // Inter Tight — headings, labels, UI
  heading1: { fontFamily: 'InterTight-Bold', fontSize: 32, letterSpacing: -0.5 },
  heading2: { fontFamily: 'InterTight-Bold', fontSize: 24, letterSpacing: -0.3 },
  heading3: { fontFamily: 'InterTight-SemiBold', fontSize: 18, letterSpacing: -0.2 },
  heading4: { fontFamily: 'InterTight-SemiBold', fontSize: 15, letterSpacing: -0.1 },
  label:    { fontFamily: 'InterTight-Medium',   fontSize: 11, letterSpacing: 0.15 },
  labelSm:  { fontFamily: 'InterTight-SemiBold', fontSize: 9,  letterSpacing: 0.2  },
  // Inter — body text
  body:     { fontFamily: 'Inter-Regular',       fontSize: 14, lineHeight: 22 },
  bodySmall:{ fontFamily: 'Inter-Regular',       fontSize: 12, lineHeight: 18 },
  price:    { fontFamily: 'InterTight-Bold',      fontSize: 16, letterSpacing: -0.2 },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
};

export const Radius = {
  sm: 2,
  md: 6,
  lg: 10,
  xl: 16,
  full: 999,
};

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
};
