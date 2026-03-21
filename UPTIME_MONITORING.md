# Uptime Monitoring Setup — UptimeRobot (Free)

## Why
The `/health` endpoint now checks DB connectivity and returns:
- `200 { status: "ok", db: "up" }` — everything healthy
- `503 { status: "degraded", db: "down" }` — DB unreachable

UptimeRobot pings this every 5 minutes and alerts you if it goes down.

---

## Setup Steps

### 1. Create a free UptimeRobot account
Go to [uptimerobot.com](https://uptimerobot.com) → Sign up (free tier: 50 monitors, 5-minute checks).

### 2. Add a monitor for the API

1. Click **+ Add New Monitor**
2. **Monitor Type:** `HTTPS`
3. **Friendly Name:** `ClinicAlly API`
4. **URL:** `https://your-api.onrender.com/health`
5. **Monitoring Interval:** `5 minutes`
6. **Keyword to check (optional):** Enable "Keyword Exists" check → type `"ok"`
   This ensures a 200 with `db: "down"` still triggers an alert.
7. Click **Create Monitor**

### 3. Add a monitor for the frontend

1. Click **+ Add New Monitor**
2. **Monitor Type:** `HTTPS`
3. **Friendly Name:** `ClinicAlly Frontend`
4. **URL:** `https://your-app.onrender.com`
5. **Monitoring Interval:** `5 minutes`
6. Click **Create Monitor**

### 4. Configure alert contacts

1. Go to **My Settings → Alert Contacts**
2. Add your email and/or a Slack webhook:
   - **Slack:** Add contact type "Slack" → paste `SLACK_WEBHOOK_DEV` URL
   - **Email:** Add your on-call email
3. Assign these contacts to both monitors

### 5. Configure status page (optional but recommended)

1. Go to **Status Pages → Create Status Page**
2. Add both monitors
3. Share the public URL with your team

---

## Render Health Check (already configured)

The `render.yaml` already points Render's native health check at `/health`.
Render restarts the service automatically if `/health` returns non-2xx three times in a row.

---

## Alert Thresholds

| Scenario | Behaviour |
|---|---|
| API `/health` returns 503 | UptimeRobot alerts within 5 min; Render may restart service |
| Frontend returns non-2xx | UptimeRobot alerts within 5 min |
| Render free tier cold start | First request after inactivity may take 30–60s — not a real outage |

> **Tip:** UptimeRobot's free tier checks every 5 minutes. If you need 1-minute checks, upgrade to Pro ($7/mo) or use [Better Uptime](https://betterstack.com) which has a generous free tier with 3-minute checks and on-call escalation.
