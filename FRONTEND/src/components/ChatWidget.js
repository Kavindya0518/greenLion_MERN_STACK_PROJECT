import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_BASE || ((typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost') ? 'http://localhost:5000' : '');

export default function ChatWidget({ defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! Ask me about products, pricing, shipping, or returns.' }
  ]);
  const [input, setInput] = useState('');
  const location = useLocation();

  // Hide on admin/supplier/checkout pages
  const path = location.pathname || '';
  if (path.startsWith('/admin') || path.startsWith('/supplier') || path.startsWith('/checkout')) return null;

  // Try to extract simple product context from URL or window (optional)
  const getProductContext = () => {
    // If you have a ProductDetails page, pass richer context via props or global state in future.
    const ctx = {};
    try {
      // Example: if your ProductDetails stores data globally, wire it here.
      const el = document.querySelector('[data-product-name]');
      if (el?.dataset?.productName) ctx.productName = el.dataset.productName;
      const priceEl = document.querySelector('[data-product-price]');
      if (priceEl?.dataset?.productPrice) ctx.price = Number(priceEl.dataset.productPrice);
    } catch (_) {}
    return ctx;
  };

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/chat/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: text, context: getProductContext() })
      });
      const data = await res.json();
      const answer = data?.answer || 'Sorry, I could not process that right now.';
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Network error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 1000 }}>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open chat"
          title="Chat"
          style={{
            background: '#1E7F3B', color: '#fff', border: 'none', borderRadius: 9999,
            width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(0,0,0,0.15)', cursor: 'pointer'
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
            <path d="M8 9h8M8 13h5" />
          </svg>
        </button>
      )}
      {open && (
        <div style={{ width: 320, height: 420, background: '#fff', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ background: '#1E7F3B', color: '#fff', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
              </svg>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                <strong>Green Lion</strong>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#E6F6EA' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                  Online
                </span>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat" title="Close" style={{ background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer', padding: 4 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div style={{ flex: 1, padding: 10, overflowY: 'auto', background: '#f9fafb' }}>
            {messages.map((m, idx) => (
              <div key={idx} style={{ marginBottom: 8, display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%',
                  padding: '8px 10px',
                  borderRadius: 10,
                  background: m.role === 'user' ? '#DCFCE7' : '#fff',
                  border: '1px solid #e5e7eb',
                  color: '#111827'
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && <div style={{ fontSize: 12, color: '#6B7280' }}>Assistant is typing…</div>}
          </div>
          <div style={{ padding: 8, borderTop: '1px solid #e5e7eb', display: 'flex', gap: 6 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
              placeholder="Type a message..."
              style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #cbd5e1' }}
            />
            <button onClick={send} disabled={loading} style={{ background: '#1E7F3B', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px' }}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}
