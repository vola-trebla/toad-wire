import { Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from './LandingPage';
import { AdminPage } from './admin/AdminPage';
import { LiveLogs } from './components/LiveLogs';

export default function App() {
  const adminEnabled =
    import.meta.env.DEV || (import.meta.env.VITE_ENABLE_ADMIN as string | undefined) === 'true';

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {adminEnabled ? (
          <Route path="/admin" element={<AdminPage />} />
        ) : (
          <Route path="/admin" element={<Navigate to="/" replace />} />
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <LiveLogs />
    </>
  );
}
