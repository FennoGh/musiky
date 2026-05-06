'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import DashboardHeader from '@/components/dashboard/DashboardHeader'
import { ApiError, apiFetch, clearToken, getToken } from '@/lib/api'

type Plan = 'STARTER' | 'PRO' | 'TEAM'

type User = {
    id: string
    email: string
    name: string | null
    plan: Plan
    avatarUrl: string | null
    createdAt: string
}

const TABS = ['profile', 'security', 'notifications', 'danger'] as const
type Tab = (typeof TABS)[number]

/* ── helpers ───────────────────────────────────────────────── */

function formatDate(iso: string): string {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    })
}

function SectionHeader({
    eyebrow,
    title,
    description,
}: {
    eyebrow: string
    title: string
    description?: string
}) {
    return (
        <div className="mb-8 pb-4 border-b border-[#1A1A1A]/10">
            <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/55 mb-2">
                {eyebrow}
            </p>
            <h2 className="font-mono text-xl font-bold tracking-tight">{title}</h2>
            {description && (
                <p className="font-mono text-[11px] text-[#1A1A1A]/50 mt-2 max-w-lg">
                    {description}
                </p>
            )}
        </div>
    )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
    return (
        <label className="block font-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/60 mb-2">
            {children}
        </label>
    )
}

function TextInput({
    value,
    onChange,
    placeholder,
    type = 'text',
    disabled = false,
}: {
    value: string
    onChange: (v: string) => void
    placeholder?: string
    type?: string
    disabled?: boolean
}) {
    return (
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full bg-transparent border-b border-[#1A1A1A]/20 focus:border-[#1A1A1A] outline-none font-mono text-sm py-2 text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        />
    )
}

/* ── component ─────────────────────────────────────────────── */

export default function SettingsPage() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [tab, setTab] = useState<Tab>('profile')

    /* profile form */
    const [name, setName] = useState('')
    const [avatarUrl, setAvatarUrl] = useState('')
    const [profileSaving, setProfileSaving] = useState(false)
    const [profileSaved, setProfileSaved] = useState(false)

    /* security form */
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [securitySaving, setSecuritySaving] = useState(false)
    const [securitySaved, setSecuritySaved] = useState(false)

    /* notifications */
    const [emailDigest, setEmailDigest] = useState(true)
    const [payoutAlerts, setPayoutAlerts] = useState(true)
    const [contractAlerts, setContractAlerts] = useState(true)
    const [weeklyReport, setWeeklyReport] = useState(false)
    const [notifSaving, setNotifSaving] = useState(false)
    const [notifSaved, setNotifSaved] = useState(false)

    /* danger */
    const [deleteConfirm, setDeleteConfirm] = useState('')
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        if (!getToken()) {
            router.replace('/login')
            return
        }
        let cancelled = false
        ;(async () => {
            try {
                const me = await apiFetch<User>('/me')
                if (cancelled) return
                setUser(me)
                setName(me.name ?? '')
                setAvatarUrl(me.avatarUrl ?? '')
            } catch (err) {
                if (cancelled) return
                if (err instanceof ApiError && err.status === 401) {
                    router.replace('/login')
                    return
                }
                setError(err instanceof Error ? err.message : 'Failed to load settings')
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [router])

    /* ── handlers ─────────────────────────────────────────── */

    async function handleProfileSave() {
        setProfileSaving(true)
        setProfileSaved(false)
        setError(null)
        try {
            const updated = await apiFetch<User>('/me', {
                method: 'PATCH',
                body: JSON.stringify({
                    name: name.trim() || null,
                    avatarUrl: avatarUrl.trim() || null,
                }),
            })
            setUser(updated)
            setName(updated.name ?? '')
            setAvatarUrl(updated.avatarUrl ?? '')
            setProfileSaved(true)
            setTimeout(() => setProfileSaved(false), 2500)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update profile')
        } finally {
            setProfileSaving(false)
        }
    }

    async function handlePasswordChange() {
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match')
            return
        }
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters')
            return
        }
        setSecuritySaving(true)
        setSecuritySaved(false)
        setError(null)
        try {
            await apiFetch('/me/password', {
                method: 'PUT',
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                }),
            })
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
            setSecuritySaved(true)
            setTimeout(() => setSecuritySaved(false), 2500)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to change password')
        } finally {
            setSecuritySaving(false)
        }
    }

    async function handleNotifSave() {
        setNotifSaving(true)
        setNotifSaved(false)
        setError(null)
        try {
            await apiFetch('/me/notifications', {
                method: 'PUT',
                body: JSON.stringify({
                    emailDigest,
                    payoutAlerts,
                    contractAlerts,
                    weeklyReport,
                }),
            })
            setNotifSaved(true)
            setTimeout(() => setNotifSaved(false), 2500)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update notifications')
        } finally {
            setNotifSaving(false)
        }
    }

    async function handleDeleteAccount() {
        if (deleteConfirm !== 'DELETE') return
        setDeleting(true)
        setError(null)
        try {
            await apiFetch('/me', { method: 'DELETE' })
            clearToken()
            router.replace('/login')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete account')
            setDeleting(false)
        }
    }

    /* ── loading / error states ───────────────────────────── */

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#1A1A1A]/55">
                    Loading settings…
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

    const profileDirty =
        name !== (user?.name ?? '') || avatarUrl !== (user?.avatarUrl ?? '')
    const passwordReady =
        currentPassword.length > 0 &&
        newPassword.length >= 8 &&
        newPassword === confirmPassword

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
                        Workspace · Settings
                    </motion.p>
                    <div>
                        <div className="overflow-hidden">
                            <motion.h1
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                className="font-serif text-5xl sm:text-6xl md:text-7xl font-normal italic leading-[1] tracking-tight text-[#1A1A1A]"
                            >
                                Your
                            </motion.h1>
                        </div>
                        <div className="overflow-hidden">
                            <motion.h1
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                transition={{ duration: 1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                className="font-mono text-5xl sm:text-6xl md:text-7xl font-bold leading-[1] tracking-tighter text-[#1A1A1A]"
                            >
                                workspace.
                            </motion.h1>
                        </div>
                    </div>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="font-mono text-[11px] tracking-wider text-[#1A1A1A]/60 mt-6"
                    >
                        {user?.email} · member since {formatDate(user?.createdAt ?? '')}
                    </motion.p>
                </section>

                {/* Tab nav */}
                <motion.nav
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                    className="flex gap-0 border-b border-[#1A1A1A]/10 mb-12 relative"
                >
                    {TABS.map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`relative font-mono text-[10px] tracking-[0.2em] uppercase px-5 py-3 transition-colors ${
                                tab === t
                                    ? 'text-[#1A1A1A]'
                                    : 'text-[#1A1A1A]/40 hover:text-[#1A1A1A]/70'
                            }`}
                        >
                            {t}
                            {tab === t && (
                                <motion.span
                                    layoutId="settings-tab-underline"
                                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1A1A1A]"
                                    transition={{
                                        type: 'spring',
                                        stiffness: 500,
                                        damping: 35,
                                    }}
                                />
                            )}
                        </button>
                    ))}
                </motion.nav>

                {/* Tab content */}
                <motion.section
                    key={tab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    {/* ── Profile ──────────────────────────────── */}
                    {tab === 'profile' && (
                        <div className="max-w-xl">
                            <SectionHeader
                                eyebrow="Account"
                                title="Profile"
                                description="How you appear to collaborators across all projects."
                            />

                            <div className="space-y-6">
                                <div>
                                    <FieldLabel>Display name</FieldLabel>
                                    <TextInput
                                        value={name}
                                        onChange={setName}
                                        placeholder="Your name"
                                    />
                                </div>

                                <div>
                                    <FieldLabel>Email</FieldLabel>
                                    <TextInput
                                        value={user?.email ?? ''}
                                        onChange={() => {}}
                                        disabled
                                    />
                                    <p className="font-mono text-[9px] text-[#1A1A1A]/35 mt-1.5">
                                        Email cannot be changed. Contact support for assistance.
                                    </p>
                                </div>

                                <div>
                                    <FieldLabel>Avatar URL</FieldLabel>
                                    <TextInput
                                        value={avatarUrl}
                                        onChange={setAvatarUrl}
                                        placeholder="https://..."
                                    />
                                </div>

                                <div>
                                    <FieldLabel>Plan</FieldLabel>
                                    <div className="flex items-center gap-3 py-2">
                                        <span className="font-mono text-[9px] tracking-[0.2em] uppercase border border-[#1A1A1A]/20 px-2 py-0.5 text-[#1A1A1A]/80">
                                            {user?.plan}
                                        </span>
                                        <span className="font-mono text-[10px] text-[#1A1A1A]/40">
                                            Manage on the Billing page
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <FieldLabel>User ID</FieldLabel>
                                    <p className="font-mono text-[11px] text-[#1A1A1A]/50 py-2 select-all">
                                        {user?.id}
                                    </p>
                                </div>

                                <div className="pt-4 flex items-center gap-4">
                                    <button
                                        onClick={handleProfileSave}
                                        disabled={!profileDirty || profileSaving}
                                        className="font-mono text-[10px] tracking-[0.2em] uppercase px-6 py-3 bg-[#1A1A1A] text-[#F5F1E8] hover:bg-[#8C7A6B] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        {profileSaving ? 'Saving…' : 'Save changes'}
                                    </button>
                                    {profileSaved && (
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="font-mono text-[10px] text-[#8C7A6B]"
                                        >
                                            ✓ Saved
                                        </motion.span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Security ─────────────────────────────── */}
                    {tab === 'security' && (
                        <div className="max-w-xl">
                            <SectionHeader
                                eyebrow="Authentication"
                                title="Security"
                                description="Manage your password and account access."
                            />

                            <div className="space-y-6">
                                <div>
                                    <FieldLabel>Current password</FieldLabel>
                                    <TextInput
                                        value={currentPassword}
                                        onChange={setCurrentPassword}
                                        type="password"
                                        placeholder="••••••••"
                                    />
                                </div>

                                <div>
                                    <FieldLabel>New password</FieldLabel>
                                    <TextInput
                                        value={newPassword}
                                        onChange={setNewPassword}
                                        type="password"
                                        placeholder="Min. 8 characters"
                                    />
                                </div>

                                <div>
                                    <FieldLabel>Confirm new password</FieldLabel>
                                    <TextInput
                                        value={confirmPassword}
                                        onChange={setConfirmPassword}
                                        type="password"
                                        placeholder="Re-type new password"
                                    />
                                    {confirmPassword.length > 0 &&
                                        newPassword !== confirmPassword && (
                                            <p className="font-mono text-[9px] text-[#8C7A6B] mt-1.5">
                                                Passwords do not match
                                            </p>
                                        )}
                                </div>

                                <div className="pt-4 flex items-center gap-4">
                                    <button
                                        onClick={handlePasswordChange}
                                        disabled={!passwordReady || securitySaving}
                                        className="font-mono text-[10px] tracking-[0.2em] uppercase px-6 py-3 bg-[#1A1A1A] text-[#F5F1E8] hover:bg-[#8C7A6B] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        {securitySaving ? 'Updating…' : 'Change password'}
                                    </button>
                                    {securitySaved && (
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="font-mono text-[10px] text-[#8C7A6B]"
                                        >
                                            ✓ Password updated
                                        </motion.span>
                                    )}
                                </div>
                            </div>

                            {/* Sessions info */}
                            <div className="mt-16">
                                <SectionHeader
                                    eyebrow="Sessions"
                                    title="Active sessions"
                                    description="You are currently signed in on this device."
                                />
                                <div className="border border-[#1A1A1A]/10 px-5 py-4 bg-[#F5F1E8] flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="w-1.5 h-1.5 bg-[#8C7A6B] animate-pulse-dot rounded-full" />
                                        <div>
                                            <p className="font-mono text-[11px] font-bold text-[#1A1A1A]">
                                                Current session
                                            </p>
                                            <p className="font-mono text-[9px] text-[#1A1A1A]/40 mt-0.5">
                                                {user?.email}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="font-mono text-[9px] tracking-[0.2em] uppercase border border-[#1A1A1A]/20 px-2 py-0.5 text-[#1A1A1A]/80">
                                        Active
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Notifications ────────────────────────── */}
                    {tab === 'notifications' && (
                        <div className="max-w-xl">
                            <SectionHeader
                                eyebrow="Preferences"
                                title="Notifications"
                                description="Choose what you get notified about via email."
                            />

                            <div className="space-y-0 border border-[#1A1A1A]/10 divide-y divide-[#1A1A1A]/10">
                                <ToggleRow
                                    label="Email digest"
                                    description="Daily summary of activity across your projects"
                                    checked={emailDigest}
                                    onChange={setEmailDigest}
                                />
                                <ToggleRow
                                    label="Payout alerts"
                                    description="Get notified when a payout is created or paid"
                                    checked={payoutAlerts}
                                    onChange={setPayoutAlerts}
                                />
                                <ToggleRow
                                    label="Contract alerts"
                                    description="Notifications when contracts need your signature"
                                    checked={contractAlerts}
                                    onChange={setContractAlerts}
                                />
                                <ToggleRow
                                    label="Weekly report"
                                    description="Revenue and streaming stats delivered every Monday"
                                    checked={weeklyReport}
                                    onChange={setWeeklyReport}
                                />
                            </div>

                            <div className="pt-8 flex items-center gap-4">
                                <button
                                    onClick={handleNotifSave}
                                    disabled={notifSaving}
                                    className="font-mono text-[10px] tracking-[0.2em] uppercase px-6 py-3 bg-[#1A1A1A] text-[#F5F1E8] hover:bg-[#8C7A6B] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    {notifSaving ? 'Saving…' : 'Save preferences'}
                                </button>
                                {notifSaved && (
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="font-mono text-[10px] text-[#8C7A6B]"
                                    >
                                        ✓ Saved
                                    </motion.span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Danger zone ──────────────────────────── */}
                    {tab === 'danger' && (
                        <div className="max-w-xl">
                            <SectionHeader
                                eyebrow="Irreversible"
                                title="Danger zone"
                                description="These actions cannot be undone. Proceed with caution."
                            />

                            <div className="border border-[#1A1A1A]/20 p-6">
                                <h3 className="font-mono text-sm font-bold tracking-tight mb-2">
                                    Delete account
                                </h3>
                                <p className="font-mono text-[11px] text-[#1A1A1A]/55 mb-6 max-w-md leading-relaxed">
                                    This will permanently delete your account, all projects you own,
                                    and remove you from all collaborations. Existing signed contracts
                                    will remain on record for legal compliance.
                                </p>

                                <div className="mb-4">
                                    <FieldLabel>
                                        Type DELETE to confirm
                                    </FieldLabel>
                                    <TextInput
                                        value={deleteConfirm}
                                        onChange={setDeleteConfirm}
                                        placeholder="DELETE"
                                    />
                                </div>

                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={deleteConfirm !== 'DELETE' || deleting}
                                    className="font-mono text-[10px] tracking-[0.2em] uppercase px-6 py-3 border border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#F5F1E8] transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                                >
                                    {deleting ? 'Deleting…' : 'Delete my account'}
                                </button>
                            </div>

                            {/* Export data */}
                            <div className="mt-10 border border-[#1A1A1A]/10 p-6">
                                <h3 className="font-mono text-sm font-bold tracking-tight mb-2">
                                    Export data
                                </h3>
                                <p className="font-mono text-[11px] text-[#1A1A1A]/55 mb-6 max-w-md leading-relaxed">
                                    Download a full export of your account data including projects,
                                    contracts, revenues, and payouts in JSON format.
                                </p>
                                <button
                                    onClick={async () => {
                                        try {
                                            const blob = await apiFetch<Blob>('/me/export')
                                            const url = URL.createObjectURL(blob)
                                            const a = document.createElement('a')
                                            a.href = url
                                            a.download = 'musiky-export.json'
                                            a.click()
                                            URL.revokeObjectURL(url)
                                        } catch (err) {
                                            setError(
                                                err instanceof Error
                                                    ? err.message
                                                    : 'Export failed'
                                            )
                                        }
                                    }}
                                    className="font-mono text-[10px] tracking-[0.2em] uppercase px-6 py-3 border border-[#1A1A1A]/20 text-[#1A1A1A]/70 hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition-colors"
                                >
                                    Download export
                                </button>
                            </div>
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

/* ── Toggle row ────────────────────────────────────────────── */

function ToggleRow({
    label,
    description,
    checked,
    onChange,
}: {
    label: string
    description: string
    checked: boolean
    onChange: (v: boolean) => void
}) {
    return (
        <div className="flex items-center justify-between gap-4 px-5 py-4 bg-[#F5F1E8]">
            <div className="min-w-0">
                <p className="font-mono text-[11px] font-bold text-[#1A1A1A] tracking-tight">
                    {label}
                </p>
                <p className="font-mono text-[10px] text-[#1A1A1A]/45 mt-0.5">
                    {description}
                </p>
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`relative shrink-0 w-10 h-5 rounded-full transition-colors ${
                    checked ? 'bg-[#1A1A1A]' : 'bg-[#1A1A1A]/15'
                }`}
            >
                <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-[#F5F1E8] transition-transform ${
                        checked ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
            </button>
        </div>
    )
}
