'use client';

import { Bell, Search, ChevronDown } from 'lucide-react';

interface TopbarProps {
  title: string;
  breadcrumb?: string;
}

export default function Topbar({ title, breadcrumb }: TopbarProps) {
  return (
    <div className="topbar">
      <div>
        {breadcrumb && <div className="topbar-breadcrumb">{breadcrumb}</div>}
        <div className="topbar-title">{title}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{
            position: 'absolute', left: '10px', top: '50%',
            transform: 'translateY(-50%)', color: 'var(--text-muted)'
          }} />
          <input
            className="search-input"
            placeholder="Search Job #, Asset..."
            style={{ paddingLeft: '30px', width: '180px' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') alert(`Searching for "${e.currentTarget.value}" across Asset Registry and Job Cards...`);
            }}
          />
        </div>

        {/* Notifications */}
        <button 
          className="btn btn-ghost btn-sm" 
          style={{ position: 'relative', padding: '7px' }}
          onClick={() => alert("Recent Activity: 2 breakdown alerts, 1 stock low alert.")}
        >
          <Bell size={15} />
          <span style={{
            position: 'absolute', top: '4px', right: '4px',
            width: '6px', height: '6px', borderRadius: '50%',
            background: 'var(--accent-rose)',
            border: '1.5px solid var(--bg-primary)',
          }} />
        </button>

        {/* User */}
        <button 
          className="user-chip" 
          onClick={() => window.location.href = '/dashboard/settings'}
          style={{ border: 'none', background: 'none', cursor: 'pointer' }}
        >
          <div className="avatar" style={{ width: '24px', height: '24px', fontSize: '10px' }}>S</div>
          <span className="user-chip-name">Platform Owner</span>
          <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
        </button>
      </div>
    </div>
  );
}
