# Graph Report - src  (2026-11-05)

## Corpus Check
- Corpus is ~14,000 words - fits in a single context window. You may not need a graph.

## Summary
- 210 nodes · 595 edges · 7 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8ae4f4a3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Infrastructure labels and identity
- Map data and report layers
- API contracts and chart data
- Shared controls and overlay focus
- Routing and persistent shell
- Report submission and pagination
- Homepage scene and civic metrics

## God Nodes (most connected - your core abstractions)
1. `useAsync()` - 19 edges
2. `formatScore()` - 11 edges
3. `useRegion()` - 11 edges
4. `ReportIdentity()` - 11 edges
5. `Status` - 9 edges
6. `Report` - 9 edges
7. `Operations()` - 9 edges
8. `Button()` - 9 edges
9. `controlCls()` - 9 edges
10. `api` - 8 edges

## Surprising Connections (you probably didn't know these)
- `WeightsEditor()` --calls--> `useAsync()`  [EXTRACTED]
  pages/admin/Dashboard.tsx → hooks.ts
- `ReportRow()` --calls--> `formatScore()`  [EXTRACTED]
  pages/Reports.tsx → labels.ts
- `Dashboard()` --calls--> `useAsync()`  [EXTRACTED]
  pages/admin/Dashboard.tsx → hooks.ts
- `Home()` --calls--> `useAsync()`  [EXTRACTED]
  pages/Home.tsx → hooks.ts
- `Reports()` --calls--> `useAsync()`  [EXTRACTED]
  pages/Reports.tsx → hooks.ts

## Import Cycles
- None detected.

## Communities (7 total, 0 thin omitted)

### Community 0 - "Infrastructure labels and identity"
Cohesion: 0.09
Nodes (39): Category, Criterion, StatusEvent, CATEGORIES, CATEGORY_LABEL, CRITERION_LABEL, DAMAGE_LABEL, FACILITY_LABEL (+31 more)

### Community 1 - "Map data and report layers"
Cohesion: 0.11
Nodes (32): api, FeatureCollection, Report, SegmentProps, useAsync(), formatScore(), roadName(), FacilitiesLayer() (+24 more)

### Community 2 - "API contracts and chart data"
Cohesion: 0.08
Nodes (28): AIResult, FacilityProps, Feature, GraphSummary, Page, PriorityItem, Recommendation, RoadGroup (+20 more)

### Community 3 - "Shared controls and overlay focus"
Cohesion: 0.12
Nodes (27): ReportDetail, IMPACT_RAMP, MapDock(), MapDockProps, DevUI(), REPORT, SWATCHES, pageNumbers() (+19 more)

### Community 4 - "Routing and persistent shell"
Cohesion: 0.11
Nodes (16): getToken(), request(), setToken(), AdminLayout(), Dashboard, DevUI, Home, Login (+8 more)

### Community 5 - "Report submission and pagination"
Cohesion: 0.15
Nodes (14): ApiError, useSegments(), Login(), ACTIVE, ReportForm(), onFile(), ReportRow(), Reports() (+6 more)

### Community 6 - "Homepage scene and civic metrics"
Cohesion: 0.18
Nodes (10): BRAND, METRIC_LABEL, CityCamera, IntroMap, stageHomeIntro(), Home(), reduceMotion(), formatCoord() (+2 more)

## Knowledge Gaps
- **36 isolated node(s):** `PriorityItem`, `SegmentRef`, `Page`, `Recommendation`, `GraphSummary` (+31 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAsync()` connect `Map data and report layers` to `Infrastructure labels and identity`, `Report submission and pagination`, `Homepage scene and civic metrics`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `ReportForm()` connect `Report submission and pagination` to `Map data and report layers`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `PriorityItem`, `SegmentRef`, `Page` to the rest of the system?**
  _36 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Infrastructure labels and identity` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `Map data and report layers` be split into smaller, more focused modules?**
  _Cohesion score 0.11341463414634147 - nodes in this community are weakly interconnected._
- **Should `API contracts and chart data` be split into smaller, more focused modules?**
  _Cohesion score 0.08021390374331551 - nodes in this community are weakly interconnected._
- **Should `Shared controls and overlay focus` be split into smaller, more focused modules?**
  _Cohesion score 0.11612903225806452 - nodes in this community are weakly interconnected._
## Coverage and verification boundary

This AST graph covers 30 TypeScript/TSX files in frontend/src at code commit 8ae4f4a3c3431028d524a509822c94dac5991551. CSS, HTML, public manifest/assets, tests, backend/ML and concept documents are outside this graph and were checked separately. No LLM/API extraction tokens were used.

Extraction health warning: 45 raw edges have unresolved endpoints and were omitted by the graph builder; 6 repeated undirected endpoint pairs collapsed. Exported edges reference existing nodes. These are AST extraction limitations, not validated application defects. Source and browser behavior remain authoritative.
