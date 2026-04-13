# Backend Deployment Guide (Fresh VPS)

This guide is for **backend-only deployment** on VPS.

- Backend (Express + Socket.io + Prisma): VPS
- PostgreSQL + Redis: VPS (Docker)
- Frontend: Vercel

Recommended setup:
- API domain: `api.yourdomain.com`
- Frontend domain: `yourdomain.com` (Vercel)

## 1) Prepare VPS

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl nginx ufw
```

Install Node.js LTS:

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

Install pnpm + PM2:

```bash
sudo npm i -g pnpm pm2
```

Install Docker + compose plugin:

```bash
sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```

Log out and log in again once after group change.

## 2) Clone Project

```bash
mkdir -p ~/apps && cd ~/apps
git clone <YOUR_REPO_URL> esports
cd esports/backend
```

## 3) Start Database + Redis

```bash
docker compose up -d
docker compose ps
```

## 4) Configure Backend Env

```bash
cp .env.example .env
nano .env
```

Set production values:

- `NODE_ENV=production`
- `PORT=3000`
- `ADMIN_PASSWORD=<strong-password>`
- `DATABASE_URL=postgresql://esports_user:esports_pass@localhost:5432/esports_events`
- `REDIS_HOST=localhost`
- `REDIS_PORT=6379`
- `REDIS_PASSWORD=` (or set if you secure Redis)
- `JWT_SECRET=<at-least-32-chars-random>`
- `JWT_EXPIRES_IN=8h`
- `CORS_ORIGIN=https://yourdomain.com` (your Vercel frontend production domain)
- `DEFAULT_AUCTION_WINDOW_SECONDS=30`
- `BID_INCREMENTS=100,500,1000`

Important:
- Current backend accepts a **single** `CORS_ORIGIN` string.
- If you use Vercel preview URLs, those origins will not match unless code is updated.

## 5) Build + Run Backend

```bash
pnpm install
pnpm db:generate
pnpm db:push
pnpm build
pm2 start dist/index.js --name esports-backend
pm2 save
pm2 startup
```

## 6) Nginx Reverse Proxy (API + Socket.io)

Create Nginx site:

```bash
sudo nano /etc/nginx/sites-available/esports-backend
```

Paste:

```nginx
server {
  listen 80;
  server_name api.yourdomain.com;

  location /api/ {
    proxy_pass http://127.0.0.1:3000/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location /socket.io/ {
    proxy_pass http://127.0.0.1:3000/socket.io/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Enable:

```bash
sudo ln -s /etc/nginx/sites-available/esports-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 7) HTTPS (SSL)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

## 8) Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

## 9) Vercel Frontend Config

In Vercel project env vars set:

- `VITE_API_URL=https://api.yourdomain.com/api`

Then redeploy frontend.

## 10) Verify

- `https://api.yourdomain.com/api/health` should return success
- frontend should load events from backend
- socket updates should work in auction views

## 11) Update Workflow

```bash
cd ~/apps/esports
git pull

cd backend
pnpm install
pnpm db:generate
pnpm build
pm2 restart esports-backend
```

## 12) Useful Commands

```bash
pm2 status
pm2 logs esports-backend
docker compose -f ~/apps/esports/backend/docker-compose.yml ps
docker compose -f ~/apps/esports/backend/docker-compose.yml logs -f
sudo systemctl status nginx
```

## Security Notes

- Do not commit real `.env`.
- Use strong `ADMIN_PASSWORD` and `JWT_SECRET`.
- Keep VPS updated regularly.
