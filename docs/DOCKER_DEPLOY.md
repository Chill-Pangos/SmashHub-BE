# Docker Deploy

## Build image

```bash
docker build -t smashhub-be:latest .
```

## Run container

```bash
docker run -d \
  --name smashhub-be \
  -p 3000:3000 \
  --env-file .env \
  smashhub-be:latest
```

## Notes

- App starts with `node dist/server.js`.
- Ensure all required env vars are set (`NODE_ENV`, `PORT`, `HOST`, `DB_*`, `JWT_*`, `SMTP_*`).
- If your DB requires SSL CA file path, set `DB_SSL_CA_PATH` to a path inside container and mount that file accordingly.
