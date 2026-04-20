import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api';
import { ChevronLeft, Save } from 'lucide-react';

const BOOL_FIELDS = ['venue_parking', 'merch_space', 'dj_booth', 'micros_sm58', 'iem', 'monitors', 'visuals_screen', 'hotel_parking'];

function Toggle({ label, checked, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        style={{
          width: 40, height: 22, borderRadius: 99, border: 'none', cursor: 'pointer',
          background: checked ? 'var(--accent)' : 'rgba(0,0,0,.15)',
          position: 'relative', transition: 'background .15s',
          flexShrink: 0,
        }}
      >
        <span style={{
          position: 'absolute', top: 2, left: checked ? 20 : 2,
          width: 18, height: 18, borderRadius: '50%', background: 'white',
          boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .15s',
        }} />
      </button>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="card" style={{ padding: '20px 22px', marginBottom: 16 }}>
      <div className="section-title">{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    </div>
  );
}

function Row({ children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return <div><label>{label}</label>{children}</div>;
}

const EMPTY = {
  city: '', date: '', transport_ida: '',
  venue_name: '', venue_address: '', venue_capacity: '',
  venue_parking: false, merch_space: false, dj_booth: false,
  micros_sm58: false, iem: false, monitors: false, visuals_screen: false,
  hotel_name: '', hotel_address: '', hotel_phone: '',
  hotel_checkin: '', hotel_checkout: '', hotel_booking_code: '',
  hotel_parking: false, distance_hotel_venue: '',
  get_in: '', setup_time: '', sound_check: '', doors: '', show_time: '', curfew: '',
  guest_list: 0, catering: '',
  contact_venue_name: '', contact_venue_phone: '',
  contact_booking_name: '', contact_booking_phone: '',
  extra_notes: '', status: 'confirmed',
};

export default function ConcertForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    api.getConcert(id)
      .then(data => {
        const normalized = { ...EMPTY };
        for (const key of Object.keys(EMPTY)) {
          if (BOOL_FIELDS.includes(key)) normalized[key] = Boolean(data[key]);
          else normalized[key] = data[key] ?? '';
        }
        setForm(normalized);
      })
      .catch(() => setError('No se pudo cargar el concierto'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.city || !form.date) { setError('Ciudad y fecha son obligatorios'); return; }
    setSaving(true); setError('');
    try {
      if (isEdit) {
        await api.updateConcert(id, form);
        navigate(`/conciertos/${id}`);
      } else {
        const concert = await api.createConcert(form);
        navigate(`/conciertos/${concert.id}`);
      }
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: 24, height: 24, border: '2.5px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ background: 'var(--paper)', borderBottom: '1.5px solid var(--border)', padding: '14px 24px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => navigate(-1)} className="btn-secondary" style={{ padding: '6px 12px' }}>
            <ChevronLeft size={15} /> Volver
          </button>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 24, margin: 0, color: 'var(--ink)' }}>
            {isEdit ? 'Editar concierto' : 'Nuevo concierto'}
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 24px 60px' }}>
        {error && (
          <div style={{ background: 'rgba(180,50,40,.08)', border: '1px solid rgba(180,50,40,.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#b43228' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Info general */}
          <Section title="Info general">
            <Row>
              <Field label="Ciudad *">
                <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Valencia" required />
              </Field>
              <Field label="Fecha *">
                <input type="date" value={form.date} onChange={e => set('date', e.target.value)} required />
              </Field>
            </Row>
            <Field label="Estado">
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="confirmed">Confirmado</option>
                <option value="pending">Pendiente</option>
              </select>
            </Field>
          </Section>

          {/* Transporte */}
          <Section title="Transporte">
            <Field label="IDA — Detalles generales">
              <textarea value={form.transport_ida} onChange={e => set('transport_ida', e.target.value)} placeholder="Ej: Tren a Valencia, coordinar con Tata (637741797)" rows={2} style={{ resize: 'none' }} />
            </Field>
          </Section>

          {/* Venue */}
          <Section title="Venue / Sala">
            <Row>
              <Field label="Nombre de la sala">
                <input value={form.venue_name} onChange={e => set('venue_name', e.target.value)} placeholder="Sala Spook" />
              </Field>
              <Field label="Aforo">
                <input value={form.venue_capacity} onChange={e => set('venue_capacity', e.target.value)} placeholder="1170 pers." />
              </Field>
            </Row>
            <Field label="Dirección">
              <input value={form.venue_address} onChange={e => set('venue_address', e.target.value)} placeholder="Carr. del Río 399, Valencia" />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, paddingTop: 4 }}>
              <Toggle label="Parking" checked={form.venue_parking} onChange={v => set('venue_parking', v)} />
              <Toggle label="Merchandising" checked={form.merch_space} onChange={v => set('merch_space', v)} />
              <Toggle label="Cabina DJ" checked={form.dj_booth} onChange={v => set('dj_booth', v)} />
              <Toggle label="Micros SM58" checked={form.micros_sm58} onChange={v => set('micros_sm58', v)} />
              <Toggle label="IEM" checked={form.iem} onChange={v => set('iem', v)} />
              <Toggle label="Monitores" checked={form.monitors} onChange={v => set('monitors', v)} />
              <Toggle label="Pantalla visuales" checked={form.visuals_screen} onChange={v => set('visuals_screen', v)} />
            </div>
          </Section>

          {/* Alojamiento */}
          <Section title="Alojamiento">
            <Row>
              <Field label="Nombre del hotel">
                <input value={form.hotel_name} onChange={e => set('hotel_name', e.target.value)} placeholder="Hostal Andrés" />
              </Field>
              <Field label="Teléfono">
                <input value={form.hotel_phone} onChange={e => set('hotel_phone', e.target.value)} placeholder="961830111" />
              </Field>
            </Row>
            <Field label="Dirección">
              <input value={form.hotel_address} onChange={e => set('hotel_address', e.target.value)} placeholder="Carrer de l'Anguilera, 7, Valencia" />
            </Field>
            <Row>
              <Field label="Check-in"><input value={form.hotel_checkin} onChange={e => set('hotel_checkin', e.target.value)} placeholder="14:00h" /></Field>
              <Field label="Check-out"><input value={form.hotel_checkout} onChange={e => set('hotel_checkout', e.target.value)} placeholder="12:30h" /></Field>
            </Row>
            <Row>
              <Field label="Código de reserva">
                <input value={form.hotel_booking_code} onChange={e => set('hotel_booking_code', e.target.value)} placeholder="Tata - 637741797" />
              </Field>
              <Field label="Distancia hotel → sala">
                <input value={form.distance_hotel_venue} onChange={e => set('distance_hotel_venue', e.target.value)} placeholder="6 min en coche" />
              </Field>
            </Row>
            <Toggle label="Parking en hotel" checked={form.hotel_parking} onChange={v => set('hotel_parking', v)} />
          </Section>

          {/* Horarios */}
          <Section title="Horarios">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 14 }}>
              <Field label="Get In"><input value={form.get_in} onChange={e => set('get_in', e.target.value)} placeholder="22:00" /></Field>
              <Field label="Set Up"><input value={form.setup_time} onChange={e => set('setup_time', e.target.value)} placeholder="16:30" /></Field>
              <Field label="Sound Check"><input value={form.sound_check} onChange={e => set('sound_check', e.target.value)} placeholder="19:00" /></Field>
              <Field label="Puertas"><input value={form.doors} onChange={e => set('doors', e.target.value)} placeholder="21:00" /></Field>
              <Field label="Show"><input value={form.show_time} onChange={e => set('show_time', e.target.value)} placeholder="22:00" /></Field>
              <Field label="Curfew"><input value={form.curfew} onChange={e => set('curfew', e.target.value)} placeholder="23:30" /></Field>
            </div>
          </Section>

          {/* Notas */}
          <Section title="Notas y contactos">
            <Row>
              <Field label="Lista de invitados">
                <input type="number" value={form.guest_list} onChange={e => set('guest_list', e.target.value)} placeholder="10" min="0" />
              </Field>
              <Field label="Catering">
                <input value={form.catering} onChange={e => set('catering', e.target.value)} placeholder="Líquido según rider" />
              </Field>
            </Row>
            <Row>
              <Field label="Contacto jefe de sala">
                <input value={form.contact_venue_name} onChange={e => set('contact_venue_name', e.target.value)} placeholder="Fernando" />
              </Field>
              <Field label="Teléfono">
                <input value={form.contact_venue_phone} onChange={e => set('contact_venue_phone', e.target.value)} placeholder="656524614" />
              </Field>
            </Row>
            <Row>
              <Field label="Contacto booking">
                <input value={form.contact_booking_name} onChange={e => set('contact_booking_name', e.target.value)} placeholder="Tata" />
              </Field>
              <Field label="Teléfono">
                <input value={form.contact_booking_phone} onChange={e => set('contact_booking_phone', e.target.value)} placeholder="637741797" />
              </Field>
            </Row>
            <Field label="Notas adicionales">
              <textarea value={form.extra_notes} onChange={e => set('extra_notes', e.target.value)} placeholder="Cualquier info extra..." rows={3} style={{ resize: 'none' }} />
            </Field>
          </Section>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, paddingBottom: 8 }}>
            <button type="submit" disabled={saving} className="btn-primary">
              <Save size={15} />
              {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear concierto'}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
