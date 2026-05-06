'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

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

export default function NewProjectPage() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [title, setTitle] = useState('')
    const [coverFile, setCoverFile] = useState<File | null>(null)
    const [coverPreview, setCoverPreview] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!getToken()) {
            router.replace('/login')
            return
        }
        let cancelled = false
        ;(async () => {
            try {
                const me = await apiFetch<User>('/me')
                if (!cancelled) setUser(me)
            } catch (err) {
                if (cancelled) return
                if (err instanceof ApiError && err.status === 401) {
                    router.replace('/login')
                }
            }
        })()
        return () => {
            cancelled = true
        }
    }, [router])

    useEffect(() => {
        if (!coverFile) {
            setCoverPreview(null)
            return
        }
        const url = URL.createObjectURL(coverFile)
        setCoverPreview(url)
        return () => URL.revokeObjectURL(url)
    }, [coverFile])

    function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null
        setCoverFile(file)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)

        const trimmed = title.trim()
        if (trimmed.length < 2) {
            setError('Title must be at least 2 characters')
            return
        }

        setSubmitting(true)
        try {
            let coverUrl: string | null = null
            if (coverFile) {
                const fd = new FormData()
                fd.append('file', coverFile)
                const uploaded = await apiFetch<{ url: string }>('/uploads/cover', {
                    method: 'POST',
                    body: fd,
                })
                coverUrl = uploaded.url
            }

            const project = await apiFetch<Project>('/projects', {
                method: 'POST',
                body: JSON.stringify({
                    title: trimmed,
                    coverUrl,
                }),
            })
            router.replace(`/dashboard/projects/${project.id}`)
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                router.replace('/login')
                return
            }
            setError(err instanceof Error ? err.message : 'Could not create project')
            setSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#F5F1E8] text-[#1A1A1A]">
            <DashboardHeader user={user} />

            <main className="px-6 md:px-12 lg:px-24 pt-32 pb-24 max-w-3xl mx-auto">
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
                    <span className="text-[#1A1A1A]/85">New project</span>
                </motion.div>

                {/* Hero */}
                <section className="mb-14">
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#1A1A1A]/60 mb-4"
                    >
                        Start something
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
                                Create your
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
                                next project.
                            </motion.h1>
                        </div>
                    </div>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="font-mono text-[11px] tracking-wider text-[#1A1A1A]/60 mt-6 max-w-md"
                    >
                        Give it a name. You will own 100% of the splits until you invite
                        collaborators.
                    </motion.p>
                </section>

                {/* Form */}
                <motion.form
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                    onSubmit={handleSubmit}
                    className="space-y-8"
                >
                    <div>
                        <label
                            htmlFor="title"
                            className="block font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/70 mb-3"
                        >
                            Project title
                        </label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={submitting}
                            placeholder="Verano en Madrid"
                            autoFocus
                            maxLength={120}
                            className="w-full bg-transparent border-b border-[#1A1A1A]/20 focus:border-[#1A1A1A] outline-none py-3 font-mono text-2xl tracking-tight text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 transition-colors disabled:opacity-50"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="cover"
                            className="block font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/70 mb-3"
                        >
                            Cover image{' '}
                            <span className="text-[#1A1A1A]/40 normal-case tracking-normal">
                                (optional)
                            </span>
                        </label>
                        <label
                            htmlFor="cover"
                            className="block border border-dashed border-[#1A1A1A]/25 hover:border-[#1A1A1A]/55 transition-colors cursor-pointer"
                        >
                            {coverPreview ? (
                                <div className="flex items-center gap-4 p-4">
                                    <img
                                        src={coverPreview}
                                        alt=""
                                        className="w-20 h-20 object-cover bg-[#1A1A1A]/5"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="font-mono text-[11px] text-[#1A1A1A]/85 truncate">
                                            {coverFile?.name}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                setCoverFile(null)
                                            }}
                                            className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1A1A]/45 hover:text-[#1A1A1A] mt-2 transition-colors"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="px-5 py-10 text-center">
                                    <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/55">
                                        Click to choose an image
                                    </p>
                                    <p className="font-mono text-[9px] text-[#1A1A1A]/35 mt-2">
                                        PNG, JPG, WEBP · up to 8 MB
                                    </p>
                                </div>
                            )}
                            <input
                                id="cover"
                                type="file"
                                accept="image/*"
                                onChange={handleCoverChange}
                                disabled={submitting}
                                className="hidden"
                            />
                        </label>
                    </div>

                    {/* What happens next */}
                    <div className="border-l-2 border-[#1A1A1A]/15 pl-5 py-2">
                        <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/55 mb-3">
                            What happens next
                        </p>
                        <ul className="space-y-2 font-mono text-[11px] text-[#1A1A1A]/70 leading-relaxed">
                            <li className="flex gap-3">
                                <span className="text-[#1A1A1A]/35 shrink-0">01.</span>
                                You become the sole collaborator with a 100% split
                            </li>
                            <li className="flex gap-3">
                                <span className="text-[#1A1A1A]/35 shrink-0">02.</span>
                                Add other Musiky users by email and rebalance splits
                            </li>
                            <li className="flex gap-3">
                                <span className="text-[#1A1A1A]/35 shrink-0">03.</span>
                                Upload tracks and distribute to streaming platforms
                            </li>
                        </ul>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-3 px-4 py-3 border border-[#1A1A1A]/20"
                        >
                            <div className="w-1.5 h-1.5 bg-[#8C7A6B] animate-pulse-dot rounded-full" />
                            <p className="font-mono text-[10px] tracking-wider uppercase text-[#1A1A1A]/85">
                                {error}
                            </p>
                        </motion.div>
                    )}

                    <div className="flex items-center justify-between gap-4 pt-6 border-t border-[#1A1A1A]/10">
                        <Link
                            href="/dashboard"
                            className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-colors"
                        >
                            ← Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={submitting || title.trim().length < 2}
                            className="font-mono text-[10px] tracking-[0.2em] uppercase px-6 py-3 bg-[#1A1A1A] text-[#F5F1E8] hover:bg-[#8C7A6B] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#1A1A1A]"
                        >
                            {submitting ? 'Creating…' : 'Create project →'}
                        </button>
                    </div>
                </motion.form>
            </main>
        </div>
    )
}
