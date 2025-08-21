'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { object, pipe, minLength, string, email, nonEmpty } from 'valibot';
import type { SubmitHandler } from 'react-hook-form';
import type { InferInput } from 'valibot';
import axios from 'axios';
import { toast } from 'react-toastify';

type ErrorType = {
  message: string[];
};

const schema = object({
  email: pipe(string(), minLength(1, 'This field is required'), email('Please enter a valid email address')),
  password: pipe(string(), nonEmpty('This field is required'), minLength(5, 'Password must be at least 5 characters long'))
});

type FormData = InferInput<typeof schema>;

const Login = () => {
  const [isPasswordShown, setIsPasswordShown] = useState(false);
  const [errorState, setErrorState] = useState<ErrorType | null>(null);
  const router = useRouter();

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
  });

  const handleTogglePassword = () => setIsPasswordShown(prev => !prev);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      const response = await axios.post('/api/auth/login', {
        email: data.email,
        password: data.password
      });

      const { user, message } = response.data;

      if (user?.id) {
        localStorage.setItem('userId', String(user.id));
        toast.success(message || 'Login successful!');
        router.push('/dashboards/home');
      } else {
        toast.error('Login failed, please try again.');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'An error occurred.';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Illustration side */}
      <div className="w-1/2 hidden md:flex items-center justify-center bg-gray-100">
        <img src="/images/illustrations/auth/res1.png" alt="illustration" className="max-h-[75vh]" />
      </div>

      {/* Form side */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 bg-white">
        <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Welcome to Maran Residency 👋🏻</h2>
            <p className="text-gray-600 text-sm">Please sign in to your account</p>
          </div>

          <div>
            <label className="block mb-1 font-medium text-gray-700">Email or Username</label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  placeholder="Enter email or username"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
              )}
            />
            {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block mb-1 font-medium text-gray-700">Password</label>
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <input
                    {...field}
                    type={isPasswordShown ? 'text' : 'password'}
                    placeholder="Enter password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md pr-12"
                  />
                  <button
                    type="button"
                    className="absolute top-2.5 right-3 text-sm text-blue-600"
                    onClick={handleTogglePassword}
                  >
                    {isPasswordShown ? 'Hide' : 'Show'}
                  </button>
                </div>
              )}
            />
            {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-md font-semibold transition"
          >
            Log In
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
