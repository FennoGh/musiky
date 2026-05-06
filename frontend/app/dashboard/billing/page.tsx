'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import DashboardHeader from '@/components/dashboard/DashboardHeader'
import { ApiError, apiFetch, getToken } from '@/lib/api'
import { formatMoney } from '@/lib/format'

type Plan = 'STARTER' | 'PRO' | 'TEAM'
type InvoiceStatus = 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED'

type User = {
    id: string
    email: string
    name: string | null
    plan: Plan
    createdAt: string
}

type Subscription = {
    id: string
    plan: Plan
    status: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE'
    currentPeriodStart: string
    currentPeriodEnd: string
    cancelAtPeriodEnd: boolean
}

type PaymentMethod = {
    id: string
    type: 'CARD' | 'BANK'
    last4: string
    brand: string | null
    expMonth: number | null
    expYear: number | null
    isDefault: boolean
}

type Invoice = {
    id: string
    amount: string
    currency: string
    status: InvoiceStatus
    description: string
    createdAt: string
    paidAt: string | null
    pdfUrl: string | null
}

/* ── plan definitions ──────────────────────────────────────── */

const PLANS: {
    plan: Plan
    name: string
    price: string
    period: string
    features: string[]
    highlight?: boolean
}[] = [
    {
        plan: 'STARTER',
        name: 'Starter',
        price: '$0',
        period: 'forever',
        features: [
            'Up to 2 projects',
            '3 collaborators per project',
            'Basic analytics',
            'Manual payouts',
            'Community support',
        ],
    },
    {
        plan: 'PRO',
        name: 'Pro',
        price: '$19',
        period: '/mo',
        highlight: true,
        features: [
            'Unlimited projects',
            '10 collaborators per project',
            'Advanced analytics',
            'Auto payouts',
            'Priority support',
            'Contract templates',
            'Revenue forecasting',
        ],
    },
    {
        plan: 'TEAM',
        name: 'Team',
        price: '$49',
        period: '/mo',
        features: [
            'Everything in Pro',
            'Unlimited collaborators',
            'Team roles & permissions',
            'Custom contracts',
            'Dedicated account manager',
            'API access',
            'Audit log exports',
            'SSO (coming soon)',
        ],
    },
]

/* ── helpers ───────────────────────────────────────────────── */

function formatDate(iso: string): string {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

function StatusPill({ status }: { status: string }) {
    const colors: Record<string, string> = {
        ACTIVE: 'border-[#1A1A1A]/20 text-[#1A1A1A]/80',
        PAID: 'border-[#1A1A1A]/20 text-[#1A1A1A]/80',
        CANCELLED: 'border-[#1A1A1A]/15 text-[#1A1A1A]/50',
        PAST_DUE: 'border-[#8C7A6B] text-[#8C7A6B]',
        PENDING: 'border-[#8C7A6B]/60 text-[#8C7A6B]',
        FAILED: 'border-[#8C7A6B] text-[#8C7A6B]',
        REFUNDED: 'border-[#1A1A1A]/15 text-[#1A1A1A]/50',
    }
    const isLive = status === 'ACTIVE' || status === 'PAID'
    return (
        <span
            className={`inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.2em] uppercase border px-2 py-0.5 ${colors[status] ?? colors.PENDING}`}
        >
            {isLive && (
                <span className="w-1 h-1 bg-[#8C7A6B] animate-pulse-dot rounded-full" />
            )}
            {status}
        </span>
    )
}

/* ── component ─────────────────────────────────────────────── */

export default function BillingPage() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [subscription, setSubscription] = useState<Subscription | null>(null)
    const [methods, setMethods] = useState<PaymentMethod[]>([])
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [upgrading, setUpgrading] = useState<Plan | null>(null)
    const [cancelling, setCancelling] = useState(false)

    useEffect(() => {
        if (!getToken()) {
            router.replace('/login')
            return
        }
        let cancelled = false
        ;(async () => {
            try {
                const [me, sub, pm, inv] = await Promise.all([
                    apiFetch<User>('/me'),
                    apiFetch<Subscription>('/billing/subscription').catch(() => null),
                    apiFetch<PaymentMethod[]>('/billing/payment-methods').catch(() => []),
                    apiFetch<Invoice[]>('/billing/invoices').catch(() => []),
                ])
                if (cancelled) return
                setUser(me)
                setSubscription(sub)
                setMethods(pm)
                setInvoices(inv)
            } catch (err) {
                if (cancelled) return
                if (err instanceof ApiError && err.status === 401) {
                    router.replace('/login')
                    return
                }
                setError(err instanceof Error ? err.message : 'Failed to load billing')
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [router])

    const totalSpent = useMemo(
        () =>
            invoices
                .filter((i) => i.status === 'PAID')
                .reduce((sum, i) => sum + Number(i.amount), 0),
        [invoices]
    )

    const currentPlan = PLANS.find((p) => p.plan === user?.plan) ?? PLANS[0]

    /* ── actions ───────────────────────────────────────────── */

    async function handleUpgrade(plan: Plan) {
        setUpgrading(plan)
        setError(null)
        try {
            const updated = await apiFetch<Subscription>('/billing/subscription', {
                method: 'POST',
                body: JSON.stringify({ plan }),
            })
            setSubscription(updated)
            setUser((prev) => (prev ? { ...prev, plan } : prev))
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upgrade failed')
        } finally {
            setUpgrading(null)
        }
    }

    async function handleCancel() {
        setCancelling(true)
        setError(null)
        try {
            const updated = await apiFetch<Subscription>('/billing/subscription', {
                method: 'DELETE',
            })
            setSubscription(updated)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Cancellation failed')
        } finally {
            setCancelling(false)
        }
    }

    async function handleSetDefault(methodId: string) {
        setError(null)
        try {
            const updated = await apiFetch<PaymentMethod>(
                `/billing/payment-methods/${methodId}/default`,
                { method: 'POST' }
            )
            setMethods((prev) =>
                prev.map((m) => ({
                    ...m,
                    isDefault: m.id === updated.id,
                }))
            )
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update payment method')
        }
    }

    async function handleRemoveMethod(methodId: string) {
        setError(null)
        try {
            await apiFetch(`/billing/payment-methods/${methodId}`, { method: 'DELETE' })
            setMethods((prev) => prev.filter((m) => m.id !== methodId))
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to remove payment method')
        }
    }

    /* ── loading / error ──────────────────────────────────── */

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#1A1A1A]/55">
                    Loading billing…
                </p>
            </div>
        )
    }

    if (error && !user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#1A1A1A]/85">
                    {error}
                </p>
                <button
                    onClick={() => router.replace('/login')}
                    className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-colors"
                >
                    ← Back to sign in
                </button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#F5F1E8] text-[#1A1A1A]">
            <DashboardHeader user={user} />

            <main className="px-6 md:px-12 lg:px-24 pt-32 pb-24 max-w-7xl mx-auto">
                {/* Hero */}
                <section className="mb-16">
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#1A1A1A]/60 mb-4"
                    >
                        Workspace · Billing
                    </motion.p>
                    <div>
                        <div className="overflow-hidden">
                            <motion.h1
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                className="font-serif text-5xl sm:text-6xl md:text-7xl font-normal italic leading-[1] tracking-tight text-[#1A1A1A]"
                            >
                                What you
                            </motion.h1>
                        </div>
                        <div className="overflow-hidden">
                            <motion.h1
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                transition={{ duration: 1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                className="font-mono text-5xl sm:text-6xl md:text-7xl font-bold leading-[1] tracking-tighter text-[#1A1A1A]"
                            >
                                pay for.
                            </motion.h1>
                        </div>
                    </div>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="font-mono text-[11px] tracking-wider text-[#1A1A1A]/60 mt-6"
                    >
                        {currentPlan.name} plan · {formatMoney(totalSpent)} lifetime spend ·{' '}
                        {invoices.length} {invoices.length === 1 ? 'invoice' : 'invoices'}
                    </motion.p>
                </section>

                {/* Stats strip */}
                <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-[#1A1A1A]/10 border border-[#1A1A1A]/10 mb-16"
                >
                    <div className="bg-[#F5F1E8] p-5 sm:p-6">
                        <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-[#1A1A1A]/55 mb-3">
                            Current plan
                        </p>
                        <p className="font-mono text-2xl sm:text-3xl font-bold text-[#1A1A1A] tracking-tight">
                            {currentPlan.name}
                        </p>
                    </div>
                    <div className="bg-[#F5F1E8] p-5 sm:p-6">
                        <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-[#1A1A1A]/55 mb-3">
                            Monthly cost
                        </p>
                        <p className="font-mono text-2xl sm:text-3xl font-bold text-[#1A1A1A] tracking-tight">
                            {currentPlan.price}
                        </p>
                    </div>
                    <div className="bg-[#F5F1E8] p-5 sm:p-6">
                        <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-[#1A1A1A]/55 mb-3">
                            Lifetime spend
                        </p>
                        <p className="font-mono text-2xl sm:text-3xl font-bold text-[#1A1A1A] tracking-tight">
                            {formatMoney(totalSpent)}
                        </p>
                    </div>
                    <div className="bg-[#F5F1E8] p-5 sm:p-6">
                        <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-[#1A1A1A]/55 mb-3">
                            Next billing
                        </p>
                        <p className="font-mono text-2xl sm:text-3xl font-bold text-[#1A1A1A] tracking-tight">
                            {subscription
                                ? formatDate(subscription.currentPeriodEnd)
                                : '—'}
                        </p>
                    </div>
                </motion.section>

                {/* Current subscription */}
                {subscription && (
                    <motion.section
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.8 }}
                        className="mb-16"
                    >
                        <div className="mb-6 pb-4 border-b border-[#1A1A1A]/10">
                            <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/55 mb-2">
                                Subscription
                            </p>
                            <h2 className="font-mono text-2xl font-bold tracking-tight">
                                Current plan
                            </h2>
                        </div>
                        <div className="border border-[#1A1A1A]/10 p-6 bg-[#F5F1E8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-mono text-lg font-bold tracking-tight">
                                        {currentPlan.name}
                                    </h3>
                                    <StatusPill status={subscription.status} />
                                </div>
                                <p className="font-mono text-[11px] text-[#1A1A1A]/50">
                                    {formatDate(subscription.currentPeriodStart)} →{' '}
                                    {formatDate(subscription.currentPeriodEnd)}
                                    {subscription.cancelAtPeriodEnd && (
                                        <span className="ml-2 text-[#8C7A6B]">
                                            · cancels at end of period
                                        </span>
                                    )}
                                </p>
                            </div>
                            {!subscription.cancelAtPeriodEnd &&
                                subscription.status === 'ACTIVE' &&
                                user?.plan !== 'STARTER' && (
                                    <button
                                        onClick={handleCancel}
                                        disabled={cancelling}
                                        className="font-mono text-[10px] tracking-[0.2em] uppercase px-5 py-2.5 border border-[#1A1A1A]/20 text-[#1A1A1A]/60 hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition-colors disabled:opacity-30"
                                    >
                                        {cancelling ? 'Cancelling…' : 'Cancel plan'}
                                    </button>
                                )}
                        </div>
                    </motion.section>
                )}

                {/* Plans grid */}
                <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.9 }}
                    className="mb-16"
                >
                    <div className="mb-6 pb-4 border-b border-[#1A1A1A]/10">
                        <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/55 mb-2">
                            Plans
                        </p>
                        <h2 className="font-mono text-2xl font-bold tracking-tight">
                            Choose your tier
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {PLANS.map((p, i) => {
                            const isCurrent = user?.plan === p.plan
                            const isDowngrade =
                                PLANS.findIndex((x) => x.plan === user?.plan) >
                                PLANS.findIndex((x) => x.plan === p.plan)
                            return (
                                <motion.div
                                    key={p.plan}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.95 + i * 0.05 }}
                                    className={`border p-6 flex flex-col ${
                                        isCurrent
                                            ? 'border-[#1A1A1A] shadow-[6px_6px_0px_0px_#8C7A6B]'
                                            : 'border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30'
                                    } transition-all`}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="font-mono text-base font-bold tracking-tight">
                                                {p.name}
                                            </h3>
                                            <div className="flex items-baseline gap-1 mt-1">
                                                <span className="font-mono text-3xl font-bold tracking-tighter">
                                                    {p.price}
                                                </span>
                                                <span className="font-mono text-[11px] text-[#1A1A1A]/50">
                                                    {p.period}
                                                </span>
                                            </div>
                                        </div>
                                        {isCurrent && (
                                            <span className="font-mono text-[9px] tracking-[0.2em] uppercase border border-[#1A1A1A] px-2 py-0.5 text-[#1A1A1A]">
                                                Current
                                            </span>
                                        )}
                                    </div>

                                    <ul className="flex-1 space-y-2.5 mb-6">
                                        {p.features.map((f) => (
                                            <li
                                                key={f}
                                                className="flex items-start gap-2"
                                            >
                                                <span className="font-mono text-[10px] text-[#8C7A6B] mt-0.5 shrink-0">
                                                    ✓
                                                </span>
                                                <span className="font-mono text-[11px] text-[#1A1A1A]/70 leading-relaxed">
                                                    {f}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                    {isCurrent ? (
                                        <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-center py-3 border border-[#1A1A1A]/10 text-[#1A1A1A]/40">
                                            Active
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleUpgrade(p.plan)}
                                            disabled={upgrading !== null}
                                            className={`font-mono text-[10px] tracking-[0.2em] uppercase py-3 transition-colors disabled:opacity-30 ${
                                                isDowngrade
                                                    ? 'border border-[#1A1A1A]/20 text-[#1A1A1A]/60 hover:border-[#1A1A1A] hover:text-[#1A1A1A]'
                                                    : 'bg-[#1A1A1A] text-[#F5F1E8] hover:bg-[#8C7A6B]'
                                            }`}
                                        >
                                            {upgrading === p.plan
                                                ? 'Processing…'
                                                : isDowngrade
                                                  ? 'Downgrade'
                                                  : 'Upgrade'}
                                        </button>
                                    )}
                                </motion.div>
                            )
                        })}
                    </div>
                </motion.section>

                {/* Payment methods */}
                <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 1 }}
                    className="mb-16"
                >
                    <div className="mb-6 pb-4 border-b border-[#1A1A1A]/10">
                        <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/55 mb-2">
                            Payments
                        </p>
                        <h2 className="font-mono text-2xl font-bold tracking-tight">
                            Payment methods
                        </h2>
                    </div>

                    {methods.length === 0 ? (
                        <div className="border border-dashed border-[#1A1A1A]/15 px-6 py-12 text-center">
                            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/55">
                                No payment methods on file
                            </p>
                        </div>
                    ) : (
                        <div className="border border-[#1A1A1A]/10 divide-y divide-[#1A1A1A]/10">
                            {methods.map((m) => (
                                <div
                                    key={m.id}
                                    className="flex items-center justify-between gap-4 px-5 py-4 bg-[#F5F1E8]"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <span className="font-mono text-[11px] font-bold text-[#1A1A1A] w-14 shrink-0 uppercase">
                                            {m.brand ?? m.type}
                                        </span>
                                        <span className="font-mono text-sm text-[#1A1A1A]">
                                            •••• {m.last4}
                                        </span>
                                        {m.expMonth && m.expYear && (
                                            <span className="font-mono text-[10px] text-[#1A1A1A]/40">
                                                {String(m.expMonth).padStart(2, '0')}/{m.expYear}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {m.isDefault ? (
                                            <span className="font-mono text-[9px] tracking-[0.2em] uppercase border border-[#1A1A1A]/20 px-2 py-0.5 text-[#1A1A1A]/80">
                                                Default
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => handleSetDefault(m.id)}
                                                className="font-mono text-[10px] tracking-[0.15em] uppercase text-[#1A1A1A]/40 hover:text-[#1A1A1A] transition-colors"
                                            >
                                                Set default
                                            </button>
                                        )}
                                        {!m.isDefault && (
                                            <button
                                                onClick={() => handleRemoveMethod(m.id)}
                                                className="font-mono text-[10px] tracking-[0.15em] uppercase text-[#1A1A1A]/30 hover:text-[#8C7A6B] transition-colors"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.section>

                {/* Invoices */}
                <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 1.1 }}
                >
                    <div className="flex items-end justify-between mb-6 pb-4 border-b border-[#1A1A1A]/10">
                        <div>
                            <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/55 mb-2">
                                History
                            </p>
                            <h2 className="font-mono text-2xl font-bold tracking-tight">
                                Invoices
                            </h2>
                        </div>
                        <p className="font-mono text-[10px] tracking-wider text-[#1A1A1A]/55">
                            {invoices.length} {invoices.length === 1 ? 'invoice' : 'invoices'}
                        </p>
                    </div>

                    {invoices.length === 0 ? (
                        <div className="border border-dashed border-[#1A1A1A]/15 px-6 py-12 text-center">
                            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/55">
                                No invoices yet
                            </p>
                        </div>
                    ) : (
                        <div className="border border-[#1A1A1A]/10 divide-y divide-[#1A1A1A]/10">
                            {/* Header */}
                            <div className="hidden sm:grid grid-cols-[1fr_100px_100px_90px_60px] gap-4 px-5 py-3 bg-[#F5F1E8]">
                                {['Description', 'Amount', 'Date', 'Status', ''].map(
                                    (h) => (
                                        <p
                                            key={h}
                                            className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1A1A]/40"
                                        >
                                            {h}
                                        </p>
                                    )
                                )}
                            </div>
                            {invoices.map((inv) => (
                                <div
                                    key={inv.id}
                                    className="sm:grid sm:grid-cols-[1fr_100px_100px_90px_60px] gap-4 px-5 py-4 bg-[#F5F1E8] flex flex-col sm:flex-row sm:items-center"
                                >
                                    <p className="font-mono text-[11px] font-bold text-[#1A1A1A] truncate">
                                        {inv.description}
                                    </p>
                                    <p className="font-mono text-sm font-bold text-[#1A1A1A]">
                                        {formatMoney(inv.amount, inv.currency)}
                                    </p>
                                    <p className="font-mono text-[10px] text-[#1A1A1A]/55">
                                        {formatDate(inv.paidAt ?? inv.createdAt)}
                                    </p>
                                    <StatusPill status={inv.status} />
                                    {inv.pdfUrl ? (
                                        <a
                                            href={inv.pdfUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-mono text-[10px] tracking-[0.15em] uppercase text-[#8C7A6B] hover:text-[#1A1A1A] transition-colors"
                                        >
                                            PDF
                                        </a>
                                    ) : (
                                        <span className="font-mono text-[10px] text-[#1A1A1A]/20">
                                            —
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </motion.section>

                {error && user && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-10 flex items-center gap-3 px-4 py-3 border border-[#1A1A1A]/20"
                    >
                        <div className="w-1.5 h-1.5 bg-[#8C7A6B] animate-pulse-dot rounded-full" />
                        <p className="font-mono text-[10px] tracking-wider uppercase text-[#1A1A1A]/85">
                            {error}
                        </p>
                    </motion.div>
                )}
            </main>
        </div>
    )
}
