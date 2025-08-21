'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { object, pipe, minLength, string, email, nonEmpty } from 'valibot'
import { InferInput } from 'valibot'
import { toast } from 'react-toastify'
import { useAuth } from '@/contexts/AuthContext'

const schema = object({
  email: pipe(string(), nonEmpty('Email or username is required')),
  password: pipe(string(), nonEmpty('Password is required'), minLength(5, 'Minimum 5 characters'))
})

type FormData = InferInput<typeof schema>

const Login = () => {
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { loginApi } = useAuth()

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    resolver: valibotResolver(schema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true)
      await loginApi(data.email, data.password)
      toast.success('Login successful!')
      router.push('/dashboards/home')
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Login failed.'
      toast.error(msg)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left - Illustration */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br  items-center justify-center p-8">
        <div className="text-center space-y-6">
          <img src="/images/illustrations/auth/res1.png" alt="Login Visual" className="max-h-[60vh] mx-auto" />
          <h1 className="text-3xl font-bold">Maran Residency</h1>
          <p className="text-lg">Your trusted booking companion</p>
        </div>
      </div>

      {/* Right - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-100 relative">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="animate-spin h-10 w-10 border-4 border-green-600 border-t-transparent rounded-full" />
          </div>
        )}

        <div className="w-full max-w-md mx-auto bg-white shadow-lg rounded-2xl p-8 m-6 space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800">Welcome 👋</h2>
            <p className="text-gray-500 mt-1 text-sm">Login to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email or Username</label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    placeholder="you@example.com"
                    className={`w-full px-4 py-3 rounded-md border ${errors.email ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-green-500`}
                  />
                )}
              />
              {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <input
                      {...field}
                      type={isPasswordShown ? 'text' : 'password'}
                      placeholder="••••••••"
                      className={`w-full px-4 py-3 rounded-md border ${errors.password ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-green-500 pr-12`}
                    />
                    <button
                      type="button"
                      className="absolute top-3 right-3 text-sm text-green-600"
                      onClick={() => setIsPasswordShown(prev => !prev)}
                    >
                      {isPasswordShown ? 'Hide' : 'Show'}
                    </button>
                  </div>
                )}
              />
              {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold transition"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
