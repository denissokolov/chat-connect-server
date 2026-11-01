# Chat Connect Server

[![CI workflow](https://github.com/denissokolov/chat-connect-server/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/denissokolov/chat-connect-server/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/denissokolov/chat-connect-server.svg)](https://github.com/denissokolov/chat-connect-server/blob/main/LICENSE)

A small streaming proxy for [Chat Connect](https://github.com/denissokolov/chat-connect-web-extension), an AI agent for Chrome's side panel. The extension can call OpenAI directly with the user's own API key, or send its requests through this server, which adds a server-side OpenAI key so it never has to live in the browser.

## How it works

```
extension ──POST /proxy/openai/responses──► server ──► https://api.openai.com/v1/responses
          ◄──────── streamed response (passed through as-is) ◄──────┘
```

- `POST /proxy/openai/responses` takes an OpenAI Responses API request body, forwards it to OpenAI with the server's `OPENAI_API_KEY`, and streams the upstream response straight back. Tool calls, reasoning summaries and text deltas reach the extension unchanged.
- `GET /health` is a health check.

To use it from the extension, set **Custom OpenAI server URL** in the extension settings to `<server-url>/proxy/openai` (the OpenAI SDK appends `/responses`).

> **Note:** the proxy has no authentication or rate limiting of its own. Anyone who can reach it can spend the configured OpenAI key, so run it locally or put it behind your own auth before exposing it.

## Development

Requires Node.js 22+.

```bash
cp .env.example .env      # set OPENAI_API_KEY
npm install
npm run start:dev         # http://localhost:3001 (PORT to override)
npm run check             # typecheck, lint, unit + e2e tests, knip
```

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Key used for all proxied requests |
| `PORT` | Port to listen on (default `3001`) |

## Production

```bash
npm ci
npm run build
npm run start:prod
```

## Tech stack

- NestJS 11 on Fastify, TypeScript
- Vitest unit tests and e2e tests
- ESLint, Prettier, knip
- GitHub Actions CI: typecheck, lint, knip, tests with coverage, e2e tests and build on every push and PR

## License

[MIT](LICENSE)
