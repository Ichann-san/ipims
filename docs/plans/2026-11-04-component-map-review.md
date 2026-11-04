# Shared components and homepage performance review - 2026-11-04

## Implemented correction

`Stat` now owns `text-center`. The homepage previously inherited centering from
its panel while other callers inherited left alignment. Removed that redundant
homepage rule so all instances use the same component behavior.

All 16 instances were checked at 1366x900 and 390x844: Home (3), Transparency (5),
Dashboard (5), design-system page (3). Values and labels are centered. Production
pages have no horizontal overflow in these checks. Frontend production build passes.

## Reuse audit

| Finding | Evidence | Disposition |
|---|---|---|
| Stat alignment depended on the caller's parent | Home panel supplied text-center; Transparency/Dashboard/catalog did not | Fixed in the shared component |
| Navigation actions wrap Button in Link | Home Open map; report detail View on map; Operations Follow up | Three nested interactive controls. Follow-up: share button styling with a link component that renders one anchor |
| Status colors have duplicate definitions | CSS tokens/core badges versus STATUS_HEX in map/layers | Current values agree. Follow-up: one semantic palette with usable CSS and concrete canvas/map values |
| Simulation numbers bypass Stat | Operations access-restored headline and facility dt/dd cards | Intentional compact hierarchy; consider a compact shared metric only if adopting uniform alignment there |
| Design catalog overflows on phone | /dev/ui scrollWidth 401 at viewport 390; production routes tested at 390 fit | Separate catalog layout issue; follow-up: bounded grid tracks / min-width handling |
| Compact and detailed progress trackers differ | StageTracker compact prop; detail drawers pass reachedStages(timeline) | Intentional context differences; preserve actual-history behavior |

Only the Stat correction is implemented in this task. Other findings are recorded
for follow-up; navigation, simulation, and map animation behavior are preserved.

## Review of Mapbox 3D model guide

[Using 3D models](https://docs.mapbox.com/style-spec/guides/using-3d-models/)
describes custom glTF/GLB geometry, material, texture and instance optimization:
fewer vertices/materials, lower texture resolution, less transparency, and gltfpack.
Those are useful when authoring model assets. Our app has no custom glTF/GLB assets
or custom model layer; the homepage uses Mapbox Standard plus two report circle
layers. Mapbox may use model content internally, but we cannot apply gltfpack to
vendor-controlled basemap geometry as an application-side setting.

The guide is not a drop-in replacement for tile selection or a runtime culling
switch. Keep the original city scene. Profile the basemap, camera animation and
our report overlays separately before estimating benefits.

## Delaying homepage data - proposal only

The initial fly-in lasts 5.2 seconds. Afterward, Home currently starts a continuous
slow orbit; it never reaches a permanent stopped state. Gate overlays on completion
of the **initial fly-in**, not on all camera movement stopping forever. A global
idle wait can be starved if orbiting begins before the settling phase.

| Approach | Trade-off |
|---|---|
| A. Prefetch reports during fly-in; mount the GeoJSON source and two circle layers after intro completion (recommended first experiment) | Overlaps network work and preserves the final scene. Removes overlay setup/drawing from the entrance, but may give only modest benefit for at most 100 report points |
| B. Fetch reports only after intro completion | Separates API/parse activity from the entrance too; markers arrive later on slower connections |
| C. Stage all configurable basemap labels/3D detail too | Potentially larger savings, but visible pop-in and more work; defer unless profiling points to those layers |

For A, use the completion event associated with the initial flyTo, registered before
starting it. Handle reduced-motion jumpTo and cleanup on unmount. Allow one settling
phase (bounded wait for the base map's idle event), attach overlays once, then resume
the same slow orbit. Fetching early and withholding the source is different from
merely making the layers transparent: source processing still costs work.

Keep headline, navbar and KPI data visible independently. Delay only map overlays.
Basemap labels belong to Mapbox Standard and are not part of our report source.

Additional candidate: explicitly suspend orbit while the document is hidden and
reset its timestamp on resume. The current comment claims this, but there is no
visibility listener; browser background RAF throttling alone is not explicit cleanup.
This preserves the visible animation, but does not solve foreground GPU cost.

Compare the unchanged homepage against A and B on the affected device: intro frame
times, long tasks, transfer sizes, first useful map and time to visible report dots.
No FPS improvement is claimed, and no homepage timing/model changes are implemented.

References: [Map events](https://docs.mapbox.com/mapbox-gl-js/api/map/),
[Mapbox performance guidance](https://docs.mapbox.com/help/troubleshooting/mapbox-gl-js-performance/).
