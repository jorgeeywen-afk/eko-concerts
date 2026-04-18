import { useState, useEffect } from 'react';
import { api } from '../../api';
import ConcertCard from '../../components/ConcertCard';
import { useAuth } from '../../contexts/AuthContext';

function isUpcoming(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr + 'T00:00:00') >= new Date(new Date().toDateString());
}

export default function MemberDashboard() {
  const [concerts, setConcerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');
  const { user } = useAuth();

  useEffect(() => {
    api.getConcerts()
      .then(setConcerts)
      .finally(() => setLoading(false));
  }, []);

  const upcoming = concerts.filter(c => isUpcoming(c.date));
  const past = concerts.filter(c => !isUpcoming(c.date));
  const shown = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100">Hola, {user?.name} 👋</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Tienes {upcoming.length} {upcoming.length === 1 ? 'concierto próximo' : 'conciertos próximos'}
        </p>
      </div>

      <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-1 gap-1 w-fit mb-6">
        <button
          onClick={() => setTab('upcoming')}
          className={`px-4 py-2 text-sm rounded-md transition-colors ${
            tab === 'upcoming' ? 'bg-zinc-700 text-zinc-100 font-medium' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Próximos ({upcoming.length})
        </button>
        <button
          onClick={() => setTab('past')}
          className={`px-4 py-2 text-sm rounded-md transition-colors ${
            tab === 'past' ? 'bg-zinc-700 text-zinc-100 font-medium' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Pasados ({past.length})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : shown.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-zinc-500">
            {tab === 'upcoming' ? 'No tienes conciertos próximos.' : 'No tienes conciertos pasados.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map(concert => (
            <ConcertCard key={concert.id} concert={concert} />
          ))}
        </div>
      )}
    </div>
  );
}
