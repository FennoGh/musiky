'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

import DashboardHeader from '@/components/dashboard/DashboardHeader'
import { ApiError, apiAsset, apiFetch, getToken } from '@/lib/api'

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

type Track = {
    id: string
    title: string
    fileUrl: string
    coverUrl: string | null
    version: number
    duration: number | null
    uploadedAt: string
}

function readAudioDuration(file: File): Promise<number | null> {
    return new Promise((resolve) => {
        const url = URL.createObjectURL(file)
        const audio = new Audio()
        const cleanup = () => {
            audio.src = ''
            URL.revokeObjectURL(url)
        }
        audio.preload = 'metadata'
        audio.onloadedmetadata = () => {
            const d = audio.duration
            cleanup()
            resolve(Number.isFinite(d) && d > 0 ? Math.round(d) : null)
        }
        audio.onerror = () => {
            cleanup()
            resolve(null)
        }
        audio.src = url
    })
}

function formatDuration(seconds: number | null): string {
    if (seconds == null) return '—'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${String(s).padStart(2, '0')}`
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

export default function TracksPage() {
    const router = useRouter()
    const params = useParams<{ id: string }>()
    const projectId = params?.id ?? ''

    const [user, setUser] = useState<User | null>(null)
    const [project, setProject] = useState<Project | null>(null)
    const [tracks, setTracks] = useState<Track[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [title, setTitle] = useState('')
    const [audioFile, setAudioFile] = useState<File | null>(null)
    const [coverFile, setCoverFile] = useState<File | null>(null)
    const [coverPreview, setCoverPreview] = useState<string | null>(null)
    const [version, setVersion] = useState('1')
    const [submitting, setSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [playingId, setPlayingId] = useState<string | null>(null)

    const [editingId, setEditingId] = useState<string | null>(null)
    const [editTitle, setEditTitle] = useState('')
    const [editVersion, setEditVersion] = useState('1')
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
                const [me, prj, trks] = await Promise.all([
                    apiFetch<User>('/me'),
                    apiFetch<Project>(`/projects/${projectId}`),
                    apiFetch<Track[]>(`/projects/${projectId}/tracks`),
                ])
                if (cancelled) return
                setUser(me)
                setProject(prj)
                setTracks(trks)
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

    const totalDuration = useMemo(
        () => tracks.reduce((s, t) => s + (t.duration ?? 0), 0),
        [tracks]
    )

    const groupedByTitle = useMemo(() => {
        const map = new Map<string, number>()
        tracks.forEach((t) => map.set(t.title, (map.get(t.title) ?? 0) + 1))
        return map
    }, [tracks])

    function suggestNextVersion(forTitle: string): number {
        const t = forTitle.trim()
        if (!t) return 1
        const existing = tracks.filter((x) => x.title === t).map((x) => x.version)
        return existing.length === 0 ? 1 : Math.max(...existing) + 1
    }

    useEffect(() => {
        if (!coverFile) {
            setCoverPreview(null)
            return
        }
        const url = URL.createObjectURL(coverFile)
        setCoverPreview(url)
        return () => URL.revokeObjectURL(url)
    }, [coverFile])

    function togglePlay(track: Track) {
        const a = audioRef.current
        if (!a) return
        if (playingId === track.id) {
            a.pause()
            setPlayingId(null)
            return
        }
        const src = apiAsset(track.fileUrl)
        if (!src) return
        a.src = src
        a.play()
            .then(() => setPlayingId(track.id))
            .catch(() => setPlayingId(null))
    }

    function startEdit(t: Track) {
        setEditingId(t.id)
        setEditTitle(t.title)
        setEditVersion(String(t.version))
        setEditError(null)
        setConfirmDeleteId(null)
        setRowError(null)
    }

    function cancelEdit() {
        setEditingId(null)
        setEditError(null)
    }

    async function saveEdit(id: string) {
        const title = editTitle.trim()
        const ver = Number(editVersion) || 1
        if (!title) {
            setEditError('Title is required')
            return
        }
        if (ver < 1) {
            setEditError('Version must be at least 1')
            return
        }
        setEditSubmitting(true)
        setEditError(null)
        try {
            const updated = await apiFetch<Track>(
                `/projects/${projectId}/tracks/${id}`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({ title, version: ver }),
                }
            )
            setTracks((prev) => prev.map((t) => (t.id === id ? updated : t)))
            setEditingId(null)
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
            await apiFetch<void>(`/projects/${projectId}/tracks/${id}`, {
                method: 'DELETE',
            })
            if (playingId === id) {
                audioRef.current?.pause()
                setPlayingId(null)
            }
            setTracks((prev) => prev.filter((t) => t.id !== id))
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

    async function handleUpload(e: React.FormEvent) {
        e.preventDefault()
        setFormError(null)

        const t = title.trim()
        const ver = Number(version) || 1

        if (t.length < 1) {
            setFormError('Title is required')
            return
        }
        if (!audioFile) {
            setFormError('Choose an audio file from your computer')
            return
        }

        setSubmitting(true)
        try {
            // Read duration from the file metadata before sending so the row
            // shows a real length and the project total runtime is accurate.
            const duration = await readAudioDuration(audioFile)

            const audioFd = new FormData()
            audioFd.append('file', audioFile)
            const audioUploaded = await apiFetch<{ url: string }>(
                '/uploads/audio',
                { method: 'POST', body: audioFd }
            )

            let coverUrl: string | null = null
            if (coverFile) {
                const coverFd = new FormData()
                coverFd.append('file', coverFile)
                const coverUploaded = await apiFetch<{ url: string }>(
                    '/uploads/cover',
                    { method: 'POST', body: coverFd }
                )
                coverUrl = coverUploaded.url
            }

            const created = await apiFetch<Track>(`/projects/${projectId}/tracks`, {
                method: 'POST',
                body: JSON.stringify({
                    title: t,
                    fileUrl: audioUploaded.url,
                    coverUrl,
                    duration,
                    version: ver,
                }),
            })
            setTracks((prev) => [created, ...prev])
            setTitle('')
            setAudioFile(null)
            setCoverFile(null)
            setVersion('1')
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                router.replace('/login')
                return
            }
            setFormError(err instanceof Error ? err.message : 'Could not upload')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center">
                <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#1A1A1A]/55">
                    Loading tracks…
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

            <audio ref={audioRef} onEnded={() => setPlayingId(null)} hidden />

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
                    <span className="text-[#1A1A1A]/85">Tracks</span>
                </motion.div>

                {/* Hero */}
                <section className="mb-14">
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#1A1A1A]/60 mb-4"
                    >
                        Audio
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
                                Every take,
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
                                versioned.
                            </motion.h1>
                        </div>
                    </div>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="font-mono text-[11px] tracking-wider text-[#1A1A1A]/60 mt-6 max-w-md"
                    >
                        Upload masters and rough cuts. Reuse a title with a new version number to
                        keep iterations stacked together.
                    </motion.p>
                </section>

                {/* Stats strip */}
                <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.65 }}
                    className="grid grid-cols-3 gap-[1px] bg-[#1A1A1A]/10 border border-[#1A1A1A]/10 mb-12"
                >
                    <div className="bg-[#F5F1E8] p-5">
                        <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-[#1A1A1A]/55 mb-3">
                            Tracks
                        </p>
                        <p className="font-mono text-2xl sm:text-3xl font-bold tracking-tight">
                            {tracks.length}
                        </p>
                    </div>
                    <div className="bg-[#F5F1E8] p-5">
                        <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-[#1A1A1A]/55 mb-3">
                            Unique titles
                        </p>
                        <p className="font-mono text-2xl sm:text-3xl font-bold tracking-tight">
                            {groupedByTitle.size}
                        </p>
                    </div>
                    <div className="bg-[#F5F1E8] p-5">
                        <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-[#1A1A1A]/55 mb-3">
                            Total runtime
                        </p>
                        <p className="font-mono text-2xl sm:text-3xl font-bold tracking-tight">
                            {formatDuration(totalDuration)}
                        </p>
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
                                    {tracks.length}{' '}
                                    {tracks.length === 1 ? 'file' : 'files'}
                                </p>
                                <h2 className="font-mono text-2xl font-bold tracking-tight">
                                    Library
                                </h2>
                            </div>
                        </div>

                        {tracks.length === 0 ? (
                            <div className="border border-dashed border-[#1A1A1A]/15 px-6 py-12 text-center">
                                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/55">
                                    No tracks uploaded yet
                                </p>
                            </div>
                        ) : (
                            <div className="border border-[#1A1A1A]/10 divide-y divide-[#1A1A1A]/10">
                                {tracks.map((t) => {
                                    const isPlaying = playingId === t.id
                                    const isEditing = editingId === t.id
                                    const isConfirmingDelete = confirmDeleteId === t.id

                                    if (isEditing) {
                                        return (
                                            <div
                                                key={t.id}
                                                className="px-5 py-4 bg-[#1A1A1A]/[0.02]"
                                            >
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/55 shrink-0">
                                                        Edit
                                                    </span>
                                                    <input
                                                        type="text"
                                                        value={editTitle}
                                                        onChange={(e) => setEditTitle(e.target.value)}
                                                        disabled={editSubmitting}
                                                        placeholder="Title"
                                                        className="flex-1 min-w-[140px] bg-transparent border-b border-[#1A1A1A]/30 focus:border-[#1A1A1A] outline-none py-1 font-mono text-sm font-bold text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 transition-colors disabled:opacity-50"
                                                    />
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={editVersion}
                                                        onChange={(e) => setEditVersion(e.target.value)}
                                                        disabled={editSubmitting}
                                                        className="w-16 bg-transparent border-b border-[#1A1A1A]/30 focus:border-[#1A1A1A] outline-none py-1 font-mono text-sm font-bold text-[#1A1A1A] transition-colors disabled:opacity-50"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => saveEdit(t.id)}
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
                                                    <p className="font-mono text-[9px] tracking-wider uppercase text-[#8C7A6B] mt-2">
                                                        {editError}
                                                    </p>
                                                )}
                                            </div>
                                        )
                                    }

                                    return (
                                        <div
                                            key={t.id}
                                            className="px-5 py-4 flex items-center justify-between gap-4"
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <button
                                                    type="button"
                                                    onClick={() => togglePlay(t)}
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
                                                <span className="font-mono text-[9px] tracking-[0.2em] text-[#1A1A1A]/40 shrink-0">
                                                    v{t.version}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="font-mono text-sm font-bold truncate">
                                                        {t.title}
                                                    </p>
                                                    <p className="font-mono text-[10px] text-[#1A1A1A]/45">
                                                        audio file
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 sm:gap-5 shrink-0 text-[#1A1A1A]/60">
                                                <span className="font-mono text-[10px]">
                                                    {formatDuration(t.duration)}
                                                </span>
                                                <span className="font-mono text-[10px] hidden sm:inline">
                                                    {formatDate(t.uploadedAt)}
                                                </span>
                                                {project.isOwner && (
                                                    isConfirmingDelete ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => deleteRow(t.id)}
                                                                disabled={deletingId === t.id}
                                                                className="font-mono text-[9px] tracking-[0.2em] uppercase px-2 py-1 bg-[#8C7A6B] text-[#F5F1E8] hover:bg-[#1A1A1A] transition-colors disabled:opacity-40"
                                                            >
                                                                {deletingId === t.id ? '…' : 'Confirm'}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setConfirmDeleteId(null)
                                                                    setRowError(null)
                                                                }}
                                                                disabled={deletingId === t.id}
                                                                className="font-mono text-[9px] tracking-[0.2em] uppercase px-2 py-1 border border-[#1A1A1A]/20 text-[#1A1A1A]/55 hover:text-[#1A1A1A] hover:border-[#1A1A1A]/40 transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => startEdit(t)}
                                                                aria-label="Edit"
                                                                className="font-mono text-[9px] tracking-[0.2em] uppercase px-2 py-1 border border-[#1A1A1A]/15 text-[#1A1A1A]/55 hover:text-[#1A1A1A] hover:border-[#1A1A1A]/40 transition-colors"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setConfirmDeleteId(t.id)
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
                                    )
                                })}
                                {rowError && (
                                    <div className="flex items-center gap-3 px-5 py-3 border-t border-[#1A1A1A]/10 bg-[#8C7A6B]/[0.06]">
                                        <div className="w-1 h-1 bg-[#8C7A6B] animate-pulse-dot rounded-full" />
                                        <p className="font-mono text-[9px] tracking-wider uppercase text-[#1A1A1A]/85">
                                            {rowError}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.section>

                    {/* Upload form (owner only) */}
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
                                    Only the project owner can upload tracks.
                                </p>
                            </div>
                        ) : (
                        <div className="border border-[#1A1A1A]/10 p-6 sticky top-32">
                            <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/55 mb-2">
                                Add a file
                            </p>
                            <h3 className="font-mono text-xl font-bold tracking-tight mb-6">
                                Upload
                            </h3>

                            <form onSubmit={handleUpload} className="space-y-6">
                                <div>
                                    <label
                                        htmlFor="title"
                                        className="block font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/70 mb-2"
                                    >
                                        Title
                                    </label>
                                    <input
                                        id="title"
                                        type="text"
                                        value={title}
                                        onChange={(e) => {
                                            setTitle(e.target.value)
                                            setVersion(
                                                String(suggestNextVersion(e.target.value))
                                            )
                                        }}
                                        disabled={submitting}
                                        placeholder="Verano (master)"
                                        className="w-full bg-transparent border-b border-[#1A1A1A]/20 focus:border-[#1A1A1A] outline-none py-2 font-mono text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 transition-colors disabled:opacity-50"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="audio"
                                        className="block font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/70 mb-2"
                                    >
                                        Audio file
                                    </label>
                                    <label
                                        htmlFor="audio"
                                        className="block border border-dashed border-[#1A1A1A]/25 hover:border-[#1A1A1A]/55 transition-colors cursor-pointer"
                                    >
                                        {audioFile ? (
                                            <div className="px-4 py-3">
                                                <p className="font-mono text-[11px] text-[#1A1A1A]/85 truncate">
                                                    {audioFile.name}
                                                </p>
                                                <p className="font-mono text-[9px] text-[#1A1A1A]/45 mt-1">
                                                    {formatBytes(audioFile.size)}
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        setAudioFile(null)
                                                    }}
                                                    className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1A1A]/45 hover:text-[#1A1A1A] mt-2 transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="px-4 py-8 text-center">
                                                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/55">
                                                    Click to choose an audio file
                                                </p>
                                                <p className="font-mono text-[9px] text-[#1A1A1A]/35 mt-2">
                                                    MP3, WAV, OGG, M4A, FLAC · up to 60 MB
                                                </p>
                                            </div>
                                        )}
                                        <input
                                            id="audio"
                                            type="file"
                                            accept="audio/*"
                                            onChange={(e) =>
                                                setAudioFile(e.target.files?.[0] ?? null)
                                            }
                                            disabled={submitting}
                                            className="hidden"
                                        />
                                    </label>
                                </div>

                                <div>
                                    <label
                                        htmlFor="trackCover"
                                        className="block font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/70 mb-2"
                                    >
                                        Cover image{' '}
                                        <span className="text-[#1A1A1A]/40 normal-case tracking-normal">
                                            (optional)
                                        </span>
                                    </label>
                                    <label
                                        htmlFor="trackCover"
                                        className="block border border-dashed border-[#1A1A1A]/25 hover:border-[#1A1A1A]/55 transition-colors cursor-pointer"
                                    >
                                        {coverFile && coverPreview ? (
                                            <div className="flex items-center gap-3 p-3">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={coverPreview}
                                                    alt=""
                                                    className="w-14 h-14 object-cover bg-[#1A1A1A]/5"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-mono text-[11px] text-[#1A1A1A]/85 truncate">
                                                        {coverFile.name}
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            setCoverFile(null)
                                                        }}
                                                        className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1A1A]/45 hover:text-[#1A1A1A] mt-1 transition-colors"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="px-4 py-5 text-center">
                                                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/55">
                                                    Click to choose an image
                                                </p>
                                                <p className="font-mono text-[9px] text-[#1A1A1A]/35 mt-1">
                                                    PNG, JPG, WEBP · up to 8 MB
                                                </p>
                                            </div>
                                        )}
                                        <input
                                            id="trackCover"
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) =>
                                                setCoverFile(e.target.files?.[0] ?? null)
                                            }
                                            disabled={submitting}
                                            className="hidden"
                                        />
                                    </label>
                                </div>

                                <div>
                                    <label
                                        htmlFor="version"
                                        className="block font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/70 mb-2"
                                    >
                                        Version
                                    </label>
                                    <input
                                        id="version"
                                        type="number"
                                        min={1}
                                        value={version}
                                        onChange={(e) => setVersion(e.target.value)}
                                        disabled={submitting}
                                        className="w-full bg-transparent border-b border-[#1A1A1A]/20 focus:border-[#1A1A1A] outline-none py-2 font-mono text-lg font-bold text-[#1A1A1A] transition-colors disabled:opacity-50"
                                    />
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
                                    disabled={submitting}
                                    className="w-full font-mono text-[10px] tracking-[0.2em] uppercase px-4 py-3 bg-[#1A1A1A] text-[#F5F1E8] hover:bg-[#8C7A6B] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#1A1A1A]"
                                >
                                    {submitting ? 'Uploading…' : 'Add track →'}
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
