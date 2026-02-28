'use client';

/**
 * POST /auth/register/
 * Request:  { roll_no, name, email, password, role, year?, branch? }
 * Response: { success, message, data: User }   ← NO tokens; redirect to /login
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ApiEnvelope, User } from '@/lib/types';

const API_BASE = process.env.NEXT_PUBLIC_DRF_API_URL ?? 'http://127.0.0.1:8000';

const ROLES = [
  { value: 'student',   label: 'Student'          },
  { value: 'organizer', label: 'Event Organizer'  },
  { value: 'admin',     label: 'Administrator'    },
] as const;

export default function RegisterPage() {
  const [form, setForm] = useState({
    roll_no:  '',
    name:     '',
    email:    '',
    password: '',
    confirm:  '',
    role:     'student',
    year:     '',
    branch:   '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState('');
  const router = useRouter();

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const body: Record<string, unknown> = {
        roll_no:  form.roll_no,
        name:     form.name,
        email:    form.email,
        password: form.password,
        role:     form.role,
      };
      if (form.year)   body.year   = Number(form.year);
      if (form.branch) body.branch = form.branch;

      const response = await fetch(`${API_BASE}/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const envelope: ApiEnvelope<User> = await response.json();

      if (!response.ok || !envelope.success) {
        // envelope.data may contain field-level errors (DRF validation)
        const detail =
          typeof envelope.data === 'object' && envelope.data !== null
            ? Object.values(envelope.data as unknown as Record<string, string[]>)
                .flat()
                .join(' ')
            : envelope.message;
        throw new Error(detail || 'Registration failed.');
      }

      // Register returns only user data — redirect to login
      router.push('/login?registered=1');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">Create your account</h1>
          <p className="mt-2 text-sm text-gray-600">
            Join the holistic campus engagement platform
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Roll number */}
          <div>
            <label htmlFor="roll_no" className="block text-sm font-medium text-gray-700">
              Roll Number <span className="text-red-500">*</span>
            </label>
            <input id="roll_no" type="text" required value={form.roll_no} onChange={set('roll_no')}
              className={inputClass} placeholder="e.g. CS2101" />
          </div>

          {/* Full name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input id="name" type="text" required value={form.name} onChange={set('name')}
              className={inputClass} placeholder="e.g. Alice" autoComplete="name" />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address <span className="text-red-500">*</span>
            </label>
            <input id="email" type="email" required value={form.email} onChange={set('email')}
              className={inputClass} placeholder="you@uni.edu" autoComplete="email" />
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Role <span className="text-red-500">*</span>
            </label>
            <select id="role" value={form.role} onChange={set('role')} className={inputClass}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Year + Branch (optional) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                Year <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input id="year" type="number" min={1} max={4} value={form.year} onChange={set('year')}
                className={inputClass} placeholder="1 – 4" />
            </div>
            <div>
              <label htmlFor="branch" className="block text-sm font-medium text-gray-700">
                Branch <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input id="branch" type="text" value={form.branch} onChange={set('branch')}
                className={inputClass} placeholder="e.g. CSE" />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password <span className="text-red-500">*</span>
            </label>
            <input id="password" type="password" required minLength={8} value={form.password}
              onChange={set('password')} className={inputClass} placeholder="Min. 8 characters"
              autoComplete="new-password" />
          </div>

          {/* Confirm password */}
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-gray-700">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input id="confirm" type="password" required value={form.confirm} onChange={set('confirm')}
              className={inputClass} placeholder="Repeat your password" autoComplete="new-password" />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Creating account…' : 'Create account'}
          </button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
