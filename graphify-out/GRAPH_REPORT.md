# Graph Report - src  (2026-11-05)

## Corpus Check
- Corpus is ~11,798 words - fits in a single context window. You may not need a graph.

## Summary
- 181 nodes · 475 edges · 11 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Map layers and simulation
- Report browsing and controls
- API data contracts
- Routing and shared chrome
- Status progress and charts
- Officer actions and scoring
- Report detail and presentation
- Category and severity labels
- Homepage entrance lifecycle
- Async state and composition
- Photo report submission

## God Nodes (most connected - your core abstractions)
1. `useAsync()` - 18 edges
2. `roadName()` - 13 edges
3. `useRegion()` - 11 edges
4. `api` - 9 edges
5. `Status` - 8 edges
6. `Panel()` - 8 edges
7. `Report` - 7 edges
8. `stageHomeIntro()` - 7 edges
9. `useSegments()` - 7 edges
10. `Operations()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `AdminReport()` --calls--> `useAsync()`  [EXTRACTED]
  pages/admin/Dashboard.tsx → hooks.ts
- `Dashboard()` --calls--> `useAsync()`  [EXTRACTED]
  pages/admin/Dashboard.tsx → hooks.ts
- `WeightsEditor()` --calls--> `useAsync()`  [EXTRACTED]
  pages/admin/Dashboard.tsx → hooks.ts
- `Operations()` --calls--> `useAsync()`  [EXTRACTED]
  pages/admin/Operations.tsx → hooks.ts
- `DevUI()` --calls--> `useAsync()`  [EXTRACTED]
  pages/DevUI.tsx → hooks.ts

## Import Cycles
- None detected.

## Communities (11 total, 0 thin omitted)

### Community 0 - "Map layers and simulation"
Cohesion: 0.10
Nodes (34): api, FeatureCollection, SegmentProps, WhatIfResult, CATEGORY_LABEL, FACILITY_LABEL, formatIdr(), FacilitiesLayer() (+26 more)

### Community 1 - "Report browsing and controls"
Cohesion: 0.13
Nodes (23): STATUSES, MapDock(), MapDockProps, SWATCHES, ACTIVE, Reports(), Scope, initialPageSize() (+15 more)

### Community 2 - "API data contracts"
Cohesion: 0.10
Nodes (20): AIResult, ApiError, FacilityProps, Feature, GraphSummary, Page, PriorityItem, Recommendation (+12 more)

### Community 3 - "Routing and shared chrome"
Cohesion: 0.11
Nodes (17): getToken(), request(), setToken(), AdminLayout(), App(), Dashboard, DevUI, Home (+9 more)

### Community 4 - "Status progress and charts"
Cohesion: 0.21
Nodes (11): Status, StatusEvent, STATUS_LABEL, ACTIVE, Scope, Chip(), ErrorNote(), Skeleton() (+3 more)

### Community 5 - "Officer actions and scoring"
Cohesion: 0.20
Nodes (8): RoadGroup, Weights, CRIT_HEX, CRITERIA, Filter, Login(), NEXT, OPD

### Community 6 - "Report detail and presentation"
Cohesion: 0.31
Nodes (8): formatDate(), roadName(), AdminReport(), age(), Dashboard(), ReportDetailView(), ReportRow(), reachedStages()

### Community 7 - "Category and severity labels"
Cohesion: 0.25
Nodes (7): Category, Criterion, Severity, CATEGORIES, CRITERION_LABEL, DAMAGE_LABEL, SEVERITY_LABEL

### Community 8 - "Homepage entrance lifecycle"
Cohesion: 0.39
Nodes (3): CityCamera, IntroMap, stageHomeIntro()

### Community 9 - "Async state and composition"
Cohesion: 0.33
Nodes (5): useAsync(), WeightsEditor(), DevUI(), Transparency(), statusColor()

### Community 10 - "Photo report submission"
Cohesion: 0.50
Nodes (3): ReportForm(), onFile(), shrink()

## Knowledge Gaps
- **35 isolated node(s):** `PriorityItem`, `SegmentRef`, `Page`, `Recommendation`, `GraphSummary` (+30 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAsync()` connect `Async state and composition` to `Map layers and simulation`, `Report browsing and controls`, `Status progress and charts`, `Officer actions and scoring`, `Report detail and presentation`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `stageHomeIntro()` connect `Homepage entrance lifecycle` to `Map layers and simulation`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `roadName()` connect `Report detail and presentation` to `Map layers and simulation`, `Report browsing and controls`, `Status progress and charts`, `Officer actions and scoring`, `Category and severity labels`, `Async state and composition`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `PriorityItem`, `SegmentRef`, `Page` to the rest of the system?**
  _35 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Map layers and simulation` be split into smaller, more focused modules?**
  _Cohesion score 0.1024390243902439 - nodes in this community are weakly interconnected._
- **Should `Report browsing and controls` be split into smaller, more focused modules?**
  _Cohesion score 0.12688172043010754 - nodes in this community are weakly interconnected._
- **Should `API data contracts` be split into smaller, more focused modules?**
  _Cohesion score 0.09846153846153846 - nodes in this community are weakly interconnected._
## Extraction limits

AST diagnostics: 44 dangling-endpoint edges and 3 collapsed same-endpoint relations. The graph remains incomplete; implementation decisions and validation were checked against source and browser behavior. No extraction LLM/API tokens used.
