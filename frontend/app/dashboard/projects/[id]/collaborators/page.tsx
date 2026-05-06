'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import DashboardHeader from '@/components/dashboard/DashboardHeader'
import { ApiError, apiFetch, getToken } from '@/lib/api'

type Plan = 'STARTER' | 'PRO' | 'TEAM'
type CollabRole =
    | 'OWNER'
    | 'PRODUCER'
    | 'COMPOSER'
    | 'VOCALIST'
    | 'MANAGER'
    | 'ARTIST'
    | 'OTHER'

const ROLES: CollabRole[] = [
    'PRODUCER',
    'COMPOSER',
    'VOCALIST',
    'MANAGER',
    'ARTIST',
    'OTHER',
]

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

type Collaborator = {
    id: string
    userId: string
    userName: string | null
    userEmail: string | null
    role: CollabRole
    splitPct: string
    joinedAt: string
}

function StatusPill({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.2em] uppercase border border-[#1A1A1A]/20 px-2 py-0.5 text-[#1A1A1A]/80">
            {children}
        </span>
    )
}

export default function CollaboratorsPage() {
    const router = useRouter()
    const params = useParams<{ id: string }>()
    const projectId = params?.id ?? ''

    const [user, setUser] = useState<User | null>(null)
    const [project, setProject] = useState<Project | null>(null)
    const [collaborators, setCollaborators] = useState<Collaborator[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [emailInput, setEmailInput] = useState('')
    const [role, setRole] = useState<CollabRole>('PRODUCER')
    const [splitPct, setSplitPct] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)
    const [removingId, setRemovingId] = useState<string | null>(null)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editSplit, setEditSplit] = useState('')

    useEffect(() => {
        if (!getToken()) {
            router.replace('/login')
            return
        }
        if (!projectId) return
        let cancelled = false
        ;(async () => {
            try {
                const [me, prj, cols] = await Promise.all([
                    apiFetch<User>('/me'),
                    apiFetch<Project>(`/projects/${projectId}`),
                    apiFetch<Collaborator[]>(`/projects/${projectId}/collaborators`),
                ])
                if (cancelled) return
                setUser(me)
                setProject(prj)
                setCollaborators(cols)
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

    const allocated = useMemo(
        () => collaborators.reduce((s, c) => s + Number(c.splitPct), 0),
        [collaborators]
    )
    const remaining = Math.max(0, 100 - allocated)

    const owner = useMemo(
        () => collaborators.find((c) => c.role === 'OWNER'),
        [collaborators]
    )
    const ownerPct = owner ? Number(owner.splitPct) : 0
    // Splits the owner can give up = remaining slack + their own share.
    const maxAddable = Math.min(100, remaining + ownerPct)

    async function handleInvite(e: React.FormEvent) {
        e.preventDefault()
        setFormError(null)

        const email = emailInput.trim()
        const pct = Number(splitPct)
        if (!email || !email.includes('@')) {
            setFormError('Enter a valid email')
            return
        }
        if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
            setFormError('Split must be between 0 and 100')
            return
        }
        if (pct > maxAddable) {
            setFormError(`Only ${maxAddable.toFixed(0)}% can be assigned`)
            return
        }

        setSubmitting(true)
        try {
            // Backend deducts from owner atomically when the new split would
            // push the total above 100%, so we don't touch local state until
            // the POST succeeds — that way a failed add never moves the bar.
            await apiFetch<Collaborator>(
                `/projects/${projectId}/collaborators`,
                {
                    method: 'POST',
                    body: JSON.stringify({ email, role, splitPct: pct }),
                }
            )
            const fresh = await apiFetch<Collaborator[]>(
                `/projects/${projectId}/collaborators`
            )
            setCollaborators(fresh)
            setEmailInput('')
            setSplitPct('')
            setRole('PRODUCER')
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                router.replace('/login')
                return
            }
            if (err instanceof ApiError && err.status === 404) {
                setFormError('No user with that email — ask them to sign up first.')
                return
            }
            setFormError(err instanceof Error ? err.message : 'Could not add collaborator')
        } finally {
            setSubmitting(false)
        }
    }

    async function handleEditSplit(collabId: string) {
        const newPct = Number(editSplit)
        if (!Number.isFinite(newPct) || newPct < 0 || newPct > 100) return

        try {
            await apiFetch<Collaborator>(
                `/projects/${projectId}/collaborators/${collabId}`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({ splitPct: newPct }),
                }
            )
            // Refetch — the backend rebalances the owner row, so a single-row
            // local update would leave the owner's split stale on screen.
            const fresh = await apiFetch<Collaborator[]>(
                `/projects/${projectId}/collaborators`
            )
            setCollaborators(fresh)
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                router.replace('/login')
                return
            }
            setFormError(err instanceof Error ? err.message : 'Could not update split')
        } finally {
            setEditingId(null)
            setEditSplit('')
        }
    }

    async function handleRemove(collabId: string) {
        setRemovingId(collabId)
        try {
            await apiFetch<void>(
                `/projects/${projectId}/collaborators/${collabId}`,
                { method: 'DELETE' }
            )
            // Refetch — the backend gives the freed % back to the owner.
            const fresh = await apiFetch<Collaborator[]>(
                `/projects/${projectId}/collaborators`
            )
            setCollaborators(fresh)
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
                    Loading collaborators…
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
                    <span className="text-[#1A1A1A]/85">Collaborators</span>
                </motion.div>

                {/* Hero */}
                <section className="mb-14">
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#1A1A1A]/60 mb-4"
                    >
                        Splits & invitations
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
                                Who gets
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
                                paid what.
                            </motion.h1>
                        </div>
                    </div>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="font-mono text-[11px] tracking-wider text-[#1A1A1A]/60 mt-6 max-w-md"
                    >
                        Add collaborators who already have a Musiky account with a role and
                        royalty split. Splits must total exactly 100% before you can record
                        revenue.
                    </motion.p>
                </section>

                {/* Allocation bar */}
                <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.65 }}
                    className="mb-12"
                >
                    <div className="flex items-baseline justify-between mb-3">
                        <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/55">
                            Allocation
                        </p>
                        <p className="font-mono text-[10px] text-[#1A1A1A]/70">
                            <span className="font-bold text-[#1A1A1A]">
                                {allocated.toFixed(0)}%
                            </span>{' '}
                            allocated · {remaining.toFixed(0)}% remaining
                        </p>
                    </div>
                    <div className="h-[6px] bg-[#1A1A1A]/[0.06] overflow-hidden flex">
                        {collaborators.map((c, i) => {
                            const pct = Number(c.splitPct)
                            return (
                                <motion.div
                                    key={c.id}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{
                                        duration: 1,
                                        delay: 0.7 + i * 0.05,
                                        ease: [0.22, 1, 0.36, 1],
                                    }}
                                    className={`h-full ${
                                        i % 2 === 0 ? 'bg-[#1A1A1A]' : 'bg-[#8C7A6B]'
                                    }`}
                                />
                            )
                        })}
                    </div>
                </motion.section>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                    {/* List */}
                    <motion.section
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.7 }}
                        className="lg:col-span-3"
                    >
                        <div className="flex items-end justify-between mb-6 pb-4 border-b border-[#1A1A1A]/10">
                            <div>
                                <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/55 mb-2">
                                    {collaborators.length}{' '}
                                    {collaborators.length === 1 ? 'person' : 'people'}
                                </p>
                                <h2 className="font-mono text-2xl font-bold tracking-tight">
                                    Roster
                                </h2>
                            </div>
                        </div>

                        {collaborators.length === 0 ? (
                            <div className="border border-dashed border-[#1A1A1A]/15 px-6 py-12 text-center">
                                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/55">
                                    No collaborators yet
                                </p>
                            </div>
                        ) : (
                            <div className="border border-[#1A1A1A]/10 divide-y divide-[#1A1A1A]/10">
                                {collaborators.map((c) => {
                                    const isOwner = c.role === 'OWNER'
                                    return (
                                        <div
                                            key={c.id}
                                            className="px-5 py-4 flex items-center justify-between gap-4"
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <StatusPill>{c.role}</StatusPill>
                                                <div className="min-w-0">
                                                    <p className="font-mono text-sm text-[#1A1A1A]/85 truncate">
                                                        {c.userName ?? c.userEmail ?? '—'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-5 shrink-0">
                                                {project.isOwner && !isOwner && editingId === c.id ? (
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={100}
                                                        step={1}
                                                        value={editSplit}
                                                        onChange={(e) => setEditSplit(e.target.value)}
                                                        onBlur={() => handleEditSplit(c.id)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleEditSplit(c.id)
                                                            if (e.key === 'Escape') { setEditingId(null); setEditSplit('') }
                                                        }}
                                                        autoFocus
                                                        className="w-14 bg-transparent border-b border-[#1A1A1A] outline-none py-0 font-mono text-base font-bold text-[#1A1A1A] text-right"
                                                    />
                                                ) : project.isOwner && !isOwner ? (
                                                    <button
                                                        onClick={() => { setEditingId(c.id); setEditSplit(Number(c.splitPct).toFixed(0)) }}
                                                        className="font-mono text-base font-bold hover:text-[#8C7A6B] transition-colors cursor-pointer"
                                                        title="Click to edit. Freed % returns to owner; extra % comes from owner."
                                                    >
                                                        {Number(c.splitPct).toFixed(0)}%
                                                    </button>
                                                ) : (
                                                    <span
                                                        className="font-mono text-base font-bold"
                                                        title={
                                                            isOwner
                                                                ? 'Auto-balanced — edit a collaborator to shift this'
                                                                : undefined
                                                        }
                                                    >
                                                        {Number(c.splitPct).toFixed(0)}%
                                                    </span>
                                                )}
                                                {project.isOwner && !isOwner && (
                                                    <button
                                                        onClick={() => handleRemove(c.id)}
                                                        disabled={removingId === c.id}
                                                        className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/45 hover:text-[#1A1A1A] transition-colors disabled:opacity-30"
                                                    >
                                                        {removingId === c.id
                                                            ? '…'
                                                            : 'Remove'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </motion.section>

                    {/* Invite form (owner only) */}
                    <motion.section
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.8 }}
                        className="lg:col-span-2"
                    >
                        {!project.isOwner ? (
                            <div className="border border-dashed border-[#8C7A6B]/40 p-6 sticky top-32 text-center">
                                <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#8C7A6B] mb-2">
                                    View only
                                </p>
                                <p className="font-mono text-[11px] text-[#1A1A1A]/60 leading-relaxed">
                                    Only the project owner can add or modify collaborators.
                                </p>
                            </div>
                        ) : (
                        <div className="border border-[#1A1A1A]/10 p-6 sticky top-32">
                            <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/55 mb-2">
                                Add someone
                            </p>
                            <h3 className="font-mono text-xl font-bold tracking-tight mb-6">
                                Add
                            </h3>

                            <form onSubmit={handleInvite} className="space-y-6">
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="block font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/70 mb-2"
                                    >
                                        Email of an existing Musiky user
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={emailInput}
                                        onChange={(e) => setEmailInput(e.target.value)}
                                        disabled={submitting}
                                        placeholder="name@example.com"
                                        className="w-full bg-transparent border-b border-[#1A1A1A]/20 focus:border-[#1A1A1A] outline-none py-2 font-mono text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 transition-colors disabled:opacity-50"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="role"
                                        className="block font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/70 mb-2"
                                    >
                                        Role
                                    </label>
                                    <select
                                        id="role"
                                        value={role}
                                        onChange={(e) =>
                                            setRole(e.target.value as CollabRole)
                                        }
                                        disabled={submitting}
                                        className="w-full bg-transparent border-b border-[#1A1A1A]/20 focus:border-[#1A1A1A] outline-none py-2 font-mono text-sm text-[#1A1A1A] transition-colors disabled:opacity-50 appearance-none cursor-pointer"
                                    >
                                        {ROLES.map((r) => (
                                            <option key={r} value={r}>
                                                {r}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label
                                        htmlFor="split"
                                        className="block font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/70 mb-2"
                                    >
                                        Split %{' '}
                                        <span className="text-[#1A1A1A]/40 normal-case tracking-normal">
                                            (max {maxAddable.toFixed(0)})
                                        </span>
                                    </label>
                                    <input
                                        id="split"
                                        type="number"
                                        min={0}
                                        max={maxAddable}
                                        step={0.01}
                                        value={splitPct}
                                        onChange={(e) => setSplitPct(e.target.value)}
                                        disabled={submitting}
                                        placeholder="25"
                                        className="w-full bg-transparent border-b border-[#1A1A1A]/20 focus:border-[#1A1A1A] outline-none py-2 font-mono text-2xl font-bold text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 transition-colors disabled:opacity-50"
                                    />
                                </div>

                                {splitPct && Number(splitPct) > remaining && owner && (
                                    <div className="px-3 py-2 border border-amber-400/30 bg-amber-50/50">
                                        <p className="font-mono text-[9px] tracking-wider text-amber-700">
                                            Owner split: {ownerPct}% → {Math.max(0, ownerPct - (Number(splitPct) - remaining))}%
                                        </p>
                                    </div>
                                )}

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
                                    disabled={submitting || maxAddable === 0}
                                    className="w-full font-mono text-[10px] tracking-[0.2em] uppercase px-4 py-3 bg-[#1A1A1A] text-[#F5F1E8] hover:bg-[#8C7A6B] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#1A1A1A]"
                                >
                                    {submitting ? 'Adding…' : 'Add collaborator →'}
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
