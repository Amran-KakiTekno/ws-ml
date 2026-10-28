/**
 * Original inline-SVG charts for the Intervention Explorer demo.
 *
 * There is no charting library here: every mark is hand-written SVG. Each
 * chart carries an accessible name and description, and each chart is paired
 * with a real HTML table that states the same numbers as text, so the
 * information is available without seeing the graphic at all.
 *
 * All values come from the authored synthetic records. Nothing is fitted,
 * predicted, or modelled.
 */

import { useId } from 'react';

import type { OperationRecord } from '../data';
import { formatHours, type FamilyGroup } from '../domain';

interface CountByFamilyChartProps {
  groups: readonly FamilyGroup[];
}

interface AverageDurationByFamilyChartProps {
  groups: readonly FamilyGroup[];
}

interface DurationScatterChartProps {
  records: readonly OperationRecord[];
}

const BAR_HEIGHT = 30;
const BAR_GAP = 14;
const CHART_PADDING_LEFT = 96;
const CHART_PADDING_RIGHT = 72;
const CHART_WIDTH = 560;

/** Guard against a zero or missing maximum so no coordinate can become NaN. */
function safeMax(values: readonly number[]): number {
  let max = 0;
  for (const value of values) {
    if (Number.isFinite(value) && value > max) {
      max = value;
    }
  }
  return max > 0 ? max : 1;
}

export function CountByFamilyChart({ groups }: CountByFamilyChartProps) {
  const titleId = useId();
  const descId = useId();

  const counts = groups.map((group) => group.count);
  const max = safeMax(counts);
  const plotWidth = CHART_WIDTH - CHART_PADDING_LEFT - CHART_PADDING_RIGHT;
  const height = groups.length * (BAR_HEIGHT + BAR_GAP) + 8;

  return (
    <figure className="chart" data-testid="chart-count-by-family">
      <figcaption className="chart__caption">Operations by family</figcaption>
      <svg
        className="chart__svg"
        viewBox={`0 0 ${CHART_WIDTH} ${height}`}
        role="img"
        aria-labelledby={`${titleId} ${descId}`}
        focusable="false"
      >
        <title id={titleId}>Operations by family</title>
        <desc id={descId}>
          Bar chart comparing the number of filtered operations in each family. The same
          numbers are listed in the table below the chart.
        </desc>
        {groups.map((group, index) => {
          const y = index * (BAR_HEIGHT + BAR_GAP) + 4;
          const width = (group.count / max) * plotWidth;
          return (
            <g key={group.family}>
              <text className="chart__label" x={CHART_PADDING_LEFT - 12} y={y + 20} textAnchor="end">
                {group.family}
              </text>
              <rect
                className="chart__bar chart__bar--count"
                x={CHART_PADDING_LEFT}
                y={y}
                width={width}
                height={BAR_HEIGHT}
                rx={4}
              />
              <text className="chart__value" x={CHART_PADDING_LEFT + width + 10} y={y + 20}>
                {group.count}
              </text>
            </g>
          );
        })}
      </svg>
      <table className="chart__table">
        <caption className="sr-only">Operations by family, as text</caption>
        <thead>
          <tr>
            <th scope="col">Family</th>
            <th scope="col">Operations</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <tr key={group.family}>
              <th scope="row">{group.family}</th>
              <td>{group.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export function AverageDurationByFamilyChart({ groups }: AverageDurationByFamilyChartProps) {
  const titleId = useId();
  const descId = useId();

  const averages = groups.map((group) => group.averageDurationHours);
  const max = safeMax(averages);
  const plotWidth = CHART_WIDTH - CHART_PADDING_LEFT - CHART_PADDING_RIGHT;
  const height = groups.length * (BAR_HEIGHT + BAR_GAP) + 8;

  return (
    <figure className="chart" data-testid="chart-average-duration-by-family">
      <figcaption className="chart__caption">Average duration by family (hours)</figcaption>
      <svg
        className="chart__svg"
        viewBox={`0 0 ${CHART_WIDTH} ${height}`}
        role="img"
        aria-labelledby={`${titleId} ${descId}`}
        focusable="false"
      >
        <title id={titleId}>Average duration by family</title>
        <desc id={descId}>
          Bar chart comparing the mean duration in hours of the filtered operations in each
          family. The same numbers are listed in the table below the chart.
        </desc>
        {groups.map((group, index) => {
          const y = index * (BAR_HEIGHT + BAR_GAP) + 4;
          const width = (group.averageDurationHours / max) * plotWidth;
          return (
            <g key={group.family}>
              <text className="chart__label" x={CHART_PADDING_LEFT - 12} y={y + 20} textAnchor="end">
                {group.family}
              </text>
              <rect
                className="chart__bar chart__bar--duration"
                x={CHART_PADDING_LEFT}
                y={y}
                width={width}
                height={BAR_HEIGHT}
                rx={4}
              />
              <text className="chart__value" x={CHART_PADDING_LEFT + width + 10} y={y + 20}>
                {formatHours(group.averageDurationHours)} h
              </text>
            </g>
          );
        })}
      </svg>
      <table className="chart__table">
        <caption className="sr-only">Average duration by family, as text</caption>
        <thead>
          <tr>
            <th scope="col">Family</th>
            <th scope="col">Average duration (h)</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <tr key={group.family}>
              <th scope="row">{group.family}</th>
              <td>{formatHours(group.averageDurationHours)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export function DurationScatterChart({ records }: DurationScatterChartProps) {
  const titleId = useId();
  const descId = useId();

  const width = 560;
  const height = 260;
  const padding = { top: 16, right: 24, bottom: 44, left: 56 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const maxDuration = safeMax(records.map((record) => record.durationHours));
  const maxNonProductive = safeMax(records.map((record) => record.nonProductiveHours));

  const points = records.map((record) => {
    const x = padding.left + (record.durationHours / maxDuration) * plotWidth;
    const y = padding.top + plotHeight - (record.nonProductiveHours / maxNonProductive) * plotHeight;
    return { record, x, y };
  });

  const axisTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <figure className="chart" data-testid="chart-duration-scatter">
      <figcaption className="chart__caption">
        Duration against non-productive time (one point per operation)
      </figcaption>
      <svg
        className="chart__svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-labelledby={`${titleId} ${descId}`}
        focusable="false"
      >
        <title id={titleId}>Duration against non-productive time</title>
        <desc id={descId}>
          Scatter plot with one point per filtered operation. The horizontal axis is total
          duration in hours and the vertical axis is non-productive hours. The same values are
          listed in the table below the chart.
        </desc>
        <line
          className="chart__axis"
          x1={padding.left}
          y1={padding.top + plotHeight}
          x2={padding.left + plotWidth}
          y2={padding.top + plotHeight}
        />
        <line
          className="chart__axis"
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + plotHeight}
        />
        {axisTicks.map((tick) => {
          const y = padding.top + plotHeight - tick * plotHeight;
          return (
            <text
              key={`y-${tick}`}
              className="chart__tick"
              x={padding.left - 10}
              y={y + 4}
              textAnchor="end"
            >
              {formatHours(tick * maxNonProductive)}
            </text>
          );
        })}
        {axisTicks.map((tick) => {
          const x = padding.left + tick * plotWidth;
          return (
            <text
              key={`x-${tick}`}
              className="chart__tick"
              x={x}
              y={padding.top + plotHeight + 20}
              textAnchor="middle"
            >
              {formatHours(tick * maxDuration)}
            </text>
          );
        })}
        <text
          className="chart__axis-title"
          x={padding.left + plotWidth / 2}
          y={height - 8}
          textAnchor="middle"
        >
          Duration (h)
        </text>
        <text
          className="chart__axis-title"
          x={16}
          y={padding.top + plotHeight / 2}
          textAnchor="middle"
          transform={`rotate(-90 16 ${padding.top + plotHeight / 2})`}
        >
          Non-productive (h)
        </text>
        {points.map(({ record, x, y }) => (
          <circle key={record.operationId} className="chart__point" cx={x} cy={y} r={5} />
        ))}
      </svg>
      <table className="chart__table">
        <caption className="sr-only">Duration against non-productive time, as text</caption>
        <thead>
          <tr>
            <th scope="col">Operation</th>
            <th scope="col">Duration (h)</th>
            <th scope="col">Non-productive (h)</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.operationId}>
              <th scope="row">{record.operationId}</th>
              <td>{formatHours(record.durationHours)}</td>
              <td>{formatHours(record.nonProductiveHours)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
