'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const SALES_EMAIL = 'sales@musiky.dev'

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
        contactSales: false,
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
        cta: 'Contact sales',
        contactSales: true,
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
        contactSales: true,
        highlighted: false,
    },
]

export default function Pricing() {
    const [isYearly, setIsYearly] = useState(true)
    const [salesOpen, setSalesOpen] = useState(false)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (!salesOpen) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSalesOpen(false)
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [salesOpen])

    async function copyEmail() {
        try {
            await navigator.clipboard.writeText(SALES_EMAIL)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch {
            // ignore — user can still read & copy manually
        }
    }

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

                                {plan.contactSales ? (
                                    <button
                                        onClick={() => setSalesOpen(true)}
                                        className={`w-full py-4 text-sm font-medium tracking-wide transition-colors duration-200 mb-8 ${
                                            plan.highlighted
                                                ? 'bg-[#1A1A1A] text-[#F5F1E8] hover:bg-[#8C7A6B]'
                                                : 'bg-[#F5F1E8] text-[#1A1A1A] hover:bg-[#8C7A6B] hover:text-[#F5F1E8]'
                                        }`}
                                    >
                                        {plan.cta}
                                    </button>
                                ) : (
                                    <Link
                                        href="/register"
                                        className={`w-full block text-center py-4 text-sm font-medium tracking-wide transition-colors duration-200 mb-8 ${
                                            plan.highlighted
                                                ? 'bg-[#1A1A1A] text-[#F5F1E8] hover:bg-[#8C7A6B]'
                                                : 'bg-[#F5F1E8] text-[#1A1A1A] hover:bg-[#8C7A6B] hover:text-[#F5F1E8]'
                                        }`}
                                    >
                                        {plan.cta}
                                    </Link>
                                )}

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

            <AnimatePresence>
                {salesOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 flex items-center justify-center px-6"
                        onClick={() => setSalesOpen(false)}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="sales-modal-title"
                    >
                        <div className="absolute inset-0 bg-[#1A1A1A]/80 backdrop-blur-sm" />
                        <motion.div
                            initial={{ opacity: 0, y: 16, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 16, scale: 0.98 }}
                            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-md bg-[#F5F1E8] text-[#1A1A1A] p-8 md:p-10"
                        >
                            <button
                                onClick={() => setSalesOpen(false)}
                                aria-label="Close"
                                className="absolute top-4 right-4 font-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/45 hover:text-[#1A1A1A] transition-colors"
                            >
                                ✕ Close
                            </button>

                            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#1A1A1A]/55 mb-3">
                                Talk to us
                            </p>
                            <h3
                                id="sales-modal-title"
                                className="font-mono text-2xl md:text-3xl font-bold tracking-tight mb-4"
                            >
                                Contact sales
                            </h3>
                            <p className="text-sm text-[#1A1A1A]/65 leading-relaxed mb-6">
                                Reach out to our sales team to upgrade your plan, ask about volume
                                pricing, or discuss a custom setup for your label. We typically
                                reply within one business day.
                            </p>

                            <div className="border border-[#1A1A1A]/15 px-4 py-3 mb-3 flex items-center justify-between gap-4">
                                <a
                                    href={`mailto:${SALES_EMAIL}?subject=Musiky%20plan%20upgrade`}
                                    className="font-mono text-sm text-[#1A1A1A] truncate hover:text-[#8C7A6B] transition-colors"
                                >
                                    {SALES_EMAIL}
                                </a>
                                <button
                                    onClick={copyEmail}
                                    className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/55 hover:text-[#1A1A1A] transition-colors shrink-0"
                                >
                                    {copied ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                            <p className="font-mono text-[10px] tracking-wider text-[#1A1A1A]/40">
                                Click the address to open your email client.
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    )
}
