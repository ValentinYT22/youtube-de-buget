# MiniTube — Starter (GitHub + Render + S3)

This repository is a minimal starter that demonstrates **uploading video files directly to S3 using presigned PUT URLs**, with a small backend that signs URLs and stores metadata in SQLite.

**Configured for:**
- S3 bucket: `minitube-videos-test`
- AWS region: `eu-central-1`
- Recommended repo name: `minitube`

---

## Contents

- `backend/` - Express backend that generates presigned PUT URLs and stores metadata (SQLite).
- `frontend/` - Static frontend (index.html) that can be hosted on **GitHub Pages**.
- `docker-compose.yml` - Optional: run backend locally in Docker.
- `.env.example` - environment variable template for backend.

---

## Quickstart — Deploy backend to Render (recommended)

1. Create an AWS S3 bucket named `minitube-videos-test` in region `eu-central-1`.
2. Set the bucket CORS to allow PUT and GET from your origin (you can start with `*` during development).
3. Create an IAM user or role with permission to `s3:PutObject` and `s3:GetObject` on your bucket.
4. Push this repository to GitHub (repo name `minitube` recommended).
5. Create a new service on Render:
   - Connect your GitHub account and select the `minitube` repository.
   - Select **Web Service**, Node environment.
   - Set the build and start commands (default `npm install` + `npm start`).
   - Add Render environment variables (in Render dashboard):
     - `AWS_REGION=eu-central-1`
     - `S3_BUCKET=minitube-videos-test`
     - `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` (or configure an instance role)
6. Deploy — Render will run the backend and expose it at a public HTTPS URL like `https://minitube-backend.onrender.com`.
7. Edit `frontend/config.js` and set `API_BASE` to your backend URL. Commit and push changes to GitHub.
8. Enable GitHub Pages for the `frontend/` directory (or serve it via GitHub Pages settings).

---

## Run locally with Docker (optional)

Make sure Docker is installed. From the project root run:

```bash
docker-compose up --build
```

Backend will be available at `http://localhost:3000`. Edit `frontend/config.js` to `API_BASE: "http://localhost:3000"` and open `frontend/index.html` (or serve the `frontend` folder).

---

## Notes & next steps

- For production, make your S3 bucket private and use CloudFront with signed URLs or keep backend proxy.
- Add authentication (JWT) to protect who can request presigned URLs.
- Implement server-side processing (transcoding thumbnails, HLS) as background jobs.
- For resumable/large uploads consider S3 multipart uploads.
- This starter uses SQLite for simplicity — migrate to Postgres for production.

---

If you want, I can:
- create the GitHub repository for you (requires access), or
- prepare a single ZIP file with all files ready to upload.

Which would you like next?