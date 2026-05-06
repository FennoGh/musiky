export function formatMoney(amount: number | string, currency = 'USD'): string {
    const n = typeof amount === 'string' ? Number(amount) : amount
    if (!Number.isFinite(n)) return '$0.00'
    const symbol = currency === 'USD' ? '$' : ''
    return `${symbol}${n.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`
}

export function formatStreams(n: number | string): string {
    const v = typeof n === 'string' ? Number(n) : n
    if (!Number.isFinite(v)) return '0'
    return v.toLocaleString('en-US')
}

export function formatPct(p: number | string): string {
    const v = typeof p === 'string' ? Number(p) : p
    if (!Number.isFinite(v)) return '0%'
    return `${Math.round(v)}%`
}
