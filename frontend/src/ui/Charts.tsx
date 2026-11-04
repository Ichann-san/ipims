import { useEffect, useRef } from 'react'
import { Chart, BarController, BarElement, DoughnutController, ArcElement, CategoryScale, LinearScale, Tooltip,
  type ChartConfiguration, type ChartOptions, type Plugin } from 'chart.js'
import type { Stats } from '../api'
import { sixMonths } from '../statistics'

// Canvas colors need concrete values; the rest of the UI uses CSS theme variables.
const themeColors: Plugin = {
  id: 'theme-colors',
  beforeInit(chart) {
    const style = getComputedStyle(chart.canvas)
    for (const dataset of chart.data.datasets) {
      if (Array.isArray(dataset.backgroundColor)) {
        dataset.backgroundColor = dataset.backgroundColor.map((color) =>
          typeof color === 'string' && color.startsWith('var(')
            ? style.getPropertyValue(color.slice(4, -1)).trim() : color)
      }
    }
  },
}
Chart.register(BarController, BarElement, DoughnutController, ArcElement, CategoryScale, LinearScale, Tooltip, themeColors)
Chart.defaults.devicePixelRatio = Math.min(window.devicePixelRatio, 2)

const BLUE = '#5bb6e6'
const ORANGE = '#f08a64'
const TEXT = '#93a1bc'
const FONT = { family: '"Plus Jakarta Sans Variable", sans-serif', size: 11 }
const bars: ChartOptions<'bar'> = {
  responsive: true, maintainAspectRatio: false, animation: false,
  plugins: { legend: { display: false }, tooltip: { backgroundColor: '#172542', titleColor: '#e8edf6', bodyColor: '#e8edf6', padding: 12 } },
  scales: {
    x: { grid: { color: 'rgba(148,170,210,0.10)' }, border: { display: false }, ticks: { color: TEXT, font: FONT, precision: 0, maxTicksLimit: 6 }, beginAtZero: true },
    y: { grid: { display: false }, border: { display: false }, ticks: { color: TEXT, font: FONT, precision: 0 }, beginAtZero: true },
  },
}

function ChartView<T extends 'bar' | 'doughnut'>({ label, config, height, headers, rows }: {
  label: string; config: ChartConfiguration<T>; height: number; headers: string[]; rows: (string | number)[][]
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!canvas.current) return
    const chart = new Chart<T>(canvas.current, config)
    return () => chart.destroy()
  }, [config])
  return (
    <div className="min-w-0">
      <div className="relative w-full" style={{ height }}>
        <canvas ref={canvas} role="img" aria-label={label}>Chart data is available in the table below.</canvas>
      </div>
      <details className="mt-3 text-xs text-muted">
        <summary className="w-fit cursor-pointer rounded-md py-1 font-medium hover:text-fg">View data</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left">
            <caption className="sr-only">{label}</caption>
            <thead><tr>{headers.map((h) => <th key={h} scope="col" className="border-b border-line px-2 py-2 font-semibold text-fg">{h}</th>)}</tr></thead>
            <tbody>{rows.map((row) => <tr key={row[0]}>{row.map((cell, i) => i === 0
              ? <th key={i} scope="row" className="border-b border-line px-2 py-1.5 font-normal">{cell}</th>
              : <td key={i} className="num border-b border-line px-2 py-1.5">{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </details>
    </div>
  )
}

export function HorizontalBars({ label, rows }: { label: string; rows: { label: string; value: number; color?: string }[] }) {
  if (!rows.length) return <p className="py-10 text-center text-sm text-muted">No reports yet.</p>
  return <ChartView label={label} height={Math.max(150, rows.length * 31)} headers={['Group', 'Reports']}
    rows={rows.map((r) => [r.label, r.value])} config={{
      type: 'bar', options: { ...bars, indexAxis: 'y' },
      data: { labels: rows.map((r) => r.label), datasets: [{ label: 'Reports', data: rows.map((r) => r.value), backgroundColor: rows.map((r) => r.color ?? BLUE), borderRadius: 3, maxBarThickness: 13 }] },
    }} />
}

export function MonthlyTrend({ monthly }: { monthly: Stats['monthly'] }) {
  const rows = sixMonths(monthly)
  return <>
    <div className="mb-3 flex gap-4 text-xs text-muted">
      <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: BLUE }} />Reported</span>
      <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: ORANGE }} />Completed</span>
    </div>
    <ChartView label="Reports and completions over the last six calendar months" height={200}
      headers={['Month', 'Reported', 'Completed']} rows={rows.map((r) => [r.month, r.reported, r.completed])}
      config={{ type: 'bar', options: { ...bars, scales: {
        ...bars.scales, x: { ...bars.scales?.x, grid: { display: false }, ticks: { color: TEXT, font: FONT, maxRotation: 0 } },
        y: { ...bars.scales?.y, grid: { color: 'rgba(148,170,210,0.10)' } },
      } }, data: {
        labels: rows.map((r) => new Intl.DateTimeFormat('en', { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(new Date(`${r.month}-01T00:00:00Z`))),
        datasets: [
          { label: 'Reported', data: rows.map((r) => r.reported), backgroundColor: BLUE, borderRadius: 3, maxBarThickness: 22 },
          { label: 'Completed', data: rows.map((r) => r.completed), backgroundColor: ORANGE, borderRadius: 3, maxBarThickness: 22 },
        ],
      } }} />
  </>
}

export function ReportDistribution({ stats }: { stats: Stats }) {
  const rows = [
    { label: 'Active', value: stats.active, color: BLUE },
    { label: 'Completed', value: stats.by_status.completed, color: '#4cc38a' },
    { label: 'Rejected', value: stats.by_status.rejected, color: '#e36a7a' },
  ]
  if (!stats.total) return <p className="py-12 text-center text-sm text-muted">No reports yet.</p>
  return <div className="grid items-center gap-3 sm:grid-cols-[minmax(0,1fr)_1fr]">
    <ChartView label="Share of all reports by outcome" height={170} headers={['Outcome', 'Reports', '% of all reports']}
      rows={rows.map((r) => [r.label, r.value, `${(100 * r.value / stats.total).toFixed(1)}%`])}
      config={{ type: 'doughnut', options: { responsive: true, maintainAspectRatio: false, animation: false, cutout: '76%', plugins: { legend: { display: false } } },
        data: { labels: rows.map((r) => r.label), datasets: [{ data: rows.map((r) => r.value), backgroundColor: rows.map((r) => r.color), borderWidth: 0, hoverOffset: 3 }] } }} />
    <ul className="grid gap-3 text-sm">{rows.map((r) => <li key={r.label} className="grid grid-cols-[1fr_auto] items-center gap-3">
      <span className="flex items-center gap-2 text-muted"><span className="size-2 rounded-full" style={{ background: r.color }} />{r.label}</span>
      <span className="num font-semibold">{r.value} <span className="ml-1 text-xs font-normal text-muted">{(100 * r.value / stats.total).toFixed(1)}%</span></span>
    </li>)}</ul>
  </div>
}
