<template>
  <div class="site-settings">
    <div class="page-header">
      <h1>Site Settings</h1>
      <p>Configure marquee banner and SoundCloud widget</p>
    </div>

    <!-- Error Display -->
    <div v-if="siteConfigsStore.error" class="error-message">
      <p>{{ siteConfigsStore.error }}</p>
      <button
        @click="siteConfigsStore.clearError()"
        class="btn btn--ghost btn--sm"
      >
        Dismiss
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="siteConfigsStore.loading" class="loading">
      <p>Loading configurations...</p>
    </div>

    <!-- Marquee Configuration -->
    <div class="config-section">
      <h2>Marquee Banner</h2>
      <p class="section-description">
        Configure the scrolling text banner that appears below the hero section.
        Enter exactly 4 text strings.
      </p>

      <form @submit.prevent="saveMarqueeConfig" class="config-form">
        <div class="marquee-inputs">
          <div
            v-for="(text, index) in marqueeTexts"
            :key="index"
            class="form-group"
          >
            <label :for="`marquee-text-${index + 1}`" class="form-label">
              Text {{ index + 1 }}
            </label>
            <input
              :id="`marquee-text-${index + 1}`"
              v-model="marqueeTexts[index]"
              type="text"
              class="form-input"
              :placeholder="`Enter text ${index + 1}...`"
              maxlength="50"
              required
            />
            <small class="form-hint"
              >{{ text?.length || 0 }}/50 characters</small
            >
          </div>
        </div>

        <div class="form-actions">
          <button
            type="submit"
            class="btn btn--primary"
            :disabled="siteConfigsStore.loading || !isMarqueeValid"
          >
            {{
              siteConfigsStore.hasMarqueeConfig ? 'Update' : 'Create'
            }}
            Marquee Config
          </button>
        </div>
      </form>

      <!-- Preview -->
      <div v-if="isMarqueeValid" class="preview-section">
        <h3>Preview</h3>
        <div class="marquee-preview">
          <div class="marquee-preview__track">
            <span v-for="(text, index) in marqueeTexts" :key="index">{{
              text
            }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- SoundCloud Configuration -->
    <div class="config-section">
      <h2>SoundCloud Widget</h2>
      <p class="section-description">
        Configure the SoundCloud track that appears in the About section.
      </p>

      <form @submit.prevent="saveSoundcloudConfig" class="config-form">
        <div class="form-group">
          <label for="soundcloud-url" class="form-label">
            SoundCloud URL
          </label>
          <input
            id="soundcloud-url"
            v-model="soundcloudUrl"
            type="url"
            class="form-input"
            placeholder="https://soundcloud.com/..."
            required
          />
          <small class="form-hint">
            Enter the full SoundCloud track URL (e.g.,
            https://soundcloud.com/artist/track)
          </small>
        </div>

        <div class="form-actions">
          <button
            type="submit"
            class="btn btn--primary"
            :disabled="siteConfigsStore.loading || !isSoundcloudValid"
          >
            {{
              siteConfigsStore.hasSoundcloudConfig ? 'Update' : 'Create'
            }}
            SoundCloud Config
          </button>
        </div>
      </form>

      <!-- Current Configuration Display -->
      <div v-if="siteConfigsStore.soundcloudConfig" class="current-config">
        <h3>Current Configuration</h3>
        <div class="config-info">
          <p>
            <strong>URL:</strong> {{ siteConfigsStore.soundcloudConfig.url }}
          </p>
          <p>
            <strong>Last Updated:</strong>
            {{ formatDate(siteConfigsStore.soundcloudConfig.updatedAt) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Success Messages -->
    <div v-if="successMessage" class="success-message">
      <p>{{ successMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useSiteConfigsStore } from '../stores/siteConfigs';

const siteConfigsStore = useSiteConfigsStore();

// Reactive data
const marqueeTexts = ref(['', '', '', '']);
const soundcloudUrl = ref('');
const successMessage = ref('');

// Computed properties
const isMarqueeValid = computed(() => {
  return marqueeTexts.value.every(
    (text) => text && text.trim().length > 0 && text.length <= 50
  );
});

const isSoundcloudValid = computed(() => {
  return (
    soundcloudUrl.value &&
    soundcloudUrl.value.includes('soundcloud.com') &&
    soundcloudUrl.value.startsWith('http')
  );
});

// Methods
const loadConfigurations = async () => {
  try {
    await siteConfigsStore.fetchConfigs();

    // Populate forms with existing data
    if (siteConfigsStore.marqueeConfig) {
      marqueeTexts.value = [...siteConfigsStore.marqueeConfig.texts];
    }

    if (siteConfigsStore.soundcloudConfig) {
      soundcloudUrl.value = siteConfigsStore.soundcloudConfig.url;
    }
  } catch (error) {
    console.error('Error loading configurations:', error);
  }
};

const saveMarqueeConfig = async () => {
  if (!isMarqueeValid.value) return;

  try {
    await siteConfigsStore.saveMarqueeConfig(marqueeTexts.value);
    showSuccessMessage('Marquee configuration saved successfully!');
  } catch (error) {
    console.error('Error saving marquee configuration:', error);
  }
};

const saveSoundcloudConfig = async () => {
  if (!isSoundcloudValid.value) return;

  try {
    await siteConfigsStore.saveSoundcloudConfig(soundcloudUrl.value);
    showSuccessMessage('SoundCloud configuration saved successfully!');
  } catch (error) {
    console.error('Error saving SoundCloud configuration:', error);
  }
};

const showSuccessMessage = (message) => {
  successMessage.value = message;
  setTimeout(() => {
    successMessage.value = '';
  }, 3000);
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Lifecycle
onMounted(() => {
  loadConfigurations();
});
</script>

<style scoped>
.site-settings {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
  text-align: center;
}

.page-header h1 {
  margin-bottom: 0.5rem;
  color: var(--color-text-primary);
}

.page-header p {
  color: var(--color-text-secondary);
}

.config-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
}

.config-section h2 {
  margin-bottom: 0.5rem;
  color: var(--color-text-primary);
}

.section-description {
  color: var(--color-text-secondary);
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.config-form {
  margin-bottom: 2rem;
}

.marquee-inputs {
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 500;
  color: var(--color-text-primary);
}

.form-input {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 0.75rem;
  color: var(--color-text-primary);
  font-size: 0.875rem;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-hint {
  color: var(--color-text-secondary);
  font-size: 0.75rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.preview-section {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}

.preview-section h3 {
  margin-bottom: 1rem;
  color: var(--color-text-primary);
}

.marquee-preview {
  background: #000;
  color: #fff;
  padding: 1rem;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.marquee-preview__track {
  display: flex;
  gap: 2rem;
  white-space: nowrap;
  animation: marquee 10s linear infinite;
}

@keyframes marquee {
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(-100%);
  }
}

.current-config {
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}

.current-config h3 {
  margin-bottom: 1rem;
  color: var(--color-text-primary);
}

.config-info {
  background: var(--color-background);
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid var(--color-border);
}

.config-info p {
  margin-bottom: 0.5rem;
  color: var(--color-text-secondary);
}

.config-info p:last-child {
  margin-bottom: 0;
}

.error-message {
  background: var(--color-error-background);
  color: var(--color-error);
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.success-message {
  background: var(--color-success-background);
  color: var(--color-success);
  padding: 1rem;
  border-radius: 4px;
  margin-top: 1rem;
  text-align: center;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-secondary);
}

@media (max-width: 768px) {
  .site-settings {
    padding: 1rem;
  }

  .config-section {
    padding: 1.5rem;
  }

  .form-actions {
    flex-direction: column;
  }

  .error-message {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
}
</style>
