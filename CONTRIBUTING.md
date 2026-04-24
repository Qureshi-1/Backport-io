# Contributing to Backport

Thank you for your interest in contributing to Backport. This guide covers everything you need to know to make a contribution — from setting up your local environment to submitting a pull request.

## Ways to Contribute

- **Report bugs** — Found something broken? Open a [Bug Report](.github/ISSUE_TEMPLATE/bug_report.yml).
- **Suggest features** — Have an idea? Open a [Feature Request](.github/ISSUE_TEMPLATE/feature_request.yml).
- **Submit code** — Fix a bug, add a feature, or improve performance. See the workflow below.
- **Improve documentation** — Fix typos, clarify instructions, or add missing sections.
- **Review pull requests** — Help maintain code quality by reviewing open PRs from other contributors.

## Development Setup

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | 18+ |
| Python | 3.10+ |
| npm or bun | Latest |
| Git | Latest |
| Docker (optional) | Latest |

### Clone and Install

```bash
# Clone the repository with submodules
git clone --recurse-submodules https://github.com/Qureshi-1/Backport-io.git
cd Backport-io

# If you already cloned without submodules
git submodule update --init --recursive
```

### Backend Setup

```bash
cd backend

# Create a virtual environment
python -m venv venv
source venv/bin/activate    # Linux/macOS
# venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment variables
cp ../.env.example .env
# Edit .env with your local configuration

# Start the development server
uvicorn main:app --reload --port 8080
```

The backend API runs at `http://localhost:8080`. The interactive API docs are available at `http://localhost:8080/docs`.

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend runs at `http://localhost:3000`.

### CLI Setup

```bash
cd cli

# Install dependencies
npm install

# Build the CLI
npm run build

# Link globally for local testing
npm link

# Verify
backport --help
```

## Project Structure

```
Backport-io/
├── backend/                 # Python FastAPI gateway engine
│   ├── main.py              # Entry point, middleware pipeline
│   ├── proxy.py             # Reverse proxy & routing
│   ├── auth.py              # Authentication & API keys
│   ├── waf.py               # WAF engine
│   ├── custom_waf.py        # Custom WAF rules
│   ├── rate_limiter.py      # Rate limiting
│   ├── cache.py             # Response caching
│   ├── circuit_breaker.py   # Circuit breaker
│   ├── transform.py         # Response transformation
│   ├── mock.py              # API mocking
│   ├── analytics.py         # Analytics & metrics
│   ├── models.py            # Database models
│   └── database.py          # DB configuration
│
├── frontend/                # Next.js 16 dashboard
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   ├── components/      # React components
│   │   └── lib/             # Utilities
│   └── public/              # Static assets
│
└── cli/                     # Node.js CLI tool
    └── src/
        ├── commands/        # CLI commands
        └── utils/           # CLI utilities
```

## Branching Strategy

| Branch | Purpose |
|---|---|
| `main` | Production-ready code. Do not commit directly. |
| `feature/*` | New features (e.g., `feature/oauth-support`) |
| `fix/*` | Bug fixes (e.g., `fix/waf-sql-injection-false-positive`) |
| `docs/*` | Documentation changes |

## Coding Standards

### Python (Backend)

- Follow [PEP 8](https://peps.python.org/pep-0008/) style guidelines.
- Use type hints for all function signatures.
- Write docstrings for public functions and classes.
- Keep functions focused on a single responsibility.
- Use descriptive variable names — avoid single-letter variables except in loops.

```python
def check_waf(body_str: str, path_lower: str, query_str: str) -> bool:
    """Evaluate all WAF patterns against the incoming request data.

    Args:
        body_str: Lowercase string representation of the request body.
        path_lower: Lowercase URL path.
        query_str: Lowercase query string.

    Returns:
        True if a malicious payload is detected, False otherwise.
    """
    combined = f"{body_str} {path_lower} {query_str}"
    for pattern in WAF_PATTERNS:
        if pattern.search(combined):
            return True
    return False
```

### TypeScript / React (Frontend)

- Use strict TypeScript — no `any` types unless absolutely necessary.
- Use functional components with hooks. Do not use class components.
- Use named exports for components.
- Follow existing component patterns and naming conventions.
- Keep components small and focused.

```typescript
interface CardProps {
  title: string;
  description?: string;
  onAction?: () => void;
}

export function Card({ title, description, onAction }: CardProps) {
  return (
    <div className="rounded-lg border border-white/10 p-6">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {description && <p className="mt-2 text-sm text-zinc-400">{description}</p>}
      {onAction && (
        <button onClick={onAction} className="mt-4 text-sm text-emerald-400 hover:text-emerald-300">
          Learn more
        </button>
      )}
    </div>
  );
}
```

## Commit Messages

Write clear, descriptive commit messages following this format:

```
type: brief description

<blank line>
Optional body with more context about the change.
```

**Types:** `feat`, `fix`, `refactor`, `docs`, `style`, `perf`, `test`, `chore`

**Examples:**

```
feat: add OAuth2 authentication support for third-party integrations
fix: resolve race condition in rate limiter under high concurrency
docs: update API key rotation instructions in README
```

## Pull Request Workflow

1. **Fork** the repository.
2. **Create a branch** from `main` with a descriptive name: `git checkout -b feature/your-feature`
3. **Make your changes** and commit with clear messages.
4. **Test locally** — verify the frontend builds, backend starts, and no tests break.
5. **Push to your fork**: `git push origin feature/your-feature`
6. **Open a Pull Request** against the `main` branch of this repository.
7. Fill in the [PR template](.github/PULL_REQUEST_TEMPLATE/pull_request_template.md) completely.

### PR Requirements

- All existing tests must pass.
- New features should include tests where applicable.
- Documentation should be updated for any user-facing changes.
- No linting warnings in the changed files.

## Reporting Bugs

Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.yml) when reporting issues. Include:

- A clear description of the problem.
- Steps to reproduce the behavior.
- The expected vs. actual behavior.
- Your environment details (OS, version, browser).
- Relevant logs or error messages.

## License

By contributing to Backport, you agree that your contributions will be licensed under the [MIT License](LICENSE).
