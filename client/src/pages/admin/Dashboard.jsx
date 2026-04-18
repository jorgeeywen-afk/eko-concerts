import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import ConcertCard from '../../components/ConcertCard';
import { Plus, Search } from 'lucide-react';

function isUpcoming(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr + 'T00:00:00') >= new Date(new Date().toDateString());
}

export default function AdminDashboard() {
  const [concerts, setConcerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'upcoming' | 'past'
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.getConcerts()
      .then(setConcerts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = concerts.filter(c => {
    const matchesSearch = !search ||
      c.city?.toLowerCase().includes(search.toLowerCase()) ||
      c.venue_name?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'upcoming' && isUpcoming(c.date)) ||
      (filter === 'past' && !isUpcoming(c.date));
    return matchesSearch && matchesFilter;
  });

  const upcoming = concerts.filter(c => isUpcoming(c.date));
  const past = concerts.filter(c => !isUpcoming(c.date));

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Conciertos</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {upcoming.length} próximos · {past.length} pasados
          </p>
        </div>
        <button onClick={() => navigate('/conciertos/nuevo')} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          Nuevo concierto
        </button>
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por ciudad o sala..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 py-2"
          />
        </div>
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-1 gap-1">
          {[['all', 'Todos'], ['upcoming', 'Próximos'], ['past', 'Pasados']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                filter === val
                  ? 'bg-zinc-700 text-zinc-100 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-zinc-500">
            {concerts.length === 0
              ? 'No hay conciertos todavía. ¡Crea el primero!'
              : 'No hay conciertos que coincidan.'}
          </p>
          {concerts.length === 0 && (
            <button onClick={() => navigate('/conciertos/nuevo')} className="btn-primary mt-4 inline-flex items-center gap-2">
              <Plus size={16} /> Nuevo concierto
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(concert => (
            <ConcertCard key={concert.id} concert={concert} />
          ))}
        </div>
      )}
    </div>
  );
}
