import { Navigate, Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { FormPage } from './pages/FormPage';
import { SuccessPage } from './pages/SuccessPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminLeadsPage } from './pages/AdminLeadsPage';
import { AdminLeadDetailPage } from './pages/AdminLeadDetailPage';

export const App = () => (
  <Routes>
    <Route path='/' element={<HomePage />} />
    <Route path='/form' element={<FormPage />} />
    <Route path='/success' element={<SuccessPage />} />
    <Route path='/admin/login' element={<AdminLoginPage />} />
    <Route path='/admin' element={<AdminLeadsPage />} />
    <Route path='/admin/leads/:id' element={<AdminLeadDetailPage />} />
    <Route path='*' element={<Navigate to='/' />} />
  </Routes>
);
