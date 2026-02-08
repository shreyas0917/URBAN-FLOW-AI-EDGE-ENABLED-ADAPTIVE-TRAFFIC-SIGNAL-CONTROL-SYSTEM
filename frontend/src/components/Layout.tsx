import { ReactNode, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu,
  X,
  LogOut,
  Moon,
  Sun,
  Home,
  Settings,
  BarChart3,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { getRoleColor } from '../lib/utils'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true'
  )
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    localStorage.setItem('darkMode', String(newMode))
    document.documentElement.classList.toggle('dark', newMode)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getRoleColorClass = () => {
    if (!user) return 'from-gray-500 to-gray-600'
    return getRoleColor(user.role)
  }

  return (
    <div className={`h-screen flex flex-col ${darkMode ? 'dark' : ''}`}>
      <div className="bg-gray-50 dark:bg-gray-900 h-full flex flex-col overflow-hidden">
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm flex-shrink-0 z-50"
        >
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary-500 to-purple-500 bg-clip-text text-transparent">
                  Urban Flow
                </h1>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {darkMode ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                </button>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 bg-gradient-to-br ${getRoleColorClass()} rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20`}
                  >
                    <span className="text-white font-bold text-sm">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-semibold">{user?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user?.role?.replace('_', ' ').toUpperCase()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.header>

        <div className="flex flex-1 overflow-hidden relative">
          {/* Sidebar */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.aside
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-800/50 z-40 overflow-y-auto"
              >
                <nav className="p-4 space-y-2">
                  <button
                    onClick={() => {
                      if (user?.role === 'super_admin') navigate('/admin')
                      else if (user?.role === 'operator') navigate('/operator')
                      else navigate('/viewer')
                      setSidebarOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  >
                    <Home className="w-5 h-5" />
                    <span>Dashboard</span>
                  </button>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  >
                    <BarChart3 className="w-5 h-5" />
                    <span>Analytics</span>
                  </button>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  >
                    <Settings className="w-5 h-5" />
                    <span>Settings</span>
                  </button>
                </nav>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}


