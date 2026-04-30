import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { SemesterAlert } from '../components/SemesterAlert';
import { SemesterEnrollmentDnd } from '../components/SemesterEnrollmentDnd';
import { inscripcionesService, type Inscripcion } from '../services/inscripciones.service';
import { api } from '../services/api';
import { DashboardLayout } from '../components/layout/DashboardLayout';

export function InscripcionesPage() {
  useAuth();
  const [inscritas, setInscritas] = useState<Inscripcion[]>([]);
  const [disponibles, setDisponibles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [semestreEtiqueta, setSemestreEtiqueta] = useState<string>('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const perfil = await api.get<any>('/perfiles/me');
      setSemestreEtiqueta(perfil.semestreActual);

      const [inscData, dispData] = await Promise.all([
        inscripcionesService.getInscripciones(perfil.semestreActual),
        inscripcionesService.getMateriasDisponibles(perfil.semestreActual),
      ]);

      setInscritas(inscData);
      setDisponibles(dispData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleEnroll = async (materiaId: string) => {
    try {
      await inscripcionesService.createInscripcion(materiaId, semestreEtiqueta);
      await loadData();
    } catch (err: any) { alert(err.message); }
  };

  const handleUnenroll = async (id: string) => {
    try {
      await inscripcionesService.removeInscripcion(id);
      await loadData();
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return <div className="gradum-page gradum-loading"><p>Cargando...</p></div>;

  return (
    <DashboardLayout>
      <div style={{ flex: 1, padding: '1rem 0' }}>
        <h1 style={{ marginBottom: '1rem' }}>Inscripciones {semestreEtiqueta}</h1>
        {error && <p className="gradum-error">{error}</p>}
        <SemesterAlert hasPendingPrevious={false} />
        <SemesterEnrollmentDnd disponibles={disponibles} inscritas={inscritas} onEnroll={handleEnroll} onUnenroll={handleUnenroll} />
      </div>
    </DashboardLayout>
  );
}
