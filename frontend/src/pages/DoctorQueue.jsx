import React, { useState, useEffect } from 'react';
import { queueAPI, doctorAPI } from '../services/api';
import { connectSocket, joinDoctorRoom, getSocket } from '../services/socket';
import useAuthStore from '../context/authStore';
import toast from 'react-hot-toast';

const PRIORITY_COLORS = (score) => {
  if (score >= 100) return 'border-red-400 bg-red-50';
  if (score >= 50) return 'border-orange-400 bg-orange-50';
  if (score >= 20) return 'border-yellow-400 bg-yellow-50';
  return 'border-gray-200 bg-white';
};

export default function DoctorQueue() {
  const { user } = useAuthStore();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [activeTab, setActiveTab] = useState('waiting');

  const fetchQueue = async () => {
    try {
      const result = await queueAPI.getDoctorQueue(user.id, activeTab);
      setQueue(result.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const socket = connectSocket();
    joinDoctorRoom(user.id);

    socket.on('queue-updated', ({ type }) => {
      fetchQueue();
      if (type === 'NEW_PATIENT') toast.success('New patient added to queue');
    });
    socket.on('emergency-alert', (alert) => {
      toast.error(`🚨 EMERGENCY: ${alert.patient} - ${alert.symptoms}`, { duration: 8000 });
    });

    return () => {
      const s = getSocket();
      if (s) { s.off('queue-updated'); s.off('emergency-alert'); }
    };
  }, [user.id, activeTab]);

  const handleCall = async (queueId) => {
    try {
      await queueAPI.callPatient(queueId);
      toast.success('Patient called!');
      fetchQueue();
    } catch (err) {
      toast.error(err.message || 'Failed to call patient');
    }
  };

  const handleComplete = async (queueId) => {
    try {
      await queueAPI.completeConsultation(queueId, {});
      toast.success('Consultation completed');
      fetchQueue();
    } catch (err) {
      toast.error('Failed to complete');
    }
  };

  const handleNoShow = async (queueId) => {
    try {
      await queueAPI.markNoShow(queueId);
      toast('Marked as no-show', { icon: '❌' });
      fetchQueue();
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const toggleAvailability = async () => {
    try {
      await doctorAPI.updateAvailability(user.id, !isAvailable);
      setIsAvailable(!isAvailable);
      toast.success(`Status: ${!isAvailable ? 'Available' : 'Unavailable'}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Queue</h1>
          <p className="text-gray-500 text-sm">Dr. {user?.name} • {queue.length} patients {activeTab === 'waiting' ? 'waiting' : ''}</p>
        </div>
        <button
          onClick={toggleAvailability}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${isAvailable ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
        >
          {isAvailable ? '🟢 Available' : '🔴 Unavailable'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {['waiting', 'in_consultation', 'completed'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
          >
            {tab.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Queue Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin text-4xl">⏳</div>
        </div>
      ) : queue.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">🎉</p>
          <p className="text-lg font-medium">No patients {activeTab === 'waiting' ? 'waiting' : 'in this category'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map((patient, idx) => (
            <div key={patient.id} className={`border-l-4 rounded-xl p-5 shadow-sm ${PRIORITY_COLORS(patient.priority_score)}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800">{patient.patient_name}</h3>
                      {patient.is_emergency && (
                        <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">🚨 EMERGENCY</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      Age {patient.age} • {patient.gender} • {patient.phone} • Token: {patient.token_number}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      <span className="font-medium">Symptoms:</span> {patient.symptoms}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Priority Score</p>
                  <p className="text-xl font-bold text-gray-700">{parseFloat(patient.priority_score).toFixed(0)}</p>
                  <p className="text-xs text-gray-400 mt-1">Wait: {patient.estimated_wait_minutes} min</p>
                </div>
              </div>

              {activeTab === 'waiting' && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleCall(patient.id)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    📣 Call Patient
                  </button>
                  <button
                    onClick={() => handleNoShow(patient.id)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    No-Show
                  </button>
                </div>
              )}

              {activeTab === 'in_consultation' && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleComplete(patient.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium"
                  >
                    ✅ Complete Consultation
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
