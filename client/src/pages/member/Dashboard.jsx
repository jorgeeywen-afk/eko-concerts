import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../contexts/AuthContext';

function isUpcoming(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr + 'T00:00:00') >= new Date(new Date().toDateString());
}

function daysUntil(d) {
  const diff = new Date(d + 'T00:00:00') - new Date(new Date().toDateString());
  return Math.ceil(diff / 86400000);
}

function formatDateLong(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  const wd = dt.toLocaleDateString('es-ES', { weekday: 'long' });
  return wd.charAt(0).toUpperCase() + wd.slice(1) + ', ' +
    dt.getDate() + ' de ' + dt.toLocaleDateString('es-ES', { month: 'long' });
}

function formatDateShort(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.getDate() + ' ' + dt.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');
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

  const upcoming = concerts.filter(c => isUpcoming(c.date))
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const past = concerts.filter(c => !isUpcoming(c.date))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const shown = tab === 'upcoming' ? upcoming : past;
  const next = upcoming[0] || null;

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Topbar ── */}
      <header style={{
        background: 'var(--paper)', borderBottom: '1px solid rgba(58,46,36,.1)',
        padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12,
        position: 'sticky', top: 0, zIndex: 20, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2,#d4836a))',
            color: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 17, fontWeight: 500,
          }}>Jp</div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-.01em' }}>John Pollon</div>
            <div style={{ fontSize: 11, color: 'var(--ink-2)', marginTop: 1 }}>Gira de primavera</div>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: 'var(--ink-2)' }} className="name-desktop">{user?.name}</span>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #8da88a, #a9bf99)',
              color: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer',
            }}
          >{initials}</button>
        </div>
      </header>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px 80px', width: '100%' }}>

        {/* ── Hero greeting ── */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontFamily: 'Fraunces, serif', fontSize: 38, margin: '0 0 6px',
            color: 'var(--ink)', letterSpacing: '-.02em', lineHeight: 1.1,
          }}>
            Hola, {user?.name?.split(' ')[0]}
          </h1>
          <p style={{ color: 'var(--ink-2)', fontSize: 14, margin: 0 }}>
            {upcoming.length === 0
              ? 'No tienes conciertos próximos.'
              : `Tienes ${upcoming.length} ${upcoming.length === 1 ? 'concierto próximo' : 'conciertos próximos'}`}
          </p>
        </div>

        {/* ── Next show card ── */}
        {next && (
          <div
            onClick={() => navigate(`/conciertos/${next.id}`)}
            style={{
              background: 'var(--paper)', border: '1px solid rgba(58,46,36,.1)',
              borderRadius: 20, padding: '20px 24px', marginBottom: 28,
              boxShadow: '0 8px 28px rgba(58,46,36,.1)',
              cursor: 'pointer', transition: 'box-shadow .2s, transform .2s',
            }}
            onMouseOver={e => { e.currentTarget.style.boxShadow = '0 12px 36px rgba(58,46,36,.15)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseOut={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(58,46,36,.1)'; e.currentTarget.style.transform = 'none'; }}
          >
            <div style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '.04em', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>
              Tu próxima parada
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 28, margin: '0 0 4px', color: 'var(--ink)', letterSpacing: '-.01em', lineHeight: 1.1 }}>
                  {next.city}
                </h2>
                <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
                  {next.venue_name ? `${next.venue_name} · ` : ''}{formatDateLong(next.date)}
                  {next.show_time ? ` · ${next.show_time}` : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: 42, fontWeight: 500, color: 'var(--accent)', lineHeight: 1, fontStyle: 'italic' }}>
                  {daysUntil(next.date) === 0 ? '¡Hoy!' : daysUntil(next.date) === 1 ? '1 día' : `${daysUntil(next.date)}`}
                </div>
                {daysUntil(next.date) > 0 && (
                  <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>días para el show</div>
                )}
              </div>
            </div>
            {/* Mini timeline */}
            {next.show_time && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(58,46,36,.08)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {[['Get In', next.get_in], ['Soundcheck', next.sound_check], ['Puertas', next.doors], ['Show', next.show_time], ['Curfew', next.curfew]].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} style={{ textAlign: 'center', minWidth: 60 }}>
                    <div style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 500, color: 'var(--ink)' }}>{value}</div>
                    <div style={{ fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.05em', marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', background: 'rgba(58,46,36,.06)', borderRadius: 12, padding: 4, gap: 3 }}>
            {[['upcoming', `Próximos (${upcoming.length})`], ['past', `Pasados (${past.length})`]].map(([v, label]) => (
              <button
                key={v}
                onClick={() => setTab(v)}
                style={{
                  padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: tab === v ? 600 : 400,
                  background: tab === v ? 'var(--paper)' : 'transparent',
                  color: tab === v ? 'var(--ink)' : 'var(--ink-2)',
                  boxShadow: tab === v ? '0 1px 4px rgba(58,46,36,.1)' : 'none',
                  transition: 'all .15s',
                }}
              >{label}</button>
            ))}
          </div>
        </div>

        {/* ── Concert list ── */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ width: 24, height: 24, border: '2.5px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : shown.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--ink-2)' }}>
            {tab === 'upcoming' ? 'No tienes conciertos próximos.' : 'No hay conciertos pasados.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {shown.map((concert, i) => {
              const up = isUpcoming(concert.date);
              const days = up ? daysUntil(concert.date) : null;
              return (
                <button
                  key={concert.id}
                  onClick={() => navigate(`/conciertos/${concert.id}`)}
                  style={{
                    width: '100%', padding: '18px 22px', textAlign: 'left', cursor: 'pointer',
                    background: 'var(--paper)',
                    border: '1px solid rgba(58,46,36,.1)',
                    borderRadius: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                    transition: 'box-shadow .15s, transform .15s, border-color .15s',
                    boxShadow: '0 2px 8px rgba(58,46,36,.06)',
                  }}
                  onMouseOver={e => { e.currentTarget.style.boxShadow = '0 6px 18px rgba(58,46,36,.12)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.borderColor = 'rgba(58,46,36,.18)'; }}
                  onMouseOut={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(58,46,36,.06)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'rgba(58,46,36,.1)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {/* Number badge */}
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                      background: up ? 'var(--accent)' : 'rgba(58,46,36,.08)',
                      color: up ? 'var(--paper)' : 'var(--ink-3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontWeight: 500, fontSize: 16,
                    }}>{i + 1}</div>
                    <div>
                      <div style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-.01em' }}>
                        {concert.city}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 3 }}>
                        {formatDateShort(concert.date)}{concert.venue_name ? ` · ${concert.venue_name}` : ''}
                        {concert.show_time ? ` · ${concert.show_time}` : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    {up && days !== null && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 500, color: 'var(--accent)', lineHeight: 1, fontStyle: 'italic' }}>
                          {days === 0 ? '¡Hoy!' : days}
                        </div>
                        {days > 0 && <div style={{ fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>días</div>}
                      </div>
                    )}
                    {!up && (
                      <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-3)', background: 'rgba(58,46,36,.06)', padding: '3px 9px', borderRadius: 999 }}>Pasado</span>
                    )}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 480px) {
          .name-desktop { display: none !important; }
        }
      `}</style>
    </div>
  );
}
