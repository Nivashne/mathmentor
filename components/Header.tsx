import React from 'react';
import Icon from './Icon';

interface HeaderProps {
  onAdminClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAdminClick }) => {
  return (
    <header className="flex items-center justify-between p-4 bg-white border-b border-slate-200">
      <div className="flex items-center space-x-3 text-2xl font-bold text-slate-800">
        <Icon name="sparkles" className="text-indigo-500"/>
        <h1>Math Mentor AI</h1>
      </div>
      
      {onAdminClick && (
        <button
          onClick={onAdminClick}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Admin
        </button>
      )}
    </header>
  );
};

export default Header;