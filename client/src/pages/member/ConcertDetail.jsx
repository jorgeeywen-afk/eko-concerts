import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api';
import { ChevronLeft, Phone } from 'lucide-react';

function formatDate(d) {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

function YesNo({ value }) {
  return value ? <span className="badge-yes">SÍ</span> : <span className="badge-no">NO</span>;
}

function InfoRow({ label, value, phone }) {
  if (!value && value !== 0) return null;
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className="info-value">
        {phone
          ? <a href={`tel:${value}`} style={{ color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={12} />{value}</a>
          : String(value)}
      </span>
    </div>
  );
}

function Section({ title, highlight, children }) {
  return (
    <div className="card" style={{
      padding: '16px 20px', marginBottom: 14,
      ...(highlight ? { background: 'rgba(194,103,74,.06)', borderColor: 'rgba(194,103,74,.3)' } : {})
    }}>
      <div className="section-title" style={highlight ? { color: 'var(--accent)' } : {}}>{title}</div>
      {children}
    </div>
  );
}

export default function MemberConcertDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [concert, setConcert] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getConcert(id).then(setConcert).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: 24, height: 24, border: '2.5px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!concert) return <div style={{ padding: '40px 24px', color: 'var(--ink-2)' }}>Concierto no encontrado.</div>;

  const myInfo = concert.members?.find(m => m.id === user?.id);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ background: 'var(--paper)', borderBottom: '1.5px solid var(--border)', padding: '14px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => navigate('/dashboard')} className="btn-secondary" style={{ padding: '6px 12px' }}>
            <ChevronLeft size={15} /> Volver
          </button>
          <div>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 24, margin: 0, color: 'var(--ink)' }}>{concert.city}</h1>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 2 }}>{formatDate(concert.date)}</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 20px 60px' }}>
        {/* My personal info — highlighted */}
        {myInfo && (
          <Section title="Tu info para este concierto" highlight>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {myInfo.room && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'white', borderRadius: 8, padding: '10px 14px', border: '1.5px solid rgba(194,103,74,.2)' }}>
                  <span style={{ fontSize: 22 }}>🛏</span>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--accent)', marginBottom: 2 }}>Habitación</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{myInfo.room}</div>
                  </div>
                </div>
              )}
              {myInfo.transport_ida && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'white', borderRadius: 8, padding: '10px 14px', border: '1.5px solid var(--border)' }}>
                  <span style={{ fontSize: 18, color: 'var(--accent)' }}>→</span>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 2 }}>Transporte IDA</div>
                    <div style={{ fontSize: 13, color: 'var(--ink)' }}>{myInfo.transport_ida}</div>
                  </div>
                </div>
              )}
              {myInfo.transport_vuelta && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'white', borderRadius: 8, padding: '10px 14px', border: '1.5px solid var(--border)' }}>
                  <span style={{ fontSize: 18, color: 'var(--ink-2)' }}>←</span>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 2 }}>Transporte VUELTA</div>
                    <div style={{ fontSize: 13, color: 'var(--ink)' }}>{myInfo.transport_vuelta}</div>
                  </div>
                </div>
              )}
              {!myInfo.room && !myInfo.transport_ida && !myInfo.transport_vuelta && (
                <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>Tu transporte y habitación se añadirán pronto.</p>
              )}
            </div>
          </Section>
        )}

        {/* General transport */}
        {concert.transport_ida && (
          <Section title="Transporte general">
            <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: 0 }}>{concert.transport_ida}</p>
          </Section>
        )}

        {/* Venue */}
        <Section title="Venue / Sala">
          <InfoRow label="Nombre" value={concert.venue_name} />
          <InfoRow label="Dirección" value={concert.venue_address} />
          <InfoRow label="Aforo" value={concert.venue_capacity} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-2)' }}>
            {[['Parking', concert.venue_parking], ['Cabina DJ', concert.dj_booth], ['Micros SM58', concert.micros_sm58], ['IEM', concert.iem], ['Monitores', concert.monitors], ['Pantalla visuales', concert.visuals_screen]].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{label}</span>
                <YesNo value={val} />
              </div>
            ))}
          </div>
        </Section>

        {/* Hotel */}
        <Section title="Alojamiento">
          <InfoRow label="Hotel" value={concert.hotel_name} />
          <InfoRow label="Dirección" value={concert.hotel_address} />
          <InfoRow label="Teléfono" value={concert.hotel_phone} phone />
          <InfoRow label="Check-in" value={concert.hotel_checkin} />
          <InfoRow label="Check-out" value={concert.hotel_checkout} />
          <InfoRow label="Distancia a sala" value={concert.distance_hotel_venue} />
        </Section>

        {/* Schedules */}
        <Section title="Horarios">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
            {[['Get In', concert.get_in], ['Set Up', concert.setup_time], ['Sound Check', concert.sound_check],
              ['Puertas', concert.doors], ['Show', concert.show_time], ['Curfew', concert.curfew]]
              .filter(([, v]) => v).map(([label, value]) => (
              <div key={label} style={{ background: 'white', border: '1.5px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', fontFamily: 'Fraunces, serif' }}>{value}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Contacts */}
        {(concert.contact_venue_name || concert.contact_booking_name || concert.guest_list > 0) && (
          <Section title="Contactos">
            {concert.guest_list > 0 && <InfoRow label="Lista invitados" value={`${concert.guest_list} personas`} />}
            {concert.catering && <InfoRow label="Catering" value={concert.catering} />}
            {concert.contact_venue_name && <InfoRow label={`Jefe sala — ${concert.contact_venue_name}`} value={concert.contact_venue_phone} phone />}
            {concert.contact_booking_name && <InfoRow label={`Booking — ${concert.contact_booking_name}`} value={concert.contact_booking_phone} phone />}
            {concert.extra_notes && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-2)' }}>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 6 }}>Notas</div>
                <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{concert.extra_notes}</p>
              </div>
            )}
          </Section>
        )}
      </div>
    </div>
  );
}
