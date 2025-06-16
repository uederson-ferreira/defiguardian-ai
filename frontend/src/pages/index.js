import { Container, Grid, Paper } from '@mui/material';
import RiskAnalysisPanel from '../components/RiskAnalysis/RiskAnalysisPanel';

export default function Home() {
    return ( <
        Container maxWidth = "lg"
        sx = {
            { mt: 4, mb: 4 } } >
        <
        Grid container spacing = { 3 } >
        <
        Grid item xs = { 12 } >
        <
        Paper sx = {
            { p: 2, display: 'flex', flexDirection: 'column' } } >
        <
        h1 > 🚀RiskGuardian AI < /h1> <
        p > AI - powered DeFi Risk Analysis Platform < /p> <
        /Paper> <
        /Grid> <
        Grid item xs = { 12 } >
        <
        RiskAnalysisPanel / >
        <
        /Grid> <
        Grid item xs = { 12 } >
        <
        Paper sx = {
            { p: 2, textAlign: 'center', color: '#666' } } >
        <
        p > Backend API: < a href = "http://localhost:8000" > localhost: 8000 < /a></p >
        <
        p > ElizaOS Agent: < a href = "http://localhost:3001/health" > localhost: 3001 / health < /a></p >
        <
        /Paper> <
        /Grid> <
        /Grid> <
        /Container>
    );
}