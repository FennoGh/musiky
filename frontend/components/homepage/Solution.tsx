'use client'

import { motion } from 'framer-motion'

const solutions = [
    {
        number: '01',
        title: 'Global distribution',
        description: 'Your music on 150+ platforms with one click. Spotify, Apple Music, YouTube, TikTok, and every platform that matters.',
        stat: '150+',
        statLabel: 'platforms',
    },
    {
        number: '02',
        title: 'Real-time analytics',
        description: 'Streams, revenue, countries, trends. Real data to make real decisions about your career.',
        stat: '24/7',
        statLabel: 'live data',
    },
    {
        number: '03',
        title: 'Legal contracts',
        description: 'Electronic signatures with full legal validity (eIDAS). Define splits, sign in seconds, protect every collaborator.',
        stat: '100%',
        statLabel: 'legally binding',
    },
]

export default function Solution() {
    return (
        <section className="py-24 md:py-32 px-6 md:px-12 lg:px-48 bg-[#1A1A1A]">
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mb-16"
                >
                    <p className="font-mono text-xs tracking-[0.3em] uppercase text-[#F5F1E8]/40 mb-4">
                        The solution
                    </p>
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#F5F1E8] leading-tight">
                        One platform.<br />
                        <span className="text-[#8C7A6B]">Everything under control.</span>
                    </h2>
                </motion.div>

                <div className="space-y-0">
                    {solutions.map((solution, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.4 }}
                            className="border-t border-[#F5F1E8]/10 py-10 md:py-12 grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 group"
                        >
                            <div className="md:col-span-1">
                                <span className="font-mono text-xs text-[#8C7A6B]">{solution.number}</span>
                            </div>
                            <div className="md:col-span-3">
                                <h3 className="text-xl font-bold text-[#F5F1E8]">{solution.title}</h3>
                            </div>
                            <div className="md:col-span-5">
                                <p className="text-[#F5F1E8]/50 leading-relaxed text-sm">
                                    {solution.description}
                                </p>
                            </div>
                            <div className="md:col-span-3 md:text-right">
                                <span className="font-mono text-3xl font-bold text-[#F5F1E8]">{solution.stat}</span>
                                <p className="text-xs text-[#F5F1E8]/30 mt-1">{solution.statLabel}</p>
                            </div>
                        </motion.div>
                    ))}
                    <div className="border-t border-[#F5F1E8]/10" />
                </div>
            </div>
        </section>
    )
}
