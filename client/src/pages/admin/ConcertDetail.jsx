import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import {
  ChevronLeft, Edit, Trash2, Plus, X, Check,
  MapPin, Phone, Clock, Users, Hotel, Mic, Calendar
} from 'lucide-react';

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
        {phone ? (
          <a href={`tel:${value}`} className="text-indigo-400 hover:underline">{value}</a>
        ) : String(value)}
      </span>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon size={14} className="text-zinc-500" />}
        <h2 className="section-title mb-0">{title}</h2>
      </div>
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
      await api.addConcertMember(concertId, {
        user_id: userId,
        room, transport_ida: transportIda, transport_vuelta: transportVuelta
      });
      onAdded();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-zinc-100">Añadir miembro</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label>Persona</label>
            <select value={userId} onChange={e => setUserId(e.target.value)}>
              <option value="">Seleccionar...</option>
              {available.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.role === 'producer' ? '(Productor)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Habitación</label>
            <input value={room} onChange={e => setRoom(e.target.value)} placeholder="Ej: 204" />
          </div>
          <div>
            <label>Transporte IDA</label>
            <input value={transportIda} onChange={e => setTransportIda(e.target.value)} placeholder="Ej: AVE Madrid → Valencia 10:30h" />
          </div>
          <div>
            <label>Transporte VUELTA</label>
            <input value={transportVuelta} onChange={e => setTransportVuelta(e.target.value)} placeholder="Ej: AVE Valencia → Madrid 02:00h" />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          {available.length === 0 && (
            <p className="text-sm text-zinc-500">Todos los miembros ya están añadidos.</p>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={handleAdd} disabled={saving || available.length === 0} className="btn-primary flex items-center gap-2">
            <Check size={15} /> {saving ? 'Añadiendo...' : 'Añadir'}
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
    try {
      await api.updateConcertMember(concertId, cm.cm_id, {
        room, transport_ida: transportIda, transport_vuelta: transportVuelta
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-zinc-100">Editar — {cm.name}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label>Habitación</label>
            <input value={room} onChange={e => setRoom(e.target.value)} placeholder="Ej: 204" />
          </div>
          <div>
            <label>Transporte IDA</label>
            <input value={transportIda} onChange={e => setTransportIda(e.target.value)} placeholder="Ej: AVE 10:30h" />
          </div>
          <div>
            <label>Transporte VUELTA</label>
            <input value={transportVuelta} onChange={e => setTransportVuelta(e.target.value)} placeholder="Ej: AVE 02:00h" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
            <Check size={15} /> {saving ? 'Guardando...' : 'Guardar'}
          </button>
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
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!concert) return (
    <div className="p-8 text-zinc-500">Concierto no encontrado.</div>
  );

  const concertMemberIds = concert.members?.map(m => m.id) || [];

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="btn-secondary flex items-center gap-2 text-sm">
            <ChevronLeft size={16} /> Volver
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-zinc-100">{concert.city}</h1>
            <p className="text-zinc-500 text-sm mt-0.5 flex items-center gap-1.5">
              <Calendar size={13} />
              {formatDate(concert.date)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(`/conciertos/${id}/editar`)} className="btn-secondary flex items-center gap-2 text-sm">
            <Edit size={14} /> Editar
          </button>
          <button onClick={handleDelete} disabled={deleting} className="btn-danger flex items-center gap-2 text-sm">
            <Trash2 size={14} /> {deleting ? '...' : 'Eliminar'}
          </button>
        </div>
      </div>

      <div className="space-y-5">

        {/* Transporte general */}
        {concert.transport_ida && (
          <Section title="Transporte" icon={MapPin}>
            <p className="text-sm text-zinc-300">{concert.transport_ida}</p>
          </Section>
        )}

        {/* Venue */}
        <Section title="Venue / Sala" icon={Mic}>
          <InfoRow label="Nombre" value={concert.venue_name} />
          <InfoRow label="Dirección" value={concert.venue_address} />
          <InfoRow label="Aforo" value={concert.venue_capacity} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-zinc-800">
            {[
              ['Parking', concert.venue_parking],
              ['Merchandising', concert.merch_space],
              ['Cabina DJ', concert.dj_booth],
              ['Micros SM58', concert.micros_sm58],
              ['IEM', concert.iem],
              ['Monitores', concert.monitors],
              ['Pantalla visuales', concert.visuals_screen],
            ].map(([label, val]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">{label}</span>
                <YesNo value={val} />
              </div>
            ))}
          </div>
        </Section>

        {/* Hotel */}
        <Section title="Alojamiento" icon={Hotel}>
          <InfoRow label="Hotel" value={concert.hotel_name} />
          <InfoRow label="Dirección" value={concert.hotel_address} />
          <InfoRow label="Teléfono" value={concert.hotel_phone} phone />
          <InfoRow label="Check-in" value={concert.hotel_checkin} />
          <InfoRow label="Check-out" value={concert.hotel_checkout} />
          <InfoRow label="Código reserva" value={concert.hotel_booking_code} />
          <InfoRow label="Distancia a sala" value={concert.distance_hotel_venue} />
          {concert.hotel_parking !== undefined && (
            <div className="info-row">
              <span className="info-label">Parking en hotel</span>
              <YesNo value={concert.hotel_parking} />
            </div>
          )}
        </Section>

        {/* Horarios */}
        <Section title="Horarios" icon={Clock}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              ['Get In', concert.get_in],
              ['Set Up', concert.setup_time],
              ['Sound Check', concert.sound_check],
              ['Puertas', concert.doors],
              ['Show', concert.show_time],
              ['Curfew', concert.curfew],
            ].filter(([, v]) => v).map(([label, value]) => (
              <div key={label} className="bg-zinc-800/60 rounded-lg px-4 py-3">
                <p className="text-xs text-zinc-500 mb-1">{label}</p>
                <p className="text-lg font-semibold text-zinc-100">{value}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Notas */}
        <Section title="Notas y contactos">
          {concert.guest_list > 0 && <InfoRow label="Lista invitados" value={`${concert.guest_list} personas`} />}
          <InfoRow label="Catering" value={concert.catering} />
          {concert.contact_venue_name && (
            <InfoRow
              label={`Jefe de sala — ${concert.contact_venue_name}`}
              value={concert.contact_venue_phone}
              phone
            />
          )}
          {concert.contact_booking_name && (
            <InfoRow
              label={`Booking — ${concert.contact_booking_name}`}
              value={concert.contact_booking_phone}
              phone
            />
          )}
          {concert.extra_notes && (
            <div className="mt-3 pt-3 border-t border-zinc-800">
              <p className="text-xs text-zinc-500 mb-1">Notas adicionales</p>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap">{concert.extra_notes}</p>
            </div>
          )}
        </Section>

        {/* Miembros */}
        <Section title="Equipo en este concierto" icon={Users}>
          <div className="space-y-3">
            {concert.members?.length === 0 && (
              <p className="text-sm text-zinc-500">No hay nadie añadido aún.</p>
            )}
            {concert.members?.map(m => (
              <div key={m.cm_id} className="bg-zinc-800/50 rounded-lg px-4 py-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-zinc-100 text-sm">{m.name}</span>
                      {m.user_role === 'producer' && (
                        <span className="text-xs bg-amber-500/15 text-amber-400 border border-amber-500/20 rounded px-1.5 py-0.5">Productor</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-zinc-400">
                      {m.room && <span>🛏 Hab. {m.room}</span>}
                      {m.transport_ida && <span>→ IDA: {m.transport_ida}</span>}
                      {m.transport_vuelta && <span>← VUELTA: {m.transport_vuelta}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditMember(m)}
                      className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 rounded transition-colors"
                    >
                      <Edit size={13} />
                    </button>
                    <button
                      onClick={() => handleRemoveMember(m.cm_id)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <Plus size={15} /> Añadir persona
          </button>
        </Section>
      </div>

      {showAddModal && (
        <MemberModal
          concertId={id}
          allMembers={allMembers}
          concertMemberIds={concertMemberIds}
          onClose={() => setShowAddModal(false)}
          onAdded={load}
        />
      )}

      {editMember && (
        <EditMemberModal
          cm={editMember}
          concertId={id}
          onClose={() => setEditMember(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
