import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

// Import components
import Login from '@/views/Login.vue';
import Dashboard from '@/views/Dashboard.vue';
import EventsList from '@/views/EventsList.vue';
import EventForm from '@/views/EventForm.vue';
import SiteSettings from '@/views/SiteSettings.vue';

const routes = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      requiresAuth: false,
      hideNavigation: true,
    },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: {
      requiresAuth: true,
      title: 'Dashboard',
    },
  },
  {
    path: '/events',
    name: 'Events',
    component: EventsList,
    meta: {
      requiresAuth: true,
      title: 'Events',
    },
  },
  {
    path: '/events/create',
    name: 'CreateEvent',
    component: EventForm,
    meta: {
      requiresAuth: true,
      title: 'Create Event',
    },
  },
  {
    path: '/events/edit/:id',
    name: 'EditEvent',
    component: EventForm,
    props: true,
    meta: {
      requiresAuth: true,
      title: 'Edit Event',
    },
  },
  {
    path: '/settings',
    name: 'SiteSettings',
    component: SiteSettings,
    meta: {
      requiresAuth: true,
      title: 'Site Settings',
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    // If not authenticated, try to verify token
    if (!authStore.isAuthenticated) {
      const isValid = await authStore.verifyToken();

      if (!isValid) {
        // Redirect to login
        next({ name: 'Login', query: { redirect: to.fullPath } });
        return;
      }
    }

    // Check if user has admin role
    if (!authStore.isAdmin) {
      // Redirect to login if not admin
      next({ name: 'Login' });
      return;
    }
  }

  // If authenticated and trying to access login, redirect to dashboard
  if (to.name === 'Login' && authStore.isAuthenticated) {
    next({ name: 'Dashboard' });
    return;
  }

  next();
});

export default router;
