import axios from 'axios';
import { getToken } from './authService';
import { ApiKey, Droplet, AccountInfo, Balance, Region, Size, Image, SshKey } from '@/types/digitalocean';

const API_URL = '/api/digitalocean';

const getHeaders = () => {
  const token = getToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// API Key Management
const getApiKeys = async (): Promise<ApiKey[]> => {
  const response = await axios.get(`${API_URL}/keys`, { headers: getHeaders() });
  return response.data;
};

const addApiKey = async (name: string, api_key: string): Promise<ApiKey> => {
  const response = await axios.post(`${API_URL}/keys`, { name, api_key }, { headers: getHeaders() });
  return response.data;
};

const deleteApiKey = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/keys/${id}`, { headers: getHeaders() });
};

// Account Info
const getAccountInfo = async (keyId: number): Promise<{ account: AccountInfo }> => {
  const response = await axios.get(`${API_URL}/account/${keyId}`, { headers: getHeaders() });
  return response.data;
};

const getBalanceInfo = async (keyId: number): Promise<Balance> => {
  const response = await axios.get(`${API_URL}/balance/${keyId}`, { headers: getHeaders() });
  return response.data;
};

// Droplet Management
const getDroplets = async (keyId: number): Promise<{ droplets: Droplet[] }> => {
  const response = await axios.get(`${API_URL}/droplets/${keyId}`, { headers: getHeaders() });
  return response.data;
};

const createDroplet = async (keyId: number, data: { name: string; region: string; size: string; image: string; ssh_keys: number[] }): Promise<Droplet> => {
  const response = await axios.post(`${API_URL}/droplets/${keyId}`, data, { headers: getHeaders() });
  return response.data;
};

const deleteDroplet = async (keyId: number, dropletId: number): Promise<void> => {
  await axios.delete(`${API_URL}/droplets/${keyId}/${dropletId}`, { headers: getHeaders() });
};

// Droplet Creation Options
const getRegions = async (keyId: number): Promise<{ regions: Region[] }> => {
  const response = await axios.get(`${API_URL}/regions/${keyId}`, { headers: getHeaders() });
  return response.data;
};

const getSizes = async (keyId: number): Promise<{ sizes: Size[] }> => {
  const response = await axios.get(`${API_URL}/sizes/${keyId}`, { headers: getHeaders() });
  return response.data;
};

const getImages = async (keyId: number): Promise<{ images: Image[] }> => {
  const response = await axios.get(`${API_URL}/images/${keyId}`, { headers: getHeaders() });
  return response.data;
};

// SSH Key Management
const getSshKeys = async (keyId: number): Promise<SshKey[]> => {
    const response = await axios.get(`${API_URL}/sshkeys/${keyId}`, { headers: getHeaders() });
    return response.data;
};

const addSshKey = async (keyId: number, name: string, public_key: string): Promise<SshKey> => {
    const response = await axios.post(`${API_URL}/sshkeys/${keyId}`, { name, public_key }, { headers: getHeaders() });
    return response.data;
};

const deleteSshKey = async (keyId: number, sshKeyId: number): Promise<void> => {
    await axios.delete(`${API_URL}/sshkeys/${keyId}/${sshKeyId}`, { headers: getHeaders() });
};

export const digitalOceanService = {
  getApiKeys,
  addApiKey,
  deleteApiKey,
  getAccountInfo,
  getBalanceInfo,
  getDroplets,
  createDroplet,
  deleteDroplet,
  getRegions,
  getSizes,
  getImages,
  getSshKeys,
  addSshKey,
  deleteSshKey,
};
