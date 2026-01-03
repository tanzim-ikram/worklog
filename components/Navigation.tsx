'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/app') {
      return pathname === '/app'
    }
    return pathname.startsWith(path)
  }

  const getLinkClasses = (path: string) => {
    const active = isActive(path)
    return `${
      active
        ? 'border-blue-500 text-gray-900'
        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`
  }

  return (
    <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
      <Link href="/app" className={getLinkClasses('/app')}>
        Dashboard
      </Link>
      <Link href="/app/day" className={getLinkClasses('/app/day')}>
        Day
      </Link>
      <Link href="/app/week" className={getLinkClasses('/app/week')}>
        Week
      </Link>
      <Link href="/app/month" className={getLinkClasses('/app/month')}>
        Month
      </Link>
      <Link href="/app/settings" className={getLinkClasses('/app/settings')}>
        Settings
      </Link>
    </div>
  )
}

