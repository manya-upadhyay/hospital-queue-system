import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { queueAPI, doctorAPI } from '../services/api';
import toast from 'react-hot-toast';

const SYMPTOM_SUGGESTIONS = [
  'Chest pain', 'Fever', 'Headache', 'Cough', 'Abdominal pain',
  'Back pain', 'Difficulty breathing', 'Nausea', 'Rash', 'Follow-up visit',
];

export default function PatientRegistration() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [registeredTicket, setRegisteredTicket] = useState(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { isEmergency: false, gender: 'male' }
  });

  const watchDept = watch('department');

  useEffect(() => {
    doctorAPI.getDepartments().then(r => setDepartments(r.data || []));
  }, []);

  useEffect(() => {
    if (watchDept) {
      doctorAPI.getAll({ department: watchDept, available: true })
        .then(r => setDoctors(r.data || []));
    }
  }, [watchDept]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await queueAPI.register({
        ...data,
        age: parseInt(data.age),
        isEmergency: data.isEmergency === true || data.isEmergency === 'true',
      });
      setRegisteredTicket(result.data);
      toast.success('Registered successfully!');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (registeredTicket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">You're Registered!</h2>
          <div className="bg-blue-50 rounded-xl p-6 my-4">
            <p className="text-sm text-blue-600 font-medium mb-1">Your Token Number</p>
            <p className="text-4xl font-bold text-blue-700 tracking-wider">{registeredTicket.token}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 my-4">
            <div className="bg-orange-50 rounded-lg p-3">
              <p className="text-xs text-orange-600">Estimated Wait</p>
              <p className="text-2xl font-bold text-orange-700">{registeredTicket.estimatedWaitMinutes} min</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-xs text-purple-600">Queue Position</p>
              <p className="text-2xl font-bold text-purple-700">#{registeredTicket.position}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Save your Queue ID to track status: <br />
            <code className="text-xs bg-gray-100 px-2 py-1 rounded">{registeredTicket.queueId}</code>
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.href = `/track/${registeredTicket.queueId}`}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              Track Status
            </button>
            <button
              onClick={() => setRegisteredTicket(null)}
              className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg font-medium hover:bg-gray-50"
            >
              New Patient
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
            <span>🏥</span> Hospital Queue System
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Patient Registration</h1>
          <p className="text-gray-500 mt-2">Register to get your smart queue token</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* Emergency Alert */}
            <label className="flex items-center gap-3 p-4 border-2 border-red-200 bg-red-50 rounded-xl cursor-pointer hover:border-red-400 transition-colors">
              <input
                type="checkbox"
                {...register('isEmergency')}
                className="w-5 h-5 text-red-600 rounded"
              />
              <div>
                <p className="font-semibold text-red-700">🚨 Emergency Case</p>
                <p className="text-sm text-red-500">Check this for critical conditions requiring immediate attention</p>
              </div>
            </label>

            {/* Personal Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <input
                  {...register('phone', { required: 'Phone required' })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                <input
                  type="number"
                  {...register('age', { required: true, min: 0, max: 150 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="25"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select {...register('gender')} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Department & Doctor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                <select
                  {...register('department', { required: 'Select department' })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select department...</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Doctor *</label>
                <select
                  {...register('doctorId', { required: 'Select doctor' })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!watchDept}
                >
                  <option value="">Select doctor...</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.name} ({d.avg_consultation_minutes} min avg)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Symptoms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms / Reason *</label>
              <textarea
                {...register('symptoms', { required: 'Please describe symptoms' })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your symptoms or reason for visit..."
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {SYMPTOM_SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setValue('symptoms', s)}
                    className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <><span className="animate-spin">⏳</span> Registering...</>
              ) : (
                <>Get My Token 🎫</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
