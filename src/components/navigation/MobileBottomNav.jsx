'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Home, Users, TrendingUp, User } from 'lucide-react'

export default function MobileBottomNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab')

  // List of paths/routes where the bottom navigation bar must be hidden
  const hideOnPaths = ['/', '/login', '/auth']
  const isHidden = 
    hideOnPaths.includes(pathname) || 
    pathname.includes('/exams/') ||
    pathname.startsWith('/auth/')

  if (isHidden) return null

  // Helper function to check if a navigation button is active
  const isActive = (route) => {
    if (route === '/dashboard') {
      return pathname === '/dashboard' && !tab
    }
    if (route === '/batches') {
      return pathname === '/batches' || (pathname === '/dashboard' && tab === 'batches')
    }
    if (route === '/analytics') {
      return pathname === '/analytics' || (pathname === '/dashboard' && tab === 'analytics')
    }
    if (route === '/profile') {
      return pathname === '/profile' || (pathname === '/dashboard' && tab === 'profile')
    }
    return false
  }

  // Active/Inactive class configurations
  const activeClass = 'text-teal-600 dark:text-teal-400 font-extrabold scale-105'
  const inactiveClass = 'text-slate-400 dark:text-zinc-500 font-semibold hover:text-slate-600 dark:hover:text-zinc-300'

  const navItems = [
    {
      label: 'Home',
      href: '/dashboard',
      icon: Home,
      active: isActive('/dashboard'),
    },
    {
      label: 'My Batches',
      href: '/batches',
      icon: Users,
      active: isActive('/batches'),
    },
    {
      label: 'Performance',
      href: '/analytics',
      icon: TrendingUp,
      active: isActive('/analytics'),
    },
    {
      label: 'Profile',
      href: '/profile',
      icon: User,
      active: isActive('/profile'),
    },
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-t border-slate-200 dark:border-zinc-800/80 z-50 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_24px_rgba(0,0,0,0.04)] transition-colors duration-300">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-2 text-center transition-all duration-300 cursor-pointer select-none ${
                item.active ? activeClass : inactiveClass
              }`}
            >
              <Icon className="w-5 h-5 shrink-0 transition-transform duration-300" />
              <span className="text-[10px] tracking-tight mt-1 transition-all duration-300">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
