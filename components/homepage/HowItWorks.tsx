'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const tabs = [
    {
        id: 'proyecto',
        label: 'Proyecto',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
        ),
        description: 'Crea proyectos, sube tus tracks y gestiona todo desde un solo lugar.'
    },
    {
        id: 'equipo',
        label: 'Equipo',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
        ),
        description: 'Invita colaboradores y define los splits. Firma contratos digitales en segundos.'
    },
    {
        id: 'finanzas',
        label: 'Finanzas',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
        ),
        description: 'Registra gastos, calcula el break-even y ve quién pagó qué en tiempo real.'
    },
    {
        id: 'distribucion',
        label: 'Distribución',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
        ),
        description: 'Distribuye a +150 plataformas y cobra automáticamente según tus splits.'
    }
]

function ProyectoMockup() {
    return (
        <div className="h-full flex flex-col">
            {/* Page header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-semibold">Verano en Madrid</h3>
                    <p className="text-sm opacity-50">Creado el 15 de enero, 2025</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-green-500/20 text-green-700 text-xs font-medium rounded-full flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        Live
                    </span>
                    <button className="p-2 hover:bg-[#252525]/5 rounded-lg transition-colors">
                        <svg className="w-5 h-5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
                {/* Track card - spans 2 cols */}
                <div className="lg:col-span-2 p-5 bg-gradient-to-br from-[#252525] to-[#353535] rounded-xl text-white">
                    <div className="flex items-start gap-4">
                        <div className="w-20 h-20 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                            <svg className="w-8 h-8 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-lg truncate">Verano en Madrid.wav</p>
                            <p className="text-sm opacity-60 mb-3">3:42 · WAV · 24bit/48kHz · 42.3 MB</p>
                            <div className="flex items-center gap-4 text-sm">
                                <span className="flex items-center gap-1.5 opacity-70">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                    </svg>
                                    4 colaboradores
                                </span>
                                <span className="flex items-center gap-1.5 opacity-70">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Hace 2 días
                                </span>
                            </div>
                        </div>
                        <button className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </button>
                    </div>
                    {/* Waveform placeholder */}
                    <div className="mt-4 h-12 bg-white/10 rounded-lg flex items-center gap-0.5 px-2 overflow-hidden">
                        {Array.from({ length: 60 }).map((_, i) => (
                            <motion.div
                                key={i}
                                className="w-1 bg-white/60 rounded-full"
                                initial={{ height: 4 }}
                                animate={{ height: Math.random() * 32 + 8 }}
                                transition={{ duration: 0.5, delay: i * 0.01 }}
                            />
                        ))}
                    </div>
                </div>

                {/* Quick stats */}
                <div className="space-y-3">
                    <div className="p-4 border border-[#252525]/10 rounded-xl">
                        <p className="text-xs opacity-50 mb-1">Streams totales</p>
                        <p className="text-2xl font-semibold">12,450</p>
                        <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                            +15% esta semana
                        </p>
                    </div>
                    <div className="p-4 border border-[#252525]/10 rounded-xl">
                        <p className="text-xs opacity-50 mb-1">Ingresos generados</p>
                        <p className="text-2xl font-semibold text-green-600">€280.45</p>
                        <p className="text-xs opacity-50 mt-1">3 pagos realizados</p>
                    </div>
                    <div className="p-4 border border-[#252525]/10 rounded-xl">
                        <p className="text-xs opacity-50 mb-1">Plataformas activas</p>
                        <p className="text-2xl font-semibold">7 <span className="text-sm font-normal opacity-50">/ 10</span></p>
                    </div>
                </div>

                {/* Activity feed */}
                <div className="lg:col-span-2 p-5 border border-[#252525]/10 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-medium">Actividad reciente</p>
                        <button className="text-xs opacity-50 hover:opacity-100">Ver todo</button>
                    </div>
                    <div className="space-y-3">
                        {[
                            { icon: "€", text: "Sistema distribuyó €87.20 a 4 colaboradores", time: "Hace 2h", color: "bg-green-500" },
                            { icon: "+", text: "Mike añadió €200 al presupuesto de marketing", time: "Hace 1d", color: "bg-blue-500" },
                            { icon: "✓", text: "Laura aprobó el release para distribución", time: "Hace 2d", color: "bg-purple-500" },
                            { icon: "↑", text: "Carlos subió la versión final de la mezcla", time: "Hace 3d", color: "bg-gray-400" }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-center gap-3 py-2"
                            >
                                <div className={`w-8 h-8 ${item.color} text-white rounded-full flex items-center justify-center text-xs shrink-0`}>
                                    {item.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm truncate">{item.text}</p>
                                    <p className="text-xs opacity-40">{item.time}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Team preview */}
                <div className="p-5 border border-[#252525]/10 rounded-xl">
                    <p className="text-sm font-medium mb-4">Equipo</p>
                    <div className="flex -space-x-2 mb-3">
                        {['C', 'L', 'M', 'A'].map((initial, i) => (
                            <div key={i} className="w-10 h-10 bg-[#252525] text-white rounded-full flex items-center justify-center text-sm font-medium border-2 border-white">
                                {initial}
                            </div>
                        ))}
                    </div>
                    <p className="text-xs opacity-50">4 colaboradores · Contrato firmado</p>
                </div>
            </div>
        </div>
    )
}

function EquipoMockup() {
    const members = [
        { name: "Carlos García", role: "Owner", split: 40, avatar: "C", email: "carlos@email.com", status: "signed" },
        { name: "Laura Martínez", role: "Productor", split: 30, avatar: "L", email: "laura@email.com", status: "signed" },
        { name: "Mike Johnson", role: "Compositor", split: 25, avatar: "M", email: "mike@email.com", status: "signed" },
        { name: "Ana López", role: "Vocalista", split: 5, avatar: "A", email: "ana@email.com", status: "signed" }
    ]

    return (
        <div className="h-full flex flex-col">
            {/* Page header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-semibold">Equipo & Splits</h3>
                    <p className="text-sm opacity-50">Gestiona colaboradores y porcentajes</p>
                </div>
                <button className="px-4 py-2 bg-[#252525] text-white text-sm font-medium rounded-lg hover:bg-[#353535] transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Invitar
                </button>
            </div>

            {/* Contract status banner */}
            <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-xl mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <p className="font-medium text-green-700">Contrato firmado por todos</p>
                        <p className="text-xs text-green-600/70">Todos los colaboradores han aceptado los términos</p>
                    </div>
                </div>
                <button className="px-3 py-1.5 text-xs text-green-700 border border-green-500/30 rounded-lg hover:bg-green-500/10 transition-colors">
                    Ver contrato
                </button>
            </div>

            {/* Team table */}
            <div className="flex-1 border border-[#252525]/10 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-[#252525]/5 text-left text-xs uppercase tracking-wider opacity-50">
                            <th className="px-5 py-3 font-medium">Colaborador</th>
                            <th className="px-5 py-3 font-medium hidden md:table-cell">Rol</th>
                            <th className="px-5 py-3 font-medium">Split</th>
                            <th className="px-5 py-3 font-medium hidden md:table-cell">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {members.map((member, i) => (
                            <motion.tr
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="border-t border-[#252525]/5"
                            >
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-[#252525] text-white rounded-full flex items-center justify-center text-sm font-medium">
                                            {member.avatar}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{member.name}</p>
                                            <p className="text-xs opacity-50">{member.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-4 hidden md:table-cell">
                                    <span className="px-2 py-1 bg-[#252525]/5 text-xs rounded">{member.role}</span>
                                </td>
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-3 min-w-[120px]">
                                        <div className="flex-1 h-2 bg-[#252525]/10 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-[#252525] rounded-full"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${member.split}%` }}
                                                transition={{ duration: 0.8, delay: i * 0.1 }}
                                            />
                                        </div>
                                        <span className="text-sm font-semibold w-10">{member.split}%</span>
                                    </div>
                                </td>
                                <td className="px-5 py-4 hidden md:table-cell">
                                    <span className="flex items-center gap-1.5 text-xs text-green-600">
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Firmado
                                    </span>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer info */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#252525]/10">
                <p className="text-sm opacity-50">
                    Total: <span className="font-semibold text-[#252525]">100%</span>
                </p>
                <p className="text-sm opacity-50">
                    Configuración: <span className="font-medium text-[#252525]">Pago automático cuando balance {">"} €0</span>
                </p>
            </div>
        </div>
    )
}

function FinanzasMockup() {
    const expenses = [
        { label: "Video musical", amount: 150, paidBy: "Mike Johnson", date: "12 ene", category: "Marketing" },
        { label: "Campaña Meta Ads", amount: 200, paidBy: "Carlos García", date: "10 ene", category: "Marketing" },
        { label: "Mastering profesional", amount: 100, paidBy: "Laura Martínez", date: "8 ene", category: "Producción" }
    ]

    return (
        <div className="h-full flex flex-col">
            {/* Page header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-semibold">Finanzas</h3>
                    <p className="text-sm opacity-50">Control de ingresos, gastos y balance</p>
                </div>
                <button className="px-4 py-2 bg-[#252525] text-white text-sm font-medium rounded-lg hover:bg-[#353535] transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Añadir gasto
                </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 bg-green-500/10 border border-green-500/20 rounded-xl"
                >
                    <p className="text-xs opacity-60 mb-1 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        Ingresos
                    </p>
                    <p className="text-2xl font-bold text-green-600">€280.45</p>
                    <p className="text-xs text-green-600/70 mt-1">+€87.20 esta semana</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-5 bg-[#252525]/5 border border-[#252525]/10 rounded-xl"
                >
                    <p className="text-xs opacity-60 mb-1 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                        Gastos
                    </p>
                    <p className="text-2xl font-bold">€450.00</p>
                    <p className="text-xs opacity-50 mt-1">3 gastos registrados</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-5 bg-red-500/10 border border-red-500/20 rounded-xl"
                >
                    <p className="text-xs opacity-60 mb-1">Balance</p>
                    <p className="text-2xl font-bold text-red-600">-€169.55</p>
                    <p className="text-xs text-red-600/70 mt-1">Por recuperar</p>
                </motion.div>
            </div>

            {/* Break-even progress */}
            <div className="p-5 bg-[#252525] text-white rounded-xl mb-6">
                <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Break-even</p>
                    <p className="text-sm opacity-70">62% completado</p>
                </div>
                <div className="h-3 bg-white/20 rounded-full overflow-hidden mb-3">
                    <motion.div
                        className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: "62%" }}
                        transition={{ duration: 1.2 }}
                    />
                </div>
                <div className="flex justify-between text-xs opacity-60">
                    <span>€280.45 recuperados</span>
                    <span>Meta: €450.00</span>
                </div>
            </div>

            {/* Expenses table */}
            <div className="flex-1 border border-[#252525]/10 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 bg-[#252525]/5">
                    <p className="text-sm font-medium">Desglose de gastos</p>
                    <button className="text-xs opacity-50 hover:opacity-100">Exportar</button>
                </div>
                <div className="divide-y divide-[#252525]/5">
                    {expenses.map((expense, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-center justify-between px-5 py-4"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-[#252525]/5 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{expense.label}</p>
                                    <p className="text-xs opacity-50">{expense.paidBy} · {expense.date}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold">€{expense.amount}</p>
                                <span className="text-xs px-2 py-0.5 bg-[#252525]/5 rounded">{expense.category}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function DistribucionMockup() {
    const platforms = [
        { name: "Spotify", status: "live", streams: "8,234" },
        { name: "Apple Music", status: "live", streams: "2,156" },
        { name: "YouTube Music", status: "live", streams: "1,432" },
        { name: "Amazon Music", status: "live", streams: "398" },
        { name: "Deezer", status: "live", streams: "156" },
        { name: "Tidal", status: "live", streams: "54" },
        { name: "TikTok", status: "live", streams: "20" },
        { name: "Instagram", status: "pending", streams: "-" },
        { name: "Shazam", status: "pending", streams: "-" }
    ]

    const countries = [
        { country: "España", flag: "🇪🇸", percent: 45, streams: "5,602" },
        { country: "México", flag: "🇲🇽", percent: 28, streams: "3,486" },
        { country: "Argentina", flag: "🇦🇷", percent: 15, streams: "1,867" },
        { country: "Colombia", flag: "🇨🇴", percent: 8, streams: "996" },
        { country: "Chile", flag: "🇨🇱", percent: 4, streams: "499" }
    ]

    return (
        <div className="h-full flex flex-col">
            {/* Page header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-semibold">Distribución</h3>
                    <p className="text-sm opacity-50">Estado de plataformas y analytics</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 bg-green-500/20 text-green-700 text-xs font-medium rounded-full flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        7 plataformas activas
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
                {/* Platforms list */}
                <div className="border border-[#252525]/10 rounded-xl overflow-hidden">
                    <div className="px-5 py-3 bg-[#252525]/5 flex items-center justify-between">
                        <p className="text-sm font-medium">Plataformas</p>
                        <p className="text-xs opacity-50">Streams</p>
                    </div>
                    <div className="divide-y divide-[#252525]/5 max-h-[300px] overflow-y-auto">
                        {platforms.map((platform, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className="flex items-center justify-between px-5 py-3"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${platform.status === 'live' ? 'bg-green-500/10' : 'bg-[#252525]/5'
                                        }`}>
                                        {platform.status === 'live' ? (
                                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{platform.name}</p>
                                        <p className={`text-xs ${platform.status === 'live' ? 'text-green-600' : 'opacity-40'}`}>
                                            {platform.status === 'live' ? 'Activo' : 'Pendiente'}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-sm font-medium">{platform.streams}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Analytics */}
                <div className="space-y-4">
                    {/* Total streams card */}
                    <div className="p-5 bg-gradient-to-br from-[#252525] to-[#353535] text-white rounded-xl">
                        <p className="text-sm opacity-60 mb-1">Streams totales</p>
                        <p className="text-3xl font-bold">12,450</p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">+15%</span>
                            <span className="text-xs opacity-50">vs. semana anterior</span>
                        </div>
                    </div>

                    {/* Top countries */}
                    <div className="p-5 border border-[#252525]/10 rounded-xl">
                        <p className="text-sm font-medium mb-4">Top países</p>
                        <div className="space-y-3">
                            {countries.map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-center gap-3"
                                >
                                    <span className="text-xl">{item.flag}</span>
                                    <div className="flex-1">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium">{item.country}</span>
                                            <span className="opacity-50">{item.streams}</span>
                                        </div>
                                        <div className="h-1.5 bg-[#252525]/10 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-[#252525] rounded-full"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${item.percent}%` }}
                                                transition={{ duration: 0.8, delay: i * 0.1 }}
                                            />
                                        </div>
                                    </div>
                                    <span className="text-sm font-semibold w-10 text-right">{item.percent}%</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const mockups: Record<string, () => JSX.Element> = {
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
                <p className="text-sm tracking-widest uppercase mb-4 opacity-50">Cómo funciona</p>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                    Todo tu proyecto<br />en un solo lugar.
                </h2>
            </div>

            {/* App Mockup with Sidebar */}
            <div className="border border-[#252525]/10 rounded-2xl overflow-hidden shadow-2xl bg-white max-w-6xl">
                <div className="flex min-h-[550px]">
                    {/* Sidebar */}
                    <div className="w-16 md:w-56 bg-[#252525] text-white flex flex-col shrink-0">
                        {/* Logo */}
                        <div className="p-4 md:px-5 md:py-6 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                    </svg>
                                </div>
                                <span className="font-semibold hidden md:block">Musiky</span>
                            </div>
                        </div>

                        {/* Project selector */}
                        <div className="p-2 md:p-4 border-b border-white/10">
                            <div className="p-2 md:px-3 md:py-2 bg-white/10 rounded-lg">
                                <p className="text-xs opacity-50 hidden md:block">Proyecto actual</p>
                                <p className="font-medium text-sm truncate hidden md:block">Verano en Madrid</p>
                                <div className="md:hidden flex justify-center">
                                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                </div>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 p-2 md:p-4 space-y-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center justify-center md:justify-start gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${activeTab === tab.id
                                            ? 'bg-white/20 text-white'
                                            : 'text-white/60 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    {tab.icon}
                                    <span className="hidden md:block">{tab.label}</span>
                                </button>
                            ))}
                        </nav>

                        {/* User */}
                        <div className="p-2 md:p-4 border-t border-white/10">
                            <div className="flex items-center justify-center md:justify-start gap-3">
                                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-medium">
                                    C
                                </div>
                                <div className="hidden md:block">
                                    <p className="text-sm font-medium">Carlos</p>
                                    <p className="text-xs opacity-50">Owner</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main content */}
                    <div className="flex-1 p-6 md:p-8 overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
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
