/**
 * Slack Notifications — Phase 22
 *
 * Posts structured notifications to the project Slack channel via
 * an Incoming Webhook. All notification templates are defined here
 * so message format stays consistent across the codebase.
 *
 * Setup:
 *   1. Create a Slack app at https://api.slack.com/apps
 *   2. Enable "Incoming Webhooks" and add it to your channel
 *   3. Copy the webhook URL to SLACK_WEBHOOK_URL in your .env
 */

const WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const CHANNEL = process.env.SLACK_CHANNEL || '#cliniccore-dev';
const ONCALL = process.env.SLACK_ONCALL || '@oncall';

/**
 * Core send function. All templates call this.
 * Silently logs (does not throw) if webhook is not configured —
 * notifications are best-effort and must never crash the app.
 */
async function send(text) {
  if (!WEBHOOK_URL || WEBHOOK_URL.includes('YOUR/WEBHOOK')) {
    console.log(`[Slack — not configured] ${text}`);
    return;
  }

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, channel: CHANNEL }),
    });

    if (!res.ok) {
      console.error(`[Slack] Failed to send notification: ${res.status}`);
    }
  } catch (err) {
    console.error('[Slack] Webhook error:', err.message);
  }
}

// ── Notification Templates (Phase 22) ──────────────────────────────────────

export const slack = {
  /** Phase 10 — task moved to In Progress */
  taskStarted: ({ issueKey, summary, branch }) =>
    send(`▶️  [${issueKey}] started — ${summary}\nBranch: ${branch}`),

  /** Phase 10 — PR created */
  prReady: ({ issueKey, summary, prUrl, jiraUrl }) =>
    send(`👀  PR ready — [${issueKey}] ${summary}\n${prUrl} | ${jiraUrl}\nReviewer: please take a look within 48h`),

  /** Phase 26D — PR stale after 48h */
  prStale: ({ issueKey, prUrl, hoursOpen, reviewer }) =>
    send(`⏰  PR waiting ${hoursOpen}h+ — [${issueKey}]\n${prUrl} — ${reviewer} please review when you can`),

  /** Phase 13 — staging deployed */
  stagingDeployed: ({ version, date, stagingUrl }) =>
    send(`🟡  Staging live — v${version} (${date})\nURL: ${stagingUrl}\nSmoke tests: ✅ passing\nReady for review before prod deploy.`),

  /** Phase 14 — production deployed */
  prodDeployed: ({ version, date, prodUrl, releaseNotesUrl, trigger }) =>
    send(`🟢  Production live — v${version} (${date})\n${prodUrl} | Release notes: ${releaseNotesUrl}\nDeployed: ${trigger}`),

  /** Phase 14 — Wednesday deploy skipped */
  deploySkipped: ({ project, reason, nextDate }) =>
    send(`⏸️  Wednesday deploy skipped — ${project}\nReason: ${reason}\nNext window: ${nextDate} or trigger manually.`),

  /** Phase 9 — regression risk flagged */
  regressionFlagged: ({ issueKey, summary, conflict, jiraUrl }) =>
    send(`🚨  Regression risk — [${issueKey}] ${summary}\n${conflict}\nJira: ${jiraUrl} — awaiting human approval before proceeding.\n${ONCALL} FYI`),

  /** Phase 15 — production issue detected */
  prodIssue: ({ version, what, jiraUrl }) =>
    send(`🔴  Production issue — v${version}\n${what}\n${ONCALL} immediate attention needed.\nJira: ${jiraUrl}`),

  /** Phase 23 — bug triaged */
  bugTriaged: ({ bugKey, summary, severity, epicName, jiraUrl }) =>
    send(`🐛  Bug triaged — [${bugKey}] ${summary}\nSeverity: ${severity}\nAssigned to: ${epicName} | ${jiraUrl}`),
};
