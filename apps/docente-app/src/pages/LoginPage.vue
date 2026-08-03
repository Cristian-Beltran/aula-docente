<template>
  <q-page class="flex flex-center q-pa-md">
    <div class="auth-shell">
      <section class="auth-intro">
        <div class="auth-intro__badge">
          <q-icon name="school" size="20px" />
          Aula Docente
        </div>
        <h1 class="auth-intro__title">Aula Docente</h1>
        <div class="row q-col-gutter-sm">
          <div class="col-6">
            <div class="auth-intro__mini">
              <span class="auth-intro__mini-label">Modo</span>
              <strong>Docente móvil</strong>
            </div>
          </div>
          <div class="col-6">
            <div class="auth-intro__mini">
              <span class="auth-intro__mini-label">Conectividad</span>
              <strong>{{ syncStore.isOnline ? 'En línea' : 'Sin conexión' }}</strong>
            </div>
          </div>
        </div>
      </section>

      <q-card class="auth-card">
        <q-card-section class="q-pa-none">
          <div class="auth-card__head">
            <div class="auth-card__title">Inicio de sesión</div>
            <div class="app-chip" :class="syncStore.isOnline ? 'app-chip--positive' : 'app-chip--warning'">
              <q-icon :name="syncStore.isOnline ? 'wifi' : 'wifi_off'" size="16px" />
              {{ syncStore.isOnline ? 'En línea' : 'Offline' }}
            </div>
          </div>

          <div v-if="sessionExpired" class="auth-alert">
            Tu sesión expiró o fue reemplazada por un inicio de sesión en otro dispositivo. Vuelve a ingresar.
          </div>

          <q-form @submit="onSubmit" class="q-gutter-md">
            <q-input
              v-model="email"
              class="app-search"
              label="Correo institucional"
              type="email"
              outlined
              autocomplete="username"
              :rules="[val => !!val || 'Ingresa tu correo', val => /.+@.+\..+/.test(val) || 'Correo inválido']"
            >
              <template #prepend>
                <q-icon name="alternate_email" />
              </template>
            </q-input>

            <q-input
              v-model="password"
              class="app-search"
              label="Contraseña"
              :type="showPassword ? 'text' : 'password'"
              outlined
              autocomplete="current-password"
              :rules="[val => !!val || 'Ingresa tu contraseña']"
            >
              <template #prepend>
                <q-icon name="lock_outline" />
              </template>
              <template #append>
                <q-btn
                  flat
                  round
                  dense
                  :icon="showPassword ? 'visibility_off' : 'visibility'"
                  @click="showPassword = !showPassword"
                />
              </template>
            </q-input>

            <div class="auth-card__options">
              <q-toggle v-model="rememberMe" color="accent" label="Recordar este dispositivo" />
              <q-btn flat dense no-caps color="primary" label="Recuperar acceso" />
            </div>

            <q-btn
              label="Iniciar sesión"
              type="submit"
              color="accent"
              unelevated
              class="full-width"
              :loading="authStore.loading"
            />
          </q-form>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'stores/auth';
import { useSyncStore } from 'stores/sync';

const router = useRouter();
const route = useRoute();
const $q = useQuasar();
const authStore = useAuthStore();
const syncStore = useSyncStore();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const rememberMe = ref(false);
const sessionExpired = computed(() => route.query.reason === 'expired');

async function onSubmit() {
  try {
    await authStore.login(email.value, password.value, rememberMe.value);
    $q.notify({ type: 'positive', message: 'Sesión iniciada correctamente.' });
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/';
    await router.push(redirect);
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || error.response?.data?.error || 'No se pudo iniciar sesión.',
    });
  }
}
</script>

<style scoped>
.auth-shell {
  width: 100%;
  max-width: 440px;
  display: grid;
  gap: 16px;
}

.auth-intro {
  padding: 8px 6px;
}

.auth-intro__badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.74);
  border: 1px solid rgba(16, 45, 78, 0.08);
  font-size: 0.8rem;
  font-weight: 700;
  color: #1b5fa7;
}

.auth-intro__title {
  margin: 16px 0 10px;
  font-size: 1.9rem;
  line-height: 1.05;
  font-weight: 800;
}

.auth-intro__text {
  margin: 0 0 14px;
  color: #6d7b8c;
  line-height: 1.45;
}

.auth-intro__mini {
  min-height: 76px;
  padding: 12px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(16, 45, 78, 0.08);
}

.auth-intro__mini-label {
  display: block;
  color: #6d7b8c;
  font-size: 0.74rem;
  margin-bottom: 6px;
}

.auth-card {
  padding: 16px;
}

.auth-alert {
  margin-bottom: 16px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(239, 107, 74, 0.12);
  border: 1px solid rgba(239, 107, 74, 0.18);
  color: #8f3c26;
  font-size: 0.86rem;
  line-height: 1.4;
}

.auth-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.auth-card__title {
  font-size: 1.2rem;
  font-weight: 800;
}

.auth-card__options {
  display: grid;
  gap: 8px;
}

.auth-card__link {
  padding: 0;
  text-align: left;
  background: transparent;
  border: 0;
  color: #1b5fa7;
  font-weight: 700;
}
</style>
