'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import DashboardHeader from '@/components/dashboard/DashboardHeader'
import { ApiError, apiFetch, getToken } from '@/lib/api'
import { formatMoney } from '@/lib/format'

type Plan = 'STARTER' | 'PRO' | 'TEAM'

type User = {
    id: string
    email: string
    name: string | null
    plan: Plan
}

type Project = {
    id: string
    title: string
    isOwner: boolean
}

type Platform = {
    id: string
    name: string
    slug: string
}

type Distribution = {
    id: string
    platformId: string
    status: string
}

type Revenue = {
    id: string
    projectId: string
    platformId: string
    amount: string
    currency: string
    periodStart: string
    periodEnd: string
    receivedAt: string
}

type Collaborator = {
    id: string
    userId: string | null
    userName: string | null
    userEmail: string | null
    splitPct: string
}

type ProjectPayout = {
    id: string
    projectId: string
    revenueId: string
    userId: string
    userName: string | null
    userEmail: string | null
    amount: string
    status: 'PENDING' | 'PAID'
    paidAt: string | null
}

function formatDate(iso: string): string {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

function todayIso(): string {
    return new Date().toISOString().slice(0, 10)
}

function startOfMonthIso(): string {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

export default function RevenuesPage() {
    const router = useRouter()
    const params = useParams<{ id: string }>()
    const projectId = params?.id ?? ''

    const [user, setUser] = useState<User | null>(null)
    const [project, setProject] = useState<Project | null>(null)
    const [revenues, setRevenues] = useState<Revenue[]>([])
    const [platforms, setPlatforms] = useState<Platform[]>([])
    const [distributions, setDistributions] = useState<Distribution[]>([])
    const [collaborators, setCollaborators] = useState<Collaborator[]>([])
    const [payouts, setPayouts] = useState<ProjectPayout[]>([])
    const [expandedRevenueId, setExpandedRevenueId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [platformId, setPlatformId] = useState('')
    const [amount, setAmount] = useState('')
    const [currency, setCurrency] = useState('USD')
    const [periodStart, setPeriodStart] = useState(startOfMonthIso())
    const [periodEnd, setPeriodEnd] = useState(todayIso())
    const [submitting, setSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    const [editingId, setEditingId] = useState<string | null>(null)
    const [editPlatformId, setEditPlatformId] = useState('')
    const [editAmount, setEditAmount] = useState('')
    const [editCurrency, setEditCurrency] = useState('USD')
    const [editPeriodStart, setEditPeriodStart] = useState('')
    const [editPeriodEnd, setEditPeriodEnd] = useState('')
    const [editSubmitting, setEditSubmitting] = useState(false)
    const [editError, setEditError] = useState<string | null>(null)
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [rowError, setRowError] = useState<string | null>(null)

    useEffect(() => {
        if (!getToken()) {
            router.replace('/login')
            return
        }
        if (!projectId) return
        let cancelled = false
        ;(async () => {
            try {
                const [me, prj, revs, plats, dists, cols, pays] = await Promise.all([
                    apiFetch<User>('/me'),
                    apiFetch<Project>(`/projects/${projectId}`),
                    apiFetch<Revenue[]>(`/projects/${projectId}/revenues`),
                    apiFetch<Platform[]>('/platforms'),
                    apiFetch<Distribution[]>(
                        `/projects/${projectId}/distributions`
                    ).catch(() => []),
                    apiFetch<Collaborator[]>(
                        `/projects/${projectId}/collaborators`
                    ).catch(() => []),
                    apiFetch<ProjectPayout[]>(
                        `/projects/${projectId}/payouts`
                    ).catch(() => []),
                ])
                if (cancelled) return
                setUser(me)
                setProject(prj)
                setRevenues(revs)
                setPlatforms(plats)
                setDistributions(dists)
                setCollaborators(cols)
                setPayouts(pays)
                if (dists.length > 0) {
                    setPlatformId(dists[0].platformId)
                }
            } catch (err) {
                if (cancelled) return
                if (err instanceof ApiError && err.status === 401) {
                    router.replace('/login')
                    return
                }
                setError(
                    err instanceof ApiError && err.status === 404
                        ? 'Project not found'
                        : err instanceof Error
                          ? err.message
                          : 'Failed to load'
                )
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [router, projectId])

    const platformMap = useMemo(() => {
        const m = new Map<string, Platform>()
        platforms.forEach((p) => m.set(p.id, p))
        return m
    }, [platforms])

    const distributedPlatforms = useMemo(() => {
        return distributions
            .map((d) => platformMap.get(d.platformId))
            .filter((p): p is Platform => !!p)
    }, [distributions, platformMap])

    const total = useMemo(
        () => revenues.reduce((s, r) => s + Number(r.amount), 0),
        [revenues]
    )

    const byPlatform = useMemo(() => {
        const map = new Map<string, number>()
        revenues.forEach((r) => {
            map.set(r.platformId, (map.get(r.platformId) ?? 0) + Number(r.amount))
        })
        return map
    }, [revenues])

    const topPlatform = useMemo(() => {
        let topId: string | null = null
        let topAmt = 0
        byPlatform.forEach((amt, id) => {
            if (amt > topAmt) {
                topAmt = amt
                topId = id
            }
        })
        return topId
            ? { name: platformMap.get(topId)?.name ?? 'Unknown', amt: topAmt }
            : null
    }, [byPlatform, platformMap])

    const lastPeriod = useMemo(() => {
        if (revenues.length === 0) return null
        const sorted = [...revenues].sort(
            (a, b) =>
                new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
        )
        return sorted[0]
    }, [revenues])

    const collabCount = collaborators.filter((c) => c.userId).length

    const registeredCollabs = useMemo(
        () => collaborators.filter((c) => c.userId),
        [collaborators]
    )

    const payoutsByRevenue = useMemo(() => {
        const map = new Map<string, ProjectPayout[]>()
        payouts.forEach((p) => {
            const arr = map.get(p.revenueId) ?? []
            arr.push(p)
            map.set(p.revenueId, arr)
        })
        return map
    }, [payouts])

    function recipientLabel(p: ProjectPayout): string {
        return p.userName?.trim() || p.userEmail || 'Unknown'
    }

    async function refreshPayouts() {
        try {
            const fresh = await apiFetch<ProjectPayout[]>(
                `/projects/${projectId}/payouts`
            )
            setPayouts(fresh)
        } catch {
            // non-fatal — the page still works without the breakdown
        }
    }

    function startEdit(r: Revenue) {
        setEditingId(r.id)
        setEditPlatformId(r.platformId)
        setEditAmount(String(r.amount))
        setEditCurrency(r.currency)
        setEditPeriodStart(r.periodStart.slice(0, 10))
        setEditPeriodEnd(r.periodEnd.slice(0, 10))
        setEditError(null)
        setConfirmDeleteId(null)
        setRowError(null)
    }

    function cancelEdit() {
        setEditingId(null)
        setEditError(null)
    }

    async function saveEdit(id: string) {
        const amt = Number(editAmount)
        if (!Number.isFinite(amt) || amt <= 0) {
            setEditError('Amount must be greater than 0')
            return
        }
        const cur = editCurrency.trim().toUpperCase()
        if (cur.length !== 3) {
            setEditError('Currency must be a 3-letter ISO code')
            return
        }
        if (!editPeriodStart || !editPeriodEnd) {
            setEditError('Period start and end are required')
            return
        }
        if (new Date(editPeriodStart) > new Date(editPeriodEnd)) {
            setEditError('Period start must be before end')
            return
        }
        setEditSubmitting(true)
        setEditError(null)
        try {
            const updated = await apiFetch<Revenue>(
                `/projects/${projectId}/revenues/${id}`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({
                        platformId: editPlatformId,
                        amount: amt,
                        currency: cur,
                        periodStart: new Date(editPeriodStart).toISOString(),
                        periodEnd: new Date(editPeriodEnd).toISOString(),
                    }),
                }
            )
            setRevenues((prev) => prev.map((r) => (r.id === id ? updated : r)))
            setEditingId(null)
            void refreshPayouts()
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                router.replace('/login')
                return
            }
            setEditError(err instanceof Error ? err.message : 'Could not save')
        } finally {
            setEditSubmitting(false)
        }
    }

    async function deleteRow(id: string) {
        setDeletingId(id)
        setRowError(null)
        try {
            await apiFetch<void>(`/projects/${projectId}/revenues/${id}`, {
                method: 'DELETE',
            })
            setRevenues((prev) => prev.filter((r) => r.id !== id))
            setPayouts((prev) => prev.filter((p) => p.revenueId !== id))
            setConfirmDeleteId(null)
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                router.replace('/login')
                return
            }
            setRowError(err instanceof Error ? err.message : 'Could not delete')
        } finally {
            setDeletingId(null)
        }
    }

    async function handleRecord(e: React.FormEvent) {
        e.preventDefault()
        setFormError(null)

        if (collabCount === 0) {
            setFormError('Add a registered collaborator before recording revenue')
            return
        }
        if (!platformId) {
            setFormError('Select a platform')
            return
        }
        const amt = Number(amount)
        if (!Number.isFinite(amt) || amt <= 0) {
            setFormError('Amount must be greater than 0')
            return
        }
        const cur = currency.trim().toUpperCase()
        if (cur.length !== 3) {
            setFormError('Currency must be a 3-letter ISO code')
            return
        }
        if (!periodStart || !periodEnd) {
            setFormError('Period start and end are required')
            return
        }
        if (new Date(periodStart) > new Date(periodEnd)) {
            setFormError('Period start must be before end')
            return
        }

        setSubmitting(true)
        try {
            const created = await apiFetch<Revenue>(`/projects/${projectId}/revenues`, {
                method: 'POST',
                body: JSON.stringify({
                    platformId,
                    amount: amt,
                    currency: cur,
                    periodStart: new Date(periodStart).toISOString(),
                    periodEnd: new Date(periodEnd).toISOString(),
                }),
            })
            setRevenues((prev) => [created, ...prev])
            setAmount('')
            void refreshPayouts()
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                router.replace('/login')
                return
            }
            setFormError(err instanceof Error ? err.message : 'Could not record revenue')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center">
                <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#1A1A1A]/55">
                    Loading revenues…
                </p>
            </div>
        )
    }

    if (error || !project) {
        return (
            <div className="min-h-screen bg-[#F5F1E8]">
                <DashboardHeader user={user} />
                <main className="px-6 md:px-12 lg:px-24 pt-40 pb-24 max-w-3xl mx-auto text-center">
                    <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#1A1A1A]/85 mb-6">
                        {error ?? 'Project not found'}
                    </p>
                    <Link
                        href="/dashboard"
                        className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-colors"
                    >
                        ← Back to dashboard
                    </Link>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#F5F1E8] text-[#1A1A1A]">
            <DashboardHeader user={user} />

            <main className="px-6 md:px-12 lg:px-24 pt-32 pb-24 max-w-5xl mx-auto">
                {/* Breadcrumb */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.05 }}
                    className="flex items-center gap-2 mb-10 font-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/55"
                >
                    <Link href="/dashboard" className="hover:text-[#1A1A1A] transition-colors">
                        Workspace
                    </Link>
                    <span className="text-[#1A1A1A]/30">/</span>
                    <Link
                        href={`/dashboard/projects/${projectId}`}
                        className="hover:text-[#1A1A1A] transition-colors truncate"
                    >
                        {project.title}
                    </Link>
                    <span className="text-[#1A1A1A]/30">/</span>
                    <span className="text-[#1A1A1A]/85">Revenues</span>
                </motion.div>

                {/* Hero */}
                <section className="mb-14">
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#1A1A1A]/60 mb-4"
                    >
                        Income
                    </motion.p>
                    <div>
                        <div className="overflow-hidden">
                            <motion.h1
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                transition={{
                                    duration: 1,
                                    delay: 0.2,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                className="font-serif text-5xl sm:text-6xl md:text-7xl font-normal italic leading-[1] tracking-tight text-[#1A1A1A]"
                            >
                                Money in,
                            </motion.h1>
                        </div>
                        <div className="overflow-hidden">
                            <motion.h1
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                transition={{
                                    duration: 1,
                                    delay: 0.35,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                className="font-mono text-5xl sm:text-6xl md:text-7xl font-bold leading-[1] tracking-tighter text-[#1A1A1A]"
                            >
                                split, paid out.
                            </motion.h1>
                        </div>
                    </div>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="font-mono text-[11px] tracking-wider text-[#1A1A1A]/60 mt-6 max-w-md"
                    >
                        Record royalty payments from each platform. Every entry atomically fans
                        out into one pending payout per collaborator using their split %.
                    </motion.p>
                </section>

                {/* Stats strip */}
                <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.65 }}
                    className="grid grid-cols-2 sm:grid-cols-3 gap-[1px] bg-[#1A1A1A]/10 border border-[#1A1A1A]/10 mb-10"
                >
                    <div className="col-span-2 sm:col-span-1 bg-[#1A1A1A] p-5">
                        <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-[#F5F1E8]/50 mb-3">
                            Total received
                        </p>
                        <p className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400 break-words">
                            {formatMoney(total)}
                        </p>
                    </div>
                    <div className="bg-[#F5F1E8] p-5">
                        <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-[#1A1A1A]/55 mb-3">
                            Top platform
                        </p>
                        <p className="font-mono text-base sm:text-lg font-bold tracking-tight truncate">
                            {topPlatform?.name ?? '—'}
                        </p>
                        {topPlatform && (
                            <p className="font-mono text-[10px] text-[#1A1A1A]/55 mt-1">
                                {formatMoney(topPlatform.amt)}
                            </p>
                        )}
                    </div>
                    <div className="bg-[#F5F1E8] p-5">
                        <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-[#1A1A1A]/55 mb-3">
                            Last period
                        </p>
                        <p className="font-mono text-base sm:text-lg font-bold tracking-tight">
                            {lastPeriod ? formatMoney(lastPeriod.amount) : '—'}
                        </p>
                        {lastPeriod && (
                            <p className="font-mono text-[10px] text-[#1A1A1A]/55 mt-1 truncate">
                                {formatDate(lastPeriod.receivedAt)}
                            </p>
                        )}
                    </div>
                </motion.section>

                {/* Platform breakdown bar */}
                {total > 0 && byPlatform.size > 0 && (
                    <motion.section
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.7 }}
                        className="mb-12"
                    >
                        <div className="flex items-baseline justify-between mb-3">
                            <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/55">
                                By platform
                            </p>
                            <p className="font-mono text-[10px] text-[#1A1A1A]/55">
                                {byPlatform.size} active{' '}
                                {byPlatform.size === 1 ? 'source' : 'sources'}
                            </p>
                        </div>
                        <div className="h-[6px] bg-[#1A1A1A]/[0.06] overflow-hidden flex mb-4">
                            {Array.from(byPlatform.entries()).map(([id, amt], i) => {
                                const pct = (amt / total) * 100
                                return (
                                    <motion.div
                                        key={id}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        transition={{
                                            duration: 1,
                                            delay: 0.75 + i * 0.05,
                                            ease: [0.22, 1, 0.36, 1],
                                        }}
                                        className={i % 2 === 0 ? 'bg-[#1A1A1A]' : 'bg-[#8C7A6B]'}
                                    />
                                )
                            })}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {Array.from(byPlatform.entries())
                                .sort((a, b) => b[1] - a[1])
                                .map(([id, amt]) => (
                                    <div
                                        key={id}
                                        className="flex items-baseline justify-between gap-3"
                                    >
                                        <span className="font-mono text-[10px] text-[#1A1A1A]/70 truncate">
                                            {platformMap.get(id)?.name ?? 'Unknown'}
                                        </span>
                                        <span className="font-mono text-[10px] font-bold text-[#1A1A1A] shrink-0">
                                            {formatMoney(amt)}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    </motion.section>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                    {/* Ledger */}
                    <motion.section
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.75 }}
                        className="lg:col-span-3"
                    >
                        <div className="flex items-end justify-between mb-6 pb-4 border-b border-[#1A1A1A]/10">
                            <div>
                                <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/55 mb-2">
                                    {revenues.length}{' '}
                                    {revenues.length === 1 ? 'entry' : 'entries'}
                                </p>
                                <h2 className="font-mono text-2xl font-bold tracking-tight">
                                    Ledger
                                </h2>
                            </div>
                        </div>

                        {revenues.length === 0 ? (
                            <div className="border border-dashed border-[#1A1A1A]/15 px-6 py-12 text-center">
                                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/55">
                                    No revenue recorded yet
                                </p>
                            </div>
                        ) : (
                            <div className="border border-[#1A1A1A]/10 divide-y divide-[#1A1A1A]/10">
                                {revenues.map((r) => {
                                    const platform = platformMap.get(r.platformId)
                                    const isEditing = editingId === r.id
                                    const isConfirmingDelete = confirmDeleteId === r.id

                                    if (isEditing) {
                                        return (
                                            <div
                                                key={r.id}
                                                className="px-5 py-4 bg-[#1A1A1A]/[0.02] space-y-3"
                                            >
                                                <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/55">
                                                    Edit entry
                                                </p>
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <select
                                                        value={editPlatformId}
                                                        onChange={(e) => setEditPlatformId(e.target.value)}
                                                        disabled={editSubmitting}
                                                        className="bg-transparent border-b border-[#1A1A1A]/30 focus:border-[#1A1A1A] outline-none py-1 font-mono text-xs text-[#1A1A1A] transition-colors disabled:opacity-50 appearance-none cursor-pointer"
                                                    >
                                                        {distributedPlatforms.map((p) => (
                                                            <option key={p.id} value={p.id}>
                                                                {p.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        step={0.01}
                                                        value={editAmount}
                                                        onChange={(e) => setEditAmount(e.target.value)}
                                                        disabled={editSubmitting}
                                                        className="w-28 bg-transparent border-b border-[#1A1A1A]/30 focus:border-[#1A1A1A] outline-none py-1 font-mono text-sm font-bold text-[#1A1A1A] transition-colors disabled:opacity-50"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={editCurrency}
                                                        onChange={(e) =>
                                                            setEditCurrency(e.target.value.toUpperCase())
                                                        }
                                                        disabled={editSubmitting}
                                                        maxLength={3}
                                                        className="w-12 bg-transparent border-b border-[#1A1A1A]/30 focus:border-[#1A1A1A] outline-none py-1 font-mono text-sm font-bold text-[#1A1A1A] uppercase transition-colors disabled:opacity-50"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <input
                                                        type="date"
                                                        value={editPeriodStart}
                                                        onChange={(e) => setEditPeriodStart(e.target.value)}
                                                        disabled={editSubmitting}
                                                        className="bg-transparent border-b border-[#1A1A1A]/30 focus:border-[#1A1A1A] outline-none py-1 font-mono text-xs text-[#1A1A1A] transition-colors disabled:opacity-50"
                                                    />
                                                    <span className="font-mono text-[10px] text-[#1A1A1A]/40">→</span>
                                                    <input
                                                        type="date"
                                                        value={editPeriodEnd}
                                                        onChange={(e) => setEditPeriodEnd(e.target.value)}
                                                        disabled={editSubmitting}
                                                        className="bg-transparent border-b border-[#1A1A1A]/30 focus:border-[#1A1A1A] outline-none py-1 font-mono text-xs text-[#1A1A1A] transition-colors disabled:opacity-50"
                                                    />
                                                </div>
                                                <p className="font-mono text-[9px] tracking-wider text-[#1A1A1A]/55 leading-relaxed">
                                                    Changing the amount rebuilds all PENDING payouts. Blocked if any payout is already PAID.
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => saveEdit(r.id)}
                                                        disabled={editSubmitting}
                                                        className="font-mono text-[10px] tracking-[0.2em] uppercase px-3 py-1 bg-[#1A1A1A] text-[#F5F1E8] hover:bg-[#8C7A6B] transition-colors disabled:opacity-40"
                                                    >
                                                        {editSubmitting ? '…' : 'Save'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={cancelEdit}
                                                        disabled={editSubmitting}
                                                        className="font-mono text-[10px] tracking-[0.2em] uppercase px-3 py-1 border border-[#1A1A1A]/30 hover:bg-[#1A1A1A] hover:text-[#F5F1E8] transition-colors disabled:opacity-40"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                                {editError && (
                                                    <p className="font-mono text-[9px] tracking-wider uppercase text-[#8C7A6B]">
                                                        {editError}
                                                    </p>
                                                )}
                                            </div>
                                        )
                                    }

                                    const rowPayouts = payoutsByRevenue.get(r.id) ?? []
                                    const isExpanded = expandedRevenueId === r.id

                                    return (
                                        <div key={r.id}>
                                            <div className="px-5 py-4 flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setExpandedRevenueId(
                                                                isExpanded ? null : r.id
                                                            )
                                                        }
                                                        aria-label={
                                                            isExpanded
                                                                ? 'Hide payouts'
                                                                : 'Show payouts'
                                                        }
                                                        disabled={rowPayouts.length === 0}
                                                        className={`font-mono text-[10px] leading-none w-5 h-5 border flex items-center justify-center transition-colors shrink-0 ${
                                                            rowPayouts.length === 0
                                                                ? 'border-[#1A1A1A]/10 text-[#1A1A1A]/20 cursor-not-allowed'
                                                                : isExpanded
                                                                  ? 'bg-[#1A1A1A] text-[#F5F1E8] border-[#1A1A1A]'
                                                                  : 'border-[#1A1A1A]/25 text-[#1A1A1A]/55 hover:border-[#1A1A1A] hover:text-[#1A1A1A]'
                                                        }`}
                                                    >
                                                        {isExpanded ? '▾' : '▸'}
                                                    </button>
                                                    <div className="min-w-0">
                                                        <p className="font-mono text-sm font-bold truncate">
                                                            {platform?.name ?? 'Unknown'}
                                                        </p>
                                                        <p className="font-mono text-[10px] text-[#1A1A1A]/55 mt-0.5 truncate">
                                                            {formatDate(r.periodStart)} →{' '}
                                                            {formatDate(r.periodEnd)}
                                                            {rowPayouts.length > 0 && (
                                                                <span className="ml-2 text-[#1A1A1A]/40">
                                                                    · {rowPayouts.length}{' '}
                                                                    {rowPayouts.length === 1
                                                                        ? 'transfer'
                                                                        : 'transfers'}
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                                                    <p className="font-mono text-sm font-bold text-emerald-600">
                                                        +{formatMoney(r.amount, r.currency)}
                                                    </p>
                                                    {project.isOwner && (
                                                        isConfirmingDelete ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => deleteRow(r.id)}
                                                                    disabled={deletingId === r.id}
                                                                    className="font-mono text-[9px] tracking-[0.2em] uppercase px-2 py-1 bg-[#8C7A6B] text-[#F5F1E8] hover:bg-[#1A1A1A] transition-colors disabled:opacity-40"
                                                                >
                                                                    {deletingId === r.id ? '…' : 'Confirm'}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setConfirmDeleteId(null)
                                                                        setRowError(null)
                                                                    }}
                                                                    disabled={deletingId === r.id}
                                                                    className="font-mono text-[9px] tracking-[0.2em] uppercase px-2 py-1 border border-[#1A1A1A]/20 text-[#1A1A1A]/55 hover:text-[#1A1A1A] hover:border-[#1A1A1A]/40 transition-colors"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => startEdit(r)}
                                                                    aria-label="Edit"
                                                                    className="font-mono text-[9px] tracking-[0.2em] uppercase px-2 py-1 border border-[#1A1A1A]/15 text-[#1A1A1A]/55 hover:text-[#1A1A1A] hover:border-[#1A1A1A]/40 transition-colors"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setConfirmDeleteId(r.id)
                                                                        setRowError(null)
                                                                    }}
                                                                    aria-label="Delete"
                                                                    className="font-mono text-[10px] leading-none px-2 py-1 border border-[#1A1A1A]/15 text-[#1A1A1A]/55 hover:text-[#8C7A6B] hover:border-[#8C7A6B]/50 transition-colors"
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                            {isExpanded && rowPayouts.length > 0 && (
                                                <div className="px-5 pb-4 -mt-1 bg-[#1A1A1A]/[0.02]">
                                                    <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/55 pt-3 pb-2">
                                                        {project.isOwner
                                                            ? 'Owner pays out to'
                                                            : 'Splits'}
                                                    </p>
                                                    <ul className="divide-y divide-[#1A1A1A]/10 border-t border-[#1A1A1A]/10">
                                                        {rowPayouts.map((p) => {
                                                            const isPaid = p.status === 'PAID'
                                                            return (
                                                                <li
                                                                    key={p.id}
                                                                    className="flex items-center justify-between gap-4 py-2"
                                                                >
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <span
                                                                            className={`inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.2em] uppercase border px-2 py-0.5 shrink-0 ${
                                                                                isPaid
                                                                                    ? 'border-emerald-500/30 text-emerald-600 bg-emerald-50/50'
                                                                                    : 'border-amber-400/30 text-amber-600 bg-amber-50/50'
                                                                            }`}
                                                                        >
                                                                            <span
                                                                                className={`w-1 h-1 rounded-full ${
                                                                                    isPaid
                                                                                        ? 'bg-emerald-500'
                                                                                        : 'bg-amber-500 animate-pulse-dot'
                                                                                }`}
                                                                            />
                                                                            {p.status}
                                                                        </span>
                                                                        <div className="min-w-0">
                                                                            <p className="font-mono text-[12px] font-bold text-[#1A1A1A] truncate">
                                                                                {recipientLabel(p)}
                                                                                {p.userId === user?.id && (
                                                                                    <span className="ml-2 font-normal text-[#1A1A1A]/40">
                                                                                        (you)
                                                                                    </span>
                                                                                )}
                                                                            </p>
                                                                            {p.userName && p.userEmail && (
                                                                                <p className="font-mono text-[9px] text-[#1A1A1A]/45 truncate">
                                                                                    {p.userEmail}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <p
                                                                        className={`font-mono text-[12px] font-bold shrink-0 ${
                                                                            isPaid
                                                                                ? 'text-emerald-600'
                                                                                : 'text-amber-600'
                                                                        }`}
                                                                    >
                                                                        {formatMoney(p.amount, r.currency)}
                                                                    </p>
                                                                </li>
                                                            )
                                                        })}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                                {rowError && (
                                    <div className="flex items-center gap-3 px-5 py-3 bg-[#8C7A6B]/[0.06]">
                                        <div className="w-1 h-1 bg-[#8C7A6B] animate-pulse-dot rounded-full" />
                                        <p className="font-mono text-[9px] tracking-wider uppercase text-[#1A1A1A]/85">
                                            {rowError}
                                        </p>
                                    </div>
                                )}
                                <div className="flex items-center justify-between px-5 py-3 bg-[#1A1A1A]/[0.03]">
                                    <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1A1A]/55">
                                        Total
                                    </p>
                                    <p className="font-mono text-sm font-bold text-emerald-600">
                                        {formatMoney(total)}
                                    </p>
                                </div>
                            </div>
                        )}
                    </motion.section>

                    {/* Record form (owner only) */}
                    <motion.section
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.85 }}
                        className="lg:col-span-2"
                    >
                        {!project.isOwner ? (
                            <div className="border border-dashed border-[#8C7A6B]/40 p-6 sticky top-32 text-center">
                                <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#8C7A6B] mb-2">
                                    View only
                                </p>
                                <p className="font-mono text-[11px] text-[#1A1A1A]/60 leading-relaxed">
                                    Only the project owner can record revenue.
                                </p>
                            </div>
                        ) : (
                        <div className="border border-[#1A1A1A]/10 p-6 sticky top-32">
                            <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/55 mb-2">
                                New entry
                            </p>
                            <h3 className="font-mono text-xl font-bold tracking-tight mb-6">
                                Record revenue
                            </h3>

                            <form onSubmit={handleRecord} className="space-y-6">
                                <div>
                                    <label
                                        htmlFor="platform"
                                        className="block font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/70 mb-2"
                                    >
                                        Platform
                                    </label>
                                    <select
                                        id="platform"
                                        value={platformId}
                                        onChange={(e) => setPlatformId(e.target.value)}
                                        disabled={submitting || distributedPlatforms.length === 0}
                                        className="w-full bg-transparent border-b border-[#1A1A1A]/20 focus:border-[#1A1A1A] outline-none py-2 font-mono text-sm text-[#1A1A1A] transition-colors disabled:opacity-50 appearance-none cursor-pointer"
                                    >
                                        {distributedPlatforms.length === 0 ? (
                                            <option value="">No distributed platforms</option>
                                        ) : (
                                            <>
                                                {!platformId && (
                                                    <option value="">Select platform</option>
                                                )}
                                                {distributedPlatforms.map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.name}
                                                    </option>
                                                ))}
                                            </>
                                        )}
                                    </select>
                                    {distributedPlatforms.length === 0 && (
                                        <p className="font-mono text-[9px] text-[#1A1A1A]/55 mt-2 leading-relaxed">
                                            Distribute the project to a platform first.
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-2">
                                        <label
                                            htmlFor="amount"
                                            className="block font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/70 mb-2"
                                        >
                                            Amount
                                        </label>
                                        <input
                                            id="amount"
                                            type="number"
                                            min={0}
                                            step={0.01}
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            disabled={submitting}
                                            placeholder="280.45"
                                            className="w-full bg-transparent border-b border-[#1A1A1A]/20 focus:border-[#1A1A1A] outline-none py-2 font-mono text-2xl font-bold text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 transition-colors disabled:opacity-50"
                                        />
                                    </div>
                                    <div>
                                        <label
                                            htmlFor="currency"
                                            className="block font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/70 mb-2"
                                        >
                                            Cur.
                                        </label>
                                        <input
                                            id="currency"
                                            type="text"
                                            value={currency}
                                            onChange={(e) =>
                                                setCurrency(e.target.value.toUpperCase())
                                            }
                                            disabled={submitting}
                                            maxLength={3}
                                            className="w-full bg-transparent border-b border-[#1A1A1A]/20 focus:border-[#1A1A1A] outline-none py-2 font-mono text-2xl font-bold text-[#1A1A1A] uppercase tracking-tight transition-colors disabled:opacity-50"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label
                                            htmlFor="start"
                                            className="block font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/70 mb-2"
                                        >
                                            Period start
                                        </label>
                                        <input
                                            id="start"
                                            type="date"
                                            value={periodStart}
                                            onChange={(e) => setPeriodStart(e.target.value)}
                                            disabled={submitting}
                                            className="w-full bg-transparent border-b border-[#1A1A1A]/20 focus:border-[#1A1A1A] outline-none py-2 font-mono text-sm text-[#1A1A1A] transition-colors disabled:opacity-50"
                                        />
                                    </div>
                                    <div>
                                        <label
                                            htmlFor="end"
                                            className="block font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/70 mb-2"
                                        >
                                            Period end
                                        </label>
                                        <input
                                            id="end"
                                            type="date"
                                            value={periodEnd}
                                            onChange={(e) => setPeriodEnd(e.target.value)}
                                            disabled={submitting}
                                            className="w-full bg-transparent border-b border-[#1A1A1A]/20 focus:border-[#1A1A1A] outline-none py-2 font-mono text-sm text-[#1A1A1A] transition-colors disabled:opacity-50"
                                        />
                                    </div>
                                </div>

                                <div className="border-l-2 border-[#1A1A1A]/15 pl-4 py-1">
                                    <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1A1A]/55 mb-2">
                                        Auto fan-out → {collabCount}{' '}
                                        {collabCount === 1 ? 'transfer' : 'transfers'}
                                    </p>
                                    {registeredCollabs.length === 0 ? (
                                        <p className="font-mono text-[10px] text-[#1A1A1A]/65 leading-relaxed">
                                            Add a registered collaborator to enable payouts.
                                        </p>
                                    ) : (
                                        <ul className="space-y-1">
                                            {registeredCollabs.map((c) => {
                                                const pct = Number(c.splitPct)
                                                const preview =
                                                    Number(amount) > 0
                                                        ? formatMoney(
                                                              (Number(amount) * pct) / 100
                                                          )
                                                        : null
                                                return (
                                                    <li
                                                        key={c.id}
                                                        className="flex items-baseline justify-between gap-3 font-mono text-[10px]"
                                                    >
                                                        <span className="text-[#1A1A1A]/85 truncate">
                                                            {c.userName?.trim() ||
                                                                c.userEmail ||
                                                                'Unknown'}
                                                            <span className="text-[#1A1A1A]/40 ml-1">
                                                                · {pct.toFixed(0)}%
                                                            </span>
                                                        </span>
                                                        <span className="text-[#1A1A1A]/55 shrink-0">
                                                            {preview ?? '—'}
                                                        </span>
                                                    </li>
                                                )
                                            })}
                                        </ul>
                                    )}
                                </div>

                                {formError && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex items-center gap-3 px-3 py-2.5 border border-[#1A1A1A]/20"
                                    >
                                        <div className="w-1 h-1 bg-[#8C7A6B] animate-pulse-dot rounded-full" />
                                        <p className="font-mono text-[9px] tracking-wider uppercase text-[#1A1A1A]/85">
                                            {formError}
                                        </p>
                                    </motion.div>
                                )}

                                <button
                                    type="submit"
                                    disabled={
                                        submitting ||
                                        distributedPlatforms.length === 0 ||
                                        !amount
                                    }
                                    className="w-full font-mono text-[10px] tracking-[0.2em] uppercase px-4 py-3 bg-[#1A1A1A] text-[#F5F1E8] hover:bg-[#8C7A6B] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#1A1A1A]"
                                >
                                    {submitting ? 'Recording…' : 'Record revenue →'}
                                </button>
                            </form>
                        </div>
                        )}
                    </motion.section>
                </div>
            </main>
        </div>
    )
}
