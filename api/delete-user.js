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

    const { data: callerProfile } = await admin.from('profiles').select('role').eq('id', user.id).single();
    if (callerProfile?.role !== 'admin') return res.status(403).json({ error: 'Solo administradores' });

    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID requerido' });

    const { data: targetProfile } = await admin.from('profiles').select('role').eq('id', id).single();
    if (targetProfile?.role === 'admin') return res.status(400).json({ error: 'No puedes eliminar al administrador' });

    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) return res.status(400).json({ error: error.message });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
