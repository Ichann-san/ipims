import type { Status } from './api'

/** Concrete colors for DOM, map and canvas consumers share this semantic owner. */
export const STATUS_HEX: Record<Status, string> = {
  reported: '#94a3b8', ai_verified: '#5bb6e6', gov_approved: '#7c9bf0',
  assigned: '#e8b04a', in_repair: '#f08a64', completed: '#4cc38a', rejected: '#e36a7a',
}
export const palette = {
  cyan: '#5bb6e6', coral: '#f08a64', muted: '#93a1bc', fg: '#e8edf6',
  ink700: '#172542', line: 'rgba(148,170,210,0.10)', status: STATUS_HEX,
} as const

const statusToken: Record<Status, string> = {
  reported: 'reported', ai_verified: 'verified', gov_approved: 'approved',
  assigned: 'assigned', in_repair: 'repair', completed: 'completed', rejected: 'rejected',
}
export function applyStatusPalette(root: HTMLElement) {
  for (const status of Object.keys(STATUS_HEX) as Status[]) {
    root.style.setProperty(`--status-${statusToken[status]}`, STATUS_HEX[status])
  }
}
