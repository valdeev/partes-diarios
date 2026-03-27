'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';

export default function EditarRegistro() {
  const router = useRouter();
  const { id } = useParams();
  const [ordenes, setOrdenes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({
    orden_id: '',
    orden_texto: '',
    descripcion: '',
    hora_inicio: '08:00',
    hora_fin: '18:00',
    fecha: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/login'); return; }

    // Cargar registro existente
    const { data: registro } = await supabase
      .from('registros')
      .select('*, ordenes(id, descripcion, numero)')
      .eq('id', id)
      .single();

    if (!registro) { router.push('/historico'); return; }

    setForm({
      orden_id: registro.orden_id,
      orden_texto: `${registro.ordenes.numero} — ${registro.ordenes.descripcion}`,
      descripcion: registro.descripcion,
      hora_inicio: registro.hora_inicio.slice(0, 5),
      hora_fin: registro.hora_fin.slice(0, 5),
      fecha: registro.fecha,
    });

    // Cargar órdenes
    const { data: ords } = await supabase
      .from('ordenes')
      .select('*')
      .eq('activa', true)
      .order('created_at', { ascending: false });

    setOrdenes(ords || []);
    setLoading(false);
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
    if (!form.orden_id) { alert('Seleciona uma ordem'); return; }
    setGuardando(true);

    const { error } = await supabase
      .from('registros')
      .update({
        orden_id: form.orden_id,
        descripcion: form.descripcion,
        hora_inicio: form.hora_inicio,
        hora_fin: form.hora_fin,
        fecha: form.fecha,
      })
      .eq('id', id);

    if (error) {
      alert('Erro ao guardar. Tenta de novo.');
      setGuardando(false);
      return;
    }

    router.push('/historico');
  }

  async function handleEliminar() {
    const confirmar = confirm('Tens a certeza que queres eliminar este registo?');
    if (!confirmar) return;

    const { error } = await supabase
      .from('registros')
      .delete()
      .eq('id', id);

    if (error) { alert('Erro ao eliminar.'); return; }

    router.push('/historico');
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 36 }}></div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* HEADER */}
      <div style={{
        background: 'var(--primary)',
        padding: '48px 24px 24px',
        color: 'white',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => router.back()}
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none',
              borderRadius: 10, width: 36, height: 36,
              color: 'white', fontSize: 18, cursor: 'pointer'
            }}
          >
            ←
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Editar registo</h1>
        </div>
        <button
          onClick={handleEliminar}
          style={{
            background: 'var(--accent)',
            border: '1px solid rgba(233,69,96,0.5)',
            borderRadius: 10, padding: '8px 14px',
            color: 'white', fontSize: 13,
            fontWeight: 600, cursor: 'pointer'
          }}
        >
          Eliminar
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Fecha */}
        <div className="card">
          <label className="label">Data do registo</label>
          <input
            className="input"
            type="date"
            value={form.fecha}
            max={new Date().toISOString().split('T')[0]}
            onChange={e => setForm({ ...form, fecha: e.target.value })}
            required
          />
          {form.fecha !== new Date().toISOString().split('T')[0] && (
            <div style={{
              marginTop: 8, padding: '8px 12px',
              background: '#fff8ee', borderRadius: 8,
              fontSize: 12, color: '#c17a2a',
              display: 'flex', alignItems: 'center', gap: 6
            }}>
              ⚠️ Estás a editar um registo de um dia anterior
            </div>
          )}
        </div>

        {/* Orden */}
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
                  marginTop: 8, borderRadius: 12,
                  overflow: 'hidden', border: '1px solid var(--border)'
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
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Descripción */}
        <div className="card">
          <label className="label">Descrição do trabalho</label>
          <input
            className="input"
            placeholder="Descreve o trabalho realizado..."
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
          disabled={guardando}
          style={{ fontSize: 16, padding: '18px' }}
        >
          {guardando ? 'A guardar...' : '✓ Guardar alterações'}
        </button>

      </form>
    </div>
  );
}