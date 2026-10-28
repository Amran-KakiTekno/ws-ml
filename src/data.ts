/**
 * Authored fixtures for the Intervention Explorer demo.
 *
 * Every record in this file is invented for demonstration purposes. The
 * records describe synthetic intervention operations on an imaginary service
 * network: no client, employer, procedure extract, or real dataset is
 * represented, and no field name was copied from an external system.
 *
 * The dataset is deliberately small (12 records) and deliberately uneven: the
 * `Survey` family never occurs in the `South` region, which makes an
 * impossible filter combination reachable so the empty state can be shown.
 *
 * Nothing in this file is derived from a trained or predictive model. Every
 * number below is authored by hand for illustration.
 */

export const FAMILIES = ['Cleanout', 'Repair', 'Survey'] as const;
export type Family = (typeof FAMILIES)[number];

export const REGIONS = ['North', 'Central', 'South'] as const;
export type Region = (typeof REGIONS)[number];

export const OUTCOMES = ['Complete', 'Partial', 'Deferred'] as const;
export type Outcome = (typeof OUTCOMES)[number];

/** One synthetic intervention-operation record. */
export interface OperationRecord {
  /** Stable identity of the operation inside the demo register. */
  operationId: string;
  /** Invented alias of the serviced asset. */
  assetAlias: string;
  /** Family of work performed. */
  family: Family;
  /** Region the operation was carried out in. */
  region: Region;
  /** ISO date the operation started. */
  startedOn: string;
  /** Total labour hours booked against the operation. */
  durationHours: number;
  /** Hours inside the booking that produced no productive output. */
  nonProductiveHours: number;
  /** Authored outcome label. */
  outcome: Outcome;
  /** Authored, plain-language summary of the work sequence. */
  sequenceSummary: string;
}

/** The complete, frozen synthetic register used by the demo. */
export const operations: readonly OperationRecord[] = Object.freeze([
  {
    operationId: 'op-1001',
    assetAlias: 'Rig Alpha 04',
    family: 'Cleanout',
    region: 'North',
    startedOn: '2026-01-12',
    durationHours: 6,
    nonProductiveHours: 1.5,
    outcome: 'Complete',
    sequenceSummary:
      'Isolate the line, drain the section, and inspect the seal before restoring pressure.',
  },
  {
    operationId: 'op-1002',
    assetAlias: 'Rig Alpha 11',
    family: 'Cleanout',
    region: 'Central',
    startedOn: '2026-01-27',
    durationHours: 8.5,
    nonProductiveHours: 2.5,
    outcome: 'Complete',
    sequenceSummary:
      'Isolate the line, drain the section, replace the packing, and log the pressure reading.',
  },
  {
    operationId: 'op-1003',
    assetAlias: 'Tank Beta 07',
    family: 'Cleanout',
    region: 'South',
    startedOn: '2026-02-09',
    durationHours: 4,
    nonProductiveHours: 0.5,
    outcome: 'Partial',
    sequenceSummary:
      'Drain the section, clear the debris, and record the residual volume for follow-up.',
  },
  {
    operationId: 'op-1004',
    assetAlias: 'Tank Beta 13',
    family: 'Cleanout',
    region: 'North',
    startedOn: '2026-03-03',
    durationHours: 7,
    nonProductiveHours: 1,
    outcome: 'Complete',
    sequenceSummary:
      'Flush the line, repeat the "gauged" reading twice, and close the operation out.',
  },
  {
    operationId: 'op-2001',
    assetAlias: 'Pump Gamma 02',
    family: 'Repair',
    region: 'North',
    startedOn: '2026-01-19',
    durationHours: 5.5,
    nonProductiveHours: 1,
    outcome: 'Complete',
    sequenceSummary:
      'Drain the housing, renew the coupling, and run the unit unloaded before handback.',
  },
  {
    operationId: 'op-2002',
    assetAlias: 'Pump Gamma 09',
    family: 'Repair',
    region: 'Central',
    startedOn: '2026-02-16',
    durationHours: 9,
    nonProductiveHours: 3,
    outcome: 'Deferred',
    sequenceSummary:
      'Strip the casing, await a part that had not arrived, and leave the asset isolated.',
  },
  {
    operationId: 'op-2003',
    assetAlias: 'Valve Delta 05',
    family: 'Repair',
    region: 'Central',
    startedOn: '2026-03-10',
    durationHours: 3.5,
    nonProductiveHours: 0.5,
    outcome: 'Partial',
    sequenceSummary:
      'Renew the gland, fit the temporary seal, and flag the remaining weep for a later visit.',
  },
  {
    operationId: 'op-2004',
    assetAlias: 'Valve Delta 12',
    family: 'Repair',
    region: 'South',
    startedOn: '2026-04-02',
    durationHours: 6,
    nonProductiveHours: 2,
    outcome: 'Complete',
    sequenceSummary:
      'Isolate the branch, cut out the damaged spool, and pressure test the repair.',
  },
  {
    operationId: 'op-3001',
    assetAlias: 'Site Echo 03',
    family: 'Survey',
    region: 'North',
    startedOn: '2026-01-08',
    durationHours: 2,
    nonProductiveHours: 0.5,
    outcome: 'Complete',
    sequenceSummary:
      'Walk the right of way, note the two marker posts, and sketch the access track.',
  },
  {
    operationId: 'op-3002',
    assetAlias: 'Site Echo 10',
    family: 'Survey',
    region: 'North',
    startedOn: '2026-02-23',
    durationHours: 2.5,
    nonProductiveHours: 0,
    outcome: 'Complete',
    sequenceSummary:
      'Walk the right of way, photograph the crossing, and file the notes the same day.',
  },
  {
    operationId: 'op-3003',
    assetAlias: 'Site Foxtrot 06',
    family: 'Survey',
    region: 'Central',
    startedOn: '2026-03-17',
    durationHours: 3,
    nonProductiveHours: 0.5,
    outcome: 'Complete',
    sequenceSummary:
      'Walk the right of way, measure the standpipe, and record the coordinates by hand.',
  },
  {
    operationId: 'op-3004',
    assetAlias: 'Site Foxtrot 14',
    family: 'Survey',
    region: 'Central',
    startedOn: '2026-04-14',
    durationHours: 1.5,
    nonProductiveHours: 0,
    outcome: 'Deferred',
    sequenceSummary:
      'Attempt the walk, defer on weather, and reschedule once the track had dried out.',
  },
]);
