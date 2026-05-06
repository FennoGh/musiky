'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://127.0.0.1:8000'

function SoundWave() {
    const bars = useMemo(() => {
        const result = []
        for (let i = 0; i < 60; i++) {
            const seed = Math.sin(i * 9301 + 49297) * 49297
            const rand = seed - Math.floor(seed)
            const h1 = 8 + rand * 92
            const h2 = 5 + ((rand * 73 + 0.3) % 1) * 95
            const h3 = 12 + ((rand * 47 + 0.7) % 1) * 88
            const dur = 1.5 + rand * 2
            result.push({ h1, h2, h3, dur })
        }
        return result
    }, [])

    return (
        <div className="flex items-center justify-center gap-[2px] h-8 opacity-[0.15] overflow-hidden">
            {bars.map((bar, i) => (
                <motion.div
                    key={i}
                    className="w-[1.5px] bg-[#8C7A6B] origin-center"
                    initial={{ height: `${bar.h1}%` }}
                    animate={{ height: [`${bar.h1}%`, `${bar.h2}%`, `${bar.h3}%`, `${bar.h1}%`] }}
                    transition={{
                        duration: bar.dur,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: i * 0.03,
                    }}
                />
            ))}
        </div>
    )
}

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        setLoading(true)
        try {
            const body = new URLSearchParams({ username: email, password })
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body,
            })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.detail ?? 'Invalid credentials')
            }
            const data = (await res.json()) as { access_token: string }
            localStorage.setItem('musiky_token', data.access_token)
            router.push('/dashboard')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <section className="min-h-screen flex items-center justify-center px-6 md:px-12 lg:px-24 pt-28 pb-16 relative overflow-hidden">
            {/* Background watermark — same monogram as Hero */}
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.025 }}
                transition={{ duration: 2, delay: 0.5 }}
                className="absolute -right-[8%] top-[8%] font-serif text-[42vw] italic font-normal leading-none select-none pointer-events-none"
            >
                M
            </motion.span>

            {/* Vertical side text */}
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1.5 }}
                className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2 font-mono text-[9px] tracking-[0.5em] uppercase text-[#1A1A1A]/[0.08] [writing-mode:vertical-lr] select-none hidden lg:block"
            >
                Welcome back / Sign in / Resume
            </motion.span>

            {/* Decorative line */}
            <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 1.2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="absolute left-24 top-40 w-[1px] h-32 bg-[#1A1A1A]/[0.04] origin-top hidden lg:block"
            />

            {/* Main card */}
            <div className="w-full max-w-md relative z-10">
                {/* Label */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="font-mono text-[10px] tracking-[0.3em] sm:tracking-[0.4em] uppercase text-[#1A1A1A]/60 mb-6 sm:mb-8 text-center"
                >
                    Welcome back
                </motion.p>

                {/* Headline — mixed typography like Hero */}
                <div className="mb-6 text-center">
                    <div className="overflow-hidden">
                        <motion.h1
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            className="font-serif text-[12vw] sm:text-5xl font-normal italic leading-[1] tracking-tight text-[#1A1A1A]"
                        >
                            Sign in to
                        </motion.h1>
                    </div>
                    <div className="overflow-hidden">
                        <motion.h1
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            transition={{ duration: 1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
                            className="font-mono text-[12vw] sm:text-5xl font-bold leading-[1] tracking-tighter text-[#1A1A1A]"
                        >
                            your workspace.
                        </motion.h1>
                    </div>
                </div>

                {/* Sound wave */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.5, delay: 0.8 }}
                    className="w-full max-w-xs mx-auto mb-10"
                >
                    <SoundWave />
                </motion.div>

                {/* Form */}
                <motion.form
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.0 }}
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-6"
                >
                    {/* Email */}
                    <div className="flex flex-col gap-2">
                        <label
                            htmlFor="email"
                            className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#1A1A1A]/70"
                        >
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-transparent border-b border-[#1A1A1A]/20 py-3 font-mono text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:outline-none focus:border-[#1A1A1A] transition-colors duration-200"
                            placeholder="carlos@example.com"
                        />
                    </div>

                    {/* Password */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <label
                                htmlFor="password"
                                className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#1A1A1A]/70"
                            >
                                Password
                            </label>
                            <Link
                                href="/forgot-password"
                                className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-colors duration-200"
                            >
                                Forgot?
                            </Link>
                        </div>
                        <input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-transparent border-b border-[#1A1A1A]/20 py-3 font-mono text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:outline-none focus:border-[#1A1A1A] transition-colors duration-200"
                            placeholder="••••••••"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3 px-4 py-3 border border-[#1A1A1A]/20"
                        >
                            <div className="w-1.5 h-1.5 bg-[#8C7A6B] animate-pulse-dot" />
                            <p className="font-mono text-[10px] tracking-wider uppercase text-[#1A1A1A]/85">
                                {error}
                            </p>
                        </motion.div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-4 px-8 py-3.5 bg-[#1A1A1A] text-[#F5F1E8] text-sm tracking-wide hover:bg-[#8C7A6B] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Signing in…' : 'Sign in'}
                    </button>
                </motion.form>

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 1.3 }}
                    className="flex items-center justify-between pt-8 mt-10 border-t border-[#1A1A1A]/[0.08]"
                >
                    <p className="font-mono text-[10px] tracking-wider text-[#1A1A1A]/60 uppercase">
                        New here?
                    </p>
                    <Link
                        href="/register"
                        className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/85 hover:text-[#1A1A1A] transition-colors duration-200"
                    >
                        Create account →
                    </Link>
                </motion.div>
            </div>

            {/* Bottom scroll-like marker */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.6 }}
                className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-3"
            >
                <div className="w-[1px] h-5 bg-[#1A1A1A]/20" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#1A1A1A]/55">
                    The platform for music teams
                </span>
                <div className="w-[1px] h-5 bg-[#1A1A1A]/20" />
            </motion.div>
        </section>
    )
}
