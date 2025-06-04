'use client'

import { ReactNode } from 'react'
import { Home, History, Settings } from 'lucide-react'  // Removed Dumbbell, added History, Settings
import Link from 'next/link'  // Make sure this import is here
import { usePathname } from 'next/navigation'

interface AppLayoutProps {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname()
  
  const isActive = (path: string) => pathname === path

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900">Persist Tracker</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        {children}
      </main>

      {/* Bottom Navigation - Updated to 3 tabs */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="grid grid-cols-3 gap-1">
          <Link 
            href="/"
            className={`flex flex-col items-center py-3 px-1 ${
              isActive('/') ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <Home size={24} />
            <span className="text-xs mt-1">Home</span>
          </Link>
          
          <Link 
            href="/history"
            className={`flex flex-col items-center py-3 px-1 ${
              isActive('/history') ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <History size={24} />
            <span className="text-xs mt-1">History</span>
          </Link>
          
          <Link 
            href="/admin"
            className={`flex flex-col items-center py-3 px-1 ${
              isActive('/admin') ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <Settings size={24} />
            <span className="text-xs mt-1">Admin</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}