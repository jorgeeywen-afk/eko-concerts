import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api';
import { ChevronLeft, MapPin, Clock, Hotel, Mic, Calendar, Phone } from 'lucide-react';

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
          <a href={`tel:${value}`} className="text-indigo-400 hover:underline flex items-center gap-1 justify-end">
            <Phone size={12} /> {value}
          </a>
        ) : String(value)}
      </span>
    </div>
  );
}

function Section({ title, icon: Icon, children, highlight }) {
  return (
    <div className={`rounded-xl border p-5 ${highlight ? 'bg-indigo-600/10 border-indigo-600/30' : 'card'}`}>
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon size={14} className={highlight ? 'text-indigo-400' : 'text-zinc-500'} />}
        <h2 className={`section-title mb-0 ${highlight ? 'text-indigo-400' : ''}`}>{title}</h2>
      </div>
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
    api.getConcert(id)
      .then(setConcert)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!concert) return <div className="p-4 md:p-8 text-zinc-500">Concierto no encontrado.</div>;

  const myInfo = concert.members?.find(m => m.id === user?.id);

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
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

      <div className="space-y-5">
        {/* Mi info personal — destacada */}
        {myInfo && (
          <Section title="Tu info para este concierto" icon={null} highlight>
            <div className="space-y-3">
              {myInfo.room && (
                <div className="flex items-center gap-3 bg-indigo-600/10 rounded-lg px-4 py-3">
                  <span className="text-2xl">🛏</span>
                  <div>
                    <p className="text-xs text-indigo-300 mb-0.5">Habitación</p>
                    <p className="font-semibold text-zinc-100">{myInfo.room}</p>
                  </div>
                </div>
              )}
              {myInfo.transport_ida && (
                <div className="flex items-center gap-3 bg-zinc-800/60 rounded-lg px-4 py-3">
                  <span className="text-xl">→</span>
                  <div>
                    <p className="text-xs text-zinc-500 mb-0.5">Transporte IDA</p>
                    <p className="text-sm text-zinc-200">{myInfo.transport_ida}</p>
                  </div>
                </div>
              )}
              {myInfo.transport_vuelta && (
                <div className="flex items-center gap-3 bg-zinc-800/60 rounded-lg px-4 py-3">
                  <span className="text-xl">←</span>
                  <div>
                    <p className="text-xs text-zinc-500 mb-0.5">Transporte VUELTA</p>
                    <p className="text-sm text-zinc-200">{myInfo.transport_vuelta}</p>
                  </div>
                </div>
              )}
              {!myInfo.room && !myInfo.transport_ida && !myInfo.transport_vuelta && (
                <p className="text-sm text-indigo-300/60">Tu transporte y habitación se añadirán pronto.</p>
              )}
            </div>
          </Section>
        )}

        {/* Transporte general */}
        {concert.transport_ida && (
          <Section title="Transporte general" icon={MapPin}>
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
          <InfoRow label="Distancia a sala" value={concert.distance_hotel_venue} />
        </Section>

        {/* Horarios */}
        <Section title="Horarios" icon={Clock}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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

        {/* Contactos */}
        {(concert.contact_venue_name || concert.contact_booking_name || concert.guest_list > 0) && (
          <Section title="Contactos y notas">
            {concert.guest_list > 0 && <InfoRow label="Lista invitados" value={`${concert.guest_list} personas`} />}
            {concert.catering && <InfoRow label="Catering" value={concert.catering} />}
            {concert.contact_venue_name && (
              <InfoRow label={`Jefe sala — ${concert.contact_venue_name}`} value={concert.contact_venue_phone} phone />
            )}
            {concert.contact_booking_name && (
              <InfoRow label={`Booking — ${concert.contact_booking_name}`} value={concert.contact_booking_phone} phone />
            )}
            {concert.extra_notes && (
              <div className="mt-3 pt-3 border-t border-zinc-800">
                <p className="text-xs text-zinc-500 mb-1">Notas</p>
                <p className="text-sm text-zinc-300 whitespace-pre-wrap">{concert.extra_notes}</p>
              </div>
            )}
          </Section>
        )}
      </div>
    </div>
  );
}
