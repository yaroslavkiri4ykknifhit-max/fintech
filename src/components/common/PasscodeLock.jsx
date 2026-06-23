// src/components/common/PasscodeLock.jsx
import React, { useState, useEffect } from 'react';
import { Shield, Delete, RefreshCw } from 'lucide-react';
import './PasscodeLock.css';

const PasscodeLock = ({ onUnlock }) => {
  const envPin = import.meta.env.VITE_APP_PASSCODE;
  
  const [pin, setPin] = useState('');
  const [isSetup, setIsSetup] = useState(false);
  const [setupStep, setSetupStep] = useState(1); // 1 = enter new, 2 = confirm new
  const [tempPin, setTempPin] = useState('');
  const [errorShake, setErrorShake] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Введите PIN-код');

  // Check if PIN has already been set in LocalStorage
  useEffect(() => {
    const savedPin = localStorage.getItem('fintrack_pin');
    if (!envPin && !savedPin) {
      setIsSetup(true);
      setStatusMessage('Создайте 4-значный PIN-код');
    } else if (envPin) {
      setStatusMessage('Введите PIN-код');
    }
  }, [envPin]);

  const handleKeyPress = (num) => {
    if (pin.length >= 4) return;
    const newPin = pin + num;
    setPin(newPin);

    // If we reached 4 digits, validate
    if (newPin.length === 4) {
      setTimeout(() => {
        validatePin(newPin);
      }, 200);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const validatePin = (enteredPin) => {
    const savedPin = localStorage.getItem('fintrack_pin');
    const correctPin = envPin || savedPin;

    if (isSetup) {
      if (setupStep === 1) {
        // Step 1: Save first entry
        setTempPin(enteredPin);
        setPin('');
        setSetupStep(2);
        setStatusMessage('Подтвердите новый PIN-код');
      } else {
        // Step 2: Confirm entry
        if (enteredPin === tempPin) {
          localStorage.setItem('fintrack_pin', enteredPin);
          setIsSetup(false);
          onUnlock();
        } else {
          // Reset setup on confirm mismatch
          triggerError('PIN-коды не совпадают. Попробуйте снова.');
          setSetupStep(1);
          setTempPin('');
          setStatusMessage('Создайте 4-значный PIN-код');
        }
      }
    } else {
      // Validate against correct PIN
      if (enteredPin === correctPin) {
        onUnlock();
      } else {
        triggerError('Неверный PIN-код');
      }
    }
  };

  const triggerError = (msg) => {
    setStatusMessage(msg);
    setErrorShake(true);
    setPin('');
    // Vibration feedback for mobile devices
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
    setTimeout(() => {
      setErrorShake(false);
    }, 500);
  };

  return (
    <div className="passcode-backdrop">
      <div className="passcode-container">
        {/* App Title & Lock Icon */}
        <div className="passcode-header">
          <div className="lock-icon-box">
            <Shield size={36} className="lock-icon" />
          </div>
          <h2>FinTrack</h2>
          <p className={`status-text ${errorShake ? 'error' : ''}`}>{statusMessage}</p>
        </div>

        {/* 4 dots display */}
        <div className={`dots-container ${errorShake ? 'shake' : ''}`}>
          {[0, 1, 2, 3].map((index) => (
            <div 
              key={index} 
              className={`dot ${pin.length > index ? 'filled' : ''}`}
            ></div>
          ))}
        </div>

        {/* Keyboard keypad grid */}
        <div className="keypad-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button 
              key={num} 
              type="button" 
              className="keypad-btn"
              onClick={() => handleKeyPress(num.toString())}
            >
              {num}
            </button>
          ))}
          
          <button 
            type="button" 
            className="keypad-btn-secondary"
            onClick={() => setPin('')}
            aria-label="Clear PIN"
          >
            Clear
          </button>
          
          <button 
            type="button" 
            className="keypad-btn"
            onClick={() => handleKeyPress('0')}
          >
            0
          </button>
          
          <button 
            type="button" 
            className="keypad-btn-secondary delete-key"
            onClick={handleDelete}
            aria-label="Delete last digit"
          >
            <Delete size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasscodeLock;
