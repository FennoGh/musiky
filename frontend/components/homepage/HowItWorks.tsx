'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const tabs = [
    {
        id: 'proyecto',
        label: 'Project',
        shortLabel: 'PRJ',
        description: 'Create projects, upload tracks, and manage everything from one place.'
    },
    {
        id: 'equipo',
        label: 'Team',
        shortLabel: 'TEAM',
        description: 'Invite collaborators and define splits. Sign digital contracts in seconds.'
    },
    {
        id: 'finanzas',
        label: 'Finances',
        shortLabel: 'FIN',
        description: 'Track expenses, calculate break-even, and see who paid what in real time.'
    },
    {
        id: 'distribucion',
        label: 'Distribution',
        shortLabel: 'DIST',
        description: 'Distribute to 150+ platforms and get paid automatically via your splits.'
    }
]

function ProyectoMockup() {
    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-mono text-lg font-bold">Verano en Madrid</h3>
                    <p className="text-xs text-[#4A4A4A] mt-0.5">Created Jan 15, 2025</p>
                </div>
                <span className="font-mono text-[10px] px-2 py-1 bg-green-700 text-white">LIVE</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
                {/* Track card */}
                <div className="lg:col-span-2 p-5 bg-[#1A1A1A] text-[#F5F1E8]">
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-[#F5F1E8]/10 flex items-center justify-center shrink-0">
                            <svg className="w-6 h-6 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-mono font-bold truncate">Verano en Madrid.wav</p>
                            <p className="text-xs opacity-50 mt-1">3:42 / WAV / 24bit-48kHz / 42.3 MB</p>
                            <div className="flex items-center gap-4 text-xs mt-3 opacity-50">
                                <span>4 collaborators</span>
                                <span>2 days ago</span>
                            </div>
                        </div>
                    </div>
                    {/* Waveform */}
                    <div className="mt-4 h-10 bg-[#F5F1E8]/10 flex items-center gap-px px-2 overflow-hidden">
                        {Array.from({ length: 60 }).map((_, i) => (
                            <motion.div
                                key={i}
                                className="w-0.5 bg-[#F5F1E8]/40"
                                initial={{ height: 4 }}
                                animate={{ height: Math.random() * 28 + 6 }}
                                transition={{ duration: 0.4, delay: i * 0.01 }}
                            />
                        ))}
                    </div>
                </div>

                {/* Stats */}
                <div className="space-y-3">
                    <div className="p-4 border border-[#1A1A1A]/10">
                        <p className="font-mono text-[10px] uppercase tracking-wider text-[#4A4A4A] mb-1">Total streams</p>
                        <p className="font-mono text-2xl font-bold">12,450</p>
                        <p className="text-xs text-green-700 mt-1">+15% this week</p>
                    </div>
                    <div className="p-4 border border-[#1A1A1A]/10">
                        <p className="font-mono text-[10px] uppercase tracking-wider text-[#4A4A4A] mb-1">Revenue</p>
                        <p className="font-mono text-2xl font-bold text-green-700">$280.45</p>
                        <p className="text-xs text-[#4A4A4A] mt-1">3 payments made</p>
                    </div>
                    <div className="p-4 border border-[#1A1A1A]/10">
                        <p className="font-mono text-[10px] uppercase tracking-wider text-[#4A4A4A] mb-1">Platforms</p>
                        <p className="font-mono text-2xl font-bold">7 <span className="text-sm font-normal text-[#4A4A4A]">/ 10</span></p>
                    </div>
                </div>

                {/* Activity */}
                <div className="lg:col-span-2 p-5 border border-[#1A1A1A]/10">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-[#4A4A4A] mb-4">Recent activity</p>
                    <div className="space-y-3">
                        {[
                            { text: 'System distributed $87.20 to 4 collaborators', time: '2h ago' },
                            { text: 'Mike added $200 to marketing budget', time: '1d ago' },
                            { text: 'Laura approved release for distribution', time: '2d ago' },
                            { text: 'Carlos uploaded final mix version', time: '3d ago' }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.08 }}
                                className="flex items-start gap-3"
                            >
                                <span className="w-1 h-1 bg-[#8C7A6B] mt-2 shrink-0" />
                                <p className="text-sm text-[#4A4A4A] flex-1">{item.text}</p>
                                <span className="font-mono text-[10px] text-[#4A4A4A]/50 shrink-0">{item.time}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Team */}
                <div className="p-5 border border-[#1A1A1A]/10">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-[#4A4A4A] mb-4">Team</p>
                    <div className="flex gap-1 mb-3">
                        {['C', 'L', 'M', 'A'].map((initial, i) => (
                            <div key={i} className="w-8 h-8 bg-[#1A1A1A] text-[#F5F1E8] flex items-center justify-center text-xs font-mono font-bold">
                                {initial}
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-[#4A4A4A]">4 collaborators / Contract signed</p>
                </div>
            </div>
        </div>
    )
}

function EquipoMockup() {
    const members = [
        { name: 'Carlos Garcia', role: 'Owner', split: 40, email: 'carlos@email.com' },
        { name: 'Laura Martinez', role: 'Producer', split: 30, email: 'laura@email.com' },
        { name: 'Mike Johnson', role: 'Composer', split: 25, email: 'mike@email.com' },
        { name: 'Ana Lopez', role: 'Vocalist', split: 5, email: 'ana@email.com' }
    ]

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-mono text-lg font-bold">Team & Splits</h3>
                    <p className="text-xs text-[#4A4A4A] mt-0.5">Manage collaborators and percentages</p>
                </div>
                <button className="px-4 py-2 bg-[#1A1A1A] text-[#F5F1E8] text-xs font-mono">+ Invite</button>
            </div>

            {/* Contract banner */}
            <div className="flex items-center justify-between p-4 border border-green-700/30 bg-green-700/5 mb-6">
                <div>
                    <p className="text-sm font-medium text-green-700">Contract signed by all</p>
                    <p className="text-xs text-green-700/60">All collaborators accepted terms</p>
                </div>
                <button className="text-xs text-green-700 border border-green-700/30 px-3 py-1.5 hover:bg-green-700/10 transition-colors">
                    View contract
                </button>
            </div>

            {/* Table */}
            <div className="flex-1 border border-[#1A1A1A]/10">
                <table className="w-full">
                    <thead>
                        <tr className="bg-[#1A1A1A]/[0.03] text-left">
                            <th className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-[#4A4A4A]">Collaborator</th>
                            <th className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-[#4A4A4A] hidden md:table-cell">Role</th>
                            <th className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-[#4A4A4A]">Split</th>
                            <th className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-[#4A4A4A] hidden md:table-cell">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {members.map((member, i) => (
                            <motion.tr
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.08 }}
                                className="border-t border-[#1A1A1A]/5"
                            >
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 bg-[#1A1A1A] text-[#F5F1E8] flex items-center justify-center text-[10px] font-mono font-bold">
                                            {member.name[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{member.name}</p>
                                            <p className="text-[10px] text-[#4A4A4A]">{member.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 hidden md:table-cell">
                                    <span className="font-mono text-xs text-[#4A4A4A]">{member.role}</span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3 min-w-[100px]">
                                        <div className="flex-1 h-1.5 bg-[#1A1A1A]/10">
                                            <motion.div
                                                className="h-full bg-[#1A1A1A]"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${member.split}%` }}
                                                transition={{ duration: 0.6, delay: i * 0.08 }}
                                            />
                                        </div>
                                        <span className="font-mono text-xs w-8">{member.split}%</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 hidden md:table-cell">
                                    <span className="font-mono text-xs text-green-700">Signed</span>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#1A1A1A]/10">
                <p className="text-sm text-[#4A4A4A]">Total: <span className="font-mono font-bold text-[#1A1A1A]">100%</span></p>
                <p className="text-xs text-[#4A4A4A]">Auto-pay when balance &gt; $0</p>
            </div>
        </div>
    )
}

function FinanzasMockup() {
    const expenses = [
        { label: 'Music video', amount: 150, paidBy: 'Mike Johnson', date: 'Jan 12', category: 'Marketing' },
        { label: 'Meta Ads campaign', amount: 200, paidBy: 'Carlos Garcia', date: 'Jan 10', category: 'Marketing' },
        { label: 'Professional mastering', amount: 100, paidBy: 'Laura Martinez', date: 'Jan 8', category: 'Production' }
    ]

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-mono text-lg font-bold">Finances</h3>
                    <p className="text-xs text-[#4A4A4A] mt-0.5">Revenue, expenses, and balance</p>
                </div>
                <button className="px-4 py-2 bg-[#1A1A1A] text-[#F5F1E8] text-xs font-mono">+ Add expense</button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 border border-green-700/20 bg-green-700/5">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-[#4A4A4A] mb-1">Revenue</p>
                    <p className="font-mono text-xl font-bold text-green-700">$280.45</p>
                    <p className="text-[10px] text-green-700/60 mt-1">+$87.20 this week</p>
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }} className="p-4 border border-[#1A1A1A]/10">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-[#4A4A4A] mb-1">Expenses</p>
                    <p className="font-mono text-xl font-bold">$450.00</p>
                    <p className="text-[10px] text-[#4A4A4A] mt-1">3 expenses logged</p>
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.16 }} className="p-4 border border-[#8C7A6B]/20 bg-[#8C7A6B]/5">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-[#4A4A4A] mb-1">Balance</p>
                    <p className="font-mono text-xl font-bold text-[#8C7A6B]">-$169.55</p>
                    <p className="text-[10px] text-[#8C7A6B]/60 mt-1">To recover</p>
                </motion.div>
            </div>

            {/* Break-even */}
            <div className="p-5 bg-[#1A1A1A] text-[#F5F1E8] mb-6">
                <div className="flex items-center justify-between mb-2">
                    <p className="font-mono text-sm font-bold">Break-even</p>
                    <p className="font-mono text-xs opacity-50">62%</p>
                </div>
                <div className="h-2 bg-[#F5F1E8]/10">
                    <motion.div className="h-full bg-green-500" initial={{ width: 0 }} animate={{ width: '62%' }} transition={{ duration: 0.8 }} />
                </div>
                <div className="flex justify-between text-[10px] opacity-40 mt-2 font-mono">
                    <span>$280.45 recovered</span>
                    <span>Goal: $450.00</span>
                </div>
            </div>

            {/* Expenses */}
            <div className="flex-1 border border-[#1A1A1A]/10">
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#1A1A1A]/[0.03]">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#4A4A4A]">Expense breakdown</span>
                    <button className="font-mono text-[10px] text-[#4A4A4A] hover:text-[#1A1A1A]">Export</button>
                </div>
                {expenses.map((expense, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.08 }}
                        className="flex items-center justify-between px-4 py-3 border-t border-[#1A1A1A]/5"
                    >
                        <div>
                            <p className="text-sm font-medium">{expense.label}</p>
                            <p className="text-[10px] text-[#4A4A4A]">{expense.paidBy} / {expense.date}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-mono font-bold">${expense.amount}</p>
                            <span className="font-mono text-[10px] text-[#4A4A4A]">{expense.category}</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}

function DistribucionMockup() {
    const platforms = [
        { name: 'Spotify', status: 'live', streams: '8,234' },
        { name: 'Apple Music', status: 'live', streams: '2,156' },
        { name: 'YouTube Music', status: 'live', streams: '1,432' },
        { name: 'Amazon Music', status: 'live', streams: '398' },
        { name: 'Deezer', status: 'live', streams: '156' },
        { name: 'Tidal', status: 'live', streams: '54' },
        { name: 'TikTok', status: 'live', streams: '20' },
        { name: 'Instagram', status: 'pending', streams: '-' },
        { name: 'Shazam', status: 'pending', streams: '-' }
    ]

    const countries = [
        { country: 'Spain', percent: 45, streams: '5,602' },
        { country: 'Mexico', percent: 28, streams: '3,486' },
        { country: 'Argentina', percent: 15, streams: '1,867' },
        { country: 'Colombia', percent: 8, streams: '996' },
        { country: 'Chile', percent: 4, streams: '499' }
    ]

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-mono text-lg font-bold">Distribution</h3>
                    <p className="text-xs text-[#4A4A4A] mt-0.5">Platform status and analytics</p>
                </div>
                <span className="font-mono text-[10px] px-2 py-1 bg-green-700 text-white">7 ACTIVE</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
                {/* Platforms */}
                <div className="border border-[#1A1A1A]/10">
                    <div className="px-4 py-2.5 bg-[#1A1A1A]/[0.03] flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[#4A4A4A]">Platforms</span>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[#4A4A4A]">Streams</span>
                    </div>
                    <div className="max-h-[280px] overflow-y-auto">
                        {platforms.map((platform, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.04 }}
                                className="flex items-center justify-between px-4 py-2.5 border-t border-[#1A1A1A]/5"
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`w-1.5 h-1.5 ${platform.status === 'live' ? 'bg-green-700' : 'bg-[#4A4A4A]/30'}`} />
                                    <div>
                                        <p className="text-sm">{platform.name}</p>
                                        <p className={`text-[10px] ${platform.status === 'live' ? 'text-green-700' : 'text-[#4A4A4A]/50'}`}>
                                            {platform.status === 'live' ? 'Active' : 'Pending'}
                                        </p>
                                    </div>
                                </div>
                                <span className="font-mono text-sm">{platform.streams}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Analytics */}
                <div className="space-y-4">
                    <div className="p-5 bg-[#1A1A1A] text-[#F5F1E8]">
                        <p className="font-mono text-[10px] uppercase tracking-wider opacity-40 mb-1">Total streams</p>
                        <p className="font-mono text-3xl font-bold">12,450</p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="font-mono text-[10px] text-green-400">+15%</span>
                            <span className="text-[10px] opacity-40">vs last week</span>
                        </div>
                    </div>

                    <div className="p-5 border border-[#1A1A1A]/10">
                        <p className="font-mono text-[10px] uppercase tracking-wider text-[#4A4A4A] mb-4">Top countries</p>
                        <div className="space-y-3">
                            {countries.map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.08 }}
                                    className="flex items-center gap-3"
                                >
                                    <span className="text-sm w-20">{item.country}</span>
                                    <div className="flex-1 h-1.5 bg-[#1A1A1A]/10">
                                        <motion.div
                                            className="h-full bg-[#1A1A1A]"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${item.percent}%` }}
                                            transition={{ duration: 0.6, delay: i * 0.08 }}
                                        />
                                    </div>
                                    <span className="font-mono text-xs w-16 text-right">{item.streams}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const mockups: Record<string, () => React.ReactElement> = {
    proyecto: ProyectoMockup,
    equipo: EquipoMockup,
    finanzas: FinanzasMockup,
    distribucion: DistribucionMockup
}

export default function HowItWorks() {
    const [activeTab, setActiveTab] = useState('proyecto')

    const ActiveMockup = mockups[activeTab]

    return (
        <section id="como-funciona" className="py-24 md:py-32 px-6 md:px-12 lg:px-48">
            <div className="mb-12">
                <p className="font-mono text-xs tracking-[0.3em] uppercase text-[#4A4A4A] mb-4">How it works</p>
                <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight">
                    Your entire project.<br />One place.
                </h2>
            </div>

            {/* App Mockup */}
            <div className="border border-[#1A1A1A]/10 overflow-hidden shadow-[4px_4px_0px_0px_rgba(26,26,26,0.1)] bg-white max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row min-h-[400px] sm:min-h-[550px]">
                    {/* Sidebar - horizontal tabs on mobile, vertical on sm+ */}
                    <div className="bg-[#1A1A1A] text-[#F5F1E8] flex flex-row sm:flex-col sm:w-14 md:w-52 shrink-0">
                        <div className="p-3 md:px-5 md:py-5 border-b border-[#F5F1E8]/10 hidden sm:block">
                            <span className="font-mono text-sm font-bold hidden md:block">MUSIKY</span>
                            <span className="font-mono text-sm font-bold md:hidden text-center block">M</span>
                        </div>

                        <div className="p-2 md:p-4 border-b border-[#F5F1E8]/10 hidden sm:block">
                            <div className="p-2 md:px-3 md:py-2 bg-[#F5F1E8]/5">
                                <p className="font-mono text-[10px] opacity-40 hidden md:block">Current project</p>
                                <p className="font-mono text-xs truncate hidden md:block mt-0.5">Verano en Madrid</p>
                                <div className="md:hidden flex justify-center">
                                    <span className="w-1.5 h-1.5 bg-green-400" />
                                </div>
                            </div>
                        </div>

                        <nav className="flex flex-row sm:flex-col flex-1 p-1 sm:p-2 md:p-3 gap-0.5 overflow-x-auto">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 sm:flex-initial sm:w-full flex items-center justify-center md:justify-start gap-3 px-2 sm:px-3 py-2.5 font-mono text-xs transition-colors duration-150 whitespace-nowrap ${
                                        activeTab === tab.id
                                            ? 'bg-[#F5F1E8]/10 text-[#F5F1E8]'
                                            : 'text-[#F5F1E8]/40 hover:text-[#F5F1E8]/70'
                                    }`}
                                >
                                    <span className="hidden md:block">{tab.label}</span>
                                    <span className="md:hidden text-[10px]">{tab.shortLabel}</span>
                                </button>
                            ))}
                        </nav>

                        <div className="p-2 md:p-4 border-t border-[#F5F1E8]/10 hidden sm:block">
                            <div className="flex items-center justify-center md:justify-start gap-3">
                                <div className="w-7 h-7 bg-[#F5F1E8]/10 flex items-center justify-center text-[10px] font-mono font-bold">C</div>
                                <div className="hidden md:block">
                                    <p className="font-mono text-xs">Carlos</p>
                                    <p className="font-mono text-[10px] opacity-40">Owner</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main content */}
                    <div className="flex-1 p-6 md:p-8 overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="h-full"
                            >
                                <ActiveMockup />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </section>
    )
}
