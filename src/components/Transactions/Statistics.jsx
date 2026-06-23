// src/components/Transactions/Statistics.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { ArrowLeft, Bell, ShoppingCart, ShoppingBag, Play, DollarSign, HelpCircle } from 'lucide-react';
import { formatCurrency, getCategoryConfig } from '../Dashboard/Dashboard';
import './Statistics.css';

const Statistics = () => {
  const navigate = useNavigate();
  const { transactions, settings, loading } = useApp();
  const [viewMode, setViewMode] = useState('weekly'); // 'weekly' or 'monthly'

  const now = new Date();
  const currentMonthLabel = now.toLocaleDateString('en-US', { month: 'short' });

  // 1. Calculate boundaries
  // Current Week (Monday - Sunday)
  const startOfCurrentWeek = new Date(now);
  const currentDay = now.getDay();
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  startOfCurrentWeek.setDate(now.getDate() + diffToMonday);
  startOfCurrentWeek.setHours(0, 0, 0, 0);
  const endOfCurrentWeek = new Date(startOfCurrentWeek);
  endOfCurrentWeek.setDate(startOfCurrentWeek.getDate() + 7);

  // Previous Week
  const startOfPrevWeek = new Date(startOfCurrentWeek);
  startOfPrevWeek.setDate(startOfCurrentWeek.getDate() - 7);
  const endOfPrevWeek = new Date(startOfCurrentWeek);

  // Current Month
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);

  // Previous Month
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

  // 2. Filter transactions
  const expenses = transactions.filter(t => t.type === 'expense');

  let selectedExpenses = [];
  let comparisonExpenses = [];
  let periodLabel = '';

  if (viewMode === 'weekly') {
    selectedExpenses = expenses.filter(t => {
      const d = new Date(t.date);
      return d >= startOfCurrentWeek && d < endOfCurrentWeek;
    });
    comparisonExpenses = expenses.filter(t => {
      const d = new Date(t.date);
      return d >= startOfPrevWeek && d < endOfPrevWeek;
    });
    periodLabel = 'Weekly Expenses';
  } else {
    selectedExpenses = expenses.filter(t => {
      const d = new Date(t.date);
      return d >= startOfCurrentMonth && d < endOfCurrentMonth;
    });
    comparisonExpenses = expenses.filter(t => {
      const d = new Date(t.date);
      return d >= startOfPrevMonth && d < endOfPrevMonth;
    });
    periodLabel = 'Monthly Expenses';
  }

  const totalValue = selectedExpenses.reduce((sum, t) => sum + t.amount, 0);
  const comparisonTotal = comparisonExpenses.reduce((sum, t) => sum + t.amount, 0);

  // 3. Trend calculations
  let trendPercent = 0;
  let trendDirection = 'flat'; // 'up' | 'down' | 'flat'

  if (comparisonTotal > 0) {
    const changePercent = ((totalValue - comparisonTotal) / comparisonTotal) * 100;
    trendPercent = Math.abs(Math.round(changePercent));
    trendDirection = changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'flat';
  } else if (totalValue > 0) {
    trendPercent = 100;
    trendDirection = 'up';
  }

  // 4. Generate Chart Data
  const getWeeklyChartData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayTotals = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    
    selectedExpenses.forEach(t => {
      const date = new Date(t.date);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }); // "Mon", "Tue" etc.
      if (dayTotals[dayName] !== undefined) {
        dayTotals[dayName] += t.amount;
      }
    });

    const maxVal = Math.max(...Object.values(dayTotals));
    
    return days.map(day => {
      const amount = dayTotals[day];
      const heightPercent = maxVal > 0 ? (amount / maxVal) * 95 : 0;
      return {
        day,
        amount,
        heightPercent
      };
    });
  };

  const getMonthlyChartData = () => {
    const months = [];
    
    // Generate the last 6 calendar months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleDateString('en-US', { month: 'short' });
      months.push({
        label: monthLabel,
        year: d.getFullYear(),
        month: d.getMonth(),
        amount: 0
      });
    }

    // Group expenses by calendar month
    expenses.forEach(t => {
      const date = new Date(t.date);
      const tMonth = date.getMonth();
      const tYear = date.getFullYear();
      
      const match = months.find(m => m.month === tMonth && m.year === tYear);
      if (match) {
        match.amount += t.amount;
      }
    });

    const maxVal = Math.max(...months.map(m => m.amount));
    
    return months.map(m => {
      const heightPercent = maxVal > 0 ? (m.amount / maxVal) * 95 : 0;
      return {
        day: m.label,
        amount: m.amount,
        heightPercent
      };
    });
  };

  const chartData = viewMode === 'weekly' ? getWeeklyChartData() : getMonthlyChartData();

  // 5. Dynamic category breakdown list
  const categoryTotals = selectedExpenses.reduce((acc, t) => {
    const cat = t.category || 'Other';
    if (!acc[cat]) {
      acc[cat] = { amount: 0, count: 0, category: cat };
    }
    acc[cat].amount += t.amount;
    acc[cat].count += 1;
    return acc;
  }, {});

  const categoryBreakdown = Object.values(categoryTotals).sort((a, b) => b.amount - a.amount);

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

      {/* Dynamic Summary Card */}
      <section className="average-section">
        <span className="average-label">{periodLabel}</span>
        <div className="average-row">
          <h1 className="average-value">
            {formatCurrency(totalValue, settings.currency)}
          </h1>
          {trendDirection !== 'flat' && trendPercent > 0 && (
            <div className={`trend-badge ${trendDirection === 'down' ? 'up' : 'down'}`}>
              <span className="trend-arrow">{trendDirection === 'down' ? '↓' : '↑'}</span>
              <span className="trend-percent">{trendPercent}%</span>
            </div>
          )}
        </div>
      </section>

      {/* Chart Card */}
      <section className="chart-section-card">
        <div className="bar-chart-container">
          {chartData.map((data) => {
            const isHighlighted = viewMode === 'weekly'
              ? data.day === 'Sat'
              : data.day === currentMonthLabel;
            return (
              <div key={data.day} className="chart-column">
                <div className="chart-track">
                  <div 
                    className={`chart-bar ${isHighlighted ? 'highlighted-bar' : ''}`}
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
        ) : categoryBreakdown.length === 0 ? (
          <div className="empty-state">
            <p>Нет расходов для отображения</p>
            <span className="empty-sub">Добавьте расходные операции для отображения статистики</span>
          </div>
        ) : (
          <div className="category-list">
            {categoryBreakdown.map((catStat) => {
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
