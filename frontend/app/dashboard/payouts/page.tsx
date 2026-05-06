'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import DashboardHeader from '@/components/dashboard/DashboardHeader'
import { ApiError, apiFetch, getToken } from '@/lib/api'
import { formatMoney } from '@/lib/format'

type Plan = 'STARTER' | 'PRO' | 'TEAM'
type PayoutStatus = 'PENDING' | 'PAID'

type User = {
    id: string
    email: string
    name: string | null
    plan: Plan
}

type Project = {
    id: string
    title: string
}

type Payout = {
    id: string
    projectId: string
    revenueId: string
    userId: string
    amount: string
    status: PayoutStatus
    paidAt: string | null
}

const STATUS_FILTERS: Array<PayoutStatus | 'ALL'> = [
    'ALL',
    'PENDING',
    'PAID',
]

function formatDate(iso: string | null): string {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

function StatusPill({ status }: { status: PayoutStatus }) {
    const isPending = status === 'PENDING'
    const isPaid = status === 'PAID'
    const pillClass = isPaid
        ? 'border-emerald-500/30 text-emerald-600 bg-emerald-50/50'
        : 'border-amber-400/30 text-amber-600 bg-amber-50/50'
    return (
        <span className={`inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.2em] uppercase border px-2 py-0.5 ${pillClass}`}>
            {isPending && (
                <span className="w-1 h-1 bg-amber-500 animate-pulse-dot rounded-full" />
            )}
            {isPaid && (
                <span className="w-1 h-1 bg-emerald-500 rounded-full" />
            )}
            {status}
        </span>
    )
}

export default function PayoutsPage() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [payouts, setPayouts] = useState<Payout[]>([])
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filter, setFilter] = useState<PayoutStatus | 'ALL'>('ALL')
    const [markingId, setMarkingId] = useState<string | null>(null)
    const [actionError, setActionError] = useState<string | null>(null)

    useEffect(() => {
        if (!getToken()) {
            router.replace('/login')
            return
        }
        let cancelled = false
        ;(async () => {
            try {
                const [me, payoutsResp, projectsResp] = await Promise.all([
                    apiFetch<User>('/me'),
                    apiFetch<Payout[]>('/payouts'),
                    apiFetch<Project[]>('/projects'),
                ])
                if (cancelled) return
                setUser(me)
                setPayouts(payoutsResp)
                setProjects(projectsResp)
            } catch (err) {
                if (cancelled) return
                if (err instanceof ApiError && err.status === 401) {
                    router.replace('/login')
                    return
                }
                setError(err instanceof Error ? err.message : 'Failed to load payouts')
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [router])

    const projectMap = useMemo(() => {
        const m = new Map<string, Project>()
        projects.forEach((p) => m.set(p.id, p))
        return m
    }, [projects])

    const totals = useMemo(() => {
        const t = { all: 0, PENDING: 0, PAID: 0, FAILED: 0 }
        payouts.forEach((p) => {
            const amt = Number(p.amount)
            t.all += amt
            t[p.status] += amt
        })
        return t
    }, [payouts])

    const counts = useMemo(() => {
        const c = { ALL: payouts.length, PENDING: 0, PAID: 0, FAILED: 0 }
        payouts.forEach((p) => {
            c[p.status] += 1
        })
        return c
    }, [payouts])

    const visible = useMemo(() => {
        const list = filter === 'ALL' ? payouts : payouts.filter((p) => p.status === filter)
        // Sort: PENDING first, then most recent paid
        return [...list].sort((a, b) => {
            if (a.status !== b.status) {
                if (a.status === 'PENDING') return -1
                if (b.status === 'PENDING') return 1
            }
            const aDate = a.paidAt ? new Date(a.paidAt).getTime() : 0
            const bDate = b.paidAt ? new Date(b.paidAt).getTime() : 0
            return bDate - aDate
        })
    }, [payouts, filter])

    const visibleTotal = useMemo(
        () => visible.reduce((s, p) => s + Number(p.amount), 0),
        [visible]
    )

    const groupedByProject = useMemo(() => {
        const groups = new Map<
            string,
            { project: Project | null; pending: number; paid: number; total: number }
        >()
        payouts.forEach((p) => {
            const key = p.projectId
            const cur = groups.get(key) ?? {
                project: projectMap.get(key) ?? null,
                pending: 0,
                paid: 0,
                total: 0,
            }
            const amt = Number(p.amount)
            cur.total += amt
            if (p.status === 'PENDING') cur.pending += amt
            if (p.status === 'PAID') cur.paid += amt
            groups.set(key, cur)
        })
        return Array.from(groups.entries())
            .map(([id, v]) => ({ id, ...v }))
            .sort((a, b) => b.total - a.total)
    }, [payouts, projectMap])

    async function handleMarkPaid(payoutId: string) {
        setActionError(null)
        setMarkingId(payoutId)
        try {
            const updated = await apiFetch<Payout>(`/payouts/${payoutId}/mark-paid`, {
                method: 'POST',
            })
            setPayouts((prev) => prev.map((p) => (p.id === payoutId ? updated : p)))
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                router.replace('/login')
                return
            }
            setActionError(err instanceof Error ? err.message : 'Could not mark as paid')
        } finally {
            setMarkingId(null)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center">
                <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#1A1A1A]/55">
                    Loading payouts…
                </p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#F5F1E8]">
                <DashboardHeader user={user} />
                <main className="px-6 md:px-12 lg:px-24 pt-40 pb-24 max-w-3xl mx-auto text-center">
                    <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#1A1A1A]/85 mb-6">
                        {error}
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

            <main className="px-6 md:px-12 lg:px-24 pt-32 pb-24 max-w-6xl mx-auto">
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
                    <span className="text-[#1A1A1A]/85">Payouts</span>
                </motion.div>

                {/* Hero */}
                <section className="mb-14">
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#1A1A1A]/60 mb-4"
                    >
                        Owed to you
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
                                Money on
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
                                its way.
                            </motion.h1>
                        </div>
                    </div>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="font-mono text-[11px] tracking-wider text-[#1A1A1A]/60 mt-6 max-w-md"
                    >
                        Every payout is your slice of a recorded revenue, calculated against your
                        split % at the time the platform paid.
                    </motion.p>
                </section>

                {/* Stats strip */}
                <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.65 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-[#1A1A1A]/10 border border-[#1A1A1A]/10 mb-12"
                >
                    <div className="bg-[#F5F1E8] p-5">
                        <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-[#1A1A1A]/55 mb-3">
                            Pending
                        </p>
                        <p className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-amber-600">
                            {formatMoney(totals.PENDING)}
                        </p>
                        <p className="font-mono text-[10px] text-[#1A1A1A]/55 mt-1">
                            {counts.PENDING}{' '}
                            {counts.PENDING === 1 ? 'payout' : 'payouts'}
                        </p>
                    </div>
                    <div className="bg-[#F5F1E8] p-5">
                        <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-[#1A1A1A]/55 mb-3">
                            Paid
                        </p>
                        <p className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600">
                            {formatMoney(totals.PAID)}
                        </p>
                        <p className="font-mono text-[10px] text-[#1A1A1A]/55 mt-1">
                            {counts.PAID} {counts.PAID === 1 ? 'payout' : 'payouts'}
                        </p>
                    </div>
                    <div className="bg-[#1A1A1A] p-5">
                        <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-[#F5F1E8]/50 mb-3">
                            Lifetime
                        </p>
                        <p className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F1E8]">
                            {formatMoney(totals.all)}
                        </p>
                        <p className="font-mono text-[10px] text-[#F5F1E8]/40 mt-1">
                            {counts.ALL} entries
                        </p>
                    </div>
                    <div className="bg-[#F5F1E8] p-5">
                        <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-[#1A1A1A]/55 mb-3">
                            Projects
                        </p>
                        <p className="font-mono text-2xl sm:text-3xl font-bold tracking-tight">
                            {groupedByProject.length}
                        </p>
                        <p className="font-mono text-[10px] text-[#1A1A1A]/55 mt-1">
                            paying you
                        </p>
                    </div>
                </motion.section>

                {/* Pending vs paid bar */}
                {totals.all > 0 && (
                    <motion.section
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.7 }}
                        className="mb-14"
                    >
                        <div className="flex items-baseline justify-between mb-3">
                            <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/55">
                                Settlement
                            </p>
                            <p className="font-mono text-[10px] text-[#1A1A1A]/70">
                                {totals.all > 0
                                    ? `${Math.round((totals.PAID / totals.all) * 100)}% settled`
                                    : '0% settled'}
                            </p>
                        </div>
                        <div className="h-[6px] bg-[#1A1A1A]/[0.06] overflow-hidden flex">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                    width: `${(totals.PAID / totals.all) * 100}%`,
                                }}
                                transition={{
                                    duration: 1.2,
                                    delay: 0.75,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                className="h-full bg-emerald-500"
                            />
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                    width: `${(totals.PENDING / totals.all) * 100}%`,
                                }}
                                transition={{
                                    duration: 1.2,
                                    delay: 0.8,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                className="h-full bg-amber-400"
                            />
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
                                    {visible.length}{' '}
                                    {visible.length === 1 ? 'payout' : 'payouts'}
                                </p>
                                <h2 className="font-mono text-2xl font-bold tracking-tight">
                                    Ledger
                                </h2>
                            </div>
                        </div>

                        {/* Filter chips */}
                        <div className="flex items-center gap-1 flex-wrap mb-5">
                            {STATUS_FILTERS.map((s) => {
                                const active = filter === s
                                return (
                                    <button
                                        key={s}
                                        onClick={() => setFilter(s)}
                                        className={`font-mono text-[9px] tracking-[0.2em] uppercase px-2.5 py-1 border transition-colors ${
                                            active
                                                ? 'bg-[#1A1A1A] text-[#F5F1E8] border-[#1A1A1A]'
                                                : 'border-[#1A1A1A]/15 text-[#1A1A1A]/55 hover:text-[#1A1A1A] hover:border-[#1A1A1A]/40'
                                        }`}
                                    >
                                        {s} · {counts[s]}
                                    </button>
                                )
                            })}
                        </div>

                        {actionError && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center gap-3 px-4 py-3 border border-[#1A1A1A]/20 mb-5"
                            >
                                <div className="w-1.5 h-1.5 bg-[#8C7A6B] animate-pulse-dot rounded-full" />
                                <p className="font-mono text-[10px] tracking-wider uppercase text-[#1A1A1A]/85">
                                    {actionError}
                                </p>
                            </motion.div>
                        )}

                        {visible.length === 0 ? (
                            <div className="border border-dashed border-[#1A1A1A]/15 px-6 py-12 text-center">
                                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/55">
                                    {payouts.length === 0
                                        ? 'No payouts yet'
                                        : 'No payouts in this filter'}
                                </p>
                            </div>
                        ) : (
                            <div className="border border-[#1A1A1A]/10 divide-y divide-[#1A1A1A]/10">
                                {visible.map((p) => {
                                    const project = projectMap.get(p.projectId)
                                    const isPending = p.status === 'PENDING'
                                    return (
                                        <div
                                            key={p.id}
                                            className="px-5 py-4 flex items-center justify-between gap-4"
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <StatusPill status={p.status} />
                                                <div className="min-w-0">
                                                    {project ? (
                                                        <Link
                                                            href={`/dashboard/projects/${project.id}`}
                                                            className="font-mono text-sm font-bold text-[#1A1A1A] hover:text-[#8C7A6B] transition-colors truncate block"
                                                        >
                                                            {project.title}
                                                        </Link>
                                                    ) : (
                                                        <p className="font-mono text-sm font-bold text-[#1A1A1A]/60 truncate">
                                                            Unknown project
                                                        </p>
                                                    )}
                                                    <p className="font-mono text-[9px] text-[#1A1A1A]/45 mt-0.5">
                                                        {p.paidAt
                                                            ? `paid ${formatDate(p.paidAt)}`
                                                            : 'awaiting transfer'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 sm:gap-5 shrink-0">
                                                <p className={`font-mono text-sm font-bold ${p.status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                    {formatMoney(p.amount)}
                                                </p>
                                                {isPending && (
                                                    <button
                                                        onClick={() => handleMarkPaid(p.id)}
                                                        disabled={markingId === p.id}
                                                        className="font-mono text-[10px] tracking-[0.2em] uppercase px-3 py-2 bg-[#1A1A1A] text-[#F5F1E8] hover:bg-[#8C7A6B] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#1A1A1A]"
                                                    >
                                                        {markingId === p.id
                                                            ? '…'
                                                            : 'Mark paid'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                                <div className="flex items-center justify-between px-5 py-3 bg-[#1A1A1A]/[0.03]">
                                    <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1A1A]/55">
                                        {filter === 'ALL'
                                            ? 'Total'
                                            : `${filter} total`}
                                    </p>
                                    <p className="font-mono text-sm font-bold">
                                        {formatMoney(visibleTotal)}
                                    </p>
                                </div>
                            </div>
                        )}
                    </motion.section>

                    {/* By project */}
                    <motion.aside
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.85 }}
                        className="lg:col-span-2"
                    >
                        <div className="border border-[#1A1A1A]/10 p-6 sticky top-32">
                            <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/55 mb-2">
                                Per project
                            </p>
                            <h3 className="font-mono text-xl font-bold tracking-tight mb-6">
                                Breakdown
                            </h3>

                            {groupedByProject.length === 0 ? (
                                <p className="font-mono text-[10px] text-[#1A1A1A]/55 leading-relaxed">
                                    No projects have generated payouts for you yet.
                                </p>
                            ) : (
                                <ul className="space-y-5">
                                    {groupedByProject.map((g) => {
                                        const settled =
                                            g.total > 0 ? (g.paid / g.total) * 100 : 0
                                        return (
                                            <li key={g.id}>
                                                <div className="flex items-baseline justify-between gap-3 mb-2">
                                                    {g.project ? (
                                                        <Link
                                                            href={`/dashboard/projects/${g.project.id}`}
                                                            className="font-mono text-[11px] font-bold text-[#1A1A1A] hover:text-[#8C7A6B] transition-colors truncate"
                                                        >
                                                            {g.project.title}
                                                        </Link>
                                                    ) : (
                                                        <span className="font-mono text-[11px] font-bold text-[#1A1A1A]/60 truncate">
                                                            Unknown project
                                                        </span>
                                                    )}
                                                    <span className="font-mono text-[11px] font-bold text-[#1A1A1A] shrink-0">
                                                        {formatMoney(g.total)}
                                                    </span>
                                                </div>
                                                <div className="h-[2px] bg-[#1A1A1A]/[0.06] overflow-hidden mb-1.5">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${settled}%` }}
                                                        transition={{
                                                            duration: 1,
                                                            delay: 0.9,
                                                            ease: [0.22, 1, 0.36, 1],
                                                        }}
                                                        className="h-full bg-[#1A1A1A]"
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between gap-3 font-mono text-[9px] tracking-[0.15em] uppercase text-[#1A1A1A]/55">
                                                    <span>
                                                        {formatMoney(g.paid)} paid
                                                    </span>
                                                    <span>
                                                        {formatMoney(g.pending)} pending
                                                    </span>
                                                </div>
                                            </li>
                                        )
                                    })}
                                </ul>
                            )}
                        </div>
                    </motion.aside>
                </div>
            </main>
        </div>
    )
}
