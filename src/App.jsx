// src/App.jsx
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import Layout from './components/common/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import Statistics from './components/Transactions/Statistics';
import TransactionList from './components/Transactions/TransactionList';
import Settings from './components/Settings/Settings';
import './App.css';

function App() {
  return (
    <AppProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/stats" element={<Statistics />} />
            <Route path="/transactions" element={<TransactionList />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </Router>
    </AppProvider>
  );
}

export default App;
