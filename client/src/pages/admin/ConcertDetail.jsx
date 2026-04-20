import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { ChevronLeft, Edit, Trash2, Plus, X, Check, Phone } from 'lucide-react';

function formatDate(d) {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

function YesNo({ value }) {
  return value
    ? <span className="badge-yes">SÍ</span>
    : <span className="badge-no">NO</span>;
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

function Section({ title, children }) {
  return (
    <div className="card" style={{ padding: '18px 20px', marginBottom: 16 }}>
      <div className="section-title">{title}</div>
      {children}
    </div>
  );
}

function MemberModal({ concertId, allMembers, concertMemberIds, onClose, onAdded }) {
  const available = allMembers.filter(m => !concertMemberIds.includes(m.id));
  const [userId, setUserId] = useState('');
  const [room, setRoom] = useState('');
  const [transportIda, setTransportIda] = useState('');
  const [transportVuelta, setTransportVuelta] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async () => {
    if (!userId) { setError('Selecciona un miembro'); return; }
    setSaving(true);
    try {
      await api.addConcertMember(concertId, { user_id: userId, room, transport_ida: transportIda, transport_vuelta: transportVuelta });
      onAdded(); onClose();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'Fraunces, serif', margin: 0, fontSize: 20, color: 'var(--ink)' }}>Añadir miembro</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-2)' }}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label>Persona</label>
            <select value={userId} onChange={e => setUserId(e.target.value)}>
              <option value="">Seleccionar...</option>
              {available.map(m => <option key={m.id} value={m.id}>{m.name}{m.role === 'producer' ? ' (Productor)' : ''}</option>)}
            </select>
          </div>
          <div><label>Habitación</label><input value={room} onChange={e => setRoom(e.target.value)} placeholder="Ej: 204" /></div>
          <div><label>Transporte IDA</label><input value={transportIda} onChange={e => setTransportIda(e.target.value)} placeholder="Ej: AVE Madrid → Valencia 10:30h" /></div>
          <div><label>Transporte VUELTA</label><input value={transportVuelta} onChange={e => setTransportVuelta(e.target.value)} placeholder="Ej: AVE Valencia → Madrid 02:00h" /></div>
          {error && <p style={{ fontSize: 13, color: '#b43228', margin: 0 }}>{error}</p>}
          {available.length === 0 && <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: 0 }}>Todos los miembros ya están añadidos.</p>}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={handleAdd} disabled={saving || available.length === 0} className="btn-primary">
            <Check size={14} /> {saving ? 'Añadiendo...' : 'Añadir'}
          </button>
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

function EditMemberModal({ cm, onClose, onSaved, concertId }) {
  const [room, setRoom] = useState(cm.room || '');
  const [transportIda, setTransportIda] = useState(cm.transport_ida || '');
  const [transportVuelta, setTransportVuelta] = useState(cm.transport_vuelta || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try { await api.updateConcertMember(concertId, cm.cm_id, { room, transport_ida: transportIda, transport_vuelta: transportVuelta }); onSaved(); onClose(); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'Fraunces, serif', margin: 0, fontSize: 20, color: 'var(--ink)' }}>Editar — {cm.name}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-2)' }}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label>Habitación</label><input value={room} onChange={e => setRoom(e.target.value)} placeholder="Ej: 204" /></div>
          <div><label>Transporte IDA</label><input value={transportIda} onChange={e => setTransportIda(e.target.value)} /></div>
          <div><label>Transporte VUELTA</label><input value={transportVuelta} onChange={e => setTransportVuelta(e.target.value)} /></div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={handleSave} disabled={saving} className="btn-primary"><Check size={14} /> {saving ? 'Guardando...' : 'Guardar'}</button>
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminConcertDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [concert, setConcert] = useState(null);
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    Promise.all([api.getConcert(id), api.getMembers()])
      .then(([c, m]) => { setConcert(c); setAllMembers(m); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este concierto? Esta acción no se puede deshacer.')) return;
    setDeleting(true);
    await api.deleteConcert(id);
    navigate('/dashboard');
  };

  const handleRemoveMember = async (cmId) => {
    if (!confirm('¿Quitar a esta persona del concierto?')) return;
    await api.removeConcertMember(id, cmId);
    load();
  };

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: 28, height: 28, border: '2.5px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!concert) return (
    <div style={{ padding: '40px 24px', color: 'var(--ink-2)' }}>Concierto no encontrado.</div>
  );

  const concertMemberIds = concert.members?.map(m => m.id) || [];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '0' }}>
      {/* Header */}
      <div style={{ background: 'var(--paper)', borderBottom: '1.5px solid var(--border)', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={() => navigate('/dashboard')} className="btn-secondary" style={{ padding: '6px 12px' }}>
              <ChevronLeft size={15} /> Volver
            </button>
            <div>
              <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 24, margin: 0, color: 'var(--ink)' }}>{concert.city}</h1>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 2 }}>{formatDate(concert.date)}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => navigate(`/conciertos/${id}/editar`)} className="btn-secondary" style={{ padding: '7px 14px' }}>
              <Edit size={14} /> Editar
            </button>
            <button onClick={handleDelete} disabled={deleting} className="btn-danger" style={{ padding: '7px 14px' }}>
              <Trash2 size={14} /> {deleting ? '...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 24px 60px' }}>
        {concert.transport_ida && (
          <Section title="Transporte"><p style={{ fontSize: 13, color: 'var(--ink-2)', margin: 0 }}>{concert.transport_ida}</p></Section>
        )}

        <Section title="Venue / Sala">
          <InfoRow label="Nombre" value={concert.venue_name} />
          <InfoRow label="Dirección" value={concert.venue_address} />
          <InfoRow label="Aforo" value={concert.venue_capacity} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-2)' }}>
            {[['Parking', concert.venue_parking], ['Merch', concert.merch_space], ['Cabina DJ', concert.dj_booth],
              ['Micros SM58', concert.micros_sm58], ['IEM', concert.iem], ['Monitores', concert.monitors],
              ['Pantalla visuales', concert.visuals_screen]].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{label}</span>
                <YesNo value={val} />
              </div>
            ))}
          </div>
        </Section>

        <Section title="Alojamiento">
          <InfoRow label="Hotel" value={concert.hotel_name} />
          <InfoRow label="Dirección" value={concert.hotel_address} />
          <InfoRow label="Teléfono" value={concert.hotel_phone} phone />
          <InfoRow label="Check-in" value={concert.hotel_checkin} />
          <InfoRow label="Check-out" value={concert.hotel_checkout} />
          <InfoRow label="Código reserva" value={concert.hotel_booking_code} />
          <InfoRow label="Distancia a sala" value={concert.distance_hotel_venue} />
          {concert.hotel_parking !== undefined && (
            <div className="info-row"><span className="info-label">Parking en hotel</span><YesNo value={concert.hotel_parking} /></div>
          )}
        </Section>

        <Section title="Horarios">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
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

        <Section title="Notas y contactos">
          {concert.guest_list > 0 && <InfoRow label="Lista invitados" value={`${concert.guest_list} personas`} />}
          <InfoRow label="Catering" value={concert.catering} />
          {concert.contact_venue_name && <InfoRow label={`Jefe de sala — ${concert.contact_venue_name}`} value={concert.contact_venue_phone} phone />}
          {concert.contact_booking_name && <InfoRow label={`Booking — ${concert.contact_booking_name}`} value={concert.contact_booking_phone} phone />}
          {concert.extra_notes && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-2)' }}>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 6 }}>Notas adicionales</div>
              <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{concert.extra_notes}</p>
            </div>
          )}
        </Section>

        {/* Members */}
        <Section title="Equipo en este concierto">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {concert.members?.length === 0 && (
              <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>No hay nadie añadido aún.</p>
            )}
            {concert.members?.map(m => (
              <div key={m.cm_id} style={{ background: 'white', border: '1.5px solid var(--border)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{m.name}</span>
                    {m.user_role === 'producer' && (
                      <span style={{ fontSize: 10, background: 'rgba(176,122,48,.12)', color: '#7a4e10', border: '1px solid rgba(176,122,48,.25)', borderRadius: 5, padding: '1px 6px' }}>Productor</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {m.room && <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>🛏 Hab. {m.room}</span>}
                    {m.transport_ida && <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>→ {m.transport_ida}</span>}
                    {m.transport_vuelta && <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>← {m.transport_vuelta}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => setEditMember(m)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: 4, borderRadius: 4 }}>
                    <Edit size={13} />
                  </button>
                  <button onClick={() => handleRemoveMember(m.cm_id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: 4, borderRadius: 4 }}>
                    <X size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setShowAddModal(true)} style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
            <Plus size={14} /> Añadir persona
          </button>
        </Section>
      </div>

      {showAddModal && (
        <MemberModal concertId={id} allMembers={allMembers} concertMemberIds={concertMemberIds} onClose={() => setShowAddModal(false)} onAdded={load} />
      )}
      {editMember && (
        <EditMemberModal cm={editMember} concertId={id} onClose={() => setEditMember(null)} onSaved={load} />
      )}
    </div>
  );
}
