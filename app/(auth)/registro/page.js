'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Registro() {
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    numero_empleado: '',
    area: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const areas = [
    'Pintura',
    'Mecánica',
    'Serralheria',
    'Electrica',
    'Otro',
  ];

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleRegistro(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 1. Crear usuario en Supabase Auth
    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // 2. Guardar perfil en tabla empleados
    const { error: profileError } = await supabase
      .from('empleados')
      .insert({
        id: data.user.id,
        nombre: form.nombre,
        numero_empleado: form.numero_empleado,
        area: form.area,
      });

    if (profileError) {
      setError('Error al crear perfil. Intenta de nuevo.');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  }

  return (
    <div style={{ minHeight: '100vh', padding: '40px 24px', background: 'var(--white)' }}>
      <button
        onClick={() => router.back()}
        style={{ background: 'none', fontSize: 24, marginBottom: 24, color: 'var(--text)' }}
      >
        ←
      </button>

      <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5, marginBottom: 6 }}>
        Crear cuenta
      </h1>
      <p style={{ color: 'var(--gray)', fontSize: 14, marginBottom: 32, fontWeight: 300 }}>
        Solo necesitas hacerlo una vez
      </p>

      <form onSubmit={handleRegistro} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div className="form-group">
          <label className="label">Nombre completo</label>
          <input
            className="input"
            name="nombre"
            placeholder="João Silva"
            value={form.nombre}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="label">Número de empleado</label>
          <input
            className="input"
            name="numero_empleado"
            placeholder="12345"
            value={form.numero_empleado}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="label">Área de trabajo</label>
          <select
            className="input"
            name="area"
            value={form.area}
            onChange={handleChange}
            required
          >
            <option value="">Selecciona tu área</option>
            {areas.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            name="email"
            placeholder="tu@email.com"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="label">Contraseña</label>
          <input
            className="input"
            type="password"
            name="password"
            placeholder="Mínimo 6 caracteres"
            value={form.password}
            onChange={handleChange}
            minLength={6}
            required
          />
        </div>

        {error && (
          <div style={{
            background: '#fff0f0', border: '1px solid #ffcccc',
            color: '#cc0000', padding: '12px 16px', borderRadius: 10,
            fontSize: 13, textAlign: 'center', marginBottom: 8
          }}>
            {error}
          </div>
        )}

        <button
          className="btn btn-primary"
          type="submit"
          disabled={loading}
          style={{ marginTop: 8 }}
        >
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </form>
    </div>
  );
}