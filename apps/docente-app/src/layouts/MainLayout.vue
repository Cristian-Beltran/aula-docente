<template>
  <q-layout view="lHh Lpr lFf" class="app-layout">
    <q-header class="app-header" height-hint="58">
      <q-toolbar class="app-shell app-header__toolbar">
        <div class="app-header__brand">
          <div class="app-header__badge">AD</div>
          <div class="app-header__title">Aula Docente</div>
        </div>

        <div class="app-header__actions">
          <div v-if="$q.screen.gt.sm" class="app-header__desktop-nav">
            <router-link
              v-for="item in desktopItems"
              :key="item.name"
              :to="{ name: item.name }"
              class="app-header__desktop-link"
              :class="{ 'app-header__desktop-link--active': route.name === item.name }"
            >
              <q-icon :name="item.icon" size="18px" />
              <span>{{ item.label }}</span>
            </router-link>
          </div>

          <q-btn flat round dense class="app-header__menu" icon="more_horiz" aria-label="Opciones">
            <q-menu anchor="bottom right" self="top right" class="app-header__menu-sheet">
              <q-list dense style="min-width: 180px">
                <q-item clickable v-close-popup @click="goTo('more')">
                  <q-item-section avatar><q-icon name="settings" /></q-item-section>
                  <q-item-section>Opciones</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="logout">
                  <q-item-section avatar><q-icon name="logout" /></q-item-section>
                  <q-item-section>Cerrar sesión</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-if="$q.screen.gt.sm"
      :model-value="true"
      show-if-above
      :breakpoint="1024"
      :width="250"
      bordered
      class="app-drawer"
    >
      <div class="app-drawer__content">
        <div class="app-drawer__section">
          <div class="app-drawer__label">Navegación</div>
          <router-link
            v-for="item in navItems"
            :key="item.name"
            :to="{ name: item.name }"
            class="app-drawer__link"
            :class="{ 'app-drawer__link--active': route.name === item.name }"
          >
            <q-icon :name="item.icon" size="20px" />
            <div>
              <div class="app-drawer__link-title">{{ item.label }}</div>
              <div class="app-drawer__link-meta">{{ item.description }}</div>
            </div>
          </router-link>
        </div>

        <div class="app-drawer__section">
          <div class="app-drawer__label">Estado</div>
          <div class="app-drawer__status-card">
            <div class="app-drawer__status-title">Sincronización</div>
            <div class="app-drawer__status-meta">
              {{ syncStore.pendingCount > 0 ? `${syncStore.pendingCount} cambios pendientes` : 'Todo sincronizado' }}
            </div>
          </div>
        </div>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer class="app-footer">
      <div class="app-shell">
        <div class="app-bottom-nav">
          <router-link
            v-for="item in bottomItems"
            :key="item.name"
            :to="{ name: item.name }"
            class="app-bottom-nav__item"
            :class="{ 'app-bottom-nav__item--active': route.name === item.name, 'app-bottom-nav__item--scan': item.name === 'scan' }"
            :aria-label="item.label"
          >
            <q-icon :name="item.icon" size="24px" />
            <span>{{ item.shortLabel || item.label }}</span>
          </router-link>
        </div>
      </div>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from 'stores/auth';
import { useSyncStore } from 'stores/sync';

const authStore = useAuthStore();
const syncStore = useSyncStore();
const router = useRouter();
const route = useRoute();
const $q = useQuasar();

const navItems = [
  { name: 'home', label: 'Cronograma', shortLabel: 'Inicio', icon: 'today', description: 'Agenda semanal y sesiones' },
  { name: 'courses', label: 'Cursos', shortLabel: 'Cursos', icon: 'school', description: 'Gestión de cursos y horarios' },
  { name: 'current-class', label: 'Clase actual', shortLabel: 'Clase', icon: 'play_circle', description: 'Asistencia, QR y bitácora' },
  { name: 'reports', label: 'Reportes', shortLabel: 'Reportes', icon: 'insights', description: 'Resumen del curso y riesgos' },
  { name: 'more', label: 'Opciones', shortLabel: 'Menú', icon: 'menu', description: 'Configuración y accesos' },
];
const bottomItems = navItems;
const desktopItems = navItems.slice(0, 4);

function goTo(name: string) {
  void router.push({ name });
}

async function logout() {
  await authStore.logout();
  void router.push({ name: 'login' });
}
</script>

<style scoped>
.app-layout {
  background:
    radial-gradient(circle at top, rgba(236, 230, 219, 0.72), transparent 28%),
    #f7f3ec;
}

.app-header {
  background: rgba(247, 243, 236, 0.82);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(16, 45, 78, 0.04);
}

.app-header__toolbar {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  min-height: 58px;
  padding-top: 8px;
  padding-bottom: 8px;
  gap: 0;
  flex-wrap: nowrap;
}

.app-header__brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.app-header__badge {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: linear-gradient(135deg, #1b5fa7, #ef6b4a);
  color: white;
  font-weight: 800;
  font-size: 0.74rem;
  letter-spacing: 0.04em;
}

.app-header__title {
  font-size: 0.92rem;
  line-height: 1.1;
  font-weight: 800;
  color: #16324f;
}

.app-header__menu {
  color: #526173;
  min-height: 28px;
}

.app-header__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.app-header__desktop-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.app-header__desktop-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 14px;
  border-radius: 999px;
  color: #526173;
  text-decoration: none;
  font-size: 0.82rem;
  font-weight: 700;
}

.app-header__desktop-link--active {
  background: rgba(27, 95, 167, 0.1);
  color: #1b5fa7;
}

.app-header__menu-sheet {
  border-radius: 14px;
  background: rgba(255, 253, 248, 0.98);
  border: 1px solid rgba(16, 45, 78, 0.08);
  box-shadow: 0 12px 24px rgba(31, 51, 74, 0.08);
}

.app-drawer {
  background: rgba(251, 248, 242, 0.92);
  border-right: 1px solid rgba(16, 45, 78, 0.08);
}

.app-drawer__content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 92px 16px 20px;
}

.app-drawer__section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.app-drawer__label {
  padding: 0 10px;
  color: #7b8794;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.app-drawer__link {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  padding: 12px;
  border-radius: 18px;
  text-decoration: none;
  color: #526173;
}

.app-drawer__link--active {
  background: rgba(27, 95, 167, 0.1);
  color: #1b5fa7;
}

.app-drawer__link-title {
  font-size: 0.9rem;
  font-weight: 800;
}

.app-drawer__link-meta {
  margin-top: 2px;
  font-size: 0.74rem;
  color: #7b8794;
}

.app-drawer__status-card {
  padding: 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(16, 45, 78, 0.06);
}

.app-drawer__status-title {
  font-size: 0.84rem;
  font-weight: 800;
  color: #16324f;
}

.app-drawer__status-meta {
  margin-top: 4px;
  color: #6d7b8c;
  font-size: 0.76rem;
}

.app-footer {
  background: rgba(247, 243, 236, 0.88);
  backdrop-filter: blur(12px);
}

.app-bottom-nav {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 2px;
  margin: 0 0 10px;
  padding: 6px 4px;
  border-radius: 22px;
  background: rgba(255, 253, 248, 0.96);
  border: 1px solid rgba(16, 45, 78, 0.08);
  box-shadow: 0 10px 24px rgba(31, 51, 74, 0.08);
}

.app-bottom-nav__item {
  flex: 1 1 0;
  min-height: 54px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #6d7b8c;
  border-radius: 16px;
  text-decoration: none;
  font-size: 0.64rem;
  font-weight: 700;
}

.app-bottom-nav__item--active {
  background: rgba(27, 95, 167, 0.09);
  color: #1b5fa7;
}

.app-bottom-nav__item--scan {
  color: #ef6b4a;
}

@media (min-width: 768px) {
  .app-header__toolbar {
    max-width: 1360px;
  }

  .app-bottom-nav {
    max-width: 640px;
    margin-left: auto;
    margin-right: auto;
  }
}

@media (max-width: 1023px) {
  .app-header__desktop-nav {
    display: none;
  }
}

@media (min-width: 1024px) {
  .app-footer {
    display: none;
  }
}
</style>
