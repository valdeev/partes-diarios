'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function NovoRegistro() {
  const router = useRouter();
  const [empleado, setEmpleado] = useState(null);
  const [ordenes, setOrdenes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    orden_id: '',
    orden_texto: '',
    descripcion: '',
    hora_inicio: '08:00',
    hora_fin: '18:00',
  });

  const descripciones_favoritas = [
    'Pintura e decapagem',
    'Preparação de superfície',
    'Aplicação de tinta',
    'Lixagem',
    'Mascaramento',
  ];

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/login'); return; }

    const { data: perfil } = await supabase
      .from('empleados')
      .select('*')
      .eq('id', session.user.id)
      .single();

    setEmpleado(perfil);

    const { data: ords } = await supabase
      .from('ordenes')
      .select('*')
      .eq('activa', true)
      .order('created_at', { ascending: false });

    setOrdenes(ords || []);
  }

  const ordenesFiltradas = ordenes.filter(o =>
    o.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
    o.numero.includes(busqueda)
  );

  function seleccionarOrden(orden) {
    setForm({ ...form, orden_id: orden.id, orden_texto: `${orden.numero} — ${orden.descripcion}` });
    setBusqueda('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.orden_id) {
      alert('Selecciona una orden');
      return;
    }
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();

    const { error } = await supabase
      .from('registros')
      .insert({
        empleado_id: session.user.id,
        orden_id: form.orden_id,
        area: empleado.area,
        descripcion: form.descripcion,
        hora_inicio: form.hora_inicio,
        hora_fin: form.hora_fin,
        fecha: new Date().toISOString().split('T')[0],
      });

    if (error) {
      alert('Error al guardar. Intenta de nuevo.');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* HEADER */}
      <div style={{
        background: 'var(--primary)',
        padding: '48px 24px 24px',
        color: 'white',
        display: 'flex', alignItems: 'center', gap: 16
      }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 10, width: 36, height: 36, color: 'white', fontSize: 18, cursor: 'pointer' }}
        >
          ←
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Novo registo</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Buscar orden */}
        <div className="card">
          <label className="label">Ordem de trabalho</label>

          {form.orden_id ? (
            <div style={{
              background: 'var(--gray2)', borderRadius: 12,
              padding: '14px 16px', display: 'flex',
              justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>Selecionada</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{form.orden_texto}</div>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, orden_id: '', orden_texto: '' })}
                style={{ background: 'none', fontSize: 18, color: 'var(--gray)' }}
              >
                ✕
              </button>
            </div>
          ) : (
            <div>
              <input
                className="input"
                placeholder="Pesquisar por descrição ou número..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />

              {busqueda.length > 0 && (
                <div style={{
                  marginTop: 8, borderRadius: 12, overflow: 'hidden',
                  border: '1px solid var(--border)'
                }}>
                  {ordenesFiltradas.length === 0 ? (
                    <div style={{ padding: '14px 16px', color: 'var(--gray)', fontSize: 14 }}>
                      Nenhuma ordem encontrada
                    </div>
                  ) : (
                    ordenesFiltradas.map(o => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => seleccionarOrden(o)}
                        style={{
                          width: '100%', padding: '14px 16px',
                          background: 'white', border: 'none',
                          borderBottom: '1px solid var(--border)',
                          textAlign: 'left', cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
                          {o.numero}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>
                          {o.descripcion}
                        </div>
                        {o.ingeniero && (
                          <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>
                            Eng. {o.ingeniero}
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}

              {ordenes.length === 0 && busqueda.length === 0 && (
                <p style={{ fontSize: 13, color: 'var(--gray)', marginTop: 8 }}>
                  Ainda não há ordens ativas. Pede ao teu gestor que as adicione.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Descripción */}
        <div className="card">
          <label className="label">Descrição do trabalho</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {descripciones_favoritas.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => setForm({ ...form, descripcion: d })}
                style={{
                  padding: '10px 14px', borderRadius: 10, fontSize: 13,
                  textAlign: 'left', cursor: 'pointer',
                  background: form.descripcion === d ? 'var(--accent)' : 'var(--gray2)',
                  color: form.descripcion === d ? 'white' : 'var(--text)',
                  border: 'none', fontWeight: form.descripcion === d ? 600 : 400,
                  transition: 'all 0.15s'
                }}
              >
                {d}
              </button>
            ))}
          </div>
          <input
            className="input"
            placeholder="Ou escreve uma descrição..."
            value={form.descripcion}
            onChange={e => setForm({ ...form, descripcion: e.target.value })}
            required
          />
        </div>

        {/* Horas */}
        <div className="card">
          <label className="label">Horário</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label" style={{ fontSize: 11 }}>Início</label>
              <input
                className="input"
                type="time"
                value={form.hora_inicio}
                onChange={e => setForm({ ...form, hora_inicio: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label" style={{ fontSize: 11 }}>Fim</label>
              <input
                className="input"
                type="time"
                value={form.hora_fin}
                onChange={e => setForm({ ...form, hora_fin: e.target.value })}
                required
              />
            </div>
          </div>
        </div>

        <button
          className="btn btn-primary"
          type="submit"
          disabled={loading}
          style={{ fontSize: 16, padding: '18px' }}
        >
          {loading ? 'A guardar...' : '✓ Guardar registo'}
        </button>

      </form>
    </div>
  );
}