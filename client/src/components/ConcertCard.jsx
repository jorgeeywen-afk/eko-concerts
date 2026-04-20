import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, ChevronRight } from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
}

function isUpcoming(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr + 'T00:00:00') >= new Date(new Date().toDateString());
}

export default function ConcertCard({ concert, memberCount }) {
  const navigate = useNavigate();
  const upcoming = isUpcoming(concert.date);

  return (
    <button
      onClick={() => navigate(`/conciertos/${concert.id}`)}
      className="card"
      style={{
        width: '100%', padding: '16px 20px', textAlign: 'left', cursor: 'pointer',
        transition: 'border-color .15s, box-shadow .15s', display: 'block',
      }}
      onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--ink-3)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,.06)'; }}
      onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span className={upcoming ? 'badge-upcoming' : 'badge-past'}>
              {upcoming ? 'Próximo' : 'Pasado'}
            </span>
          </div>
          <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 500, color: 'var(--ink)', margin: '0 0 2px', letterSpacing: '-.01em' }}>
            {concert.city}
          </h3>
          {concert.venue_name && (
            <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '0 0 10px' }}>{concert.venue_name}</p>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {concert.date && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--ink-3)' }}>
                <Calendar size={12} />
                {formatDate(concert.date)}
              </span>
            )}
            {concert.venue_address && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                <MapPin size={12} />
                {concert.venue_address}
              </span>
            )}
            {memberCount !== undefined && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--ink-3)' }}>
                <Users size={12} />
                {memberCount} {memberCount === 1 ? 'persona' : 'personas'}
              </span>
            )}
          </div>
        </div>
        <ChevronRight size={18} style={{ color: 'var(--ink-3)', marginTop: 4, flexShrink: 0 }} />
      </div>
    </button>
  );
}
