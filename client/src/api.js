import { supabase } from './lib/supabase';

async function adminToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

async function adminFetch(path, body) {
  const token = await adminToken();
  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error del servidor');
  return data;
}

function throwIf(error) {
  if (error) throw new Error(error.message);
}

export const api = {
  // Auth
  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    throwIf(error);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      return { user: { ...data.user, ...(profile || {}) } };
    } catch {
      return { user: data.user };
    }
  },

  logout: () => supabase.auth.signOut(),

  getProfile: async (id) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    throwIf(error);
    return data;
  },

  // Concerts
  getConcerts: async () => {
    const { data, error } = await supabase
      .from('concerts')
      .select(`*, concert_members(id, room, transport_ida, transport_vuelta, profiles(id, name, role))`)
      .order('date', { ascending: true });
    throwIf(error);
    return (data || []).map(c => {
      const members = (c.concert_members || []).map(cm => ({
        cm_id: cm.id,
        id: cm.profiles?.id,
        name: cm.profiles?.name,
        user_role: cm.profiles?.role,
        room: cm.room,
        transport_ida: cm.transport_ida,
        transport_vuelta: cm.transport_vuelta,
      }));
      const { concert_members: _, ...concert } = c;
      return { ...concert, members };
    });
  },

  getConcert: async (id) => {
    const { data, error } = await supabase
      .from('concerts')
      .select(`*, concert_members(id, room, transport_ida, transport_vuelta, profiles(id, name, email, phone, role))`)
      .eq('id', id)
      .single();
    throwIf(error);

    const members = (data.concert_members || []).map(cm => ({
      cm_id: cm.id,
      id: cm.profiles.id,
      name: cm.profiles.name,
      email: cm.profiles.email,
      phone: cm.profiles.phone,
      user_role: cm.profiles.role,
      room: cm.room,
      transport_ida: cm.transport_ida,
      transport_vuelta: cm.transport_vuelta,
    }));

    const { concert_members: _, ...concert } = data;
    return { ...concert, members };
  },

  createConcert: async (payload) => {
    const { data, error } = await supabase.from('concerts').insert(payload).select().single();
    throwIf(error);

    // Auto-añadir al admin como participante
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('concert_members')
        .insert({ concert_id: data.id, user_id: user.id })
        .throwOnError();
    }

    return data;
  },

  updateConcert: async (id, payload) => {
    const { data, error } = await supabase.from('concerts').update(payload).eq('id', id).select().single();
    throwIf(error);
    return data;
  },

  deleteConcert: async (id) => {
    const { error } = await supabase.from('concerts').delete().eq('id', id);
    throwIf(error);
    return { success: true };
  },

  // Concert members
  addConcertMember: async (concertId, { user_id, room, transport_ida, transport_vuelta }) => {
    const { error } = await supabase.from('concert_members').insert({
      concert_id: concertId,
      user_id,
      room: room || null,
      transport_ida: transport_ida || null,
      transport_vuelta: transport_vuelta || null,
    });
    if (error) throw new Error('El miembro ya está en este concierto');
    return { success: true };
  },

  updateConcertMember: async (concertId, cmId, { room, transport_ida, transport_vuelta }) => {
    const { error } = await supabase.from('concert_members')
      .update({ room: room || null, transport_ida: transport_ida || null, transport_vuelta: transport_vuelta || null })
      .eq('id', cmId);
    throwIf(error);
    return { success: true };
  },

  removeConcertMember: async (concertId, cmId) => {
    const { error } = await supabase.from('concert_members').delete().eq('id', cmId);
    throwIf(error);
    return { success: true };
  },

  // Members (admin)
  getMembers: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, role, phone, created_at')
      .order('role', { ascending: false });
    throwIf(error);
    return data;
  },

  getMembersWithEmail: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('role', { ascending: false });
    throwIf(error);
    return data;
  },

  createMember: (form) => adminFetch('/api/create-user', form),

  updateMember: async (id, { name, role, phone, password, email }) => {
    const { error } = await supabase.from('profiles')
      .update({ name, role, phone: phone || null })
      .eq('id', id);
    throwIf(error);

    if (password) {
      await adminFetch('/api/update-user-password', { id, password });
    }

    return { success: true };
  },

  deleteMember: (id) => adminFetch('/api/delete-user', { id }),
};
