// src/components/common/Layout.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BarChart2, Wallet, Settings } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import TransactionModal from '../AddTransaction/TransactionModal';
import ScanReceiptModal from '../ScanReceipt/ScanReceiptModal';
import './Layout.css';

const Layout = ({ children }) => {
  const { activeModal, setActiveModal } = useApp();

  return (
    <div className="device-container">
      {/* Mobile Shell Mockup */}
      <div className="device-screen">
        {/* Main Content Area */}
        <div className="device-content">
          {children}
        </div>

        {/* Bottom Curved Tab Bar Navigation */}
        <nav className="tab-bar">
          <NavLink 
            to="/" 
            className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}
            end
          >
            <Home size={22} strokeWidth={2.2} />
          </NavLink>
          
          <NavLink 
            to="/stats" 
            className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}
          >
            <BarChart2 size={22} strokeWidth={2.2} />
          </NavLink>
          
          <NavLink 
            to="/transactions" 
            className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}
          >
            <Wallet size={22} strokeWidth={2.2} />
          </NavLink>
          
          <NavLink 
            to="/settings" 
            className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}
          >
            <Settings size={22} strokeWidth={2.2} />
          </NavLink>
        </nav>

        {/* Global Modals Rendered at root level of the device frame (on top of bottom tab bar) */}
        {activeModal === 'scan' && (
          <ScanReceiptModal onClose={() => setActiveModal(null)} />
        )}
        {(activeModal === 'income' || activeModal === 'expense') && (
          <TransactionModal type={activeModal} onClose={() => setActiveModal(null)} />
        )}
      </div>
    </div>
  );
};

export default Layout;
