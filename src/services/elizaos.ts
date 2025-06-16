import axios from 'axios';
import { config } from '../config/env';

const elizaosApi = axios.create({
  baseURL: 'https://api.elizaos.com/v1',
  headers: {
    'Authorization': `Bearer ${config.elizaosApiKey}`,
    'Content-Type': 'application/json'
  }
});

export const elizaosService = {
  async healthCheck() {
    try {
      const response = await elizaosApi.get('/health');
      return response.data;
    } catch (error) {
      throw new Error('ElizaOS API health check failed');
    }
  }
}; 