import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm, useWatch } from 'react-hook-form';
import Navbar from '../../components/layout/Navbar';
import { setCredentials } from '../../store/authSlice';
import api from '../../lib/api';

type Role = 'CITIZEN' | 'NGO_ADMIN' | 'VOLUNTEER';

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  role: Role;
  // NGO fields
  ngoName: string;
  ngoRegistrationNo: string;
  ngoDescription: string;
  ngoAddress: string;
  ngoCity: string;
  ngoState: string;
  // Volunteer fields
  volunteerBio: string;
  volunteerSkills: string;
}

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

const ROLE_META: Record<Role, { label: string; icon: string; desc: string }> = {
  CITIZEN:   { label: 'Citizen',   icon: '', desc: '' },
  NGO_ADMIN: { label: 'NGO Admin', icon: '', desc: '' },
  VOLUNTEER: { label: 'Volunteer', icon: '', desc: '' },
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');

  const roleQuery = searchParams.get('role');
  let defaultRole: Role = 'CITIZEN';
  if (roleQuery === 'ngo') defaultRole = 'NGO_ADMIN';
  else if (roleQuery === 'volunteer') defaultRole = 'VOLUNTEER';

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ defaultValues: { role: defaultRole } });

  const role = useWatch({ control, name: 'role' }) as Role;

  const onSubmit = async (data: RegisterForm) => {
    setApiError('');
    const payload: Record<string, unknown> = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      role: data.role,
      phone: data.phone || undefined,
    };

    if (data.role === 'NGO_ADMIN') {
      payload.ngoProfile = {
        name: data.ngoName,
        registrationNo: data.ngoRegistrationNo,
        description: data.ngoDescription || undefined,
        address: data.ngoAddress,
        city: data.ngoCity,
        state: data.ngoState,
      };
    }

    if (data.role === 'VOLUNTEER') {
      payload.volunteerProfile = {
        bio: data.volunteerBio || undefined,
        skills: data.volunteerSkills
          ? data.volunteerSkills.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };
    }

    try {
      const res = await api.post('/auth/register', payload);
      dispatch(setCredentials({ user: res.data.data.user, token: res.data.data.token }));
      navigate('/dashboard');
    } catch (err: any) {
      if (!err.response) {
        setApiError('Cannot reach the server. Make sure the backend is running on port 3000.');
      } else {
        setApiError(err.response.data?.message || 'Registration failed. Please try again.');
      }
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors bg-white text-gray-900 placeholder-gray-400 ${
      hasError ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-orange-400'
    }`;

  const req = (field: string) => ({ required: `${field} is required` });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex items-center justify-center py-12 px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 w-full max-w-lg">

          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4">
              <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Outer circle */}
                <circle cx="100" cy="100" r="95" stroke="#FF9500" strokeWidth="8" />
                {/* User silhouette background */}
                <circle cx="100" cy="70" r="30" fill="#FFEB3B" />
                <path d="M 60 120 Q 60 100 100 100 Q 140 100 140 120 L 140 160 Q 140 180 100 180 Q 60 180 60 160 Z" fill="#FFEB3B" />
                {/* Plus badge */}
                <circle cx="145" cy="145" r="28" fill="#FF9500" />
                <g stroke="white" strokeWidth="6" strokeLinecap="round">
                  <line x1="145" y1="130" x2="145" y2="160" />
                  <line x1="130" y1="145" x2="160" y2="145" />
                </g>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
            <p className="text-sm text-gray-500 mt-1">Join the NGO Platform community</p>
          </div>

          {/* API error */}
          {apiError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Role selector — pick first */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">I am joining as</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(ROLE_META) as Role[]).map((r) => (
                  <label
                    key={r}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border cursor-pointer transition-colors text-center ${
                      role === r
                        ? 'border-orange-400 bg-orange-50 text-orange-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <input type="radio" value={r} className="sr-only" {...register('role')} />
                    <span className="text-lg">{ROLE_META[r].icon}</span>
                    <span className="text-xs font-semibold">{ROLE_META[r].label}</span>
                    <span className="text-[10px] text-gray-400 leading-tight">{ROLE_META[r].desc}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                <input
                  type="text"
                  placeholder="John"
                  className={inputClass(!!errors.firstName)}
                  {...register('firstName', req('First name'))}
                />
                {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                <input
                  type="text"
                  placeholder="Doe"
                  className={inputClass(!!errors.lastName)}
                  {...register('lastName', req('Last name'))}
                />
                {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className={inputClass(!!errors.email)}
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                })}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  className={`${inputClass(!!errors.password)} pr-10`}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Minimum 6 characters' },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="tel"
                placeholder="+91 9876543210"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-400 text-sm outline-none transition-colors bg-white text-gray-900 placeholder-gray-400"
                {...register('phone')}
              />
            </div>

            {/* ── NGO Admin extra fields ── */}
            {role === 'NGO_ADMIN' && (
              <>
                <div className="border-t border-gray-100 pt-1" />
                <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Organization details</p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization name</label>
                  <input
                    type="text"
                    placeholder="Help Foundation"
                    className={inputClass(!!errors.ngoName)}
                    {...register('ngoName', req('Organization name'))}
                  />
                  {errors.ngoName && <p className="mt-1 text-xs text-red-500">{errors.ngoName.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration number</label>
                  <input
                    type="text"
                    placeholder="NGO-2024-XXXXX"
                    className={inputClass(!!errors.ngoRegistrationNo)}
                    {...register('ngoRegistrationNo', req('Registration number'))}
                  />
                  {errors.ngoRegistrationNo && <p className="mt-1 text-xs text-red-500">{errors.ngoRegistrationNo.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    placeholder="123 Main Street"
                    className={inputClass(!!errors.ngoAddress)}
                    {...register('ngoAddress', req('Address'))}
                  />
                  {errors.ngoAddress && <p className="mt-1 text-xs text-red-500">{errors.ngoAddress.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      placeholder="Mumbai"
                      className={inputClass(!!errors.ngoCity)}
                      {...register('ngoCity', req('City'))}
                    />
                    {errors.ngoCity && <p className="mt-1 text-xs text-red-500">{errors.ngoCity.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      placeholder="Maharashtra"
                      className={inputClass(!!errors.ngoState)}
                      {...register('ngoState', req('State'))}
                    />
                    {errors.ngoState && <p className="mt-1 text-xs text-red-500">{errors.ngoState.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Brief description of your organization…"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-400 text-sm outline-none transition-colors bg-white text-gray-900 placeholder-gray-400 resize-none"
                    {...register('ngoDescription')}
                  />
                </div>
              </>
            )}

            {/* ── Volunteer extra fields ── */}
            {role === 'VOLUNTEER' && (
              <>
                <div className="border-t border-gray-100 pt-1" />
                <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Volunteer profile</p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Skills <span className="text-gray-400 font-normal">(optional, comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="First aid, Teaching, Driving"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-400 text-sm outline-none transition-colors bg-white text-gray-900 placeholder-gray-400"
                    {...register('volunteerSkills')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tell NGOs a bit about yourself…"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-400 text-sm outline-none transition-colors bg-white text-gray-900 placeholder-gray-400 resize-none"
                    {...register('volunteerBio')}
                  />
                </div>
              </>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-2.5 rounded-lg transition-colors shadow-sm text-sm mt-2"
            >
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          {/* Footer */}
          <div className="border-t border-gray-100 pt-5 mt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-orange-500 font-medium hover:text-orange-600">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
