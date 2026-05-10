import Link from 'next/link';
import { ShieldOff } from 'lucide-react';

export default function UnauthorizedPage() {
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
      <Link href="/dashboard" style={{
        marginTop: 8, padding: '8px 20px', background: 'var(--accent-blue)',
        color: 'white', borderRadius: 8, fontSize: 13, fontWeight: 600,
        textDecoration: 'none',
      }}>
        Back to Dashboard
      </Link>
    </div>
  );
}
