// src/components/AddTransaction/TransactionModal.jsx
import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { X } from 'lucide-react';
import './TransactionModal.css';

const EXPENSE_CATEGORIES = ['Food', 'Shopping', 'Entertainment', 'Subscription', 'Rent', 'Utilities', 'Transport', 'Other'];
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investments', 'Gift', 'Other'];

const TransactionModal = ({ type: initialType = 'expense', onClose }) => {
  const { addTransaction, settings } = useApp();
  const [type, setType] = useState(initialType); // 'income' or 'expense'
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(type === 'expense' ? 'Food' : 'Salary');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Switch default categories when type changes
  const handleTypeChange = (newType) => {
    setType(newType);
    setCategory(newType === 'expense' ? 'Food' : 'Salary');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      alert('Пожалуйста, введите корректную сумму');
      return;
    }

    setSubmitting(true);
    try {
      await addTransaction({
        type,
        amount: parseFloat(amount),
        category,
        date,
        description: description.trim() || category
      });
      onClose();
    } catch (error) {
      console.error(error);
      alert('Ошибка при добавлении операции');
    } finally {
      setSubmitting(false);
    }
  };

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="modal-sheet animate-slide-up" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h3>Добавить операцию</h3>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-form">
          {/* Toggle Type */}
          <div className="type-toggle-container">
            <button 
              type="button"
              className={`type-toggle-btn income ${type === 'income' ? 'active' : ''}`}
              onClick={() => handleTypeChange('income')}
            >
              Доход
            </button>
            <button 
              type="button"
              className={`type-toggle-btn expense ${type === 'expense' ? 'active' : ''}`}
              onClick={() => handleTypeChange('expense')}
            >
              Расход
            </button>
          </div>

          {/* Amount Input */}
          <div className="amount-input-box">
            <span className="currency-prefix">{settings.currency}</span>
            <input 
              type="number" 
              step="0.01" 
              min="0.01"
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              placeholder="0.00"
              required 
              autoFocus
              className="amount-field"
            />
          </div>

          {/* Category Selector */}
          <div className="form-group">
            <label className="form-label">Категория</label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              className="form-select"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="form-group">
            <label className="form-label">Дата</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              required
              className="form-input"
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Описание</label>
            <input 
              type="text" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Название магазина, подписка или комментарий"
              className="form-input"
            />
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button 
              type="button" 
              className="form-btn-secondary" 
              onClick={onClose}
              disabled={submitting}
            >
              Отмена
            </button>
            <button 
              type="submit" 
              className={`form-btn-primary ${type === 'income' ? 'income-theme' : 'expense-theme'}`}
              disabled={submitting}
            >
              {submitting ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;
