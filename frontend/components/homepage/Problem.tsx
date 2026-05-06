'use client'

import { motion } from 'framer-motion'

function ChatWindow() {
    return (
        <div
            className="absolute w-[200px] sm:w-[260px] md:w-[300px] bg-white border border-[#1A1A1A]/10 shadow-[3px_3px_0px_0px_rgba(26,26,26,0.08)] animate-chaos"
            style={{ '--rotate': '-3deg', top: '5%', left: '2%' } as React.CSSProperties}
        >
            <div className="px-3 py-2 border-b border-[#1A1A1A]/5 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="font-mono text-[10px] text-[#4A4A4A]">WhatsApp - Splits Verano</span>
            </div>
            <div className="p-3 space-y-2 text-xs">
                <div className="bg-[#dcf8c6] px-3 py-1.5 max-w-[80%] ml-auto">
                    bro I was promised 30% not 25
                </div>
                <div className="bg-[#F5F1E8] px-3 py-1.5 max-w-[80%]">
                    wait, I have it written down differently
                </div>
                <div className="bg-[#dcf8c6] px-3 py-1.5 max-w-[80%] ml-auto">
                    can you check the email from September?
                </div>
                <div className="bg-[#F5F1E8] px-3 py-1.5 max-w-[80%]">
                    which email?? we discussed this on a call
                </div>
                <div className="bg-[#dcf8c6] px-3 py-1.5 max-w-[80%] ml-auto text-[#8C7A6B] font-medium">
                    I&apos;m not releasing the track until this is sorted
                </div>
            </div>
        </div>
    )
}

function SpreadsheetWindow() {
    return (
        <div
            className="absolute w-[220px] sm:w-[280px] md:w-[340px] bg-white border border-[#1A1A1A]/10 shadow-[3px_3px_0px_0px_rgba(26,26,26,0.08)] animate-chaos"
            style={{ '--rotate': '2.5deg', top: '8%', left: '25%', maxWidth: 'calc(100% - 16px)' } as React.CSSProperties}
        >
            <div className="px-3 py-2 border-b border-[#1A1A1A]/5">
                <span className="font-mono text-[10px] text-[#4A4A4A]">splits_final_FINAL_v3.xlsx</span>
            </div>
            <div className="text-[10px] font-mono">
                <div className="grid grid-cols-4 border-b border-[#1A1A1A]/5">
                    <div className="px-2 py-1.5 bg-[#1A1A1A]/[0.03] border-r border-[#1A1A1A]/5 font-bold">Name</div>
                    <div className="px-2 py-1.5 bg-[#1A1A1A]/[0.03] border-r border-[#1A1A1A]/5 font-bold">%</div>
                    <div className="px-2 py-1.5 bg-[#1A1A1A]/[0.03] border-r border-[#1A1A1A]/5 font-bold">Paid?</div>
                    <div className="px-2 py-1.5 bg-[#1A1A1A]/[0.03] font-bold">Notes</div>
                </div>
                {[
                    ['Carlos', '40%', 'Yes', ''],
                    ['Laura', '30%', '???', 'says 35%'],
                    ['Mike', '25%', 'No', 'not answering'],
                    ['Ana', '5%', 'No', 'wrong IBAN'],
                ].map((row, i) => (
                    <div key={i} className="grid grid-cols-4 border-b border-[#1A1A1A]/5 last:border-0">
                        {row.map((cell, j) => (
                            <div
                                key={j}
                                className={`px-2 py-1.5 border-r border-[#1A1A1A]/5 last:border-0 ${
                                    cell === '???' || cell === 'wrong IBAN' || cell === 'not answering' || cell === 'says 35%'
                                        ? 'text-[#8C7A6B] bg-[#8C7A6B]/5'
                                        : ''
                                }`}
                            >
                                {cell}
                            </div>
                        ))}
                    </div>
                ))}
                <div className="px-2 py-1.5 bg-yellow-50 text-[#8C7A6B] font-bold">
                    TOTAL: 100% (??) — DOESN&apos;T ADD UP IF LAURA=35%
                </div>
            </div>
        </div>
    )
}

function EmailWindow() {
    return (
        <div
            className="absolute w-[200px] sm:w-[260px] md:w-[300px] bg-white border border-[#1A1A1A]/10 shadow-[3px_3px_0px_0px_rgba(26,26,26,0.08)] animate-chaos"
            style={{ '--rotate': '-1.5deg', top: '3%', right: '3%' } as React.CSSProperties}
        >
            <div className="px-3 py-2 border-b border-[#1A1A1A]/5">
                <span className="font-mono text-[10px] text-[#4A4A4A]">Inbox (23 unread)</span>
            </div>
            <div className="p-3 space-y-3 text-xs">
                <div className="border-b border-[#1A1A1A]/5 pb-2">
                    <div className="flex justify-between">
                        <span className="font-bold">Re: Re: Re: Payment??</span>
                        <span className="text-[#4A4A4A]">3d</span>
                    </div>
                    <p className="text-[#4A4A4A] mt-1">Hey, it&apos;s been 3 months. When am I getting my share? This is getting...</p>
                </div>
                <div className="border-b border-[#1A1A1A]/5 pb-2">
                    <div className="flex justify-between">
                        <span className="font-bold text-[#8C7A6B]">URGENT: Wrong splits</span>
                        <span className="text-[#4A4A4A]">1w</span>
                    </div>
                    <p className="text-[#4A4A4A] mt-1">The distributor has the wrong percentages. We need to fix this before...</p>
                </div>
                <div>
                    <div className="flex justify-between">
                        <span className="font-bold">Fwd: Contract draft v7</span>
                        <span className="text-[#4A4A4A]">2w</span>
                    </div>
                    <p className="text-[#4A4A4A] mt-1">Attached new version. Ana still hasn&apos;t signed. Can someone...</p>
                </div>
            </div>
        </div>
    )
}

function NotesWindow() {
    return (
        <div
            className="absolute w-[180px] sm:w-[220px] md:w-[250px] bg-[#fef9c3] border border-[#1A1A1A]/10 shadow-[3px_3px_0px_0px_rgba(26,26,26,0.08)] animate-chaos"
            style={{ '--rotate': '4deg', bottom: '5%', left: '5%' } as React.CSSProperties}
        >
            <div className="px-3 py-2 border-b border-[#1A1A1A]/10">
                <span className="font-mono text-[10px] text-[#4A4A4A]">Notes - Splits</span>
            </div>
            <div className="p-3 text-xs font-mono space-y-1">
                <p className="line-through text-[#4A4A4A]">Carlos 40 / Laura 30 / Mike 20 / Ana 10</p>
                <p className="line-through text-[#4A4A4A]">Carlos 40 / Laura 35 / Mike 20 / Ana 5</p>
                <p className="line-through text-[#4A4A4A]">Carlos 35 / Laura 30 / Mike 25 / Ana 10</p>
                <p className="text-[#8C7A6B] font-bold">Carlos 40 / Laura 30 / Mike 25 / Ana 5 ???</p>
                <p className="mt-2 text-[#8C7A6B]">TODO: ask lawyer about contract</p>
                <p className="text-[#8C7A6B]">TODO: fix distributor splits</p>
                <p className="text-[#8C7A6B]">TODO: pay Mike back for mastering</p>
            </div>
        </div>
    )
}

function CalculatorWindow() {
    return (
        <div
            className="absolute w-[180px] bg-white border border-[#1A1A1A]/10 shadow-[3px_3px_0px_0px_rgba(26,26,26,0.08)] animate-chaos hidden md:block"
            style={{ '--rotate': '-2deg', bottom: '15%', right: '12%' } as React.CSSProperties}
        >
            <div className="px-3 py-2 border-b border-[#1A1A1A]/5">
                <span className="font-mono text-[10px] text-[#4A4A4A]">Calculator</span>
            </div>
            <div className="p-3 font-mono text-right text-sm">
                <p className="text-[#4A4A4A] text-[10px]">280.45 x 0.30 =</p>
                <p className="text-xl font-bold">84.135</p>
                <p className="text-[10px] text-[#8C7A6B] mt-1">minus mastering: -100</p>
                <p className="text-[10px] text-[#8C7A6B]">minus promo: -200</p>
                <p className="text-lg font-bold text-[#8C7A6B] border-t border-[#1A1A1A]/10 mt-1 pt-1">-215.865</p>
            </div>
        </div>
    )
}

export default function Problem() {
    return (
        <section className="py-24 md:py-32 px-6 md:px-12 lg:px-24 bg-[#1A1A1A] relative overflow-hidden">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="mb-8"
                >
                    <p className="font-mono text-xs tracking-[0.3em] uppercase text-[#F5F1E8]/30 mb-4">
                        The reality
                    </p>
                    <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight text-[#F5F1E8] leading-[0.9]">
                        This is how you<br />manage music today.
                    </h2>
                </motion.div>

                {/* Chaos visualization */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="relative h-[380px] sm:h-[450px] md:h-[550px] my-8 md:my-12"
                >
                    <ChatWindow />
                    <SpreadsheetWindow />
                    <EmailWindow />
                    <NotesWindow />
                    <CalculatorWindow />
                </motion.div>

                {/* Bottom line */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="border-t border-[#F5F1E8]/10 pt-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6"
                >
                    <p className="font-serif text-xl md:text-2xl italic text-[#F5F1E8]/60 max-w-lg leading-relaxed">
                        &ldquo;Five apps, three spreadsheets, two group chats, and zero clarity on who gets paid what.&rdquo;
                    </p>
                    <p className="font-mono text-xs text-[#F5F1E8]/20 uppercase tracking-wider shrink-0">
                        Sound familiar?
                    </p>
                </motion.div>
            </div>
        </section>
    )
}
