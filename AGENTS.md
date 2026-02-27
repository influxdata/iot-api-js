# IoT API JS - AI Assistant Guide

Sample application for InfluxData tutorials demonstrating REST APIs with InfluxDB 3 Core.

**Target audience:** Developers learning to build IoT applications with InfluxDB 3.

## Quick Reference

| Task | Command |
|------|---------|
| Install | `yarn` |
| Dev server | `yarn dev -p 5200` |
| Run tests | `yarn test` |
| Start InfluxDB | `docker compose up -d influxdb3-core` |

## Key Files

| File | Purpose |
|------|---------|
| `lib/influxdb.js` | InfluxDB client factory and helpers |
| `pages/api/devices/create.js` | Device registration endpoint |
| `pages/api/devices/_devices.js` | Shared device query logic |
| `pages/api/devices/[[...deviceParams]].js` | Device CRUD operations |
| `__tests__/api.test.js` | API integration tests |

## Documentation

| Topic | Location |
|-------|----------|
| System architecture | [docs/architecture.md](docs/architecture.md) |
| Development setup | [docs/development.md](docs/development.md) |
| API endpoints | [docs/api-reference.md](docs/api-reference.md) |
| Code patterns | [docs/code-patterns.md](docs/code-patterns.md) |
| Contributing | [docs/contributing.md](docs/contributing.md) |

## Other Resources

- [CLAUDE.md](CLAUDE.md) - For Claude with MCP
- [README.md](README.md) - User-facing documentation
- [.github/INSTRUCTIONS.md](.github/INSTRUCTIONS.md) - Navigation guide
