import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
        background: {
            default: '#121212',
            paper: '#1e1e1e',
        },
    },
});

export default function App({ Component, pageProps }) {
    return ( <
        ThemeProvider theme = { theme } >
        <
        CssBaseline / >
        <
        Component {...pageProps }
        /> < /
        ThemeProvider >
    );
}