'use client';

import { ChangeEvent, FormEvent, useMemo, useState } from "react";

import type { AgentRunSummary } from "@/lib/schemas";
import styles from "./page.module.css";

type UnsubscribeMode = "unsubscribe" | "archive";

interface FormState {
  imapHost: string;
  imapPort: string;
  imapSecure: boolean;
  imapUser: string;
  imapPassword: string;
  mailbox: string;

  smtpHost: string;
  smtpPort: string;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
  fromName: string;
  fromAddress: string;
  replySignature: string;

  importantKeywords: string;
  skipMarketingReplies: boolean;
  unsubscribeMode: UnsubscribeMode;
  autoAcknowledge: boolean;
  maxEmails: string;
}

const defaultFormState: FormState = {
  imapHost: "",
  imapPort: "993",
  imapSecure: true,
  imapUser: "",
  imapPassword: "",
  mailbox: "INBOX",
  smtpHost: "",
  smtpPort: "465",
  smtpSecure: true,
  smtpUser: "",
  smtpPassword: "",
  fromName: "",
  fromAddress: "",
  replySignature:
    "Best regards,\n[Your Name]\n[Title / Team]\n[Company]",
  importantKeywords: "urgent,asap,as soon as possible,deadline,important",
  skipMarketingReplies: true,
  unsubscribeMode: "unsubscribe",
  autoAcknowledge: true,
  maxEmails: "20",
};

const initialSummaryState = null as AgentRunSummary | null;

export default function Home() {
  const [form, setForm] = useState<FormState>(defaultFormState);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState(initialSummaryState);

  const metrics = useMemo(() => {
    if (!summary) return [];
    return [
      { label: "Total Processed", value: summary.totalFetched },
      { label: "Replies Sent", value: summary.repliesSent },
      { label: "Unsubscribed", value: summary.unsubscribed },
      { label: "Archived", value: summary.archived },
      { label: "Skipped", value: summary.skipped },
      { label: "Errors", value: summary.errors },
    ];
  }, [summary]);

  const handleChange = (field: keyof FormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { type } = event.target;
    const value =
      type === "checkbox"
        ? (event.target as HTMLInputElement).checked
        : event.target.value;
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRunning(true);
    setError(null);
    setSummary(null);

    const importantKeywords = form.importantKeywords
      .split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean);

    const payload = {
      imap: {
        host: form.imapHost.trim(),
        port: Number(form.imapPort),
        secure: form.imapSecure,
        user: form.imapUser.trim(),
        password: form.imapPassword,
        mailbox: form.mailbox.trim() || "INBOX",
      },
      smtp: {
        host: form.smtpHost.trim(),
        port: Number(form.smtpPort),
        secure: form.smtpSecure,
        user: form.smtpUser.trim(),
        password: form.smtpPassword,
        fromName: form.fromName.trim(),
        fromAddress: form.fromAddress.trim(),
        replySignature: form.replySignature.trim(),
      },
      agent: {
        importantKeywords,
        skipMarketingReplies: form.skipMarketingReplies,
        unsubscribeMode: form.unsubscribeMode,
        autoAcknowledge: form.autoAcknowledge,
      },
      maxEmails: Number(form.maxEmails) || 20,
    };

    try {
      const response = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const details = await response.json().catch(() => ({}));
        throw new Error(details?.message || "Unable to run automation");
      }

      const data = (await response.json()) as { summary: AgentRunSummary };
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1>Automated Inbox Steward</h1>
            <p>
              Connect your mailbox and let the agent acknowledge critical emails while
              clearing promotional clutter with automatic unsubscribe workflows.
            </p>
          </div>
          <button
            className={styles.resetButton}
            type="button"
            onClick={() => {
              setForm(defaultFormState);
              setSummary(initialSummaryState);
              setError(null);
            }}
          >
            Reset
          </button>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
          <section className={styles.card}>
            <h2>IMAP Mailbox</h2>
            <div className={styles.grid}>
              <label className={styles.field}>
                <span>Host</span>
                <input
                  type="text"
                  placeholder="imap.yourmail.com"
                  value={form.imapHost}
                  onChange={handleChange("imapHost")}
                  required
                />
              </label>
              <label className={styles.field}>
                <span>Port</span>
                <input
                  type="number"
                  value={form.imapPort}
                  onChange={handleChange("imapPort")}
                  required
                  min={1}
                />
              </label>
              <label className={styles.switchField}>
                <input
                  type="checkbox"
                  checked={form.imapSecure}
                  onChange={handleChange("imapSecure")}
                />
                <span>Use TLS</span>
              </label>
              <label className={styles.field}>
                <span>Username</span>
                <input
                  type="text"
                  value={form.imapUser}
                  onChange={handleChange("imapUser")}
                  required
                />
              </label>
              <label className={styles.field}>
                <span>Password</span>
                <input
                  type="password"
                  value={form.imapPassword}
                  onChange={handleChange("imapPassword")}
                  required
                />
              </label>
              <label className={styles.field}>
                <span>Mailbox</span>
                <input
                  type="text"
                  value={form.mailbox}
                  onChange={handleChange("mailbox")}
                  placeholder="INBOX"
                />
              </label>
            </div>
          </section>

          <section className={styles.card}>
            <h2>SMTP Sending</h2>
            <div className={styles.grid}>
              <label className={styles.field}>
                <span>Host</span>
                <input
                  type="text"
                  placeholder="smtp.yourmail.com"
                  value={form.smtpHost}
                  onChange={handleChange("smtpHost")}
                  required
                />
              </label>
              <label className={styles.field}>
                <span>Port</span>
                <input
                  type="number"
                  value={form.smtpPort}
                  onChange={handleChange("smtpPort")}
                  required
                  min={1}
                />
              </label>
              <label className={styles.switchField}>
                <input
                  type="checkbox"
                  checked={form.smtpSecure}
                  onChange={handleChange("smtpSecure")}
                />
                <span>Use TLS</span>
              </label>
              <label className={styles.field}>
                <span>Username</span>
                <input
                  type="text"
                  value={form.smtpUser}
                  onChange={handleChange("smtpUser")}
                  required
                />
              </label>
              <label className={styles.field}>
                <span>Password</span>
                <input
                  type="password"
                  value={form.smtpPassword}
                  onChange={handleChange("smtpPassword")}
                  required
                />
              </label>
              <label className={styles.field}>
                <span>Sender name</span>
                <input
                  type="text"
                  value={form.fromName}
                  onChange={handleChange("fromName")}
                  required
                />
              </label>
              <label className={styles.field}>
                <span>Sender email</span>
                <input
                  type="email"
                  value={form.fromAddress}
                  onChange={handleChange("fromAddress")}
                  required
                />
              </label>
            </div>
            <label className={styles.field}>
              <span>Reply signature</span>
              <textarea
                rows={4}
                value={form.replySignature}
                onChange={handleChange("replySignature")}
              />
            </label>
          </section>

          <section className={styles.card}>
            <h2>Automation Strategy</h2>
            <div className={styles.grid}>
              <label className={styles.field}>
                <span>Important keywords</span>
                <input
                  type="text"
                  value={form.importantKeywords}
                  onChange={handleChange("importantKeywords")}
                />
              </label>
              <label className={styles.field}>
                <span>Max emails per run</span>
                <input
                  type="number"
                  value={form.maxEmails}
                  onChange={handleChange("maxEmails")}
                  min={1}
                  max={100}
                />
              </label>
            </div>
            <div className={styles.options}>
              <label className={styles.switchField}>
                <input
                  type="checkbox"
                  checked={form.autoAcknowledge}
                  onChange={handleChange("autoAcknowledge")}
                />
                <span>Send formal acknowledgement for important messages</span>
              </label>
              <label className={styles.switchField}>
                <input
                  type="checkbox"
                  checked={form.skipMarketingReplies}
                  onChange={handleChange("skipMarketingReplies")}
                />
                <span>Skip replies when importance rules do not match</span>
              </label>
            </div>
            <div className={styles.radioRow}>
              <span>Marketing emails:</span>
              <label>
                <input
                  type="radio"
                  name="unsubscribeMode"
                  value="unsubscribe"
                  checked={form.unsubscribeMode === "unsubscribe"}
                  onChange={() => setForm((prev) => ({ ...prev, unsubscribeMode: "unsubscribe" }))}
                />
                Unsubscribe automatically
              </label>
              <label>
                <input
                  type="radio"
                  name="unsubscribeMode"
                  value="archive"
                  checked={form.unsubscribeMode === "archive"}
                  onChange={() => setForm((prev) => ({ ...prev, unsubscribeMode: "archive" }))}
                />
                Archive silently
              </label>
            </div>
          </section>

          <div className={styles.actions}>
            <button type="submit" disabled={running}>
              {running ? "Running automations…" : "Run automation now"}
            </button>
            <span className={styles.hint}>
              Credentials are used only for this browser session to orchestrate the run.
            </span>
          </div>
        </form>

        {error && <p className={styles.errorMessage}>{error}</p>}

        {summary && (
          <section className={styles.results}>
            <header>
              <div>
                <h2>Latest automation report</h2>
                <p>
                  Window: {new Date(summary.startedAt).toLocaleString()} →
                  {" "}
                  {new Date(summary.completedAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSummary(null)}
              >
                Clear report
              </button>
            </header>
            <div className={styles.metrics}>
              {metrics.map((metric) => (
                <div key={metric.label} className={styles.metricCard}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </div>
              ))}
            </div>
            <div className={styles.log}>
              <h3>Action log</h3>
              {summary.actions.length === 0 && (
                <p>No new messages were detected.</p>
              )}
              <ul>
                {summary.actions.map((action) => (
                  <li key={action.id}>
                    <div className={styles.logHeader}>
                      <span className={styles.logSubject}>{action.subject}</span>
                      <span className={`${styles.pill} ${styles[action.action]}`}>
                        {action.action}
                      </span>
                    </div>
                    <p className={styles.logMeta}>
                      From {action.from} · {new Date(action.timestamp).toLocaleString()}
                    </p>
                    <p className={styles.logDetail}>{action.detail}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
