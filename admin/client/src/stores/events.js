import { defineStore } from 'pinia';
import axios from 'axios';

export const useEventsStore = defineStore('events', {
  state: () => ({
    events: [],
    currentEvent: null,
    isLoading: false,
    isSubmitting: false,
    error: null,
    filters: {
      upcoming: null,
      tag: null,
      limit: null,
    },
  }),

  getters: {
    upcomingEvents: (state) => {
      const now = new Date();
      return state.events.filter((event) => new Date(event.date) >= now);
    },

    pastEvents: (state) => {
      const now = new Date();
      return state.events.filter((event) => new Date(event.date) < now);
    },

    eventsByTag: (state) => (tag) => {
      return state.events.filter((event) =>
        event.tags.some((eventTag) =>
          eventTag.toLowerCase().includes(tag.toLowerCase())
        )
      );
    },
  },

  actions: {
    async fetchEvents(filters = {}) {
      this.isLoading = true;
      this.error = null;

      try {
        // Set base URL for all axios requests
        axios.defaults.baseURL =
          process.env.NODE_ENV === 'development'
            ? 'http://localhost:3001'
            : 'https://api.klub-kurt.com';

        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            params.append(key, value);
          }
        });

        const response = await axios.get(`/api/events?${params}`);
        this.events = response.data.data || [];
        return { success: true };
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch events';
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
    },

    async fetchEvent(id) {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await axios.get(`/api/events/${id}`);
        this.currentEvent = response.data.data;
        return { success: true };
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch event';
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
    },

    async createEvent(eventData) {
      this.isSubmitting = true;
      this.error = null;

      try {
        const response = await axios.post('/api/events', eventData);
        const newEvent = response.data.data;

        // Add to events array
        this.events.push(newEvent);

        // Sort events by date
        this.events.sort((a, b) => new Date(a.date) - new Date(b.date));

        return { success: true, data: newEvent };
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to create event';
        return { success: false, error: this.error };
      } finally {
        this.isSubmitting = false;
      }
    },

    async updateEvent(id, eventData) {
      this.isSubmitting = true;
      this.error = null;

      try {
        const response = await axios.put(`/api/events/${id}`, eventData);
        const updatedEvent = response.data.data;

        // Update in events array
        const index = this.events.findIndex((event) => event.id === id);
        if (index !== -1) {
          this.events[index] = updatedEvent;
        }

        // Update current event if it matches
        if (this.currentEvent && this.currentEvent.id === id) {
          this.currentEvent = updatedEvent;
        }

        // Sort events by date
        this.events.sort((a, b) => new Date(a.date) - new Date(b.date));

        return { success: true, data: updatedEvent };
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to update event';
        return { success: false, error: this.error };
      } finally {
        this.isSubmitting = false;
      }
    },

    async deleteEvent(id) {
      this.isSubmitting = true;
      this.error = null;

      try {
        await axios.delete(`/api/events/${id}`);

        // Remove from events array
        this.events = this.events.filter((event) => event.id !== id);

        // Clear current event if it matches
        if (this.currentEvent && this.currentEvent.id === id) {
          this.currentEvent = null;
        }

        return { success: true };
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to delete event';
        return { success: false, error: this.error };
      } finally {
        this.isSubmitting = false;
      }
    },

    setFilters(filters) {
      this.filters = { ...this.filters, ...filters };
    },

    clearFilters() {
      this.filters = {
        upcoming: null,
        tag: null,
        limit: null,
      };
    },

    setCurrentEvent(event) {
      this.currentEvent = event;
    },

    clearCurrentEvent() {
      this.currentEvent = null;
    },

    clearError() {
      this.error = null;
    },
  },
});
