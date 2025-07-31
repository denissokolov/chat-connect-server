# Chat Connect Server

[![CI workflow](https://github.com/denissokolov/chat-connect-server/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/denissokolov/chat-connect-server/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/denissokolov/chat-connect-server.svg)](https://github.com/denissokolov/chat-connect-server/blob/main/LICENSE)

## Prerequisites

- Node.js (version 22 or higher)
- npm package manager

## Development

Copy the `.env.example` file as `.env`, then provide values for all listed environment variables.

Install dependencies

```bash
npm install
```

Run local server on http://localhost:3001

```bash
npm run start:dev
```

Run all project checks

```bash
npm run check
```

## Production

```bash
# Install project dependencies
$ npm ci

# Run app in production mode
$ npm run start:prod
```
