export default function Home() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>🚀 RiskGuardian AI</h1>
      <p>AI-powered DeFi Risk Analysis Platform</p>
      <div style={{ marginTop: '2rem' }}>
        <h2>🎯 Features Coming Soon:</h2>
        <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
          <li>🤖 AI Risk Analysis</li>
          <li>📊 Portfolio Dashboard</li>
          <li>⛓️ Multi-chain Support</li>
          <li>🔗 Smart Contracts</li>
        </ul>
      </div>
      <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#666' }}>
        <p>Backend API: <a href="http://localhost:8000">localhost:8000</a></p>
        <p>ElizaOS Agent: <a href="http://localhost:3001/health">localhost:3001/health</a></p>
      </div>
    </div>
  );
}
