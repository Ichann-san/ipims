export const PAGE_SIZES = [3, 6, 9, 12] as const
export function initialPageSize(width: number): number { return width < 640 ? 3 : width < 1100 ? 6 : 9 }

export function readReportPage(params: URLSearchParams, defaultSize: number) {
  const requestedPage = Number(params.get('page'))
  const requestedSize = Number(params.get('size'))
  return {
    page: Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    pageSize: PAGE_SIZES.some((size) => size === requestedSize) ? requestedSize : defaultSize,
  }
}

export function pageNumbers(page: number, total: number): (number | string)[] {
  const chosen = new Set([1, total, page - 1, page, page + 1])
  if (page <= 2) chosen.add(3)
  if (page >= total - 1) chosen.add(total - 2)
  const pages = [...chosen].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const result: (number | string)[] = []
  for (const p of pages) {
    const previous = result.at(-1)
    if (typeof previous === 'number' && p - previous > 1) result.push(`gap-${p}`)
    result.push(p)
  }
  return result
}
