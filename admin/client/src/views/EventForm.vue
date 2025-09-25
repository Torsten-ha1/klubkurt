<template>
  <div class="event-form">
    <!-- Back button -->
    <div class="form-header mb-6">
      <router-link to="/events" class="btn btn-secondary">
        ← Back to Events
      </router-link>
    </div>

    <!-- Error/Success Messages -->
    <div v-if="error" class="alert alert-error mb-4">
      {{ error }}
    </div>

    <div v-if="successMessage" class="alert alert-success mb-4">
      {{ successMessage }}
    </div>

    <form @submit.prevent="handleSubmit" class="form-card">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">
            {{ isEdit ? 'Edit Event' : 'Create New Event' }}
          </h2>
        </div>

        <div class="form-content">
          <!-- Title -->
          <div class="form-group">
            <label for="title" class="form-label required">Event Title</label>
            <input
              id="title"
              v-model="form.title"
              type="text"
              class="form-input"
              placeholder="Enter event title"
              required
              :disabled="isSubmitting"
              maxlength="100"
            />
            <small class="text-muted">{{ form.title.length }}/100 characters</small>
          </div>

          <!-- Date -->
          <div class="form-group">
            <label for="date" class="form-label required">Event Date & Time</label>
            <input
              id="date"
              v-model="form.date"
              type="datetime-local"
              class="form-input"
              required
              :disabled="isSubmitting"
              :min="minDate"
            />
          </div>

          <!-- Description -->
          <div class="form-group">
            <label for="description" class="form-label">Description</label>
            <textarea
              id="description"
              v-model="form.description"
              class="form-input form-textarea"
              placeholder="Enter event description"
              :disabled="isSubmitting"
              maxlength="500"
              rows="4"
            ></textarea>
            <small class="text-muted">{{ form.description.length }}/500 characters</small>
          </div>

          <!-- Lineup -->
          <div class="form-group">
            <label class="form-label">Lineup</label>
            <div class="lineup-inputs">
              <div 
                v-for="(artist, index) in form.lineup" 
                :key="index" 
                class="lineup-item"
              >
                <input
                  v-model="form.lineup[index]"
                  type="text"
                  class="form-input"
                  placeholder="Artist name"
                  :disabled="isSubmitting"
                  maxlength="50"
                />
                <button
                  type="button"
                  @click="removeArtist(index)"
                  class="btn btn-sm btn-danger"
                  :disabled="isSubmitting"
                >
                  ✕
                </button>
              </div>
              <button
                type="button"
                @click="addArtist"
                class="btn btn-sm btn-secondary"
                :disabled="isSubmitting"
              >
                + Add Artist
              </button>
            </div>
          </div>

          <!-- Tags -->
          <div class="form-group">
            <label class="form-label">Tags</label>
            <div class="tags-input">
              <div class="tags-display">
                <span 
                  v-for="(tag, index) in form.tags" 
                  :key="index" 
                  class="tag-item"
                >
                  {{ tag }}
                  <button
                    type="button"
                    @click="removeTag(index)"
                    class="tag-remove"
                    :disabled="isSubmitting"
                  >
                    ✕
                  </button>
                </span>
              </div>
              <div class="tag-input-row">
                <input
                  v-model="newTag"
                  type="text"
                  class="form-input"
                  placeholder="Enter tag and press Enter"
                  @keydown.enter.prevent="addTag"
                  :disabled="isSubmitting"
                  maxlength="20"
                />
                <button
                  type="button"
                  @click="addTag"
                  class="btn btn-sm btn-secondary"
                  :disabled="isSubmitting || !newTag.trim()"
                >
                  Add Tag
                </button>
              </div>
            </div>
            <small class="text-muted">Popular tags: techno, house, industrial, acid, hardgroove</small>
          </div>

          <!-- Active Status (only show in edit mode) -->
          <div v-if="isEdit" class="form-group">
            <label class="form-label">Status</label>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input
                  v-model="form.isActive"
                  type="checkbox"
                  :disabled="isSubmitting"
                />
                <span class="checkbox-text">Event is active and visible</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <router-link to="/events" class="btn btn-secondary">
            Cancel
          </router-link>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="isSubmitting || !isFormValid"
          >
            <span v-if="isSubmitting" class="loading"></span>
            {{ isSubmitting ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Event' : 'Create Event') }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useEventsStore } from '@/stores/events'

export default {
  name: 'EventForm',
  props: {
    id: {
      type: String,
      default: null
    }
  },
  setup(props) {
    const router = useRouter()
    const route = useRoute()
    const eventsStore = useEventsStore()

    const form = ref({
      title: '',
      date: '',
      description: '',
      lineup: [''],
      tags: [],
      isActive: true
    })

    const newTag = ref('')
    const successMessage = ref('')

    const isEdit = computed(() => !!props.id || !!route.params.id)
    const currentId = computed(() => props.id || route.params.id)
    const isSubmitting = computed(() => eventsStore.isSubmitting)
    const error = computed(() => eventsStore.error)

    const isFormValid = computed(() => {
      return form.value.title.trim().length >= 3 && 
             form.value.date && 
             new Date(form.value.date) > new Date()
    })

    const minDate = computed(() => {
      const now = new Date()
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
      return now.toISOString().slice(0, 16)
    })

    const addArtist = () => {
      form.value.lineup.push('')
    }

    const removeArtist = (index) => {
      form.value.lineup.splice(index, 1)
    }

    const addTag = () => {
      const tag = newTag.value.trim().toLowerCase()
      if (tag && !form.value.tags.includes(tag)) {
        form.value.tags.push(tag)
        newTag.value = ''
      }
    }

    const removeTag = (index) => {
      form.value.tags.splice(index, 1)
    }

    const loadEvent = async () => {
      if (!isEdit.value) return

      eventsStore.clearError()
      const result = await eventsStore.fetchEvent(currentId.value)
      
      if (result.success && eventsStore.currentEvent) {
        const event = eventsStore.currentEvent
        
        // Format date for datetime-local input
        const eventDate = new Date(event.date)
        const formattedDate = new Date(eventDate.getTime() - (eventDate.getTimezoneOffset() * 60000))
          .toISOString()
          .slice(0, 16)

        form.value = {
          title: event.title || '',
          date: formattedDate,
          description: event.description || '',
          lineup: event.lineup && event.lineup.length > 0 ? event.lineup : [''],
          tags: event.tags || [],
          isActive: event.isActive !== undefined ? event.isActive : true
        }
      }
    }

    const handleSubmit = async () => {
      eventsStore.clearError()
      successMessage.value = ''

      // Clean up form data
      const eventData = {
        title: form.value.title.trim(),
        date: new Date(form.value.date).toISOString(),
        description: form.value.description.trim(),
        lineup: form.value.lineup.filter(artist => artist.trim().length > 0),
        tags: form.value.tags,
        ...(isEdit.value && { isActive: form.value.isActive })
      }

      let result
      if (isEdit.value) {
        result = await eventsStore.updateEvent(currentId.value, eventData)
      } else {
        result = await eventsStore.createEvent(eventData)
      }

      if (result.success) {
        successMessage.value = `Event ${isEdit.value ? 'updated' : 'created'} successfully!`
        
        setTimeout(() => {
          router.push('/events')
        }, 1500)
      }
    }

    // Load event data if editing
    onMounted(() => {
      if (isEdit.value) {
        loadEvent()
      }
    })

    // Watch for route changes (when navigating between create and edit)
    watch(() => currentId.value, () => {
      if (isEdit.value) {
        loadEvent()
      } else {
        // Reset form for create mode
        form.value = {
          title: '',
          date: '',
          description: '',
          lineup: [''],
          tags: [],
          isActive: true
        }
      }
    })

    return {
      form,
      newTag,
      successMessage,
      isEdit,
      isSubmitting,
      error,
      isFormValid,
      minDate,
      addArtist,
      removeArtist,
      addTag,
      removeTag,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.event-form {
  max-width: 800px;
}

.form-header {
  display: flex;
  align-items: center;
}

.form-card {
  margin-bottom: 2rem;
}

.form-content {
  padding: 2rem;
}

.form-group {
  margin-bottom: 2rem;
}

.form-label.required::after {
  content: '*';
  color: var(--error-color);
  margin-left: 0.25rem;
}

.lineup-inputs {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.lineup-item {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.lineup-item .form-input {
  flex: 1;
}

.tags-input {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tags-display {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  min-height: 2rem;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--surface-color);
}

.tag-input-row {
  display: flex;
  gap: 0.5rem;
}

.tag-input-row .form-input {
  flex: 1;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background-color: var(--primary-color);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

.tag-remove {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 0.75rem;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.tag-remove:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.checkbox-group {
  margin-top: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: normal;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.checkbox-text {
  font-size: 1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 2rem;
  border-top: 1px solid var(--border-color);
}

/* Responsive */
@media (max-width: 768px) {
  .form-content {
    padding: 1.5rem;
  }
  
  .form-actions {
    padding: 1.5rem;
    flex-direction: column-reverse;
  }
  
  .form-actions .btn {
    width: 100%;
  }
  
  .lineup-item {
    flex-direction: column;
    align-items: stretch;
  }
  
  .tag-input-row {
    flex-direction: column;
  }
  
  .tags-display {
    min-height: 3rem;
  }
}
</style>
