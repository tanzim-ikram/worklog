'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import Navigation from './Navigation'
import LogoutButton from './LogoutButton'

interface SidebarProps {
    user: {
        email?: string | null
        user_metadata: {
            full_name?: string
        }
    }
}

export default function Sidebar({ user }: SidebarProps) {
    const [isOpen, setIsOpen] = useState(false)
    const pathname = usePathname()

    // Close sidebar when navigating on mobile
    useEffect(() => {
        setIsOpen(false)
    }, [pathname])

    const toggleSidebar = () => setIsOpen(!isOpen)

    return (
        <>
            {/* Mobile Header with Hamburger */}
            <div className="md:hidden flex items-center justify-between p-4 bg-background border-b border-glass-border fixed top-0 left-0 right-0 z-40">
                <Link href="/dashboard" className="flex items-center">
                    <Image
                        src="/Worklog Logo.svg"
                        alt="Worklog Logo"
                        width={120}
                        height={33}
                        className="dark:invert-0"
                        priority
                    />
                </Link>
                <button
                    onClick={toggleSidebar}
                    className="p-2 glass-panel rounded-xl hover:bg-primary/10 transition-colors"
                    aria-label="Toggle navigation"
                >
                    {isOpen ? (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar aside */}
            <aside className={`
        fixed inset-y-0 left-0 w-64 glass-panel border-r border-glass-border z-50 
        transform transition-transform duration-300 ease-in-out flex flex-col
        md:translate-x-0 md:static md:z-10 bg-background
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <div className="p-4 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center">
                        <Image
                            src="/Worklog Logo.svg"
                            alt="Worklog Logo"
                            width={225}
                            height={62}
                            className="dark:invert-0"
                            priority
                        />
                    </Link>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="md:hidden p-2 text-gray-500 hover:text-gray-900"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto py-4">
                    <Navigation />
                </div>

                <div className="p-4 border-t border-glass-border">
                    <div className="px-4 py-3 mb-2 rounded-xl bg-primary/5 border border-primary/10">
                        <p className="text-xs font-medium text-primary mb-1">Signed in as</p>
                        <p className="text-sm font-semibold truncate text-foreground" title={user.email || ''}>
                            {user.user_metadata.full_name || user.email?.split('@')[0]}
                        </p>
                    </div>
                    <LogoutButton />
                </div>
            </aside>

            {/* Spacer for mobile fixed header */}
            <div className="md:hidden h-16" />
        </>
    )
}
