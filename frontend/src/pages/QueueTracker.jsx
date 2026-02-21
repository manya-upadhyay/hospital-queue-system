import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { queueAPI } from '../services/api';
import { connectSocket, joinQueueRoom, getSocket } from '../services/socket';

const STATUS_CONFIG = {
  waiting: { label: 'In Queue', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
  in_consultation: { label: 'In Consultation', color: 'bg-green-100 text-green-800', icon: '🩺' },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-800', icon: '✅' },
  no_show: { label: 'Missed', color: 'bg-red-100 text-red-800', icon: '❌' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800', icon: '🚫' },
};

export default function QueueTracker() {
  const { queueId } = useParams();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [called, setCalled] = useState(false);

  const fetchStatus = async () => {
    try {
      const result = await queueAPI.getStatus(queueId);
      setStatus(result.data);
    } catch (err) {
      console.error('Failed to fetch status', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // poll every 30s

    // Also connect socket for instant updates
    const socket = connectSocket();
    joinQueueRoom(queueId);

    socket.on('patient-called', (data) => {
      setCalled(true);
      fetchStatus();
      // Browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🏥 Your turn!', { body: data.message });
      }
    });

    // Request notification permission
    if ('Notification' in window) {
      Notification.requestPermission();
    }

    return () => {
      clearInterval(interval);
      const s = getSocket();
      if (s) s.off('patient-called');
    };
  }, [queueId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4">😕</p>
          <h2 className="text-xl font-semibold text-gray-700">Queue entry not found</h2>
          <a href="/" className="text-blue-600 hover:underline mt-2 block">Register as new patient</a>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[status.status] || STATUS_CONFIG.waiting;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Called Alert */}
        {called && (
          <div className="bg-green-500 text-white p-4 rounded-xl mb-4 text-center animate-pulse">
            <p className="text-2xl">🔔 It's your turn!</p>
            <p className="text-sm mt-1">Please proceed to the consultation room</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-6 text-center">
            <p className="text-sm opacity-80 mb-1">Your Token</p>
            <p className="text-5xl font-bold tracking-widest">{status.token_number}</p>
            <p className="text-sm opacity-80 mt-2">{status.doctor_name} • {status.department}</p>
          </div>

          {/* Status */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-medium">Status</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusCfg.color}`}>
                {statusCfg.icon} {statusCfg.label}
              </span>
            </div>

            {status.status === 'waiting' && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Position in Queue</span>
                  <span className="text-2xl font-bold text-orange-600">#{status.position_in_queue}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Estimated Wait</span>
                  <span className="text-2xl font-bold text-blue-600">{status.estimated_wait_minutes} min</span>
                </div>
              </>
            )}

            {status.is_emergency && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                <span className="text-red-600 font-medium">🚨 Emergency Priority - You'll be seen urgently</span>
              </div>
            )}

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>Registered</span>
                <span>{new Date(status.registered_at).toLocaleTimeString()}</span>
              </div>
              {status.called_at && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Called At</span>
                  <span>{new Date(status.called_at).toLocaleTimeString()}</span>
                </div>
              )}
            </div>

            <button
              onClick={fetchStatus}
              className="w-full border border-blue-300 text-blue-600 py-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
            >
              🔄 Refresh Status
            </button>
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs mt-4">
          Auto-refreshes every 30 seconds • Bookmark this page to track your status
        </p>
      </div>
    </div>
  );
}
