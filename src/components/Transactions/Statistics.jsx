// src/components/Transactions/Statistics.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { ArrowLeft, Bell, ShoppingCart, ShoppingBag, Play, DollarSign, HelpCircle } from 'lucide-react';
import { formatCurrency, getCategoryConfig } from '../Dashboard/Dashboard';
import './Statistics.css';

const Statistics = () => {
  const navigate = useNavigate();
  const { transactions, settings, getStats, loading } = useApp();
  const [viewMode, setViewMode] = useState('weekly'); // 'weekly' or 'monthly'

  const stats = getStats();
  
  // Calculate average expenses dynamically
  const expenses = transactions.filter(t => t.type === 'expense');
  const totalExpenseVal = expenses.reduce((sum, t) => sum + t.amount, 0);
  const averageExpense = expenses.length > 0 
    ? totalExpenseVal / (viewMode === 'weekly' ? 1 : 4) // simple estimation
    : 0.00;

  // Group weekly data (Mon-Sun)
  // Seed realistic weekday heights matching the Figma proportions if no actual daily data is present
  const getWeeklyChartData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Group transactions by weekday
    const dayTotals = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    let hasData = false;

    expenses.forEach(t => {
      const date = new Date(t.date);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }); // "Mon", "Tue" etc.
      if (dayTotals[dayName] !== undefined) {
        dayTotals[dayName] += t.amount;
        hasData = true;
      }
    });

    // Figma proportions if no transaction data exists
    // Mon: 60%, Tue: 75%, Wed: 40%, Thu: 75%, Fri: 55%, Sat: 95%, Sun: 75%
    const defaultProportions = {
      Mon: 60,
      Tue: 75,
      Wed: 35,
      Thu: 75,
      Fri: 55,
      Sat: 95,
      Sun: 75
    };

    if (!hasData) {
      return days.map(day => ({
        day,
        amount: 0,
        heightPercent: 0 // flat chart when there is no data
      }));
    }

    // Find max value to normalize heights
    const maxVal = Math.max(...Object.values(dayTotals));
    
    return days.map(day => {
      const amount = dayTotals[day];
      const heightPercent = maxVal > 0 ? (amount / maxVal) * 95 : 5; // Keep min 5% for visibility
      return {
        day,
        amount,
        heightPercent: Math.max(heightPercent, 5) // ensure at least a small dot is shown
      };
    });
  };

  const chartData = getWeeklyChartData();

  return (
    <div className="stats-view animate-fade-in">
      {/* Header */}
      <header className="stats-header">
        <button className="back-btn" onClick={() => navigate('/')} aria-label="Go back">
          <ArrowLeft size={20} />
        </button>
        <h2 className="header-title">Statistics</h2>
        <button className="notification-btn" aria-label="Notifications">
          <Bell size={20} />
          <span className="bell-badge"></span>
        </button>
      </header>

      {/* Average Card */}
      <section className="average-section">
        <span className="average-label">Expenses Average</span>
        <div className="average-row">
          <h1 className="average-value">
            {formatCurrency(averageExpense, settings.currency)}
          </h1>
          <div className="trend-badge down">
            <span className="trend-arrow">↓</span>
            <span className="trend-percent">20%</span>
          </div>
        </div>
      </section>

      {/* Chart Card */}
      <section className="chart-section-card">
        <div className="bar-chart-container">
          {chartData.map((data, index) => {
            const isSaturday = data.day === 'Sat';
            return (
              <div key={data.day} className="chart-column">
                <div className="chart-track">
                  <div 
                    className={`chart-bar ${isSaturday ? 'highlighted-bar' : ''}`}
                    style={{ height: `${data.heightPercent}%` }}
                  ></div>
                </div>
                <span className="chart-day-label">{data.day}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Toggle View Mode */}
      <section className="toggle-section">
        <div className="toggle-container">
          <button 
            className={`toggle-btn ${viewMode === 'weekly' ? 'active' : ''}`}
            onClick={() => setViewMode('weekly')}
          >
            Weekly
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'monthly' ? 'active' : ''}`}
            onClick={() => setViewMode('monthly')}
          >
            Monthly
          </button>
        </div>
      </section>

      {/* Categories breakdown */}
      <section className="categories-breakdown">
        <h3 className="section-title">Categories</h3>

        {loading ? (
          <div className="list-skeleton-container">
            {[1, 2].map(i => (
              <div key={i} className="tx-skeleton-row"></div>
            ))}
          </div>
        ) : stats.categoryBreakdown.length === 0 ? (
          <div className="empty-state">
            <p>Нет расходов для отображения</p>
            <span className="empty-sub">Добавьте расходные операции для отображения статистики</span>
          </div>
        ) : (
          <div className="category-list">
            {stats.categoryBreakdown.map((catStat) => {
              const config = getCategoryConfig(catStat.category);
              
              return (
                <div key={catStat.category} className="category-item-card">
                  <div className={`tx-icon-box ${config.bgClass} ${config.iconClass}`}>
                    {config.icon}
                  </div>
                  
                  <div className="category-details">
                    <span className="category-name">{config.label}</span>
                    <span className="category-count">
                      {catStat.count} {catStat.count === 1 ? 'transaction' : 'transactions'}
                    </span>
                  </div>
                  
                  <div className="category-total expense-val">
                    -{formatCurrency(catStat.amount, settings.currency)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Statistics;
