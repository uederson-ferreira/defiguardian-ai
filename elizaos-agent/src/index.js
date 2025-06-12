const express = require('express');
const app = express();

const PORT = process.env.PORT || 3001;

app.use(express.json());

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: "ok",
    service: "elizaos-agent",
    version: "0.1.0",
    ai_models: {
      primary: process.env.AI_PROVIDER || "openai",
      available: ["openai", "anthropic", "openrouter"]
    }
  });
});

app.get('/status', (req, res) => {
  res.json({
    agent_status: "ready",
    capabilities: [
      "risk-analysis",
      "portfolio-assessment", 
      "defi-monitoring"
    ],
    timestamp: new Date().toISOString()
  });
});

app.post('/analyze', (req, res) => {
  res.json({
    message: "Risk analysis endpoint - Coming soon!",
    input: req.body,
    status: "not_implemented"
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🤖 ElizaOS Agent running on port ${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});
