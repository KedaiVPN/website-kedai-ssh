import { authService } from './authService';
import { adminAuthService } from './adminAuthService';

const API_BASE_URL = window.location.origin;

// TODO: Define interfaces for message objects
export interface AdminMessage {
  id: number;
  content: string;
  target_role: 'all' | 'member' | 'reseller';
  duration_days: number | null;
  expires_at: string | null;
  created_at: string;
  admin_username: string;
  read_count: number;
}

export interface UserMessage {
  id: number;
  content: string;
  created_at: string;
  is_read: 0 | 1;
}

const getHeaders = () => {
  const token = adminAuthService.getAdminToken(); // For admin actions
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

const getUserHeaders = () => {
  const token = authService.getToken(); // For user actions
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Admin services
const getAdminMessages = async (): Promise<AdminMessage[]> => {
  const response = await fetch(`${API_BASE_URL}/api/admin/messages`, {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch messages');
  const data = await response.json();
  return data.messages;
};

const createMessage = async (payload: { content: string; targetRole: string; durationDays: number | null }): Promise<AdminMessage> => {
  const response = await fetch(`${API_BASE_URL}/api/admin/messages`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error('Failed to create message');
  const data = await response.json();
  return data.message;
};

const deleteMessage = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/admin/messages/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Failed to delete message');
};

// User services
const getUserMessages = async (): Promise<UserMessage[]> => {
  const response = await fetch(`${API_BASE_URL}/api/messages`, {
    headers: getUserHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch user messages');
  const data = await response.json();
  return data.messages;
};

const getUnreadCount = async (): Promise<number> => {
  const response = await fetch(`${API_BASE_URL}/api/messages/unread-count`, {
    headers: getUserHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch unread count');
  const data = await response.json();
  return data.count;
};

const markMessageAsRead = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/messages/${id}/read`, {
    method: 'POST',
    headers: getUserHeaders()
  });
  if (!response.ok) throw new Error('Failed to mark as read');
};


export const messageService = {
  getAdminMessages,
  createMessage,
  deleteMessage,
  getUserMessages,
  getUnreadCount,
  markMessageAsRead
};
