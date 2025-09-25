<template>
  <div class="dashboard">
    <!-- Quick Stats -->
    <div class="stats-grid mb-6">
      <div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-content">
          <h3 class="stat-number">{{ totalEvents }}</h3>
          <p class="stat-label">Total Events</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">🎵</div>
        <div class="stat-content">
          <h3 class="stat-number">{{ upcomingEventsCount }}</h3>
          <p class="stat-label">Upcoming Events</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">🏷️</div>
        <div class="stat-content">
          <h3 class="stat-number">{{ uniqueTags }}</h3>
          <p class="stat-label">Event Tags</p>
        </div>
      </div>
    </div>

    <div class="dashboard-grid">
      <!-- Recent Events -->
      <div class="dashboard-section">
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Recent Events</h2>
            <router-link to="/events" class="btn btn-sm">View All</router-link>
          </div>
          
          <div v-if="isLoading" class="loading-state">
            <div class="loading"></div>
            <p>Loading events...</p>
          </div>
          
          <div v-else-if="error" class="alert alert-error">
            {{ error }}
          </div>
          
          <div v-else-if="events.length === 0" class="empty-state">
            <p>No events found.</p>
            <router-link to="/events/create" class="btn btn-primary">
              Create First Event
            </router-link>
          </div>
          
          <div v-else class="events-list">
            <div 
              v-for="event in recentEvents" 
              :key="event.id" 
              class="event-item"
            >
              <div class="event-info">
                <h4 class="event-title">{{ event.title }}</h4>
                <p class="event-date">{{ formatDate(event.date) }}</p>
                <div class="event-tags">
                  <span 
                    v-for="tag in event.tags" 
                    :key="tag" 
                    class="tag"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
              <div class="event-actions">
                <router-link 
                  :to="`/events/edit/${event.id}`" 
                  class="btn btn-sm btn-secondary"
                >
                  Edit
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="dashboard-section">
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Quick Actions</h2>
          </div>
          
          <div class="quick-actions">
            <router-link to="/events/create" class="action-card">
              <div class="action-icon">➕</div>
              <div class="action-content">
                <h3>Create Event</h3>
                <p>Add a new event to the system</p>
              </div>
            </router-link>
            
            <router-link to="/events" class="action-card">
              <div class="action-icon">📋</div>
              <div class="action-content">
                <h3>Manage Events</h3>
                <p>View, edit, or delete existing events</p>
              </div>
            </router-link>
            
            <a href="../../../website/index.html" target="_blank" class="action-card">
              <div class="action-icon">🌐</div>
              <div class="action-content">
                <h3>View Website</h3>
                <p>See how events appear on the site</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useEventsStore } from '@/stores/events'

export default {
  name: 'Dashboard',
  setup() {
    const eventsStore = useEventsStore()

    const isLoading = computed(() => eventsStore.isLoading)
    const error = computed(() => eventsStore.error)
    const events = computed(() => eventsStore.events)

    // Stats computeds
    const totalEvents = computed(() => events.value.length)
    const upcomingEventsCount = computed(() => eventsStore.upcomingEvents.length)
    const uniqueTags = computed(() => {
      const tags = new Set()
      events.value.forEach(event => {
        event.tags.forEach(tag => tags.add(tag))
      })
      return tags.size
    })

    const recentEvents = computed(() => {
      return events.value
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
    })

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    onMounted(async () => {
      await eventsStore.fetchEvents()
    })

    return {
      isLoading,
      error,
      events,
      totalEvents,
      upcomingEventsCount,
      uniqueTags,
      recentEvents,
      formatDate
    }
  }
}
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  font-size: 2rem;
  opacity: 0.8;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
  color: var(--primary-color);
}

.stat-label {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.event-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  transition: background-color 0.2s;
}

.event-item:hover {
  background-color: rgba(255, 85, 0, 0.05);
}

.event-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
}

.event-date {
  margin: 0 0 0.5rem 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.event-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag {
  background-color: var(--primary-color);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
}

.action-card:hover {
  background-color: rgba(255, 85, 0, 0.1);
  border-color: var(--primary-color);
  transform: translateY(-2px);
}

.action-icon {
  font-size: 1.5rem;
  opacity: 0.8;
}

.action-content h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
}

.action-content p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .event-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .event-actions {
    align-self: stretch;
  }
  
  .event-actions .btn {
    width: 100%;
  }
}
</style>
