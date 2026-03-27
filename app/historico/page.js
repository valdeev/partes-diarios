'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Historico() {
  const router = useRouter();
  const [registros, setRegistros] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/login'); return; }

    const { data } = await supabase
      .from('registros')
      .select('*, ordenes(descripcion, numero)')
      .eq('empleado_id', session.user.id)
      .order('fecha', { ascending: false })
      .order('hora_inicio', { ascending: true });

    // Agrupar por fecha
    const agrupado = (data || []).reduce((acc, r) => {
      if (!acc[r.fecha]) acc[r.fecha] = [];
      acc[r.fecha].push(r);
      return acc;
    }, {});

    setRegistros(agrupado);
    setLoading(false);
  }

  function totalHorasDia(regs) {
    const minutos = regs.reduce((acc, r) => {
      const inicio = r.hora_inicio.split(':');
      const fin = r.hora_fin.split(':');
      return acc + (parseInt(fin[0]) * 60 + parseInt(fin[1])) -
                   (parseInt(inicio[0]) * 60 + parseInt(inicio[1]));
    }, 0);
    return `${Math.floor(minutos / 60)}h ${minutos % 60}m`;
  }

  function formatFecha(fecha) {
    const hoy = new Date().toISOString().split('T')[0];
    const ayer = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (fecha === hoy) return 'Hoje';
    if (fecha === ayer) return 'Ontem';
    return new Date(fecha + 'T00:00:00').toLocaleDateString('pt-PT', {
      weekday: 'long', day: 'numeric', month: 'long'
    });
  }

  function colorTotal(regs) {
    const minutos = regs.reduce((acc, r) => {
      const inicio = r.hora_inicio.split(':');
      const fin = r.hora_fin.split(':');
      return acc + (parseInt(fin[0]) * 60 + parseInt(fin[1])) -
                   (parseInt(inicio[0]) * 60 + parseInt(inicio[1]));
    }, 0);
    return minutos >= 480 ? 'var(--success)' : 'var(--warning)';
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary)' }}>
      <div style={{ fontSize: 36 }}></div>
    </div>
  );

  const dias = Object.keys(registros);

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
          onClick={() => router.push('/dashboard')}
          style={{
            background: 'rgba(255,255,255,0.1)', border: 'none',
            borderRadius: 10, width: 36, height: 36,
            color: 'white', fontSize: 18, cursor: 'pointer'
          }}
        >
          ←
        </button>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Histórico</h1>
          <p style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>
            {dias.length} dias registados
          </p>
        </div>
      </div>

      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {dias.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
            <p style={{ color: 'var(--gray)', fontSize: 14 }}>
              Ainda não tens registos
            </p>
          </div>
        ) : (
          dias.map(fecha => (
            <div key={fecha} className="card" style={{ padding: 0, overflow: 'hidden' }}>

              {/* Fila resumen del día — siempre visible */}
              <button
                onClick={() => setExpandido(expandido === fecha ? null : fecha)}
                style={{
                  width: '100%', padding: '16px 20px',
                  background: 'none', border: 'none',
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', cursor: 'pointer'
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{
                    fontSize: 15, fontWeight: 700,
                    color: 'var(--text)', textTransform: 'capitalize'
                  }}>
                    {formatFecha(fecha)}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>
                    {registros[fecha].length} registo{registros[fecha].length > 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    fontSize: 15, fontWeight: 800,
                    color: colorTotal(registros[fecha])
                  }}>
                    {totalHorasDia(registros[fecha])}
                  </div>
                  <div style={{
                    fontSize: 18, color: 'var(--gray)',
                    transform: expandido === fecha ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.2s'
                  }}>
                    ↓
                  </div>
                </div>
              </button>

              {/* Detalle expandible */}
              {expandido === fecha && (
                <div style={{
                  borderTop: '1px solid var(--border)',
                  padding: '12px 16px',
                  display: 'flex', flexDirection: 'column', gap: 8,
                  background: 'var(--gray2)'
                }}>
                  {registros[fecha].map((r, i) => (
                    <div key={r.id} style={{
                      background: 'white', borderRadius: 10,
                      padding: '12px 14px',
                    }}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', marginBottom: 6
                      }}>
                        <div style={{
                          fontSize: 11, fontWeight: 700,
                          color: 'var(--accent)', textTransform: 'uppercase',
                          letterSpacing: 0.5
                        }}>
                          Ordem {r.ordenes?.numero}
                        </div>
                        <div style={{
                          fontSize: 12, fontWeight: 600,
                          color: 'var(--text)', background: 'var(--gray2)',
                          padding: '3px 8px', borderRadius: 6
                        }}>
                          {r.hora_inicio.slice(0, 5)} → {r.hora_fin.slice(0, 5)}
                        </div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                        {r.ordenes?.descripcion}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>
                        {r.descripcion}
                      </div>
                      <button
                      onClick={() => router.push(`/editar-registro/${r.id}`)}
                      style={{
                        width: '100%', padding: '8px',
                        background: 'var(--gray2)', color: 'var(--text)',
                        border: 'none', borderRadius: 8,
                        fontSize: 13, fontWeight: 600,
                        cursor: 'pointer', marginTop: 8
                      }}
                    >
                      ✏️ Editar registo
                    </button>
                    </div>
                  ))}
                  {/* Botón ver resumen completo */}
                  <button
                    onClick={() => router.push(`/resumen?fecha=${fecha}`)}
                    style={{
                      width: '100%', padding: '10px',
                      background: 'var(--primary)', color: 'white',
                      border: 'none', borderRadius: 10,
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      marginTop: 4
                    }}
                  >
                    Ver resumo completo →
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}