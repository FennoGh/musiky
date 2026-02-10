
export default function Hero() {
    return (
        <section className='min-h-screen pt-32 pb-10 md:pt-42 relative flex flex-col w-full overflow-hidden'>
            {/* Imagen de fondo */}
            <div className='absolute inset-0 bg-[url("../images/micro.jpg")] bg-cover bg-center brightness-[0.35] scale-105 -scale-x-100'></div>

            {/* Contenido principal */}
            <div className="z-10 px-6 md:px-12 lg:px-48 w-full">
                <h1 className="text-inverse text-6xl max-md:text-4xl font-bold tracking-tighter">
                    Colabora. Distribuye.
                </h1>
                <h1 className="text-inverse text-6xl max-md:text-4xl font-bold tracking-tighter leading-snug">
                    Cobra sin dramas.
                </h1>
                <p className="text-inverse mt-6 max-md:text-sm">
                    La plataforma donde los equipos musicales gestionan proyectos, distribuyen su música y cobran automáticamente. Sin Excel, sin perseguir a nadie.
                </p>

                <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-8 mt-10 md:mt-14 text-inverse">
                    <article className="group relative w-full h-auto md:h-[200px] flex flex-col justify-center items-center bg-[#fff7e9]/10 backdrop-blur-sm rounded-2xl p-6 cursor-default transition-all duration-500 ease-out md:hover:bg-[#fff7e9]/20 md:hover:scale-[1.02] md:hover:shadow-2xl md:hover:shadow-black/20">
                        <h2 className="font-medium text-xl md:text-2xl transition-all duration-300 ease-out md:group-hover:opacity-0 md:group-hover:scale-95">Proyectos colaborativos</h2>

                        {/* Mobile: siempre visible */}
                        <div className="md:hidden mt-4">
                            <p className="text-sm">
                                Crea proyectos, invita colaboradores y define porcentajes. Todos ven el progreso, los gastos y los ingresos en tiempo real.
                            </p>
                            <a href="#" className="block text-sm border-t border-gray-300 p-2 mt-4">Ver más →</a>
                        </div>

                        {/* Desktop: hover */}
                        <div className="hidden md:flex absolute inset-0 flex-col justify-between p-6 pointer-events-none group-hover:pointer-events-auto">
                            <p className="text-base opacity-0 -translate-y-4 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:translate-y-0 group-hover:delay-100">
                                Crea proyectos, invita colaboradores y define porcentajes. Todos ven el progreso, los gastos y los ingresos en tiempo real.
                            </p>
                            <a href="#" className="text-base opacity-0 translate-y-4 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:translate-y-0 group-hover:delay-200 border-t border-gray-300 p-2 text-left">Ver más →</a>
                        </div>
                    </article>

                    <article className="group relative w-full h-auto md:h-[200px] flex flex-col justify-center items-center bg-[#fff7e9]/10 backdrop-blur-sm rounded-2xl p-6 cursor-default transition-all duration-500 ease-out md:hover:bg-[#fff7e9]/20 md:hover:scale-[1.02] md:hover:shadow-2xl md:hover:shadow-black/20">
                        <h2 className="font-medium text-xl md:text-2xl transition-all duration-300 ease-out md:group-hover:opacity-0 md:group-hover:scale-95">Finanzas transparentes</h2>

                        {/* Mobile: siempre visible */}
                        <div className="md:hidden mt-4">
                            <p className="text-sm">
                                Registra gastos, calcula el break-even y ve quién pagó qué. Cero sorpresas, cero discusiones sobre dinero.
                            </p>
                            <a href="#" className="block text-sm border-t border-gray-300 p-2 mt-4">Ver más →</a>
                        </div>

                        {/* Desktop: hover */}
                        <div className="hidden md:flex absolute inset-0 flex-col justify-between p-6 pointer-events-none group-hover:pointer-events-auto">
                            <p className="text-base opacity-0 -translate-y-4 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:translate-y-0 group-hover:delay-100">
                                Registra gastos, calcula el break-even y ve quién pagó qué. Cero sorpresas, cero discusiones sobre dinero.
                            </p>
                            <a href="#" className="text-base opacity-0 translate-y-4 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:translate-y-0 group-hover:delay-200 border-t border-gray-300 p-2 text-left">Ver más →</a>
                        </div>
                    </article>

                    <article className="group relative w-full h-auto md:h-[200px] flex flex-col justify-center items-center bg-[#fff7e9]/10 backdrop-blur-sm rounded-2xl p-6 cursor-default transition-all duration-500 ease-out md:hover:bg-[#fff7e9]/20 md:hover:scale-[1.02] md:hover:shadow-2xl md:hover:shadow-black/20">
                        <h2 className="font-medium text-xl md:text-2xl transition-all duration-300 ease-out md:group-hover:opacity-0 md:group-hover:scale-95">Splits automáticos</h2>

                        {/* Mobile: siempre visible */}
                        <div className="md:hidden mt-4">
                            <p className="text-sm">
                                Firma contratos digitales, distribuye a +150 plataformas y cobra automáticamente tu porcentaje. Sin perseguir a nadie.
                            </p>
                            <a href="#" className="block text-sm border-t border-gray-300 p-2 mt-4">Ver más →</a>
                        </div>

                        {/* Desktop: hover */}
                        <div className="hidden md:flex absolute inset-0 flex-col justify-between p-6 pointer-events-none group-hover:pointer-events-auto">
                            <p className="text-base opacity-0 -translate-y-4 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:translate-y-0 group-hover:delay-100">
                                Firma contratos digitales, distribuye a +150 plataformas y cobra automáticamente tu porcentaje. Sin perseguir a nadie.
                            </p>
                            <a href="#" className="text-base opacity-0 translate-y-4 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:translate-y-0 group-hover:delay-200 border-t border-gray-300 p-2 text-left">Ver más →</a>
                        </div>
                    </article>
                </div>
            </div>
        </section>
    )
}
