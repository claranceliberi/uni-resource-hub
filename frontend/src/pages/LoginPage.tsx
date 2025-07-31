import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookOpen, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .refine((email) => email.endsWith('@alustudent.com'), {
      message: 'Must be a valid ALU email (@alustudent.com)',
    }),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoginError(null);
      await login(data);
      navigate(from, { replace: true });
    } catch (error: any) {
      setLoginError(
        error.response?.data?.detail || 
        'Login failed. Please check your credentials and try again.'
      );
    }
  };

  return (
    <div className="min-h-screen login-container flex items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-8">
            <div className="floating" style={{ 
              background: 'rgba(255, 255, 255, 0.2)', 
              borderRadius: '50%', 
              padding: '1.5rem',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}>
              <BookOpen className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            UniResource Hub
          </h1>
          <p className="text-xl text-white" style={{ opacity: 0.9 }}>
            Sign in to access your learning resources
          </p>
        </div>

        {/* Login Form */}
        <div className="card login-card">
          <div className="card-body p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gradient mb-2">
                Welcome Back
              </h2>
              <p className="text-gray-600">
                Enter your credentials to continue
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Email Field */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  ALU Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <Mail className="h-5 w-5" style={{ color: 'var(--gray-400)' }} />
                  </div>
                  <input
                    {...register('email')}
                    type="email"
                    autoComplete="email"
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    style={{ paddingLeft: '3rem' }}
                    placeholder="your.name@alustudent.com"
                  />
                </div>
                {errors.email && (
                  <p className="form-error">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <Lock className="h-5 w-5" style={{ color: 'var(--gray-400)' }} />
                  </div>
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={`form-input ${errors.password ? 'error' : ''}`}
                    style={{ paddingLeft: '3rem', paddingRight: '3rem' }}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    style={{ 
                      position: 'absolute', 
                      right: '1rem', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer',
                      padding: '0.25rem',
                      borderRadius: 'var(--radius-sm)',
                      transition: 'all var(--transition-fast)'
                    }}
                    onClick={() => setShowPassword(!showPassword)}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-100)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" style={{ color: 'var(--gray-400)' }} />
                    ) : (
                      <Eye className="h-5 w-5" style={{ color: 'var(--gray-400)' }} />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="form-error">{errors.password.message}</p>
                )}
              </div>

              {/* Error Message */}
              {loginError && (
                <div className="alert alert-error">
                  {loginError}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="btn btn-primary btn-full btn-lg mb-6"
              >
                {isSubmitting || isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="spinner mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign in to Your Account'
                )}
              </button>

              {/* Register Link */}
              <div className="text-center">
                <p className="text-gray-600">
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    className="text-blue-600 font-semibold hover:text-primary-hover"
                    style={{ 
                      textDecoration: 'none',
                      transition: 'color var(--transition-fast)'
                    }}
                  >
                    Sign up here
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
