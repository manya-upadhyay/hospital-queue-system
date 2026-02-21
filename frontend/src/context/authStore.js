import { create } from 'zustand';
import { authAPI } from '../services/api';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('hq_user') || 'null'),
  token: localStorage.getItem('hq_token'),
  isLoading: false,

  login: async (email, password, role) => {
    set({ isLoading: true });
    try {
      const data = await authAPI.login({ email, password, role });
      localStorage.setItem('hq_token', data.token);
      localStorage.setItem('hq_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, isLoading: false });
      return data;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('hq_token');
    localStorage.removeItem('hq_user');
    set({ user: null, token: null });
    window.location.href = '/login';
  },

  isAdmin: () => ['admin', 'super_admin'].includes(get().user?.role),
  isDoctor: () => get().user?.role === 'doctor',
}));

export default useAuthStore;
