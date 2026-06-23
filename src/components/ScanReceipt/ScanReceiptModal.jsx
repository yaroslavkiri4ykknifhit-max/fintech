// src/components/ScanReceipt/ScanReceiptModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { X, UploadCloud, Camera, Check, RefreshCw, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { scanReceipt, fileToBase64 } from '../../services/groqApi';
import './ScanReceiptModal.css';

const ScanReceiptModal = ({ onClose }) => {
  const { addTransaction } = useApp();
  const [mode, setMode] = useState('upload'); // 'upload' | 'camera' | 'scanning' | 'review' | 'error'
  const [imagePreview, setImagePreview] = useState(null);
  const [scannedData, setScannedData] = useState({ amount: '', merchant: '', date: '', category: 'Food' });
  const [isMock, setIsMock] = useState(false);
  const [scanError, setScanError] = useState(null);
  
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Clean up camera stream on component unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Bind the camera stream to the video tag when camera mode is entered
  useEffect(() => {
    if (mode === 'camera' && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [mode]);

  // Request camera stream and start custom camera mode
  const startCamera = async () => {
    setScanError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Prefer rear camera on mobile
      });
      streamRef.current = stream;
      setMode('camera');
    } catch (err) {
      console.error('Camera Access Error:', err);
      setScanError('Не удалось получить доступ к камере. Пожалуйста, проверьте разрешения устройства или выберите загрузку файла.');
      setMode('error');
    }
  };

  // Close live camera feed
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Draw current video frame to canvas and capture base64
  const capturePhoto = () => {
    if (!videoRef.current) return;
    
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const base64 = canvas.toDataURL('image/jpeg');
      stopCamera();
      setImagePreview(base64);
      setMode('scanning');
      runScan(base64);
    } catch (err) {
      console.error('Capture Error:', err);
      setScanError('Не удалось захватить снимок с камеры.');
      setMode('error');
      stopCamera();
    }
  };

  // Call Groq Vision API
  const runScan = async (base64) => {
    try {
      const result = await scanReceipt(base64);
      if (result.success) {
        setScannedData({
          amount: result.data.amount.toFixed(2),
          merchant: result.data.merchant,
          date: result.data.date,
          category: result.data.category || 'Food'
        });
        setIsMock(result.mock || false);
        setMode('review');
      } else {
        throw new Error('API failed to extract data');
      }
    } catch (err) {
      console.error(err);
      setScanError(err.message || 'Ошибка распознавания чека.');
      setMode('error');
    }
  };

  // Handle file select uploads
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setMode('scanning');
      const base64 = await fileToBase64(file);
      setImagePreview(base64);
      await runScan(base64);
    } catch (err) {
      console.error(err);
      setScanError(err.message || 'Ошибка чтения файла.');
      setMode('error');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleConfirm = (e) => {
    e.preventDefault();
    const { amount, merchant, date, category } = scannedData;

    if (!amount || parseFloat(amount) <= 0) {
      alert('Пожалуйста, введите корректную сумму.');
      return;
    }

    addTransaction({
      type: 'expense',
      amount: parseFloat(amount),
      category: category,
      date: date || new Date().toISOString().split('T')[0],
      description: merchant || 'Сканированный чек'
    });

    onClose();
  };

  const handleFieldChange = (field, val) => {
    setScannedData(prev => ({ ...prev, [field]: val }));
  };

  const handleCancelCamera = () => {
    stopCamera();
    setMode('upload');
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="modal-sheet scan-sheet animate-slide-up" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h3>Сканировать чек</h3>
          <button className="close-btn" onClick={() => { stopCamera(); onClose(); }} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* State 1: Upload UI Selection */}
        {mode === 'upload' && (
          <div className="scan-upload-area">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              style={{ display: 'none' }}
            />
            
            <div className="actions-card-container">
              {/* Camera Trigger */}
              <button type="button" className="action-card-btn" onClick={startCamera}>
                <div className="action-card-icon-box camera-accent">
                  <Camera size={32} />
                </div>
                <h4>Снять на камеру</h4>
                <p>Сфотографируйте чек встроенной камерой</p>
              </button>

              {/* Upload Trigger */}
              <button type="button" className="action-card-btn" onClick={triggerFileInput}>
                <div className="action-card-icon-box file-accent">
                  <UploadCloud size={32} />
                </div>
                <h4>Выбрать файл</h4>
                <p>Загрузите фото чека из галереи устройства</p>
              </button>
            </div>
            
            <div className="api-notice">
              <span>Приложение распознает текст с помощью модели Llama Vision на Groq API. В случае отсутствия ключей включится интеллектуальная симуляция.</span>
            </div>
          </div>
        )}

        {/* State 1.5: Live In-App Camera View */}
        {mode === 'camera' && (
          <div className="in-app-camera-container">
            <div className="camera-viewport">
              <video ref={videoRef} autoPlay playsInline muted className="camera-video-stream"></video>
              {/* Overlay camera boundaries layout */}
              <div className="camera-frame-guide">
                <div className="guide-corner top-left"></div>
                <div className="guide-corner top-right"></div>
                <div className="guide-corner bottom-left"></div>
                <div className="guide-corner bottom-right"></div>
                <span className="guide-text">Поместите чек в рамку</span>
              </div>
            </div>
            
            <div className="camera-controls">
              <button type="button" className="camera-cancel-btn" onClick={handleCancelCamera}>
                Отмена
              </button>
              
              {/* Large circular shutter button */}
              <button type="button" className="camera-shutter-btn" onClick={capturePhoto} aria-label="Take picture">
                <div className="shutter-inner-circle"></div>
              </button>
              
              <div style={{ width: '60px' }}></div> {/* Spacer to align elements */}
            </div>
          </div>
        )}

        {/* State 2: Scanning Animation */}
        {mode === 'scanning' && (
          <div className="scanning-container">
            <div className="receipt-preview-box">
              {imagePreview && (
                <img src={imagePreview} alt="Receipt preview" className="receipt-image-blur" />
              )}
              <div className="laser-line"></div>
            </div>
            <div className="scanning-status">
              <RefreshCw size={24} className="spin-loader" />
              <h4>Сканирование чека...</h4>
              <p>Groq API распознает чек в фоновом режиме</p>
            </div>
          </div>
        )}

        {/* State 3: Review Results Form */}
        {mode === 'review' && (
          <form onSubmit={handleConfirm} className="review-form">
            {isMock && (
              <div className="mock-badge-alert">
                ✨ Режим демонстрации (данные сгенерированы автоматически)
              </div>
            )}
            
            <div className="scanned-visual-preview">
              <img src={imagePreview} alt="Scanned Receipt" />
              <div className="visual-dimmer">Успешно распознано!</div>
            </div>

            <div className="form-group">
              <label className="form-label">Сумма чека</label>
              <div className="amount-input-box font-large">
                <span className="currency-prefix">$</span>
                <input 
                  type="number" 
                  step="0.01" 
                  value={scannedData.amount}
                  onChange={(e) => handleFieldChange('amount', e.target.value)}
                  className="amount-field"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Магазин / Продавец</label>
              <input 
                type="text" 
                value={scannedData.merchant}
                onChange={(e) => handleFieldChange('merchant', e.target.value)}
                className="form-input"
                placeholder="Название магазина"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Категория</label>
              <select 
                value={scannedData.category}
                onChange={(e) => handleFieldChange('category', e.target.value)}
                className="form-select"
              >
                {['Food', 'Shopping', 'Entertainment', 'Subscription', 'Utilities', 'Other'].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Дата покупки</label>
              <input 
                type="date" 
                value={scannedData.date}
                onChange={(e) => handleFieldChange('date', e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="form-actions">
              <button type="button" className="form-btn-secondary" onClick={() => setMode('upload')}>
                Заново
              </button>
              <button type="submit" className="form-btn-primary expense-theme">
                <Check size={16} />
                <span>Подтвердить</span>
              </button>
            </div>
          </form>
        )}

        {/* State 4: Error Screen */}
        {mode === 'error' && (
          <div className="scan-error-container">
            <AlertTriangle size={48} className="error-icon" />
            <h4>Ошибка сканирования</h4>
            <p className="error-text">{scanError}</p>
            
            <div className="error-actions">
              <button className="error-btn-retry" onClick={() => setMode('upload')}>
                Попробовать еще раз
              </button>
              <button className="error-btn-manual" onClick={onClose}>
                Ввести вручную
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanReceiptModal;
