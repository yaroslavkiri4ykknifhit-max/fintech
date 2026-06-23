// src/contexts/AppContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import * as sheetService from '../services/googleSheets';

const AppContext = createContext();

// Default transactions (starts empty for clean production deploy)
const DEFAULT_TRANSACTIONS = [];

const DEFAULT_SETTINGS = {
  currentBalance: 0.00,
  currency: '$',
  cardHolder: 'Balance',
  cardNumber: '•••• •••• •••• ••••'
};

export const AppProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'income' | 'expense' | 'scan' | null

  // Load initial data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sheetService.fetchAllData();
      
      if (data.transactions.length === 0 && !localStorage.getItem('tracker_transactions')) {
        // First run: Seed default Figma mockup data
        console.log('Seeding default Figma demo data');
        localStorage.setItem('tracker_transactions', JSON.stringify(DEFAULT_TRANSACTIONS));
        localStorage.setItem('tracker_settings', JSON.stringify(DEFAULT_SETTINGS));
        
        // Apply overrides
        const overrideCurrency = localStorage.getItem('override_currency');
        const overrideBalance = localStorage.getItem('override_balance');
        const seedSettings = {
          ...DEFAULT_SETTINGS,
          currency: overrideCurrency || DEFAULT_SETTINGS.currency,
          currentBalance: overrideBalance !== null ? parseFloat(overrideBalance) : DEFAULT_SETTINGS.currentBalance
        };
        
        setTransactions(DEFAULT_TRANSACTIONS);
        setSettings(seedSettings);
      } else {
        // Standard flow
        const activeSettings = data.settings || DEFAULT_SETTINGS;
        const overrideCurrency = localStorage.getItem('override_currency');
        const overrideBalance = localStorage.getItem('override_balance');
        const mergedSettings = {
          ...activeSettings,
          currency: overrideCurrency || activeSettings.currency,
          currentBalance: overrideBalance !== null ? parseFloat(overrideBalance) : activeSettings.currentBalance
        };
        
        setTransactions(data.transactions);
        setSettings(mergedSettings);
      }
    } catch (err) {
      console.error('Failed to load application data:', err);
      setError('Could not load data from storage. Using local cache.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Add Transaction
  const handleAddTransaction = async (txData) => {
    const newTx = {
      ...txData,
      id: txData.id || `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: txData.createdAt || new Date().toISOString()
    };

    // Optimistic UI update
    setTransactions((prev) => [newTx, ...prev]);
    const change = newTx.type === 'income' ? newTx.amount : -newTx.amount;
    setSettings((prev) => ({
      ...prev,
      currentBalance: prev.currentBalance + change
    }));

    try {
      const res = await sheetService.addTransaction(newTx);
      if (res && res.settings) {
        setSettings(res.settings);
      }
    } catch (err) {
      console.error('Failed to sync transaction creation:', err);
      setError('Transaction saved locally but failed to sync online.');
    }
  };

  // Delete Transaction
  const handleDeleteTransaction = async (id) => {
    const txToDelete = transactions.find(t => t.id === id);
    if (!txToDelete) return;

    // Optimistic UI update
    setTransactions((prev) => prev.filter(t => t.id !== id));
    const change = txToDelete.type === 'income' ? -txToDelete.amount : txToDelete.amount;
    setSettings((prev) => ({
      ...prev,
      currentBalance: prev.currentBalance + change
    }));

    try {
      const res = await sheetService.deleteTransaction(id);
      if (res && res.settings) {
        setSettings(res.settings);
      }
    } catch (err) {
      console.error('Failed to sync transaction deletion:', err);
      setError('Transaction deleted locally but failed to sync online.');
    }
  };

  // Statistical calculations
  const getStats = () => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const income = transactions.filter(t => t.type === 'income');

    const totalExpenses = expenses.reduce((acc, t) => acc + t.amount, 0);
    const totalIncome = income.reduce((acc, t) => acc + t.amount, 0);

    // Group expenses by category
    const categoryTotals = expenses.reduce((acc, t) => {
      const cat = t.category || 'Other';
      if (!acc[cat]) {
        acc[cat] = { amount: 0, count: 0, category: cat };
      }
      acc[cat].amount += t.amount;
      acc[cat].count += 1;
      return acc;
    }, {});

    const sortedCategories = Object.values(categoryTotals).sort((a, b) => b.amount - a.amount);

    return {
      totalExpenses,
      totalIncome,
      categoryBreakdown: sortedCategories,
      expensesCount: expenses.length,
      incomeCount: income.length
    };
  };

  return (
    <AppContext.Provider value={{
      transactions,
      settings,
      loading,
      error,
      refreshData: loadData,
      addTransaction: handleAddTransaction,
      deleteTransaction: handleDeleteTransaction,
      getStats,
      activeModal,
      setActiveModal
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
