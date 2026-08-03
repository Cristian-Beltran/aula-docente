import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from 'boot/axios';
import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
  hasAccessToken,
  getRefreshToken,
  setRefreshToken,
  clearRefreshToken,
} from 'src/services/token.service';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'ASSISTANT';
  active: boolean;
  sessionId?: string;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const loading = ref(false);
  const initialized = ref(false);

  const isAuthenticated = computed(() => !!user.value && hasAccessToken());
  const isAdmin = computed(() => user.value?.role === 'ADMIN');
  const isTeacher = computed(() => user.value?.role === 'TEACHER');
  const isAssistant = computed(() => user.value?.role === 'ASSISTANT');

  async function login(email: string, password: string, rememberMe = false) {
    loading.value = true;
    try {
      const response = await api.post('/auth/login', { email, password, rememberMe });
      setAccessToken(response.data.access_token);
      if (response.data.refresh_token) {
        setRefreshToken(response.data.refresh_token);
      }
      user.value = response.data.user;
      return response.data;
    } finally {
      loading.value = false;
    }
  }

  async function refreshToken(): Promise<boolean> {
    try {
      const refreshToken = getRefreshToken();
      const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
      setAccessToken(response.data.access_token);
      if (response.data.refresh_token) {
        setRefreshToken(response.data.refresh_token);
      }
      user.value = response.data.user;
      return true;
    } catch {
      clearAccessToken();
      clearRefreshToken();
      user.value = null;
      return false;
    }
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // proceed even if the server call fails
    } finally {
      clearAccessToken();
      clearRefreshToken();
      user.value = null;
    }
  }

  async function logoutAll() {
    try {
      await api.post('/auth/logout-all');
    } catch {
      // proceed even if the server call fails
    } finally {
      clearAccessToken();
      clearRefreshToken();
      user.value = null;
    }
  }

  async function fetchProfile() {
    if (!hasAccessToken()) return;
    try {
      const response = await api.get('/auth/profile');
      user.value = response.data;
    } catch {
      await logout();
    }
  }

  async function initialize(): Promise<boolean> {
    if (initialized.value) return isAuthenticated.value;

    if (hasAccessToken()) {
      try {
        await fetchProfile();
        initialized.value = true;
        return true;
      } catch {
        initialized.value = true;
        return hasAccessToken();
      }
    }

    initialized.value = true;
    return false;
  }

  return {
    user,
    loading,
    initialized,
    isAuthenticated,
    isAdmin,
    isTeacher,
    isAssistant,
    login,
    refreshToken,
    logout,
    logoutAll,
    fetchProfile,
    initialize,
  };
});
