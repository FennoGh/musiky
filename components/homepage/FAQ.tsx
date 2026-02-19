'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

const faqs = [
    {
        question: 'How do automatic splits work?',
        answer: 'Define the percentages, sign the digital contract, and you\'re done. Every time royalties arrive, they\'re distributed automatically according to the agreement. No spreadsheets, no chasing anyone.'
    },
    {
        question: 'Do you take a commission on my royalties?',
        answer: 'No. 100% of your royalties are yours. You only pay the subscription according to your plan. Zero hidden fees, zero surprises.'
    },
    {
        question: 'Which platforms can I distribute to?',
        answer: 'Over 150 platforms: Spotify, Apple Music, YouTube Music, Amazon, Deezer, Tidal, TikTok, Instagram, Shazam, and more. One click, everywhere.'
    },
    {
        question: 'Are digital contracts legally valid?',
        answer: 'Yes. They comply with EU eIDAS regulations. Each signature is recorded with a timestamp, IP address, and all parties receive a signed copy automatically.'
    },
    {
        question: 'How does expense management work?',
        answer: 'Log project expenses (mastering, videos, promotion), the system calculates break-even, and when revenue comes in, investment is recovered first according to the agreed terms.'
    },
    {
        question: 'Can I cancel anytime?',
        answer: 'Yes, no commitment. Your music stays distributed on all platforms. You only lose access to premium features like contracts and advanced analytics.'
    },
]

export default function FAQ() {
    const [activeIndex, setActiveIndex] = useState<number | null>(null)

    return (
        <section id="faq" className="py-24 md:py-32 px-6 md:px-12 lg:px-24 relative overflow-hidden">
            {/* Giant background question mark */}
            <span className="absolute -right-[10%] top-[5%] font-serif text-[40vw] font-bold leading-none text-[#1A1A1A]/[0.02] select-none pointer-events-none">
                ?
            </span>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    {/* Left column - sticky header */}
                    <div className="lg:col-span-4 lg:sticky lg:top-32 lg:self-start">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <p className="font-mono text-xs tracking-[0.3em] uppercase text-[#4A4A4A] mb-4">FAQ</p>
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-[0.9] mb-6">
                                Common<br />questions.
                            </h2>
                            <p className="text-[#4A4A4A] mb-8 leading-relaxed">
                                If you have more questions, we&apos;re here to help.
                            </p>

                            <a
                                href="mailto:hello@musiky.com"
                                className="inline-flex items-center gap-3 px-6 py-3 bg-[#1A1A1A] text-[#F5F1E8] text-sm font-medium hover:bg-[#8C7A6B] transition-colors duration-200 group"
                            >
                                Contact us
                                <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </a>
                        </motion.div>
                    </div>

                    {/* Right column - accordion */}
                    <div className="lg:col-span-8">
                        <div className="space-y-0">
                            {faqs.map((faq, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.05, duration: 0.4 }}
                                    onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                                    className={`cursor-pointer border-t border-[#1A1A1A]/10 transition-colors duration-200 ${
                                        activeIndex === index ? 'bg-[#1A1A1A] text-[#F5F1E8]' : ''
                                    }`}
                                >
                                    <div className="py-6 md:py-8 px-6 md:px-8">
                                        <div className="flex items-start justify-between gap-6">
                                            <div className="flex items-start gap-4 md:gap-6">
                                                <span className={`font-mono text-xs mt-1 shrink-0 ${
                                                    activeIndex === index ? 'text-[#8C7A6B]' : 'text-[#4A4A4A]/30'
                                                }`}>
                                                    {String(index + 1).padStart(2, '0')}
                                                </span>
                                                <div>
                                                    <h3 className="font-medium text-lg leading-snug">
                                                        {faq.question}
                                                    </h3>
                                                    <motion.div
                                                        initial={false}
                                                        animate={{
                                                            height: activeIndex === index ? 'auto' : 0,
                                                            opacity: activeIndex === index ? 1 : 0,
                                                            marginTop: activeIndex === index ? 16 : 0
                                                        }}
                                                        transition={{ duration: 0.25 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <p className={`leading-relaxed ${
                                                            activeIndex === index ? 'text-[#F5F1E8]/60' : ''
                                                        }`}>
                                                            {faq.answer}
                                                        </p>
                                                    </motion.div>
                                                </div>
                                            </div>
                                            <motion.span
                                                animate={{ rotate: activeIndex === index ? 45 : 0 }}
                                                transition={{ duration: 0.15 }}
                                                className="font-mono text-xl shrink-0 mt-0.5"
                                            >
                                                +
                                            </motion.span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            <div className="border-t border-[#1A1A1A]/10" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
