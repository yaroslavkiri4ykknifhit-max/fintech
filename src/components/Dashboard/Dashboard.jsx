// src/components/Dashboard/Dashboard.jsx
import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { 
  PlusCircle, 
  MinusCircle, 
  Camera, 
  Bell,
  ShoppingCart, 
  ShoppingBag, 
  Play, 
  DollarSign, 
  HelpCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import Gauge from '../common/Gauge';

// Custom GitHub SVG Icon to replace deprecated Lucide icon
const GitHubIcon = ({ size = 20, ...props }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size} 
    stroke="currentColor" 
    strokeWidth="2.2" 
    fill="none" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);
import './Dashboard.css';

// Helper to format currency values
export const formatCurrency = (amount, symbol = '$') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount).replace('$', symbol);
};

// Helper to format timestamps into HH:MM AM/PM
const formatTime = (isoString) => {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return '12:00 PM';
  }
};

// Helper to map transaction categories to Lucide icons and styles
export const getCategoryConfig = (category, description = '') => {
  const desc = description.toLowerCase();
  const cat = category.toLowerCase();
  
  if (cat.includes('food') || desc.includes('food') || desc.includes('eat') || desc.includes('market') || desc.includes('restaurant')) {
    return {
      icon: <ShoppingCart size={20} />,
      bgClass: 'cat-food-bg',
      iconClass: 'cat-food-icon',
      label: 'Food',
      paymentMethod: 'Cash'
    };
  }
  if (cat.includes('youtube') || desc.includes('youtube') || desc.includes('netflix') || desc.includes('spotify') || cat.includes('entertainment') || cat.includes('dribbble')) {
    if (desc.includes('dribbble')) {
      return {
        icon: <span className="dribbble-ball">🏀</span>,
        bgClass: 'cat-dribbble-bg',
        iconClass: 'cat-dribbble-icon',
        label: 'Dribbble Pro',
        paymentMethod: 'Credit'
      };
    }
    return {
      icon: <Play size={18} fill="currentColor" />,
      bgClass: 'cat-youtube-bg',
      iconClass: 'cat-youtube-icon',
      label: category || 'YouTube',
      paymentMethod: 'Credit'
    };
  }
  if (cat.includes('github') || desc.includes('github') || cat.includes('developer') || desc.includes('copilot')) {
    return {
      icon: <GitHubIcon size={20} />,
      bgClass: 'cat-github-bg',
      iconClass: 'cat-github-icon',
      label: 'GitHub',
      paymentMethod: 'Credit'
    };
  }
  if (cat.includes('shopping') || desc.includes('shop') || desc.includes('clothes') || desc.includes('zara')) {
    return {
      icon: <ShoppingBag size={20} />,
      bgClass: 'cat-shopping-bg',
      iconClass: 'cat-shopping-icon',
      label: 'Shopping',
      paymentMethod: 'Credit'
    };
  }
  if (cat.includes('salary') || cat.includes('income') || cat.includes('paycheck')) {
    return {
      icon: <DollarSign size={20} />,
      bgClass: 'cat-salary-bg',
      iconClass: 'cat-salary-icon',
      label: 'Salary',
      paymentMethod: 'Direct'
    };
  }
  
  // Default fallback
  return {
    icon: <HelpCircle size={20} />,
    bgClass: 'cat-other-bg',
    iconClass: 'cat-other-icon',
    label: category || 'Other',
    paymentMethod: 'Credit'
  };
};

const Dashboard = () => {
  const { transactions, settings, getStats, loading, setActiveModal } = useApp();

  const stats = getStats();
  
  // Get date strings for the header
  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('en-US', { day: 'numeric', month: 'long' });

  // Take the 10 most recent transactions
  const recentTransactions = transactions.slice(0, 10);

  return (
    <div className="dashboard-view animate-fade-in">
      {/* Header Row */}
      <header className="dashboard-header">
        <div className="date-info">
          <span className="day-name">{dayName},</span>
          <h2 className="current-date">{dateStr}</h2>
        </div>
        <button className="notification-btn" aria-label="Notifications">
          <Bell size={20} />
          <span className="bell-badge"></span>
        </button>
      </header>

      {/* Dynamic Animated Gauge Section */}
      <section className="card-section">
        <Gauge
          activeGradient={["#a855f7", "#06b6d4"]}
          centerValue={settings.currentBalance}
          defaultLabel="Total Balance"
          endAngle={400}
          formatOptions={{ 
            style: "currency", 
            currency: settings.currency === '$' ? 'USD' : (settings.currency === '₽' || settings.currency === 'руб') ? 'RUB' : 'BYN', 
            maximumFractionDigits: 0 
          }}
          inactiveFillOpacity={0.4}
          inactiveGradient={["#334155", "#38bdf8"]}
          notchCornerRadius={7}
          spacing={0}
          startAngle={140}
          useGradient
          value={66}
        />
      </section>

      {/* Monthly Mini Statistics Summary */}
      <section className="mini-stats">
        <div className="stat-pill income">
          <div className="stat-pill-icon"><TrendingUp size={16} /></div>
          <div className="stat-pill-info">
            <span className="stat-pill-label">Income</span>
            <span className="stat-pill-val">{formatCurrency(stats.totalIncome, settings.currency)}</span>
          </div>
        </div>
        <div className="stat-pill expense">
          <div className="stat-pill-icon"><TrendingDown size={16} /></div>
          <div className="stat-pill-info">
            <span className="stat-pill-label">Expenses</span>
            <span className="stat-pill-val">{formatCurrency(stats.totalExpenses, settings.currency)}</span>
          </div>
        </div>
      </section>

      {/* Quick Action Controls */}
      <section className="quick-actions">
        <button className="action-btn income-btn" onClick={() => setActiveModal('income')}>
          <PlusCircle size={18} />
          <span>Доход</span>
        </button>
        <button className="action-btn expense-btn" onClick={() => setActiveModal('expense')}>
          <MinusCircle size={18} />
          <span>Расход</span>
        </button>
        <button className="action-btn scan-btn" onClick={() => setActiveModal('scan')}>
          <Camera size={18} />
          <span>Чек API</span>
        </button>
      </section>

      {/* Transactions List */}
      <section className="transactions-section">
        <h3 className="section-title">Today's Transactions</h3>
        
        {loading ? (
          <div className="list-skeleton-container">
            {[1, 2, 3].map(i => (
              <div key={i} className="tx-skeleton-row"></div>
            ))}
          </div>
        ) : recentTransactions.length === 0 ? (
          <div className="empty-state">
            <p>Нет операций за сегодня</p>
            <span className="empty-sub">Добавьте операцию вручную или отсканируйте чек</span>
          </div>
        ) : (
          <div className="tx-list">
            {recentTransactions.map((tx) => {
              const config = getCategoryConfig(tx.category, tx.description);
              const isExpense = tx.type === 'expense';
              
              return (
                <div key={tx.id} className="tx-item-card">
                  <div className={`tx-icon-box ${config.bgClass} ${config.iconClass}`}>
                    {config.icon}
                  </div>
                  
                  <div className="tx-details">
                    <span className="tx-name">{tx.description || config.label}</span>
                    <div className="tx-sub-row">
                      <span className="tx-time">{formatTime(tx.createdAt)}</span>
                      <span className="tx-dot">•</span>
                      <span className="tx-method">{config.paymentMethod}</span>
                    </div>
                  </div>
                  
                  <div className={`tx-amount ${isExpense ? 'expense-val' : 'income-val'}`}>
                    {isExpense ? '-' : '+'}{formatCurrency(tx.amount, settings.currency)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modals are now mounted globally at the Layout level to fix z-index stacking context constraints */}
    </div>
  );
};

export default Dashboard;
