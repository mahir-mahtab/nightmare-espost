import { config } from '../config.js';

const API_URL = config.apiUrl;

export const liveEventService = {
  async getLatestLiveEvent() {
    try {
      const response = await fetch(`${API_URL}/events`);
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      
      const data = await response.json();
      
      if (!data.success || !data.data || data.data.length === 0) {
        return null;
      }

      // Find a LIVE event, otherwise return the first event
      const events = data.data;
      const liveEvent = events.find((e) => e.status === 'LIVE');
      
      return liveEvent || events[0];
    } catch (error) {
      console.error('Error fetching live event:', error);
      return null;
    }
  },
};
