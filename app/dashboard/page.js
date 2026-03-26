'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [empleado, setEmpleado] = useState(null);
  const [registrosHoy, setRegistrosHoy] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push('/login');
      return;
    }

    // Cargar perfil empleado
    const { data: perfil } = await supabase
      .from('empleados')
      .select('*')
      .eq('id', session.user.id)
      .single();

    setEmpleado(perfil);

    // Cargar registros de hoy
    const hoy = new Date().toISOString().split('T')[0];
    const { data: registros } = await supabase
      .from('registros')
      .select('*, ordenes(descripcion, numero)')
      .eq('empleado_id', session.user.id)
      .eq('fecha', hoy)
      .order('hora_inicio', { ascending: true });

    setRegistrosHoy(registros || []);
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  const totalHoras = registrosHoy.reduce((acc, r) => {
    const inicio = r.hora_inicio.split(':');
    const fin = r.hora_fin.split(':');
    const diff = (parseInt(fin[0]) * 60 + parseInt(fin[1])) -
                 (parseInt(inicio[0]) * 60 + parseInt(inicio[1]));
    return acc + diff;
  }, 0);

  const horasFormateadas = `${Math.floor(totalHoras / 60)}h ${totalHoras % 60}m`;

  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--primary)'
    }}>
      <div style={{ fontSize: 48 }}>⚙️</div>
    </div>
  );

  const hoy = new Date().toLocaleDateString('pt-PT', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  return (
    <div className="page" style={{ padding: 0 }}>

      {/* HEADER */}
      <div style={{
        background: 'var(--primary)',
        padding: '48px 24px 32px',
        color: 'white',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: 13, opacity: 0.6, marginBottom: 4, textTransform: 'capitalize' }}>{hoy}</p>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>
              Olá, {empleado?.nombre.split(' ')[0]} 👋
            </h1>
            <p style={{ fontSize: 12, opacity: 0.5, marginTop: 4 }}>
              Nº {empleado?.numero_empleado} · {empleado?.area}
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none', borderRadius: 10,
              padding: '8px 14px', color: 'white',
              fontSize: 13, cursor: 'pointer'
            }}
          >
            Sair
          </button>
        </div>

        {/* Stats del día */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 12, marginTop: 24
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 14, padding: '16px'
          }}>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{registrosHoy.length}</div>
            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>Registos hoje</div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 14, padding: '16px'
          }}>
            <div style={{ fontSize: 28, fontWeight: 800 }}>
              {registrosHoy.length > 0 ? horasFormateadas : '0h'}
            </div>
            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>Horas registadas</div>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Botón nuevo registro */}
        <button
          className="btn btn-primary"
          onClick={() => router.push('/nuevo-registro')}
          style={{ fontSize: 16, padding: '18px' }}
        >
          + Novo registo
        </button>

        {/* Acciones secundarias */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <button
            className="btn btn-secondary"
            onClick={() => router.push('/resumen')}
            style={{ fontSize: 14 }}
          >
            📋 Resumo do dia
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => router.push('/historico')}
            style={{ fontSize: 14 }}
          >
            📅 Histórico
          </button>
        </div>

        {/* Registros de hoy */}
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            Registos de hoje
          </h2>

          {registrosHoy.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '32px 20px' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📝</div>
              <p style={{ color: 'var(--gray)', fontSize: 14 }}>
                Ainda não tens registos hoje
              </p>
              <p style={{ color: 'var(--gray)', fontSize: 12, marginTop: 4, opacity: 0.7 }}>
                Adiciona o teu primeiro registo do dia
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {registrosHoy.map(r => (
                <div key={r.id} className="card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, marginBottom: 2 }}>
                        Ordem {r.ordenes?.numero}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                        {r.ordenes?.descripcion}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--gray)', marginTop: 4 }}>
                        {r.descripcion}
                      </div>
                    </div>
                    <div style={{
                      background: 'var(--gray2)', borderRadius: 8,
                      padding: '6px 10px', fontSize: 12,
                      fontWeight: 600, color: 'var(--text)',
                      whiteSpace: 'nowrap', marginLeft: 12
                    }}>
                      {r.hora_inicio.slice(0,5)} - {r.hora_fin.slice(0,5)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}