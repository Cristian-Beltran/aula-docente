<template>
  <q-layout view="lHh Lpr lFf" class="app-layout">
    <q-header class="app-header" height-hint="58">
      <q-toolbar class="app-shell app-header__toolbar">
        <div class="app-header__brand">
          <div class="app-header__badge">AD</div>
          <div class="app-header__title">Aula Docente</div>
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
      </q-toolbar>
    </q-header>

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
            <q-icon :name="item.icon" />
            <span>{{ item.shortLabel || item.label }}</span>
          </router-link>
        </div>
      </div>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from 'stores/auth';
import { useSyncStore } from 'stores/sync';

const authStore = useAuthStore();
const syncStore = useSyncStore();
const router = useRouter();
const route = useRoute();

const bottomItems = [
  { name: 'home', label: 'Cronograma', shortLabel: 'Inicio', icon: 'today' },
  { name: 'courses', label: 'Cursos', shortLabel: 'Cursos', icon: 'school' },
  { name: 'current-class', label: 'Clase', shortLabel: 'Clase', icon: 'play_circle' },
  { name: 'reports', label: 'Reportes', shortLabel: 'Reportes', icon: 'insights' },
  { name: 'more', label: 'Opciones', shortLabel: 'Menú', icon: 'menu' },
];

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

.app-header__menu-sheet {
  border-radius: 14px;
  background: rgba(255, 253, 248, 0.98);
  border: 1px solid rgba(16, 45, 78, 0.08);
  box-shadow: 0 12px 24px rgba(31, 51, 74, 0.08);
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
    max-width: 880px;
  }

  .app-bottom-nav {
    max-width: 640px;
    margin-left: auto;
    margin-right: auto;
  }
}
</style>
