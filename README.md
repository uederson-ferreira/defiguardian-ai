# RiskGuardian AI

RiskGuardian AI is a risk analysis platform for smart contracts and crypto markets, powered by ElizaOS.

## Features

- Smart contract security analysis
- Real-time market monitoring
- Anomaly detection
- AI chat interface
- Blockchain integration (Avalanche)

## Technologies

### Backend (ElizaOS Agent)
- Node.js
- TypeScript
- Express
- Viem
- Winston (logging)
- Node Cache
- Express Validator
- Rate Limiting
- Helmet (security)

### Frontend
- Next.js
- TypeScript
- Chakra UI
- React Query
- Axios

## Requirements

- Node.js v18.0.0 or higher
- npm v9.0.0 or higher

## Setup

1. Clone the repository:
```bash
git clone https://github.com/your-username/riskguardian-ai.git
cd riskguardian-ai
```

2. Set up environment variables:

For backend (elizaos-agent/.env):
```env
# ElizaOS
ELIZAOS_API_KEY=your_elizaos_api_key
ELIZAOS_ENDPOINT=http://localhost:3000

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Chainlink
CHAINLINK_NODE_URL=http://localhost:6688
CHAINLINK_TOKEN=your_chainlink_token

# Blockchain
WEB3_PROVIDER_URL=https://avax-mainnet.g.alchemy.com/v2/your_api_key
NETWORK_ID=43114
BACKUP_WEB3_PROVIDER_URL=https://api.avax.network/ext/bc/C/rpc
EXPLORER_URL=https://snowtrace.io

# Cache
CACHE_TTL=300
CACHE_CHECK_PERIOD=60

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=logs/app.log
ERROR_LOG_FILE_PATH=logs/error.log
```

For frontend (frontend/.env.local):
```env
# API
NEXT_PUBLIC_API_URL=http://localhost:3000

# Authentication
NEXT_PUBLIC_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_AUTH_CLIENT_ID=your_auth_client_id
NEXT_PUBLIC_AUTH_AUDIENCE=your_auth_audience

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_CHAT=true
NEXT_PUBLIC_ENABLE_MARKET_MONITORING=true
```

3. Install dependencies and start the development environment:
```bash
./start-dev.sh
```

The `start-dev.sh` script will:
- Install backend and frontend dependencies
- Set up the development environment
- Start the backend on port 3000
- Start the frontend on port 3001
- Monitor logs for both services

## API Endpoints

### Contract Analysis
- `POST /analyze-contract`
  ```json
  {
    "contractAddress": "0x...",
    "chainId": 43114
  }
  ```

### Market Monitoring
- `POST /monitor-market`
  ```json
  {
    "assets": ["0x...", "0x..."]
  }
  ```

### Anomaly Detection
- `POST /detect-anomalies`
  ```json
  {
    "price": [...],
    "volume": [...],
    "liquidity": [...],
    "transactions": [...]
  }
  ```

### Chat
- `POST /chat`
  ```json
  {
    "message": "string",
    "context": {}
  }
  ```

### Blockchain
- `GET /block/:blockNumber`
- `GET /balance/:address`
- `GET /transaction/:txHash`

## Caching

The system uses in-memory caching to optimize performance:
- Contract analysis: 5 minutes
- Market data: 1 minute
- Key system based on method and parameters

## Logging

Logs are separated into:
- `logs/app.log`: General application logs
- `logs/error.log`: Error logs

## Security

- IP-based rate limiting
- Input validation
- Configured CORS
- Security headers via Helmet
- Data sanitization

## Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.