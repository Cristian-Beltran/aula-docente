import { boot } from 'quasar/wrappers';
import { hasAccessToken } from 'src/services/token.service';
import { useAuthStore } from 'src/stores/auth';

export default boot(({ router }) => {
  router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore();
    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

    if (!requiresAuth) {
      if (to.name === 'login' && (authStore.isAuthenticated || hasAccessToken())) {
        return next({ name: 'home' });
      }
      return next();
    }

    if (!authStore.initialized) {
      const isValid = await authStore.initialize();
      if (!isValid) {
        return next({ name: 'login-page' });
      }
    }

    if (!authStore.isAuthenticated) {
      return next({ name: 'login-page' });
    }

    const allowedRoles = to.meta.roles as string[] | undefined;
    if (allowedRoles && authStore.user && !allowedRoles.includes(authStore.user.role)) {
      return next({ name: 'home' });
    }

    return next();
  });
});
