# Contributing to RiskGuardian AI

Thank you for your interest in contributing! 🎉

## Development Setup

1. **Fork and clone the repository**
2. **Run setup**: `./scripts/setup.sh`
3. **Start development**: `./scripts/start-dev.sh`

## Development Workflow

- `frontend/src/` - React components and pages
- `backend/src/` - API routes and controllers
- `elizaos-agent/src/` - AI agents and services
- `contracts/src/` - Smart contracts

## Testing

```bash
# Test all services
./scripts/test-connectivity.sh

# Test specific service
docker-compose logs [service-name]
```

## Pull Request Process

1. Create feature branch: `git checkout -b feature/awesome-feature`
2. Make your changes
3. Test thoroughly
4. Commit with clear message
5. Push and create PR

## Questions?

Open an issue or start a discussion!
