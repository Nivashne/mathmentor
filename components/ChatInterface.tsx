import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage } from '../types';
import { solveMathProblem } from '../services/geminiService';
import Message from './Message';
import Spinner from './Spinner';
import Icon from './Icon';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  useEffect(() => {
    // Add initial welcome message
    setMessages([
        {
            id: 'initial-1',
            role: 'model',
            content: "Hello! I'm Math Mentor AI. How can I help you with your math problems today?"
        },
        {
            id: 'initial-2',
            role: 'model',
            content: "You can type a question or upload an image of a problem."
        }
    ]);
  }, []);

  const handleSendMessage = useCallback(async () => {
    if ((!inputValue.trim() && !imageFile) || isLoading) return;

    const userMessageContent = (
      <div className="flex flex-col gap-2">
        {imageFile && (
          <img
            src={URL.createObjectURL(imageFile)}
            alt="Math problem"
            className="rounded-lg max-w-xs max-h-48 object-contain self-end"
          />
        )}
        {inputValue && <p>{inputValue}</p>}
      </div>
    );

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessageContent,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    const currentInputValue = inputValue;
    const currentImageFile = imageFile;
    setInputValue('');
    setImageFile(null);
    if(fileInputRef.current) fileInputRef.current.value = "";


    try {
      const responseText = await solveMathProblem(currentInputValue, currentImageFile ?? undefined);
      const modelMessage: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: responseText,
      };
      setMessages((prev) => [...prev, modelMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'model',
        content: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, imageFile, isLoading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };
  
  const removeImage = () => {
      setImageFile(null);
      // FIX: Corrected a typo in the variable name. It should be fileInputRef, not fileInput.
      if(fileInputRef.current) fileInputRef.current.value = "";
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg) => (
          <Message key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <Message
            key="loading"
            message={{ id: 'loading', role: 'model', content: <Spinner /> }}
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 md:p-6 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto">
            {imageFile && (
                <div className="mb-3 p-2 bg-slate-100 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src={URL.createObjectURL(imageFile)} alt="preview" className="w-12 h-12 object-cover rounded"/>
                        <span className="text-sm text-slate-600 truncate">{imageFile.name}</span>
                    </div>
                    <button onClick={removeImage} className="p-1 text-slate-500 hover:text-red-500 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500">
                        <Icon name="close" className="w-5 h-5"/>
                    </button>
                </div>
            )}
            <div className="relative flex items-center p-1 border border-slate-300 rounded-xl bg-white focus-within:ring-2 focus-within:ring-indigo-500 shadow-sm">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-slate-500 hover:text-indigo-500 transition-colors"
                    aria-label="Attach file"
                >
                    <Icon name="paperclip" />
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                />
                <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your math problem here..."
                    className="flex-1 w-full px-2 py-1 bg-transparent resize-none focus:outline-none text-slate-800 placeholder-slate-400"
                    rows={1}
                />
                <button
                    onClick={handleSendMessage}
                    disabled={(!inputValue.trim() && !imageFile) || isLoading}
                    className="p-2 mr-1 rounded-lg bg-indigo-500 text-white disabled:bg-indigo-300 disabled:cursor-not-allowed hover:bg-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    aria-label="Send message"
                >
                    <Icon name="send" />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;