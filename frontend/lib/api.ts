const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://127.0.0.1:8000'

export class ApiError extends Error {
    status: number
    constructor(status: number, message: string) {
        super(message)
        this.status = status
    }
}

export function getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('musiky_token')
}

export function clearToken() {
    if (typeof window === 'undefined') return
    localStorage.removeItem('musiky_token')
}

export function apiAsset(path: string | null | undefined): string | null {
    if (!path) return null
    if (/^https?:/i.test(path)) return path
    return `${API_BASE}${path}`
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = getToken()
    const headers = new Headers(init.headers)
    if (token) headers.set('Authorization', `Bearer ${token}`)
    if (
        init.body &&
        !headers.has('Content-Type') &&
        !(init.body instanceof FormData)
    ) {
        headers.set('Content-Type', 'application/json')
    }

    const res = await fetch(`${API_BASE}${path}`, { ...init, headers })

    if (res.status === 401) {
        clearToken()
        throw new ApiError(401, 'Unauthorized')
    }
    if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new ApiError(res.status, data.detail ?? `Request failed (${res.status})`)
    }
    if (res.status === 204) return undefined as T
    return (await res.json()) as T
}
