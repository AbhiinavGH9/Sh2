# Sh2 Audio Streamer - Render Deployment Guide

This guide covers deploying the **Sh2 Audio Streamer** application to [Render](https://render.com/).

Since this is a full-stack application (Vite frontend + Node/Express backend) built into a single server, Render will build both and serve them out of a single Web Service.

## Prerequisites
1. A [Render](https://render.com) account.
2. A [Supabase](https://supabase.com) account with a provisioned project for PostgreSQL and Realtime Broadcast.
3. Your codebase pushed to GitHub.

## Option A: Deploy via Blueprint (Recommended)
This codebase includes a `render.yaml` configuration for automatic provisioning.

1. Go to the **[Render Dashboard](https://dashboard.render.com/blueprints)**.
2. Click **New** > **Blueprint**.
3. Connect your GitHub repository (`AbhiinavGH9/Sh2`).
4. Render will automatically detect the `render.yaml` file.
5. You will be prompted to enter the required Environment Variables:
   - `DATABASE_URL` (Your Supabase PostgreSQL Connection String, e.g., `postgresql://postgres:YOUR_PASSWORD@...:5432/postgres`)
   - `VITE_SUPABASE_URL` (Your Supabase Project URL)
   - `VITE_SUPABASE_ANON_KEY` (Your Supabase `anon` public key)
6. Click **Apply**. 

Render will automatically build and deploy your app.

---

## Option B: Deploy Manually

If you prefer to configure it manually through the dashboard:

1. Go to your Render Dashboard and create a **New Web Service**.
2. Connect your GitHub repository.
3. Use the following settings:
   - **Name**: `sh2-audio-streamer`
   - **Environment**: `Node`
   - **Build Command**: `npm install --include=dev && npm run db:push && npm run build`
   - **Start Command**: `npm start`
4. Expand **Advanced** and add the following Environment Variables:

| Key | Value | Description |
|-----|-------|-------------|
| `NODE_ENV` | `production` | Enables production optimizations. |
| `DATABASE_URL` | `postgresql://...` | Your Supabase Postgres connection string. |
| `SESSION_SECRET` | *[Generate a random string]* | Used for securing sessions. |
| `VITE_SUPABASE_URL` | `https://[PROJECT_ID].supabase.co` | Find this in Supabase Project Settings > API. |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` | Find this in Supabase Project Settings > API. |
| `PORT` | `5000` | Optional. Render injects its own by default. |

5. Click **Create Web Service**.

## Verification
Once deployed, check the Render logs. You should see:
```text
✓ built in <time>
building server...
serving on port <assigned_port>
```
Visit your `https://your-app.onrender.com` URL to ensure the app loads successfully and test the WebRTC channels!
