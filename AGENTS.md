# Project Instructions

## Core Principles
- Data quality is paramount: Include confidence scores (0-100%) for all retrieved data
- Documentation belongs in `docs/` directory with proper hierarchy, NEVER in root
- Testing is MANDATORY before any feature is complete
- Task-driven development: Always use Cursor todo lists and get approval before execution

## Project Standards
- Clean up all temporary files after task completion
- No emoticons in documentation
- Keep files under ~300 lines for clarity
- Use cost-effective infrastructure choices (prefer Cloudflare)
- Follow conventional commits and ensure CI checks pass

## Critical Requirements
1. **Data Verification**: Perform comprehensive error check after task completion
2. **Documentation Structure**: Use `docs/` with subdirectories (setup/, development/, features/, guides/, api/, status/)
3. **Testing Protocol**: Integration tests, E2E tests, API validation, and component tests with REAL data
4. **Engineering Excellence**: Search before implementing, reuse existing patterns, no assumptions

## API Development
- Use FastAPI with async operations
- Structured error payloads: { code, message, details, request_id }
- Implement health endpoints and structured logging
- Never log sensitive data

For detailed rules, see `.cursor/rules/` directory.
