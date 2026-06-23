// src/components/Transactions/TransactionList.jsx
import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Search, Filter, ArrowUpDown, Trash2, Calendar, FileText, ShoppingBag, ShoppingCart } from 'lucide-react';
import { formatCurrency, getCategoryConfig } from '../Dashboard/Dashboard';
import './TransactionList.css';

const TransactionList = () => {
  const { transactions, settings, deleteTransaction, loading } = useApp();
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'income' | 'expense'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc'); // 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'
  
  // Dialog confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Extract unique categories from transactions for the filter dropdown
  const uniqueCategories = Array.from(
    new Set(transactions.map(t => t.category))
  ).filter(Boolean);

  // Filter logic
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description?.toLowerCase().includes(search.toLowerCase()) || 
                          t.category?.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    
    return matchesSearch && matchesType && matchesCategory;
  });

  // Sorting logic
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortBy === 'date-desc') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    if (sortBy === 'date-asc') {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
    if (sortBy === 'amount-desc') {
      return b.amount - a.amount;
    }
    if (sortBy === 'amount-asc') {
      return a.amount - b.amount;
    }
    return 0;
  });

  const handleDeleteClick = (id, e) => {
    e.stopPropagation(); // Avoid triggering any row click events
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmId) {
      await deleteTransaction(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const formatDateLabel = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="tx-list-view animate-fade-in">
      <header className="list-header">
        <h2 className="header-title-left">История операций</h2>
      </header>

      {/* Filter Toolbar */}
      <section className="search-filter-toolbar">
        {/* Search */}
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Поиск по названию или категории..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-field"
          />
        </div>

        {/* Filters Grid */}
        <div className="filters-grid">
          {/* Type Toggles */}
          <div className="type-toggle-pill">
            {['all', 'income', 'expense'].map(t => (
              <button 
                key={t}
                className={`type-pill-btn ${typeFilter === t ? 'active' : ''}`}
                onClick={() => setTypeFilter(t)}
              >
                {t === 'all' ? 'Все' : t === 'income' ? 'Доходы' : 'Расходы'}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <div className="select-wrapper">
            <Filter size={14} className="select-icon" />
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="toolbar-select"
            >
              <option value="all">Все категории</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="select-wrapper">
            <ArrowUpDown size={14} className="select-icon" />
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="toolbar-select"
            >
              <option value="date-desc">Сначала новые</option>
              <option value="date-asc">Сначала старые</option>
              <option value="amount-desc">Сумма (по убыванию)</option>
              <option value="amount-asc">Сумма (по возрастанию)</option>
            </select>
          </div>
        </div>
      </section>

      {/* List Container */}
      <section className="list-results-section">
        {loading ? (
          <div className="list-skeleton-container">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="tx-skeleton-row"></div>
            ))}
          </div>
        ) : sortedTransactions.length === 0 ? (
          <div className="empty-state">
            <p>Операции не найдены</p>
            <span className="empty-sub">Измените условия поиска или фильтрации</span>
          </div>
        ) : (
          <div className="full-tx-list">
            {sortedTransactions.map((tx) => {
              const config = getCategoryConfig(tx.category, tx.description);
              const isExpense = tx.type === 'expense';
              
              return (
                <div key={tx.id} className="list-tx-row animate-fade-in">
                  <div className={`tx-icon-box ${config.bgClass} ${config.iconClass}`}>
                    {config.icon}
                  </div>
                  
                  <div className="list-tx-details">
                    <span className="list-tx-title">{tx.description || config.label}</span>
                    <div className="list-tx-meta">
                      <span className="list-tx-date">{formatDateLabel(tx.date)}</span>
                      <span className="list-tx-dot">•</span>
                      <span className="list-tx-category-badge">{tx.category}</span>
                    </div>
                  </div>

                  <div className="list-tx-actions">
                    <span className={`list-tx-amount ${isExpense ? 'expense-val' : 'income-val'}`}>
                      {isExpense ? '-' : '+'}{formatCurrency(tx.amount, settings.currency)}
                    </span>
                    <button 
                      className="delete-row-btn" 
                      onClick={(e) => handleDeleteClick(tx.id, e)}
                      aria-label="Delete transaction"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Delete Confirmation Alert Modal */}
      {deleteConfirmId && (
        <div className="confirm-modal-backdrop animate-fade-in" onClick={() => setDeleteConfirmId(null)}>
          <div className="confirm-dialog animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-body">
              <h4>Удалить операцию?</h4>
              <p>Вы действительно хотите удалить эту операцию? Это действие нельзя будет отменить.</p>
            </div>
            <div className="confirm-actions">
              <button className="confirm-cancel-btn" onClick={() => setDeleteConfirmId(null)}>
                Отмена
              </button>
              <button className="confirm-delete-btn" onClick={handleConfirmDelete}>
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
