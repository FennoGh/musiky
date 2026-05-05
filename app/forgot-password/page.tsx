'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
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

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        // Fire-and-forget. We always show the same success state regardless
        // of the response — this prevents email-enumeration attacks.
        try {
            await fetch(`${API_BASE}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            }).catch(() => null)
        } finally {
            setLoading(false)
            setSent(true)
        }
    }

    return (
        <section className="min-h-screen flex items-center justify-center px-6 md:px-12 lg:px-24 pt-28 pb-16 relative overflow-hidden">
            {/* Background watermark */}
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
                Forgot / Reset / Recover
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
                    {sent ? 'Inbox check' : 'Account recovery'}
                </motion.p>

                {/* Headline — mixed typography */}
                <div className="mb-6 text-center">
                    <div className="overflow-hidden">
                        <motion.h1
                            key={sent ? 'sent-1' : 'idle-1'}
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            className="font-serif text-[12vw] sm:text-5xl font-normal italic leading-[1] tracking-tight text-[#1A1A1A]"
                        >
                            {sent ? 'Check your' : 'Reset your'}
                        </motion.h1>
                    </div>
                    <div className="overflow-hidden">
                        <motion.h1
                            key={sent ? 'sent-2' : 'idle-2'}
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            transition={{ duration: 1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
                            className="font-mono text-[12vw] sm:text-5xl font-bold leading-[1] tracking-tighter text-[#1A1A1A]"
                        >
                            {sent ? 'inbox.' : 'password.'}
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

                {!sent ? (
                    <>
                        {/* Description */}
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.9 }}
                            className="font-mono text-[11px] tracking-wider text-[#1A1A1A]/70 leading-relaxed text-center mb-10"
                        >
                            Enter the email tied to your account and we&apos;ll send you a link
                            to set a new password.
                        </motion.p>

                        {/* Form */}
                        <motion.form
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 1.0 }}
                            onSubmit={handleSubmit}
                            className="flex flex-col gap-6"
                        >
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

                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-4 px-8 py-3.5 bg-[#1A1A1A] text-[#F5F1E8] text-sm tracking-wide hover:bg-[#8C7A6B] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Sending…' : 'Send reset link'}
                            </button>
                        </motion.form>
                    </>
                ) : (
                    /* Success state */
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.9 }}
                        className="flex flex-col gap-6"
                    >
                        <div className="flex items-center gap-3 px-5 py-4 border border-[#1A1A1A]/20">
                            <div className="w-1.5 h-1.5 bg-[#8C7A6B] animate-pulse-dot" />
                            <p className="font-mono text-[10px] tracking-wider uppercase text-[#1A1A1A]/85">
                                Reset link sent
                            </p>
                        </div>

                        <p className="font-mono text-[11px] tracking-wider text-[#1A1A1A]/70 leading-relaxed text-center">
                            If <span className="text-[#1A1A1A]">{email}</span> matches an
                            account, you&apos;ll receive an email with instructions in the
                            next few minutes. Check your spam folder if you don&apos;t see
                            it.
                        </p>

                        <button
                            type="button"
                            onClick={() => {
                                setSent(false)
                                setEmail('')
                            }}
                            className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-colors duration-200"
                        >
                            Try a different email
                        </button>
                    </motion.div>
                )}

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 1.3 }}
                    className="flex items-center justify-between pt-8 mt-10 border-t border-[#1A1A1A]/[0.08]"
                >
                    <p className="font-mono text-[10px] tracking-wider text-[#1A1A1A]/60 uppercase">
                        Remembered it?
                    </p>
                    <Link
                        href="/login"
                        className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/85 hover:text-[#1A1A1A] transition-colors duration-200"
                    >
                        ← Back to sign in
                    </Link>
                </motion.div>
            </div>

            {/* Bottom marker */}
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
