'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

const plans = [
    {
        name: 'Starter',
        description: 'Para artistas independientes que empiezan.',
        price: { monthly: 0, yearly: 0 },
        features: [
            '1 proyecto activo',
            'Hasta 2 colaboradores',
            'Distribución a +150 plataformas',
            'Splits automáticos',
            'Analytics básicos',
        ],
        limitations: [
            'Sin contratos digitales',
            'Sin gestión de gastos',
        ],
        cta: 'Empezar gratis',
        highlighted: false,
    },
    {
        name: 'Pro',
        description: 'Para artistas y productores serios.',
        price: { monthly: 9.99, yearly: 7.99 },
        features: [
            'Proyectos ilimitados',
            'Hasta 10 colaboradores por proyecto',
            'Distribución a +150 plataformas',
            'Splits automáticos',
            'Contratos digitales',
            'Gestión de gastos completa',
            'Analytics avanzados',
            'Soporte prioritario',
        ],
        limitations: [],
        cta: 'Comenzar prueba gratis',
        highlighted: true,
        badge: 'Más popular',
    },
    {
        name: 'Team',
        description: 'Para sellos y equipos profesionales.',
        price: { monthly: 29.99, yearly: 24.99 },
        features: [
            'Todo lo de Pro',
            'Colaboradores ilimitados',
            'Múltiples administradores',
            'API access',
            'Reportes personalizados',
            'Onboarding dedicado',
            'Account manager',
        ],
        limitations: [],
        cta: 'Contactar ventas',
        highlighted: false,
    },
]

export default function Pricing() {
    const [isYearly, setIsYearly] = useState(true)

    return (
        <section id="precios" className="py-24 md:py-32 px-6 md:px-12 lg:px-48 bg-[#252525] text-white">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <p className="text-sm tracking-widest uppercase mb-4 opacity-50">Precios</p>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                        Simple y transparente.
                    </h2>
                    <p className="text-lg opacity-60 max-w-xl mx-auto">
                        Sin comisiones ocultas sobre tus regalías. Paga solo por las funcionalidades que necesitas.
                    </p>

                    {/* Toggle */}
                    <div className="flex items-center justify-center gap-4 mt-8">
                        <span className={`text-sm transition-opacity ${!isYearly ? 'opacity-100' : 'opacity-50'}`}>
                            Mensual
                        </span>
                        <button
                            onClick={() => setIsYearly(!isYearly)}
                            className="relative w-14 h-7 bg-white/20 rounded-full transition-colors"
                        >
                            <motion.div
                                className="absolute top-1 w-5 h-5 bg-white rounded-full"
                                animate={{ left: isYearly ? '32px' : '4px' }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                        </button>
                        <span className={`text-sm transition-opacity flex items-center gap-2 ${isYearly ? 'opacity-100' : 'opacity-50'}`}>
                            Anual
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                                -20%
                            </span>
                        </span>
                    </div>
                </div>

                {/* Plans */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative rounded-2xl p-8 flex flex-col ${
                                plan.highlighted
                                    ? 'bg-[#fff7e9] text-[#252525] scale-105 shadow-2xl'
                                    : 'bg-white/5 border border-white/10'
                            }`}
                        >
                            {plan.badge && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="px-3 py-1 bg-[#252525] text-[#fff7e9] text-xs font-medium rounded-full">
                                        {plan.badge}
                                    </span>
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                                <p className={`text-sm ${plan.highlighted ? 'opacity-60' : 'opacity-50'}`}>
                                    {plan.description}
                                </p>
                            </div>

                            <div className="mb-6">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold">
                                        €{isYearly ? plan.price.yearly : plan.price.monthly}
                                    </span>
                                    {plan.price.monthly > 0 && (
                                        <span className={`text-sm ${plan.highlighted ? 'opacity-60' : 'opacity-50'}`}>
                                            /mes
                                        </span>
                                    )}
                                </div>
                                {plan.price.monthly > 0 && isYearly && (
                                    <p className={`text-xs mt-1 ${plan.highlighted ? 'opacity-50' : 'opacity-40'}`}>
                                        Facturado anualmente (€{(plan.price.yearly * 12).toFixed(0)}/año)
                                    </p>
                                )}
                                {plan.price.monthly === 0 && (
                                    <p className={`text-xs mt-1 ${plan.highlighted ? 'opacity-50' : 'opacity-40'}`}>
                                        Gratis para siempre
                                    </p>
                                )}
                            </div>

                            <button
                                className={`w-full py-3 rounded-lg font-medium text-sm transition-all mb-8 ${
                                    plan.highlighted
                                        ? 'bg-[#252525] text-[#fff7e9] hover:bg-[#353535]'
                                        : 'bg-white text-[#252525] hover:bg-white/90'
                                }`}
                            >
                                {plan.cta}
                            </button>

                            <div className="space-y-3 flex-1">
                                {plan.features.map((feature, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <svg
                                            className={`w-5 h-5 shrink-0 ${plan.highlighted ? 'text-green-600' : 'text-green-400'}`}
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span className={`text-sm ${plan.highlighted ? 'opacity-80' : 'opacity-70'}`}>
                                            {feature}
                                        </span>
                                    </div>
                                ))}
                                {plan.limitations.map((limitation, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <svg
                                            className="w-5 h-5 shrink-0 opacity-30"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        <span className="text-sm opacity-40">
                                            {limitation}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom note */}
                <div className="mt-16 text-center">
                    <p className="text-sm opacity-50 mb-4">
                        Todos los planes incluyen distribución a +150 plataformas sin comisiones adicionales.
                    </p>
                    <div className="flex items-center justify-center gap-8 opacity-40">
                        <span className="text-xs">Sin compromiso</span>
                        <span className="text-xs">Cancela cuando quieras</span>
                        <span className="text-xs">100% de tus regalías</span>
                    </div>
                </div>
            </div>
        </section>
    )
}
