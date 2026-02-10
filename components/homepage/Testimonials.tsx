'use client'

import { motion } from 'framer-motion'

const testimonials = [
    { quote: 'Adiós al Excel de los splits', name: 'María G.', role: 'Artista' },
    { quote: 'Contratos firmados en 2 minutos', name: 'Carlos R.', role: 'Productor' },
    { quote: 'Por fin sé cuándo recupero la inversión', name: 'Alex V.', role: 'Manager' },
    { quote: 'Mis colaboradores cobran automáticamente', name: 'Luna B.', role: 'Beatmaker' },
    { quote: 'Todo en un solo lugar, al fin', name: 'Diego M.', role: 'Artista' },
    { quote: 'Cero dramas con los pagos', name: 'Sara L.', role: 'Productora' },
]

const testimonials2 = [
    { quote: 'Transparencia total con mi equipo', name: 'Pablo N.', role: 'Manager' },
    { quote: 'Reportes que realmente entiendo', name: 'Ana T.', role: 'Artista' },
    { quote: 'El onboarding fue instantáneo', name: 'Javier S.', role: 'Sello' },
    { quote: 'Mis artistas están felices', name: 'Marta C.', role: 'Manager' },
    { quote: 'Simple y sin comisiones ocultas', name: 'Rafa G.', role: 'Productor' },
    { quote: 'La mejor decisión del año', name: 'Elena P.', role: 'Artista' },
]

function TestimonialCard({ quote, name, role }: { quote: string; name: string; role: string }) {
    return (
        <div className="flex-shrink-0 px-6 py-4 bg-white rounded-full border border-[#252525]/10 flex items-center gap-4 hover:border-[#252525]/30 transition-colors">
            <span className="text-[#252525]/80">{quote}</span>
            <span className="text-[#252525]/30">—</span>
            <span className="text-sm whitespace-nowrap">
                <span className="font-medium">{name}</span>
                <span className="opacity-50 ml-1">{role}</span>
            </span>
        </div>
    )
}

function MarqueeRow({ items, direction = 'left', speed = 25 }: { items: typeof testimonials; direction?: 'left' | 'right'; speed?: number }) {
    const duplicated = [...items, ...items]

    return (
        <div className="relative overflow-hidden">
            <motion.div
                className="flex gap-4"
                animate={{
                    x: direction === 'left' ? ['0%', '-50%'] : ['-50%', '0%'],
                }}
                transition={{
                    x: {
                        repeat: Infinity,
                        repeatType: 'loop',
                        duration: speed,
                        ease: 'linear',
                    },
                }}
            >
                {duplicated.map((testimonial, index) => (
                    <TestimonialCard key={index} {...testimonial} />
                ))}
            </motion.div>
        </div>
    )
}

export default function Testimonials() {
    return (
        <section id="testimonios" className="py-24 md:py-32 overflow-hidden">
            <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-48 mb-12">
                <p className="text-sm tracking-widest uppercase mb-4 opacity-50">Testimonios</p>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                    La comunidad habla.
                </h2>
            </div>

            <div className="space-y-4">
                <MarqueeRow items={testimonials} direction="left" speed={30} />
                <MarqueeRow items={testimonials2} direction="right" speed={35} />
            </div>
        </section>
    )
}
