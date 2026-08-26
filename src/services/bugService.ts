import { adminAuthService } from './adminAuthService';
import { authService } from './authService';

const API_BASE_URL = window.location.origin;

export interface BugHost {
  id: number;
  protocol: 'ssh' | 'xray';
  link_format?: 'tls' | 'nontls' | 'grpc';
  label: string;
  value: string;
  payload?: string;
  proxy?: string;
  sni?: string;
  is_enhanced: boolean | 0 | 1;
  is_wildcard: boolean | 0 | 1;
  is_salto: boolean | 0 | 1;
  created_at: string;
  updated_at: string;
}

const getAdminHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${adminAuthService.getToken()}`
});

const getUserHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${authService.getToken()}`
});


// For user-facing injector page
export const getBugsForUser = async (): Promise<BugHost[]> => {
  const response = await fetch(`${API_BASE_URL}/api/bugs`, { headers: getUserHeaders() });
  if (!response.ok) throw new Error('Failed to fetch bug hosts');
  const data = await response.json();
  return data.bugs;
};


// For admin dashboard
export const getBugsForAdmin = async (): Promise<BugHost[]> => {
    const response = await fetch(`${API_BASE_URL}/api/admin/bugs`, { headers: getAdminHeaders() });
    if (!response.ok) throw new Error('Failed to fetch bug hosts');
    const data = await response.json();
    return data.bugs;
};

export const createBug = async (bugData: Partial<BugHost>): Promise<BugHost> => {
    const response = await fetch(`${API_BASE_URL}/api/admin/bugs`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify(bugData)
    });
    if (!response.ok) throw new Error('Failed to create bug host');
    const data = await response.json();
    return data.bug;
};

export const updateBug = async (id: number, bugData: Partial<BugHost>): Promise<BugHost> => {
    const response = await fetch(`${API_BASE_URL}/api/admin/bugs/${id}`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify(bugData)
    });
    if (!response.ok) throw new Error('Failed to update bug host');
    const data = await response.json();
    return data.bug;
};

export const deleteBug = async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/admin/bugs/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete bug host');
};
