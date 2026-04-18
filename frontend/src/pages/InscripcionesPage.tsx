import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { SemesterAlert } from '../components/SemesterAlert';
import { SemesterEnrollmentDnd } from '../components/SemesterEnrollmentDnd';
import { inscripcionesService, type Inscripcion } from '../services/inscripciones.service';
import { api } from '../services/api';

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
    <div className="gradum-page gradum-dashboard">
      <header className="gradum-dash-header gradum-dash-header--wide">
        <Link to="/" className="gradum-logo gradum-logo--link">GRADUM</Link>
        <nav className="gradum-dash-nav">
          <Link to="/dashboard" className="gradum-link">Dashboard</Link>
          <span className="gradum-dash-nav__current">/ Inscripciones</span>
        </nav>
      </header>
      <main className="gradum-dash-main gradum-dash-main--wide">
        <h1>Inscripciones {semestreEtiqueta}</h1>
        {error && <p className="gradum-error">{error}</p>}
        <SemesterAlert hasPendingPrevious={false} />
        <SemesterEnrollmentDnd disponibles={disponibles} inscritas={inscritas} onEnroll={handleEnroll} onUnenroll={handleUnenroll} />
      </main>
    </div>
  );
}
