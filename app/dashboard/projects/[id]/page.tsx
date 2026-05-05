'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

import DashboardHeader from '@/components/dashboard/DashboardHeader'
import { ApiError, apiAsset, apiFetch, getToken } from '@/lib/api'
import { formatMoney, formatPct, formatStreams } from '@/lib/format'

type Plan = 'STARTER' | 'PRO' | 'TEAM'
type ProjectStatus = 'DRAFT' | 'READY' | 'LIVE' | 'ARCHIVED'
type DistStatus = 'PENDING' | 'LIVE'
type CollabRole =
    | 'OWNER'
    | 'PRODUCER'
    | 'COMPOSER'
    | 'VOCALIST'
    | 'MANAGER'
    | 'ARTIST'
    | 'OTHER'
type ExpenseCategory =
    | 'MARKETING'
    | 'PRODUCTION'
    | 'MASTERING'
    | 'VIDEO'
    | 'LEGAL'
    | 'OTHER'

type User = {
    id: string
    email: string
    name: string | null
    plan: Plan
}

type Project = {
    id: string
    title: string
    status: ProjectStatus
    coverUrl: string | null
    createdAt: string
    releasedAt: string | null
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

type Track = {
    id: string
    title: string
    fileUrl: string
    coverUrl: string | null
    version: number
    duration: number | null
    uploadedAt: string
}

type Collaborator = {
    id: string
    userId: string | null
    userName: string | null
    userEmail: string | null
    role: CollabRole
    splitPct: string
    joinedAt: string
}

type Expense = {
    id: string
    category: ExpenseCategory
    amount: string
    currency: string
    description: string | null
    spentAt: string
}

type Distribution = {
    id: string
    platformId: string
    status: DistStatus
    liveAt: string | null
}

type Revenue = {
    id: string
    platformId: string
    amount: string
    currency: string
    periodStart: string
    periodEnd: string
    receivedAt: string
}

type Platform = {
    id: string
    name: string
    slug: string
}

type Activity = {
    id: string
    type: string
    payload: Record<string, unknown> | null
    createdAt: string
}

const TABS = [
    'overview',
    'tracks',
    'collaborators',
    'distributions',
    'revenues',
    'expenses',
    'activity',
] as const
type Tab = (typeof TABS)[number]

function StatusPill({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.2em] uppercase border border-[#1A1A1A]/20 px-2 py-0.5 text-[#1A1A1A]/80">
            {children}
        </span>
    )
}

function LivePill({ status }: { status: ProjectStatus | DistStatus }) {
    const isLive = status === 'LIVE'
    const pillClass = isLive
        ? 'border-emerald-500/30 text-emerald-600 bg-emerald-50/50'
        : 'border-[#1A1A1A]/20 text-[#1A1A1A]/80'
    return (
        <span className={`inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.2em] uppercase border px-2 py-0.5 ${pillClass}`}>
            {isLive && (
                <span className="w-1 h-1 bg-emerald-500 animate-pulse-dot rounded-full" />
            )}
            {status}
        </span>
    )
}

function SectionHeader({
    eyebrow,
    title,
    action,
}: {
    eyebrow: string
    title: string
    action?: React.ReactNode
}) {
    return (
        <div className="flex items-end justify-between mb-6 pb-4 border-b border-[#1A1A1A]/10">
            <div>
                <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/55 mb-2">
                    {eyebrow}
                </p>
                <h2 className="font-mono text-2xl font-bold tracking-tight">{title}</h2>
            </div>
            {action}
        </div>
    )
}

function EmptyRow({ children }: { children: React.ReactNode }) {
    return (
        <div className="border border-dashed border-[#1A1A1A]/15 px-6 py-12 text-center">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/55">
                {children}
            </p>
        </div>
    )
}

function formatDate(iso: string): string {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

function activityLabel(type: string): string {
    return type.replace(/_/g, ' ').toLowerCase()
}

export default function ProjectDetailPage() {
    const router = useRouter()
    const params = useParams<{ id: string }>()
    const projectId = params?.id ?? ''

    const [user, setUser] = useState<User | null>(null)
    const [project, setProject] = useState<Project | null>(null)
    const [summary, setSummary] = useState<ProjectSummary | null>(null)
    const [tracks, setTracks] = useState<Track[]>([])
    const [collaborators, setCollaborators] = useState<Collaborator[]>([])
    const [distributions, setDistributions] = useState<Distribution[]>([])
    const [revenues, setRevenues] = useState<Revenue[]>([])
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [platforms, setPlatforms] = useState<Platform[]>([])
    const [activity, setActivity] = useState<Activity[]>([])

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [tab, setTab] = useState<Tab>('overview')
    const [statusUpdating, setStatusUpdating] = useState(false)

    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [playingTrackId, setPlayingTrackId] = useState<string | null>(null)

    useEffect(() => {
        if (!getToken()) {
            router.replace('/login')
            return
        }
        if (!projectId) return

        let cancelled = false
        ;(async () => {
            try {
                const [
                    me,
                    prj,
                    sum,
                    trks,
                    cols,
                    dists,
                    revs,
                    exps,
                    plats,
                    acts,
                ] = await Promise.all([
                    apiFetch<User>('/me'),
                    apiFetch<Project>(`/projects/${projectId}`),
                    apiFetch<ProjectSummary>(`/projects/${projectId}/summary`).catch(
                        () => null
                    ),
                    apiFetch<Track[]>(`/projects/${projectId}/tracks`).catch(() => []),
                    apiFetch<Collaborator[]>(
                        `/projects/${projectId}/collaborators`
                    ).catch(() => []),
                    apiFetch<Distribution[]>(
                        `/projects/${projectId}/distributions`
                    ).catch(() => []),
                    apiFetch<Revenue[]>(`/projects/${projectId}/revenues`).catch(() => []),
                    apiFetch<Expense[]>(`/projects/${projectId}/expenses`).catch(() => []),
                    apiFetch<Platform[]>(`/platforms`).catch(() => []),
                    apiFetch<Activity[]>(`/projects/${projectId}/activity`).catch(() => []),
                ])
                if (cancelled) return
                setUser(me)
                setProject(prj)
                setSummary(sum)
                setTracks(trks)
                setCollaborators(cols)
                setDistributions(dists)
                setRevenues(revs)
                setExpenses(exps)
                setPlatforms(plats)
                setActivity(acts)
            } catch (err) {
                if (cancelled) return
                if (err instanceof ApiError && err.status === 401) {
                    router.replace('/login')
                    return
                }
                if (err instanceof ApiError && err.status === 404) {
                    setError('Project not found')
                } else {
                    setError(err instanceof Error ? err.message : 'Failed to load project')
                }
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

    const splitTotal = useMemo(
        () => collaborators.reduce((s, c) => s + Number(c.splitPct), 0),
        [collaborators]
    )

    const expenseTotal = useMemo(
        () => expenses.reduce((s, e) => s + Number(e.amount), 0),
        [expenses]
    )

    function toggleTrackPlay(track: Track) {
        const a = audioRef.current
        if (!a) return
        if (playingTrackId === track.id) {
            a.pause()
            setPlayingTrackId(null)
            return
        }
        const src = apiAsset(track.fileUrl)
        if (!src) return
        a.src = src
        a.play()
            .then(() => setPlayingTrackId(track.id))
            .catch(() => setPlayingTrackId(null))
    }

    async function handleStatusChange(newStatus: ProjectStatus) {
        if (!project || newStatus === project.status) return
        setStatusUpdating(true)
        try {
            const updated = await apiFetch<Project>(`/projects/${projectId}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus }),
            })
            setProject(updated)
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                router.replace('/login')
                return
            }
        } finally {
            setStatusUpdating(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center">
                <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#1A1A1A]/55">
                    Loading project…
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

    const breakEven = Number(summary?.breakEvenPct ?? 0)
    const rev = Number(summary?.totalRevenue ?? 0)
    const exp = Number(summary?.totalExpenses ?? expenseTotal)
    const profit = rev - exp

    return (
        <div className="min-h-screen bg-[#F5F1E8] text-[#1A1A1A]">
            <DashboardHeader user={user} />
            <audio ref={audioRef} onEnded={() => setPlayingTrackId(null)} hidden />

            <main className="px-6 md:px-12 lg:px-24 pt-32 pb-24 max-w-7xl mx-auto">
                {/* Breadcrumb */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.05 }}
                    className="flex items-center gap-2 mb-8 font-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/55"
                >
                    <Link href="/dashboard" className="hover:text-[#1A1A1A] transition-colors">
                        Workspace
                    </Link>
                    <span className="text-[#1A1A1A]/30">/</span>
                    <span className="text-[#1A1A1A]/85 truncate">{project.title}</span>
                </motion.div>

                {/* Hero */}
                <section className="mb-14">
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#1A1A1A]/60 mb-4"
                    >
                        Project
                    </motion.p>
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                        <div className="flex items-end gap-5 min-w-0">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.6, delay: 0.15 }}
                                className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 bg-[#1A1A1A]/[0.06] overflow-hidden flex items-center justify-center"
                            >
                                {project.coverUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={apiAsset(project.coverUrl) ?? ''}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="font-mono text-3xl font-bold text-[#1A1A1A]/30">
                                        {project.title.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </motion.div>
                            <div className="overflow-hidden min-w-0">
                                <motion.h1
                                    initial={{ y: '100%' }}
                                    animate={{ y: 0 }}
                                    transition={{
                                        duration: 1,
                                        delay: 0.2,
                                        ease: [0.22, 1, 0.36, 1],
                                    }}
                                    className="font-mono text-5xl sm:text-6xl md:text-7xl font-bold leading-[1] tracking-tighter text-[#1A1A1A] truncate"
                                >
                                    {project.title}
                                </motion.h1>
                            </div>
                        </div>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.5 }}
                            className="flex items-center gap-3 shrink-0"
                        >
                            {project.isOwner ? (
                                <select
                                    value={project.status}
                                    onChange={(e) =>
                                        handleStatusChange(e.target.value as ProjectStatus)
                                    }
                                    disabled={statusUpdating}
                                    className={`appearance-none cursor-pointer font-mono text-[9px] tracking-[0.2em] uppercase border px-3 py-1 pr-6 bg-transparent transition-colors outline-none ${
                                        project.status === 'LIVE'
                                            ? 'border-emerald-500/30 text-emerald-600 bg-emerald-50/50'
                                            : project.status === 'READY'
                                              ? 'border-amber-400/30 text-amber-600 bg-amber-50/50'
                                              : project.status === 'ARCHIVED'
                                                ? 'border-[#1A1A1A]/10 text-[#1A1A1A]/40'
                                                : 'border-[#1A1A1A]/20 text-[#1A1A1A]/80'
                                    } ${statusUpdating ? 'opacity-50' : ''}`}
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%231A1A1A' opacity='0.3'/%3E%3C/svg%3E")`,
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 8px center',
                                    }}
                                >
                                    <option value="DRAFT">Draft</option>
                                    <option value="READY">Ready</option>
                                    <option value="LIVE">Live</option>
                                    <option value="ARCHIVED">Archived</option>
                                </select>
                            ) : (
                                <>
                                    <span
                                        className={`font-mono text-[9px] tracking-[0.2em] uppercase border px-3 py-1 ${
                                            project.status === 'LIVE'
                                                ? 'border-emerald-500/30 text-emerald-600 bg-emerald-50/50'
                                                : project.status === 'READY'
                                                  ? 'border-amber-400/30 text-amber-600 bg-amber-50/50'
                                                  : project.status === 'ARCHIVED'
                                                    ? 'border-[#1A1A1A]/10 text-[#1A1A1A]/40'
                                                    : 'border-[#1A1A1A]/20 text-[#1A1A1A]/80'
                                        }`}
                                    >
                                        {project.status}
                                    </span>
                                    <span className="font-mono text-[9px] tracking-[0.2em] uppercase border border-[#8C7A6B]/40 text-[#8C7A6B] px-3 py-1">
                                        View only · {project.role ?? 'member'}
                                        {project.mySplitPct
                                            ? ` · ${Number(project.mySplitPct).toFixed(0)}%`
                                            : ''}
                                    </span>
                                </>
                            )}
                            <span className="font-mono text-[10px] tracking-wider text-[#1A1A1A]/55">
                                Created {formatDate(project.createdAt)}
                            </span>
                        </motion.div>
                    </div>
                </section>

                {/* KPI strip */}
                <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.55 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-[#1A1A1A]/10 border border-[#1A1A1A]/10 mb-12"
                >
                    <div className="bg-[#1A1A1A] p-5">
                        <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-[#F5F1E8]/50 mb-3">
                            Streams
                        </p>
                        <p className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F1E8]">
                            {formatStreams(summary?.totalStreams ?? 0)}
                        </p>
                    </div>
                    <div className="bg-[#F5F1E8] p-5">
                        <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-[#1A1A1A]/55 mb-3">
                            Revenue
                        </p>
                        <p className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600">
                            {formatMoney(rev)}
                        </p>
                    </div>
                    <div className="bg-[#F5F1E8] p-5">
                        <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-[#1A1A1A]/55 mb-3">
                            Expenses
                        </p>
                        <p className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-rose-500">
                            {formatMoney(exp)}
                        </p>
                    </div>
                    <div className="bg-[#F5F1E8] p-5">
                        <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-[#1A1A1A]/55 mb-3">
                            Break-even
                        </p>
                        <p className={`font-mono text-2xl sm:text-3xl font-bold tracking-tight ${breakEven >= 100 ? 'text-emerald-600' : 'text-[#1A1A1A]'}`}>
                            {formatPct(breakEven)}
                        </p>
                    </div>
                </motion.section>

                {/* Tabs */}
                <motion.nav
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.65 }}
                    className="flex items-center gap-1 border-b border-[#1A1A1A]/10 mb-10 overflow-x-auto"
                >
                    {TABS.map((t) => {
                        const active = tab === t
                        return (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`relative font-mono text-[10px] tracking-[0.2em] uppercase px-4 py-3 transition-colors whitespace-nowrap ${
                                    active
                                        ? 'text-[#1A1A1A]'
                                        : 'text-[#1A1A1A]/45 hover:text-[#1A1A1A]/80'
                                }`}
                            >
                                {t}
                                {active && (
                                    <motion.span
                                        layoutId="tab-underline"
                                        className="absolute left-0 right-0 bottom-[-1px] h-[2px] bg-[#1A1A1A]"
                                    />
                                )}
                            </button>
                        )
                    })}
                </motion.nav>

                {/* Tab content */}
                <motion.section
                    key={tab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    {tab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 border border-[#1A1A1A]/10 p-6">
                                <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/55 mb-4">
                                    Recovery
                                </p>
                                <div className="flex items-baseline justify-between mb-3">
                                    <p className={`font-mono text-4xl font-bold tracking-tight ${breakEven >= 100 ? 'text-emerald-600' : 'text-[#1A1A1A]'}`}>
                                        {formatPct(breakEven)}
                                    </p>
                                    <p className="font-mono text-[10px] tracking-wider text-[#1A1A1A]/55">
                                        <span className="text-emerald-600">{formatMoney(rev)}</span> / <span className="text-rose-500">{formatMoney(exp)}</span>
                                    </p>
                                </div>
                                <div className="h-[3px] bg-[#1A1A1A]/[0.06] overflow-hidden mb-6">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(breakEven, 100)}%` }}
                                        transition={{
                                            duration: 1.2,
                                            delay: 0.7,
                                            ease: [0.22, 1, 0.36, 1],
                                        }}
                                        className="h-full bg-[#1A1A1A]"
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-6 pt-4 border-t border-[#1A1A1A]/[0.06]">
                                    <div>
                                        <p className="font-mono text-[8px] tracking-[0.2em] uppercase text-[#1A1A1A]/50 mb-1">
                                            Net
                                        </p>
                                        <p className={`font-mono text-base font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                            {profit >= 0 ? '+' : ''}
                                            {formatMoney(profit)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-mono text-[8px] tracking-[0.2em] uppercase text-[#1A1A1A]/50 mb-1">
                                            Platforms
                                        </p>
                                        <p className="font-mono text-base font-bold">
                                            {distributions.length}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="border border-[#1A1A1A]/10 p-6">
                                <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/55 mb-4">
                                    Splits
                                </p>
                                {collaborators.length === 0 ? (
                                    <p className="font-mono text-[10px] text-[#1A1A1A]/55">
                                        No collaborators yet.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {collaborators.map((c) => {
                                            const pct = Number(c.splitPct)
                                            return (
                                                <div key={c.id}>
                                                    <div className="flex items-baseline justify-between mb-1">
                                                        <p className="font-mono text-[11px] text-[#1A1A1A]/85 truncate">
                                                            {c.userName ??
                                                                c.userEmail ??
                                                                '—'}
                                                        </p>
                                                        <p className="font-mono text-[11px] font-bold">
                                                            {pct.toFixed(0)}%
                                                        </p>
                                                    </div>
                                                    <div className="h-[2px] bg-[#1A1A1A]/[0.06] overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${pct}%` }}
                                                            transition={{
                                                                duration: 1,
                                                                delay: 0.8,
                                                                ease: [0.22, 1, 0.36, 1],
                                                            }}
                                                            className="h-full bg-[#1A1A1A]"
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                        <div className="pt-3 mt-3 border-t border-[#1A1A1A]/[0.06] flex items-center justify-between">
                                            <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1A1A]/50">
                                                Total
                                            </p>
                                            <p className="font-mono text-[11px] font-bold">
                                                {splitTotal.toFixed(0)}%
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {tab === 'tracks' && (
                        <>
                            <SectionHeader
                                eyebrow="Audio"
                                title="Tracks"
                                action={
                                    <Link
                                        href={`/dashboard/projects/${projectId}/tracks`}
                                        className="font-mono text-[10px] tracking-[0.2em] uppercase px-4 py-2.5 bg-[#1A1A1A] text-[#F5F1E8] hover:bg-[#8C7A6B] transition-colors"
                                    >
                                        Manage →
                                    </Link>
                                }
                            />
                            {tracks.length === 0 ? (
                                <EmptyRow>No tracks uploaded yet</EmptyRow>
                            ) : (
                                <div className="border border-[#1A1A1A]/10 divide-y divide-[#1A1A1A]/10">
                                    {tracks.map((t) => {
                                        const isPlaying = playingTrackId === t.id
                                        return (
                                            <div
                                                key={t.id}
                                                className="flex items-center justify-between gap-4 px-5 py-4"
                                            >
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleTrackPlay(t)}
                                                        aria-label={isPlaying ? 'Stop' : 'Play'}
                                                        className={`font-mono text-[10px] tracking-[0.2em] uppercase px-3 py-1 border transition-colors shrink-0 ${
                                                            isPlaying
                                                                ? 'bg-[#1A1A1A] text-[#F5F1E8] border-[#1A1A1A]'
                                                                : 'border-[#1A1A1A]/30 hover:bg-[#1A1A1A] hover:text-[#F5F1E8]'
                                                        }`}
                                                    >
                                                        {isPlaying ? '■ Stop' : '▶ Play'}
                                                    </button>
                                                    <div className="w-10 h-10 shrink-0 bg-[#1A1A1A]/[0.06] overflow-hidden flex items-center justify-center">
                                                        {t.coverUrl ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                src={apiAsset(t.coverUrl) ?? ''}
                                                                alt=""
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="font-mono text-[10px] font-bold text-[#1A1A1A]/35">
                                                                {t.title.charAt(0).toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="font-mono text-[9px] tracking-[0.2em] text-[#1A1A1A]/40">
                                                        v{t.version}
                                                    </span>
                                                    <p className="font-mono text-sm font-bold truncate">
                                                        {t.title}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-6 text-[#1A1A1A]/60">
                                                    <span className="font-mono text-[10px]">
                                                        {t.duration
                                                            ? `${Math.floor(t.duration / 60)}:${String(
                                                                  t.duration % 60
                                                              ).padStart(2, '0')}`
                                                            : '—'}
                                                    </span>
                                                    <span className="font-mono text-[10px] hidden sm:inline">
                                                        {formatDate(t.uploadedAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </>
                    )}

                    {tab === 'collaborators' && (
                        <>
                            <SectionHeader
                                eyebrow="Splits"
                                title="Collaborators"
                                action={
                                    <Link
                                        href={`/dashboard/projects/${projectId}/collaborators`}
                                        className="font-mono text-[10px] tracking-[0.2em] uppercase px-4 py-2.5 bg-[#1A1A1A] text-[#F5F1E8] hover:bg-[#8C7A6B] transition-colors"
                                    >
                                        Manage →
                                    </Link>
                                }
                            />
                            {collaborators.length === 0 ? (
                                <EmptyRow>No collaborators yet</EmptyRow>
                            ) : (
                                <div className="border border-[#1A1A1A]/10 divide-y divide-[#1A1A1A]/10">
                                    {collaborators.map((c) => (
                                        <div
                                            key={c.id}
                                            className="flex items-center justify-between gap-4 px-5 py-4"
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <StatusPill>{c.role}</StatusPill>
                                                <p className="font-mono text-sm text-[#1A1A1A]/85 truncate">
                                                    {c.userName ?? c.userEmail ?? '—'}
                                                </p>
                                            </div>
                                            <p className="font-mono text-sm font-bold">
                                                {Number(c.splitPct).toFixed(0)}%
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {tab === 'distributions' && (
                        <>
                            <SectionHeader
                                eyebrow="Reach"
                                title="Distributions"
                                action={
                                    <Link
                                        href={`/dashboard/projects/${projectId}/distributions`}
                                        className="font-mono text-[10px] tracking-[0.2em] uppercase px-4 py-2.5 bg-[#1A1A1A] text-[#F5F1E8] hover:bg-[#8C7A6B] transition-colors"
                                    >
                                        Manage →
                                    </Link>
                                }
                            />
                            {distributions.length === 0 ? (
                                <EmptyRow>Not distributed to any platform yet</EmptyRow>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-[#1A1A1A]/10 border border-[#1A1A1A]/10">
                                    {distributions.map((d) => {
                                        const platform = platformMap.get(d.platformId)
                                        return (
                                            <div
                                                key={d.id}
                                                className="bg-[#F5F1E8] p-5 flex items-center justify-between gap-4"
                                            >
                                                <div>
                                                    <p className="font-mono text-sm font-bold mb-1">
                                                        {platform?.name ?? 'Unknown'}
                                                    </p>
                                                    <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1A1A]/50">
                                                        {d.liveAt
                                                            ? formatDate(d.liveAt)
                                                            : 'pending'}
                                                    </p>
                                                </div>
                                                <LivePill status={d.status} />
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </>
                    )}

                    {tab === 'revenues' && (
                        <>
                            <SectionHeader
                                eyebrow="Income"
                                title="Revenues"
                                action={
                                    <Link
                                        href={`/dashboard/projects/${projectId}/revenues`}
                                        className="font-mono text-[10px] tracking-[0.2em] uppercase px-4 py-2.5 bg-[#1A1A1A] text-[#F5F1E8] hover:bg-[#8C7A6B] transition-colors"
                                    >
                                        Manage →
                                    </Link>
                                }
                            />
                            {revenues.length === 0 ? (
                                <EmptyRow>No revenue recorded yet</EmptyRow>
                            ) : (
                                <div className="border border-[#1A1A1A]/10 divide-y divide-[#1A1A1A]/10">
                                    {revenues.map((r) => {
                                        const platform = platformMap.get(r.platformId)
                                        return (
                                            <div
                                                key={r.id}
                                                className="flex items-center justify-between gap-4 px-5 py-4"
                                            >
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <p className="font-mono text-sm font-bold truncate">
                                                        {platform?.name ?? 'Unknown'}
                                                    </p>
                                                    <p className="font-mono text-[10px] text-[#1A1A1A]/55 hidden sm:inline">
                                                        {formatDate(r.periodStart)} →{' '}
                                                        {formatDate(r.periodEnd)}
                                                    </p>
                                                </div>
                                                <p className="font-mono text-sm font-bold text-emerald-600">
                                                    +{formatMoney(r.amount, r.currency)}
                                                </p>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </>
                    )}

                    {tab === 'expenses' && (
                        <>
                            <SectionHeader
                                eyebrow="Outflow"
                                title="Expenses"
                                action={
                                    <Link
                                        href={`/dashboard/projects/${projectId}/expenses`}
                                        className="font-mono text-[10px] tracking-[0.2em] uppercase px-4 py-2.5 bg-[#1A1A1A] text-[#F5F1E8] hover:bg-[#8C7A6B] transition-colors"
                                    >
                                        Manage →
                                    </Link>
                                }
                            />
                            {expenses.length === 0 ? (
                                <EmptyRow>No expenses logged yet</EmptyRow>
                            ) : (
                                <div className="border border-[#1A1A1A]/10 divide-y divide-[#1A1A1A]/10">
                                    {expenses.map((e) => (
                                        <div
                                            key={e.id}
                                            className="flex items-center justify-between gap-4 px-5 py-4"
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <StatusPill>{e.category}</StatusPill>
                                                <p className="font-mono text-[11px] text-[#1A1A1A]/70 truncate">
                                                    {e.description ?? '—'}
                                                </p>
                                            </div>
                                            <p className="font-mono text-sm font-bold text-rose-500">
                                                −{formatMoney(e.amount, e.currency)}
                                            </p>
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-between px-5 py-3 bg-[#1A1A1A]/[0.03]">
                                        <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1A1A]/55">
                                            Total
                                        </p>
                                        <p className="font-mono text-sm font-bold text-rose-500">
                                            {formatMoney(expenseTotal)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {tab === 'activity' && (
                        <>
                            <SectionHeader eyebrow="Audit" title="Activity feed" />
                            {activity.length === 0 ? (
                                <EmptyRow>No activity yet</EmptyRow>
                            ) : (
                                <div className="border border-[#1A1A1A]/10 divide-y divide-[#1A1A1A]/10">
                                    {activity.map((a) => (
                                        <div
                                            key={a.id}
                                            className="flex items-center justify-between gap-4 px-5 py-4"
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <span className="w-1 h-1 bg-[#8C7A6B] rounded-full shrink-0" />
                                                <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-[#1A1A1A]/85 truncate">
                                                    {activityLabel(a.type)}
                                                </p>
                                            </div>
                                            <span className="font-mono text-[10px] text-[#1A1A1A]/55">
                                                {formatDate(a.createdAt)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </motion.section>
            </main>
        </div>
    )
}
