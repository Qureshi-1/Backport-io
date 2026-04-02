# Contributing to Backport

Thank you for your interest in contributing to Backport! This document provides guidelines and instructions for contributing.

## 🎯 Ways to Contribute

- 🐛 Report bugs and issues
- 💡 Suggest new features
- 📝 Improve documentation
- 🔧 Submit pull requests
- 🌐 Translate documentation
- ⭐ Star and share the project

## 🚀 Development Setup

### Prerequisites

- Node.js 18+
- Python 3.10+
- npm or yarn
- Docker (optional)

### 1. Clone the Repository

```bash
git clone https://github.com/Qureshi-1/Backport-io.git
cd Backport-io
```

### 2. Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload --port 8080
```

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```

### 4. Setup CLI

```bash
cd cli

# Install dependencies
npm install

# Build the CLI
npm run build

# Link for local testing
npm link
```

## 📁 Project Structure

```
Backport-io/
├── backend/          # Python FastAPI backend
│   ├── main.py       # Application entry point
│   ├── models.py     # Database models
│   ├── auth.py       # Authentication routes
│   ├── proxy.py      # Proxy/gateway logic
│   ├── user.py       # User management
│   ├── payment.py    # Payment processing
│   └── database.py   # Database configuration
│
├── frontend/         # Next.js frontend
│   ├── src/
│   │   ├── app/      # Next.js App Router pages
│   │   ├── components/  # React components
│   │   └── lib/      # Utility functions
│   └── public/       # Static assets
│
└── cli/              # Node.js CLI tool
    └── src/
        ├── commands/ # CLI commands
        └── utils/    # Utility functions
```

## 🔀 Branching Strategy

- `main` - Stable production code
- `develop` - Development branch
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation improvements

## 📝 Coding Standards

### Python (Backend)

- Follow PEP 8 style guide
- Use type hints where possible
- Write docstrings for functions
- Keep functions small and focused

```python
def check_waf(body_str: str, path_lower: str, query_str: str) -> bool:
    """Check all WAF patterns against request data.
    
    Args:
        body_str: Lowercase request body
        path_lower: Lowercase URL path
        query_str: Lowercase query string
    
    Returns:
        True if malicious payload detected, False otherwise
    """
    combined = f"{body_str} {path_lower} {query_str}"
    for pattern in WAF_PATTERNS:
        if pattern.search(combined):
            return True
    return False
```

### TypeScript (Frontend)

- Use strict TypeScript
- Follow existing component patterns
- Use named exports
- Keep components small

```typescript
interface Props {
  title: string;
  description?: string;
  onAction?: () => void;
}

export function Card({ title, description, onAction }: Props) {
  return (
    <div className="card">
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {onAction && <button onClick={onAction}>Action</button>}
    </div>
  );
}
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest tests/ -v
```

### Frontend Tests

```bash
cd frontend
npm run test
```

## 📤 Submitting Changes

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `npm test` / `pytest`
5. Commit your changes: `git commit -m "Add feature: my feature"`
6. Push to your fork: `git push origin feature/my-feature`
7. Open a Pull Request

## 🐛 Reporting Bugs

Please include:

- Description of the bug
- Steps to reproduce
- Expected behavior
- Screenshots (if applicable)
- Environment details (OS, Python version, etc.)

## 💡 Suggesting Features

We welcome feature suggestions! Please:

- Search existing issues first
- Describe the feature clearly
- Explain the use case
- Provide examples if possible

## 📜 Code of Conduct

- Be respectful and inclusive
- Follow the project's coding standards
- Help others learn and grow
- Keep discussions constructive

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Backport! 🚀
