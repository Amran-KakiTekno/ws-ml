/**
 * Intervention Explorer - a single-page exploratory analysis demo.
 *
 * The page works entirely on the client against the authored synthetic records
 * in `src/data.ts`. It filters, aggregates, compares and inspects those
 * records. It does not train, fit, score, or predict anything: there is no
 * model in this project.
 */

import { useMemo, useState } from 'react';

import {
  AverageDurationByFamilyChart,
  CountByFamilyChart,
  DurationScatterChart,
} from './components/Charts';
import { FAMILIES, OUTCOMES, REGIONS, operations, type OperationRecord } from './data';
import {
  DEFAULT_FILTERS,
  filterOperations,
  formatHours,
  formatPercent,
  groupByFamily,
  summariseOperations,
  summaryToCsv,
  type OperationFilters,
} from './domain';

const CSV_FILENAME = 'intervention-explorer-summary.csv';

function OrbitMark() {
  return (
    <svg
      className="orbit-mark"
      viewBox="0 0 64 64"
      role="img"
      aria-label="Dual Orbit mark"
      focusable="false"
    >
      <ellipse cx="32" cy="32" rx="26" ry="11" fill="none" stroke="currentColor" strokeWidth="2" />
      <ellipse
        cx="32"
        cy="32"
        rx="26"
        ry="11"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        transform="rotate(60 32 32)"
      />
      <circle cx="32" cy="32" r="5" fill="var(--amber)" />
    </svg>
  );
}

export default function App() {
  const [filters, setFilters] = useState<OperationFilters>(DEFAULT_FILTERS);
  const [selectedOperationId, setSelectedOperationId] = useState<string | null>(null);

  const filtered = useMemo(() => filterOperations(operations, filters), [filters]);
  const summary = useMemo(() => summariseOperations(filtered), [filtered]);
  const groups = useMemo(() => groupByFamily(filtered), [filtered]);

  const selectedOperation = useMemo(
    () => filtered.find((record) => record.operationId === selectedOperationId) ?? null,
    [filtered, selectedOperationId],
  );

  const updateFilter = <K extends keyof OperationFilters>(
    key: K,
    value: OperationFilters[K],
  ) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    setSelectedOperationId(null);
  };

  const handleDownload = () => {
    const csv = summaryToCsv(filtered);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = CSV_FILENAME;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const isEmpty = filtered.length === 0;

  return (
    <div className="app-shell">
      <header className="masthead">
        <div className="masthead__identity">
          <OrbitMark />
          <div>
            <p className="eyebrow">Dual Orbit / Data Analysis demo</p>
            <h1>Intervention Explorer</h1>
            <p className="lede">
              Filter, aggregate, compare and inspect synthetic intervention-operation records.
              Every figure on this page is a descriptive statistic computed in the browser from
              the twelve invented records shown below.
            </p>
          </div>
        </div>
        <p className="notice" role="note">
          <strong>Synthetic data.</strong> All twelve operation records on this page were written
          by hand for demonstration purposes. They describe no real site, client, or dataset, and
          no trained or predictive model is represented.
        </p>
      </header>

      <main>
        <section className="panel" aria-labelledby="filters-heading">
          <div className="panel__head">
            <h2 id="filters-heading">Filters</h2>
            <div className="panel__actions">
              <button
                type="button"
                className="button button--primary"
                onClick={handleDownload}
                data-testid="download-csv"
              >
                Download filtered CSV
              </button>
              <button type="button" className="button" onClick={handleReset} data-testid="reset-filters">
                Reset filters
              </button>
            </div>
          </div>

          <div className="filters">
            <div className="field">
              <label htmlFor="filter-family">Family</label>
              <select
                id="filter-family"
                data-testid="filter-family"
                value={filters.family}
                onChange={(event) =>
                  updateFilter('family', event.target.value as OperationFilters['family'])
                }
              >
                <option value="All">All families</option>
                {FAMILIES.map((family) => (
                  <option key={family} value={family}>
                    {family}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="filter-region">Region</label>
              <select
                id="filter-region"
                data-testid="filter-region"
                value={filters.region}
                onChange={(event) =>
                  updateFilter('region', event.target.value as OperationFilters['region'])
                }
              >
                <option value="All">All regions</option>
                {REGIONS.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="filter-outcome">Outcome</label>
              <select
                id="filter-outcome"
                data-testid="filter-outcome"
                value={filters.outcome}
                onChange={(event) =>
                  updateFilter('outcome', event.target.value as OperationFilters['outcome'])
                }
              >
                <option value="All">All outcomes</option>
                {OUTCOMES.map((outcome) => (
                  <option key={outcome} value={outcome}>
                    {outcome}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="panel" aria-labelledby="kpi-heading">
          <h2 id="kpi-heading">Summary of the filtered records</h2>
          <div className="kpis">
            <article className="kpi">
              <h3 className="kpi__label">Operations</h3>
              <p className="kpi__value" data-testid="kpi-count">
                {summary.count}
              </p>
            </article>
            <article className="kpi">
              <h3 className="kpi__label">Average duration</h3>
              <p className="kpi__value" data-testid="kpi-average-duration">
                {formatHours(summary.averageDurationHours)} h
              </p>
            </article>
            <article className="kpi">
              <h3 className="kpi__label">Non-productive hours</h3>
              <p className="kpi__value" data-testid="kpi-non-productive">
                {formatHours(summary.totalNonProductiveHours)} h
              </p>
            </article>
            <article className="kpi">
              <h3 className="kpi__label">Completion rate</h3>
              <p className="kpi__value" data-testid="kpi-completion-rate">
                {formatPercent(summary.completionRate)}%
              </p>
            </article>
          </div>
        </section>

        {isEmpty && (
          <section className="panel empty-state" aria-labelledby="empty-heading">
            <h2 id="empty-heading" data-testid="empty-state">
              No operations match these filters
            </h2>
            <p className="empty-state__body">
              This combination of family, region and outcome has no records in the synthetic
              dataset. Widen the filters or reset them to see the twelve authored operations
              again.
            </p>
          </section>
        )}

        <section className="panel" aria-labelledby="charts-heading">
          <h2 id="charts-heading">Comparison</h2>
          <p className="panel__note">
            {isEmpty
              ? 'No rows match the current filters, so the comparison charts are empty.'
              : 'Charts are computed from the filtered records only.'}
          </p>
          <div className="charts">
            <CountByFamilyChart groups={groups} />
            <AverageDurationByFamilyChart groups={groups} />
            <DurationScatterChart records={filtered} />
          </div>
        </section>

        <section className="panel" aria-labelledby="records-heading">
          <div className="panel__head">
            <h2 id="records-heading">Records</h2>
            <p className="panel__note">
              {filtered.length} of {operations.length} synthetic operations shown. Select a row to
              inspect its detail.
            </p>
          </div>

          {isEmpty ? (
            <p className="records__empty" data-testid="records-empty">
              No records to list.
            </p>
          ) : (
            <div className="table-wrap">
              <table className="records">
                <caption className="sr-only">
                  Synthetic intervention-operation records matching the current filters
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Operation</th>
                    <th scope="col">Asset</th>
                    <th scope="col">Family</th>
                    <th scope="col">Region</th>
                    <th scope="col">Started</th>
                    <th scope="col">Duration (h)</th>
                    <th scope="col">Non-productive (h)</th>
                    <th scope="col">Outcome</th>
                    <th scope="col">Inspect</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((record) => (
                    <tr
                      key={record.operationId}
                      data-testid="record-row"
                      data-operation-id={record.operationId}
                      className={
                        record.operationId === selectedOperationId ? 'records__row--selected' : ''
                      }
                    >
                      <th scope="row">{record.operationId}</th>
                      <td>{record.assetAlias}</td>
                      <td>{record.family}</td>
                      <td>{record.region}</td>
                      <td>{record.startedOn}</td>
                      <td>{formatHours(record.durationHours)}</td>
                      <td>{formatHours(record.nonProductiveHours)}</td>
                      <td>{record.outcome}</td>
                      <td>
                        <button
                          type="button"
                          className="button button--small"
                          onClick={() => setSelectedOperationId(record.operationId)}
                          aria-pressed={record.operationId === selectedOperationId}
                          data-testid={`inspect-${record.operationId}`}
                        >
                          {record.operationId === selectedOperationId ? 'Selected' : 'Inspect'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel" aria-labelledby="detail-heading">
          <h2 id="detail-heading">Operation detail</h2>
          {selectedOperation ? (
            <OperationDetail record={selectedOperation} />
          ) : (
            <p className="records__empty" data-testid="detail-empty">
              Select an operation from the table to inspect its detail.
            </p>
          )}
        </section>
      </main>

      <footer className="footer">
        <p>
          Synthetic data notice: all records are invented for this demo. No trained model,
          predictive score, backend, or external data source is used.
        </p>
      </footer>
    </div>
  );
}

function OperationDetail({ record }: { record: OperationRecord }) {
  return (
    <div className="detail" data-testid="detail-panel">
      <p className="detail__title" data-testid="detail-operation-id">
        {record.operationId} — {record.assetAlias}
      </p>
      <dl className="detail__grid">
        <div className="detail__item">
          <dt>Family</dt>
          <dd data-testid="detail-family">{record.family}</dd>
        </div>
        <div className="detail__item">
          <dt>Region</dt>
          <dd data-testid="detail-region">{record.region}</dd>
        </div>
        <div className="detail__item">
          <dt>Started on</dt>
          <dd data-testid="detail-started-on">{record.startedOn}</dd>
        </div>
        <div className="detail__item">
          <dt>Duration</dt>
          <dd data-testid="detail-duration">{formatHours(record.durationHours)} h</dd>
        </div>
        <div className="detail__item">
          <dt>Non-productive</dt>
          <dd data-testid="detail-non-productive">
            {formatHours(record.nonProductiveHours)} h
          </dd>
        </div>
        <div className="detail__item">
          <dt>Outcome</dt>
          <dd data-testid="detail-outcome">{record.outcome}</dd>
        </div>
      </dl>
      <h3 className="detail__heading">Work sequence</h3>
      <p className="detail__sequence" data-testid="detail-sequence">
        {record.sequenceSummary}
      </p>
    </div>
  );
}
