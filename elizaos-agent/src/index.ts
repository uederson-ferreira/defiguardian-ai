// elizaos-agent/src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Basic health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'RiskGuardian ElizaOS Agent',
    timestamp: new Date().toISOString(),
    version: '0.1.0'
  });
});

// Basic AI endpoint placeholder
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    // TODO: Implement AI logic here
    const response = {
      message: `Echo: ${message}`,
      timestamp: new Date().toISOString(),
      agent: 'RiskGuardian',
      status: 'development'
    };

    res.json(response);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Risk analysis endpoint placeholder  
app.post('/analyze-risk', async (req, res) => {
  try {
    const { portfolioData } = req.body;
    
    // TODO: Implement risk analysis logic
    const analysis = {
      riskLevel: 'moderate',
      healthFactor: 2.5,
      recommendations: [
        'Portfolio appears stable',
        'Consider diversifying across chains'
      ],
      timestamp: new Date().toISOString()
    };

    res.json(analysis);
  } catch (error) {
    console.error('Risk analysis error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🤖 RiskGuardian ElizaOS Agent running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`💬 Chat endpoint: http://localhost:${PORT}/chat`);
  console.log(`📊 Risk analysis: http://localhost:${PORT}/analyze-risk`);
});

export default app;