# IoT API JS - Claude Instructions

Next.js REST API demonstrating InfluxDB 3 Core integration for IoT device data.

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
| `lib/influxdb.js` | Client factory and query/write helpers |
| `pages/api/devices/create.js` | Device registration |
| `pages/api/devices/_devices.js` | Shared device queries |
| `pages/api/devices/[[...deviceParams]].js` | Device CRUD + measurements |

## Documentation

| Topic | Location |
|-------|----------|
| System architecture | [docs/architecture.md](docs/architecture.md) |
| Development setup | [docs/development.md](docs/development.md) |
| API endpoints | [docs/api-reference.md](docs/api-reference.md) |
| Code patterns | [docs/code-patterns.md](docs/code-patterns.md) |
| Contributing | [docs/contributing.md](docs/contributing.md) |
| Testing workflow | [.claude/skills/run-tests/SKILL.md](.claude/skills/run-tests/SKILL.md) |

## Other Resources

- [AGENTS.md](AGENTS.md) - Guide for general AI assistants
- [.github/INSTRUCTIONS.md](.github/INSTRUCTIONS.md) - Navigation guide
- [.claude/](.claude/) - Claude Code settings and skills
