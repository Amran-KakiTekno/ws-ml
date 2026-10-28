import { describe, expect, it } from 'vitest';

import { operations } from './data';
import {
  CSV_COLUMNS,
  DEFAULT_FILTERS,
  csvEscape,
  filterOperations,
  formatHours,
  formatPercent,
  groupByFamily,
  summariseOperations,
  summaryToCsv,
} from './domain';

const ALL_RECORDS = operations;

describe('authored dataset', () => {
  it('holds exactly twelve synthetic operation records', () => {
    expect(ALL_RECORDS).toHaveLength(12);
  });

  it('contains exactly four records in the Survey family', () => {
    const survey = ALL_RECORDS.filter((record) => record.family === 'Survey');
    expect(survey).toHaveLength(4);
  });

  it('spans exactly three families and three regions', () => {
    expect(new Set(ALL_RECORDS.map((record) => record.family))).toEqual(
      new Set(['Cleanout', 'Repair', 'Survey']),
    );
    expect(new Set(ALL_RECORDS.map((record) => record.region))).toEqual(
      new Set(['North', 'Central', 'South']),
    );
  });

  it('exposes a reachable zero-result family/region combination', () => {
    const surveySouth = filterOperations(ALL_RECORDS, {
      ...DEFAULT_FILTERS,
      family: 'Survey',
      region: 'South',
    });
    expect(surveySouth).toHaveLength(0);
  });

  it('uses unique operation identifiers', () => {
    const ids = ALL_RECORDS.map((record) => record.operationId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('filterOperations', () => {
  it('returns all twelve records for the default filters', () => {
    expect(filterOperations(ALL_RECORDS, DEFAULT_FILTERS)).toHaveLength(12);
  });

  it('filters by family', () => {
    const survey = filterOperations(ALL_RECORDS, {
      ...DEFAULT_FILTERS,
      family: 'Survey',
    });
    expect(survey).toHaveLength(4);
    expect(survey.every((record) => record.family === 'Survey')).toBe(true);
  });

  it('filters by region', () => {
    const south = filterOperations(ALL_RECORDS, {
      ...DEFAULT_FILTERS,
      region: 'South',
    });
    expect(south.length).toBeGreaterThan(0);
    expect(south.every((record) => record.region === 'South')).toBe(true);
  });

  it('filters by outcome', () => {
    const complete = filterOperations(ALL_RECORDS, {
      ...DEFAULT_FILTERS,
      outcome: 'Complete',
    });
    expect(complete.length).toBeGreaterThan(0);
    expect(complete.every((record) => record.outcome === 'Complete')).toBe(true);
  });

  it('applies combined filters as an intersection', () => {
    const combined = filterOperations(ALL_RECORDS, {
      family: 'Cleanout',
      region: 'North',
      outcome: 'Complete',
    });
    expect(combined).toHaveLength(2);
    expect(
      combined.every(
        (record) =>
          record.family === 'Cleanout' &&
          record.region === 'North' &&
          record.outcome === 'Complete',
      ),
    ).toBe(true);
  });

  it('returns an empty array for an impossible combination', () => {
    const none = filterOperations(ALL_RECORDS, {
      ...DEFAULT_FILTERS,
      family: 'Survey',
      region: 'South',
    });
    expect(none).toEqual([]);
  });

  it('does not mutate the source records and returns a fresh array', () => {
    const before = JSON.stringify(ALL_RECORDS);
    const result = filterOperations(ALL_RECORDS, {
      ...DEFAULT_FILTERS,
      family: 'Repair',
    });
    expect(JSON.stringify(ALL_RECORDS)).toBe(before);
    expect(result).not.toBe(ALL_RECORDS);
  });

  it('restores all twelve records when the filters are reset', () => {
    const filtered = filterOperations(ALL_RECORDS, {
      family: 'Repair',
      region: 'South',
      outcome: 'Complete',
    });
    const reset = filterOperations(ALL_RECORDS, DEFAULT_FILTERS);
    expect(reset).toHaveLength(12);
    expect(filtered.length).toBeLessThan(12);
  });
});

describe('summariseOperations', () => {
  it('computes each KPI with the documented formula', () => {
    const summary = summariseOperations(ALL_RECORDS);
    const durationTotal = ALL_RECORDS.reduce((sum, r) => sum + r.durationHours, 0);
    const nonProductiveTotal = ALL_RECORDS.reduce(
      (sum, r) => sum + r.nonProductiveHours,
      0,
    );
    const completeCount = ALL_RECORDS.filter((r) => r.outcome === 'Complete').length;

    expect(summary.count).toBe(12);
    expect(summary.averageDurationHours).toBeCloseTo(durationTotal / 12, 10);
    expect(summary.totalNonProductiveHours).toBeCloseTo(nonProductiveTotal, 10);
    expect(summary.completionRate).toBeCloseTo((completeCount / 12) * 100, 10);
  });

  it('derives the KPIs only from the filtered records', () => {
    const survey = filterOperations(ALL_RECORDS, {
      ...DEFAULT_FILTERS,
      family: 'Survey',
    });
    const summary = summariseOperations(survey);
    expect(summary.count).toBe(4);
    expect(summary.averageDurationHours).toBeCloseTo(
      survey.reduce((sum, r) => sum + r.durationHours, 0) / 4,
      10,
    );
    expect(summary.totalNonProductiveHours).toBeCloseTo(
      survey.reduce((sum, r) => sum + r.nonProductiveHours, 0),
      10,
    );
    const completes = survey.filter((r) => r.outcome === 'Complete').length;
    expect(summary.completionRate).toBeCloseTo((completes / 4) * 100, 10);
  });

  it('returns zeroed KPIs and no NaN or Infinity for an empty input', () => {
    const summary = summariseOperations([]);
    expect(summary).toEqual({
      count: 0,
      averageDurationHours: 0,
      totalNonProductiveHours: 0,
      completionRate: 0,
    });
    expect(Number.isNaN(summary.averageDurationHours)).toBe(false);
    expect(Number.isFinite(summary.averageDurationHours)).toBe(true);
    expect(Number.isFinite(summary.completionRate)).toBe(true);
  });

  it('keeps a zero completion rate for an empty filtered set', () => {
    const none = filterOperations(ALL_RECORDS, {
      ...DEFAULT_FILTERS,
      family: 'Survey',
      region: 'South',
    });
    const summary = summariseOperations(none);
    expect(summary.count).toBe(0);
    expect(summary.completionRate).toBe(0);
    expect(summary.averageDurationHours).toBe(0);
  });
});

describe('groupByFamily', () => {
  it('produces buckets whose counts sum to twelve for the full set', () => {
    const groups = groupByFamily(ALL_RECORDS);
    expect(groups.reduce((sum, group) => sum + group.count, 0)).toBe(12);
  });

  it('produces exactly the three authored families', () => {
    const groups = groupByFamily(ALL_RECORDS);
    expect(groups.map((group) => group.family)).toEqual([
      'Cleanout',
      'Repair',
      'Survey',
    ]);
    expect(groups.map((group) => group.count)).toEqual([4, 4, 4]);
  });

  it('reports the mean duration inside each bucket', () => {
    const groups = groupByFamily(ALL_RECORDS);
    for (const group of groups) {
      const members = ALL_RECORDS.filter((record) => record.family === group.family);
      const total = members.reduce((sum, record) => sum + record.durationHours, 0);
      expect(group.averageDurationHours).toBeCloseTo(total / members.length, 10);
      expect(group.totalDurationHours).toBeCloseTo(total, 10);
    }
  });

  it('omits families that are absent from the filtered set', () => {
    const survey = filterOperations(ALL_RECORDS, {
      ...DEFAULT_FILTERS,
      family: 'Survey',
    });
    const groups = groupByFamily(survey);
    expect(groups).toHaveLength(1);
    expect(groups[0].family).toBe('Survey');
    expect(groups[0].count).toBe(4);
  });

  it('returns empty groups for an empty input', () => {
    expect(groupByFamily([])).toEqual([]);
  });

  it('never produces a NaN average for a bucket', () => {
    const groups = groupByFamily([]);
    for (const group of groups) {
      expect(Number.isFinite(group.averageDurationHours)).toBe(true);
    }
  });
});

describe('summaryToCsv', () => {
  it('writes exactly one header plus one row per record', () => {
    const csv = summaryToCsv(ALL_RECORDS);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(13);
    expect(lines[0]).toBe(CSV_COLUMNS.join(','));
    expect(lines[1].startsWith('op-1001,')).toBe(true);
    expect(lines[12].startsWith('op-3004,')).toBe(true);
  });

  it('writes exactly one header plus one row per filtered record', () => {
    const survey = filterOperations(ALL_RECORDS, {
      ...DEFAULT_FILTERS,
      family: 'Survey',
    });
    const lines = summaryToCsv(survey).split('\n');
    expect(lines).toHaveLength(5);
    expect(lines.slice(1).every((line) => line.startsWith('op-3'))).toBe(true);
  });

  it('writes only the header for an empty filtered set', () => {
    const csv = summaryToCsv([]);
    expect(csv.split('\n')).toHaveLength(1);
    expect(csv).toBe(CSV_COLUMNS.join(','));
  });

  it('escapes fields that contain a comma or a double quote', () => {
    const csv = summaryToCsv(ALL_RECORDS);
    const quoted = csv
      .split('\n')
      .find((line) => line.startsWith('op-1004,'));
    expect(quoted).toBeDefined();
    expect(quoted).toContain('"Flush the line, repeat the ""gauged"" reading twice');
  });

  it('escapes a field through the csvEscape helper', () => {
    expect(csvEscape('plain')).toBe('plain');
    expect(csvEscape('has,comma')).toBe('"has,comma"');
    expect(csvEscape('has"quote')).toBe('"has""quote"');
    expect(csvEscape('has\nnewline')).toBe('"has\nnewline"');
  });

  it('keeps one header when the same record set is exported twice', () => {
    const first = summaryToCsv(ALL_RECORDS);
    const second = summaryToCsv(ALL_RECORDS);
    expect(first).toBe(second);
    expect(first.match(/^operationId,/gm)).toHaveLength(1);
  });
});

describe('formatting helpers', () => {
  it('formats hours and percentages to one decimal', () => {
    expect(formatHours(4)).toBe('4.0');
    expect(formatHours(4.25)).toBe('4.3');
    expect(formatPercent(66.666)).toBe('66.7');
  });

  it('never renders NaN or Infinity', () => {
    expect(formatHours(Number.NaN)).toBe('0.0');
    expect(formatHours(Number.POSITIVE_INFINITY)).toBe('0.0');
    expect(formatPercent(Number.NaN)).toBe('0.0');
  });
});
