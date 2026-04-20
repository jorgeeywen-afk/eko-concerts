import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut } from 'lucide-react';

function isUpcoming(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr + 'T00:00:00') >= new Date(new Date().toDateString());
}

function formatDateShort(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'long' });
}

export default function MemberDashboard() {
  const [concerts, setConcerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.getConcerts().then(setConcerts).finally(() => setLoading(false));
  }, []);

  const upcoming = concerts.filter(c => isUpcoming(c.date));
  const past = concerts.filter(c => !isUpcoming(c.date));
  const shown = tab === 'upcoming' ? upcoming : past;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{
        background: 'var(--paper)', borderBottom: '1.5px solid var(--border)',
        padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--ink)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Fraunces, serif', fontSize: 14, fontStyle: 'italic' }}>E</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', fontFamily: 'Fraunces, serif' }}>EKO Agency</div>
          </div>
        </div>
        <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <LogOut size={15} />
          <span style={{ display: 'none' }} className="hide-mobile">Salir</span>
        </button>
      </header>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 20px 60px' }}>
        {/* Greeting */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 36, margin: '0 0 6px', color: 'var(--ink)', letterSpacing: '-.02em' }}>
            Hola, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'var(--ink-2)', fontSize: 14, margin: 0 }}>
            Tienes {upcoming.length} {upcoming.length === 1 ? 'concierto próximo' : 'conciertos próximos'}
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: 'rgba(0,0,0,.04)', borderRadius: 10, padding: 4, gap: 3, width: 'fit-content', marginBottom: 20 }}>
          {[['upcoming', `Próximos (${upcoming.length})`], ['past', `Pasados (${past.length})`]].map(([v, label]) => (
            <button key={v} onClick={() => setTab(v)} style={{
              padding: '7px 16px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13,
              fontWeight: tab === v ? 600 : 400,
              background: tab === v ? 'white' : 'transparent',
              color: tab === v ? 'var(--ink)' : 'var(--ink-2)',
              boxShadow: tab === v ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
              transition: 'all .15s',
            }}>{label}</button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ width: 24, height: 24, border: '2.5px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : shown.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--ink-2)' }}>
            {tab === 'upcoming' ? 'No tienes conciertos próximos.' : 'No tienes conciertos pasados.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {shown.map(concert => (
              <button
                key={concert.id}
                onClick={() => navigate(`/conciertos/${concert.id}`)}
                className="card"
                style={{
                  width: '100%', padding: '16px 20px', textAlign: 'left', cursor: 'pointer',
                  border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                  transition: 'border-color .15s',
                }}
                onMouseOver={e => e.currentTarget.style.borderColor = 'var(--ink-3)'}
                onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span className={isUpcoming(concert.date) ? 'badge-upcoming' : 'badge-past'}>
                      {isUpcoming(concert.date) ? 'Próximo' : 'Pasado'}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 500, color: 'var(--ink)' }}>{concert.city}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 3 }}>
                    {formatDateShort(concert.date)}{concert.venue_name ? ` · ${concert.venue_name}` : ''}
                  </div>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
