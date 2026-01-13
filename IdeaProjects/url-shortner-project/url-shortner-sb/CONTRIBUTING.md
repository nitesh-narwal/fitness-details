# Contributing to Shortly

First off, thank you for considering contributing to Shortly! It's people like you that make Shortly such a great tool.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct:
- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on what is best for the community
- Show empathy towards other community members

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

**Bug Report Template:**
```
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
 - OS: [e.g. Windows 11, macOS, Ubuntu]
 - Browser [e.g. Chrome, Safari]
 - Java Version [e.g. 22]
 - Node.js Version [e.g. 18]

**Additional context**
Add any other context about the problem here.
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- A clear and descriptive title
- A detailed description of the proposed enhancement
- Explain why this enhancement would be useful
- List any alternatives you've considered

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Make your changes** with clear, descriptive commit messages
3. **Test your changes** thoroughly
4. **Update documentation** if needed
5. **Submit a pull request**

## Development Setup

### Prerequisites

- Java 22+
- Node.js 18+
- PostgreSQL
- Maven

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/nitesh-narwal/url-shortner-sb.git
cd url-shortner-sb

# Copy environment example
cp .env.prod .env
# Edit .env with your database credentials

# Run the backend
./mvnw spring-boot:run
```

### Frontend Setup

```bash
cd url-shortner-frontend

# Copy environment example
cp .env.prod .env
# Edit .env if needed

# Install dependencies
npm install

# Run development server
npm run dev
```

## Style Guidelines

### Java Code Style

- Follow standard Java naming conventions
- Use meaningful variable and method names
- Add Javadoc comments for public methods
- Keep methods focused and concise
- Use Lombok annotations where appropriate

### JavaScript/React Code Style

- Use functional components with hooks
- Follow ESLint configuration
- Use meaningful component and variable names
- Keep components focused and reusable
- Use proper prop-types or TypeScript types

### Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

**Examples:**
```
✨ Add one-time URL feature
🐛 Fix authentication token refresh
📝 Update README with new API endpoints
♻️ Refactor user service for better performance
🎨 Improve dashboard UI styling
```

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding tests

**Examples:**
- `feature/add-qr-codes`
- `fix/login-redirect-issue`
- `docs/update-api-documentation`

## Testing

### Backend Tests

```bash
./mvnw test
```

### Frontend Tests

```bash
cd url-shortner-frontend
npm test
```

## Documentation

- Update the README.md if your changes affect setup or usage
- Add JSDoc/Javadoc comments for new methods
- Update API documentation for new endpoints

## Questions?

Feel free to open an issue with your question or reach out to the maintainers.

---

Thank you for contributing! 🎉

