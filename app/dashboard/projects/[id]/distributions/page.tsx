'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import DashboardHeader from '@/components/dashboard/DashboardHeader'
import { ApiError, apiFetch, getToken } from '@/lib/api'

type Plan = 'STARTER' | 'PRO' | 'TEAM'
type DistStatus = 'PENDING' | 'LIVE'

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
    projectId: string
    platformId: string
    status: DistStatus
    liveAt: string | null
    streams: number
}

function formatStreams(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`
    return String(n)
}

function formatDate(iso: string | null): string {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

function StatusPill({ status }: { status: DistStatus }) {
    const live = status === 'LIVE'
    const pillClass = live
        ? 'border-emerald-500/30 text-emerald-600 bg-emerald-50/50'
        : 'border-[#1A1A1A]/20 text-[#1A1A1A]/80'
    return (
        <span className={`inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.2em] uppercase border px-2 py-0.5 ${pillClass}`}>
            {live && (
                <span className="w-1 h-1 bg-emerald-500 animate-pulse-dot rounded-full" />
            )}
            {status}
        </span>
    )
}

export default function DistributionsPage() {
    const router = useRouter()
    const params = useParams<{ id: string }>()
    const projectId = params?.id ?? ''

    const [user, setUser] = useState<User | null>(null)
    const [project, setProject] = useState<Project | null>(null)
    const [distributions, setDistributions] = useState<Distribution[]>([])
    const [platforms, setPlatforms] = useState<Platform[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [submittingId, setSubmittingId] = useState<string | null>(null)
    const [removingId, setRemovingId] = useState<string | null>(null)
    const [formError, setFormError] = useState<string | null>(null)
    const [search, setSearch] = useState('')

    const [customName, setCustomName] = useState('')
    const [customSubmitting, setCustomSubmitting] = useState(false)

    const [editingStreamsId, setEditingStreamsId] = useState<string | null>(null)
    const [streamsDraft, setStreamsDraft] = useState('')
    const [streamsSavingId, setStreamsSavingId] = useState<string | null>(null)

    useEffect(() => {
        if (!getToken()) {
            router.replace('/login')
            return
        }
        if (!projectId) return
        let cancelled = false
        ;(async () => {
            try {
                const [me, prj, dists, plats] = await Promise.all([
                    apiFetch<User>('/me'),
                    apiFetch<Project>(`/projects/${projectId}`),
                    apiFetch<Distribution[]>(`/projects/${projectId}/distributions`),
                    apiFetch<Platform[]>('/platforms'),
                ])
                if (cancelled) return
                setUser(me)
                setProject(prj)
                setDistributions(dists)
                setPlatforms(plats)
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

    const distributedSet = useMemo(
        () => new Set(distributions.map((d) => d.platformId)),
        [distributions]
    )

    const counts = useMemo(() => {
        const c = { LIVE: 0, PENDING: 0 }
        distributions.forEach((d) => {
            c[d.status] += 1
        })
        return c
    }, [distributions])

    const reach = useMemo(() => {
        if (platforms.length === 0) return 0
        return Math.round((distributions.length / platforms.length) * 100)
    }, [distributions, platforms])

    const availablePlatforms = useMemo(() => {
        const q = search.trim().toLowerCase()
        return platforms
            .filter((p) => !distributedSet.has(p.id))
            .filter(
                (p) =>
                    !q ||
                    p.name.toLowerCase().includes(q) ||
                    p.slug.toLowerCase().includes(q)
            )
    }, [platforms, distributedSet, search])

    async function handleAdd(platformId: string) {
        setFormError(null)
        setSubmittingId(platformId)
        try {
            const created = await apiFetch<Distribution>(
                `/projects/${projectId}/distributions`,
                {
                    method: 'POST',
                    body: JSON.stringify({ platformId }),
                }
            )
            setDistributions((prev) => [...prev, created])
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                router.replace('/login')
                return
            }
            setFormError(err instanceof Error ? err.message : 'Could not distribute')
        } finally {
            setSubmittingId(null)
        }
    }

    async function handleAddCustom(e: React.FormEvent) {
        e.preventDefault()
        const name = customName.trim()
        if (name.length < 2) {
            setFormError('Custom platform name must be at least 2 characters')
            return
        }
        setFormError(null)
        setCustomSubmitting(true)
        try {
            const created = await apiFetch<Distribution>(
                `/projects/${projectId}/distributions`,
                {
                    method: 'POST',
                    body: JSON.stringify({ customName: name }),
                }
            )
            // Pick up the (possibly new) Platform row so the card label resolves.
            const fresh = await apiFetch<Platform[]>('/platforms')
            setPlatforms(fresh)
            setDistributions((prev) => [...prev, created])
            setCustomName('')
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                router.replace('/login')
                return
            }
            setFormError(
                err instanceof Error ? err.message : 'Could not add custom platform'
            )
        } finally {
            setCustomSubmitting(false)
        }
    }

    async function handleSaveStreams(distId: string) {
        const n = Number(streamsDraft)
        if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
            setFormError('Streams must be a non-negative whole number')
            return
        }
        setFormError(null)
        setStreamsSavingId(distId)
        try {
            const updated = await apiFetch<Distribution>(
                `/projects/${projectId}/distributions/${distId}/streams`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({ streams: n }),
                }
            )
            setDistributions((prev) =>
                prev.map((d) => (d.id === distId ? updated : d))
            )
            setEditingStreamsId(null)
            setStreamsDraft('')
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                router.replace('/login')
                return
            }
            setFormError(
                err instanceof Error ? err.message : 'Could not update streams'
            )
        } finally {
            setStreamsSavingId(null)
        }
    }

    async function handleRemove(distId: string) {
        setFormError(null)
        setRemovingId(distId)
        try {
            await apiFetch<void>(
                `/projects/${projectId}/distributions/${distId}`,
                { method: 'DELETE' }
            )
            setDistributions((prev) => prev.filter((d) => d.id !== distId))
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                router.replace('/login')
                return
            }
            setFormError(err instanceof Error ? err.message : 'Could not remove')
        } finally {
            setRemovingId(null)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center">
                <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#1A1A1A]/55">
                    Loading distributions…
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
                    <Link
                        href={`/dashboard/projects/${projectId}`}
                        className="hover:text-[#1A1A1A] transition-colors truncate"
                    >
                        {project.title}
                    </Link>
                    <span className="text-[#1A1A1A]/30">/</span>
                    <span className="text-[#1A1A1A]/85">Distributions</span>
                </motion.div>

                {/* Hero */}
                <section className="mb-14">
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#1A1A1A]/60 mb-4"
                    >
                        Reach
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
                                Everywhere
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
                                people listen.
                            </motion.h1>
                        </div>
                    </div>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="font-mono text-[11px] tracking-wider text-[#1A1A1A]/60 mt-6 max-w-md"
                    >
                        Push your project to streaming platforms one click at a time. Each
                        platform tracks its own status and revenue separately.
                    </motion.p>
                </section>

                {/* Stats strip */}
                <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.65 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-[#1A1A1A]/10 border border-[#1A1A1A]/10 mb-12"
                >
                    <div className="bg-[#1A1A1A] p-5">
                        <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-[#F5F1E8]/50 mb-3">
                            Live
                        </p>
                        <p className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400">
                            {counts.LIVE}
                        </p>
                    </div>
                    <div className="bg-[#F5F1E8] p-5">
                        <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-[#1A1A1A]/55 mb-3">
                            Pending
                        </p>
                        <p className="font-mono text-2xl sm:text-3xl font-bold tracking-tight">
                            {counts.PENDING}
                        </p>
                    </div>
                    <div className="bg-[#F5F1E8] p-5">
                        <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-[#1A1A1A]/55 mb-3">
                            Available
                        </p>
                        <p className="font-mono text-2xl sm:text-3xl font-bold tracking-tight">
                            {platforms.length - distributions.length}
                        </p>
                    </div>
                    <div className="bg-[#F5F1E8] p-5">
                        <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-[#1A1A1A]/55 mb-3">
                            Reach
                        </p>
                        <p className="font-mono text-2xl sm:text-3xl font-bold tracking-tight">
                            {reach}%
                        </p>
                    </div>
                </motion.section>

                {/* Reach bar */}
                {platforms.length > 0 && (
                    <motion.section
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.7 }}
                        className="mb-14"
                    >
                        <div className="flex items-baseline justify-between mb-3">
                            <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/55">
                                Coverage
                            </p>
                            <p className="font-mono text-[10px] text-[#1A1A1A]/70">
                                <span className="font-bold text-[#1A1A1A]">
                                    {distributions.length}
                                </span>{' '}
                                of {platforms.length} platforms
                            </p>
                        </div>
                        <div className="h-[6px] bg-[#1A1A1A]/[0.06] overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${reach}%` }}
                                transition={{
                                    duration: 1.2,
                                    delay: 0.75,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                className="h-full bg-[#1A1A1A]"
                            />
                        </div>
                    </motion.section>
                )}

                {/* Live distributions */}
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.75 }}
                    className="mb-16"
                >
                    <div className="flex items-end justify-between mb-6 pb-4 border-b border-[#1A1A1A]/10">
                        <div>
                            <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/55 mb-2">
                                Distributed to
                            </p>
                            <h2 className="font-mono text-2xl font-bold tracking-tight">
                                Active platforms
                            </h2>
                        </div>
                    </div>

                    {distributions.length === 0 ? (
                        <div className="border border-dashed border-[#1A1A1A]/15 px-6 py-12 text-center">
                            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/55">
                                Not distributed to any platform yet
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-[#1A1A1A]/10 border border-[#1A1A1A]/10">
                            {distributions.map((d) => {
                                const platform = platformMap.get(d.platformId)
                                const isLive = d.status === 'LIVE'
                                const isEditing = editingStreamsId === d.id
                                return (
                                    <div
                                        key={d.id}
                                        className="bg-[#F5F1E8] p-5 flex flex-col gap-4"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <p className="font-mono text-base font-bold tracking-tight mb-1 truncate">
                                                    {platform?.name ?? 'Unknown'}
                                                </p>
                                                <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1A1A]/45">
                                                    {platform?.slug ?? '—'}
                                                </p>
                                                <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1A1A]/55 mt-3">
                                                    {d.liveAt
                                                        ? `live ${formatDate(d.liveAt)}`
                                                        : 'pending'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <StatusPill status={d.status} />
                                                {project.isOwner && (
                                                    <button
                                                        onClick={() => handleRemove(d.id)}
                                                        disabled={removingId === d.id}
                                                        className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1A1A]/35 hover:text-rose-500 transition-colors disabled:opacity-50"
                                                    >
                                                        {removingId === d.id ? '…' : '✕'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {isLive && (
                                            <div className="flex items-end justify-between gap-3 pt-3 border-t border-[#1A1A1A]/10">
                                                <div className="min-w-0">
                                                    <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1A1A]/55 mb-1">
                                                        Streams
                                                    </p>
                                                    {isEditing ? (
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                step={1}
                                                                value={streamsDraft}
                                                                onChange={(e) =>
                                                                    setStreamsDraft(e.target.value)
                                                                }
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter')
                                                                        handleSaveStreams(d.id)
                                                                    if (e.key === 'Escape') {
                                                                        setEditingStreamsId(null)
                                                                        setStreamsDraft('')
                                                                    }
                                                                }}
                                                                autoFocus
                                                                className="w-28 bg-transparent border-b border-[#1A1A1A] outline-none py-0 font-mono text-lg font-bold text-[#1A1A1A]"
                                                            />
                                                            <button
                                                                onClick={() => handleSaveStreams(d.id)}
                                                                disabled={streamsSavingId === d.id}
                                                                className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1A1A]/85 hover:text-[#1A1A1A] disabled:opacity-50"
                                                            >
                                                                {streamsSavingId === d.id
                                                                    ? '…'
                                                                    : 'Save'}
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingStreamsId(null)
                                                                    setStreamsDraft('')
                                                                }}
                                                                className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1A1A]/45 hover:text-[#1A1A1A]"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <p className="font-mono text-2xl font-bold tracking-tight">
                                                            {formatStreams(d.streams ?? 0)}
                                                        </p>
                                                    )}
                                                </div>
                                                {project.isOwner && !isEditing && (
                                                    <button
                                                        onClick={() => {
                                                            setEditingStreamsId(d.id)
                                                            setStreamsDraft(String(d.streams ?? 0))
                                                        }}
                                                        className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1A1A]/55 hover:text-[#1A1A1A] transition-colors"
                                                    >
                                                        {(d.streams ?? 0) === 0 ? 'Set' : 'Update'}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </motion.section>

                {/* Available platforms (owner only) */}
                {project.isOwner && (
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.85 }}
                >
                    <div className="flex items-end justify-between mb-6 pb-4 border-b border-[#1A1A1A]/10 gap-4">
                        <div>
                            <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/55 mb-2">
                                Add a platform
                            </p>
                            <h2 className="font-mono text-2xl font-bold tracking-tight">
                                Available
                            </h2>
                        </div>
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search…"
                            className="w-40 sm:w-56 bg-transparent border-b border-[#1A1A1A]/20 focus:border-[#1A1A1A] outline-none py-2 font-mono text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 transition-colors"
                        />
                    </div>

                    {formError && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-3 px-4 py-3 border border-[#1A1A1A]/20 mb-6"
                        >
                            <div className="w-1.5 h-1.5 bg-[#8C7A6B] animate-pulse-dot rounded-full" />
                            <p className="font-mono text-[10px] tracking-wider uppercase text-[#1A1A1A]/85">
                                {formError}
                            </p>
                        </motion.div>
                    )}

                    {/* Custom platform */}
                    <form
                        onSubmit={handleAddCustom}
                        className="mb-6 border border-dashed border-[#1A1A1A]/20 p-4 flex flex-col sm:flex-row sm:items-end gap-3"
                    >
                        <div className="flex-1">
                            <label
                                htmlFor="customPlatform"
                                className="block font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/60 mb-2"
                            >
                                Custom platform name
                            </label>
                            <input
                                id="customPlatform"
                                type="text"
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                                disabled={customSubmitting}
                                placeholder="e.g. Bandcamp, Audius, MySpace…"
                                className="w-full bg-transparent border-b border-[#1A1A1A]/20 focus:border-[#1A1A1A] outline-none py-2 font-mono text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 transition-colors disabled:opacity-50"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={customSubmitting || customName.trim().length < 2}
                            className="font-mono text-[10px] tracking-[0.2em] uppercase px-4 py-3 bg-[#1A1A1A] text-[#F5F1E8] hover:bg-[#8C7A6B] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#1A1A1A] shrink-0"
                        >
                            {customSubmitting ? 'Adding…' : '+ Add custom'}
                        </button>
                    </form>

                    {availablePlatforms.length === 0 ? (
                        <div className="border border-dashed border-[#1A1A1A]/15 px-6 py-12 text-center">
                            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/55">
                                {platforms.length === 0
                                    ? 'No platforms registered'
                                    : distributedSet.size === platforms.length
                                      ? 'You are everywhere · all platforms covered'
                                      : 'No platforms match your search'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-[#1A1A1A]/10 border border-[#1A1A1A]/10">
                            {availablePlatforms.map((p) => {
                                const isSubmitting = submittingId === p.id
                                return (
                                    <div
                                        key={p.id}
                                        className="bg-[#F5F1E8] p-5 flex items-center justify-between gap-4"
                                    >
                                        <div className="min-w-0">
                                            <p className="font-mono text-sm font-bold tracking-tight mb-1 truncate">
                                                {p.name}
                                            </p>
                                            <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1A1A]/45">
                                                {p.slug}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleAdd(p.id)}
                                            disabled={isSubmitting || submittingId !== null}
                                            className="font-mono text-[10px] tracking-[0.2em] uppercase px-3 py-2 bg-[#1A1A1A] text-[#F5F1E8] hover:bg-[#8C7A6B] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#1A1A1A] shrink-0"
                                        >
                                            {isSubmitting ? '…' : '+ Add'}
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </motion.section>
                )}
            </main>
        </div>
    )
}
