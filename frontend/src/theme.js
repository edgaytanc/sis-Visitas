import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0D47A1', // azul institucional
      light: '#5472d3',
      dark: '#002171',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#00796B', // teal
      light: '#48a999',
      dark: '#004c40',
      contrastText: '#ffffff'
    },
    background: {
      default: '#f7f9fc',
      paper: '#ffffff'
    }
  },
  shape: {
    borderRadius: 10
  },
  typography: {
    fontFamily: ['Inter', 'Poppins', 'Roboto', 'system-ui', 'Arial', 'sans-serif'].join(','),
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 }
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: { boxShadow: 'none', borderBottom: '1px solid #e6eaf0' }
      }
    }
  }
})

export default theme
