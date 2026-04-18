const { createClient } = require('@supabase/supabase-js');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const admin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No autorizado' });

    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: 'No autorizado' });

    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return res.status(403).json({ error: 'Solo administradores' });

    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });

    const { data: newAuth, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createErr) return res.status(400).json({ error: createErr.message });

    const { error: profileErr } = await admin.from('profiles').insert({
      id: newAuth.user.id,
      name,
      email,
      role: role || 'member',
      phone: phone || null,
    });

    if (profileErr) {
      await admin.auth.admin.deleteUser(newAuth.user.id);
      return res.status(400).json({ error: profileErr.message });
    }

    res.json({ id: newAuth.user.id, name, email, role: role || 'member', phone });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
