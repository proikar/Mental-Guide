import React, { useState, useRef, useEffect, useCallback } from 'react';
import './Chat.css';
import { t } from '../utils/i18n';
import { chatApi } from '../utils/api';

function Chat({ user, settings, sidebarOpen }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    let themeToApply = settings.theme;
    if (themeToApply === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      themeToApply = prefersDark ? 'dark' : 'light';
    }
    document.body.setAttribute('data-theme', themeToApply);
  }, [settings.theme]);

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { 
      id: Date.now(), 
      role: 'user', 
      content: input,
      timestamp: new Date().toLocaleTimeString() 
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatApi.sendMessage(input);
      const botMessage = { 
        id: Date.now() + 1, 
        role: 'bot', 
        content: response.reply || t('failedToProcessResponse', settings.language),
        timestamp: new Date().toLocaleTimeString() 
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error(t('apiRequestError', settings.language), error);
      setMessages(prev => [...prev, {
        id: Date.now() + 2,
        role: 'bot',
        content: t('connectionError', settings.language),
        isError: true,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [input, isLoading, settings.language]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !isLoading && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage, isLoading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await chatApi.getHistory();
        const formatted = history.flatMap((entry, i) => [
          {
            role: 'user',
            content: entry.input,
            id: `user-${i}-${entry.created_at}`,
            timestamp: new Date(entry.created_at).toLocaleTimeString()
          },
          {
            role: 'bot',
            content: entry.response,
            id: `bot-${i}-${entry.created_at}`,
            timestamp: new Date(entry.created_at).toLocaleTimeString()
          }
        ]);
        setMessages(formatted);
      } catch (err) {
        console.error(t('historyLoadError', settings.language), err);
        setMessages(prev => [...prev, {
          id: 'error-msg',
          role: 'bot',
          content: t('failedToLoadHistory', settings.language),
          isError: true,
          timestamp: new Date().toLocaleTimeString()
        }]);
      }
    };

    fetchHistory();
  }, [settings.language]);

  const renderMessage = (msg) => {
    const messageClasses = [
      'message', 
      msg.role === 'user' ? 'user-message' : 'bot-message',
      msg.isError ? 'error-message' : ''
    ].join(' ');

    const cleanContent = msg.content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^\*\s+/gm, '')
      .replace(/\n/g, '<br/>');

    return (
      <div key={msg.id} className={messageClasses} role="article" aria-live="polite">
        <div className="message-content" dangerouslySetInnerHTML={{ __html: cleanContent }} />
        <div className="message-timestamp" aria-label={`${t('messageTime', settings.language)}: ${msg.timestamp}`}>
          {msg.timestamp}
        </div>
      </div>
    );
  };

  return (
    <div className="chat-container" role="main">
      <main className={`chat-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <h1 tabIndex={-1}>Mental Guide AI</h1>
        
        <div className="chat-messages" aria-live="polite" aria-relevant="additions">
          {messages.length > 0 ? (
            messages.map(renderMessage)
          ) : (
            <div className="welcome-message" aria-live="polite">
              <p>{t('welcome', settings.language)}</p>
              <p>{t('prompt', settings.language)}</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          <textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('inputPlaceholder', settings.language)}
            ref={inputRef}
            disabled={isLoading}
            maxLength={500}
            aria-label={t('messageInputLabel', settings.language)}
            spellCheck="true"
            className="chat-input"
          />
          <button 
            onClick={handleSendMessage} 
            disabled={isLoading || !input.trim()}
            aria-label={t('sendMessage', settings.language)}
            title={t('sendMessage', settings.language)}
            className="send-button"
          >
            {isLoading ? (
              <span className="loading-dots" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span>
            ) : t('send', settings.language)}
          </button>
        </div>
      </main>
    </div>
  );
}

export default React.memo(Chat);
