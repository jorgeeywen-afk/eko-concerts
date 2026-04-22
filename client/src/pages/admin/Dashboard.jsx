import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api';
import { Plus, Users, AlignJustify, X, Edit, Trash2, ChevronRight } from 'lucide-react';

/* ── City coordinates ── */
const CITY_COORDS = {
  madrid: [40.4168, -3.7038], barcelona: [41.3851, 2.1734],
  valencia: [39.4699, -0.3763], sevilla: [37.3891, -5.9845],
  bilbao: [43.2630, -2.9350], málaga: [36.7213, -4.4214],
  granada: [37.1773, -3.5986], zaragoza: [41.6488, -0.8891],
  murcia: [37.9922, -1.1307], palma: [39.5696, 2.6502],
  las_palmas: [28.1235, -15.4363], tenerife: [28.4636, -16.2518],
  valladolid: [41.6523, -4.7245], alicante: [38.3452, -0.4810],
  córdoba: [37.8882, -4.7794], vitoria: [42.8467, -2.6728],
  san_sebastián: [43.3183, -1.9812], santander: [43.4623, -3.8099],
  oviedo: [43.3614, -5.8593], pamplona: [42.8169, -1.6432],
};

function getCityCoords(cityName) {
  if (!cityName) return [40, -3.5];
  const key = cityName.toLowerCase().replace(/\s+/g, '_').normalize('NFD').replace(/[̀-ͯ]/g, '');
  return CITY_COORDS[key] || CITY_COORDS[cityName.toLowerCase()] || [40, -3.5];
}

/* ── Date helpers ── */
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
function isUpcoming(d) {
  if (!d) return false;
  return new Date(d + 'T00:00:00') >= new Date(new Date().toDateString());
}
function daysUntil(d) {
  if (!d) return null;
  const diff = new Date(d + 'T00:00:00') - new Date(new Date().toDateString());
  return Math.ceil(diff / 86400000);
}

/* ── Build synthetic event list from concert data ── */
function buildEvents(concerts) {
  const events = [];
  concerts.forEach(c => {
    const coord = getCityCoords(c.city);
    events.push({
      id: `show-${c.id}`,
      concertId: c.id,
      type: 'show',
      city: c.city,
      date: c.date,
      time: c.show_time || c.doors || '',
      title: c.venue_name || c.city,
      sub: c.venue_capacity ? `Aforo ${c.venue_capacity}` : '',
      status: c.status || c.show_status || 'confirmed',
      coord,
      concert: c,
    });
    if (c.hotel_name) {
      events.push({
        id: `hotel-${c.id}`,
        concertId: c.id,
        type: 'hotel',
        city: c.city,
        date: c.date,
        time: c.hotel_checkin || '',
        title: c.hotel_name,
        sub: c.hotel_address || '',
        status: 'confirmed',
        coord,
        concert: c,
      });
    }
    if (c.transport_ida) {
      events.push({
        id: `transfer-${c.id}`,
        concertId: c.id,
        type: 'transfer',
        city: c.city,
        date: c.date,
        time: c.get_in || '',
        title: c.transport_ida,
        sub: '',
        status: 'confirmed',
        coord,
        concert: c,
      });
    }
  });
  return events;
}

/* ── Tour Map ── */
function TourMap({ cities, events, activeEventId, filter, onEventClick, mapRef }) {
  const ref = useRef(null);
  const map = useRef(null);
  const markersLayer = useRef(null);

  if (mapRef) mapRef.current = map;

  const renderMarkers = useCallback((activeId, filterType, evs) => {
    if (!markersLayer.current || !window.L) return;
    const L = window.L;
    markersLayer.current.clearLayers();

    evs.forEach(ev => {
      const visible = filterType === 'all' || ev.type === filterType;
      if (!visible) return;
      const active = ev.id === activeId;

      let html;
      if (ev.type === 'show') {
        const cityIdx = cities.findIndex(c => c.city === ev.city) + 1;
        html = `<div class="v2-pin-show ${active ? 'active' : ''}">
          <div class="bubble">
            <div class="num">${cityIdx}</div>
            <div class="lbl">${ev.city}</div>
          </div>
          <div class="tail"></div>
        </div>`;
      } else if (ev.type === 'hotel') {
        html = `<div class="v2-pin-hotel ${active ? 'active' : ''}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20V10l9-6 9 6v10"/><path d="M9 20v-6h6v6"/></svg>
        </div>`;
      } else {
        html = `<div class="v2-pin-transfer ${active ? 'active' : ''}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 12h14M13 6l6 6-6 6"/></svg>
        </div>`;
      }

      const sizes = { show: [140, 54], hotel: [26, 26], transfer: [22, 22] };
      const anchors = { show: [70, 54], hotel: [13, 13], transfer: [11, 11] };
      const t = ev.type;

      const icon = L.divIcon({
        className: '',
        html,
        iconSize: sizes[t],
        iconAnchor: anchors[t],
      });
      const m = L.marker(ev.coord, { icon }).addTo(markersLayer.current);
      m.bindTooltip(
        `<div class="v2-tip-title">${ev.title}</div><div class="v2-tip-sub">${ev.city} · ${formatDateShort(ev.date)}${ev.time ? ' · ' + ev.time : ''}</div>`,
        { direction: 'top', offset: [0, -10], className: 'v2-tip' }
      );
      m.on('click', () => onEventClick(ev));
    });
  }, [cities, onEventClick]);

  useEffect(() => {
    if (!ref.current || map.current || !window.L || cities.length === 0) return;
    const L = window.L;
    const m = L.map(ref.current, { zoomControl: true, attributionControl: true }).setView([40, -3.5], 6);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap · © CARTO',
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(m);

    // Warm sepia filter on tiles
    const style = document.createElement('style');
    style.textContent = `.leaflet-tile-pane { filter: sepia(.2) saturate(.85) brightness(1.02); }
    .leaflet-control-zoom { border: none !important; border-radius: 14px !important; overflow: hidden; margin: 20px !important; box-shadow: 0 6px 18px rgba(58,46,36,.12); }
    .leaflet-control-zoom a { background: var(--paper) !important; color: var(--ink) !important; border: none !important; border-bottom: 1px solid var(--line,rgba(58,46,36,.12)) !important; width: 36px !important; height: 36px !important; line-height: 36px !important; font-size: 18px !important; }
    .leaflet-control-zoom a:last-child { border-bottom: none !important; }
    .leaflet-control-zoom a:hover { background: var(--bg-2,#ede4d2) !important; color: var(--accent) !important; }
    .leaflet-control-attribution { background: rgba(250,245,234,.8) !important; color: var(--ink-3,#9c8975) !important; font-size: 9px !important; border: none !important; border-radius: 4px !important; }`;
    document.head.appendChild(style);

    // Route lines
    if (cities.length > 1) {
      const coords = cities.map(c => c.coord);
      L.polyline(coords, { color: '#c2674a', weight: 10, opacity: 0.07 }).addTo(m);
      L.polyline(coords, { color: '#c2674a', weight: 2.5, opacity: 0.85, dashArray: '4 10' }).addTo(m);
    }

    markersLayer.current = L.layerGroup().addTo(m);
    m.fitBounds([[36, -10], [44, 4.2]], { padding: [70, 70] });
    map.current = m;
    renderMarkers(activeEventId, filter, events);
    setTimeout(() => m.invalidateSize(), 100);
    return () => {
      m.remove();
      map.current = null;
      markersLayer.current = null;
      style.remove();
    };
  }, [cities]); // eslint-disable-line

  useEffect(() => {
    renderMarkers(activeEventId, filter, events);
  }, [activeEventId, filter, events, renderMarkers]);

  return <div ref={ref} style={{ position: 'absolute', inset: 0 }} />;
}

/* ── Detail Sheet ── */
function DetailSheet({ event, onClose, onEdit, onDelete }) {
  if (!event) return null;
  const c = event.concert;
  const typeLabel = { show: 'Concierto', hotel: 'Hotel', transfer: 'Transporte' }[event.type];

  return (
    <aside style={{
      position: 'absolute', top: 0, right: 0, bottom: 0, width: 420, maxWidth: '92vw',
      zIndex: 600, background: 'var(--paper)', borderLeft: '1px solid rgba(58,46,36,.12)',
      boxShadow: '-12px 0 40px rgba(58,46,36,.1)',
      display: 'flex', flexDirection: 'column',
      transform: 'translateX(0)',
      transition: 'transform .3s cubic-bezier(.3,.8,.2,1)',
    }}>
      {/* Head */}
      <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid rgba(58,46,36,.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>
          {typeLabel}
          {event.status && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 9px', borderRadius: 999, fontSize: 11, fontWeight: 500, marginLeft: 8,
              background: event.status === 'pending' ? 'rgba(199,154,79,.18)' : 'rgba(122,154,111,.18)',
              color: event.status === 'pending' ? '#7a5c28' : '#556e4d',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: event.status === 'pending' ? '#c79a4f' : '#7a9a6f' }} />
              {event.status === 'pending' ? 'Pendiente' : 'Confirmado'}
            </span>
          )}
        </div>
        <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 30, margin: '0 0 4px', color: 'var(--ink)', letterSpacing: '-.015em', lineHeight: 1.1 }}>
          {event.title}
        </h2>
        <div style={{ color: 'var(--ink-2)', fontSize: 13 }}>{event.city} · {formatDateLong(event.date)}</div>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 20, right: 20, width: 34, height: 34, borderRadius: '50%', border: '1px solid rgba(58,46,36,.12)', background: 'var(--paper)', color: 'var(--ink-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}
        >×</button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 80px' }}>
        {/* Hero timing */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: 'var(--bg-2,#ede4d2)', borderRadius: 16, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--paper)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {event.type === 'show' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>}
            {event.type === 'hotel' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20V10l9-6 9 6v10"/><path d="M9 20v-6h6v6"/></svg>}
            {event.type === 'transfer' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 12h14M13 6l6 6-6 6"/></svg>}
          </div>
          <div>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 17, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.2 }}>
              {event.type === 'show' && (c.show_time ? `Show a las ${c.show_time}` : event.title)}
              {event.type === 'hotel' && `Check-in ${event.time || c.hotel_checkin || '—'}`}
              {event.type === 'transfer' && `Salida ${event.time || c.get_in || '—'}`}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>
              {event.type === 'show' && `Soundcheck ${c.sound_check || '—'} · Puertas ${c.doors || '—'}`}
              {event.type === 'hotel' && event.sub}
              {event.type === 'transfer' && event.title}
            </div>
          </div>
        </div>

        {/* Info grid */}
        <InfoSection title="Información">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {event.type === 'show' && (<>
              {c.venue_name && <InfoCard label="Sala" value={c.venue_name} wide />}
              {c.venue_address && <InfoCard label="Dirección" value={c.venue_address} wide />}
              {c.venue_capacity && <InfoCard label="Aforo" value={c.venue_capacity} />}
              {c.show_time && <InfoCard label="Show" value={c.show_time} />}
              {c.doors && <InfoCard label="Puertas" value={c.doors} />}
              {c.sound_check && <InfoCard label="Soundcheck" value={c.sound_check} />}
              {c.curfew && <InfoCard label="Curfew" value={c.curfew} />}
              {c.contact_booking_name && <InfoCard label="Promotor" value={c.contact_booking_name} wide />}
              {c.contact_booking_phone && <InfoCard label="Contacto" value={c.contact_booking_phone} wide phone />}
            </>)}
            {event.type === 'hotel' && (<>
              <InfoCard label="Hotel" value={c.hotel_name} wide />
              {c.hotel_address && <InfoCard label="Dirección" value={c.hotel_address} wide />}
              {c.hotel_checkin && <InfoCard label="Check-in" value={c.hotel_checkin} />}
              {c.hotel_checkout && <InfoCard label="Check-out" value={c.hotel_checkout} />}
              {c.hotel_booking_code && <InfoCard label="Reserva" value={c.hotel_booking_code} wide />}
              {c.hotel_phone && <InfoCard label="Teléfono" value={c.hotel_phone} wide phone />}
            </>)}
            {event.type === 'transfer' && (<>
              <InfoCard label="Transporte" value={c.transport_ida} wide />
              {c.get_in && <InfoCard label="Get In" value={c.get_in} />}
            </>)}
          </div>
        </InfoSection>

        {/* Team */}
        {c.members?.length > 0 && (
          <InfoSection title={`Equipo · ${c.members.length} personas`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {c.members.map(m => (
                <div key={m.cm_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-2,#ede4d2)', borderRadius: 12 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--paper)', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 12, flexShrink: 0 }}>
                    {m.name?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink)' }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-2)' }}>{m.user_role === 'producer' ? 'Productor' : 'Artista'}</div>
                  </div>
                  {m.room && <div style={{ fontSize: 11, color: 'var(--ink-2)' }}>Hab. {m.room}</div>}
                </div>
              ))}
            </div>
          </InfoSection>
        )}

        {/* Notes */}
        {c.extra_notes && (
          <InfoSection title="Notas">
            <div style={{ background: 'rgba(194,103,74,.12)', borderRadius: 14, padding: '14px 16px', fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink)' }}>
              <div style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 13, color: 'var(--accent)', marginBottom: 4 }}>Recuerda</div>
              {c.extra_notes}
            </div>
          </InfoSection>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24 }}>
          <button className="btn-primary" onClick={() => onEdit(c.id)} style={{ flex: 1, justifyContent: 'center' }}>
            <Edit size={13} /> Editar
          </button>
          <button className="btn-secondary" onClick={() => onDelete(c.id)} style={{ flex: 1, justifyContent: 'center' }}>
            <Trash2 size={13} /> Eliminar
          </button>
        </div>
      </div>
    </aside>
  );
}

function InfoSection({ title, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 11, color: 'var(--ink-2)', fontWeight: 500, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

function InfoCard({ label, value, wide, phone }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ background: 'var(--bg-2,#ede4d2)', borderRadius: 14, padding: '12px 14px', ...(wide ? { gridColumn: 'span 2' } : {}) }}>
      <div style={{ fontSize: 11, color: 'var(--ink-2)', marginBottom: 4, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.25 }}>
        {phone ? <a href={`tel:${value}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>{value}</a> : String(value)}
      </div>
    </div>
  );
}

/* ── Agenda Panel ── */
function AgendaPanel({ concerts, onClose, onSelect }) {
  const sorted = [...concerts].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.3)', zIndex: 700 }} onClick={onClose} />
      <aside style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: 380, maxWidth: '92vw',
        zIndex: 701, background: 'var(--paper)', borderRight: '1px solid rgba(58,46,36,.12)',
        boxShadow: '12px 0 40px rgba(58,46,36,.1)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid rgba(58,46,36,.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 26, margin: 0, color: 'var(--ink)' }}>Agenda</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-2)', padding: 4 }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {sorted.map((concert, i) => (
            <button
              key={concert.id}
              onClick={() => onSelect(concert)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 16,
                padding: '16px 28px', textAlign: 'left', border: 'none', cursor: 'pointer',
                background: 'transparent', borderTop: i > 0 ? '1px solid rgba(58,46,36,.07)' : 'none',
                transition: 'background .12s',
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(194,103,74,.08)'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ minWidth: 40, textAlign: 'center' }}>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 500, color: 'var(--ink)', lineHeight: 1 }}>
                  {new Date(concert.date + 'T00:00:00').getDate()}
                </div>
                <div style={{ fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', marginTop: 1 }}>
                  {new Date(concert.date + 'T00:00:00').toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')}
                </div>
              </div>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: concert.status === 'pending' ? '#c79a4f' : '#7a9a6f', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>{concert.city}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 1 }}>{concert.venue_name || 'Sin sala'}{concert.show_time ? ` · ${concert.show_time}` : ''}</div>
              </div>
              <ChevronRight size={16} color="var(--ink-3)" />
            </button>
          ))}
        </div>
      </aside>
    </>
  );
}

/* ── Main Dashboard ── */
export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const mapRef = useRef(null);

  const [concerts, setConcerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeEventId, setActiveEventId] = useState(null);
  const [sheetEvent, setSheetEvent] = useState(null);
  const [filter, setFilter] = useState('all');
  const [agendaOpen, setAgendaOpen] = useState(false);

  const load = useCallback(() => {
    api.getConcerts()
      .then(data => {
        setConcerts(data);
        if (data.length > 0) {
          const sorted = [...data].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
          const next = sorted.find(c => isUpcoming(c.date)) || sorted[0];
          if (next) setActiveEventId(`show-${next.id}`);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  /* Derived */
  const sortedConcerts = [...concerts].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const cities = (() => {
    const seen = new Set();
    const result = [];
    sortedConcerts.forEach(c => {
      if (!seen.has(c.city)) {
        seen.add(c.city);
        result.push({ city: c.city, coord: getCityCoords(c.city) });
      }
    });
    return result;
  })();
  const events = buildEvents(sortedConcerts);
  const nextConcert = sortedConcerts.find(c => isUpcoming(c.date));

  const openEvent = (ev, centerMap) => {
    setActiveEventId(ev.id);
    setSheetEvent(ev);
    if (centerMap && mapRef.current?.current) {
      mapRef.current.current.flyTo(ev.coord, Math.max(mapRef.current.current.getZoom(), 10), { duration: 0.9 });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este concierto?')) return;
    await api.deleteConcert(id);
    setSheetEvent(null);
    load();
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: 28, height: 28, border: '2.5px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (concerts.length === 0) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
        <Topbar user={user} onLogout={handleLogout} onAgenda={() => setAgendaOpen(true)} onNew={() => navigate('/conciertos/nuevo')} onMembers={() => navigate('/miembros')} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 48, color: 'var(--ink-3)' }}>♪</div>
          <h2 style={{ fontFamily: 'Fraunces, serif', color: 'var(--ink)', margin: 0 }}>Sin conciertos todavía</h2>
          <p style={{ color: 'var(--ink-2)', fontSize: 14, margin: 0 }}>Crea el primero para empezar a gestionar la gira.</p>
          <button className="btn-primary" onClick={() => navigate('/conciertos/nuevo')}>
            <Plus size={14} /> Nuevo concierto
          </button>
        </div>
      </div>
    );
  }

  const days = nextConcert ? daysUntil(nextConcert.date) : null;
  const nextShowEvent = nextConcert ? events.find(e => e.concertId === nextConcert.id && e.type === 'show') : null;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
      <Topbar user={user} onLogout={handleLogout} onAgenda={() => setAgendaOpen(true)} onNew={() => navigate('/conciertos/nuevo')} onMembers={() => navigate('/miembros')} />

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Map */}
        <TourMap
          cities={cities}
          events={events}
          activeEventId={activeEventId}
          filter={filter}
          onEventClick={ev => openEvent(ev, true)}
          mapRef={mapRef}
        />

        {/* Filter chips — top left */}
        <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 500, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['all', 'Todo'], ['show', 'Conciertos', 'var(--accent)'], ['hotel', 'Hoteles', '#8ea7b8'], ['transfer', 'Viajes', 'var(--ink-3)']].map(([v, label, color]) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              style={{
                padding: '8px 14px', borderRadius: 999,
                background: filter === v ? 'var(--ink)' : 'var(--paper)',
                border: `1px solid ${filter === v ? 'var(--ink)' : 'rgba(58,46,36,.12)'}`,
                color: filter === v ? 'var(--paper)' : 'var(--ink-2)',
                fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: '.15s',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                boxShadow: '0 2px 8px rgba(58,46,36,.08)',
              }}
            >
              {color && v !== 'all' && <span style={{ width: 7, height: 7, borderRadius: '50%', background: filter === v ? 'var(--paper)' : color }} />}
              {label}
            </button>
          ))}
        </div>

        {/* Next concert card — top right */}
        {nextConcert && nextShowEvent && (
          <div style={{
            position: 'absolute', top: 20, right: sheetEvent ? 440 : 20, zIndex: 500,
            background: 'var(--paper)', border: '1px solid rgba(58,46,36,.1)', borderRadius: 20,
            padding: '18px 22px', minWidth: 280, maxWidth: 330,
            boxShadow: '0 12px 32px rgba(58,46,36,.12)',
            transition: 'right .3s cubic-bezier(.3,.8,.2,1)',
          }}>
            <div style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '.04em', fontWeight: 600, textTransform: 'uppercase' }}>Tu próxima parada</div>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 24, fontWeight: 500, margin: '4px 0 0', color: 'var(--ink)', letterSpacing: '-.01em', lineHeight: 1.1 }}>
              {nextConcert.city}
            </h3>
            <div style={{ color: 'var(--ink-2)', fontSize: 13, marginTop: 3 }}>
              {nextConcert.venue_name || 'Sin sala'}{nextConcert.show_time ? ` · ${nextConcert.show_time}` : ''}
            </div>
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: 'Fraunces, serif', fontSize: 38, fontWeight: 500, color: 'var(--accent)', lineHeight: 1, fontStyle: 'italic' }}>
                {days === 0 ? '¡Hoy!' : days === 1 ? '1 día' : `${days} días`}
              </span>
              {days > 0 && <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>para el show</span>}
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
              <button
                onClick={() => openEvent(nextShowEvent, true)}
                style={{ padding: '9px 14px', borderRadius: 999, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', background: 'var(--accent)', color: 'var(--paper)', border: 'none', transition: '.15s' }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--accent-2)'}
                onMouseOut={e => e.currentTarget.style.background = 'var(--accent)'}
              >
                Ver detalles
              </button>
              <button
                onClick={() => { if (mapRef.current?.current) mapRef.current.current.flyTo(getCityCoords(nextConcert.city), 10, { duration: .9 }); }}
                style={{ padding: '9px 14px', borderRadius: 999, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', background: 'transparent', color: 'var(--ink-2)', border: '1px solid rgba(58,46,36,.12)', transition: '.15s' }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(58,46,36,.05)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                Centrar mapa
              </button>
            </div>
          </div>
        )}

        {/* Bottom city dock */}
        <div style={{
          position: 'absolute', bottom: 22, left: '50%', transform: 'translateX(-50%)', zIndex: 500,
          background: 'var(--paper)', border: '1px solid rgba(58,46,36,.1)', borderRadius: 22,
          padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 6,
          boxShadow: '0 12px 32px rgba(58,46,36,.12)',
          maxWidth: 'calc(100vw - 40px)', overflowX: 'auto',
        }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 14, color: 'var(--ink-2)', padding: '0 8px 0 4px', whiteSpace: 'nowrap', fontStyle: 'italic' }} className="dock-title-desktop">
            Tu ruta
          </div>
          {cities.map((c, i) => {
            const cityShows = sortedConcerts.filter(x => x.city === c.city);
            const firstDate = cityShows[0]?.date;
            const done = firstDate && !isUpcoming(firstDate);
            const activeShowEv = events.find(e => e.city === c.city && e.type === 'show');
            const isActive = activeEventId && events.find(e => e.id === activeEventId)?.city === c.city;
            return (
              <div key={c.city} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {i > 0 && (
                  <div style={{ width: 16, height: 1, background: 'rgba(58,46,36,.15)', flexShrink: 0 }}>
                    <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(58,46,36,.2)', margin: '-1px auto' }} />
                  </div>
                )}
                <button
                  onClick={() => activeShowEv && openEvent(activeShowEv, true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9, padding: '9px 14px', borderRadius: 14,
                    border: 'none', cursor: 'pointer', transition: '.15s', minWidth: 0,
                    background: isActive ? 'rgba(194,103,74,.15)' : 'transparent',
                  }}
                  onMouseOver={e => { if (!isActive) e.currentTarget.style.background = 'rgba(58,46,36,.05)'; }}
                  onMouseOut={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontWeight: 500, fontSize: 14,
                    background: isActive ? 'var(--accent)' : done ? '#8da88a' : 'rgba(58,46,36,.08)',
                    color: isActive || done ? 'var(--paper)' : 'var(--ink-2)',
                  }}>{i + 1}</div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{c.city}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-2)', marginTop: 1 }} className="dock-date-desktop">
                      {firstDate ? formatDateShort(firstDate) : ''}
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Detail sheet */}
        {sheetEvent && (
          <DetailSheet
            event={sheetEvent}
            onClose={() => setSheetEvent(null)}
            onEdit={(id) => { navigate(`/conciertos/${id}/editar`); setSheetEvent(null); }}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Agenda panel */}
      {agendaOpen && (
        <AgendaPanel
          concerts={sortedConcerts}
          onClose={() => setAgendaOpen(false)}
          onSelect={concert => {
            setAgendaOpen(false);
            const ev = events.find(e => e.concertId === concert.id && e.type === 'show');
            if (ev) openEvent(ev, true);
          }}
        />
      )}

      <style>{`
        .dock-title-desktop { display: block; }
        .dock-date-desktop { display: block; }
        @media (max-width: 640px) {
          .dock-title-desktop { display: none !important; }
          .dock-date-desktop { display: none !important; }
        }
      `}</style>
    </div>
  );
}

/* ── Topbar ── */
function Topbar({ user, onLogout, onAgenda, onNew, onMembers }) {
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'A';
  return (
    <header style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '12px 24px',
      background: 'var(--paper)', borderBottom: '1px solid rgba(58,46,36,.1)',
      flexShrink: 0, zIndex: 20,
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent), var(--accent-2,#d4836a))',
          color: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 17, fontWeight: 500,
        }}>Jp</div>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-.01em' }}>
            John Pollon
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-2)', marginTop: 1 }}>Gestión de gira</div>
        </div>
      </div>

      {/* Right side */}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
        {/* Agenda */}
        <button
          onClick={onAgenda}
          title="Agenda"
          style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(58,46,36,.12)', background: 'transparent', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '.15s' }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(58,46,36,.06)'}
          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
        >
          <AlignJustify size={15} />
        </button>

        {/* Members */}
        <button
          onClick={onMembers}
          title="Miembros"
          style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(58,46,36,.12)', background: 'transparent', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '.15s' }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(58,46,36,.06)'}
          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
        >
          <Users size={15} />
        </button>

        {/* New concert */}
        <button className="btn-primary" onClick={onNew} style={{ padding: '8px 14px', borderRadius: 999, fontSize: 12.5 }}>
          <Plus size={13} /> Nuevo
        </button>

        {/* Avatar */}
        <button
          onClick={onLogout}
          title={`${user?.name} · Cerrar sesión`}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #8da88a, #a9bf99)',
            color: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer',
          }}
        >{initials}</button>
      </div>
    </header>
  );
}
