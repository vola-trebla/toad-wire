import { Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from './LandingPage';
import { AdminPage } from './admin/AdminPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
