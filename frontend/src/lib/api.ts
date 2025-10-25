import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Document API
export const documentApi = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getStatus: async (documentId: string) => {
    const response = await api.get(`/documents/${documentId}/status`);
    return response.data;
  },

  getResult: async (documentId: string) => {
    const response = await api.get(`/documents/${documentId}/result`);
    return response.data;
  },

  list: async () => {
    const response = await api.get('/documents');
    return response.data;
  },
};

// Report API
export const reportApi = {
  export: async (documentId: string, format: string = 'json') => {
    const response = await api.post(
      `/reports/${documentId}/export`,
      { format },
      { responseType: 'blob' }
    );
    return response.data;
  },

  preview: async (documentId: string) => {
    const response = await api.get(`/reports/${documentId}/preview`);
    return response.data;
  },
};

// Term Lists API
export const termListApi = {
  getAll: async () => {
    const response = await api.get('/term-lists');
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/term-lists', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/term-lists/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/term-lists/${id}`);
    return response.data;
  },
};

// Templates API
export const templateApi = {
  getAll: async () => {
    const response = await api.get('/templates');
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/templates', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/templates/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/templates/${id}`);
    return response.data;
  },
};
