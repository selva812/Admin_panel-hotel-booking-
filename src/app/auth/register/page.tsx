// Next Imports
'use client'

// export const metadata: Metadata = {
//   title: 'Register',
//   description: 'Register to your account'
// }


import { useState } from 'react'
import { useRouter } from 'next/navigation'

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    phone: ''
  })
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { name, email, password, confirmPassword } = formData
    if (!name || !email || !password || !confirmPassword) {
      setError('All fields are required')
      return
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Invalid email format')
      return
    }
    if (password.length < 5) {
      setError('Password must be at least 5 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(formData),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) throw new Error('Failed to register')

      alert('Registration successful!')
      router.push('/login')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    }
  }

  return (
    <div className="flex min-h-screen justify-center items-center bg-gray-100">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Create Account</h2>
        <p className="text-gray-600 mb-6">Make your app management easy and fun!</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            value={formData.name}
            onChange={handleChange}
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            value={formData.email}
            onChange={handleChange}
          />

          <div className="relative">
            <input
              type={isPasswordShown ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              value={formData.password}
              onChange={handleChange}
            />
            <button
              type="button"
              onClick={() => setIsPasswordShown(!isPasswordShown)}
              className="absolute right-3 top-2 text-sm text-blue-500"
            >
              {isPasswordShown ? 'Hide' : 'Show'}
            </button>
          </div>

          <input
            type={isPasswordShown ? 'text' : 'password'}
            name="confirmPassword"
            placeholder="Confirm Password"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            value={formData.confirmPassword}
            onChange={handleChange}
          />

          <input
            type={'text'}
            name="address"
            placeholder="Address"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            value={formData.address}
            onChange={handleChange}
          />

          <input
            type={'text'}
            name="phone"
            placeholder="Phone"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            value={formData.phone}
            onChange={handleChange}
          />

          <div className="flex items-center">
            <input type="checkbox" className="mr-2" defaultChecked />
            <label className="text-sm text-gray-700">I agree to privacy policy & terms</label>
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
          >
            Sign Up
          </button>

          <p className="text-center text-sm text-gray-600 mt-4">
            Already have an account? <a href="/login" className="text-green-600 hover:underline">Login</a>
          </p>
        </form>
      </div>
    </div>
  )
}

export default Register
