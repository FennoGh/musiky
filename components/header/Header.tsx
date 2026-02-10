'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const isActive = isScrolled || isHovered || isMenuOpen

    return (
        <>
            <header
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`flex justify-between items-center px-48 max-lg:px-8 py-6 w-full z-50 fixed transition-colors duration-200 ${
                    isActive
                        ? 'bg-[#fff7e9] text-[#252525] shadow-lg'
                        : 'text-inverse border-b border-gray-700'
                }`}
            >
                <nav className='flex gap-6 items-center text-sm'>
                    <Link href='/' className='text-xl font-bold tracking-tight'>
                        Musiky
                    </Link>
                    <Link href='#funcionalidades' className='opacity-70 hover:opacity-100 transition-all duration-150 max-md:hidden'>
                        Funcionalidades
                    </Link>
                    <Link href='#como-funciona' className='opacity-70 hover:opacity-100 transition-all duration-150 max-md:hidden'>
                        Cómo funciona
                    </Link>
                    <Link href='#precios' className='opacity-70 hover:opacity-100 transition-all duration-150 max-md:hidden'>
                        Precios
                    </Link>
                </nav>

                <nav className='flex gap-4 items-center text-sm'>
                    <Link href='/login' className='opacity-70 hover:opacity-100 transition-all duration-150 hover:scale-110 max-md:hidden'>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                        </svg>
                    </Link>
                    <Link
                        href='/register'
                        className={`px-5 py-2.5 rounded-full font-medium transition-all duration-150 hover:scale-105 hover:shadow-lg max-md:hidden ${
                            isActive
                                ? 'bg-[#252525] text-[#fff7e9]'
                                : 'bg-[#fff7e9] text-[#252525]'
                        }`}
                    >
                        Empezar gratis
                    </Link>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className='md:hidden p-1'
                        aria-label='Menu'
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M3.75 9h16.5m-16.5 6h16.5"} />
                        </svg>
                    </button>
                </nav>
            </header>

            {/* Mobile dropdown menu */}
            <div className={`md:hidden fixed top-[72px] left-0 right-0 z-40 bg-[#fff7e9] text-[#252525] shadow-lg transition-all duration-300 ${
                isMenuOpen
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 -translate-y-4 pointer-events-none'
            }`}>
                <nav className='flex flex-col px-8 py-6 gap-4 text-sm'>
                    <Link href='#funcionalidades' onClick={() => setIsMenuOpen(false)} className='py-2'>
                        Funcionalidades
                    </Link>
                    <Link href='#como-funciona' onClick={() => setIsMenuOpen(false)} className='py-2'>
                        Cómo funciona
                    </Link>
                    <Link href='#precios' onClick={() => setIsMenuOpen(false)} className='py-2'>
                        Precios
                    </Link>
                    <hr className='border-[#252525]/10 my-2' />
                    <Link href='/login' onClick={() => setIsMenuOpen(false)} className='py-2'>
                        Iniciar sesión
                    </Link>
                    <Link
                        href='/register'
                        onClick={() => setIsMenuOpen(false)}
                        className='bg-[#252525] text-[#fff7e9] px-5 py-2.5 rounded-full font-medium text-center mt-2'
                    >
                        Empezar gratis
                    </Link>
                </nav>
            </div>
        </>
    )
}
