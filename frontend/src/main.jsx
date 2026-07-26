import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './index.css';
import LoginPage from './pages/LoginPage/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage/DashboardPage.jsx';
import CourseRegistrationPage from './pages/CourseRegistrationPage/CourseRegistrationPage.jsx';
import AdminCoursePage from './pages/AdminCoursePage/AdminCoursePage.jsx';
import TimetablePage from './pages/TimetablePage/TimetablePage.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/courses" element={<CourseRegistrationPage />} />
        <Route path="/admin/courses" element={<AdminCoursePage />} />
        <Route path="/timetable" element={<TimetablePage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
