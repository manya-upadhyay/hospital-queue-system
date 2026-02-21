import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './context/authStore';
import PatientRegistration from './pages/PatientRegistration';
import QueueTracker from './pages/QueueTracker';
import AdminDashboard from './pages/AdminDashboard';
import DoctorQueue from './pages/DoctorQueue';
import Login from './pages/Login';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children;
};

const Navbar = () => {
  const { user, logout } = useAuthStore();

  if (!user) return null;

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="font-bold text-blue-600 text-lg">🏥 HospitalQ</span>
        {['admin', 'super_admin'].includes(user?.role) && (
          <>
            <Link to="/admin" className="text-sm text-gray-600 hover:text-blue-600">Dashboard</Link>
            <Link to="/admin/doctors" className="text-sm text-gray-600 hover:text-blue-600">Doctors</Link>
          </>
        )}
        {user?.role === 'doctor' && (
          <Link to="/doctor/queue" className="text-sm text-gray-600 hover:text-blue-600">My Queue</Link>
        )}
        <Link to="/" className="text-sm text-gray-600 hover:text-blue-600">Register Patient</Link>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">{user?.name}</span>
        <button onClick={logout} className="text-sm text-red-500 hover:text-red-700">Logout</button>
      </div>
    </nav>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/" element={<PatientRegistration />} />
        <Route path="/track/:queueId" element={<QueueTracker />} />
        <Route path="/login" element={<Login />} />

        {/* Admin */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* Doctor */}
        <Route path="/doctor/queue" element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorQueue />
          </ProtectedRoute>
        } />

        <Route path="/unauthorized" element={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <p className="text-5xl mb-4">🚫</p>
              <h1 className="text-xl font-bold text-gray-700">Access Denied</h1>
              <Link to="/" className="text-blue-600 hover:underline mt-2 block">Go Home</Link>
            </div>
          </div>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
