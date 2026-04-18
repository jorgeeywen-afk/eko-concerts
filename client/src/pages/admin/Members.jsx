import { useState, useEffect } from 'react';
import { api } from '../../api';
import { Plus, Edit, Trash2, X, Check, Users } from 'lucide-react';

const ROLE_LABELS = { admin: 'Admin', member: 'Artista', producer: 'Productor' };

function MemberModal({ member, onClose, onSaved }) {
  const isEdit = Boolean(member);
  const [form, setForm] = useState({
    name: member?.name || '',
    email: member?.email || '',
    phone: member?.phone || '',
    role: member?.role || 'member',
    password: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.email) { setError('Nombre y email son obligatorios'); return; }
    if (!isEdit && !form.password) { setError('La contraseña es obligatoria'); return; }
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        await api.updateMember(member.id, form);
      } else {
        await api.createMember(form);
      }
      onSaved();
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
          <h3 className="font-semibold text-zinc-100">
            {isEdit ? `Editar — ${member.name}` : 'Nuevo miembro'}
          </h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label>Nombre *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nombre" />
          </div>
          <div>
            <label>Email *</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@ejemplo.com" />
          </div>
          <div>
            <label>Teléfono</label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="600000000" />
          </div>
          <div>
            <label>Rol</label>
            <select value={form.role} onChange={e => set('role', e.target.value)}>
              <option value="member">Artista</option>
              <option value="producer">Productor</option>
            </select>
          </div>
          <div>
            <label>{isEdit ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}</label>
            <input
              type="password"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
            <Check size={15} /> {saving ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear'}
          </button>
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

export default function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'new' | member object
  const [deleting, setDeleting] = useState(null);

  const load = () => {
    api.getMembers()
      .then(setMembers)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (member) => {
    if (!confirm(`¿Eliminar a ${member.name}? Se quitará de todos los conciertos.`)) return;
    setDeleting(member.id);
    try {
      await api.deleteMember(member.id);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const nonAdmin = members.filter(m => m.role !== 'admin');
  const adminUser = members.find(m => m.role === 'admin');

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Miembros</h1>
          <p className="text-zinc-500 text-sm mt-1">{nonAdmin.length} personas en el equipo</p>
        </div>
        <button onClick={() => setModal('new')} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nuevo miembro
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Admin */}
          {adminUser && (
            <div>
              <p className="section-title">Administrador</p>
              <div className="card p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-indigo-600/20 rounded-full flex items-center justify-center text-indigo-400 font-semibold">
                    {adminUser.name[0]}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-zinc-100 text-sm">{adminUser.name}</p>
                    <p className="text-zinc-500 text-xs">{adminUser.email}</p>
                  </div>
                  <span className="text-xs bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 rounded px-2 py-0.5">Admin</span>
                </div>
              </div>
            </div>
          )}

          {/* Team */}
          <div>
            <p className="section-title">Equipo</p>
            {nonAdmin.length === 0 ? (
              <div className="card p-8 text-center">
                <Users size={32} className="text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">No hay miembros todavía.</p>
                <button onClick={() => setModal('new')} className="btn-primary mt-4 text-sm inline-flex items-center gap-2">
                  <Plus size={14} /> Añadir primero
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {nonAdmin.map(m => (
                  <div key={m.id} className="card px-4 py-3 flex items-center gap-3">
                    <div className="w-9 h-9 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 font-semibold text-sm">
                      {m.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-100 text-sm">{m.name}</p>
                      <p className="text-zinc-500 text-xs truncate">{m.email}{m.phone ? ` · ${m.phone}` : ''}</p>
                    </div>
                    <span className={`text-xs rounded px-2 py-0.5 border ${
                      m.role === 'producer'
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}>
                      {ROLE_LABELS[m.role]}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setModal(m)}
                        className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(m)}
                        disabled={deleting === m.id}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {modal && (
        <MemberModal
          member={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
