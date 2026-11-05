# Amookht Backend

Adaptive AI Learning Platform with Multi-Agent Orchestration.

## Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 16+
- Redis 7+
- Docker (optional)

### Setup

```bash
# Clone and enter backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows

# Install dependencies
pip install -e ".[dev]"

# Copy environment variables
cp .env.example .env
# Edit .env with your API keys

# Start database (if not using Docker)
# Or use Docker:
docker-compose up -d postgres redis

# Run migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --port 8000
```

### Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop
docker-compose down
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
backend/
├── app/
│   ├── domain/           # Domain layer (no dependencies)
│   │   ├── models/       # SQLAlchemy models
│   │   ├── services/     # Business logic
│   │   └── ports/        # Interfaces (LLM, etc.)
│   ├── application/      # Use cases
│   ├── infrastructure/   # Implementations
│   │   ├── database/     # PostgreSQL
│   │   ├── ai/           # LLM adapters
│   │   └── cache/        # Redis
│   ├── api/              # FastAPI routes
│   ├── ai_engine/        # AI orchestration
│   └── plugins/          # Domain modules (TestDaF, etc.)
├── tests/
├── alembic/              # Database migrations
├── pyproject.toml
└── Dockerfile
```

## Development

```bash
# Run tests
pytest tests/ -v

# Run with coverage
pytest --cov=app tests/

# Lint
ruff check app/ tests/

# Type check
mypy app/
```

## Environment Variables

See `.env.example` for all configuration options.

## License

MIT
