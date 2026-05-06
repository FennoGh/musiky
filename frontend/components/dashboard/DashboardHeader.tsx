'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { clearToken } from '@/lib/api'

type Plan = 'STARTER' | 'PRO' | 'TEAM'

type Props = {
    user: { name: string | null; email: string; plan: Plan } | null
}

export default function DashboardHeader({ user }: Props) {
    const router = useRouter()

    function handleSignOut() {
        clearToken()
        router.replace('/login')
    }

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#F5F1E8]/90 backdrop-blur-sm border-b border-[#1A1A1A]/[0.06]">
            <div className="flex justify-between items-center px-6 md:px-12 lg:px-24 py-5">
                <Link href="/dashboard" className="flex items-baseline gap-2">
                    <span className="font-mono text-lg font-bold tracking-tight uppercase">
                        Musiky
                    </span>
                    <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/40 hidden sm:inline">
                        / workspace
                    </span>
                </Link>
                <div className="flex items-center gap-4 sm:gap-5">
                    <span className="font-mono text-[11px] text-[#1A1A1A]/70 hidden sm:inline">
                        {user?.name ?? user?.email ?? '—'}
                    </span>
                    {user && (
                        <span className="font-mono text-[9px] tracking-[0.2em] uppercase border border-[#1A1A1A]/20 px-2 py-0.5 text-[#1A1A1A]/80">
                            {user.plan}
                        </span>
                    )}
                    <button
                        onClick={handleSignOut}
                        className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-colors"
                    >
                        Sign out
                    </button>
                </div>
            </div>
        </header>
    )
}
