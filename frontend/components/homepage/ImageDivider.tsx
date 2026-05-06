'use client'

import { motion } from 'framer-motion'

export default function ImageDivider() {
    return (
        <section className="relative h-[50vh] md:h-[70vh] overflow-hidden">
            <div className="absolute inset-0 bg-[url('../images/micro.jpg')] bg-cover bg-center brightness-[0.2] scale-105" />

            <div className="relative z-10 h-full flex flex-col justify-center items-center px-6">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="font-serif text-[8vw] md:text-[5vw] italic font-normal tracking-tight text-[#F5F1E8]/80 text-center leading-[1.1]"
                >
                    There&apos;s a better way.
                </motion.h2>
            </div>

            <div className="absolute top-0 left-0 right-0 h-[1px] bg-[#1A1A1A]/20" />
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#1A1A1A]/20" />
        </section>
    )
}
