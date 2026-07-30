'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Loader2, Mic, Square } from 'lucide-react';
import { copilotApi } from '@/lib/api';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export default function CopilotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'assistant', content: 'Hi there! I am the Anchor Pro Copilot. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Audio state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64AudioMessage = reader.result as string;
          await sendAudioToCopilot(base64AudioMessage, 'audio/webm');
        };
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioToCopilot = async (base64Audio: string, mimeType: string) => {
    if (isLoading) return;
    setIsLoading(true);
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: '🎤 (Audio message)' }]);

    try {
      const res = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '', audioData: base64Audio, audioMimeType: mimeType })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error processing audio');
      
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: data.reply || 'I processed that.' }]);
      
      if (data.action === 'navigate' && data.route) {
        window.location.href = data.route;
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendText = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input.trim();
    setInput('');
    const newMsg: Message = { id: Date.now().toString(), role: 'user', content: userMsg };
    setMessages(prev => [...prev, newMsg]);
    setIsLoading(true);

    try {
      const res = await copilotApi.chat(userMsg);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: res.reply || 'I processed that.' }]);
      
      if (res.action === 'navigate' && res.route) {
        window.location.href = res.route;
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          background: 'var(--accent-blue)',
          color: '#fff',
          border: 'none',
          boxShadow: '0 8px 24px rgba(37,99,235,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 9999,
          transition: 'transform 0.2s',
          transform: isOpen ? 'scale(0)' : 'scale(1)',
        }}
      >
        <Bot size={28} />
      </button>

      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 360,
          height: 520,
          maxWidth: 'calc(100vw - 48px)',
          maxHeight: 'calc(100vh - 48px)',
          background: 'var(--bg-card)',
          borderRadius: 16,
          boxShadow: '0 12px 48px rgba(0,0,0,0.5)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10000,
          transition: 'opacity 0.2s, transform 0.2s, pointer-events 0s',
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
          pointerEvents: isOpen ? 'auto' : 'none',
          overflow: 'hidden'
        }}
      >
        <div style={{
          padding: '16px 20px',
          background: 'var(--bg-app)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'var(--accent-blue-dim)', color: 'var(--accent-blue)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Bot size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>Anchor Copilot</div>
              <div style={{ fontSize: 12, color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="status-dot green pulse" style={{ width: 6, height: 6 }} /> Online
              </div>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.map(msg => (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '85%',
                padding: '10px 14px',
                borderRadius: 14,
                borderBottomRightRadius: msg.role === 'user' ? 2 : 14,
                borderBottomLeftRadius: msg.role === 'assistant' ? 2 : 14,
                background: msg.role === 'user' ? 'var(--accent-blue)' : 'var(--bg-hover)',
                color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                fontSize: 14,
                lineHeight: 1.5,
              }}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
              <Loader2 size={14} className="spin" />
              <span style={{ fontSize: 12 }}>Copilot is thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ padding: 16, borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-app)' }}>
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendText(); }}
            style={{ display: 'flex', gap: 8, alignItems: 'center' }}
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask me anything..."
              style={{
                flex: 1,
                background: 'var(--bg-input)',
                border: '1px solid var(--border-default)',
                borderRadius: 20,
                padding: '10px 16px',
                color: 'var(--text-primary)',
                fontSize: 14,
                outline: 'none'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent-blue)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
              disabled={isRecording}
            />
            {isRecording ? (
              <button
                type="button"
                onClick={stopRecording}
                style={{
                  width: 40, height: 40, borderRadius: 20,
                  background: 'var(--accent-red)', color: '#fff',
                  border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  animation: 'pulse 1.5s infinite'
                }}
              >
                <Square size={16} fill="currentColor" />
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                disabled={isLoading}
                style={{
                  width: 40, height: 40, borderRadius: 20,
                  background: 'var(--bg-hover)', color: 'var(--text-secondary)',
                  border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  transition: 'background 0.2s, color 0.2s'
                }}
              >
                <Mic size={18} />
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading || !input.trim() || isRecording}
              style={{
                width: 40, height: 40, borderRadius: 20,
                background: input.trim() && !isLoading && !isRecording ? 'var(--accent-blue)' : 'var(--bg-hover)',
                color: input.trim() && !isLoading && !isRecording ? '#fff' : 'var(--text-muted)',
                border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: input.trim() && !isLoading && !isRecording ? 'pointer' : 'default',
                transition: 'background 0.2s, color 0.2s'
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
