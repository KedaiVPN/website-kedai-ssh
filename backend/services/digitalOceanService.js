const pool = require('../db/connection');
const axios = require('axios');

const DO_API_URL = 'https://api.digitalocean.com/v2';

const getApiKey = async (keyId) => {
    const [rows] = await pool.query('SELECT api_key FROM digitalocean_apikeys WHERE id = ?', [keyId]);
    if (rows.length === 0) {
        throw new Error('API Key not found');
    }
    return rows[0].api_key.trim();
};

const makeApiRequest = async (apiKey, endpoint, method = 'GET', data = null) => {
    const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
    };

    try {
        const response = await axios({
            method,
            url: `${DO_API_URL}${endpoint}`,
            headers,
            data
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            console.error(`DO API Error: ${error.response.status} ${error.response.statusText}`, error.response.data);
            throw new Error(error.response.data.message || `Request failed with status ${error.response.status}`);
        } else if (error.request) {
            console.error('DO API Error: No response received', error.request);
            throw new Error('No response from DigitalOcean API');
        } else {
            console.error('DO API Error: Request setup failed', error.message);
            throw new Error(`Failed to make API request: ${error.message}`);
        }
    }
};


const getAccountInfo = async (apiKey) => {
    return makeApiRequest(apiKey, '/account');
};

const getBalanceInfo = async (apiKey) => {
    // Note: The balance endpoint is not standard. This is a common pattern but might need adjustment.
    // The official endpoint is /customers/my/balance
    return makeApiRequest(apiKey, '/customers/my/balance');
};

const getDroplets = async (apiKey) => {
    return makeApiRequest(apiKey, '/droplets?per_page=200');
};

const getRegions = async (apiKey) => {
    return makeApiRequest(apiKey, '/regions?per_page=200');
};

const getSizes = async (apiKey) => {
    return makeApiRequest(apiKey, '/sizes?per_page=200');
};

const getImages = async (apiKey) => {
    return makeApiRequest(apiKey, '/images?type=distribution&per_page=200');
};

const createDroplet = async (apiKey, { name, region, size, image, ssh_keys }) => {
    const dropletData = {
        name,
        region,
        size,
        image,
        ssh_keys, // Gunakan SSH keys di sini
        tags: ['managed-by-app']
    };
    return makeApiRequest(apiKey, '/droplets', 'POST', dropletData);
};

const deleteDroplet = async (apiKey, dropletId) => {
    return makeApiRequest(apiKey, `/droplets/${dropletId}`, 'DELETE');
};

const getSshKeys = async (apiKey) => {
    return makeApiRequest(apiKey, '/account/keys?per_page=200');
};

const addSshKey = async (apiKey, name, publicKey) => {
    const keyData = {
        name,
        public_key: publicKey,
    };
    return makeApiRequest(apiKey, '/account/keys', 'POST', keyData);
};

const deleteSshKey = async (apiKey, keyId) => {
    return makeApiRequest(apiKey, `/account/keys/${keyId}`, 'DELETE');
};

module.exports = {
    getApiKey,
    getAccountInfo,
    getBalanceInfo,
    getDroplets,
    getRegions,
    getSizes,
    getImages,
    createDroplet,
    deleteDroplet,
    getSshKeys,
    addSshKey,
    deleteSshKey,
};
