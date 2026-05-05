'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import DashboardHeader from '@/components/dashboard/DashboardHeader'
import { ApiError, apiFetch, getToken } from '@/lib/api'
import { formatMoney } from '@/lib/format'

type Plan = 'STARTER' | 'PRO' | 'TEAM'
type ExpenseCategory =
    | 'MARKETING'
    | 'PRODUCTION'
    | 'MASTERING'
    | 'VIDEO'
    | 'LEGAL'
    | 'OTHER'

const CATEGORIES: ExpenseCategory[] = [
    'MARKETING',
    'PRODUCTION',
    'MASTERING',
    'VIDEO',
    'LEGAL',
    'OTHER',
]

type User = {
    id: string
    email: string
    name: string | null
    plan: Plan
}

type Project = {
    id: string
    title: string
    isOwner: boolean
}

type Expense = {
    id: string
    category: ExpenseCategory
    amount: string
    currency: string
    description: string | null
    spentAt: string
}

function formatDate(iso: string): string {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

function StatusPill({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center font-mono text-[9px] tracking-[0.2em] uppercase border border-[#1A1A1A]/20 px-2 py-0.5 text-[#1A1A1A]/80">
            {children}
        </span>
    )
}

export default function ExpensesPage() {
    const router = useRouter()
    const params = useParams<{ id: string }>()
    const projectId = params?.id ?? ''

    const [user, setUser] = useState<User | null>(null)
    const [project, setProject] = useState<Project | null>(null)
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [category, setCategory] = useState<ExpenseCategory>('PRODUCTION')
    const [amount, setAmount] = useState('')
    const [currency, setCurrency] = useState('USD')
    const [description, setDescription] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    const [filter, setFilter] = useState<ExpenseCategory | 'ALL'>('ALL')

    useEffect(() => {
        if (!getToken()) {
            router.replace('/login')
            return
        }
        if (!projectId) return
        let cancelled = false
        ;(async () => {
            try {
                const [me, prj, exps] = await Promise.all([
                    apiFetch<User>('/me'),
                    apiFetch<Project>(`/projects/${projectId}`),
                    apiFetch<Expense[]>(`/projects/${projectId}/expenses`),
                ])
                if (cancelled) return
                setUser(me)
                setProject(prj)
                setExpenses(exps)
            } catch (err) {
                if (cancelled) return
                if (err instanceof ApiError && err.status === 401) {
                    router.replace('/login')
                    return
                }
                setError(
                    err instanceof ApiError && err.status === 404
                        ? 'Project not found'
                        : err instanceof Error
                          ? err.message
                          : 'Failed to load'
                )
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [router, projectId])

    const total = useMemo(
        () => expenses.reduce((s, e) => s + Number(e.amount), 0),
        [expenses]
    )

    const byCategory = useMemo(() => {
        const map = new Map<ExpenseCategory, number>()
        CATEGORIES.forEach((c) => map.set(c, 0))
        expenses.forEach((e) =>
            map.set(e.category, (map.get(e.category) ?? 0) + Number(e.amount))
        )
        return map
    }, [expenses])

    const visible = useMemo(
        () => (filter === 'ALL' ? expenses : expenses.filter((e) => e.category === filter)),
        [expenses, filter]
    )
    const visibleTotal = useMemo(
        () => visible.reduce((s, e) => s + Number(e.amount), 0),
        [visible]
    )

    const largestCategory = useMemo<{ cat: ExpenseCategory; amt: number } | null>(() => {
        let topCat: ExpenseCategory | null = null
        let topAmt = 0
        byCategory.forEach((amt, cat) => {
            if (amt > topAmt) {
                topAmt = amt
                topCat = cat
            }
        })
        return topCat ? { cat: topCat, amt: topAmt } : null
    }, [byCategory])

    async function handleLog(e: React.FormEvent) {
        e.preventDefault()
        setFormError(null)

        const amt = Number(amount)
        if (!Number.isFinite(amt) || amt <= 0) {
            setFormError('Amount must be greater than 0')
            return
        }
        const cur = currency.trim().toUpperCase()
        if (cur.length !== 3) {
            setFormError('Currency must be a 3-letter ISO code')
            return
        }

        setSubmitting(true)
        try {
            const created = await apiFetch<Expense>(`/projects/${projectId}/expenses`, {
                method: 'POST',
                body: JSON.stringify({
                    category,
                    amount: amt,
                    currency: cur,
                    description: description.trim() || null,
                }),
            })
            setExpenses((prev) => [created, ...prev])
            setAmount('')
            setDescription('')
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                router.replace('/login')
                return
            }
            setFormError(err instanceof Error ? err.message : 'Could not log expense')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center">
                <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#1A1A1A]/55">
                    Loading expenses…
                </p>
            </div>
        )
    }

    if (error || !project) {
        return (
            <div className="min-h-screen bg-[#F5F1E8]">
                <DashboardHeader user={user} />
                <main className="px-6 md:px-12 lg:px-24 pt-40 pb-24 max-w-3xl mx-auto text-center">
                    <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#1A1A1A]/85 mb-6">
                        {error ?? 'Project not found'}
                    </p>
                    <Link
                        href="/dashboard"
                        className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-colors"
                    >
                        ← Back to dashboard
                    </Link>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#F5F1E8] text-[#1A1A1A]">
            <DashboardHeader user={user} />

            <main className="px-6 md:px-12 lg:px-24 pt-32 pb-24 max-w-5xl mx-auto">
                {/* Breadcrumb */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.05 }}
                    className="flex items-center gap-2 mb-10 font-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/55"
                >
                    <Link href="/dashboard" className="hover:text-[#1A1A1A] transition-colors">
                        Workspace
                    </Link>
                    <span className="text-[#1A1A1A]/30">/</span>
                    <Link
                        href={`/dashboard/projects/${projectId}`}
                        className="hover:text-[#1A1A1A] transition-colors truncate"
                    >
                        {project.title}
                    </Link>
                    <span className="text-[#1A1A1A]/30">/</span>
                    <span className="text-[#1A1A1A]/85">Expenses</span>
                </motion.div>

                {/* Hero */}
                <section className="mb-14">
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#1A1A1A]/60 mb-4"
                    >
                        Outflow
                    </motion.p>
                    <div>
                        <div className="overflow-hidden">
                            <motion.h1
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                transition={{
                                    duration: 1,
                                    delay: 0.2,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                className="font-serif text-5xl sm:text-6xl md:text-7xl font-normal italic leading-[1] tracking-tight text-[#1A1A1A]"
                            >
                                What it
                            </motion.h1>
                        </div>
                        <div className="overflow-hidden">
                            <motion.h1
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                transition={{
                                    duration: 1,
                                    delay: 0.35,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                className="font-mono text-5xl sm:text-6xl md:text-7xl font-bold leading-[1] tracking-tighter text-[#1A1A1A]"
                            >
                                cost to make.
                            </motion.h1>
                        </div>
                    </div>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="font-mono text-[11px] tracking-wider text-[#1A1A1A]/60 mt-6 max-w-md"
                    >
                        Track every expense by category. The total feeds your break-even
                        calculation against revenue.
                    </motion.p>
                </section>

                {/* Stats strip */}
                <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.65 }}
                    className="grid grid-cols-2 sm:grid-cols-3 gap-[1px] bg-[#1A1A1A]/10 border border-[#1A1A1A]/10 mb-10"
                >
                    <div className="col-span-2 sm:col-span-1 bg-[#1A1A1A] p-5">
                        <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-[#F5F1E8]/50 mb-3">
                            Total spent
                        </p>
                        <p className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-rose-400 break-words">
                            {formatMoney(total)}
                        </p>
                    </div>
                    <div className="bg-[#F5F1E8] p-5">
                        <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-[#1A1A1A]/55 mb-3">
                            Entries
                        </p>
                        <p className="font-mono text-2xl sm:text-3xl font-bold tracking-tight">
                            {expenses.length}
                        </p>
                    </div>
                    <div className="bg-[#F5F1E8] p-5">
                        <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-[#1A1A1A]/55 mb-3">
                            Top category
                        </p>
                        <p className="font-mono text-base sm:text-lg font-bold tracking-tight truncate">
                            {largestCategory?.cat ?? '—'}
                        </p>
                        {largestCategory && (
                            <p className="font-mono text-[10px] text-[#1A1A1A]/55 mt-1">
                                {formatMoney(largestCategory.amt)}
                            </p>
                        )}
                    </div>
                </motion.section>

                {/* Category breakdown bar */}
                {total > 0 && (
                    <motion.section
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.7 }}
                        className="mb-12"
                    >
                        <div className="flex items-baseline justify-between mb-3">
                            <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/55">
                                Breakdown
                            </p>
                            <p className="font-mono text-[10px] text-[#1A1A1A]/55">
                                {CATEGORIES.filter((c) => (byCategory.get(c) ?? 0) > 0).length} of{' '}
                                {CATEGORIES.length} categories used
                            </p>
                        </div>
                        <div className="h-[6px] bg-[#1A1A1A]/[0.06] overflow-hidden flex mb-4">
                            {CATEGORIES.map((c, i) => {
                                const amt = byCategory.get(c) ?? 0
                                const pct = total > 0 ? (amt / total) * 100 : 0
                                if (pct === 0) return null
                                return (
                                    <motion.div
                                        key={c}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        transition={{
                                            duration: 1,
                                            delay: 0.75 + i * 0.05,
                                            ease: [0.22, 1, 0.36, 1],
                                        }}
                                        className={i % 2 === 0 ? 'bg-[#1A1A1A]' : 'bg-[#8C7A6B]'}
                                    />
                                )
                            })}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {CATEGORIES.map((c) => {
                                const amt = byCategory.get(c) ?? 0
                                if (amt === 0) return null
                                const pct = total > 0 ? (amt / total) * 100 : 0
                                return (
                                    <div
                                        key={c}
                                        className="flex items-baseline justify-between gap-3"
                                    >
                                        <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1A1A]/55 truncate">
                                            {c}
                                        </span>
                                        <span className="font-mono text-[10px] font-bold text-[#1A1A1A] shrink-0">
                                            {pct.toFixed(0)}%
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </motion.section>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                    {/* Ledger */}
                    <motion.section
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.75 }}
                        className="lg:col-span-3"
                    >
                        <div className="flex items-end justify-between mb-6 pb-4 border-b border-[#1A1A1A]/10">
                            <div>
                                <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/55 mb-2">
                                    {visible.length}{' '}
                                    {visible.length === 1 ? 'entry' : 'entries'}
                                </p>
                                <h2 className="font-mono text-2xl font-bold tracking-tight">
                                    Ledger
                                </h2>
                            </div>
                        </div>

                        {/* Filter chips */}
                        <div className="flex items-center gap-1 flex-wrap mb-5">
                            {(['ALL', ...CATEGORIES] as const).map((c) => {
                                const active = filter === c
                                const count =
                                    c === 'ALL'
                                        ? expenses.length
                                        : expenses.filter((e) => e.category === c).length
                                return (
                                    <button
                                        key={c}
                                        onClick={() => setFilter(c)}
                                        disabled={c !== 'ALL' && count === 0}
                                        className={`font-mono text-[9px] tracking-[0.2em] uppercase px-2.5 py-1 border transition-colors ${
                                            active
                                                ? 'bg-[#1A1A1A] text-[#F5F1E8] border-[#1A1A1A]'
                                                : 'border-[#1A1A1A]/15 text-[#1A1A1A]/55 hover:text-[#1A1A1A] hover:border-[#1A1A1A]/40 disabled:opacity-30 disabled:hover:text-[#1A1A1A]/55 disabled:hover:border-[#1A1A1A]/15 disabled:cursor-not-allowed'
                                        }`}
                                    >
                                        {c} {count > 0 && <span>· {count}</span>}
                                    </button>
                                )
                            })}
                        </div>

                        {visible.length === 0 ? (
                            <div className="border border-dashed border-[#1A1A1A]/15 px-6 py-12 text-center">
                                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/55">
                                    {expenses.length === 0
                                        ? 'No expenses logged yet'
                                        : 'No expenses in this category'}
                                </p>
                            </div>
                        ) : (
                            <div className="border border-[#1A1A1A]/10 divide-y divide-[#1A1A1A]/10">
                                {visible.map((e) => (
                                    <div
                                        key={e.id}
                                        className="px-5 py-4 flex items-center justify-between gap-4"
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <StatusPill>{e.category}</StatusPill>
                                            <div className="min-w-0">
                                                <p className="font-mono text-[11px] text-[#1A1A1A]/85 truncate">
                                                    {e.description ?? '—'}
                                                </p>
                                                <p className="font-mono text-[9px] text-[#1A1A1A]/45 mt-0.5">
                                                    {formatDate(e.spentAt)}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="font-mono text-sm font-bold shrink-0 text-rose-500">
                                            −{formatMoney(e.amount, e.currency)}
                                        </p>
                                    </div>
                                ))}
                                <div className="flex items-center justify-between px-5 py-3 bg-[#1A1A1A]/[0.03]">
                                    <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1A1A]/55">
                                        {filter === 'ALL' ? 'Total' : `${filter} total`}
                                    </p>
                                    <p className="font-mono text-sm font-bold text-rose-500">
                                        {formatMoney(visibleTotal)}
                                    </p>
                                </div>
                            </div>
                        )}
                    </motion.section>

                    {/* Log form (owner only) */}
                    <motion.section
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.85 }}
                        className="lg:col-span-2"
                    >
                        {!project.isOwner ? (
                            <div className="border border-dashed border-[#8C7A6B]/40 p-6 sticky top-32 text-center">
                                <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#8C7A6B] mb-2">
                                    View only
                                </p>
                                <p className="font-mono text-[11px] text-[#1A1A1A]/60 leading-relaxed">
                                    Only the project owner can log expenses.
                                </p>
                            </div>
                        ) : (
                        <div className="border border-[#1A1A1A]/10 p-6 sticky top-32">
                            <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/55 mb-2">
                                New entry
                            </p>
                            <h3 className="font-mono text-xl font-bold tracking-tight mb-6">
                                Log expense
                            </h3>

                            <form onSubmit={handleLog} className="space-y-6">
                                <div>
                                    <label
                                        htmlFor="category"
                                        className="block font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/70 mb-2"
                                    >
                                        Category
                                    </label>
                                    <select
                                        id="category"
                                        value={category}
                                        onChange={(e) =>
                                            setCategory(e.target.value as ExpenseCategory)
                                        }
                                        disabled={submitting}
                                        className="w-full bg-transparent border-b border-[#1A1A1A]/20 focus:border-[#1A1A1A] outline-none py-2 font-mono text-sm text-[#1A1A1A] transition-colors disabled:opacity-50 appearance-none cursor-pointer"
                                    >
                                        {CATEGORIES.map((c) => (
                                            <option key={c} value={c}>
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-2">
                                        <label
                                            htmlFor="amount"
                                            className="block font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/70 mb-2"
                                        >
                                            Amount
                                        </label>
                                        <input
                                            id="amount"
                                            type="number"
                                            min={0}
                                            step={0.01}
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            disabled={submitting}
                                            placeholder="120.00"
                                            className="w-full bg-transparent border-b border-[#1A1A1A]/20 focus:border-[#1A1A1A] outline-none py-2 font-mono text-2xl font-bold text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 transition-colors disabled:opacity-50"
                                        />
                                    </div>
                                    <div>
                                        <label
                                            htmlFor="currency"
                                            className="block font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/70 mb-2"
                                        >
                                            Cur.
                                        </label>
                                        <input
                                            id="currency"
                                            type="text"
                                            value={currency}
                                            onChange={(e) =>
                                                setCurrency(e.target.value.toUpperCase())
                                            }
                                            disabled={submitting}
                                            maxLength={3}
                                            className="w-full bg-transparent border-b border-[#1A1A1A]/20 focus:border-[#1A1A1A] outline-none py-2 font-mono text-2xl font-bold text-[#1A1A1A] uppercase tracking-tight transition-colors disabled:opacity-50"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label
                                        htmlFor="description"
                                        className="block font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/70 mb-2"
                                    >
                                        Description{' '}
                                        <span className="text-[#1A1A1A]/40 normal-case tracking-normal">
                                            (optional)
                                        </span>
                                    </label>
                                    <input
                                        id="description"
                                        type="text"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        disabled={submitting}
                                        placeholder="Mastering at Studio X"
                                        maxLength={200}
                                        className="w-full bg-transparent border-b border-[#1A1A1A]/20 focus:border-[#1A1A1A] outline-none py-2 font-mono text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 transition-colors disabled:opacity-50"
                                    />
                                </div>

                                {formError && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex items-center gap-3 px-3 py-2.5 border border-[#1A1A1A]/20"
                                    >
                                        <div className="w-1 h-1 bg-[#8C7A6B] animate-pulse-dot rounded-full" />
                                        <p className="font-mono text-[9px] tracking-wider uppercase text-[#1A1A1A]/85">
                                            {formError}
                                        </p>
                                    </motion.div>
                                )}

                                <button
                                    type="submit"
                                    disabled={submitting || !amount}
                                    className="w-full font-mono text-[10px] tracking-[0.2em] uppercase px-4 py-3 bg-[#1A1A1A] text-[#F5F1E8] hover:bg-[#8C7A6B] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#1A1A1A]"
                                >
                                    {submitting ? 'Logging…' : 'Log expense →'}
                                </button>
                            </form>
                        </div>
                        )}
                    </motion.section>
                </div>
            </main>
        </div>
    )
}
