import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './index.css';
import LoginPage from './pages/LoginPage/LoginPage.jsx';
import CourseRegistrationPage from './pages/CourseRegistrationPage/CourseRegistrationPage.jsx';
import AdminCoursePage from './pages/AdminCoursePage/AdminCoursePage.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/courses" element={<CourseRegistrationPage />} />
        <Route path="/admin/courses" element={<AdminCoursePage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
