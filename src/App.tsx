import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { PacienteDetails } from './pages/PacienteDetails';
import { MeusDados } from './pages/MeusDados';
import { Usuarios } from './pages/Usuarios';
import { Pacientes } from './pages/Pacientes';
import { Prontuarios } from './pages/Prontuarios';
import { Layout } from './components/Layout';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </PrivateRoute>
            } 
          />
          <Route 
            path="/paciente/:id" 
            element={
              <PrivateRoute>
                <Layout>
                  <PacienteDetails />
                </Layout>
              </PrivateRoute>
            } 
          />
          <Route 
            path="/meus-dados" 
            element={
              <PrivateRoute>
                <Layout>
                  <MeusDados />
                </Layout>
              </PrivateRoute>
            } 
          />
          <Route 
            path="/usuarios" 
            element={
              <PrivateRoute>
                <Layout>
                  <Usuarios />
                </Layout>
              </PrivateRoute>
            } 
          />
          <Route 
            path="/pacientes" 
            element={
              <PrivateRoute>
                <Layout>
                  <Pacientes />
                </Layout>
              </PrivateRoute>
            } 
          />
          <Route 
            path="/prontuarios" 
            element={
              <PrivateRoute>
                <Layout>
                  <Prontuarios />
                </Layout>
              </PrivateRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
