import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { email: 'admin@demo.com', password: 'admin123', role: 'Admin' },
    { email: 'teacher@demo.com', password: 'teacher123', role: 'Teacher' },
    { email: 'student@demo.com', password: 'student123', role: 'Student' },
    { email: 'parent@demo.com', password: 'parent123', role: 'Parent' },
  ];

  const fillDemoAccount = (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to EduAI</h1>
          <p className="text-gray-600">Sign in to your account to continue</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-error-50 border border-error-200 rounded-xl text-error-700">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
            >
              Sign In
            </Button>
          </form>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Demo Accounts</h3>
          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                onClick={() => fillDemoAccount(account.email, account.password)}
                className="p-2 text-xs bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
              >
                <div className="font-medium text-gray-900">{account.role}</div>
                <div className="text-gray-600">{account.email}</div>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};