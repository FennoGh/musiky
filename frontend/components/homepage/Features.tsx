'use client'

import { motion } from 'framer-motion'

const features = [
    {
        number: '01',
        title: 'Automatic splits',
        description: 'Define percentages once. Every time royalties arrive, they split automatically. No spreadsheets. No chasing anyone.',
        visual: '$4,280.00',
        visualLabel: 'distributed this month',
    },
    {
        number: '02',
        title: 'Digital contracts',
        description: 'Legal electronic signatures with full eIDAS compliance. All collaborators sign in seconds, from anywhere in the world.',
        visual: '4/4',
        visualLabel: 'signatures completed',
    },
    {
        number: '03',
        title: '150+ platforms',
        description: 'Your music on Spotify, Apple Music, YouTube, TikTok, and every platform that matters. One click to distribute everywhere.',
        visual: '150+',
        visualLabel: 'platforms connected',
    },
    {
        number: '04',
        title: 'Live analytics',
        description: 'Streams, revenue, countries, trends. Real data updated in real time to make real decisions about your career.',
        visual: '24/7',
        visualLabel: 'live monitoring',
    },
    {
        number: '05',
        title: 'Clear finances',
        description: 'Log expenses, track revenue, calculate break-even. Always know who invested what and how much is left to recover.',
        visual: '62%',
        visualLabel: 'to break-even',
    },
    {
        number: '06',
        title: 'Auto payments',
        description: 'Set up your account and forget about it. When royalties come in, collaborators get paid automatically.',
        visual: '$0',
        visualLabel: 'hidden fees',
    },
]

export default function Features() {
    return (
        <section id="funcionalidades" className="py-24 md:py-32 px-6 md:px-12 lg:px-24 bg-[#1A1A1A] relative overflow-hidden">
            {/* Giant background number */}
            <span className="absolute -left-[5%] top-[10%] font-mono text-[25vw] font-bold leading-none text-[#F5F1E8]/[0.02] select-none pointer-events-none">
                02
            </span>

            <div className="max-w-7xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16"
                >
                    <div>
                        <p className="font-mono text-xs tracking-[0.3em] uppercase text-[#F5F1E8]/30 mb-4">Features</p>
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-[#F5F1E8] leading-[0.9]">
                            Everything<br />you need.
                        </h2>
                    </div>
                    <div className="flex flex-col justify-end">
                        <p className="text-lg text-[#F5F1E8]/50 leading-relaxed">
                            Six core tools that replace your entire workflow.
                            No bloat. No learning curve.
                        </p>
                    </div>
                </motion.div>

                {/* Feature grid - magazine layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-[#F5F1E8]/[0.06]">
                    {features.map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.08, duration: 0.5 }}
                            className="bg-[#1A1A1A] group cursor-default"
                        >
                            <div className="p-8 md:p-10 h-full flex flex-col relative overflow-hidden transition-colors duration-300 hover:bg-[#8C7A6B]">
                                {/* Large background number */}
                                <span className="absolute -right-2 -top-4 font-mono text-[120px] font-bold leading-none text-[#F5F1E8]/[0.03] group-hover:text-[#F5F1E8]/[0.08] transition-all duration-300 select-none">
                                    {feature.number}
                                </span>

                                <div className="relative z-10 flex flex-col h-full">
                                    <span className="font-mono text-[10px] text-[#8C7A6B] group-hover:text-[#F5F1E8]/60 transition-colors duration-300">
                                        {feature.number}
                                    </span>

                                    {/* Visual stat */}
                                    <div className="my-6">
                                        <p className="font-mono text-4xl md:text-5xl font-bold text-[#F5F1E8] leading-none">
                                            {feature.visual}
                                        </p>
                                        <p className="font-mono text-[10px] text-[#F5F1E8]/20 group-hover:text-[#F5F1E8]/50 mt-2 uppercase tracking-wider transition-colors duration-300">
                                            {feature.visualLabel}
                                        </p>
                                    </div>

                                    <h3 className="text-lg font-bold text-[#F5F1E8] mb-3">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm text-[#F5F1E8]/30 group-hover:text-[#F5F1E8]/70 leading-relaxed transition-colors duration-300 mt-auto">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
