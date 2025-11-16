import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/DashboardPage';
import UsersPage from './pages/UsersPage'
import TypesPage from './pages/TypesPage';
import GestionAreasPage from './pages/GestionAreasPage';
import RazasPage from './pages/RazasPage';
import AnimalesPage from './pages/AnimalesPage';
import ProveedoresPage from './pages/ProveedoresPage';
import GestionInsumosPage from './pages/GestionInsumosPage';
import GestionComprasPage from './pages/GestionComprasPage';
import MontasPage from './pages/MontasPage';
import DiagnosticosPage from './pages/DiagnosticosPage';
import PartosPage from './pages/PartosPage';
import EventosSanitariosPage from './pages/EventoSanitarioPage';
import AlimentacionesPage from './pages/AlimentacionesPage';
import PesajesPage from './pages/PesajesPage';
import ProduccionesLecheraPage from './pages/ProduccionLecheraPage';
import GestionCarnePage from './pages/GestionCarnePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<UsersPage/>}/>
        <Route path="/types" element={<TypesPage/>}></Route>
        <Route path="/gestion-areas" element={<GestionAreasPage/>}></Route>
        <Route path="/razas" element={<RazasPage/>}></Route>
        <Route path="/animales" element={<AnimalesPage/>}></Route>
        <Route path="/proveedores" element={<ProveedoresPage/>}></Route>
        <Route path="/gestion-insumos" element={<GestionInsumosPage/>}></Route>
        <Route path="/gestion-compras" element={<GestionComprasPage/>}></Route>
        <Route path="/montas" element={<MontasPage/>}></Route>
        <Route path="/diagnosticos" element={<DiagnosticosPage/>}></Route>
        <Route path="/partos" element={<PartosPage/>}></Route>
        <Route path="/evento" element={<EventosSanitariosPage/>}></Route>
        <Route path="/alimentaciones" element={<AlimentacionesPage/>}></Route>
        <Route path="/pesajes" element={<PesajesPage/>}></Route>
        <Route path="/produccionLechera" element={<ProduccionesLecheraPage/>}></Route>
        <Route path="/produccionCarne" element={<GestionCarnePage/>}></Route>
      </Routes>
    </Router>
  );
}

export default App;