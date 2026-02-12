export interface CheckResult {
  id: string;
  category: 'critical' | 'warning' | 'info';
  group: string;
  passed: boolean;
  label: string;
  detail: string;
  fix: string | null;
}

export interface ScanSummary {
  total: number;
  passed: number;
  failed: number;
  critical_failed: number;
  warning_failed: number;
}

export interface ScanResult {
  checks: CheckResult[];
  summary: ScanSummary;
  scan_duration_ms: number;
  scanned_at: string;
}
