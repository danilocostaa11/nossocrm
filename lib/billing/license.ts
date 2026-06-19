export type LicenseStatus = 'trial' | 'active' | 'past_due' | 'blocked' | 'canceled';

const DEFAULT_TRIAL_DAYS = 14;

export function getDefaultTrialDays(): number {
  const raw = process.env.LICENSE_DEFAULT_TRIAL_DAYS;
  if (!raw) return DEFAULT_TRIAL_DAYS;

  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value < 1 || value > 365) return DEFAULT_TRIAL_DAYS;

  return value;
}

export function getDefaultTrialEndsAt(now = new Date()): string {
  const trialEndsAt = new Date(now.getTime() + getDefaultTrialDays() * 24 * 60 * 60 * 1000);
  return trialEndsAt.toISOString();
}

export function isLicenseStatus(value: string): value is LicenseStatus {
  return ['trial', 'active', 'past_due', 'blocked', 'canceled'].includes(value);
}
