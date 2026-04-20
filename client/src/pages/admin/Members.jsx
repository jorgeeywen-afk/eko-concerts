import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { Plus, Edit, Trash2, X, Check, Users, ChevronLeft } from 'lucide-react';

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
    setSaving(true); setError('');
    try {
      if (isEdit) await api.updateMember(member.id, form);
      else await api.createMember(form);
      onSaved(); onClose();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'Fraunces, serif', margin: 0, fontSize: 20, color: 'var(--ink)' }}>
            {isEdit ? `Editar — ${member.name}` : 'Nuevo miembro'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-2)' }}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label>Nombre *</label><input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nombre" /></div>
          <div><label>Email *</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@ejemplo.com" /></div>
          <div><label>Teléfono</label><input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="600000000" /></div>
          <div>
            <label>Rol</label>
            <select value={form.role} onChange={e => set('role', e.target.value)}>
              <option value="member">Artista</option>
              <option value="producer">Productor</option>
            </select>
          </div>
          <div>
            <label>{isEdit ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}</label>
            <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" />
          </div>
          {error && <p style={{ fontSize: 13, color: '#b43228', margin: 0 }}>{error}</p>}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            <Check size={14} /> {saving ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear'}
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
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const navigate = useNavigate();

  const load = () => { api.getMembers().then(setMembers).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleDelete = async (member) => {
    if (!confirm(`¿Eliminar a ${member.name}? Se quitará de todos los conciertos.`)) return;
    setDeleting(member.id);
    try { await api.deleteMember(member.id); load(); }
    catch (err) { alert(err.message); }
    finally { setDeleting(null); }
  };

  const nonAdmin = members.filter(m => m.role !== 'admin');
  const adminUser = members.find(m => m.role === 'admin');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ background: 'var(--paper)', borderBottom: '1.5px solid var(--border)', padding: '14px 24px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={() => navigate('/dashboard')} className="btn-secondary" style={{ padding: '6px 12px' }}>
              <ChevronLeft size={15} /> Volver
            </button>
            <div>
              <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 24, margin: 0, color: 'var(--ink)' }}>Miembros</h1>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 2 }}>{nonAdmin.length} personas en el equipo</div>
            </div>
          </div>
          <button onClick={() => setModal('new')} className="btn-primary">
            <Plus size={14} /> Nuevo miembro
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 24px 60px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ width: 24, height: 24, border: '2.5px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Admin */}
            {adminUser && (
              <div>
                <div className="section-title">Administrador</div>
                <div className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600 }}>
                    {adminUser.name[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{adminUser.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{adminUser.email}</div>
                  </div>
                  <span style={{ fontSize: 11, background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid rgba(194,103,74,.3)', borderRadius: 6, padding: '2px 8px' }}>Admin</span>
                </div>
              </div>
            )}

            {/* Team */}
            <div>
              <div className="section-title">Equipo</div>
              {nonAdmin.length === 0 ? (
                <div className="card" style={{ padding: '40px 24px', textAlign: 'center' }}>
                  <Users size={32} style={{ color: 'var(--ink-3)', margin: '0 auto 12px', display: 'block' }} />
                  <p style={{ color: 'var(--ink-2)', fontSize: 14, margin: '0 0 16px' }}>No hay miembros todavía.</p>
                  <button onClick={() => setModal('new')} className="btn-primary">
                    <Plus size={14} /> Añadir primero
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {nonAdmin.map(m => (
                    <div key={m.id} className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,.06)', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, flexShrink: 0 }}>
                        {m.name[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{m.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.email}{m.phone ? ` · ${m.phone}` : ''}
                        </div>
                      </div>
                      <span style={{
                        fontSize: 11, borderRadius: 6, padding: '2px 8px', flexShrink: 0,
                        ...(m.role === 'producer'
                          ? { background: 'rgba(176,122,48,.12)', color: '#7a4e10', border: '1px solid rgba(176,122,48,.25)' }
                          : { background: 'rgba(0,0,0,.05)', color: 'var(--ink-2)', border: '1px solid var(--border)' })
                      }}>
                        {ROLE_LABELS[m.role]}
                      </span>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        <button onClick={() => setModal(m)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: 5, borderRadius: 6, transition: 'background .12s' }}
                          onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,.06)'}
                          onMouseOut={e => e.currentTarget.style.background = 'none'}><Edit size={14} /></button>
                        <button onClick={() => handleDelete(m)} disabled={deleting === m.id}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: 5, borderRadius: 6, transition: 'background .12s' }}
                          onMouseOver={e => e.currentTarget.style.background = 'rgba(180,50,40,.08)'}
                          onMouseOut={e => e.currentTarget.style.background = 'none'}>
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
      </div>

      {modal && (
        <MemberModal member={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSaved={load} />
      )}
    </div>
  );
}
