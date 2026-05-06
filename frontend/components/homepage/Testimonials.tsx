'use client'

import { motion } from 'framer-motion'

const quotes = [
    {
        text: 'We used to lose weeks figuring out who gets paid what. Now it takes five minutes and the system handles the rest.',
        name: 'Maria Garcia',
        role: 'Producer',
        project: '12 projects managed',
    },
    {
        text: 'I signed my first digital contract in 30 seconds. My lawyer said it took him longer to open the PDF.',
        name: 'Carlos Ruiz',
        role: 'Artist',
        project: '8 collaborations',
    },
    {
        text: 'Finally, a platform that understands music is made by teams, not individuals. The transparency changed everything.',
        name: 'Alex Vega',
        role: 'Manager',
        project: '23 artists managed',
    },
]

const miniQuotes = [
    { text: 'No more spreadsheets for splits', name: 'Luna B.', role: 'Beatmaker' },
    { text: 'Contracts signed in 2 minutes', name: 'Diego M.', role: 'Artist' },
    { text: 'Zero drama with payments', name: 'Sara L.', role: 'Producer' },
    { text: 'Total transparency with my team', name: 'Pablo N.', role: 'Manager' },
    { text: 'Reports I actually understand', name: 'Ana T.', role: 'Artist' },
    { text: 'Best decision this year', name: 'Elena P.', role: 'Artist' },
]

export default function Testimonials() {
    return (
        <section className="py-24 md:py-32 overflow-hidden relative">
            {/* Giant quotation mark */}
            <span className="absolute left-[5%] top-[5%] font-serif text-[40vw] leading-none text-[#1A1A1A]/[0.03] select-none pointer-events-none">
                &ldquo;
            </span>

            <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="mb-16"
                >
                    <p className="font-mono text-xs tracking-[0.3em] uppercase text-[#4A4A4A] mb-4">Testimonials</p>
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-[0.9]">
                        Real teams.<br />
                        <span className="text-[#8C7A6B]">Real words.</span>
                    </h2>
                </motion.div>

                {/* Large editorial quotes */}
                <div className="space-y-0 mb-16">
                    {quotes.map((quote, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, delay: i * 0.15 }}
                            className="border-t border-[#1A1A1A]/10 py-12 md:py-16 group"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                <div className="lg:col-span-1">
                                    <span className="font-mono text-xs text-[#4A4A4A]/30">
                                        {String(i + 1).padStart(2, '0')}
                                    </span>
                                </div>
                                <div className="lg:col-span-8">
                                    <p className="font-serif text-2xl md:text-4xl italic leading-snug text-[#1A1A1A]">
                                        &ldquo;{quote.text}&rdquo;
                                    </p>
                                </div>
                                <div className="lg:col-span-3 flex lg:flex-col lg:justify-end lg:items-end gap-4 lg:gap-1">
                                    <p className="text-sm font-medium">{quote.name}</p>
                                    <p className="font-mono text-xs text-[#4A4A4A]">{quote.role}</p>
                                    <p className="font-mono text-[10px] text-[#4A4A4A]/40">{quote.project}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    <div className="border-t border-[#1A1A1A]/10" />
                </div>

                {/* Scrolling mini-quotes ticker */}
                <div className="relative overflow-hidden">
                    <div className="flex gap-[1px] animate-marquee-left">
                        {[...miniQuotes, ...miniQuotes].map((q, i) => (
                            <div
                                key={i}
                                className="flex-shrink-0 px-6 py-4 bg-[#1A1A1A] text-[#F5F1E8] flex items-center gap-4"
                            >
                                <span className="font-serif italic text-sm whitespace-nowrap">&ldquo;{q.text}&rdquo;</span>
                                <span className="text-[#F5F1E8]/20">/</span>
                                <span className="text-xs whitespace-nowrap">
                                    <span className="font-medium">{q.name}</span>
                                    <span className="text-[#F5F1E8]/40 ml-1 font-mono text-[10px]">{q.role}</span>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
