import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { analyticsAPI } from '../services/api';
import { connectSocket, joinAdminRoom, getSocket } from '../services/socket';

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#6366F1'];

const StatCard = ({ title, value, subtitle, icon, color }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
    <div className="flex items-center justify-between mb-3">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <span className="text-2xl">{icon}</span>
    </div>
    <p className={`text-3xl font-bold ${color || 'text-gray-800'}`}>{value}</p>
    {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
  </div>
);

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchData = async () => {
    try {
      const result = await analyticsAPI.getDashboard(selectedDate);
      setData(result.data);
    } catch (err) {
      console.error('Failed to fetch dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const socket = connectSocket();
    joinAdminRoom();

    socket.on('queue-updated', () => fetchData());
    socket.on('emergency-alert', (alert) => {
      // Could show toast notification
      console.log('Emergency:', alert);
    });

    const interval = setInterval(fetchData, 60000);
    return () => {
      clearInterval(interval);
      const s = getSocket();
      if (s) { s.off('queue-updated'); s.off('emergency-alert'); }
    };
  }, [selectedDate]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin text-4xl">⏳</div>
    </div>
  );

  const { today, doctors, hourly, weeklyTrend } = data || {};

  const hourlyChartData = Array.from({ length: 24 }, (_, i) => {
    const found = hourly?.find(h => parseInt(h.hour) === i);
    return { hour: `${i}:00`, patients: found ? parseInt(found.patient_count) : 0, emergencies: found ? parseInt(found.emergency_count) : 0 };
  }).filter(h => h.hour >= '7:00' && h.hour <= '20:00');

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📊 Admin Dashboard</h1>
          <p className="text-gray-500 text-sm">Live hospital queue analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <button onClick={fetchData} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Patients" value={today?.total_patients || 0} icon="👥" />
        <StatCard title="Currently Waiting" value={today?.waiting_count || 0} icon="⏳" color="text-orange-600" />
        <StatCard title="Emergencies" value={today?.emergency_count || 0} icon="🚨" color="text-red-600" />
        <StatCard title="Avg Wait Time" value={`${today?.avg_wait_minutes || 0} min`} icon="⏱️" color="text-blue-600" />
        <StatCard title="In Consultation" value={today?.in_consultation || 0} icon="🩺" color="text-green-600" />
        <StatCard title="Completed" value={today?.completed_count || 0} icon="✅" color="text-green-700" />
        <StatCard title="No-Shows" value={today?.no_show_count || 0} icon="❌" color="text-gray-500" />
        <StatCard title="No-Show Rate" value={`${today?.no_show_rate || 0}%`} icon="📉"
          subtitle={today?.no_show_rate > 20 ? '⚠️ High - send reminders' : 'Acceptable range'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Hourly Traffic */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-4">Hourly Patient Traffic</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hourlyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="patients" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Patients" />
              <Bar dataKey="emergencies" fill="#EF4444" radius={[4, 4, 0, 0]} name="Emergencies" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Trend */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-4">7-Day Patient Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weeklyTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="total_patients" stroke="#3B82F6" strokeWidth={2} dot={false} name="Patients" />
              <Line type="monotone" dataKey="avg_wait" stroke="#F59E0B" strokeWidth={2} dot={false} name="Avg Wait (min)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Doctor Status Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700">Doctor Queue Status</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Doctor', 'Department', 'Status', 'Waiting', 'In Consult', 'Completed', 'Avg Wait'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(doctors || []).map(doc => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">Dr. {doc.name}</td>
                  <td className="px-4 py-3 text-gray-600">{doc.department}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${doc.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {doc.is_available ? '🟢 Available' : '🔴 Unavailable'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-orange-600 font-semibold">{doc.waiting || 0}</td>
                  <td className="px-4 py-3 text-green-600 font-semibold">{doc.in_consultation || 0}</td>
                  <td className="px-4 py-3 text-blue-600">{doc.completed || 0}</td>
                  <td className="px-4 py-3 text-gray-600">{doc.avg_wait || '--'} min</td>
                </tr>
              ))}
              {(!doctors || doctors.length === 0) && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No doctors found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
