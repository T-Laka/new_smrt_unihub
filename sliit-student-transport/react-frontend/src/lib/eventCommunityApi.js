import { apiRequest } from './api';

export const getApprovedStalls = async (eventId = '') => {
  const query = eventId ? `?eventId=${encodeURIComponent(eventId)}` : '';
  return apiRequest(`/api/stalls${query}`);
};

export const createStallRequest = async (payload) => {
  return apiRequest('/api/stalls', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const getAdminStalls = async (status = 'all') => {
  const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
  return apiRequest(`/api/admin/stalls${query}`);
};

export const updateStallStatus = async (stallId, status) => {
  return apiRequest(`/api/admin/stalls/${stallId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};

export const deleteStall = async (stallId) => {
  return apiRequest(`/api/admin/stalls/${stallId}`, {
    method: 'DELETE',
  });
};

export const getEventMemories = async (eventId = '') => {
  const query = eventId ? `?eventId=${encodeURIComponent(eventId)}` : '';
  return apiRequest(`/api/event-memories${query}`);
};

export const createEventMemory = async (payload) => {
  return apiRequest('/api/event-memories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const updateEventMemory = async (memoryId, payload) => {
  return apiRequest(`/api/event-memories/${memoryId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export const deleteEventMemory = async (memoryId, actingUserId) => {
  return apiRequest(`/api/event-memories/${memoryId}`, {
    method: 'DELETE',
    body: JSON.stringify({ actingUserId }),
  });
};
