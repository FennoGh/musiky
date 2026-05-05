'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function Header() {
    const pathname = usePathname()
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // Dashboard renders its own sub-header — hide the marketing one there.
    if (pathname?.startsWith('/dashboard')) return null

    return (
        <>
            <header
                className={`flex justify-between items-center px-6 md:px-12 lg:px-24 py-5 w-full z-50 fixed transition-all duration-300 ${
                    isScrolled || isMenuOpen
                        ? 'bg-[#F5F1E8]/90 backdrop-blur-sm border-b border-[#1A1A1A]/[0.06]'
                        : 'border-b border-transparent'
                }`}
            >
                <nav className="flex gap-8 items-center text-sm">
                    <Link href="/" className="font-mono text-lg font-bold tracking-tight uppercase">
                        Musiky
                    </Link>
                    <Link href="#funcionalidades" className="text-[#1A1A1A]/35 hover:text-[#1A1A1A] transition-colors duration-200 max-md:hidden">
                        Features
                    </Link>
                    <Link href="#como-funciona" className="text-[#1A1A1A]/35 hover:text-[#1A1A1A] transition-colors duration-200 max-md:hidden">
                        Product
                    </Link>
                    <Link href="#precios" className="text-[#1A1A1A]/35 hover:text-[#1A1A1A] transition-colors duration-200 max-md:hidden">
                        Pricing
                    </Link>
                </nav>

                <nav className="flex gap-4 items-center text-sm">
                    <Link href="/login" className="text-[#1A1A1A]/35 hover:text-[#1A1A1A] transition-colors duration-200 max-md:hidden">
                        Log in
                    </Link>
                    <Link
                        href="/register"
                        className="px-5 py-2 bg-[#1A1A1A] text-[#F5F1E8] text-sm transition-all duration-200 hover:bg-[#8C7A6B] max-md:hidden"
                    >
                        Start now
                    </Link>

                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-1"
                        aria-label="Menu"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M3.75 9h16.5m-16.5 6h16.5"} />
                        </svg>
                    </button>
                </nav>
            </header>

            {/* Mobile menu */}
            <div className={`md:hidden fixed top-[61px] left-0 right-0 z-40 bg-[#F5F1E8] border-b border-[#1A1A1A]/[0.06] transition-all duration-200 ${
                isMenuOpen
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 -translate-y-2 pointer-events-none'
            }`}>
                <nav className="flex flex-col px-6 py-6 gap-4 text-sm">
                    <Link href="#funcionalidades" onClick={() => setIsMenuOpen(false)} className="py-2 text-[#1A1A1A]/40">
                        Features
                    </Link>
                    <Link href="#como-funciona" onClick={() => setIsMenuOpen(false)} className="py-2 text-[#1A1A1A]/40">
                        Product
                    </Link>
                    <Link href="#precios" onClick={() => setIsMenuOpen(false)} className="py-2 text-[#1A1A1A]/40">
                        Pricing
                    </Link>
                    <hr className="border-[#1A1A1A]/[0.06]" />
                    <Link href="/login" onClick={() => setIsMenuOpen(false)} className="py-2 text-[#1A1A1A]/40">
                        Log in
                    </Link>
                    <Link
                        href="/register"
                        onClick={() => setIsMenuOpen(false)}
                        className="bg-[#1A1A1A] text-[#F5F1E8] px-5 py-2.5 text-sm text-center"
                    >
                        Start now
                    </Link>
                </nav>
            </div>
        </>
    )
}
