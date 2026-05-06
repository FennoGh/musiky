'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import DashboardHeader from '@/components/dashboard/DashboardHeader'
import { ApiError, apiAsset, apiFetch, getToken } from '@/lib/api'
import { formatMoney, formatPct, formatStreams } from '@/lib/format'

type Plan = 'STARTER' | 'PRO' | 'TEAM'
type ProjectStatus = 'DRAFT' | 'READY' | 'LIVE' | 'ARCHIVED'
type PayoutStatus = 'PENDING' | 'PAID'

type User = {
    id: string
    email: string
    name: string | null
    plan: Plan
}

type CollabRole =
    | 'OWNER'
    | 'PRODUCER'
    | 'COMPOSER'
    | 'VOCALIST'
    | 'MANAGER'
    | 'ARTIST'
    | 'OTHER'

type Project = {
    id: string
    title: string
    status: ProjectStatus
    coverUrl: string | null
    createdAt: string
    ownerId: string
    isOwner: boolean
    role: CollabRole | null
    mySplitPct: string | null
}

type ProjectSummary = {
    projectId: string
    title: string
    totalStreams: number
    totalRevenue: string
    totalExpenses: string
    breakEvenPct: string
}

type Payout = {
    id: string
    projectId: string
    amount: string
    status: PayoutStatus
    paidAt: string | null
}

type ProjectCard = Project & { summary: ProjectSummary | null }

function StatusPill({ status }: { status: ProjectStatus }) {
    const live = status === 'LIVE'
    const archived = status === 'ARCHIVED'
    return (
        <span
            className={`inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.2em] uppercase border px-2 py-0.5 ${
                live
                    ? 'border-emerald-500/30 text-emerald-600 bg-emerald-50/50'
                    : archived
                      ? 'border-[#1A1A1A]/10 text-[#1A1A1A]/40'
                      : 'border-[#1A1A1A]/20 text-[#1A1A1A]/80'
            }`}
        >
            {live && <span className="w-1 h-1 bg-emerald-500 animate-pulse-dot rounded-full" />}
            {status}
        </span>
    )
}

function useCounter(target: number, ms = 1200) {
    const [value, setValue] = useState(0)
    useEffect(() => {
        if (!Number.isFinite(target) || target === 0) {
            setValue(0)
            return
        }
        const steps = 40
        const step = target / steps
        const interval = ms / steps
        let i = 0
        const id = setInterval(() => {
            i += 1
            if (i >= steps) {
                setValue(target)
                clearInterval(id)
            } else {
                setValue(step * i)
            }
        }, interval)
        return () => clearInterval(id)
    }, [target, ms])
    return value
}

function KpiBox({
    label,
    value,
    delay,
    variant = 'default',
}: {
    label: string
    value: string
    delay: number
    variant?: 'default' | 'dark' | 'green' | 'amber'
}) {
    const styles = {
        default: 'bg-[#F5F1E8]',
        dark: 'bg-[#1A1A1A]',
        green: 'bg-[#F5F1E8]',
        amber: 'bg-[#F5F1E8]',
    }
    const labelStyles = {
        default: 'text-[#1A1A1A]/55',
        dark: 'text-[#F5F1E8]/50',
        green: 'text-[#1A1A1A]/55',
        amber: 'text-[#1A1A1A]/55',
    }
    const valueStyles = {
        default: 'text-[#1A1A1A]',
        dark: 'text-[#F5F1E8]',
        green: 'text-emerald-600',
        amber: 'text-amber-600',
    }
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay }}
            className={`${styles[variant]} p-5 sm:p-6`}
        >
            <p className={`font-mono text-[9px] tracking-[0.25em] uppercase ${labelStyles[variant]} mb-3`}>
                {label}
            </p>
            <p className={`font-mono text-2xl sm:text-3xl font-bold ${valueStyles[variant]} tracking-tight`}>
                {value}
            </p>
        </motion.div>
    )
}

export default function DashboardPage() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [cards, setCards] = useState<ProjectCard[]>([])
    const [payouts, setPayouts] = useState<Payout[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!getToken()) {
            router.replace('/login')
            return
        }
        let cancelled = false
        ;(async () => {
            try {
                const [me, projects, allPayouts] = await Promise.all([
                    apiFetch<User>('/me'),
                    apiFetch<Project[]>('/projects'),
                    apiFetch<Payout[]>('/payouts'),
                ])
                const summaries = await Promise.all(
                    projects.map((p) =>
                        apiFetch<ProjectSummary>(`/projects/${p.id}/summary`).catch(() => null)
                    )
                )
                if (cancelled) return
                setUser(me)
                setCards(projects.map((p, i) => ({ ...p, summary: summaries[i] })))
                setPayouts(allPayouts)
            } catch (err) {
                if (cancelled) return
                if (err instanceof ApiError && err.status === 401) {
                    router.replace('/login')
                    return
                }
                setError(err instanceof Error ? err.message : 'Failed to load dashboard')
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [router])

    const aggregates = useMemo(() => {
        const totalStreams = cards.reduce((sum, c) => sum + (c.summary?.totalStreams ?? 0), 0)
        // Weight project revenue by the user's split so the overview reflects
        // their own benefit (or 0% share) on collaborated projects.
        const myRevenue = cards.reduce((sum, c) => {
            const rev = Number(c.summary?.totalRevenue ?? 0)
            const pct = Number(c.mySplitPct ?? 0)
            return sum + rev * (pct / 100)
        }, 0)
        const pendingPayouts = payouts
            .filter((p) => p.status === 'PENDING')
            .reduce((sum, p) => sum + Number(p.amount), 0)
        const pendingCount = payouts.filter((p) => p.status === 'PENDING').length
        return { totalStreams, totalRevenue: myRevenue, pendingPayouts, pendingCount }
    }, [cards, payouts])

    const animatedStreams = useCounter(aggregates.totalStreams)
    const animatedRevenue = useCounter(aggregates.totalRevenue)
    const animatedProjects = useCounter(cards.length)
    const animatedPending = useCounter(aggregates.pendingPayouts)

    async function handleMarkPaid(payoutId: string) {
        try {
            const updated = await apiFetch<Payout>(`/payouts/${payoutId}/mark-paid`, {
                method: 'POST',
            })
            setPayouts((prev) => prev.map((p) => (p.id === payoutId ? updated : p)))
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not mark as paid')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#1A1A1A]/55">
                    Loading workspace…
                </p>
            </div>
        )
    }

    if (error && !user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#1A1A1A]/85">
                    {error}
                </p>
                <button
                    onClick={() => router.replace('/login')}
                    className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-colors"
                >
                    ← Back to sign in
                </button>
            </div>
        )
    }

    const displayName = user?.name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'there'
    const pendingPayouts = payouts.filter((p) => p.status === 'PENDING')

    return (
        <div className="min-h-screen bg-[#F5F1E8] text-[#1A1A1A]">
            <DashboardHeader user={user} />

            <main className="px-6 md:px-12 lg:px-24 pt-32 pb-24 max-w-7xl mx-auto">
                {/* Hero greeting */}
                <section className="mb-16">
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#1A1A1A]/60 mb-4"
                    >
                        Welcome back
                    </motion.p>
                    <div>
                        <div className="overflow-hidden">
                            <motion.h1
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                className="font-serif text-5xl sm:text-6xl md:text-7xl font-normal italic leading-[1] tracking-tight text-[#1A1A1A]"
                            >
                                Hello,
                            </motion.h1>
                        </div>
                        <div className="overflow-hidden">
                            <motion.h1
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                transition={{ duration: 1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                className="font-mono text-5xl sm:text-6xl md:text-7xl font-bold leading-[1] tracking-tighter text-[#1A1A1A]"
                            >
                                {displayName}.
                            </motion.h1>
                        </div>
                    </div>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="font-mono text-[11px] tracking-wider text-[#1A1A1A]/60 mt-6"
                    >
                        {cards.length} {cards.length === 1 ? 'project' : 'projects'} ·{' '}
                        {aggregates.pendingCount} pending{' '}
                        {aggregates.pendingCount === 1 ? 'payout' : 'payouts'} ·{' '}
                        {user?.plan.toLowerCase() ?? 'starter'} plan
                    </motion.p>
                </section>

                {/* KPI grid */}
                <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-[#1A1A1A]/10 border border-[#1A1A1A]/10 mb-16"
                >
                    <KpiBox
                        label="Active projects"
                        value={Math.round(animatedProjects).toString()}
                        delay={0.75}
                        variant="dark"
                    />
                    <KpiBox
                        label="Total streams"
                        value={formatStreams(Math.round(animatedStreams))}
                        delay={0.8}
                    />
                    <KpiBox
                        label="Total revenue"
                        value={formatMoney(animatedRevenue)}
                        delay={0.85}
                        variant="green"
                    />
                    <KpiBox
                        label="Pending payouts"
                        value={formatMoney(animatedPending)}
                        delay={0.9}
                        variant="amber"
                    />
                </motion.section>

                {/* Projects */}
                <section className="mb-16">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.9 }}
                        className="flex items-end justify-between mb-6 pb-4 border-b border-[#1A1A1A]/10"
                    >
                        <div>
                            <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/55 mb-2">
                                Your work
                            </p>
                            <h2 className="font-mono text-2xl font-bold tracking-tight">
                                Projects
                            </h2>
                        </div>
                        <Link
                            href="/dashboard/projects/new"
                            className="font-mono text-[10px] tracking-[0.2em] uppercase px-4 py-2.5 bg-[#1A1A1A] text-[#F5F1E8] hover:bg-[#8C7A6B] transition-colors"
                        >
                            + New project
                        </Link>
                    </motion.div>

                    {cards.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 1 }}
                            className="border border-dashed border-[#1A1A1A]/15 py-20 px-6 flex flex-col items-center justify-center text-center"
                        >
                            <div className="overflow-hidden">
                                <motion.h3
                                    initial={{ y: '100%' }}
                                    animate={{ y: 0 }}
                                    transition={{
                                        duration: 1,
                                        delay: 1.05,
                                        ease: [0.22, 1, 0.36, 1],
                                    }}
                                    className="font-serif text-5xl italic font-normal leading-[1] tracking-tight text-[#1A1A1A]/70"
                                >
                                    Nothing here
                                </motion.h3>
                            </div>
                            <div className="overflow-hidden">
                                <motion.h3
                                    initial={{ y: '100%' }}
                                    animate={{ y: 0 }}
                                    transition={{
                                        duration: 1,
                                        delay: 1.15,
                                        ease: [0.22, 1, 0.36, 1],
                                    }}
                                    className="font-mono text-5xl font-bold leading-[1] tracking-tighter text-[#1A1A1A] mt-1"
                                >
                                    yet.
                                </motion.h3>
                            </div>
                            <p className="font-mono text-[11px] tracking-wider text-[#1A1A1A]/60 mt-6 max-w-xs">
                                Spin up your first project and invite collaborators to start
                                splitting royalties automatically.
                            </p>
                            <Link
                                href="/dashboard/projects/new"
                                className="mt-8 font-mono text-[11px] tracking-[0.2em] uppercase px-6 py-3 bg-[#1A1A1A] text-[#F5F1E8] hover:bg-[#8C7A6B] transition-colors"
                            >
                                + New project
                            </Link>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {cards.map((card, i) => {
                                const breakEven = Number(card.summary?.breakEvenPct ?? 0)
                                const streams = card.summary?.totalStreams ?? 0
                                const totalRevenue = Number(card.summary?.totalRevenue ?? 0)
                                const splitPct = Number(card.mySplitPct ?? 0)
                                const myRevenue = totalRevenue * (splitPct / 100)
                                return (
                                    <motion.div
                                        key={card.id}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, delay: 1 + i * 0.05 }}
                                    >
                                        <Link
                                            href={`/dashboard/projects/${card.id}`}
                                            className="block border border-[#1A1A1A]/10 p-5 bg-[#F5F1E8] hover:shadow-[6px_6px_0px_0px_#8C7A6B] hover:border-[#1A1A1A] hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all duration-200"
                                        >
                                            <div className="aspect-video bg-[#1A1A1A]/[0.06] overflow-hidden mb-4 flex items-center justify-center">
                                                {card.coverUrl ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={apiAsset(card.coverUrl) ?? ''}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="font-mono text-3xl font-bold text-[#1A1A1A]/30">
                                                        {card.title.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <h3 className="font-mono text-base font-bold tracking-tight text-[#1A1A1A] line-clamp-2">
                                                    {card.title}
                                                </h3>
                                                <StatusPill status={card.status} />
                                            </div>
                                            <div className="flex items-center gap-2 mb-5">
                                                <span className="font-mono text-[8px] tracking-[0.2em] uppercase text-[#1A1A1A]/55 border border-[#1A1A1A]/15 px-1.5 py-0.5">
                                                    {card.isOwner ? 'Owner' : (card.role ?? 'Member')}
                                                </span>
                                                <span className="font-mono text-[9px] text-[#1A1A1A]/55">
                                                    {splitPct.toFixed(0)}% share
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-3 gap-3 mb-5">
                                                <div>
                                                    <p className="font-mono text-[8px] tracking-[0.2em] uppercase text-[#1A1A1A]/50 mb-1">
                                                        Streams
                                                    </p>
                                                    <p className="font-mono text-sm font-bold text-[#1A1A1A]">
                                                        {formatStreams(streams)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="font-mono text-[8px] tracking-[0.2em] uppercase text-[#1A1A1A]/50 mb-1">
                                                        Your share
                                                    </p>
                                                    <p className="font-mono text-sm font-bold text-emerald-600">
                                                        {formatMoney(myRevenue)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="font-mono text-[8px] tracking-[0.2em] uppercase text-[#1A1A1A]/50 mb-1">
                                                        Break-even
                                                    </p>
                                                    <p className="font-mono text-sm font-bold text-[#1A1A1A]">
                                                        {formatPct(breakEven)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between mb-1.5">
                                                <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1A1A]/50">
                                                    Recovery
                                                </p>
                                                <p className="font-mono text-[9px] text-[#1A1A1A]/70">
                                                    {formatPct(breakEven)} recovered
                                                </p>
                                            </div>
                                            <div className="h-[3px] bg-[#1A1A1A]/[0.06] overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{
                                                        width: `${Math.min(breakEven, 100)}%`,
                                                    }}
                                                    transition={{
                                                        duration: 1.2,
                                                        delay: 1.1 + i * 0.05,
                                                        ease: [0.22, 1, 0.36, 1],
                                                    }}
                                                    className="h-full bg-[#1A1A1A]"
                                                />
                                            </div>
                                        </Link>
                                    </motion.div>
                                )
                            })}
                        </div>
                    )}
                </section>

                {/* Pending payouts strip */}
                {pendingPayouts.length > 0 && (
                    <motion.section
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 1.1 }}
                    >
                        <div className="flex items-end justify-between mb-6 pb-4 border-b border-[#1A1A1A]/10">
                            <div>
                                <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/55 mb-2">
                                    Owed to you
                                </p>
                                <h2 className="font-mono text-2xl font-bold tracking-tight">
                                    Pending payouts
                                </h2>
                            </div>
                            <p className="font-mono text-[10px] tracking-wider text-[#1A1A1A]/55">
                                {pendingPayouts.length}{' '}
                                {pendingPayouts.length === 1 ? 'payout' : 'payouts'}
                            </p>
                        </div>

                        <div className="border border-[#1A1A1A]/10 divide-y divide-[#1A1A1A]/10">
                            {pendingPayouts.map((payout) => {
                                const project = cards.find((c) => c.id === payout.projectId)
                                return (
                                    <div
                                        key={payout.id}
                                        className="flex items-center justify-between gap-4 px-5 py-4 bg-[#F5F1E8]"
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-1.5 h-1.5 bg-amber-500 animate-pulse-dot rounded-full shrink-0" />
                                            <p className="font-mono text-sm font-bold text-[#1A1A1A] truncate">
                                                {project?.title ?? 'Project'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4 sm:gap-6">
                                            <p className="font-mono text-sm font-bold text-amber-600">
                                                {formatMoney(payout.amount)}
                                            </p>
                                            <span className="hidden sm:inline-block font-mono text-[9px] tracking-[0.2em] uppercase border border-[#1A1A1A]/20 px-2 py-0.5 text-[#1A1A1A]/80">
                                                {payout.status}
                                            </span>
                                            <button
                                                onClick={() => handleMarkPaid(payout.id)}
                                                className="font-mono text-[10px] tracking-[0.2em] uppercase px-3 py-2 bg-[#1A1A1A] text-[#F5F1E8] hover:bg-[#8C7A6B] transition-colors"
                                            >
                                                Mark paid
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </motion.section>
                )}

                {error && user && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-10 flex items-center gap-3 px-4 py-3 border border-[#1A1A1A]/20"
                    >
                        <div className="w-1.5 h-1.5 bg-[#8C7A6B] animate-pulse-dot rounded-full" />
                        <p className="font-mono text-[10px] tracking-wider uppercase text-[#1A1A1A]/85">
                            {error}
                        </p>
                    </motion.div>
                )}
            </main>
        </div>
    )
}
