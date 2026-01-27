import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './hooks/useAuth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Inbox from './pages/Inbox';
import Thread from './pages/Thread';
import Projects from './pages/Projects';
import Project from './pages/Project';
import Clients from './pages/Clients';
import Client from './pages/Client';
import Team from './pages/Team';
import Analytics from './pages/Analytics';
import Search from './pages/Search';
import PendingApprovals from './pages/PendingApprovals';

function PrivateRoute({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/inbox" replace />} />
                <Route path="/inbox" element={<Inbox />} />
                <Route path="/thread/:id" element={<Thread />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/project/:id" element={<Project />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/client/:id" element={<Client />} />
                <Route path="/team" element={<Team />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/search" element={<Search />} />
                <Route path="/approvals" element={<PendingApprovals />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
