# Intervention Explorer (`ws-ml`)

A standalone, English-only, fully client-side single-page demo for
`https://ws-ml.pages.dev`. It demonstrates **exploratory analysis** of
intervention-operation records: filtering, aggregation, visual comparison,
detail inspection and a client-generated CSV export.

> **No trained or predictive model is represented.** This project contains no
> model, no fitted parameter, no trained artifact, no inference endpoint and no
> accuracy claim of any kind. Every number on the page is a plain descriptive
> statistic (count, mean, sum, share) computed in the browser from the twelve
> records below.

---

## Synthetic provenance

Every record in `src/data.ts` was written by hand for this demo. The dataset
describes synthetic intervention operations on an imaginary service network:

- no real site, client, employer, procedure extract or dataset is represented;
- no field name was copied from an external system;
- the values are invented and were not sampled, measured or observed anywhere;
- the whole register is **12 records** — a deliberately small, illustrative set
  that is not a production scale and is not presented as one.

The dataset is deliberately uneven: the `Survey` family never occurs in the
`South` region, so an impossible filter combination (family `Survey` + region
`South`) is reachable and the deliberate empty state can be shown.

---

## Analysis method

All analysis lives in `src/domain.ts` as pure functions over plain data.

| Function | Method |
|---|---|
| `filterOperations` | Set intersection across the three filter dimensions. A dimension set to `All` is ignored. The source array is never mutated. |
| `summariseOperations` | `count` = number of records; `averageDurationHours` = Σ `durationHours` ÷ `count`; `totalNonProductiveHours` = Σ `nonProductiveHours`; `completionRate` = (records with `outcome === "Complete"` ÷ `count`) × 100. |
| `groupByFamily` | Buckets the records by family. Bucket counts sum to the record count; a family with no records produces no bucket. |
| `summaryToCsv` | One header line plus one line per record, comma separated, RFC 4180-style escaping (fields containing a comma, a double quote or a line break are quoted and embedded quotes are doubled). |

An empty record set yields zeroed KPIs and empty buckets — never `NaN` and
never `Infinity`. The completion rate is displayed with one decimal place; the
average duration and the non-productive total are displayed with one decimal
place as well.

### Charts

`src/components/Charts.tsx` contains original, hand-written inline SVG. There
is no charting library and no remote asset. Three views are provided:

1. **Operations by family** — horizontal bars of the filtered count per family.
2. **Average duration by family** — horizontal bars of the mean duration per family.
3. **Duration against non-productive time** — a scatter plot with one point per
   filtered operation.

Each chart carries an accessible `<title>` and `<desc>`, and each is paired with
a real HTML table stating the same numbers, so the information is available
without seeing the graphic.

---

## Architecture

| Path | Purpose |
|---|---|
| `src/data.ts` | The 12 authored synthetic records and the family/region/outcome vocabularies. |
| `src/domain.ts` | Pure filtering, aggregation, grouping and CSV helpers. No DOM, no network, no mutable module state. |
| `src/domain.test.ts` | Vitest suite pinning the counts, the KPI formulas, filter combinations, reset purity, zero-input behaviour and CSV escaping. |
| `src/components/Charts.tsx` | Original inline-SVG bar and scatter charts with accessible names and tabular text alternatives. |
| `src/App.tsx` | Filters, KPI cards, charts, record table, detail panel, empty state and CSV export. |
| `src/styles.css` | Dark editorial-technical styling; system fonts; no external font or asset request. |
| `src/main.tsx` | React entry point. |
| `tests/demo.spec.ts` | Playwright suite driving system Chrome. |
| `scripts/verify-build.mjs` | Build-artifact gate; prints `VERIFY_OK ws-ml`. |

Everything runs on the client. There is no backend, no routing, no persistence,
no external fetch and no analytics. The CSV is generated in the browser from a
`Blob` and handed to the browser's download mechanism.

---

## Local commands

```bash
npm ci          # clean install from the lockfile
npm run typecheck
npm test        # Vitest unit tests
npm run build   # typecheck + Vite build into dist/
npm run test:e2e
npm run verify  # typecheck -> unit -> build -> Playwright -> verify-build
```

The Playwright configuration uses the installed system Chrome
(`channel: "chrome"`), serves the built site with `vite preview` on the
reserved port **4106**, and never reuses an existing server. No browser
download is required.

---

## Synthetic data notice (as shipped)

The page carries a visible **Synthetic data** notice in the masthead and a
matching statement in the footer, and the HTML `description` metadata says the
same. Any copy edit must keep that notice, the provenance statement above, and
the explicit "no trained or predictive model" statement — those are disclosure
requirements, not stylistic choices.
