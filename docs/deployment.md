# Vercel deployment

IPIMS uses **Vite/React and FastAPI**, not Next.js. The original Vercel project is
`ipims`, with production domain `https://ipims-one.vercel.app`.

## Source configuration

Deploy from the repository root. `vercel.json` defines two Vercel Services:

- `frontend/`: Vite build, `dist/`, SPA deep-link fallback.
- `backend`: repository-root FastAPI service, entrypoint `backend.app.main:app`.
  Public `/api/*` and `/media/*` requests retain their paths and enter this service.

The Vercel dashboard's Root Directory, Framework, Build Command, Install Command
and Output Directory overrides must remain unset. The checked-in services own
those settings. Do not point the project at removed `ipims-web/`, `legacy/backend`
or select Next.js. `ml/` is a Python library, not a standalone web app.

The production Python manifest is `pyproject.toml` (Python 3.12, CPU-only Torch).
`uv run` in the backend build command installs this manifest. Local graph-building
and evaluation dependencies remain in the existing backend/ML requirements files.

## Persistent resources

- Dedicated **Neon `ipims-postgis`**, Free plan, region `iad1`, PostGIS enabled.
- **Vercel Blob `ipims-media`**, private access, region `iad1`.
- Both are connected only to the original project's production environment.

The initial cloud database copied 58,445 segments, 3,218 facility destinations,
50 reports, 212 status events, two weight profiles and one admin from the existing
local database. It occupies about 38.5 MB after import. Only the 50 photos actually
referenced by reports were copied. Local data was not reset or edited.

Production admin credentials differ from local `admin/admin123`. The new password
and deployment credentials are in the ignored `.vercel/production.env`; never
print, commit or distribute that file. Vercel stores production settings encrypted.

The Blob bucket is private. The existing public `/media/reports/<uuid>.jpg` API
intentionally serves report photos; it rejects other paths. The runtime graph
archive shares the private store under `runtime/` and is not exposed by that API.
New photos are encoded without EXIF and stored in Blob before report creation.
The default local mode still uses `backend/media/`.

## Required production environment

| Name | Purpose |
|---|---|
| `IPIMS_DATABASE_URL` | Neon pooled URL with SQLAlchemy `postgresql+psycopg` driver and TLS |
| `BLOB_READ_WRITE_TOKEN` | Automatically connected private Blob credentials; server/build only |
| `IPIMS_MEDIA_STORAGE=blob` | Durable report photo storage |
| `IPIMS_REGION=surabaya` | Existing graph/data region |
| `IPIMS_JWT_SECRET` | Production signing secret |
| `IPIMS_ADMIN_USERNAME`, `IPIMS_ADMIN_PASSWORD` | Initial admin settings; changing env alone does not reset an existing DB password |
| `VITE_MAPBOX_TOKEN` | Public Mapbox browser token, embedded at frontend build time |
| `IPIMS_CV_MODEL_PATH=deployment-artifacts/cv` | Bundled model, resolved relative to the repository |
| `IPIMS_RUNTIME_BLOB_PATH`, `IPIMS_RUNTIME_SHA256` | Private graph archive and integrity check |
| `VERCEL_SUPPORT_LARGE_FUNCTIONS=1` | Required for this existing project to bundle CLIP/Torch above 500 MB |
| `OMP_NUM_THREADS=1`, `MKL_NUM_THREADS=1` | CPU thread limits |
| `TOKENIZERS_PARALLELISM=false`, `HF_HUB_DISABLE_TELEMETRY=1` | Model library settings |

`scripts/prepare_deployment.py` checks the archive SHA-256 and its exact file
manifest, then restores only graph runtime files, GNN summary/predictions and an
optional existing CV head. It downloads public CLIP safetensors/tokenizer files at
revision `1a25a446712ba5ee05982a381eed697ef9b435cf`. It never downloads pickle
weights, OSM extracts or training datasets. Model weights, local env files and
photos are excluded from the source upload and Git.

## Release and rollback

Use a current CLI with Vercel Services support; deployment was tested with 65.11.0.

```sh
npx --yes vercel@65.11.0 link --project ipims
npx --yes vercel@65.11.0 deploy --prod --skip-domain
# Verify the returned URL with authenticated `vercel curl` while it is protected.
npx --yes vercel@65.11.0 promote <verified-deployment-url>
```

Check the original domain without bypass headers after promotion. Confirm SPA
routes, assets, database, private photo proxy, valid/invalid officer login,
CLIP `/api/v1/analyze`, and graph what-if. CV warms in the background; the first
health response can show `cv: false` during startup. Verify actual analysis and
then health, rather than treating that initial response as permanent failure.

For rollback, promote a known working deployment in the same project. Photo URLs
and the database are independent of deployments; rollback does not restore data.
Never run `app.demo --reset`, reseed an occupied production database or reuse an
unrelated project's database as a deployment repair.

## Hosting boundaries

This deployment uses Vercel Services and large Python Functions, both currently
beta. The model needs a large function bundle; keep Fluid Compute enabled. Hobby
runtime is 2 GB/1 vCPU, with the backend timeout set to 300 seconds. Staging showed
approximately 6–9 seconds for cold API/upload requests and subsecond warm reads;
these are individual observations, not a load test or latency guarantee.

Vercel limits function request payloads to 4.5 MB including multipart overhead.
The existing frontend resizes/re-encodes photos before sending them. The local
API's 8 MB photo validator remains unchanged; raw API clients must respect the
smaller hosted transport limit. Database/Blob/compute have free-tier quotas, not
unlimited capacity. No paid plan was selected during this setup.

References: [Vercel Services](https://vercel.com/docs/services),
[Python functions](https://vercel.com/docs/functions/runtimes/python),
[function limits](https://vercel.com/docs/functions/limitations),
[private Blob from Python](https://vercel.com/kb/guide/python-and-vercel-blob),
[Neon PostGIS](https://neon.com/docs/extensions/postgis).
