import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api';
import { Plus, Edit, Trash2, X, MapPin, Clock, Hotel, Phone, Users, ChevronLeft } from 'lucide-react';

/* ── Geo lookup for Spanish cities ── */
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
  logroño: [42.4627, -2.4450], burgos: [42.3440, -3.6969],
  salamanca: [40.9701, -5.6635], toledo: [39.8628, -4.0273],
  albacete: [38.9943, -1.8585],
};

function getCityCoords(cityName) {
  if (!cityName) return [40, -3.5];
  const key = cityName.toLowerCase().replace(/\s+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return CITY_COORDS[key] || CITY_COORDS[cityName.toLowerCase()] || [40, -3.5];
}

/* ── Date helpers ── */
function formatDateLong(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  const wd = dt.toLocaleDateString('es-ES', { weekday: 'long' });
  return wd.charAt(0).toUpperCase() + wd.slice(1) + ', ' +
    dt.getDate() + ' ' + dt.toLocaleDateString('es-ES', { month: 'long' });
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

/* ── Build synthetic itinerary events from a concert row ── */
function buildEvents(c) {
  const evs = [];
  if (c.hotel_name && c.hotel_checkin) {
    evs.push({ type: 'hotel', time: c.hotel_checkin, title: c.hotel_name, sub: c.hotel_address || '' });
  }
  if (c.transport_ida) {
    evs.push({ type: 'transfer', time: c.get_in || '', title: 'Transporte IDA', sub: c.transport_ida });
  }
  evs.push({
    type: 'show',
    time: c.show_time || c.doors || '',
    title: c.venue_name || 'Concierto',
    sub: c.venue_address || (c.venue_capacity ? `Aforo ${c.venue_capacity}` : ''),
  });
  return evs.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
}

const TYPE_LABEL = { show: 'Concierto', hotel: 'Hotel', transfer: 'Viaje', meeting: 'Reunión' };
const TYPE_COLOR = { show: 'var(--accent)', hotel: '#8da88a', transfer: '#8ea7b8', meeting: '#c79a4f' };

/* ──────────────────────────────
   MINI MAP
────────────────────────────── */
function MiniMap({ cities, activeCity, onCityClick }) {
  const ref = useRef(null);
  const map = useRef(null);
  const pinsLayer = useRef(null);

  const renderPins = useCallback((activeId) => {
    if (!pinsLayer.current) return;
    pinsLayer.current.clearLayers();
    cities.forEach(c => {
      const L = window.L;
      const active = c.city === activeId;
      const icon = L.divIcon({
        className: '',
        html: `<div class="pin-mini ${active ? 'active' : ''}"></div>`,
        iconSize: [10, 10], iconAnchor: [5, 5]
      });
      const m = L.marker(c.coord, { icon }).addTo(pinsLayer.current);
      m.on('click', () => onCityClick(c.city));
    });
  }, [cities, onCityClick]);

  useEffect(() => {
    if (!ref.current || map.current || !window.L || cities.length === 0) return;
    const L = window.L;
    const m = L.map(ref.current, {
      zoomControl: false, attributionControl: false,
      dragging: false, scrollWheelZoom: false, doubleClickZoom: false,
      boxZoom: false, keyboard: false, touchZoom: false
    }).setView([40, -3.5], 5);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png',
      { subdomains: 'abcd', maxZoom: 10 }
    ).addTo(m);
    if (cities.length > 1) {
      L.polyline(cities.map(c => c.coord), { color: 'var(--accent)', weight: 2, opacity: .6, dashArray: '3 6' }).addTo(m);
    }
    pinsLayer.current = L.layerGroup().addTo(m);
    m.fitBounds([[36, -9.5], [44, 4]], { padding: [10, 10] });
    map.current = m;
    renderPins(activeCity);
    return () => { m.remove(); map.current = null; pinsLayer.current = null; };
  }, [cities, activeCity, renderPins]);

  useEffect(() => { renderPins(activeCity); }, [activeCity, renderPins]);

  return (
    <div ref={ref} style={{ height: 140, borderRadius: 10, overflow: 'hidden', background: '#e8e0d4' }} />
  );
}

/* ──────────────────────────────
   FULL MAP
────────────────────────────── */
function FullMap({ cities, activeCity, onCityClick }) {
  const ref = useRef(null);
  const map = useRef(null);
  const pinsLayer = useRef(null);

  const renderPins = useCallback((activeId) => {
    if (!pinsLayer.current || !window.L) return;
    const L = window.L;
    pinsLayer.current.clearLayers();
    cities.forEach((c, i) => {
      const active = c.city === activeId;
      const icon = L.divIcon({
        className: '',
        html: `<div class="pin-show ${active ? 'active' : ''}"><div class="bubble"><div class="num">${i + 1}</div><div class="lbl">${c.city}</div></div><div class="tail"></div></div>`,
        iconSize: [120, 50], iconAnchor: [60, 50]
      });
      const m = L.marker(c.coord, { icon }).addTo(pinsLayer.current);
      m.on('click', () => onCityClick(c.city));
    });
  }, [cities, onCityClick]);

  useEffect(() => {
    if (!ref.current || map.current || !window.L || cities.length === 0) return;
    const L = window.L;
    const m = L.map(ref.current, { zoomControl: true, attributionControl: true }).setView([40, -3.5], 6);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      { attribution: '© OpenStreetMap · © CARTO', maxZoom: 19, subdomains: 'abcd' }
    ).addTo(m);
    if (cities.length > 1) {
      L.polyline(cities.map(c => c.coord), { color: '#c2674a', weight: 10, opacity: .06 }).addTo(m);
      L.polyline(cities.map(c => c.coord), { color: '#c2674a', weight: 2.5, opacity: .9, dashArray: '4 10' }).addTo(m);
    }
    pinsLayer.current = L.layerGroup().addTo(m);
    m.fitBounds([[36, -10], [44, 4.2]], { padding: [60, 60] });
    map.current = m;
    renderPins(activeCity);
    setTimeout(() => m.invalidateSize(), 50);
    return () => { m.remove(); map.current = null; pinsLayer.current = null; };
  }, [cities, activeCity, renderPins]);

  useEffect(() => {
    renderPins(activeCity);
    if (map.current && activeCity) {
      const c = cities.find(x => x.city === activeCity);
      if (c) map.current.flyTo(c.coord, 7, { duration: .8 });
    }
  }, [activeCity, cities, renderPins]);

  return (
    <div ref={ref} style={{ position: 'absolute', inset: 0 }} />
  );
}

/* ──────────────────────────────
   DETAIL SHEET
────────────────────────────── */
function DetailSheet({ concert, onClose, onEdit, onDelete }) {
  if (!concert) return null;
  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <aside className="sheet-panel">
        <div style={{ padding: '24px 28px', borderBottom: '1.5px solid var(--border-2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ink-3)', marginBottom: 6 }}>Concierto</div>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 26, margin: '0 0 4px', color: 'var(--ink)' }}>
                {concert.city}
              </h2>
              <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>{formatDateLong(concert.date)}</div>
              {concert.show_status && (
                <div style={{ marginTop: 10 }}>
                  <span className={concert.show_status === 'pending' ? 'chip-pending' : 'chip-confirmed'}>
                    {concert.show_status === 'pending' ? 'Pendiente' : 'Confirmado'}
                  </span>
                </div>
              )}
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-2)', padding: 4 }}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div style={{ padding: '20px 28px' }}>
          {/* Venue */}
          {concert.venue_name && (
            <SheetSection title="Sala / Venue">
              <SheetRow k="Sala" v={concert.venue_name} />
              <SheetRow k="Dirección" v={concert.venue_address} />
              <SheetRow k="Aforo" v={concert.venue_capacity} />
              <SheetRow k="Promotor" v={concert.contact_booking_name} />
              <SheetRow k="Contacto" v={concert.contact_booking_phone} phone />
            </SheetSection>
          )}

          {/* Horarios */}
          {(concert.get_in || concert.doors || concert.show_time || concert.sound_check) && (
            <SheetSection title="Horarios">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[['Get In', concert.get_in], ['Soundcheck', concert.sound_check], ['Puertas', concert.doors], ['Show', concert.show_time], ['Curfew', concert.curfew]].filter(([, v]) => v).map(([l, v]) => (
                  <div key={l} style={{ background: 'white', border: '1.5px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 2 }}>{l}</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>{v}</div>
                  </div>
                ))}
              </div>
            </SheetSection>
          )}

          {/* Hotel */}
          {concert.hotel_name && (
            <SheetSection title="Alojamiento">
              <SheetRow k="Hotel" v={concert.hotel_name} />
              <SheetRow k="Dirección" v={concert.hotel_address} />
              <SheetRow k="Teléfono" v={concert.hotel_phone} phone />
              <SheetRow k="Check-in" v={concert.hotel_checkin} />
              <SheetRow k="Check-out" v={concert.hotel_checkout} />
              <SheetRow k="Reserva" v={concert.hotel_booking_code} />
            </SheetSection>
          )}

          {/* Transport */}
          {concert.transport_ida && (
            <SheetSection title="Transporte">
              <SheetRow k="IDA" v={concert.transport_ida} />
            </SheetSection>
          )}

          {/* Notas */}
          {concert.extra_notes && (
            <SheetSection title="Notas">
              <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {concert.extra_notes}
              </div>
            </SheetSection>
          )}

          {/* Members */}
          {concert.members?.length > 0 && (
            <SheetSection title={`Equipo (${concert.members.length})`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {concert.members.map(m => (
                  <div key={m.cm_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', border: '1.5px solid var(--border)', borderRadius: 8, padding: '8px 12px' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{m.name}</div>
                      {m.room && <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Hab. {m.room}</div>}
                    </div>
                    {m.user_role === 'producer' && (
                      <span style={{ fontSize: 11, background: 'rgba(176,122,48,.12)', color: '#7a4e10', border: '1px solid rgba(176,122,48,.25)', borderRadius: 6, padding: '2px 7px' }}>Productor</span>
                    )}
                  </div>
                ))}
              </div>
            </SheetSection>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
            <button className="btn-primary" onClick={onEdit} style={{ flex: 1 }}>
              <Edit size={14} /> Editar
            </button>
            <button className="btn-secondary" onClick={onDelete} style={{ flex: 1, justifyContent: 'center' }}>
              <Trash2 size={14} /> Eliminar
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function SheetSection({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div className="section-title">{title}</div>
      {children}
    </div>
  );
}

function SheetRow({ k, v, phone }) {
  if (!v && v !== 0) return null;
  return (
    <div className="info-row">
      <span className="info-label">{k}</span>
      <span className="info-value">
        {phone
          ? <a href={`tel:${v}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>{v}</a>
          : String(v)}
      </span>
    </div>
  );
}

/* ──────────────────────────────
   MAIN DASHBOARD
────────────────────────────── */
export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [concerts, setConcerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('cities');         // cities | map | agenda
  const [activeCity, setActiveCity] = useState(null);
  const [sheetConcert, setSheetConcert] = useState(null);
  const [mobileSidebar, setMobileSidebar] = useState(false);

  const load = useCallback(() => {
    api.getConcerts()
      .then(data => {
        setConcerts(data);
        if (data.length > 0 && !activeCity) {
          const sorted = [...data].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
          setActiveCity(sorted[0].city);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeCity]);

  useEffect(() => { load(); }, []);

  /* Derive unique ordered cities */
  const cities = (() => {
    const seen = new Set();
    const result = [];
    [...concerts].sort((a, b) => (a.date || '').localeCompare(b.date || '')).forEach(c => {
      if (!seen.has(c.city)) {
        seen.add(c.city);
        result.push({ city: c.city, coord: getCityCoords(c.city) });
      }
    });
    return result;
  })();

  const concertsForCity = (city) =>
    concerts.filter(c => c.city === city).sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  const handleDeleteConcert = async (id) => {
    if (!confirm('¿Eliminar este concierto? Esta acción no se puede deshacer.')) return;
    await api.deleteConcert(id);
    setSheetConcert(null);
    load();
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  /* ── Topbar ── */
  const Topbar = () => (
    <header style={{
      height: 56, background: 'var(--paper)', borderBottom: '1.5px solid var(--border)',
      display: 'flex', alignItems: 'center',
      padding: '0 12px', position: 'sticky', top: 0, zIndex: 40, gap: 8,
      flexShrink: 0,
    }}>
      {/* Hamburger (mobile) */}
      <button
        onClick={() => setMobileSidebar(v => !v)}
        className="mobile-menu-btn"
        style={{
          display: 'none', background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--ink-2)', padding: '6px', borderRadius: 6, flexShrink: 0,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
      </button>

      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 7, background: 'var(--ink)',
          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Fraunces, serif', fontSize: 13, fontStyle: 'italic', fontWeight: 500,
        }}>E</div>
        <div className="brand-text-desktop">
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.2, fontFamily: 'Fraunces, serif' }}>EKO Agency</div>
        </div>
      </div>

      {/* Tabs — centered */}
      <nav style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'flex', background: 'rgba(0,0,0,.05)', borderRadius: 8, padding: 3, gap: 2 }}>
          {[['cities', '🏙 Ciudades', 'Ciudades'], ['map', '🗺 Mapa', 'Mapa'], ['agenda', '📋 Agenda', 'Agenda']].map(([v, labelMobile, labelDesktop]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: view === v ? 600 : 400,
                background: view === v ? 'white' : 'transparent',
                color: view === v ? 'var(--ink)' : 'var(--ink-2)',
                boxShadow: view === v ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
                transition: 'all .15s', whiteSpace: 'nowrap',
              }}
            >
              <span className="tab-label-mobile">{labelMobile}</span>
              <span className="tab-label-desktop">{labelDesktop}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Right: nuevo + avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <button className="btn-primary" onClick={() => navigate('/conciertos/nuevo')}
          style={{ padding: '6px 10px', fontSize: 12 }}>
          <Plus size={13} />
          <span className="btn-label-desktop" style={{ marginLeft: 4 }}>Nuevo</span>
        </button>
        <button
          title={`${user?.name} · Cerrar sesión`}
          onClick={handleLogout}
          style={{
            width: 30, height: 30, borderRadius: '50%', background: 'var(--accent-soft)',
            border: '1.5px solid rgba(194,103,74,.3)', color: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
          }}
        >
          {user?.name?.[0]?.toUpperCase()}
        </button>
      </div>
    </header>
  );

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{
          width: 28, height: 28, border: '2.5px solid var(--accent)',
          borderTopColor: 'transparent', borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ── EMPTY STATE ── */
  if (concerts.length === 0) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
        <Topbar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 40 }}>🎶</div>
          <h2 style={{ fontFamily: 'Fraunces, serif', color: 'var(--ink)', margin: 0 }}>Sin conciertos todavía</h2>
          <p style={{ color: 'var(--ink-2)', fontSize: 14, margin: 0 }}>Crea el primero para empezar a gestionar la gira.</p>
          <button className="btn-primary" onClick={() => navigate('/conciertos/nuevo')}>
            <Plus size={14} /> Nuevo concierto
          </button>
        </div>
      </div>
    );
  }

  const cityIndex = Math.max(0, cities.findIndex(c => c.city === activeCity));

  /* ── SIDEBAR ── */
  const Sidebar = ({ mobile }) => (
    <aside style={{
      width: mobile ? '100%' : 240, flexShrink: 0,
      background: 'var(--paper)', borderRight: mobile ? 'none' : '1.5px solid var(--border)',
      overflowY: 'auto', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '16px 16px 8px', borderBottom: '1px solid var(--border-2)' }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ink-3)' }}>Ciudades</div>
      </div>

      <div style={{ padding: '8px 8px', flex: 1 }}>
        {cities.map((c, i) => {
          const cityShows = concertsForCity(c.city);
          const active = c.city === activeCity;
          const firstDate = cityShows[0]?.date;
          const upcoming = firstDate ? isUpcoming(firstDate) : false;
          return (
            <button
              key={c.city}
              onClick={() => { setActiveCity(c.city); setView('cities'); if (mobile) setMobileSidebar(false); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left',
                background: active ? 'var(--accent-soft)' : 'transparent',
                transition: 'background .15s',
              }}
            >
              <div style={{
                width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                background: active ? 'var(--accent)' : 'rgba(0,0,0,.06)',
                color: active ? 'white' : 'var(--ink-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
              }}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: active ? 'var(--accent)' : 'var(--ink)', truncate: true }}>
                  {c.city}
                </div>
                {firstDate && (
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{formatDateShort(firstDate)}</div>
                )}
              </div>
              <div style={{
                fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 99,
                background: active ? 'rgba(194,103,74,.2)' : 'rgba(0,0,0,.06)',
                color: active ? 'var(--accent)' : 'var(--ink-3)',
              }}>
                {cityShows.length}
              </div>
            </button>
          );
        })}
      </div>

      {/* Mini map */}
      {view !== 'map' && cities.length > 0 && (
        <div style={{ padding: '0 12px 16px' }}>
          <MiniMap
            cities={cities}
            activeCity={activeCity}
            onCityClick={city => { setActiveCity(city); setView('cities'); }}
          />
        </div>
      )}

      {/* Members link */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-2)' }}>
        <button
          onClick={() => navigate('/miembros')}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'transparent', color: 'var(--ink-2)', fontSize: 13,
            transition: 'background .15s',
          }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,.04)'}
          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
        >
          <Users size={15} />
          Gestionar miembros
        </button>
      </div>
    </aside>
  );

  /* ── CITY VIEW ── */
  const CityView = () => {
    const cityShows = concertsForCity(activeCity);
    if (cityShows.length === 0) return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-2)' }}>
        No hay conciertos en {activeCity}.
      </div>
    );

    return (
      <div className="content-fade" style={{ maxWidth: 720, margin: '0 auto', padding: '28px 24px 60px' }}>
        {/* City hero */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em' }}>
            {cityIndex + 1} de {cities.length}
          </div>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 42, margin: '0 0 8px', color: 'var(--ink)', letterSpacing: '-.02em' }}>
            {activeCity}
          </h1>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
              {formatDateLong(cityShows[0].date)}
              {cityShows.length > 1 && ` → ${formatDateLong(cityShows[cityShows.length - 1].date)}`}
            </div>
            <span className={isUpcoming(cityShows[0].date) ? 'badge-upcoming' : 'badge-past'}>
              {isUpcoming(cityShows[0].date) ? 'Próximo' : 'Pasado'}
            </span>
          </div>
        </div>

        {/* Itinerary - each concert as a timeline */}
        <section style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 22, margin: 0, color: 'var(--ink)' }}>Itinerario</h2>
            <button onClick={() => navigate('/conciertos/nuevo')} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
              + Añadir
            </button>
          </div>

          <div style={{ background: 'white', border: '1.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            {cityShows.map((concert, ci) => {
              const evs = buildEvents(concert);
              return (
                <div key={concert.id} style={{ borderBottom: ci < cityShows.length - 1 ? '1.5px solid var(--border-2)' : 'none' }}>
                  {/* Date header */}
                  <div style={{ padding: '10px 16px 6px', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,.02)' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', background: 'var(--accent-soft)', borderRadius: 6, padding: '2px 8px' }}>
                      {formatDateShort(concert.date)}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                      {new Date(concert.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long' })}
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className={concert.status === 'pending' ? 'chip-pending' : 'chip-confirmed'}>
                        {concert.status === 'pending' ? 'Pendiente' : 'Confirmado'}
                      </span>
                    </div>
                  </div>

                  {/* Event rows */}
                  {evs.map((ev, ei) => (
                    <button
                      key={ei}
                      onClick={() => setSheetConcert(concert)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                        padding: '12px 16px', textAlign: 'left', border: 'none', cursor: 'pointer',
                        background: 'transparent', borderTop: ei > 0 ? '1px solid var(--border-2)' : 'none',
                        transition: 'background .12s',
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'var(--accent-soft)'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                        background: TYPE_COLOR[ev.type] || 'var(--ink-3)',
                      }} />
                      <div style={{ fontSize: 12, color: 'var(--ink-3)', minWidth: 40 }}>{ev.time || '—'}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{ev.title}</div>
                        {ev.sub && <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 1 }}>{ev.sub}</div>}
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 500, color: 'var(--ink-3)',
                        background: 'rgba(0,0,0,.04)', borderRadius: 5, padding: '2px 6px',
                      }}>
                        {TYPE_LABEL[ev.type]}
                      </span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </section>

        {/* Venue & Hotel panels */}
        {cityShows.map(concert => (
          (concert.venue_name || concert.hotel_name) && (
            <section key={`panels-${concert.id}`} style={{ marginBottom: 28 }}>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 22, margin: '0 0 14px', color: 'var(--ink)' }}>
                Detalles · {concert.venue_name || concert.city}
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                {concert.venue_name && (
                  <div className="card" style={{ padding: 18 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ink-3)', marginBottom: 8 }}>Concierto · {formatDateShort(concert.date)}</div>
                    <div style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 500, color: 'var(--ink)', marginBottom: 4 }}>{concert.venue_name}</div>
                    {concert.venue_address && <div style={{ fontSize: 12, color: 'var(--ink-2)', marginBottom: 12 }}>{concert.venue_address}</div>}
                    {concert.venue_capacity && <SheetRow k="Aforo" v={concert.venue_capacity} />}
                    {concert.doors && <SheetRow k="Puertas" v={concert.doors} />}
                    {concert.sound_check && <SheetRow k="Soundcheck" v={concert.sound_check} />}
                    {concert.contact_booking_name && <SheetRow k="Promotor" v={concert.contact_booking_name} />}
                  </div>
                )}
                {concert.hotel_name && (
                  <div className="card" style={{ padding: 18 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ink-3)', marginBottom: 8 }}>Hotel · check-in {concert.hotel_checkin || '—'}</div>
                    <div style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 500, color: 'var(--ink)', marginBottom: 4 }}>{concert.hotel_name}</div>
                    {concert.hotel_address && <div style={{ fontSize: 12, color: 'var(--ink-2)', marginBottom: 12 }}>{concert.hotel_address}</div>}
                    {concert.hotel_booking_code && <SheetRow k="Reserva" v={concert.hotel_booking_code} />}
                    {concert.hotel_phone && <SheetRow k="Teléfono" v={concert.hotel_phone} phone />}
                    {concert.hotel_checkout && <SheetRow k="Check-out" v={concert.hotel_checkout} />}
                  </div>
                )}
              </div>
            </section>
          )
        ))}

        {/* Team grid */}
        {(() => {
          const members = cityShows.flatMap(c => c.members || []);
          const unique = [...new Map(members.map(m => [m.id, m])).values()];
          if (unique.length === 0) return null;
          return (
            <section style={{ marginBottom: 28 }}>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 22, margin: '0 0 14px', color: 'var(--ink)' }}>
                Equipo en {activeCity}
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                {unique.map(m => (
                  <div key={m.id} className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                      background: 'var(--accent-soft)', color: 'var(--accent)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 600,
                    }}>
                      {m.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{m.user_role === 'producer' ? 'Productor' : 'Artista'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })()}
      </div>
    );
  };

  /* ── AGENDA VIEW ── */
  const AgendaView = () => {
    const sorted = [...concerts].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    return (
      <div className="content-fade" style={{ maxWidth: 720, margin: '0 auto', padding: '28px 24px 60px' }}>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 42, margin: '0 0 6px', letterSpacing: '-.02em', color: 'var(--ink)' }}>
          Agenda
        </h1>
        <p style={{ color: 'var(--ink-2)', fontSize: 14, margin: '0 0 24px' }}>
          {sorted.length} {sorted.length === 1 ? 'concierto' : 'conciertos'} · {cities.length} ciudades
        </p>

        <div style={{ background: 'white', border: '1.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {sorted.map((concert, i) => (
            <button
              key={concert.id}
              onClick={() => { setActiveCity(concert.city); setSheetConcert(concert); setView('cities'); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 16,
                padding: '14px 20px', textAlign: 'left', border: 'none', cursor: 'pointer',
                background: 'transparent', borderTop: i > 0 ? '1px solid var(--border-2)' : 'none',
                transition: 'background .12s',
              }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--accent-soft)'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Date */}
              <div style={{ minWidth: 46, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Fraunces, serif', color: 'var(--ink)', lineHeight: 1 }}>
                  {new Date(concert.date + 'T00:00:00').getDate()}
                </div>
                <div style={{ fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', marginTop: 2 }}>
                  {new Date(concert.date + 'T00:00:00').toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')}
                </div>
              </div>
              {/* Dot */}
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>{concert.city}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 1 }}>
                  {concert.venue_name || 'Sin sala'}{concert.show_time ? ` · ${concert.show_time}` : ''}
                </div>
              </div>
              {/* Status */}
              <span className={concert.status === 'pending' ? 'chip-pending' : 'chip-confirmed'}>
                {concert.status === 'pending' ? 'Pendiente' : 'Confirmado'}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
      <Topbar />

      {/* Mobile sidebar overlay */}
      {mobileSidebar && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,.4)' }} onClick={() => setMobileSidebar(false)}>
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 280, background: 'var(--paper)' }}
            onClick={e => e.stopPropagation()}>
            <Sidebar mobile />
          </div>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Desktop sidebar — only for cities view */}
        <div style={{ display: view === 'map' ? 'none' : 'flex', flexDirection: 'column' }} className="desktop-sidebar">
          <Sidebar />
        </div>

        {/* Main content */}
        <div style={{ flex: 1, overflowY: view === 'map' ? 'hidden' : 'auto', position: 'relative' }}>
          {view === 'cities' && <CityView />}
          {view === 'map' && (
            <div style={{ position: 'absolute', inset: 0 }}>
              <FullMap
                cities={cities}
                activeCity={activeCity}
                onCityClick={city => { setActiveCity(city); setView('cities'); }}
              />
              <div style={{
                position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
                background: 'var(--paper)', border: '1.5px solid var(--border)', borderRadius: 12,
                padding: '12px 20px', minWidth: 200, textAlign: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,.12)',
              }}>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: 17, fontWeight: 500, color: 'var(--ink)' }}>
                  {activeCity || 'España 2026'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>
                  {cities.length} ciudades · {concerts.length} conciertos
                </div>
              </div>
            </div>
          )}
          {view === 'agenda' && <AgendaView />}
        </div>
      </div>

      {/* Detail Sheet */}
      {sheetConcert && (
        <DetailSheet
          concert={sheetConcert}
          onClose={() => setSheetConcert(null)}
          onEdit={() => { navigate(`/conciertos/${sheetConcert.id}/editar`); setSheetConcert(null); }}
          onDelete={() => handleDeleteConcert(sheetConcert.id)}
        />
      )}

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 640px) {
          .desktop-sidebar   { display: none !important; }
          .mobile-menu-btn   { display: flex !important; }
          .brand-text-desktop{ display: none !important; }
          .btn-label-desktop { display: none !important; }
          .tab-label-mobile  { display: inline !important; }
          .tab-label-desktop { display: none !important; }
        }
        @media (min-width: 641px) {
          .desktop-sidebar   { display: flex !important; }
          .mobile-menu-btn   { display: none !important; }
          .brand-text-desktop{ display: block !important; }
          .btn-label-desktop { display: inline !important; }
          .tab-label-mobile  { display: none !important; }
          .tab-label-desktop { display: inline !important; }
        }
      `}</style>
    </div>
  );
}
