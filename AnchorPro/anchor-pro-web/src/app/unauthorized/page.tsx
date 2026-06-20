'use client';

import { ShieldOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { getDefaultRoute } from '@/lib/rbac';

export default function UnauthorizedPage() {
  const { user, isPlatformOwner } = useAuth();
  const router = useRouter();

  const handleBack = () => {
    if (user) {
      router.push(getDefaultRoute(user.roles || [], isPlatformOwner));
    } else {
      router.push('/login');
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: 'var(--bg-primary)', flexDirection: 'column', gap: 16,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16,
        background: 'var(--accent-rose-dim)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <ShieldOff size={26} style={{ color: 'var(--accent-rose)' }} />
      </div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Access Denied</h1>
      <p style={{ fontSize: 13, color: 'var(--text-tertiary)', maxWidth: 360, textAlign: 'center' }}>
        You do not have permission to view this page. Contact your administrator if you believe this is an error.
      </p>
      <button onClick={handleBack} style={{
        marginTop: 8, padding: '8px 20px', background: 'var(--accent-blue)',
        color: 'white', borderRadius: 8, fontSize: 13, fontWeight: 600,
        border: 'none', cursor: 'pointer'
      }}>
        Back to Dashboard
      </button>
    </div>
  );
}
