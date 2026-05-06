'use client'

import { motion } from 'framer-motion'

export default function CTA() {
    return (
        <section className="relative min-h-screen flex flex-col justify-center bg-[#1A1A1A] overflow-hidden">
            {/* Giant background word */}
            <motion.span
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5 }}
                className="absolute inset-0 flex items-center justify-center font-mono text-[22vw] md:text-[18vw] font-bold leading-none text-[#F5F1E8]/[0.03] select-none pointer-events-none"
            >
                MUSIKY
            </motion.span>

            <div className="relative z-10 px-6 md:px-12 lg:px-24 py-24">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <p className="font-mono text-xs tracking-[0.3em] uppercase text-[#F5F1E8]/30 mb-6">
                            Start now
                        </p>

                        <h2 className="text-5xl md:text-8xl lg:text-9xl font-bold tracking-tighter text-[#F5F1E8] leading-[0.85] mb-8">
                            Stop<br />
                            managing<br />
                            <span className="text-[#8C7A6B]">chaos.</span>
                        </h2>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-xl md:text-2xl text-[#F5F1E8]/50 max-w-xl mb-12 leading-relaxed"
                    >
                        Join the music teams that already collaborate, distribute,
                        and get paid without drama.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="flex flex-col sm:flex-row gap-4 mb-20"
                    >
                        <a
                            href="/register"
                            className="group relative px-12 py-5 bg-[#8C7A6B] text-[#F5F1E8] text-sm font-medium tracking-wide hover:bg-[#F5F1E8] hover:text-[#1A1A1A] transition-colors duration-200 inline-flex items-center gap-3"
                        >
                            Start free
                            <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </a>
                        <a
                            href="#como-funciona"
                            className="px-12 py-5 border border-[#F5F1E8]/15 text-[#F5F1E8] text-sm font-medium tracking-wide hover:border-[#F5F1E8]/50 transition-colors duration-200"
                        >
                            See how it works
                        </a>
                    </motion.div>

                    {/* Bottom strip */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                        className="pt-10 border-t border-[#F5F1E8]/10"
                    >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                            <div className="flex items-center gap-6">
                                <div className="flex gap-0.5">
                                    {['C', 'L', 'M', 'A', 'P', 'R', 'S'].map((initial, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            whileInView={{ opacity: 1, scale: 1 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.6 + i * 0.05 }}
                                            className="w-8 h-8 bg-[#F5F1E8]/10 text-[#F5F1E8] flex items-center justify-center text-[10px] font-mono font-bold"
                                        >
                                            {initial}
                                        </motion.div>
                                    ))}
                                </div>
                                <span className="text-sm text-[#F5F1E8]/50">
                                    <span className="font-medium text-[#F5F1E8]">500+</span> artists already on Musiky
                                </span>
                            </div>

                            <div className="flex items-center gap-8 text-[#F5F1E8]/20">
                                <span className="font-mono text-[10px] tracking-wider uppercase">No card required</span>
                                <span className="font-mono text-[10px] tracking-wider uppercase">2 min setup</span>
                                <span className="font-mono text-[10px] tracking-wider uppercase">Free plan available</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Bottom accent line */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#F5F1E8]/10" />
        </section>
    )
}
