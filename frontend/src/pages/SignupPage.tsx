import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookOpen, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const signupSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .refine((email) => email.endsWith('@alustudent.com'), {
      message: 'Must be a valid ALU email (@alustudent.com)',
    }),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type SignupFormData = z.infer<typeof signupSchema>;

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    try {
      setSignupError(null);
      
      await registerUser({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        password: data.password,
      });
      // After successful registration, redirect to dashboard
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      setSignupError(
        error.response?.data?.detail || 
        'Registration failed. Please try again.'
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
            Create your account to get started
          </p>
        </div>

        {/* Signup Form */}
        <div className="card login-card">
          <div className="card-body p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gradient mb-2">
                Join the Community
              </h2>
              <p className="text-gray-600">
                Create your ALU student account
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Name Fields */}
              <div className="flex gap-4 mb-6">
                <div className="form-group flex-1 mb-0">
                  <label htmlFor="firstName" className="form-label">
                    First Name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                      <User className="h-5 w-5" style={{ color: 'var(--gray-400)' }} />
                    </div>
                    <input
                      {...register('firstName')}
                      type="text"
                      autoComplete="given-name"
                      className={`form-input ${errors.firstName ? 'error' : ''}`}
                      style={{ paddingLeft: '3rem' }}
                      placeholder="John"
                    />
                  </div>
                  {errors.firstName && (
                    <p className="form-error">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="form-group flex-1 mb-0">
                  <label htmlFor="lastName" className="form-label">
                    Last Name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                      <User className="h-5 w-5" style={{ color: 'var(--gray-400)' }} />
                    </div>
                    <input
                      {...register('lastName')}
                      type="text"
                      autoComplete="family-name"
                      className={`form-input ${errors.lastName ? 'error' : ''}`}
                      style={{ paddingLeft: '3rem' }}
                      placeholder="Doe"
                    />
                  </div>
                  {errors.lastName && (
                    <p className="form-error">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

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
                    autoComplete="new-password"
                    className={`form-input ${errors.password ? 'error' : ''}`}
                    style={{ paddingLeft: '3rem', paddingRight: '3rem' }}
                    placeholder="Create a strong password"
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

              {/* Confirm Password Field */}
              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <Lock className="h-5 w-5" style={{ color: 'var(--gray-400)' }} />
                  </div>
                  <input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                    style={{ paddingLeft: '3rem', paddingRight: '3rem' }}
                    placeholder="Confirm your password"
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
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-100)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" style={{ color: 'var(--gray-400)' }} />
                    ) : (
                      <Eye className="h-5 w-5" style={{ color: 'var(--gray-400)' }} />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="form-error">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Error Message */}
              {signupError && (
                <div className="alert alert-error">
                  {signupError}
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
                    Creating account...
                  </div>
                ) : (
                  'Create Your Account'
                )}
              </button>

              {/* Login Link */}
              <div className="text-center">
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="text-blue-600 font-semibold hover:text-primary-hover"
                    style={{ 
                      textDecoration: 'none',
                      transition: 'color var(--transition-fast)'
                    }}
                  >
                    Sign in here
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
