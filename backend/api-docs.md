# DefiGuardian API Documentation

## Base URL
```
http://localhost:8000/api
```

## Authentication
All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### Health & Status
- `GET /health` - API health check
  - Response: `{ "status": "ok", "message": "DefiGuardian API is running", "version": "1.0.0" }`

- `GET /registry/health` - System health with blockchain status
  - Response includes blockchain connection status and smart contract availability

### Registry (Public)
- `GET /registry/protocols` - List all DeFi protocols
  - Returns array of registered protocols with basic info

- `GET /registry/protocols/:address` - Get specific protocol
  - Parameters: protocol contract address
  - Returns detailed protocol information

- `GET /registry/protocols/:address/risk` - Get protocol risk metrics
  - Parameters: protocol contract address
  - Returns risk analysis and metrics

### Authentication
- `POST /auth/nonce` - Request nonce for signing
  - Body: `{ "address": "0x..." }`
  - Returns nonce to sign with Web3 wallet

- `POST /auth/login` - Login with signature
  - Body: `{ "address": "0x...", "signature": "0x..." }`
  - Returns JWT token on success

- `GET /auth/profile` - Get user profile (protected)
  - Requires authentication
  - Returns user details and preferences

- `POST /auth/logout` - Logout (protected)
  - Requires authentication
  - Invalidates current session

### Portfolio Management (Protected)
All portfolio endpoints require authentication.

- `GET /portfolio` - List user portfolios
  - Returns array of user's portfolios with basic info
  - Query params:
    - `limit`: Max number of items (default: 10)
    - `offset`: Pagination offset (default: 0)

- `POST /portfolio` - Create new portfolio
  - Body:
    ```json
    {
      "name": "My DeFi Portfolio",
      "description": "Description (optional)"
    }
    ```
  - Returns created portfolio details

- `GET /portfolio/:id` - Get specific portfolio
  - Parameters: portfolio ID
  - Returns detailed portfolio information including:
    - Basic info (name, description)
    - Positions and balances
    - Risk metrics
    - Performance data

- `PUT /portfolio/:id` - Update portfolio
  - Parameters: portfolio ID
  - Body: Same as create portfolio
  - Returns updated portfolio

- `DELETE /portfolio/:id` - Delete portfolio
  - Parameters: portfolio ID
  - Soft deletes the portfolio

- `GET /portfolio/:id/risk` - Calculate portfolio risk
  - Parameters: portfolio ID
  - Returns:
    - Risk level (LOW, MEDIUM, HIGH, CRITICAL)
    - Overall risk score
    - Diversification score
    - Top risks
    - Recommendations

## Response Format
All responses follow this format:
```json
{
  "success": true,
  "data": { /* response data */ },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description"
}
```

## Rate Limiting
- Public endpoints: 100 requests per minute
- Authenticated endpoints: 300 requests per minute
- Exceeded limits return 429 Too Many Requests

## Security
- All endpoints use HTTPS
- Authentication via Web3 wallet signatures
- JWT tokens for session management
- Rate limiting per IP and user
- Input validation on all endpoints
- CORS configured for frontend domains

## Best Practices
1. Always check response `success` field
2. Handle rate limits with exponential backoff
3. Implement proper error handling
4. Keep JWT tokens secure
5. Validate input before sending
6. Check HTTP status codes