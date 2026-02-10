'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

const faqs = [
    {
        question: '¿Cómo funcionan los splits automáticos?',
        answer: 'Define los porcentajes, firma el contrato digital y listo. Cada vez que llegan regalías, se reparten automáticamente según lo acordado. Sin Excel, sin perseguir a nadie.'
    },
    {
        question: '¿Cobráis comisión sobre mis regalías?',
        answer: 'No. El 100% de tus regalías son tuyas. Solo pagas la suscripción según tu plan. Cero comisiones ocultas.'
    },
    {
        question: '¿A qué plataformas puedo distribuir?',
        answer: 'Más de 150 plataformas: Spotify, Apple Music, YouTube Music, Amazon, Deezer, Tidal, TikTok, Instagram, Shazam y más.'
    },
    {
        question: '¿Los contratos digitales son legalmente válidos?',
        answer: 'Sí. Cumplen con la normativa eIDAS de la UE. Cada firma queda registrada con timestamp y todos reciben copia.'
    },
    {
        question: '¿Cómo funciona la gestión de gastos?',
        answer: 'Registra gastos del proyecto, el sistema calcula el break-even y cuando llegan ingresos, primero se recupera la inversión.'
    },
    {
        question: '¿Puedo cancelar en cualquier momento?',
        answer: 'Sí, sin compromiso. Tu música sigue distribuida. Solo pierdes acceso a funcionalidades premium.'
    },
]

export default function FAQ() {
    const [activeIndex, setActiveIndex] = useState<number | null>(null)

    return (
        <section id="faq" className="py-24 md:py-32 px-6 md:px-12 lg:px-48">
            <div className="max-w-6xl mx-auto">
                {/* Two column layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
                    {/* Left column - Header */}
                    <div className="lg:sticky lg:top-32 lg:self-start">
                        <p className="text-sm tracking-widest uppercase mb-4 opacity-50">FAQ</p>
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                            Resolvemos<br />tus dudas.
                        </h2>
                        <p className="text-lg opacity-60 mb-8">
                            Si tienes más preguntas, estamos aquí para ayudarte.
                        </p>

                        <a
                            href="mailto:hola@musiky.com"
                            className="inline-flex items-center gap-3 px-6 py-3 bg-[#252525] text-[#fff7e9] rounded-full font-medium text-sm hover:bg-[#353535] transition-colors group"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                            </svg>
                            Contactar
                            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </a>
                    </div>

                    {/* Right column - Questions */}
                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                                className={`group cursor-pointer rounded-2xl border transition-all duration-300 ${
                                    activeIndex === index
                                        ? 'bg-[#252525] text-white border-[#252525]'
                                        : 'bg-white border-[#252525]/10 hover:border-[#252525]/30'
                                }`}
                            >
                                <div className="p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <span className={`text-sm font-medium mt-0.5 transition-colors ${
                                                activeIndex === index ? 'text-white/40' : 'text-[#252525]/30'
                                            }`}>
                                                {String(index + 1).padStart(2, '0')}
                                            </span>
                                            <div>
                                                <h3 className="font-semibold text-lg leading-snug">
                                                    {faq.question}
                                                </h3>
                                                <motion.div
                                                    initial={false}
                                                    animate={{
                                                        height: activeIndex === index ? 'auto' : 0,
                                                        opacity: activeIndex === index ? 1 : 0,
                                                        marginTop: activeIndex === index ? 12 : 0
                                                    }}
                                                    transition={{ duration: 0.3 }}
                                                    className="overflow-hidden"
                                                >
                                                    <p className={`leading-relaxed ${
                                                        activeIndex === index ? 'text-white/70' : 'text-[#252525]/60'
                                                    }`}>
                                                        {faq.answer}
                                                    </p>
                                                </motion.div>
                                            </div>
                                        </div>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                            activeIndex === index ? 'bg-white/10' : 'bg-[#252525]/5'
                                        }`}>
                                            <motion.svg
                                                animate={{ rotate: activeIndex === index ? 45 : 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="w-4 h-4"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </motion.svg>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
