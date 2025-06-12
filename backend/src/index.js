const express = require('express');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    message: "RiskGuardian AI Backend",
    version: "0.1.0",
    status: "running",
    endpoints: {
      health: "/health",
      api: "/api/*"
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    service: "riskguardian-backend",
    version: "0.1.0",
    environment: process.env.NODE_ENV || 'development'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 RiskGuardian Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
