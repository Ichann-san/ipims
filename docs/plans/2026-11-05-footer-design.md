# Compact shared footer

Approved by the user after the desktop/mobile ASCII proposal.

- Keep the existing fixed navy footer and subtle top border on every route.
- Left: supplied `inovboyo.svg` emblem with the Inovboyo 2.0 label.
- Right: IPIMS and current-year IPIMS copyright; map attribution below, right aligned.
- Retain Mapbox, OpenStreetMap and camera-aware Improve this map links.
- Desktop target: 72px. Phone target: 96px, with credits wrapping below the brand row.
- Reuse SiteFrame's ResizeObserver for page, pagination and map-control clearances.
- No statistics, extra institutional logos, new navigation, dependencies or API changes.

Acceptance: supplied logo loads, credits remain usable, footer fits 320px/390px/1366px,
one footer per public/officer route, fixed bottom positioning, no horizontal overflow,
and existing map controls/pagination clear its measured bounds. Production build passes.
