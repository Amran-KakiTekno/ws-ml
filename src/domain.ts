/**
 * Pure analysis helpers for the Intervention Explorer demo.
 *
 * Nothing in this module touches the DOM, the network, or mutable module
 * state: every function takes its inputs and returns a new value. That keeps
 * the analysis layer reproducible and trivially testable.
 *
 * All numbers come from the authored synthetic records in `src/data.ts`. No
 * trained model, fitted parameter, or predictive score exists anywhere in this
 * project - the aggregates below are plain descriptive statistics.
 */

import {
  FAMILIES,
  type Family,
  type OperationRecord,
  type Outcome,
  type Region,
} from './data';

/** A filter selection. `All` means "do not restrict on this dimension". */
export interface OperationFilters {
  family: Family | 'All';
  region: Region | 'All';
  outcome: Outcome | 'All';
}

/** The neutral, unfiltered selection. */
export const DEFAULT_FILTERS: OperationFilters = Object.freeze({
  family: 'All',
  region: 'All',
  outcome: 'All',
});

/** Descriptive KPIs derived from a set of records. */
export interface OperationSummary {
  /** Number of records in the set. */
  count: number;
  /** Mean of `durationHours`; `0` for an empty set (never `NaN`). */
  averageDurationHours: number;
  /** Sum of `nonProductiveHours`; `0` for an empty set. */
  totalNonProductiveHours: number;
  /** Share of records whose outcome is `Complete`, as a percentage 0-100. */
  completionRate: number;
}

/** One family bucket produced by `groupByFamily`. */
export interface FamilyGroup {
  family: Family;
  /** Number of records in the bucket. */
  count: number;
  /** Mean `durationHours` inside the bucket; `0` when the bucket is empty. */
  averageDurationHours: number;
  /** Sum of `durationHours` inside the bucket. */
  totalDurationHours: number;
  /** Sum of `nonProductiveHours` inside the bucket. */
  totalNonProductiveHours: number;
}

/** Column order used by `summaryToCsv`. */
export const CSV_COLUMNS = [
  'operationId',
  'assetAlias',
  'family',
  'region',
  'startedOn',
  'durationHours',
  'nonProductiveHours',
  'outcome',
  'sequenceSummary',
] as const;

/**
 * Return the records that satisfy every active filter dimension.
 *
 * A dimension set to `All` is ignored. The input array is never mutated and
 * the returned array is always a fresh copy.
 */
export function filterOperations(
  records: readonly OperationRecord[],
  filters: OperationFilters,
): OperationRecord[] {
  return records.filter((record) => {
    if (filters.family !== 'All' && record.family !== filters.family) {
      return false;
    }
    if (filters.region !== 'All' && record.region !== filters.region) {
      return false;
    }
    if (filters.outcome !== 'All' && record.outcome !== filters.outcome) {
      return false;
    }
    return true;
  });
}

/**
 * Compute the descriptive KPIs for a set of records.
 *
 * An empty set yields `count: 0` and zeroed averages/totals - never `NaN` and
 * never `Infinity`.
 */
export function summariseOperations(
  records: readonly OperationRecord[],
): OperationSummary {
  if (records.length === 0) {
    return {
      count: 0,
      averageDurationHours: 0,
      totalNonProductiveHours: 0,
      completionRate: 0,
    };
  }

  let durationTotal = 0;
  let nonProductiveTotal = 0;
  let completeCount = 0;

  for (const record of records) {
    durationTotal += record.durationHours;
    nonProductiveTotal += record.nonProductiveHours;
    if (record.outcome === 'Complete') {
      completeCount += 1;
    }
  }

  return {
    count: records.length,
    averageDurationHours: durationTotal / records.length,
    totalNonProductiveHours: nonProductiveTotal,
    completionRate: (completeCount / records.length) * 100,
  };
}

/**
 * Bucket records by family.
 *
 * Only families that actually occur in the input produce a bucket, so the
 * bucket counts always sum to the number of records. An empty input produces
 * an empty array of buckets.
 */
export function groupByFamily(records: readonly OperationRecord[]): FamilyGroup[] {
  const buckets = new Map<Family, OperationRecord[]>();

  for (const family of FAMILIES) {
    buckets.set(
      family,
      records.filter((record) => record.family === family),
    );
  }

  const groups: FamilyGroup[] = [];
  for (const family of FAMILIES) {
    const members = buckets.get(family) ?? [];
    if (members.length === 0) {
      continue;
    }
    let durationTotal = 0;
    let nonProductiveTotal = 0;
    for (const member of members) {
      durationTotal += member.durationHours;
      nonProductiveTotal += member.nonProductiveHours;
    }
    groups.push({
      family,
      count: members.length,
      averageDurationHours: durationTotal / members.length,
      totalDurationHours: durationTotal,
      totalNonProductiveHours: nonProductiveTotal,
    });
  }

  return groups;
}

/**
 * Escape a single CSV field.
 *
 * Fields that contain a comma, a double quote, or a line break are wrapped in
 * double quotes and any embedded double quote is doubled.
 */
export function csvEscape(value: string): string {
  if (!/[",\n\r]/.test(value)) {
    return value;
  }
  return `"${value.replace(/"/g, '""')}"`;
}

/**
 * Build a CSV summary of the supplied records.
 *
 * The result contains exactly one header line followed by one line per record,
 * in the order given. Lines are separated by `\n` and the file does not end
 * with a trailing newline.
 */
export function summaryToCsv(records: readonly OperationRecord[]): string {
  const lines: string[] = [CSV_COLUMNS.join(',')];

  for (const record of records) {
    lines.push(
      [
        csvEscape(record.operationId),
        csvEscape(record.assetAlias),
        csvEscape(record.family),
        csvEscape(record.region),
        csvEscape(record.startedOn),
        csvEscape(String(record.durationHours)),
        csvEscape(String(record.nonProductiveHours)),
        csvEscape(record.outcome),
        csvEscape(record.sequenceSummary),
      ].join(','),
    );
  }

  return lines.join('\n');
}

/** Format a number for display with a fixed number of decimals. */
export function formatHours(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) {
    return '0.0';
  }
  return value.toFixed(decimals);
}

/** Format a percentage with a single decimal place. */
export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) {
    return '0.0';
  }
  return value.toFixed(1);
}
