/**
 * Slack Notifications — Phase 22
 *
 * Two channels:
 *   DEV  — developer-directed: task activity, PRs, regressions, deploys, prod issues
 *   PO   — product owner-directed: staging ready for sign-off, prod live, release notes, bug escalations
 *
 * Routing:
 *   sendDev()  → SLACK_WEBHOOK_DEV
 *   sendPO()   → SLACK_WEBHOOK_PO
 *   sendBoth() → both channels
 */

const WEBHOOK_DEV = process.env.SLACK_WEBHOOK_DEV;
const WEBHOOK_PO  = process.env.SLACK_WEBHOOK_PO;
const ONCALL      = process.env.SLACK_ONCALL || '@oncall';

async function sendTo(webhookUrl, label, text) {
  if (!webhookUrl || webhookUrl.includes('YOUR/WEBHOOK')) {
    console.log(`[Slack:${label} — not configured] ${text}`);
    return;
  }
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) console.error(`[Slack:${label}] Failed: ${res.status}`);
  } catch (err) {
    console.error(`[Slack:${label}] Webhook error:`, err.message);
  }
}

const sendDev  = (text) => sendTo(WEBHOOK_DEV, 'dev', text);
const sendPO   = (text) => sendTo(WEBHOOK_PO,  'po',  text);
const sendBoth = (text) => Promise.all([sendDev(text), sendPO(text)]);

// ── Notification Templates (Phase 22) ──────────────────────────────────────

export const slack = {

  // ── Developer channel ────────────────────────────────────────────────────

  /** Phase 10 — task moved to In Progress */
  taskStarted: ({ issueKey, summary, branch }) =>
    sendDev(`▶️  [${issueKey}] started — ${summary}\nBranch: ${branch}`),

  /** Phase 10 — PR created */
  prReady: ({ issueKey, summary, prUrl, jiraUrl }) =>
    sendDev(`👀  PR ready — [${issueKey}] ${summary}\n${prUrl} | ${jiraUrl}\nReviewer: please take a look within 48h`),

  /** Phase 26D — PR stale after 48h */
  prStale: ({ issueKey, prUrl, hoursOpen, reviewer }) =>
    sendDev(`⏰  PR waiting ${hoursOpen}h+ — [${issueKey}]\n${prUrl} — ${reviewer} please review when you can`),

  /** Phase 9 — regression risk flagged */
  regressionFlagged: ({ issueKey, summary, conflict, jiraUrl }) =>
    sendDev(`🚨  Regression risk — [${issueKey}] ${summary}\n${conflict}\nJira: ${jiraUrl} — awaiting human approval before proceeding.\n${ONCALL} FYI`),

  /** Phase 15 — production issue detected */
  prodIssue: ({ version, what, jiraUrl }) =>
    sendBoth(`🔴  Production issue — v${version}\n${what}\n${ONCALL} immediate attention needed.\nJira: ${jiraUrl}`),

  /** Phase 27 — dependency update PR ready */
  dependencyUpdatePR: ({ count, skipped, prUrl }) =>
    sendDev(`📦  Dependency updates PR ready\n${count} packages updated | ${skipped} major skipped\n${prUrl}`),

  // ── Product Owner channel ────────────────────────────────────────────────

  /** Phase 13 — staging deployed, PO needs to sign off before prod */
  stagingDeployed: ({ version, date, stagingUrl }) =>
    sendPO(`🟡  Staging live — v${version} (${date})\nURL: ${stagingUrl}\nSmoke tests: ✅ passing\nReady for your review before prod deploy.`),

  /** Phase 14 — production deployed */
  prodDeployed: ({ version, date, prodUrl, releaseNotesUrl, trigger }) =>
    sendPO(`🟢  Production live — v${version} (${date})\n${prodUrl} | Release notes: ${releaseNotesUrl}\nDeployed: ${trigger}`),

  /** Phase 14 — Wednesday deploy skipped */
  deploySkipped: ({ project, reason, nextDate }) =>
    sendPO(`⏸️  Wednesday deploy skipped — ${project}\nReason: ${reason}\nNext window: ${nextDate} or trigger manually.`),

  /** Phase 23 — bug triaged; Critical/High also goes to dev */
  bugTriaged: ({ bugKey, summary, severity, epicName, jiraUrl }) => {
    const msg = `🐛  Bug triaged — [${bugKey}] ${summary}\nSeverity: ${severity}\nAssigned to: ${epicName} | ${jiraUrl}`;
    const isCritical = ['Critical', 'High'].includes(severity);
    return isCritical ? sendBoth(msg) : sendPO(msg);
  },
};
