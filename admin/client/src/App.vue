<template>
  <div id="app">
    <!-- Navigation (hidden on login page) -->
    <nav v-if="!$route.meta.hideNavigation" class="nav">
      <div class="container flex flex-between">
        <router-link to="/dashboard" class="nav-brand">
          KLUB KURT Admin
        </router-link>

        <div class="flex gap-4">
          <router-link
            to="/dashboard"
            class="nav-link"
            :class="{ active: $route.name === 'Dashboard' }"
          >
            Dashboard
          </router-link>

          <router-link
            to="/events"
            class="nav-link"
            :class="{
              active:
                $route.name === 'Events' ||
                $route.name === 'CreateEvent' ||
                $route.name === 'EditEvent',
            }"
          >
            Events
          </router-link>

          <router-link
            to="/settings"
            class="nav-link"
            :class="{ active: $route.name === 'SiteSettings' }"
          >
            Settings
          </router-link>

          <button
            @click="logout"
            class="nav-link"
            style="background: none; border: none; cursor: pointer"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>

    <!-- Main content -->
    <main class="main-content">
      <div class="container">
        <!-- Page title -->
        <div
          v-if="!$route.meta.hideNavigation && $route.meta.title"
          class="page-header mb-6"
        >
          <h1 class="page-title">{{ $route.meta.title }}</h1>
        </div>

        <!-- Router view -->
        <router-view />
      </div>
    </main>
  </div>
</template>

<script>
import { useAuthStore } from '@/stores/auth';

export default {
  name: 'App',
  setup() {
    const authStore = useAuthStore();

    const logout = async () => {
      await authStore.logout();
      this.$router.push('/login');
    };

    return {
      logout,
    };
  },
};
</script>

<style>
.main-content {
  min-height: calc(100vh - 60px);
  padding: 2rem 0;
}

.page-header {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-color);
}

/* Navigation active state */
.nav-link.active {
  background-color: var(--primary-color);
  color: white;
}
</style>
