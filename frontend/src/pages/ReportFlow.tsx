import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError, type AIResult, type Category, type ReportDetail } from '../api'
import { Card } from '../components'
import { CATEGORIES, CATEGORY_LABEL, DAMAGE_LABEL, SEVERITY_LABEL, roadName } from '../labels'
import { InfraMap, PARE_CENTER } from '../map'

const MAX_SIDE = 1600

// Phones produce large photos; shrink before upload so it stays well under the 8 MB limit.
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('gagal memproses foto'))), 'image/jpeg', 0.85))
}

type Step = 1 | 2 | 3 | 4

export default function ReportFlow() {
  const [step, setStep] = useState<Step>(1)
  const [photo, setPhoto] = useState<Blob | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [ai, setAi] = useState<AIResult | null>(null)
  const [aiState, setAiState] = useState<'idle' | 'running' | 'done' | 'unavailable'>('idle')
  const [pos, setPos] = useState<[number, number] | null>(null)
  const [accuracy, setAccuracy] = useState<number | undefined>()
  const [manualPin, setManualPin] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [category, setCategory] = useState<Category | null>(null)
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<ReportDetail | null>(null)

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  async function onFile(file: File | undefined) {
    if (!file) return
    setError(null)
    const blob = await shrink(file).catch(() => file)
    setPhoto(blob)
    setPreview(URL.createObjectURL(blob))
    setAiState('running')
    try {
      const result = await api.analyze(blob)
      setAi(result)
      setAiState('done')
      if (result.is_infrastructure) setCategory(result.category)
    } catch {
      setAi(null)
      setAiState('unavailable')
    }
  }

  function locate() {
    setGpsError(null)
    if (!navigator.geolocation) {
      setGpsError('Perangkat tidak mendukung GPS. Ketuk peta untuk memilih lokasi.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPos([p.coords.latitude, p.coords.longitude])
        setAccuracy(Math.round(p.coords.accuracy))
        setManualPin(false)
      },
      (e) => setGpsError(`GPS tidak tersedia (${e.message}). Ketuk peta untuk memilih lokasi.`),
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  useEffect(() => {
    if (step === 2 && !pos) locate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  async function submit() {
    if (!photo || !pos) return
    setSubmitting(true)
    setError(null)
    try {
      const report = await api.createReport({
        photo, lat: pos[0], lng: pos[1], manual_pin: manualPin, gps_accuracy_m: manualPin ? undefined : accuracy,
        category: category && (!ai || category !== ai.category) ? category : undefined,
        description: description.trim() || undefined,
      })
      setDone(report)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Gagal mengirim laporan. Periksa koneksi lalu coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <Card>
        <h1 className="text-lg font-semibold">Laporan terkirim</h1>
        <p className="mt-1 text-sm">Kode laporan: <strong>{done.code}</strong></p>
        <p className="text-sm text-slate-600">
          {done.segment ? `Terhubung ke ruas ${roadName(done.segment.name)}. ` : 'Lokasi belum terhubung ke ruas jalan; petugas akan memeriksa. '}
          Prioritas awal: {done.priority_score?.toFixed(0) ?? '–'} / 100.
        </p>
        <div className="mt-3 flex gap-3">
          <Link to={`/laporan/${done.code}`} className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white">Pantau laporan</Link>
          <button onClick={() => window.location.reload()} className="rounded-md border border-slate-300 px-4 py-2 text-sm">Laporan baru</button>
        </div>
      </Card>
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Buat laporan</h1>
        <span className="text-xs text-slate-500">Langkah {step} dari 4</span>
      </div>
      <div className="h-1 rounded bg-slate-200"><div className="h-1 rounded bg-slate-900" style={{ width: `${step * 25}%` }} /></div>

      {step === 1 && (
        <Card title="1. Foto kerusakan">
          <label className="block cursor-pointer rounded-lg border-2 border-dashed border-slate-300 p-4 text-center text-sm text-slate-600">
            {preview ? <img src={preview} alt="Pratinjau" className="mx-auto max-h-72 rounded" /> : 'Ketuk untuk mengambil foto'}
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
          {aiState === 'running' && <p className="mt-2 text-sm text-slate-500">AI sedang menganalisis foto…</p>}
          {aiState === 'unavailable' && <p className="mt-2 text-sm text-amber-700">AI tidak tersedia saat ini. Pilih kategori secara manual.</p>}
          {ai && (
            <p className={`mt-2 text-sm ${ai.is_infrastructure ? 'text-slate-700' : 'text-rose-700'}`}>
              {ai.is_infrastructure
                ? <>AI: <strong>{CATEGORY_LABEL[ai.category]}</strong>, kerusakan {SEVERITY_LABEL[ai.severity].toLowerCase()}{ai.damage_type ? ` (${DAMAGE_LABEL[ai.damage_type] ?? ai.damage_type})` : ''}.</>
                : 'AI menilai foto ini bukan infrastruktur publik. Anda tetap bisa melanjutkan.'}
            </p>
          )}
          <button disabled={!photo || aiState === 'running'} onClick={() => setStep(2)}
            className="mt-3 w-full rounded-md bg-slate-900 py-2 text-sm text-white disabled:opacity-40">Lanjut</button>
        </Card>
      )}

      {step === 2 && (
        <Card title="2. Lokasi">
          <p className="mb-2 text-sm text-slate-600">
            {pos ? (manualPin ? 'Lokasi dipilih manual di peta.' : `Lokasi GPS (akurasi ±${accuracy ?? '?'} m).`) : 'Mencari lokasi…'} Ketuk peta untuk mengubah.
          </p>
          {gpsError && <p className="mb-2 text-sm text-amber-700">{gpsError}</p>}
          <InfraMap className="h-72" center={pos ?? PARE_CENTER} zoom={16} pin={pos} showSegments
            onMapClick={(lat, lng) => { setPos([lat, lng]); setManualPin(true) }} />
          <div className="mt-3 flex gap-2">
            <button onClick={() => setStep(1)} className="flex-1 rounded-md border border-slate-300 py-2 text-sm">Kembali</button>
            <button onClick={locate} className="flex-1 rounded-md border border-slate-300 py-2 text-sm">Pakai GPS</button>
            <button disabled={!pos} onClick={() => setStep(3)} className="flex-1 rounded-md bg-slate-900 py-2 text-sm text-white disabled:opacity-40">Lanjut</button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card title="3. Kategori dan keterangan">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)}
                className={`rounded-full border px-3 py-1 text-sm ${category === c ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300'}`}>
                {CATEGORY_LABEL[c]}{ai?.is_infrastructure && ai.category === c ? ' · AI' : ''}
              </button>
            ))}
          </div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} rows={3}
            placeholder="Keterangan tambahan (opsional), misal: lubang sedalam 15 cm di depan pasar"
            className="mt-3 w-full rounded border border-slate-300 p-2 text-sm" />
          <div className="mt-3 flex gap-2">
            <button onClick={() => setStep(2)} className="flex-1 rounded-md border border-slate-300 py-2 text-sm">Kembali</button>
            <button disabled={!category} onClick={() => setStep(4)} className="flex-1 rounded-md bg-slate-900 py-2 text-sm text-white disabled:opacity-40">Lanjut</button>
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card title="4. Periksa dan kirim">
          {preview && <img src={preview} alt="" className="max-h-48 rounded" />}
          <dl className="mt-2 grid grid-cols-3 gap-1 text-sm">
            <dt className="text-slate-500">Kategori</dt><dd className="col-span-2">{category ? CATEGORY_LABEL[category] : '–'}</dd>
            <dt className="text-slate-500">Lokasi</dt><dd className="col-span-2">{pos?.map((x) => x.toFixed(5)).join(', ')} {manualPin ? '(manual)' : '(GPS)'}</dd>
            <dt className="text-slate-500">Keterangan</dt><dd className="col-span-2">{description || '–'}</dd>
          </dl>
          <p className="mt-2 text-xs text-slate-500">Identitas Anda tidak disimpan. Data lokasi pada foto dihapus oleh server.</p>
          {error && <p className="mt-2 rounded bg-rose-50 p-2 text-sm text-rose-700">{error}</p>}
          <div className="mt-3 flex gap-2">
            <button onClick={() => setStep(3)} className="flex-1 rounded-md border border-slate-300 py-2 text-sm">Kembali</button>
            <button disabled={submitting} onClick={submit} className="flex-1 rounded-md bg-slate-900 py-2 text-sm text-white disabled:opacity-40">
              {submitting ? 'Mengirim…' : 'Kirim laporan'}
            </button>
          </div>
        </Card>
      )}
    </div>
  )
}
