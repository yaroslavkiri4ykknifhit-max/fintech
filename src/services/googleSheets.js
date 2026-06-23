// src/services/googleSheets.js

const SPREADSHEET_ID = localStorage.getItem('override_google_sheets_spreadsheet_id') || import.meta.env.VITE_GOOGLE_SHEETS_SPREADSHEET_ID;
const API_KEY = localStorage.getItem('override_google_sheets_api_key') || import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
const APPS_SCRIPT_URL = localStorage.getItem('override_google_apps_script_url') || import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;

// Check if Google Sheets API or Apps Script is configured
const isSheetsConfigured = () => {
  return !!APPS_SCRIPT_URL || (!!SPREADSHEET_ID && !!API_KEY);
};

// Fallback to localStorage
const getLocalData = () => {
  const transactions = localStorage.getItem('tracker_transactions');
  const settings = localStorage.getItem('tracker_settings');
  
  return {
    transactions: transactions ? JSON.parse(transactions) : [],
    settings: settings ? JSON.parse(settings) : { currentBalance: 521985.00, currency: '$' }
  };
};

const saveLocalData = (transactions, settings) => {
  localStorage.setItem('tracker_transactions', JSON.stringify(transactions));
  if (settings) {
    localStorage.setItem('tracker_settings', JSON.stringify(settings));
  }
};

/**
 * Fetch all transactions and settings
 */
export const fetchAllData = async () => {
  if (!isSheetsConfigured()) {
    console.log('Using LocalStorage storage');
    return getLocalData();
  }

  // Case 1: Apps Script URL configured (Full Read-Write support)
  if (APPS_SCRIPT_URL) {
    try {
      console.log('Fetching from Google Apps Script...');
      const response = await fetch(`${APPS_SCRIPT_URL}?action=read`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      
      // Cache locally as fallback
      saveLocalData(data.transactions, data.settings);
      return data;
    } catch (error) {
      console.error('Apps Script Fetch Error, falling back to local cache:', error);
      return getLocalData();
    }
  }

  // Case 2: Read-only via official Google Sheets API v4
  if (SPREADSHEET_ID && API_KEY) {
    try {
      console.log('Fetching from Google Sheets API v4 (Read-Only)...');
      // Read "transactions" sheet (Range A:G)
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/transactions!A:G?key=${API_KEY}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('API response was not ok');
      const data = await response.json();
      
      const rows = data.values || [];
      if (rows.length === 0) return { transactions: [], settings: getLocalData().settings };

      // Header row check: id, type, amount, category, date, description, createdAt
      const headers = rows[0];
      const transactions = rows.slice(1).map(row => {
        return {
          id: row[0],
          type: row[1],
          amount: parseFloat(row[2]) || 0,
          category: row[3],
          date: row[4],
          description: row[5] || '',
          createdAt: row[6] || new Date().toISOString()
        };
      });

      // Fetch settings
      let settings = getLocalData().settings;
      try {
        const settingsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/settings!A2:B2?key=${API_KEY}`;
        const settingsRes = await fetch(settingsUrl);
        const settingsData = await settingsRes.json();
        if (settingsData.values && settingsData.values[0]) {
          settings = {
            currentBalance: parseFloat(settingsData.values[0][0]) || 0,
            currency: settingsData.values[0][1] || '$'
          };
        }
      } catch (e) {
        console.warn('Failed to fetch settings from sheet, using local:', e);
      }

      saveLocalData(transactions, settings);
      return { transactions, settings };
    } catch (error) {
      console.error('Google Sheets API Error, falling back to local cache:', error);
      return getLocalData();
    }
  }

  return getLocalData();
};

/**
 * Add a new transaction
 */
export const addTransaction = async (transaction) => {
  const local = getLocalData();
  const newTransactions = [transaction, ...local.transactions];
  
  // Calculate new balance
  const amount = parseFloat(transaction.amount) || 0;
  const balanceChange = transaction.type === 'income' ? amount : -amount;
  const newSettings = {
    ...local.settings,
    currentBalance: (parseFloat(local.settings.currentBalance) || 0) + balanceChange
  };

  saveLocalData(newTransactions, newSettings);

  if (APPS_SCRIPT_URL) {
    try {
      console.log('Sending transaction to Google Apps Script...');
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'add',
          transaction
        })
      });
      if (!response.ok) throw new Error('API response was not ok');
      return await response.json();
    } catch (error) {
      console.error('Failed to sync transaction to Google Sheets:', error);
      throw error;
    }
  }

  return { success: true, transaction, settings: newSettings };
};

/**
 * Delete a transaction by ID
 */
export const deleteTransaction = async (id) => {
  const local = getLocalData();
  const transactionToDelete = local.transactions.find(t => t.id === id);
  if (!transactionToDelete) return { success: false, error: 'Transaction not found' };

  const newTransactions = local.transactions.filter(t => t.id !== id);
  
  // Recalculate balance
  const amount = parseFloat(transactionToDelete.amount) || 0;
  const balanceChange = transactionToDelete.type === 'income' ? -amount : amount;
  const newSettings = {
    ...local.settings,
    currentBalance: (parseFloat(local.settings.currentBalance) || 0) + balanceChange
  };

  saveLocalData(newTransactions, newSettings);

  if (APPS_SCRIPT_URL) {
    try {
      console.log('Deleting transaction in Google Apps Script...');
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'delete',
          id
        })
      });
      if (!response.ok) throw new Error('API response was not ok');
      return await response.json();
    } catch (error) {
      console.error('Failed to sync deletion to Google Sheets:', error);
      throw error;
    }
  }

  return { success: true, settings: newSettings };
};

/**
 * Update global settings (balance and currency)
 */
export const updateSettings = async (settings) => {
  const local = getLocalData();
  const newSettings = {
    ...local.settings,
    currentBalance: parseFloat(settings.currentBalance) || 0,
    currency: settings.currency || '$'
  };
  
  saveLocalData(local.transactions, newSettings);

  if (APPS_SCRIPT_URL) {
    try {
      console.log('Updating settings in Google Apps Script...');
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'update_settings',
          settings: newSettings
        })
      });
      if (!response.ok) throw new Error('API response was not ok');
      return await response.json();
    } catch (error) {
      console.error('Failed to sync settings to Google Sheets:', error);
      throw error;
    }
  }

  return { success: true, settings: newSettings };
};

