<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1 class="login-title">KLUB KURT</h1>
        <p class="login-subtitle">Admin Login</p>
      </div>

      <!-- Error Alert -->
      <div v-if="error" class="alert alert-error mb-4">
        {{ error }}
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username" class="form-label">Username</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            class="form-input"
            placeholder="Enter username"
            required
            :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            class="form-input"
            placeholder="Enter password"
            required
            :disabled="isLoading"
          />
        </div>

        <button 
          type="submit" 
          class="btn btn-primary login-button"
          :disabled="isLoading"
        >
          <span v-if="isLoading" class="loading"></span>
          {{ isLoading ? 'Logging in...' : 'Login' }}
        </button>
      </form>

      <div class="login-footer">
        <p class="text-sm text-muted">
          Default credentials: admin / admin123
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'Login',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()

    const form = ref({
      username: '',
      password: ''
    })

    const isLoading = computed(() => authStore.isLoading)
    const error = computed(() => authStore.error)

    const handleLogin = async () => {
      // Clear any previous errors
      authStore.clearError()

      const result = await authStore.login(form.value)
      
      if (result.success) {
        // Get redirect path from query params or default to dashboard
        const redirect = router.currentRoute.value.query.redirect || '/dashboard'
        router.push(redirect)
      }
      // Error is handled by the store and displayed in the template
    }

    return {
      form,
      isLoading,
      error,
      handleLogin
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
  padding: 2rem;
}

.login-card {
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 3rem;
  box-shadow: var(--shadow);
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-title {
  font-size: 2.5rem;
  font-weight: 900;
  color: var(--primary-color);
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
}

.login-subtitle {
  font-size: 1.125rem;
  color: var(--text-secondary);
  margin: 0;
}

.login-form {
  margin-bottom: 2rem;
}

.login-button {
  width: 100%;
  padding: 1rem;
  font-size: 1.125rem;
  font-weight: 600;
}

.login-footer {
  text-align: center;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color);
}

.text-muted {
  color: var(--text-muted);
}

@media (max-width: 480px) {
  .login-card {
    padding: 2rem;
  }
  
  .login-title {
    font-size: 2rem;
  }
}
</style>
