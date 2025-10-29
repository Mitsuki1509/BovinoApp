import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/DashboardPage';
import UsersPage from './pages/UsersPage'
import TypesPage from './pages/TypesPage';
import PotrerosPage from './pages/PotrerosPage';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<UsersPage/>}/>
        <Route path="/types" element={<TypesPage/>}></Route>
        <Route path="/potreros" element={<PotrerosPage />} />
      </Routes>
    </Router>
  );
}

export default App;