'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'

function AnimatedCounter({ target, prefix = '', suffix = '', delay = 0 }: { target: number; prefix?: string; suffix?: string; delay?: number }) {
    const ref = useRef<HTMLSpanElement>(null)
    const isInView = useInView(ref, { once: true })
    const [count, setCount] = useState(0)

    useEffect(() => {
        if (!isInView) return
        const timeout = setTimeout(() => {
            const duration = 1500
            const steps = 40
            const increment = target / steps
            let current = 0
            const interval = setInterval(() => {
                current += increment
                if (current >= target) {
                    setCount(target)
                    clearInterval(interval)
                } else {
                    setCount(Math.floor(current))
                }
            }, duration / steps)
            return () => clearInterval(interval)
        }, delay)
        return () => clearTimeout(timeout)
    }, [isInView, target, delay])

    return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>
}

function LiveDashboard() {
    const [activityIndex, setActivityIndex] = useState(0)

    const activities = [
        { text: 'System distributed $87.20 to 4 collaborators', time: 'just now' },
        { text: 'Laura signed the split contract', time: '2m ago' },
        { text: 'New stream data: +342 plays on Spotify', time: '5m ago' },
        { text: 'Carlos uploaded master v2.1', time: '12m ago' },
        { text: 'Auto-payment: $26.16 sent to Mike', time: '1h ago' },
        { text: 'Ana approved release artwork', time: '2h ago' },
    ]

    useEffect(() => {
        const interval = setInterval(() => {
            setActivityIndex(prev => (prev + 1) % activities.length)
        }, 3000)
        return () => clearInterval(interval)
    }, [activities.length])

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-[#F5F1E8] border border-[#1A1A1A] shadow-[8px_8px_0px_0px_#8C7A6B]"
        >
            {/* Window chrome */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#1A1A1A]/10">
                <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                        <div className="w-2.5 h-2.5 bg-[#8C7A6B]" />
                        <div className="w-2.5 h-2.5 border border-[#1A1A1A]/20" />
                        <div className="w-2.5 h-2.5 border border-[#1A1A1A]/20" />
                    </div>
                    <span className="font-mono text-[10px] text-[#4A4A4A]">musiky://project/verano-en-madrid</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 animate-pulse-dot" />
                    <span className="font-mono text-[10px] text-green-700">LIVE</span>
                </div>
            </div>

            <div className="p-6 md:p-8">
                {/* Project title */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h3 className="font-mono text-xl font-bold">Verano en Madrid</h3>
                        <p className="text-xs text-[#4A4A4A] mt-1">4 collaborators / All contracts signed / Distributing</p>
                    </div>
                    <span className="font-mono text-[10px] px-3 py-1.5 bg-green-700 text-white">LIVE ON 7 PLATFORMS</span>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="p-4 bg-[#1A1A1A] text-[#F5F1E8]">
                        <p className="font-mono text-[10px] uppercase tracking-wider opacity-40">Streams</p>
                        <p className="font-mono text-2xl font-bold mt-1">
                            <AnimatedCounter target={12450} />
                        </p>
                        <p className="font-mono text-[10px] text-green-400 mt-1">+15.3% this week</p>
                    </div>
                    <div className="p-4 bg-[#1A1A1A] text-[#F5F1E8]">
                        <p className="font-mono text-[10px] uppercase tracking-wider opacity-40">Revenue</p>
                        <p className="font-mono text-2xl font-bold mt-1 text-green-400">
                            $<AnimatedCounter target={280} delay={200} />.45
                        </p>
                        <p className="font-mono text-[10px] opacity-40 mt-1">3 auto-payments</p>
                    </div>
                    <div className="p-4 bg-[#1A1A1A] text-[#F5F1E8]">
                        <p className="font-mono text-[10px] uppercase tracking-wider opacity-40">Break-even</p>
                        <p className="font-mono text-2xl font-bold mt-1">
                            <AnimatedCounter target={62} delay={400} suffix="%" />
                        </p>
                        <p className="font-mono text-[10px] opacity-40 mt-1">$169.55 remaining</p>
                    </div>
                    <div className="p-4 bg-[#1A1A1A] text-[#F5F1E8]">
                        <p className="font-mono text-[10px] uppercase tracking-wider opacity-40">Countries</p>
                        <p className="font-mono text-2xl font-bold mt-1">
                            <AnimatedCounter target={23} delay={600} />
                        </p>
                        <p className="font-mono text-[10px] opacity-40 mt-1">Top: Spain (45%)</p>
                    </div>
                </div>

                {/* Split visualization + Activity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Split bars */}
                    <div className="border border-[#1A1A1A]/10">
                        <div className="px-4 py-2.5 bg-[#1A1A1A]/[0.03] border-b border-[#1A1A1A]/10">
                            <span className="font-mono text-[10px] uppercase tracking-wider text-[#4A4A4A]">Split allocation / 100%</span>
                        </div>
                        <div className="p-4 space-y-4">
                            {[
                                { name: 'Carlos G.', role: 'Owner', split: 40, earned: '$112.18', color: 'bg-[#8C7A6B]' },
                                { name: 'Laura M.', role: 'Producer', split: 30, earned: '$84.14', color: 'bg-[#1A1A1A]' },
                                { name: 'Mike J.', role: 'Composer', split: 25, earned: '$70.11', color: 'bg-[#4A4A4A]' },
                                { name: 'Ana L.', role: 'Vocalist', split: 5, earned: '$14.02', color: 'bg-[#4A4A4A]/60' },
                            ].map((member, i) => (
                                <div key={i} className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 bg-[#1A1A1A] text-[#F5F1E8] text-[8px] font-mono font-bold flex items-center justify-center">
                                                {member.name[0]}
                                            </div>
                                            <span className="text-xs font-medium">{member.name}</span>
                                            <span className="font-mono text-[10px] text-[#4A4A4A]">{member.role}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-[10px] text-green-700">{member.earned}</span>
                                            <span className="font-mono text-xs font-bold">{member.split}%</span>
                                        </div>
                                    </div>
                                    <div className="h-2 bg-[#1A1A1A]/5">
                                        <motion.div
                                            className={`h-full ${member.color}`}
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${member.split}%` }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 1, delay: 0.5 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Live activity feed */}
                    <div className="border border-[#1A1A1A]/10">
                        <div className="px-4 py-2.5 bg-[#1A1A1A]/[0.03] border-b border-[#1A1A1A]/10 flex items-center justify-between">
                            <span className="font-mono text-[10px] uppercase tracking-wider text-[#4A4A4A]">Live activity</span>
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-green-500 animate-pulse-dot" />
                                <span className="font-mono text-[10px] text-green-700">streaming</span>
                            </div>
                        </div>
                        <div className="p-4 space-y-3">
                            {activities.map((activity, i) => (
                                <motion.div
                                    key={activity.text}
                                    animate={{
                                        opacity: i === activityIndex ? 1 : i === (activityIndex + 1) % activities.length ? 0.6 : 0.25,
                                        x: i === activityIndex ? 0 : 0,
                                        scale: i === activityIndex ? 1 : 0.98,
                                    }}
                                    transition={{ duration: 0.3 }}
                                    className="flex items-start gap-3"
                                >
                                    <span className={`w-1.5 h-1.5 mt-1.5 shrink-0 ${i === activityIndex ? 'bg-[#8C7A6B]' : 'bg-[#1A1A1A]/20'}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs truncate">{activity.text}</p>
                                        <p className="font-mono text-[10px] text-[#4A4A4A]/50 mt-0.5">{activity.time}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

export default function Collaboration() {
    return (
        <section className="py-24 md:py-32 px-6 md:px-12 lg:px-24 bg-[#1A1A1A] relative overflow-hidden">
            {/* Giant background text */}
            <span className="absolute -right-[10%] top-[5%] font-mono text-[30vw] font-bold leading-none text-[#F5F1E8]/[0.04] select-none pointer-events-none">
                01
            </span>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="mb-4"
                >
                    <span className="font-mono text-xs tracking-[0.3em] uppercase text-[#F5F1E8]/40">
                        Exclusive
                    </span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12"
                >
                    <div>
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-[#F5F1E8] leading-[0.9]">
                            One dashboard.<br />
                            Zero chaos.
                        </h2>
                    </div>
                    <div className="flex flex-col justify-end">
                        <p className="text-lg text-[#F5F1E8]/70 leading-relaxed">
                            Everything your team needs in a single shared workspace.
                            Splits, contracts, finances, distribution, analytics.
                            All live. All transparent.
                        </p>
                    </div>
                </motion.div>

                {/* The live dashboard */}
                <LiveDashboard />

                {/* Testimonial */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="mt-12 pt-8 border-t border-[#F5F1E8]/20 flex flex-col md:flex-row md:items-end md:justify-between gap-6"
                >
                    <p className="font-serif text-xl md:text-2xl italic text-[#F5F1E8]/80 max-w-lg leading-relaxed">
                        &ldquo;We used to spend weeks sorting out splits. With Musiky we do it in 5 minutes and everyone gets paid automatically.&rdquo;
                    </p>
                    <div className="shrink-0">
                        <p className="text-sm font-medium text-[#F5F1E8]">Maria Garcia</p>
                        <p className="font-mono text-xs text-[#F5F1E8]/40">Music producer</p>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
