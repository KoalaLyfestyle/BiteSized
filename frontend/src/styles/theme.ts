import { createTheme } from '@mui/material/styles';
import { fonts, palette, radius } from './tokens';

const theme = createTheme({
  palette: {
    primary: { main: palette.crust, dark: palette.crustDark, contrastText: '#FFFFFF' },
    secondary: { main: palette.tomato, contrastText: '#FFFFFF' },
    success: { main: palette.herb },
    background: { default: palette.cream, paper: palette.paper },
    text: { primary: palette.chocolate, secondary: palette.cocoa },
    divider: palette.line,
  },
  shape: { borderRadius: radius.sm },
  typography: {
    fontFamily: fonts.body,
    h1: { fontFamily: fonts.display, fontWeight: 650, letterSpacing: '-0.02em' },
    h2: { fontFamily: fonts.display, fontWeight: 650, letterSpacing: '-0.015em' },
    h3: { fontFamily: fonts.display, fontWeight: 600 },
    h4: { fontFamily: fonts.display, fontWeight: 600, letterSpacing: '-0.01em' },
    h5: { fontFamily: fonts.display, fontWeight: 600 },
    h6: { fontFamily: fonts.display, fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: `1px solid ${palette.line}`,
          borderRadius: radius.md,
          transition: 'box-shadow 160ms ease, transform 160ms ease',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500 },
        colorSuccess: { backgroundColor: palette.herbSoft, color: palette.herb },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 999, paddingInline: 18 } },
    },
    MuiOutlinedInput: {
      styleOverrides: { root: { backgroundColor: palette.paper, borderRadius: radius.sm } },
    },
  },
});

export default theme;
