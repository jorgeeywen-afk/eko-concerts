import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api';
import { ChevronLeft, Save } from 'lucide-react';

const BOOL_FIELDS = ['venue_parking', 'merch_space', 'dj_booth', 'micros_sm58', 'iem', 'monitors', 'visuals_screen', 'hotel_parking'];

function Toggle({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-zinc-300">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-zinc-700'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="card p-6 space-y-4">
      <h2 className="section-title">{title}</h2>
      {children}
    </div>
  );
}

function Row({ children }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}

function Field({ label, children }) {
  return (
    <div>
      <label>{label}</label>
      {children}
    </div>
  );
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
  extra_notes: '',
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
          if (BOOL_FIELDS.includes(key)) {
            normalized[key] = Boolean(data[key]);
          } else {
            normalized[key] = data[key] ?? '';
          }
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
    setSaving(true);
    setError('');
    try {
      const payload = { ...form };
      if (isEdit) {
        await api.updateConcert(id, payload);
        navigate(`/conciertos/${id}`);
      } else {
        const concert = await api.createConcert(payload);
        navigate(`/conciertos/${concert.id}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="btn-secondary flex items-center gap-2 text-sm">
          <ChevronLeft size={16} /> Volver
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">
            {isEdit ? 'Editar concierto' : 'Nuevo concierto'}
          </h1>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3 mb-6">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

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
        </Section>

        {/* Transporte */}
        <Section title="Transporte">
          <Field label="IDA — Detalles generales">
            <textarea
              value={form.transport_ida}
              onChange={e => set('transport_ida', e.target.value)}
              placeholder="Ej: Tren a Valencia, coordinar con Tata (637741797)"
              rows={2}
              className="resize-none"
            />
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
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
            <Field label="Check-in">
              <input value={form.hotel_checkin} onChange={e => set('hotel_checkin', e.target.value)} placeholder="14:00h" />
            </Field>
            <Field label="Check-out">
              <input value={form.hotel_checkout} onChange={e => set('hotel_checkout', e.target.value)} placeholder="12:30h" />
            </Field>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
            <textarea
              value={form.extra_notes}
              onChange={e => set('extra_notes', e.target.value)}
              placeholder="Cualquier info extra..."
              rows={3}
              className="resize-none"
            />
          </Field>
        </Section>

        {/* Actions */}
        <div className="flex items-center gap-3 pb-8">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            <Save size={16} />
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear concierto'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
