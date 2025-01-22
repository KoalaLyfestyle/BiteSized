import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#94553e' }, // Brownish shade
    secondary: { main: '#D2B48C' }, // Lighter cookie shade
    background: { default: '#FFF8DC' }, // Background color for a cookie vibe
  },
  typography: {
    fontFamily: '"Roboto", "Arial", sans-serif',
  },
});

export default theme;
