# Graph Report - src  (2026-11-05)

## Corpus Check
- Corpus is ~15,986 words - fits in a single context window. You may not need a graph.

## Summary
- 220 nodes · 664 edges · 9 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `dee3195e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Infrastructure labels and queues
- Working map panels and layers
- Responsive workspace and map canvas
- API types and transport
- Routing and navigation
- Shared controls and overlay focus
- Report intake and pagination
- Status palette and statistics
- Homepage camera entrance

## God Nodes (most connected - your core abstractions)
1. `useCompactLayout()` - 26 edges
2. `useAsync()` - 19 edges
3. `formatScore()` - 11 edges
4. `useRegion()` - 11 edges
5. `Button()` - 11 edges
6. `Operations()` - 10 edges
7. `controlCls()` - 10 edges
8. `Status` - 9 edges
9. `Report` - 9 edges
10. `MapPage()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `WeightsEditor()` --calls--> `useAsync()`  [EXTRACTED]
  pages/admin/Dashboard.tsx → hooks.ts
- `AdminNavbar()` --calls--> `setToken()`  [EXTRACTED]
  ui/Navbar.tsx → api.ts
- `Dashboard()` --calls--> `useAsync()`  [EXTRACTED]
  pages/admin/Dashboard.tsx → hooks.ts
- `Home()` --calls--> `useAsync()`  [EXTRACTED]
  pages/Home.tsx → hooks.ts
- `Reports()` --calls--> `useAsync()`  [EXTRACTED]
  pages/Reports.tsx → hooks.ts

## Import Cycles
- None detected.

## Communities (9 total, 0 thin omitted)

### Community 0 - "Infrastructure labels and queues"
Cohesion: 0.08
Nodes (40): Criterion, Severity, StatusEvent, CATEGORIES, CATEGORY_LABEL, CRITERION_LABEL, DAMAGE_LABEL, FACILITY_LABEL (+32 more)

### Community 1 - "Working map panels and layers"
Cohesion: 0.15
Nodes (25): api, SegmentProps, useAsync(), formatScore(), FacilitiesLayer(), FACILITY_HEX, IMPACT_RAMP, impactColor (+17 more)

### Community 2 - "Responsive workspace and map canvas"
Cohesion: 0.14
Nodes (22): formatHours(), cameraPadding(), BASEMAP_CONFIG, MapCanvas(), MapCanvasProps, TOKEN, MapDock(), MapDockProps (+14 more)

### Community 3 - "API types and transport"
Cohesion: 0.10
Nodes (20): AIResult, ApiError, Category, FacilityProps, Feature, FeatureCollection, getToken(), GraphSummary (+12 more)

### Community 4 - "Routing and navigation"
Cohesion: 0.14
Nodes (14): App(), Dashboard, DevUI, Home, Login, MapPage, Operations, Reports (+6 more)

### Community 5 - "Shared controls and overlay focus"
Cohesion: 0.16
Nodes (19): DevUI(), REPORT, SWATCHES, Button(), buttonCls(), ButtonLink(), Empty(), ErrorNote() (+11 more)

### Community 6 - "Report intake and pagination"
Cohesion: 0.17
Nodes (14): useSegments(), Login(), ACTIVE, ReportForm(), onFile(), Reports(), Scope, shrink() (+6 more)

### Community 7 - "Status palette and statistics"
Cohesion: 0.16
Nodes (15): Stats, Status, applyStatusPalette(), palette, STATUS_HEX, statusToken, reportingMonth(), sixMonths() (+7 more)

### Community 8 - "Homepage camera entrance"
Cohesion: 0.39
Nodes (3): CityCamera, IntroMap, stageHomeIntro()

## Knowledge Gaps
- **36 isolated node(s):** `PriorityItem`, `SegmentRef`, `Page`, `Recommendation`, `GraphSummary` (+31 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useCompactLayout()` connect `Responsive workspace and map canvas` to `Infrastructure labels and queues`, `Working map panels and layers`, `Routing and navigation`, `Report intake and pagination`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Why does `stageHomeIntro()` connect `Homepage camera entrance` to `Responsive workspace and map canvas`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `useAsync()` connect `Working map panels and layers` to `Infrastructure labels and queues`, `Responsive workspace and map canvas`, `Report intake and pagination`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useCompactLayout()` (e.g. with `getSnapshot()` and `subscribe()`) actually correct?**
  _`useCompactLayout()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `PriorityItem`, `SegmentRef`, `Page` to the rest of the system?**
  _36 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Infrastructure labels and queues` be split into smaller, more focused modules?**
  _Cohesion score 0.07678075855689177 - nodes in this community are weakly interconnected._
- **Should `Working map panels and layers` be split into smaller, more focused modules?**
  _Cohesion score 0.14717741935483872 - nodes in this community are weakly interconnected._
## Coverage and verification boundary

This AST graph covers 32 TypeScript/TSX files in frontend/src at code commit dee3195e0696adb965d174a9a999acb2b90386d4. CSS, HTML, public manifest/assets, tests, backend/ML and concept documents are outside this graph and were checked separately. No LLM/API extraction tokens were used.

Extraction health warning: 49 raw edges have unresolved endpoints and were omitted by the graph builder; 6 repeated undirected endpoint pairs collapsed. No raw self-loops were found. Exported edges reference existing nodes. These are AST extraction limitations, not validated application defects. Source and browser behavior remain authoritative.
