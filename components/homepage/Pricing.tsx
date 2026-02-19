'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

const plans = [
    {
        name: 'Starter',
        description: 'For independent artists getting started.',
        price: { monthly: 0, yearly: 0 },
        features: [
            '1 active project',
            'Up to 2 collaborators',
            'Distribution to 150+ platforms',
            'Automatic splits',
            'Basic analytics',
        ],
        limitations: [
            'No digital contracts',
            'No expense management',
        ],
        cta: 'Start free',
        highlighted: false,
    },
    {
        name: 'Pro',
        description: 'For serious artists and producers.',
        price: { monthly: 9.99, yearly: 7.99 },
        features: [
            'Unlimited projects',
            'Up to 10 collaborators per project',
            'Distribution to 150+ platforms',
            'Automatic splits & contracts',
            'Full expense management',
            'Advanced analytics',
            'Priority support',
        ],
        limitations: [],
        cta: 'Start free trial',
        highlighted: true,
        badge: 'Most popular',
    },
    {
        name: 'Team',
        description: 'For labels and professional teams.',
        price: { monthly: 29.99, yearly: 24.99 },
        features: [
            'Everything in Pro',
            'Unlimited collaborators',
            'Multiple admins',
            'API access',
            'Custom reports',
            'Dedicated onboarding',
            'Account manager',
        ],
        limitations: [],
        cta: 'Contact sales',
        highlighted: false,
    },
]

export default function Pricing() {
    const [isYearly, setIsYearly] = useState(true)

    return (
        <section id="precios" className="py-24 md:py-32 px-6 md:px-12 lg:px-24 bg-[#1A1A1A] relative overflow-hidden">
            {/* Giant background text */}
            <span className="absolute -right-[5%] top-[10%] font-mono text-[25vw] font-bold leading-none text-[#F5F1E8]/[0.02] select-none pointer-events-none">
                $
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
                        <p className="font-mono text-xs tracking-[0.3em] uppercase text-[#F5F1E8]/30 mb-4">Pricing</p>
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-[#F5F1E8] leading-[0.9]">
                            Simple.<br />
                            <span className="text-[#8C7A6B]">Transparent.</span>
                        </h2>
                    </div>
                    <div className="flex flex-col justify-end">
                        <p className="text-lg text-[#F5F1E8]/50 leading-relaxed">
                            No hidden fees on your royalties. You keep 100%.
                            Pay only for the features you need.
                        </p>

                        {/* Toggle */}
                        <div className="flex items-center gap-4 mt-6">
                            <span className={`font-mono text-xs transition-colors ${!isYearly ? 'text-[#F5F1E8]' : 'text-[#F5F1E8]/30'}`}>
                                Monthly
                            </span>
                            <button
                                onClick={() => setIsYearly(!isYearly)}
                                className={`relative w-12 h-6 transition-colors ${isYearly ? 'bg-[#8C7A6B]' : 'bg-[#F5F1E8]/20'}`}
                            >
                                <motion.div
                                    className="absolute top-1 w-4 h-4 bg-[#F5F1E8]"
                                    animate={{ left: isYearly ? '28px' : '4px' }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                />
                            </button>
                            <span className={`font-mono text-xs transition-colors flex items-center gap-2 ${isYearly ? 'text-[#F5F1E8]' : 'text-[#F5F1E8]/30'}`}>
                                Yearly
                                <span className="font-mono text-[10px] px-2 py-0.5 bg-[#8C7A6B] text-[#F5F1E8]">-20%</span>
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Plans */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-[#F5F1E8]/[0.06]">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            className={`flex flex-col relative overflow-hidden ${
                                plan.highlighted
                                    ? 'bg-[#F5F1E8] text-[#1A1A1A]'
                                    : 'bg-[#1A1A1A]'
                            }`}
                        >
                            <div className="p-8 md:p-10 flex flex-col h-full">
                                {plan.badge && (
                                    <span className="font-mono text-[10px] tracking-wider uppercase text-[#8C7A6B] mb-4">
                                        {plan.badge}
                                    </span>
                                )}

                                <div className="mb-8">
                                    <h3 className={`font-mono text-xl font-bold mb-2 ${plan.highlighted ? '' : 'text-[#F5F1E8]'}`}>
                                        {plan.name}
                                    </h3>
                                    <p className={`text-sm ${plan.highlighted ? 'text-[#4A4A4A]' : 'text-[#F5F1E8]/40'}`}>
                                        {plan.description}
                                    </p>
                                </div>

                                {/* Price */}
                                <div className="mb-8">
                                    <div className="flex items-baseline gap-1">
                                        <span className={`font-mono text-5xl md:text-6xl font-bold leading-none ${plan.highlighted ? '' : 'text-[#F5F1E8]'}`}>
                                            ${isYearly ? plan.price.yearly : plan.price.monthly}
                                        </span>
                                        {plan.price.monthly > 0 && (
                                            <span className={`text-sm ${plan.highlighted ? 'text-[#4A4A4A]' : 'text-[#F5F1E8]/30'}`}>/mo</span>
                                        )}
                                    </div>
                                    {plan.price.monthly > 0 && isYearly && (
                                        <p className={`font-mono text-[10px] mt-2 ${plan.highlighted ? 'text-[#4A4A4A]' : 'text-[#F5F1E8]/20'}`}>
                                            Billed annually (${(plan.price.yearly * 12).toFixed(0)}/yr)
                                        </p>
                                    )}
                                    {plan.price.monthly === 0 && (
                                        <p className={`font-mono text-[10px] mt-2 ${plan.highlighted ? 'text-[#4A4A4A]' : 'text-[#F5F1E8]/20'}`}>
                                            Free forever
                                        </p>
                                    )}
                                </div>

                                <button
                                    className={`w-full py-4 text-sm font-medium tracking-wide transition-colors duration-200 mb-8 ${
                                        plan.highlighted
                                            ? 'bg-[#1A1A1A] text-[#F5F1E8] hover:bg-[#8C7A6B]'
                                            : 'bg-[#F5F1E8] text-[#1A1A1A] hover:bg-[#8C7A6B] hover:text-[#F5F1E8]'
                                    }`}
                                >
                                    {plan.cta}
                                </button>

                                <div className="space-y-3 flex-1">
                                    {plan.features.map((feature, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <span className="w-1.5 h-1.5 bg-[#8C7A6B] mt-1.5 shrink-0" />
                                            <span className={`text-sm ${plan.highlighted ? 'text-[#4A4A4A]' : 'text-[#F5F1E8]/50'}`}>
                                                {feature}
                                            </span>
                                        </div>
                                    ))}
                                    {plan.limitations.map((limitation, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <span className={`w-1.5 h-1.5 mt-1.5 shrink-0 ${plan.highlighted ? 'bg-[#1A1A1A]/15' : 'bg-[#F5F1E8]/10'}`} />
                                            <span className={`text-sm line-through ${plan.highlighted ? 'text-[#4A4A4A]/30' : 'text-[#F5F1E8]/15'}`}>
                                                {limitation}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom trust bar */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="mt-12 pt-8 border-t border-[#F5F1E8]/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                    <div className="flex items-center gap-8 text-[#F5F1E8]/20">
                        <span className="font-mono text-[10px] tracking-wider uppercase">No commitment</span>
                        <span className="font-mono text-[10px] tracking-wider uppercase">Cancel anytime</span>
                        <span className="font-mono text-[10px] tracking-wider uppercase">100% your royalties</span>
                    </div>
                    <p className="font-mono text-[10px] text-[#F5F1E8]/20">
                        All prices in USD. Taxes may apply.
                    </p>
                </motion.div>
            </div>
        </section>
    )
}
