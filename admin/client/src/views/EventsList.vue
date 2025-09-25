<template>
  <div class="events-list">
    <!-- Header with actions -->
    <div class="events-header flex flex-between mb-6">
      <div class="events-filters">
        <select 
          v-model="activeFilter" 
          @change="handleFilterChange"
          class="form-input"
          style="width: auto; min-width: 150px;"
        >
          <option value="">All Events</option>
          <option value="upcoming">Upcoming Only</option>
          <option value="past">Past Events</option>
        </select>
      </div>
      
      <router-link to="/events/create" class="btn btn-primary">
        ➕ Create Event
      </router-link>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="successMessage" class="alert alert-success mb-4">
      {{ successMessage }}
    </div>
    
    <div v-if="error" class="alert alert-error mb-4">
      {{ error }}
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading"></div>
      <p>Loading events...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="events.length === 0" class="empty-state">
      <div class="empty-icon">📅</div>
      <h3>No events found</h3>
      <p>{{ activeFilter ? 'No events match your current filter.' : 'Get started by creating your first event.' }}</p>
      <router-link to="/events/create" class="btn btn-primary">
        Create First Event
      </router-link>
    </div>

    <!-- Events Table -->
    <div v-else class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>Event</th>
            <th>Date</th>
            <th>Lineup</th>
            <th>Tags</th>
            <th>Status</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="event in events" :key="event.id">
            <td>
              <div class="event-cell">
                <h4 class="event-title">{{ event.title }}</h4>
                <p v-if="event.description" class="event-description">
                  {{ truncateText(event.description, 60) }}
                </p>
              </div>
            </td>
            
            <td>
              <div class="date-cell">
                <span class="date-main">{{ formatDate(event.date) }}</span>
                <span class="date-time">{{ formatTime(event.date) }}</span>
              </div>
            </td>
            
            <td>
              <div class="lineup-cell">
                <span v-if="event.lineup && event.lineup.length > 0" class="lineup-preview">
                  {{ event.lineup.slice(0, 2).join(', ') }}
                  <span v-if="event.lineup.length > 2" class="text-muted">
                    +{{ event.lineup.length - 2 }} more
                  </span>
                </span>
                <span v-else class="text-muted">No lineup</span>
              </div>
            </td>
            
            <td>
              <div class="tags-cell">
                <span v-if="event.tags && event.tags.length > 0">
                  <span 
                    v-for="tag in event.tags.slice(0, 3)" 
                    :key="tag" 
                    class="tag-mini"
                  >
                    {{ tag }}
                  </span>
                  <span v-if="event.tags.length > 3" class="text-muted">
                    +{{ event.tags.length - 3 }}
                  </span>
                </span>
                <span v-else class="text-muted">No tags</span>
              </div>
            </td>
            
            <td>
              <span 
                class="status-badge"
                :class="{
                  'status-upcoming': isUpcoming(event.date),
                  'status-past': !isUpcoming(event.date),
                  'status-inactive': !event.isActive
                }"
              >
                {{ getEventStatus(event) }}
              </span>
            </td>
            
            <td class="text-right">
              <div class="action-buttons">
                <router-link 
                  :to="`/events/edit/${event.id}`" 
                  class="btn btn-sm btn-secondary"
                >
                  Edit
                </router-link>
                <button 
                  @click="confirmDelete(event)" 
                  class="btn btn-sm btn-danger"
                  :disabled="isSubmitting"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="cancelDelete">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Confirm Delete</h3>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete <strong>"{{ eventToDelete?.title }}"</strong>?</p>
          <p class="text-muted">This action cannot be undone.</p>
        </div>
        <div class="modal-actions">
          <button @click="cancelDelete" class="btn btn-secondary">
            Cancel
          </button>
          <button 
            @click="handleDelete" 
            class="btn btn-danger"
            :disabled="isSubmitting"
          >
            <span v-if="isSubmitting" class="loading"></span>
            {{ isSubmitting ? 'Deleting...' : 'Delete Event' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useEventsStore } from '@/stores/events'

export default {
  name: 'EventsList',
  setup() {
    const eventsStore = useEventsStore()
    
    const activeFilter = ref('')
    const showDeleteModal = ref(false)
    const eventToDelete = ref(null)
    const successMessage = ref('')

    const isLoading = computed(() => eventsStore.isLoading)
    const isSubmitting = computed(() => eventsStore.isSubmitting)
    const error = computed(() => eventsStore.error)
    const allEvents = computed(() => eventsStore.events)

    const events = computed(() => {
      let filtered = allEvents.value

      if (activeFilter.value === 'upcoming') {
        filtered = eventsStore.upcomingEvents
      } else if (activeFilter.value === 'past') {
        filtered = eventsStore.pastEvents
      }

      return filtered.sort((a, b) => new Date(a.date) - new Date(b.date))
    })

    const handleFilterChange = async () => {
      const filters = {}
      if (activeFilter.value === 'upcoming') {
        filters.upcoming = 'true'
      }
      await eventsStore.fetchEvents(filters)
    }

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    }

    const formatTime = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const isUpcoming = (dateString) => {
      return new Date(dateString) >= new Date()
    }

    const getEventStatus = (event) => {
      if (!event.isActive) return 'Inactive'
      return isUpcoming(event.date) ? 'Upcoming' : 'Past'
    }

    const truncateText = (text, maxLength) => {
      if (!text) return ''
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
    }

    const confirmDelete = (event) => {
      eventToDelete.value = event
      showDeleteModal.value = true
    }

    const cancelDelete = () => {
      showDeleteModal.value = false
      eventToDelete.value = null
    }

    const handleDelete = async () => {
      if (!eventToDelete.value) return

      const result = await eventsStore.deleteEvent(eventToDelete.value.id)
      
      if (result.success) {
        successMessage.value = `Event "${eventToDelete.value.title}" deleted successfully`
        setTimeout(() => {
          successMessage.value = ''
        }, 5000)
      }
      
      showDeleteModal.value = false
      eventToDelete.value = null
    }

    onMounted(async () => {
      await eventsStore.fetchEvents()
    })

    return {
      activeFilter,
      showDeleteModal,
      eventToDelete,
      successMessage,
      isLoading,
      isSubmitting,
      error,
      events,
      handleFilterChange,
      formatDate,
      formatTime,
      isUpcoming,
      getEventStatus,
      truncateText,
      confirmDelete,
      cancelDelete,
      handleDelete
    }
  }
}
</script>

<style scoped>
.events-list {
  max-width: 1400px;
}

.events-header {
  align-items: center;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  margin: 0 0 2rem 0;
}

.table-container {
  overflow-x: auto;
}

.event-cell {
  min-width: 200px;
}

.event-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
}

.event-description {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.date-cell {
  min-width: 120px;
}

.date-main {
  display: block;
  font-weight: 500;
}

.date-time {
  display: block;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.lineup-cell,
.tags-cell {
  min-width: 150px;
}

.lineup-preview {
  font-size: 0.875rem;
}

.tag-mini {
  display: inline-block;
  background-color: var(--primary-color);
  color: white;
  padding: 0.125rem 0.375rem;
  border-radius: 8px;
  font-size: 0.75rem;
  margin-right: 0.25rem;
  margin-bottom: 0.25rem;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.status-upcoming {
  background-color: rgba(0, 255, 136, 0.2);
  color: var(--success-color);
}

.status-past {
  background-color: rgba(136, 136, 136, 0.2);
  color: var(--text-muted);
}

.status-inactive {
  background-color: rgba(255, 68, 68, 0.2);
  color: var(--error-color);
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
  margin: 2rem;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.modal-body {
  padding: 1.5rem;
}

.modal-body p {
  margin: 0 0 1rem 0;
}

.modal-body p:last-child {
  margin-bottom: 0;
}

.modal-actions {
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

/* Responsive */
@media (max-width: 768px) {
  .events-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-buttons .btn {
    width: 100%;
  }
}
</style>
