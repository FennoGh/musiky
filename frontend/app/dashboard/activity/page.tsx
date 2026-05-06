'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import DashboardHeader from '@/components/dashboard/DashboardHeader'
import { ApiError, apiFetch, getToken } from '@/lib/api'

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
}

type Activity = {
    id: string
    projectId: string
    type: string
    payload: Record<string, unknown> | null
    createdAt: string
}

type ActivityGroup = {
    label: string
    items: (Activity & { project: Project | null })[]
}

/* ── helpers ───────────────────────────────────────────────── */

const EVENT_ICONS: Record<string, string> = {
    PROJECT_CREATED: '◆',
    TRACK_UPLOADED: '▶',
    COLLAB_JOINED: '●',
    DISTRIBUTED: '▲',
    EXPENSE_LOGGED: '−',
    REVENUE_RECEIVED: '$',
    PAYOUT_SENT: '→',
}

function eventIcon(type: string): string {
    return EVENT_ICONS[type] ?? '·'
}

function eventLabel(type: string): string {
    return type.replace(/_/g, ' ').toLowerCase()
}

function eventCategory(type: string): string {
    if (type.startsWith('PROJECT')) return 'project'
    if (type.startsWith('TRACK')) return 'tracks'
    if (type.startsWith('COLLABORATOR')) return 'team'
    if (type.startsWith('CONTRACT')) return 'contracts'
    if (type.startsWith('DISTRIBUTION')) return 'distribution'
    if (type.startsWith('REVENUE') || type.startsWith('EXPENSE')) return 'money'
    if (type.startsWith('PAYOUT')) return 'payouts'
    return 'other'
}

const CATEGORIES = [
    'all',
    'project',
    'tracks',
    'team',
    'contracts',
    'distribution',
    'money',
    'payouts',
] as const
type Category = (typeof CATEGORIES)[number]

function formatDate(iso: string): string {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

function formatTime(iso: string): string {
    if (!iso) return ''
    return new Date(iso).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    })
}

function dayKey(iso: string): string {
    const d = new Date(iso)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dayLabel(key: string): string {
    const today = dayKey(new Date().toISOString())
    const yesterday = dayKey(new Date(Date.now() - 86400000).toISOString())
    if (key === today) return 'Today'
    if (key === yesterday) return 'Yesterday'
    return new Date(key + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    })
}

/* ── component ─────────────────────────────────────────────── */

export default function ActivityFeedPage() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [activities, setActivities] = useState<Activity[]>([])
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filter, setFilter] = useState<Category>('all')

    useEffect(() => {
        if (!getToken()) {
            router.replace('/login')
            return
        }
        let cancelled = false
        ;(async () => {
            try {
                const [me, acts, projs] = await Promise.all([
                    apiFetch<User>('/me'),
                    apiFetch<Activity[]>('/activity'),
                    apiFetch<Project[]>('/projects'),
                ])
                if (cancelled) return
                setUser(me)
                setActivities(acts)
                setProjects(projs)
            } catch (err) {
                if (cancelled) return
                if (err instanceof ApiError && err.status === 401) {
                    router.replace('/login')
                    return
                }
                setError(err instanceof Error ? err.message : 'Failed to load activity')
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

    const enriched = useMemo(
        () =>
            activities.map((a) => ({
                ...a,
                project: projectMap.get(a.projectId) ?? null,
            })),
        [activities, projectMap]
    )

    const filtered = useMemo(
        () =>
            filter === 'all'
                ? enriched
                : enriched.filter((a) => eventCategory(a.type) === filter),
        [enriched, filter]
    )

    const grouped = useMemo<ActivityGroup[]>(() => {
        const map = new Map<string, (Activity & { project: Project | null })[]>()
        filtered.forEach((a) => {
            const key = dayKey(a.createdAt)
            const list = map.get(key) ?? []
            list.push(a)
            map.set(key, list)
        })
        return Array.from(map.entries())
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([key, items]) => ({ label: dayLabel(key), items }))
    }, [filtered])

    const categoryCounts = useMemo(() => {
        const counts = new Map<string, number>()
        enriched.forEach((a) => {
            const cat = eventCategory(a.type)
            counts.set(cat, (counts.get(cat) ?? 0) + 1)
        })
        return counts
    }, [enriched])

    const projectActivityCounts = useMemo(() => {
        const counts = new Map<string, number>()
        filtered.forEach((a) => {
            counts.set(a.projectId, (counts.get(a.projectId) ?? 0) + 1)
        })
        return Array.from(counts.entries())
            .map(([id, count]) => ({ id, project: projectMap.get(id) ?? null, count }))
            .sort((a, b) => b.count - a.count)
    }, [filtered, projectMap])

    /* ── loading / error states ───────────────────────────── */

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#1A1A1A]/55">
                    Loading activity…
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

    return (
        <div className="min-h-screen bg-[#F5F1E8] text-[#1A1A1A]">
            <DashboardHeader user={user} />

            <main className="px-6 md:px-12 lg:px-24 pt-32 pb-24 max-w-7xl mx-auto">
                {/* Hero */}
                <section className="mb-16">
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#1A1A1A]/60 mb-4"
                    >
                        Workspace · Activity
                    </motion.p>
                    <div>
                        <div className="overflow-hidden">
                            <motion.h1
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                className="font-serif text-5xl sm:text-6xl md:text-7xl font-normal italic leading-[1] tracking-tight text-[#1A1A1A]"
                            >
                                Everything
                            </motion.h1>
                        </div>
                        <div className="overflow-hidden">
                            <motion.h1
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                transition={{ duration: 1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                className="font-mono text-5xl sm:text-6xl md:text-7xl font-bold leading-[1] tracking-tighter text-[#1A1A1A]"
                            >
                                that happened.
                            </motion.h1>
                        </div>
                    </div>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="font-mono text-[11px] tracking-wider text-[#1A1A1A]/60 mt-6"
                    >
                        {enriched.length} {enriched.length === 1 ? 'event' : 'events'} across{' '}
                        {projects.length} {projects.length === 1 ? 'project' : 'projects'}
                    </motion.p>
                </section>

                {/* Stats strip */}
                <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-[#1A1A1A]/10 border border-[#1A1A1A]/10 mb-16"
                >
                    <div className="bg-[#F5F1E8] p-5 sm:p-6">
                        <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-[#1A1A1A]/55 mb-3">
                            Total events
                        </p>
                        <p className="font-mono text-2xl sm:text-3xl font-bold text-[#1A1A1A] tracking-tight">
                            {enriched.length}
                        </p>
                    </div>
                    <div className="bg-[#F5F1E8] p-5 sm:p-6">
                        <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-[#1A1A1A]/55 mb-3">
                            Projects active
                        </p>
                        <p className="font-mono text-2xl sm:text-3xl font-bold text-[#1A1A1A] tracking-tight">
                            {projectActivityCounts.length}
                        </p>
                    </div>
                    <div className="bg-[#F5F1E8] p-5 sm:p-6">
                        <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-[#1A1A1A]/55 mb-3">
                            Categories
                        </p>
                        <p className="font-mono text-2xl sm:text-3xl font-bold text-[#1A1A1A] tracking-tight">
                            {categoryCounts.size}
                        </p>
                    </div>
                    <div className="bg-[#F5F1E8] p-5 sm:p-6">
                        <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-[#1A1A1A]/55 mb-3">
                            Today
                        </p>
                        <p className="font-mono text-2xl sm:text-3xl font-bold text-[#1A1A1A] tracking-tight">
                            {grouped.find((g) => g.label === 'Today')?.items.length ?? 0}
                        </p>
                    </div>
                </motion.section>

                {/* Main content: timeline + sidebar */}
                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Timeline */}
                    <div className="flex-1 min-w-0">
                        {/* Filter chips */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.8 }}
                            className="flex flex-wrap gap-2 mb-8"
                        >
                            {CATEGORIES.map((cat) => {
                                const count =
                                    cat === 'all'
                                        ? enriched.length
                                        : categoryCounts.get(cat) ?? 0
                                const active = filter === cat
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => setFilter(cat)}
                                        className={`font-mono text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 border transition-colors ${
                                            active
                                                ? 'bg-[#1A1A1A] text-[#F5F1E8] border-[#1A1A1A]'
                                                : 'bg-transparent text-[#1A1A1A]/70 border-[#1A1A1A]/15 hover:border-[#1A1A1A]/40'
                                        }`}
                                    >
                                        {cat} · {count}
                                    </button>
                                )
                            })}
                        </motion.div>

                        {/* Grouped by day */}
                        {grouped.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.9 }}
                                className="border border-dashed border-[#1A1A1A]/15 px-6 py-20 text-center"
                            >
                                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/55">
                                    No activity{filter !== 'all' ? ` in ${filter}` : ''} yet
                                </p>
                            </motion.div>
                        ) : (
                            <div className="space-y-10">
                                {grouped.map((group, gi) => (
                                    <motion.div
                                        key={group.label}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            duration: 0.6,
                                            delay: 0.9 + gi * 0.05,
                                        }}
                                    >
                                        {/* Day header */}
                                        <div className="flex items-center gap-4 mb-4">
                                            <h3 className="font-mono text-[11px] tracking-[0.2em] uppercase font-bold text-[#1A1A1A]/80 whitespace-nowrap">
                                                {group.label}
                                            </h3>
                                            <div className="flex-1 h-px bg-[#1A1A1A]/10" />
                                            <span className="font-mono text-[10px] text-[#1A1A1A]/40">
                                                {group.items.length}
                                            </span>
                                        </div>

                                        {/* Events */}
                                        <div className="border border-[#1A1A1A]/10 divide-y divide-[#1A1A1A]/10">
                                            {group.items.map((a) => (
                                                <div
                                                    key={a.id}
                                                    className="flex items-center gap-4 px-5 py-4 bg-[#F5F1E8] hover:bg-[#F5F1E8]/60 transition-colors"
                                                >
                                                    {/* Icon */}
                                                    <span className="w-6 h-6 flex items-center justify-center font-mono text-[11px] text-[#8C7A6B] shrink-0">
                                                        {eventIcon(a.type)}
                                                    </span>

                                                    {/* Event label + project */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-[#1A1A1A]/85 truncate">
                                                            {eventLabel(a.type)}
                                                        </p>
                                                        {a.project && (
                                                            <Link
                                                                href={`/dashboard/projects/${a.projectId}`}
                                                                className="font-mono text-[10px] text-[#8C7A6B] hover:text-[#1A1A1A] transition-colors truncate block"
                                                            >
                                                                {a.project.title}
                                                            </Link>
                                                        )}
                                                    </div>

                                                    {/* Payload hint */}
                                                    {a.payload && Object.keys(a.payload).length > 0 && (
                                                        <span className="hidden sm:inline-block font-mono text-[9px] tracking-[0.15em] text-[#1A1A1A]/35 max-w-[180px] truncate">
                                                            {Object.entries(a.payload)
                                                                .slice(0, 2)
                                                                .map(([k, v]) => `${k}: ${v}`)
                                                                .join(' · ')}
                                                        </span>
                                                    )}

                                                    {/* Time */}
                                                    <span className="font-mono text-[10px] text-[#1A1A1A]/40 whitespace-nowrap shrink-0">
                                                        {formatTime(a.createdAt)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sidebar: per-project breakdown */}
                    <motion.aside
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 1 }}
                        className="lg:w-72 shrink-0"
                    >
                        <div className="sticky top-32">
                            <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/55 mb-4">
                                By project
                            </p>
                            {projectActivityCounts.length === 0 ? (
                                <p className="font-mono text-[10px] text-[#1A1A1A]/40">
                                    No project activity
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {projectActivityCounts.map((p) => {
                                        const pct =
                                            filtered.length > 0
                                                ? (p.count / filtered.length) * 100
                                                : 0
                                        return (
                                            <div key={p.id}>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <Link
                                                        href={`/dashboard/projects/${p.id}`}
                                                        className="font-mono text-[11px] font-bold text-[#1A1A1A] hover:text-[#8C7A6B] transition-colors truncate max-w-[160px]"
                                                    >
                                                        {p.project?.title ?? 'Unknown'}
                                                    </Link>
                                                    <span className="font-mono text-[10px] text-[#1A1A1A]/50">
                                                        {p.count}
                                                    </span>
                                                </div>
                                                <div className="h-[3px] bg-[#1A1A1A]/[0.06] overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${pct}%` }}
                                                        transition={{
                                                            duration: 1.2,
                                                            ease: [0.22, 1, 0.36, 1],
                                                        }}
                                                        className="h-full bg-[#1A1A1A]"
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            {/* Event type legend */}
                            <div className="mt-10">
                                <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/55 mb-4">
                                    Event types
                                </p>
                                <div className="space-y-2">
                                    {Object.entries(EVENT_ICONS).map(([type, icon]) => (
                                        <div
                                            key={type}
                                            className="flex items-center gap-2"
                                        >
                                            <span className="w-4 font-mono text-[10px] text-[#8C7A6B] text-center">
                                                {icon}
                                            </span>
                                            <span className="font-mono text-[9px] tracking-[0.1em] uppercase text-[#1A1A1A]/50">
                                                {eventLabel(type)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.aside>
                </div>

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
