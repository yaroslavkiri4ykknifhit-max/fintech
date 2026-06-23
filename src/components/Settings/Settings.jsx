// src/components/Settings/Settings.jsx
import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Save, RotateCcw, HelpCircle, Key, Server, Database } from 'lucide-react';
import './Settings.css';

const Settings = () => {
  const { settings, refreshData } = useApp();
  
  // State for overrides (loaded from localStorage if exists, else empty)
  const [currency, setCurrency] = useState(localStorage.getItem('override_currency') || settings.currency);
  const [balance, setBalance] = useState(
    localStorage.getItem('override_balance') !== null 
      ? localStorage.getItem('override_balance') 
      : settings.currentBalance
  );
  
  const [groqKey, setGroqKey] = useState(localStorage.getItem('override_groq_api_key') || '');
  const [groqModel, setGroqModel] = useState(localStorage.getItem('override_groq_model') || 'llama-4-scout-17b-16e-instruct');
  
  const [scriptUrl, setScriptUrl] = useState(localStorage.getItem('override_google_apps_script_url') || '');
  const [sheetId, setSheetId] = useState(localStorage.getItem('override_google_sheets_spreadsheet_id') || '');
  const [apiKey, setApiKey] = useState(localStorage.getItem('override_google_sheets_api_key') || '');

  const [savedMsg, setSavedMsg] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    
    // Save settings overrides
    localStorage.setItem('override_currency', currency);
    localStorage.setItem('override_balance', parseFloat(balance) || 0);
    
    // Save API overrides (only if user inputted them, otherwise remove to let .env take place)
    if (groqKey) localStorage.setItem('override_groq_api_key', groqKey);
    else localStorage.removeItem('override_groq_api_key');

    localStorage.setItem('override_groq_model', groqModel);

    if (scriptUrl) localStorage.setItem('override_google_apps_script_url', scriptUrl);
    else localStorage.removeItem('override_google_apps_script_url');

    if (sheetId) localStorage.setItem('override_google_sheets_spreadsheet_id', sheetId);
    else localStorage.removeItem('override_google_sheets_spreadsheet_id');

    if (apiKey) localStorage.setItem('override_google_sheets_api_key', apiKey);
    else localStorage.removeItem('override_google_sheets_api_key');

    // Update actual active settings in localStorage tracker_settings
    const currentTrackerSettings = JSON.parse(localStorage.getItem('tracker_settings') || '{}');
    const newSettings = {
      ...currentTrackerSettings,
      currentBalance: parseFloat(balance) || 0,
      currency: currency
    };
    localStorage.setItem('tracker_settings', JSON.stringify(newSettings));

    setSavedMsg('Настройки сохранены! Перезагрузка...');
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  const handleReset = () => {
    if (window.confirm('Вы действительно хотите сбросить все данные и вернуть настройки по умолчанию? Это очистит историю операций.')) {
      localStorage.clear();
      setSavedMsg('Данные сброшены. Перезапуск...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <div className="settings-view animate-fade-in">
      <header className="settings-header">
        <h2 className="header-title-left">Настройки</h2>
      </header>

      {savedMsg && <div className="toast-message">{savedMsg}</div>}

      <form onSubmit={handleSave} className="settings-form">
        {/* Section 1: Core Profile Settings */}
        <div className="settings-section-card">
          <h4 className="settings-sec-title">
            <Database size={16} />
            <span>Основные настройки</span>
          </h4>
          
          <div className="form-group">
            <label className="form-label">Символ валюты</label>
            <input 
              type="text" 
              maxLength="3" 
              value={currency} 
              onChange={(e) => setCurrency(e.target.value)}
              className="form-input"
              placeholder="$"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Текущий Баланс</label>
            <input 
              type="number" 
              step="0.01" 
              value={balance} 
              onChange={(e) => setBalance(e.target.value)}
              className="form-input"
              required
            />
          </div>
        </div>

        {/* Section 2: Groq Vision Credentials */}
        <div className="settings-section-card">
          <h4 className="settings-sec-title">
            <Key size={16} />
            <span>Интеграция с Groq API</span>
          </h4>
          
          <div className="form-group">
            <label className="form-label">Groq API Key</label>
            <input 
              type="password" 
              value={groqKey} 
              onChange={(e) => setGroqKey(e.target.value)}
              className="form-input"
              placeholder={import.meta.env.VITE_GROQ_API_KEY ? '•••••••• (Задан в .env)' : 'Введите API ключ'}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Модель Vision</label>
            <input 
              type="text" 
              value={groqModel} 
              onChange={(e) => setGroqModel(e.target.value)}
              className="form-input"
              placeholder="llama-4-scout-17b-16e-instruct"
            />
          </div>
        </div>

        {/* Section 3: Google Sheets Sync Settings */}
        <div className="settings-section-card">
          <h4 className="settings-sec-title">
            <Server size={16} />
            <span>База данных Google Sheets</span>
          </h4>

          <div className="form-group">
            <label className="form-label">Google Apps Script URL (Запись и Чтение)</label>
            <input 
              type="url" 
              value={scriptUrl} 
              onChange={(e) => setScriptUrl(e.target.value)}
              className="form-input"
              placeholder={import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL ? 'https://script.google.com/...' : 'Ссылка на Web App'}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Spreadsheet ID (Только чтение API)</label>
            <input 
              type="text" 
              value={sheetId} 
              onChange={(e) => setSheetId(e.target.value)}
              className="form-input"
              placeholder={import.meta.env.VITE_GOOGLE_SHEETS_SPREADSHEET_ID ? 'id_вашей_таблицы' : 'Укажите ID таблицы'}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Google Sheets API Key (Только чтение API)</label>
            <input 
              type="password" 
              value={apiKey} 
              onChange={(e) => setApiKey(e.target.value)}
              className="form-input"
              placeholder={import.meta.env.VITE_GOOGLE_SHEETS_API_KEY ? '•••••••• (Задан в .env)' : 'Ключ Google Cloud API'}
            />
          </div>

          <button 
            type="button" 
            className="guide-toggle-btn"
            onClick={() => setShowGuide(!showGuide)}
          >
            <HelpCircle size={14} />
            <span>Как настроить Google Sheets?</span>
          </button>

          {showGuide && (
            <div className="guide-content-box">
              <h5>Инструкция по настройке Apps Script:</h5>
              <ol>
                <li>Создайте Google Таблицу и переименуйте первый лист в <b>"transactions"</b>, а второй в <b>"settings"</b>.</li>
                <li>В первом листе добавьте заголовки: <code>id, type, amount, category, date, description, createdAt</code>.</li>
                <li>Перейдите в меню: <i>Расширения &rarr; Apps Script</i>.</li>
                <li>Вставьте код скрипта (найдете его в файле README.md проекта).</li>
                <li>Нажмите <b>"Начать развертывание" (Deploy)</b> &rarr; "Новое развертывание". Выберите тип "Веб-приложение".</li>
                <li>Установите доступ: <b>"Кто угодно" (Anyone)</b>. Скопируйте ссылку на веб-приложение и вставьте её выше.</li>
              </ol>
            </div>
          )}
        </div>

        {/* Actions Group */}
        <div className="settings-actions">
          <button type="submit" className="save-settings-btn">
            <Save size={16} />
            <span>Сохранить всё</span>
          </button>
          
          <button type="button" onClick={handleReset} className="reset-settings-btn">
            <RotateCcw size={16} />
            <span>Очистить кэш</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
