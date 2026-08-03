import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('layouts/AuthLayout.vue'),
    children: [
      { path: '', name: 'login-page', component: () => import('pages/LoginPage.vue') },
    ],
  },
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('pages/HomePage.vue'),
      },
      {
        path: 'current-class',
        name: 'current-class',
        component: () => import('pages/CurrentClassPage.vue'),
      },
      {
        path: 'sessions/:sessionId',
        name: 'session-detail',
        component: () => import('pages/SessionDetailPage.vue'),
      },
      {
        path: 'courses',
        name: 'courses',
        component: () => import('pages/CoursesPage.vue'),
      },
      {
        path: 'courses/:id',
        name: 'course-detail',
        component: () => import('pages/CourseDetailPage.vue'),
      },
      {
        path: 'courses/:id/qr-print',
        name: 'course-qr-print',
        component: () => import('pages/CourseQrPrintPage.vue'),
      },
      {
        path: 'courses/:id/students',
        name: 'course-students',
        component: () => import('pages/CourseStudentsPage.vue'),
      },
      {
        path: 'students',
        name: 'students',
        component: () => import('pages/StudentsPage.vue'),
      },
      {
        path: 'scan',
        name: 'scan',
        component: () => import('pages/ScanPage.vue'),
      },
      {
        path: 'sessions/:sessionId/attendance',
        name: 'session-attendance',
        component: () => import('pages/SessionAttendancePage.vue'),
      },
      {
        path: 'exceptions',
        name: 'exceptions',
        component: () => import('pages/ExceptionsPage.vue'),
      },
      {
        path: 'reports',
        name: 'reports',
        component: () => import('pages/ReportsPage.vue'),
      },
      {
        path: 'more',
        name: 'more',
        component: () => import('pages/MorePage.vue'),
      },
      {
        path: 'academic-periods',
        name: 'academic-periods',
        component: () => import('pages/AcademicPeriodsPage.vue'),
      },
      {
        path: 'google-sheets-settings',
        name: 'google-sheets-settings',
        component: () => import('src/modules/google-sheets/views/GoogleSheetsSettingsView.vue'),
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    name: 'not-found',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
