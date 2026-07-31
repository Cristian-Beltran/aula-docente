import { boot } from 'quasar/wrappers';
import axios, { AxiosInstance } from 'axios';
import { getAccessToken, setAccessToken, clearAccessToken, isTokenExpired, hasAccessToken } from 'src/services/token.service';

declare module 'vue' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  timeout: 15000,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown = null) {
  failedQueue.forEach((entry) => {
    if (error) {
      entry.reject(error);
    } else {
      entry.resolve(undefined);
    }
  });
  failedQueue = [];
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && !isTokenExpired(token)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          originalRequest.headers.Authorization = `Bearer ${getAccessToken()}`;
          return api(originalRequest);
        });
      }

      isRefreshing = true;

      try {
        const response = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true },
        );
        const newToken = response.data.access_token;
        setAccessToken(newToken);
        processQueue();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        clearAccessToken();
        window.location.href = '/#/login?session=expired';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

let expireCheckInterval: ReturnType<typeof setInterval> | null = null;

function redirectToLogin() {
  clearAccessToken();
  window.location.href = '/#/login?session=expired';
}

export default boot(({ app, router }) => {
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;

  if (expireCheckInterval) {
    clearInterval(expireCheckInterval);
  }

  expireCheckInterval = setInterval(() => {
    const token = getAccessToken();
    if (token && isTokenExpired(token)) {
      redirectToLogin();
    } else if (!token) {
      const currentRoute = router.currentRoute.value;
      const requiresAuth = currentRoute.matched.some((r) => r.meta.requiresAuth);
      if (requiresAuth) {
        redirectToLogin();
      }
    }
  }, 30_000);
});

export { api };
