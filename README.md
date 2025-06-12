# V3C3K - AI-assisted Product Validation Tool

A CLI tool for managing and validating product features with AI assistance.

## Overview

V3C3K dynamically analyzes your codebase, feature definitions, and available tooling to determine and orchestrate the optimal agent-driven validation strategy. Instead of relying on predefined scripts, it adapts to your project's specific needs and context.

## Features

- Dynamic codebase analysis
- Real-time feature feedback
- Functional validation for local and deployed environments
- Agent-driven validation orchestration
- Intelligent strategy determination based on project context

## Installation

```bash
npm install -g v3c3k
```

## Usage

```bash
# Add a new feature
v3c3k add -t "Feature Title" -d "Feature description"

# List all features
v3c3k list

# View feature details
v3c3k view [title]

# Update feature status
v3c3k status -t "Feature Title" -s in_progress

# Update feature dependencies
v3c3k dependencies -t "Feature Title" --deps "id1,id2"

# Update feature validation
v3c3k validation -t "Feature Title" --validation "validation rules"

# Configure AI model
v3c3k ai-model -t "Feature Title" --provider anthropic --model "claude-3-opus-20240229"
```

## Security

⚠️ **Important**: The `.v3c3k` directory contains sensitive information including API keys. This directory is automatically added to `.gitignore` to prevent accidental commits. Never commit API keys or share them publicly.

### API Key Security Best Practices:
1. Never commit API keys to version control
2. Use environment variables for API keys in production
3. Regularly rotate API keys
4. Use the minimum required permissions for each API key
5. Monitor API key usage for suspicious activity

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test
```

## License

MIT 