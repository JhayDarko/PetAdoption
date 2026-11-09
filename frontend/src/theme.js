import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    primary: { main: '#21513f', dark: '#173a2d', light: '#4d806a', contrastText: '#fff' },
    secondary: { main: '#c86b4a', dark: '#9e4f35', light: '#e89472', contrastText: '#fff' },
    background: { default: '#f5f7f5', paper: '#ffffff' },
    text: { primary: '#20322b', secondary: '#64746d' },
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.04em' },
    h2: { fontWeight: 800, letterSpacing: '-0.03em' },
    h3: { fontWeight: 750, letterSpacing: '-0.02em' },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiTextField: { defaultProps: { size: 'small' } },
  },
})
