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
import { Atendimentos } from './pages/Atendimentos';
import { AgendarAtendimento } from './pages/AgendarAtendimento';
import { SalaEspera } from './pages/SalaEspera';
import { Financeiro } from './pages/Financeiro';
import { Fornecedores } from './pages/Fornecedores';
import { Filiais } from './pages/Filiais';
import { Layout } from './components/Layout';
// Trigger HMR re-render

import { Toaster } from "sonner";

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors closeButton />
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
          <Route
            path="/atendimentos"
            element={
              <PrivateRoute>
                <Layout>
                  <Atendimentos />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/atendimentos/agendar"
            element={
              <PrivateRoute>
                <Layout>
                  <AgendarAtendimento />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/sala-espera"
            element={
              <PrivateRoute>
                <Layout>
                  <SalaEspera />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/financeiro"
            element={
              <PrivateRoute>
                <Layout>
                  <Financeiro />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/fornecedores"
            element={
              <PrivateRoute>
                <Layout>
                  <Fornecedores />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/filiais"
            element={
              <PrivateRoute>
                <Layout>
                  <Filiais />
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
