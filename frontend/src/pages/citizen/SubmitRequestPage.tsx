import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Navbar from '../../components/layout/Navbar';
import api from '../../lib/api';

interface RequestForm {
  title: string;
  description: string;
  category: string;
  urgencyLevel: number;
  address: string;
  city: string;
  state: string;
}

const CATEGORIES = [
  { value: 'FOOD',      label: 'Food' },
  { value: 'MEDICAL',   label: 'Medical' },
  { value: 'SHELTER',   label: 'Shelter' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'CLOTHING',  label: 'Clothing' },
  { value: 'FINANCIAL', label: 'Financial' },
  { value: 'OTHER',     label: 'Other' },
];

export default function SubmitRequestPage() {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');
  const [urgency, setUrgency] = useState(1);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestForm>({ defaultValues: { urgencyLevel: 1 } });

  const onSubmit = async (data: RequestForm) => {
    setApiError('');
    try {
      await api.post('/requests', {
        ...data,
        urgencyLevel: Number(urgency),
      });
      navigate('/requests/mine');
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Failed to submit request. Please try again.');
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors bg-white text-gray-900 placeholder-gray-400 ${
      hasError
        ? 'border-red-400 focus:border-red-400'
        : 'border-gray-200 focus:border-orange-400'
    }`;

  const urgencyLabels: Record<number, { label: string; color: string }> = {
    1: { label: 'Very Low',  color: 'text-green-600' },
    2: { label: 'Low',       color: 'text-lime-600' },
    3: { label: 'Medium',    color: 'text-yellow-600' },
    4: { label: 'High',      color: 'text-orange-600' },
    5: { label: 'Critical',  color: 'text-red-600' },
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-10">

        {/* Centered Header */}
        <div className="mb-6 text-center px-2">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Submit a Help Request</h1>
          <p className="text-sm text-gray-500 mt-1">
            Fill in the details below. An NGO will review your request shortly.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">

          {/* API error */}
          {apiError && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-gray-400 font-normal">(min. 5 characters)</span>
              </label>
              <input
                type="text"
                placeholder="Brief summary of what you need"
                className={inputClass(!!errors.title)}
                {...register('title', {
                  required: 'Title is required',
                  minLength: { value: 5, message: 'Title must be at least 5 characters' },
                })}
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-gray-400 font-normal">(min. 20 characters)</span>
              </label>
              <textarea
                rows={4}
                placeholder="Explain your situation in detail — the more context you give, the better NGOs can help you"
                className={`${inputClass(!!errors.description)} resize-none`}
                {...register('description', {
                  required: 'Description is required',
                  minLength: { value: 20, message: 'Description must be at least 20 characters' },
                })}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                className={inputClass(!!errors.category)}
                {...register('category', { required: 'Please select a category' })}
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>
              )}
            </div>

            {/* Urgency Level */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Urgency Level
                </label>
                <span className={`text-sm font-semibold ${urgencyLabels[urgency].color}`}>
                  {urgency} — {urgencyLabels[urgency].label}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={urgency}
                onChange={(e) => setUrgency(Number(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1 - Very Low</span>
                <span>3 - Medium</span>
                <span>5 - Critical</span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 pt-1">
              <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-4">
                Location
              </p>

              {/* Address */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  placeholder="Street address"
                  className={inputClass(!!errors.address)}
                  {...register('address', { required: 'Address is required' })}
                />
                {errors.address && (
                  <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>
                )}
              </div>

              {/* City + State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Ahmedabad"
                    className={inputClass(!!errors.city)}
                    {...register('city', { required: 'City is required' })}
                  />
                  {errors.city && (
                    <p className="mt-1 text-xs text-red-500">{errors.city.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    placeholder="Gujarat"
                    className={inputClass(!!errors.state)}
                    {...register('state', { required: 'State is required' })}
                  />
                  {errors.state && (
                    <p className="mt-1 text-xs text-red-500">{errors.state.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/requests/mine')}
                className="flex-1 border border-gray-300 bg-white text-gray-700 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-2.5 rounded-lg transition-colors shadow-sm text-sm"
              >
                {isSubmitting ? 'Submitting…' : 'Submit Request'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}