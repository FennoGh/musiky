'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'

function SoundWave() {
    const bars = useMemo(() => {
        const result = []
        for (let i = 0; i < 80; i++) {
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
        <div className="flex items-center justify-center gap-[2px] h-12 sm:h-16 opacity-[0.15] overflow-hidden">
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

function NowPlaying() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.3 }}
            className="inline-flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 border border-[#1A1A1A]/[0.06] max-w-full"
        >
            {/* Mini equalizer */}
            <div className="flex items-end gap-[2px] h-3 shrink-0">
                {[0.6, 1, 0.4, 0.8, 0.5].map((scale, i) => (
                    <motion.div
                        key={i}
                        className="w-[2px] bg-[#8C7A6B]"
                        animate={{ height: ['40%', `${scale * 100}%`, '30%', `${scale * 80}%`] }}
                        transition={{ duration: 0.6 + i * 0.1, repeat: Infinity, ease: 'easeInOut' }}
                    />
                ))}
            </div>
            <div className="min-w-0">
                <p className="font-mono text-[9px] text-[#1A1A1A]/25 uppercase tracking-wider">Now playing</p>
                <p className="font-mono text-xs text-[#1A1A1A]/70 truncate">Verano en Madrid <span className="text-[#1A1A1A]/25 hidden sm:inline">/ 4 collaborators</span></p>
            </div>
            <div className="hidden sm:flex items-center gap-2 ml-2 shrink-0">
                <span className="font-mono text-[9px] text-[#1A1A1A]/20">2:18</span>
                <div className="w-16 h-[1.5px] bg-[#1A1A1A]/[0.06]">
                    <motion.div
                        className="h-full bg-[#8C7A6B]/50"
                        initial={{ width: '0%' }}
                        animate={{ width: '62%' }}
                        transition={{ duration: 2.5, delay: 1.5, ease: 'easeOut' }}
                    />
                </div>
            </div>
        </motion.div>
    )
}

export default function Hero() {
    return (
        <section className="flex flex-col justify-between pt-28 sm:pt-32 md:pt-40 pb-8 px-6 md:px-12 lg:px-24 relative overflow-hidden">
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
                Collaborate / Distribute / Get paid
            </motion.span>

            {/* Subtle decorative line top-right */}
            <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 1.2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="absolute right-24 top-32 w-[1px] h-32 bg-[#1A1A1A]/[0.04] origin-top hidden lg:block"
            />

            {/* Main content */}
            <div className="flex-1 flex flex-col justify-center items-center relative z-10">
                <div className="flex flex-col items-center text-center max-w-4xl">
                    {/* Label */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        className="font-mono text-[10px] tracking-[0.3em] sm:tracking-[0.4em] uppercase text-[#1A1A1A]/25 mb-6 sm:mb-10"
                    >
                        For those who create together
                    </motion.p>

                    {/* Headline - mixed typography */}
                    <div className="mb-6 sm:mb-10">
                        <div className="overflow-hidden">
                            <motion.h1
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                className="font-serif text-[11vw] md:text-[7vw] lg:text-[5.5vw] font-normal italic leading-[1] tracking-tight text-[#1A1A1A]"
                            >
                                Music made together,
                            </motion.h1>
                        </div>
                        <div className="overflow-hidden">
                            <motion.h1
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                transition={{ duration: 1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                className="font-mono text-[11vw] md:text-[7vw] lg:text-[5.5vw] font-bold leading-[1] tracking-tighter text-[#1A1A1A]"
                            >
                                paid apart.
                            </motion.h1>
                        </div>
                    </div>

                    {/* Sound wave */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.5, delay: 0.8 }}
                        className="w-full max-w-md mb-10"
                    >
                        <SoundWave />
                    </motion.div>

                    {/* Description */}
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 1.0 }}
                        className="max-w-md text-[#1A1A1A]/35 leading-relaxed mb-10"
                    >
                        Manage projects, distribute to 150+ platforms, split royalties
                        automatically. The quiet engine behind music teams.
                    </motion.p>

                    {/* CTAs */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 1.15 }}
                        className="flex flex-wrap justify-center gap-4 mb-8"
                    >
                        <a
                            href="/register"
                            className="px-8 py-3.5 bg-[#1A1A1A] text-[#F5F1E8] text-sm tracking-wide hover:bg-[#8C7A6B] transition-colors duration-300"
                        >
                            Start free
                        </a>
                        <a
                            href="#como-funciona"
                            className="px-8 py-3.5 border border-[#1A1A1A]/[0.08] text-sm tracking-wide text-[#1A1A1A]/50 hover:border-[#1A1A1A]/30 hover:text-[#1A1A1A] transition-all duration-300"
                        >
                            See how it works
                        </a>
                    </motion.div>

                    {/* Now Playing */}
                    <NowPlaying />
                </div>
            </div>

            {/* Bottom bar */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.6 }}
                className="flex items-center justify-between pt-8 border-t border-[#1A1A1A]/[0.04] mt-16"
            >
                {/* Mobile stats */}
                <div className="flex items-center gap-10 lg:hidden">
                    {[
                        { value: '150+', label: 'Platforms' },
                        { value: '100%', label: 'Royalties' },
                    ].map((stat, i) => (
                        <div key={i}>
                            <p className="font-mono text-lg font-bold text-[#1A1A1A]">{stat.value}</p>
                            <p className="font-mono text-[9px] uppercase tracking-wider text-[#1A1A1A]/20 mt-0.5">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Desktop: copyright-style text */}
                <p className="font-mono text-[9px] text-[#1A1A1A]/15 tracking-wider hidden lg:block">
                    The platform for music teams
                </p>

                {/* Scroll */}
                <div className="flex items-center gap-3">
                    <motion.div
                        animate={{ y: [0, 4, 0] }}
                        transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                        className="w-[1px] h-5 bg-[#1A1A1A]/[0.08]"
                    />
                    <span className="font-mono text-[9px] uppercase tracking-wider text-[#1A1A1A]/15 [writing-mode:vertical-lr]">
                        Scroll
                    </span>
                </div>
            </motion.div>
        </section>
    )
}
