# Esports Backend (TypeScript + Express + Socket.IO)

## Run

From workspace root:

1. `npm run backend:dev`
2. `npm run backend:build`
3. `npm run backend:start`

Or from this folder:

1. `npm run dev`
2. `npm run build`
3. `npm run start`

## Environment

Copy `.env.example` to `.env` and edit values as needed.

- `PORT` default: `4000`
- `FRONTEND_ORIGIN` default: `http://localhost:5173`
- `POSTGRES_HOST` default: `localhost`
- `POSTGRES_PORT` default: `5432`
- `POSTGRES_DB` default: `esports`
- `POSTGRES_USER` default: `postgres`
- `POSTGRES_PASSWORD` default: `postgres`
- `REDIS_URL` default: `redis://localhost:6379`

## HTTP Endpoints

- `GET /health`
- `GET /ping`

## Socket.IO

Connection:

- URL: `http://localhost:4000`
- Path: `/socket.io`

Client events to send:

1. `ping`
2. `chat` with string payload

Server events to receive:

1. `welcome` payload: `{ clientId, online }`
2. `system` payload: `{ message }`
3. `chat` payload: `{ from, text, timestamp }`
4. `pong` payload: `{ timestamp }`
5. `error` payload: `{ message }`
