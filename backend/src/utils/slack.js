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
 *
 * Reading responses:
 *   slack.readDev()  → recent messages from SLACK_DEV_CHANNEL_ID
 *   slack.readPO()   → recent messages from SLACK_PO_CHANNEL_ID
 *   slack.pollForApproval() → scans channel for approve/reject signals for a ticket
 *   Requires: SLACK_BOT_TOKEN with channels:history + channels:read scopes
 */

import { logger } from '../lib/logger.js';

const WEBHOOK_DEV  = process.env.SLACK_WEBHOOK_DEV;
const WEBHOOK_PO   = process.env.SLACK_WEBHOOK_PO;
const ONCALL       = process.env.SLACK_ONCALL || '@oncall';
const BOT_TOKEN    = process.env.SLACK_BOT_TOKEN;
const CHANNEL_DEV  = process.env.SLACK_DEV_CHANNEL_ID;
const CHANNEL_PO   = process.env.SLACK_PO_CHANNEL_ID;

async function sendTo(webhookUrl, label, text) {
  if (!webhookUrl || webhookUrl.includes('YOUR/WEBHOOK')) {
    logger.debug({ label, text }, '[Slack] not configured — skipping');
    return;
  }
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) logger.error({ label, status: res.status }, '[Slack] webhook delivery failed');
  } catch (err) {
    logger.error({ err, label }, '[Slack] webhook error');
  }
}

const sendDev  = (text) => sendTo(WEBHOOK_DEV, 'dev', text);
const sendPO   = (text) => sendTo(WEBHOOK_PO,  'po',  text);
const sendBoth = (text) => Promise.all([sendDev(text), sendPO(text)]);

// ── Read helpers ────────────────────────────────────────────────────────────

async function readChannel(channelId, label, limit = 20) {
  if (!BOT_TOKEN || BOT_TOKEN.includes('YOUR')) {
    logger.debug({ label }, '[Slack] bot token not configured — skipping read');
    return [];
  }
  if (!channelId || channelId.includes('YOUR')) {
    logger.debug({ label }, '[Slack] channel ID not configured — skipping read');
    return [];
  }
  try {
    const url = `https://slack.com/api/conversations.history?channel=${channelId}&limit=${limit}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${BOT_TOKEN}` },
    });
    const data = await res.json();
    if (!data.ok) {
      logger.error({ label, slackError: data.error }, '[Slack] API error');
      return [];
    }
    return data.messages || [];
  } catch (err) {
    logger.error({ err, label }, '[Slack] read error');
    return [];
  }
}

// ── Approval signal detection ───────────────────────────────────────────────

const APPROVE_PATTERNS = [/\bapprove[d]?\b/i, /\blgtm\b/i, /\bship it\b/i, /✅/, /👍/];
const REJECT_PATTERNS  = [/\breject[ed]?\b/i, /\bchanges? needed\b/i, /\bblocked?\b/i, /❌/, /🚫/];

function detectSignal(text) {
  if (APPROVE_PATTERNS.some(p => p.test(text))) return 'approved';
  if (REJECT_PATTERNS.some(p => p.test(text)))  return 'rejected';
  return null;
}

// ── Notification Templates (Phase 22) ──────────────────────────────────────

export const slack = {

  // ── Developer channel ────────────────────────────────────────────────────

  /** Phase 10 — implementation plan posted, awaiting dev review */
  planReadyForReview: ({ issueKey, summary, jiraUrl }) =>
    sendDev(`📋  Implementation plan ready for review — [${issueKey}] ${summary}\n${jiraUrl}\nPlease review and approve, modify, or reject the plan before coding begins.`),

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

  // ── Response Reading ──────────────────────────────────────────────────────

  /**
   * Read recent messages from the dev channel.
   * Returns array of { ts, user, text } objects, newest first.
   * Requires SLACK_BOT_TOKEN + SLACK_DEV_CHANNEL_ID.
   */
  readDev: async (limit = 20) => {
    const msgs = await readChannel(CHANNEL_DEV, 'dev', limit);
    return msgs.map(m => ({ ts: m.ts, user: m.user, text: m.text || '' }));
  },

  /**
   * Read recent messages from the PO channel.
   * Returns array of { ts, user, text } objects, newest first.
   * Requires SLACK_BOT_TOKEN + SLACK_PO_CHANNEL_ID.
   */
  readPO: async (limit = 20) => {
    const msgs = await readChannel(CHANNEL_PO, 'po', limit);
    return msgs.map(m => ({ ts: m.ts, user: m.user, text: m.text || '' }));
  },

  /**
   * Scan a channel for approve/reject signals mentioning a specific issue key.
   * Returns { signal: 'approved'|'rejected'|null, message, ts, user }
   *
   * Usage:
   *   await slack.pollForApproval({ issueKey: 'CC-10', channel: 'dev' })
   *   await slack.pollForApproval({ issueKey: 'v1.2.0', channel: 'po' })
   *
   * Scans the last `limit` messages (default 50). Returns the most recent
   * relevant message found, or { signal: null } if none detected.
   */
  pollForApproval: async ({ issueKey, channel = 'dev', limit = 50 }) => {
    const channelId = channel === 'po' ? CHANNEL_PO : CHANNEL_DEV;
    const label     = channel === 'po' ? 'po' : 'dev';
    const msgs      = await readChannel(channelId, label, limit);

    for (const m of msgs) {
      const text = m.text || '';
      if (!text.includes(issueKey)) continue;
      const signal = detectSignal(text);
      if (signal) {
        return { signal, message: text, ts: m.ts, user: m.user };
      }
    }
    return { signal: null, message: null, ts: null, user: null };
  },
};
