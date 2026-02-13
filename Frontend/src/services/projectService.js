import api from './api';

export const projectService = {
  // Department Head Projects
  getProjectsByDepartmentHead: async () => {
    try {
      const response = await api.get('/admin/projects');
      return response.data;
    } catch (error) {
      const statusCode = error.response?.status;
      const errorMsg = error.response?.data?.message || error.message;
      const err = new Error(errorMsg);
      err.statusCode = statusCode;
      throw err;
    }
  },

  createProject: async (projectData) => {
    try {
      const response = await api.post('/admin/projects', projectData);
      return response.data;
    } catch (error) {
      const statusCode = error.response?.status;
      const errorMsg = error.response?.data?.message || error.message;
      const err = new Error(errorMsg);
      err.statusCode = statusCode;
      throw err;
    }
  },

  getProjectById: async (id) => {
    try {
      const response = await api.get(`/admin/projects/${id}`);
      return response.data;
    } catch (error) {
      const statusCode = error.response?.status;
      const errorMsg = error.response?.data?.message || error.message;
      const err = new Error(errorMsg);
      err.statusCode = statusCode;
      throw err;
    }
  },

  updateProject: async (id, projectData) => {
    try {
      const response = await api.put(`/admin/projects/${id}`, projectData);
      return response.data;
    } catch (error) {
      const statusCode = error.response?.status;
      const errorMsg = error.response?.data?.message || error.message;
      const err = new Error(errorMsg);
      err.statusCode = statusCode;
      throw err;
    }
  },

  archiveProject: async (id) => {
    try {
      const response = await api.patch(`/admin/projects/${id}/archive`);
      return response.data;
    } catch (error) {
      const statusCode = error.response?.status;
      const errorMsg = error.response?.data?.message || error.message;
      const err = new Error(errorMsg);
      err.statusCode = statusCode;
      throw err;
    }
  },

  unarchiveProject: async (id) => {
    try {
      const response = await api.patch(`/admin/projects/${id}/unarchive`);
      return response.data;
    } catch (error) {
      const statusCode = error.response?.status;
      const errorMsg = error.response?.data?.message || error.message;
      const err = new Error(errorMsg);
      err.statusCode = statusCode;
      throw err;
    }
  },

  deleteProject: async (id) => {
    try {
      const response = await api.delete(`/admin/projects/${id}`);
      return response.data;
    } catch (error) {
      const statusCode = error.response?.status;
      const errorMsg = error.response?.data?.message || error.message;
      const err = new Error(errorMsg);
      err.statusCode = statusCode;
      throw err;
    }
  },

  // Employee Projects
  getProjectsByEmployee: async () => {
    try {
      const response = await api.get('/employee/projects');
      return response.data;
    } catch (error) {
      const statusCode = error.response?.status;
      const errorMsg = error.response?.data?.message || error.message;
      const err = new Error(errorMsg);
      err.statusCode = statusCode;
      throw err;
    }
  },

  // Project Updates (Progress, Comments, etc.)
  updateProjectProgress: async (projectId, progress, comment = '') => {
    try {
      const response = await api.put(`/employee/projects/${projectId}/progress`, { progress, comment });
      return response.data;
    } catch (error) {
      const statusCode = error.response?.status;
      const errorMsg = error.response?.data?.message || error.message;
      const err = new Error(errorMsg);
      err.statusCode = statusCode;
      throw err;
    }
  },

  addProjectComment: async (projectId, content) => {
    try {
      const response = await api.post(`/employee/projects/${projectId}/comments`, { content });
      return response.data;
    } catch (error) {
      const statusCode = error.response?.status;
      const errorMsg = error.response?.data?.message || error.message;
      const err = new Error(errorMsg);
      err.statusCode = statusCode;
      throw err;
    }
  },

  getProjectUpdates: async (projectId, type = 'all', page = 1, limit = 20) => {
    try {
      const response = await api.get(`/admin/projects/${projectId}/updates`, {
        params: { type, page, limit }
      });
      return response.data;
    } catch (error) {
      const statusCode = error.response?.status;
      const errorMsg = error.response?.data?.message || error.message;
      const err = new Error(errorMsg);
      err.statusCode = statusCode;
      throw err;
    }
  },

  getProjectLatestUpdates: async (projectId, timestamp = null) => {
    try {
      const params = {};
      if (timestamp) params.timestamp = timestamp;
      const response = await api.get(`/admin/projects/${projectId}/updates/latest`, { params });
      return response.data;
    } catch (error) {
      const statusCode = error.response?.status;
      const errorMsg = error.response?.data?.message || error.message;
      const err = new Error(errorMsg);
      err.statusCode = statusCode;
      throw err;
    }
  },

  toggleUpdateLike: async (updateId) => {
    try {
      const response = await api.post(`/admin/projects/updates/${updateId}/like`);
      return response.data;
    } catch (error) {
      const statusCode = error.response?.status;
      const errorMsg = error.response?.data?.message || error.message;
      const err = new Error(errorMsg);
      err.statusCode = statusCode;
      throw err;
    }
  },

  replyToUpdate: async (updateId, content) => {
    try {
      const response = await api.post(`/admin/projects/updates/${updateId}/reply`, { content });
      return response.data;
    } catch (error) {
      const statusCode = error.response?.status;
      const errorMsg = error.response?.data?.message || error.message;
      const err = new Error(errorMsg);
      err.statusCode = statusCode;
      throw err;
    }
  },

  assignDepartmentToHead: async (departmentId) => {
    try {
      const response = await api.post('/admin/assign-department', { departmentId });
      return response.data;
    } catch (error) {
      const statusCode = error.response?.status;
      const errorMsg = error.response?.data?.message || error.message;
      const err = new Error(errorMsg);
      err.statusCode = statusCode;
      throw err;
    }
  }
};
