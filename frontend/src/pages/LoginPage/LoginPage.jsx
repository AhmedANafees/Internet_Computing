import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3ecec' }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
        <h2 style={{ marginTop: 0, marginBottom: 8 }}>Welcome</h2>
        <p style={{ marginTop: 0, marginBottom: 24, color: '#666' }}>Sign in to continue.</p>
        <button
          onClick={() => navigate('/courses')}
          style={{ width: '100%', padding: '12px 16px', border: 'none', borderRadius: 8, background: '#9e7f7f', color: '#fff', cursor: 'pointer', fontSize: 15, fontWeight: 600 }}
        >
          Continue to Course Registration
        </button>
      </div>
    </div>
  );
}
