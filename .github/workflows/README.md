# CI/CD Pipeline Documentation

## Overview

This directory contains GitHub Actions workflows for OrgaOS continuous integration and deployment.

## Workflows

### `ci.yml` - Continuous Integration

Triggered on:
- Push to `main`, `develop`, or `feature/**` branches
- Pull requests targeting `main` or `develop`

#### Jobs

**1. Backend (`backend`)**
- Spins up MongoDB 7 service container
- Installs Node.js 20.x with npm caching
- Runs `npm ci` for deterministic installs
- Performs security audit (`npm audit`)
- Runs ESLint linting
- Executes tests with coverage reporting
- Uploads coverage artifacts (7-day retention)

**2. Frontend (`frontend`)**
- Installs Node.js 20.x with npm caching
- Runs `npm ci` in frontend directory
- Performs security audit
- Runs ESLint linting
- Executes tests with coverage
- Builds production bundle
- Uploads coverage artifacts

**3. CI Success (`ci-success`)**
- Aggregates results from all jobs
- Fails if any job fails
- Provides single status check for branch protection

## Environment Variables

### Backend Tests
| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string (uses service container) |
| `JWT_SECRET` | Secret key for JWT signing (test value in CI) |
| `NODE_ENV` | Set to `test` for test environment |

### Frontend Tests
| Variable | Description |
|----------|-------------|
| `CI` | Set to `true` for CI environment detection |

## Coverage Thresholds

Tests are configured with the following coverage requirements:
- **Lines**: 80% minimum
- **Branches**: 70% minimum
- **Functions**: 75% minimum
- **Statements**: 80% minimum

## Adding New Workflows

When adding new workflows:
1. Follow naming convention: `{purpose}.yml`
2. Use reusable actions where possible
3. Implement proper caching for dependencies
4. Add appropriate documentation to this README

## Troubleshooting

### Tests Failing in CI but Passing Locally
- Ensure all environment variables are set
- Check MongoDB connection (service must be healthy)
- Verify Node.js version matches local setup

### Audit Failures
- Security audit uses `--audit-level=high`
- Set to `continue-on-error: true` to not block on moderate issues
- Review and update dependencies regularly

### Cache Issues
- GitHub caches npm dependencies based on `package-lock.json`
- If experiencing stale cache, modify lock file or wait for cache expiry
