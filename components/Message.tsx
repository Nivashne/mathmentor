import React from 'react';
import type { ChatMessage } from '../types';
import Icon from './Icon';

interface MessageProps {
  message: ChatMessage;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  const bubbleClasses = isUser
    ? 'bg-gradient-to-br from-indigo-500 to-blue-500 text-white rounded-br-none'
    : 'bg-white text-slate-700 rounded-bl-none border border-slate-200';
  
  const containerClasses = isUser ? 'justify-end' : 'justify-start';

  const Avatar: React.FC<{ role: 'user' | 'model' }> = ({ role }) => {
    if (role === 'user') {
      return (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
            <Icon name="user" className="w-5 h-5 text-slate-500" />
        </div>
      );
    }
    return (
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
          <Icon name="sparkles" className="w-5 h-5 text-indigo-500" />
      </div>
    );
  };

  return (
    <div className={`flex items-end gap-3 ${containerClasses}`}>
      {!isUser && <Avatar role="model" />}
      <div className={`max-w-md md:max-w-2xl px-4 py-3 rounded-2xl shadow-sm ${bubbleClasses}`}>
        <div className="prose prose-sm prose-slate max-w-none text-inherit whitespace-pre-wrap break-words">
            {message.content}
        </div>
      </div>
       {isUser && <Avatar role="user" />}
    </div>
  );
};

export default Message;