import { defineStore } from 'pinia';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const useSiteConfigsStore = defineStore('siteConfigs', {
  state: () => ({
    configs: {
      marquee: null,
      soundcloud: null,
    },
    loading: false,
    error: null,
  }),

  getters: {
    marqueeConfig: (state) => state.configs.marquee,
    soundcloudConfig: (state) => state.configs.soundcloud,
    hasMarqueeConfig: (state) => !!state.configs.marquee,
    hasSoundcloudConfig: (state) => !!state.configs.soundcloud,
  },

  actions: {
    async fetchConfigs() {
      this.loading = true;
      this.error = null;

      try {
        // Set base URL for all axios requests
        axios.defaults.baseURL =
          process.env.NODE_ENV === 'development'
            ? 'http://localhost:3001'
            : 'https://api.klub-kurt.com';

        const response = await axios.get(`${API_URL}/siteconfigs`);
        this.configs = response.data.data;
        return response.data;
      } catch (error) {
        console.error('Error fetching site configurations:', error);
        this.error =
          error.response?.data?.error || 'Failed to fetch configurations';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchConfigByType(type) {
      this.loading = true;
      this.error = null;

      try {
        const response = await axios.get(`${API_URL}/siteconfigs/${type}`);
        this.configs[type] = {
          id: response.data.data.id,
          texts: response.data.data.texts,
          url: response.data.data.url,
          updatedAt: response.data.data.updatedAt,
        };
        return response.data;
      } catch (error) {
        console.error(`Error fetching ${type} configuration:`, error);
        this.error =
          error.response?.data?.error ||
          `Failed to fetch ${type} configuration`;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async createConfig(configData) {
      this.loading = true;
      this.error = null;

      try {
        const token = localStorage.getItem('token');
        const response = await axios.post(
          `${API_URL}/siteconfigs`,
          configData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        // Update local state
        const config = response.data.data;
        if (config.configType === 'marquee') {
          this.configs.marquee = {
            id: config.id,
            texts: config.marqueeTexts,
            updatedAt: config.updatedAt,
          };
        } else if (config.configType === 'soundcloud') {
          this.configs.soundcloud = {
            id: config.id,
            url: config.soundcloudUrl,
            updatedAt: config.updatedAt,
          };
        }

        return response.data;
      } catch (error) {
        console.error('Error creating site configuration:', error);
        this.error =
          error.response?.data?.error || 'Failed to create configuration';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateConfig(type, configData) {
      this.loading = true;
      this.error = null;

      try {
        const token = localStorage.getItem('token');
        const response = await axios.put(
          `${API_URL}/siteconfigs/${type}`,
          configData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        // Update local state
        const config = response.data.data;
        if (type === 'marquee') {
          this.configs.marquee = {
            id: config.id,
            texts: config.marqueeTexts,
            updatedAt: config.updatedAt,
          };
        } else if (type === 'soundcloud') {
          this.configs.soundcloud = {
            id: config.id,
            url: config.soundcloudUrl,
            updatedAt: config.updatedAt,
          };
        }

        return response.data;
      } catch (error) {
        console.error(`Error updating ${type} configuration:`, error);
        this.error =
          error.response?.data?.error ||
          `Failed to update ${type} configuration`;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async saveMarqueeConfig(texts) {
      const configData = {
        configType: 'marquee',
        marqueeTexts: texts,
      };

      if (this.hasMarqueeConfig) {
        return await this.updateConfig('marquee', { marqueeTexts: texts });
      } else {
        return await this.createConfig(configData);
      }
    },

    async saveSoundcloudConfig(url) {
      const configData = {
        configType: 'soundcloud',
        soundcloudUrl: url,
      };

      if (this.hasSoundcloudConfig) {
        return await this.updateConfig('soundcloud', { soundcloudUrl: url });
      } else {
        return await this.createConfig(configData);
      }
    },

    clearError() {
      this.error = null;
    },
  },
});
