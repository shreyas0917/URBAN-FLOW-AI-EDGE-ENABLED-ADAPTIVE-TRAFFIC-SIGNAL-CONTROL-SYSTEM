import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { authApi, testBackendConnection } from '../lib/api'
import { Copy, Check, Truck, Mail, Lock, Eye, EyeOff, Loader2, Sparkles, AlertCircle } from 'lucide-react'

const CREDENTIALS = [
  {
    role: 'Super Admin',
    email: 'admin@urbanflow.gov',
    password: 'Admin@2024',
    color: 'from-purple-500 to-pink-500',
    icon: '👑',
    description: 'Full system access - All Mumbai zones',
  },
  {
    role: 'Operator 1 - South Mumbai',
    email: 'operator1@urbanflow.gov',
    password: 'Operator@2024',
    color: 'from-blue-500 to-cyan-500',
    icon: '🚦',
    description: 'Pincodes: 400001-400010',
  },
  {
    role: 'Operator 2 - Central Mumbai',
    email: 'operator2@urbanflow.gov',
    password: 'Operator@2024',
    color: 'from-indigo-500 to-blue-500',
    icon: '🚦',
    description: 'Pincodes: 400011-400020',
  },
  {
    role: 'Operator 3 - Western Suburbs',
    email: 'operator3@urbanflow.gov',
    password: 'Operator@2024',
    color: 'from-teal-500 to-cyan-500',
    icon: '🚦',
    description: 'Pincodes: 400050-400059',
  },
  {
    role: 'Operator 4 - North Mumbai',
    email: 'operator4@urbanflow.gov',
    password: 'Operator@2024',
    color: 'from-green-500 to-emerald-500',
    icon: '🚦',
    description: 'Pincodes: 400060-400069',
  },
  {
    role: 'Viewer',
    email: 'viewer@urbanflow.gov',
    password: 'Viewer@2024',
    color: 'from-gray-500 to-slate-500',
    icon: '👁️',
    description: 'Read-only access',
  },
]

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null)
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  useEffect(() => {
    // Test backend connection on mount and retry
    const checkBackend = async () => {
      let retries = 3
      let connected = false
      
      while (retries > 0 && !connected) {
        connected = await testBackendConnection()
        if (!connected) {
          retries--
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second before retry
          }
        }
      }
      
      setBackendConnected(connected)
      if (!connected) {
        setError('Cannot connect to backend server. Please ensure it is running on http://localhost:8000')
      } else {
        setError('') // Clear any previous errors
      }
    }
    
    checkBackend()
    
    // Retry connection every 5 seconds if not connected
    const interval = setInterval(() => {
      if (backendConnected === false) {
        checkBackend()
      }
    }, 5000)
    
    return () => clearInterval(interval)
  }, [backendConnected])

  useEffect(() => {
    // Clear error when user types
    if (error && backendConnected) {
      const timer = setTimeout(() => setError(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [email, password, error, backendConnected])

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    setError('')
    
    // Validation
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    // Check backend connection before attempting login
    if (backendConnected === false) {
      setError('Backend server is not connected. Please start the backend server first.')
      return
    }

    setLoading(true)

    try {
      console.log('Attempting login with:', { email, passwordLength: password.length })
      
      const response = await authApi.login(email, password)
      console.log('Login response:', response)
      
      const data = response.data
      console.log('Response data:', data)
      
      // Handle different response formats
      const access_token = data.access_token || data.token || data.accessToken
      const user = data.user || (data.id ? data : null)
      
      console.log('Extracted token:', access_token ? 'Present' : 'Missing')
      console.log('Extracted user:', user)
      
      if (!user || !access_token) {
        console.error('Invalid response structure:', data)
        throw new Error('Invalid response from server. Missing user or token.')
      }
      
      // Ensure user has required fields
      if (!user.id || !user.email || !user.role) {
        console.error('User object missing required fields:', user)
        throw new Error('Invalid user data received from server.')
      }
      
      console.log('Setting auth with user:', user)
      setAuth(user, access_token)

      // Small delay for smooth transition
      await new Promise(resolve => setTimeout(resolve, 300))

      // Navigate based on role (handle both enum and string formats)
      const userRole = user.role?.toLowerCase().replace('-', '_') || ''
      console.log('User role (normalized):', userRole)
      
      // Handle role variations
      if (userRole === 'super_admin' || userRole === 'superadmin' || userRole === 'admin') {
        console.log('Navigating to /admin')
        navigate('/admin')
      } else if (userRole === 'operator') {
        console.log('Navigating to /operator')
        navigate('/operator')
      } else {
        console.log('Navigating to /viewer')
        navigate('/viewer')
      }
    } catch (err: any) {
      console.error('Login error details:', {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data,
        code: err.code,
      })
      
      let errorMessage = 'Login failed. Please check your credentials.'
      
      if (!err.response) {
        // Network error
        if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
          errorMessage = 'Cannot connect to server. Please ensure the backend is running on http://localhost:8000'
        } else if (err.code === 'ECONNABORTED') {
          errorMessage = 'Request timeout. Server is taking too long to respond.'
        } else {
          errorMessage = `Network error: ${err.message || 'Unknown error'}. Please check if the backend server is running.`
        }
      } else if (err.response?.status === 401) {
        errorMessage = 'Incorrect email or password. Please try again.'
      } else if (err.response?.status === 422) {
        errorMessage = 'Invalid input. Please check your email and password format.'
      } else if (err.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.'
      } else {
        const detail = err.response?.data?.detail
        if (typeof detail === 'string') {
          errorMessage = detail
        } else if (Array.isArray(detail)) {
          errorMessage = detail.map((d: any) => d.msg || d.message || JSON.stringify(d)).join(', ')
        } else {
          errorMessage = detail || err.message || errorMessage
        }
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const fillCredentials = (cred: typeof CREDENTIALS[0]) => {
    setEmail(cred.email)
    setPassword(cred.password)
    setError('')
    // Auto-focus password field after filling
    setTimeout(() => {
      const passwordInput = document.querySelector('input[type="password"], input[type="text"][placeholder*="password" i]') as HTMLInputElement
      if (passwordInput) passwordInput.focus()
    }, 100)
  }

  const handleQuickLogin = async (cred: typeof CREDENTIALS[0]) => {
    // Set credentials
    setEmail(cred.email)
    setPassword(cred.password)
    setError('')
    
    // Wait for state to update, then login
    await new Promise(resolve => setTimeout(resolve, 50))
    
    // Now trigger login with the set credentials
    setLoading(true)
    
    try {
      console.log('Quick login with:', { email: cred.email, passwordLength: cred.password.length })
      
      const response = await authApi.login(cred.email, cred.password)
      const data = response.data
      
      const access_token = data.access_token || data.token || data.accessToken
      const user = data.user || (data.id ? data : null)
      
      if (!user || !access_token) {
        throw new Error('Invalid response from server. Missing user or token.')
      }
      
      if (!user.id || !user.email || !user.role) {
        throw new Error('Invalid user data received from server.')
      }
      
      setAuth(user, access_token)

      await new Promise(resolve => setTimeout(resolve, 300))

      const userRole = user.role?.toLowerCase() || ''
      
      if (userRole === 'super_admin' || userRole === 'superadmin') {
        navigate('/admin')
      } else if (userRole === 'operator') {
        navigate('/operator')
      } else {
        navigate('/viewer')
      }
    } catch (err: any) {
      console.error('Quick login error:', err)
      
      let errorMessage = 'Login failed. Please check your credentials.'
      
      if (!err.response) {
        if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
          errorMessage = 'Cannot connect to server. Please ensure the backend is running on http://localhost:8000'
        } else if (err.code === 'ECONNABORTED') {
          errorMessage = 'Request timeout. Server is taking too long to respond.'
        } else {
          errorMessage = `Network error: ${err.message || 'Unknown error'}. Please check if the backend server is running.`
        }
      } else if (err.response?.status === 401) {
        errorMessage = 'Incorrect email or password. Please try again.'
      } else if (err.response?.status === 422) {
        errorMessage = 'Invalid input. Please check your email and password format.'
      } else if (err.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.'
      } else {
        const detail = err.response?.data?.detail
        if (typeof detail === 'string') {
          errorMessage = detail
        } else if (Array.isArray(detail)) {
          errorMessage = detail.map((d: any) => d.msg || d.message || JSON.stringify(d)).join(', ')
        } else {
          errorMessage = detail || err.message || errorMessage
        }
      }
      
      setError(errorMessage)
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="min-h-screen w-full overflow-y-auto overflow-x-hidden relative bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Animated Background Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: [0.1, 0.6, 0.1],
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Gradient Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen w-full flex items-center justify-center p-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md my-auto"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl mb-4 shadow-2xl relative"
            >
              <Truck className="w-12 h-12 text-white z-10" />
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-400 rounded-3xl opacity-0"
                animate={{ opacity: [0, 0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2"
            >
              Urban Flow
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-blue-200 text-lg flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              AI-Powered Traffic Management System
            </motion.p>
          </div>

          {/* Login Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl"
          >
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email Field */}
              <div>
                <label className="block text-white/90 mb-2 text-sm font-medium">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Mail className={`w-5 h-5 transition-colors ${
                      focusedField === 'email' ? 'text-blue-400' : 'text-white/40'
                    }`} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all duration-300"
                    placeholder="admin@urbanflow.gov"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-white/90 mb-2 text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Lock className={`w-5 h-5 transition-colors ${
                      focusedField === 'password' ? 'text-blue-400' : 'text-white/40'
                    }`} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-12 pr-12 py-3.5 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all duration-300"
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Backend Connection Status */}
              {backendConnected === false && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-yellow-500/20 backdrop-blur-sm border-2 border-yellow-500/50 text-yellow-200 px-4 py-3 rounded-xl text-sm"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <div>
                      <p className="font-semibold">Backend Server Not Connected</p>
                      <p className="text-xs mt-1 opacity-90">
                        Start backend: <code className="bg-black/20 px-1 rounded">cd backend && python -m uvicorn app.main:app --reload --port 8000</code>
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="bg-red-500/20 backdrop-blur-sm border-2 border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                      {error}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Login Button */}
              <motion.button
                type="submit"
                disabled={loading || !email || !password || backendConnected === false}
                whileHover={{ scale: loading || backendConnected === false ? 1 : 1.02 }}
                whileTap={{ scale: loading || backendConnected === false ? 1 : 0.98 }}
                className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        →
                      </motion.div>
                    </>
                  )}
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  animate={loading ? { x: ['-100%', '100%'] } : {}}
                  transition={loading ? { duration: 1.5, repeat: Infinity } : {}}
                />
              </motion.button>
            </form>
          </motion.div>

          {/* Credentials Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 space-y-3 pb-4"
          >
            <p className="text-white/80 text-center text-sm mb-4 font-medium flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              Quick Login Credentials
            </p>
            {CREDENTIALS.map((cred, index) => (
              <motion.div
                key={cred.email}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`bg-gradient-to-r ${cred.color} rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20`}
              >
                <div className="flex items-center justify-between text-white">
                  <div 
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => fillCredentials(cred)}
                  >
                    <div className="text-2xl">{cred.icon}</div>
                    <div>
                      <p className="font-bold text-sm">{cred.role}</p>
                      <p className="text-xs opacity-90 mt-0.5">{cred.email}</p>
                      {cred.description && (
                        <p className="text-xs opacity-75 mt-1">{cred.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard(cred.email, `email-${cred.email}`)
                      }}
                      className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition backdrop-blur-sm"
                      title="Copy email"
                    >
                      {copied === `email-${cred.email}` ? (
                        <Check className="w-4 h-4 text-green-300" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard(cred.password, `pass-${cred.email}`)
                      }}
                      className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition backdrop-blur-sm"
                      title="Copy password"
                    >
                      {copied === `pass-${cred.email}` ? (
                        <Check className="w-4 h-4 text-green-300" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleQuickLogin(cred)
                      }}
                      disabled={loading || backendConnected === false}
                      className="px-4 py-2 bg-white/30 rounded-lg hover:bg-white/40 transition backdrop-blur-sm font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Quick Login"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Login'
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-white/50 text-xs text-center mt-4 pb-2"
            >
              Click card to fill • Click "Login" button for instant login
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

