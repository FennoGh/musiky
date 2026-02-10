'use client'

import { motion } from 'framer-motion'

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
}

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
}

export default function Features() {
    return (
        <section id="funcionalidades" className="py-24 md:py-32 px-6 md:px-12 lg:px-48 bg-[#252525]">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-16">
                    <p className="text-sm tracking-widest uppercase mb-4 text-white/50">Funcionalidades</p>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
                        Todo lo que necesitas.<br />
                        <span className="text-white/40">Nada que no.</span>
                    </h2>
                </div>

                {/* Bento Grid */}
                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                    {/* Feature 1 - Large card */}
                    <motion.div
                        variants={item}
                        className="lg:col-span-2 bg-gradient-to-br from-[#fff7e9] to-[#f5e6d3] rounded-3xl p-8 md:p-10 relative overflow-hidden group"
                    >
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-[#252525] rounded-2xl flex items-center justify-center mb-6">
                                <svg className="w-6 h-6 text-[#fff7e9]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold text-[#252525] mb-3">
                                Colaboración real
                            </h3>
                            <p className="text-[#252525]/70 text-lg max-w-md">
                                Invita a tu equipo, define roles y trabaja juntos en tiempo real. Todos ven el progreso, los cambios y las decisiones.
                            </p>
                        </div>
                        {/* Decorative elements */}
                        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-[#252525]/5 rounded-full transition-transform duration-500 group-hover:scale-150" />
                        <div className="absolute right-12 bottom-12 w-24 h-24 bg-[#252525]/5 rounded-full transition-transform duration-500 group-hover:scale-125 delay-100" />
                    </motion.div>

                    {/* Feature 2 - Splits */}
                    <motion.div
                        variants={item}
                        className="bg-white/5 backdrop-blur rounded-3xl p-8 border border-white/10 group hover:bg-white/10 transition-colors"
                    >
                        <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center mb-6">
                            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Splits automáticos</h3>
                        <p className="text-white/50">
                            Define porcentajes una vez. Las regalías se reparten solas, al instante.
                        </p>
                        {/* Mini visualization */}
                        <div className="mt-6 space-y-2">
                            {[40, 30, 20, 10].map((percent, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-6 h-6 bg-white/10 rounded-full" />
                                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-green-400/60 rounded-full"
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${percent}%` }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 1, delay: i * 0.1 }}
                                        />
                                    </div>
                                    <span className="text-xs text-white/40 w-8">{percent}%</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Feature 3 - Contracts */}
                    <motion.div
                        variants={item}
                        className="bg-white/5 backdrop-blur rounded-3xl p-8 border border-white/10 group hover:bg-white/10 transition-colors"
                    >
                        <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6">
                            <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Contratos digitales</h3>
                        <p className="text-white/50 mb-6">
                            Firma electrónica legal. Todos los colaboradores firman en segundos desde cualquier lugar.
                        </p>
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1.5 bg-purple-500/20 text-purple-300 text-xs rounded-full">eIDAS</span>
                            <span className="px-3 py-1.5 bg-white/10 text-white/50 text-xs rounded-full">Timestamp</span>
                            <span className="px-3 py-1.5 bg-white/10 text-white/50 text-xs rounded-full">PDF</span>
                        </div>
                    </motion.div>

                    {/* Feature 4 - Distribution - Large */}
                    <motion.div
                        variants={item}
                        className="lg:col-span-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-8 md:p-10 relative overflow-hidden"
                    >
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                                </svg>
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                                +150 plataformas
                            </h3>
                            <p className="text-white/70 text-lg max-w-md mb-8">
                                Tu música en Spotify, Apple Music, YouTube, TikTok y todas las plataformas importantes. Un click.
                            </p>
                            {/* Platform logos simulation */}
                            <div className="flex flex-wrap gap-2">
                                {['Spotify', 'Apple Music', 'YouTube', 'TikTok', 'Amazon', 'Deezer', '+144'].map((platform, i) => (
                                    <motion.span
                                        key={platform}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.05 }}
                                        className={`px-3 py-1.5 rounded-full text-sm ${
                                            i < 6 ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'
                                        }`}
                                    >
                                        {platform}
                                    </motion.span>
                                ))}
                            </div>
                        </div>
                        {/* Background decoration */}
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-blue-400/20 rounded-full blur-2xl" />
                    </motion.div>

                    {/* Feature 5 - Finances */}
                    <motion.div
                        variants={item}
                        className="bg-white/5 backdrop-blur rounded-3xl p-8 border border-white/10 group hover:bg-white/10 transition-colors"
                    >
                        <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center mb-6">
                            <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Finanzas claras</h3>
                        <p className="text-white/50 mb-6">
                            Gastos, ingresos y break-even. Siempre sabes quién invirtió qué y cuánto falta por recuperar.
                        </p>
                        {/* Mini chart */}
                        <div className="h-16 flex items-end gap-1">
                            {[30, 45, 25, 60, 40, 75, 55, 80, 65, 90, 70, 85].map((h, i) => (
                                <motion.div
                                    key={i}
                                    className="flex-1 bg-amber-400/40 rounded-t"
                                    initial={{ height: 0 }}
                                    whileInView={{ height: `${h}%` }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: i * 0.05 }}
                                />
                            ))}
                        </div>
                    </motion.div>

                    {/* Feature 6 - Analytics */}
                    <motion.div
                        variants={item}
                        className="bg-white/5 backdrop-blur rounded-3xl p-8 border border-white/10 group hover:bg-white/10 transition-colors"
                    >
                        <div className="w-12 h-12 bg-cyan-500/20 rounded-2xl flex items-center justify-center mb-6">
                            <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Analytics detallados</h3>
                        <p className="text-white/50 mb-4">
                            Streams por plataforma, países, tendencias. Datos reales para decisiones reales.
                        </p>
                        {/* Stats preview */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/5 rounded-xl p-3">
                                <p className="text-2xl font-bold text-white">12.4K</p>
                                <p className="text-xs text-white/40">Streams</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3">
                                <p className="text-2xl font-bold text-green-400">+15%</p>
                                <p className="text-xs text-white/40">Esta semana</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Feature 7 - Payments */}
                    <motion.div
                        variants={item}
                        className="bg-white/5 backdrop-blur rounded-3xl p-8 border border-white/10 group hover:bg-white/10 transition-colors"
                    >
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6">
                            <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Cobros automáticos</h3>
                        <p className="text-white/50 mb-4">
                            Configura tu cuenta y olvídate. Cuando hay regalías, llegan solas.
                        </p>
                        <div className="flex items-center gap-2 text-emerald-400">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm">Sin mínimo de retiro</span>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    )
}
