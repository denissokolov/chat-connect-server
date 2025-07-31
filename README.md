# Chat Connect Server

[![License](https://img.shields.io/github/license/denissokolov/chat-connect-web-extension.svg)](https://github.com/denissokolov/chat-connect-web-extension/blob/main/LICENSE)

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
