# Graph Report - src  (2026-11-04)

## Corpus Check
- Corpus is ~10,486 words - fits in a single context window. You may not need a graph.

## Summary
- 160 nodes · 426 edges · 8 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Reports and presentation labels
- Maps and operations simulation
- Statistics and chart rendering
- Routes and authentication
- Shared interface components
- API and data contracts
- Homepage map and region
- Report submission and photos

## God Nodes (most connected - your core abstractions)
1. `useAsync()` - 16 edges
2. `roadName()` - 13 edges
3. `useRegion()` - 11 edges
4. `Status` - 8 edges
5. `api` - 8 edges
6. `Panel()` - 8 edges
7. `Report` - 7 edges
8. `useSegments()` - 7 edges
9. `Operations()` - 7 edges
10. `CATEGORY_LABEL` - 6 edges

## Surprising Connections (you probably didn't know these)
- `WeightsEditor()` --calls--> `useAsync()`  [EXTRACTED]
  pages/admin/Dashboard.tsx → hooks.ts
- `Operations()` --calls--> `useAsync()`  [EXTRACTED]
  pages/admin/Operations.tsx → hooks.ts
- `Home()` --calls--> `useAsync()`  [EXTRACTED]
  pages/Home.tsx → hooks.ts
- `MapPage()` --calls--> `useAsync()`  [EXTRACTED]
  pages/MapPage.tsx → hooks.ts
- `Reports()` --calls--> `useAsync()`  [EXTRACTED]
  pages/Reports.tsx → hooks.ts

## Import Cycles
- None detected.

## Communities (8 total, 0 thin omitted)

### Community 0 - "Reports and presentation labels"
Cohesion: 0.11
Nodes (29): AIResult, Category, Criterion, Severity, useAsync(), CATEGORIES, CATEGORY_LABEL, CRITERION_LABEL (+21 more)

### Community 1 - "Maps and operations simulation"
Cohesion: 0.14
Nodes (22): api, FeatureCollection, SegmentProps, WhatIfResult, FACILITY_LABEL, formatIdr(), FacilitiesLayer(), FACILITY_HEX (+14 more)

### Community 2 - "Statistics and chart rendering"
Cohesion: 0.13
Nodes (17): Stats, Status, STATUS_LABEL, ACTIVE, Scope, reportingMonth(), sixMonths(), bars (+9 more)

### Community 3 - "Routes and authentication"
Cohesion: 0.12
Nodes (15): getToken(), request(), setToken(), AdminLayout(), App(), Dashboard, DevUI, Home (+7 more)

### Community 4 - "Shared interface components"
Cohesion: 0.16
Nodes (14): STATUSES, SWATCHES, Chip(), Empty(), Field(), inputCls, Modal(), Sheet() (+6 more)

### Community 5 - "API and data contracts"
Cohesion: 0.13
Nodes (13): ApiError, FacilityProps, Feature, GraphSummary, Page, PriorityItem, Recommendation, Report (+5 more)

### Community 6 - "Homepage map and region"
Cohesion: 0.20
Nodes (13): BASEMAP_CONFIG, MapCanvas(), MapCanvasProps, TOKEN, Home(), reduceMotion(), formatCoord(), Region (+5 more)

### Community 7 - "Report submission and photos"
Cohesion: 0.50
Nodes (3): ReportForm(), onFile(), shrink()

## Knowledge Gaps
- **33 isolated node(s):** `PriorityItem`, `SegmentRef`, `Page`, `Recommendation`, `GraphSummary` (+28 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAsync()` connect `Reports and presentation labels` to `Maps and operations simulation`, `Statistics and chart rendering`, `Homepage map and region`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `roadName()` connect `Reports and presentation labels` to `Maps and operations simulation`, `Statistics and chart rendering`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `ReportForm()` connect `Report submission and photos` to `Reports and presentation labels`, `Maps and operations simulation`, `Homepage map and region`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `PriorityItem`, `SegmentRef`, `Page` to the rest of the system?**
  _33 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Reports and presentation labels` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `Maps and operations simulation` be split into smaller, more focused modules?**
  _Cohesion score 0.13538461538461538 - nodes in this community are weakly interconnected._
- **Should `Statistics and chart rendering` be split into smaller, more focused modules?**
  _Cohesion score 0.13438735177865613 - nodes in this community are weakly interconnected._
## Extraction limits for this planning task

The AST diagnostic reports 41 dangling-endpoint edges and 3 same-endpoint relations collapsed by the graph representation. The graph is incomplete; page and component decisions were verified against source. Code-only extraction used no LLM/API tokens.
