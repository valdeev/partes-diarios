'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Resumo() {
  const router = useRouter();
  const [empleado, setEmpleado] = useState(null);
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);

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

    const hoy = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('registros')
      .select('*, ordenes(descripcion, numero)')
      .eq('empleado_id', session.user.id)
      .eq('fecha', hoy)
      .order('hora_inicio', { ascending: true });

    setRegistros(data || []);
    setLoading(false);
  }

  const totalMinutos = registros.reduce((acc, r) => {
    const inicio = r.hora_inicio.split(':');
    const fin = r.hora_fin.split(':');
    const diff = (parseInt(fin[0]) * 60 + parseInt(fin[1])) -
                 (parseInt(inicio[0]) * 60 + parseInt(inicio[1]));
    return acc + diff;
  }, 0);

  const hoy = new Date().toLocaleDateString('pt-PT', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 36 }}>⚙️</div>
    </div>
  );

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
          style={{
            background: 'rgba(255,255,255,0.1)', border: 'none',
            borderRadius: 10, width: 36, height: 36,
            color: 'white', fontSize: 18, cursor: 'pointer'
          }}
        >
          ←
        </button>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Resumo do dia</h1>
          <p style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>{hoy}</p>
        </div>
      </div>

      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Info empleado */}
        <div className="card" style={{ background: 'var(--primary)', color: 'white' }}>
          <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
            Dados para SIGRES
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div>
              <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 2 }}>Nº Empleado</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{empleado?.numero_empleado}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 2 }}>Área</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{empleado?.area}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 2 }}>Data</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>
                {new Date().toLocaleDateString('pt-PT')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 2 }}>Total horas</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: totalMinutos >= 480 ? '#2a9d5c' : '#f4a261' }}>
                {Math.floor(totalMinutos / 60)}h {totalMinutos % 60}m
              </div>
            </div>
          </div>
        </div>

        {/* Alerta horas */}
        {totalMinutos < 480 && registros.length > 0 && (
          <div style={{
            background: '#fff8ee', border: '1px solid #f4a261',
            borderRadius: 12, padding: '14px 16px',
            display: 'flex', gap: 10, alignItems: 'center'
          }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#c17a2a' }}>
                Menos de 8 horas registadas
              </div>
              <div style={{ fontSize: 12, color: '#c17a2a', opacity: 0.8, marginTop: 2 }}>
                O total tem de ser 8h para o parte diário
              </div>
            </div>
          </div>
        )}

        {/* Tabla registros */}
        <div>
          <h2 style={{
            fontSize: 13, fontWeight: 700, color: 'var(--gray)',
            textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12
          }}>
            Registos — copia para SIGRES
          </h2>

          {registros.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '32px 20px' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
              <p style={{ color: 'var(--gray)', fontSize: 14 }}>
                Ainda não tens registos hoje
              </p>
              <button
                className="btn btn-primary"
                style={{ marginTop: 16 }}
                onClick={() => router.push('/nuevo-registro')}
              >
                + Adicionar registo
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {registros.map((r, i) => (
                <div key={r.id} className="card" style={{ padding: '16px' }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: 12
                  }}>
                    <div style={{
                      background: 'var(--accent)', color: 'white',
                      borderRadius: 8, padding: '4px 10px',
                      fontSize: 12, fontWeight: 700
                    }}>
                      Registo {i + 1}
                    </div>
                    <div style={{
                      background: 'var(--gray2)', borderRadius: 8,
                      padding: '6px 10px', fontSize: 13,
                      fontWeight: 700, color: 'var(--text)'
                    }}>
                      {r.hora_inicio.slice(0, 5)} → {r.hora_fin.slice(0, 5)}
                    </div>
                  </div>

                  {/* Datos para copiar */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { label: 'Nº Ordem', value: r.ordenes?.numero },
                      { label: 'Descrição ordem', value: r.ordenes?.descripcion },
                      { label: 'Área', value: r.area },
                      { label: 'Descrição trabalho', value: r.descripcion },
                      { label: 'Hora início', value: r.hora_inicio.slice(0, 5) },
                      { label: 'Hora fim', value: r.hora_fin.slice(0, 5) },
                    ].map(item => (
                      <div key={item.label} style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', padding: '8px 12px',
                        background: 'var(--gray2)', borderRadius: 8
                      }}>
                        <span style={{ fontSize: 11, color: 'var(--gray)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          {item.label}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <button
                className="btn btn-secondary"
                onClick={() => router.push('/nuevo-registro')}
              >
                + Adicionar outro registo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}