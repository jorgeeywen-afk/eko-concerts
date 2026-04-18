import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Users, ChevronRight } from 'lucide-react';

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
      className="card p-5 text-left hover:border-zinc-700 hover:bg-zinc-800/50 transition-all w-full group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={upcoming ? 'badge-upcoming' : 'badge-past'}>
              {upcoming ? 'Próximo' : 'Pasado'}
            </span>
          </div>
          <h3 className="font-semibold text-zinc-100 text-lg leading-tight truncate">
            {concert.city}
          </h3>
          {concert.venue_name && (
            <p className="text-zinc-400 text-sm mt-0.5 truncate">{concert.venue_name}</p>
          )}
          <div className="flex items-center flex-wrap gap-3 mt-3">
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Calendar size={12} />
              {formatDate(concert.date)}
            </span>
            {concert.venue_address && (
              <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                <MapPin size={12} />
                <span className="truncate max-w-[200px]">{concert.venue_address}</span>
              </span>
            )}
            {memberCount !== undefined && (
              <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Users size={12} />
                {memberCount} {memberCount === 1 ? 'persona' : 'personas'}
              </span>
            )}
          </div>
        </div>
        <ChevronRight size={18} className="text-zinc-600 group-hover:text-zinc-400 transition-colors mt-1 shrink-0" />
      </div>
    </button>
  );
}
