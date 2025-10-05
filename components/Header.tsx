import React from 'react';
import Icon from './Icon';

const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-center p-4 bg-white border-b border-slate-200">
      <div className="flex items-center space-x-3 text-2xl font-bold text-slate-800">
        <Icon name="sparkles" className="text-indigo-500"/>
        <h1>Math Mentor AI</h1>
      </div>
    </header>
  );
};

export default Header;