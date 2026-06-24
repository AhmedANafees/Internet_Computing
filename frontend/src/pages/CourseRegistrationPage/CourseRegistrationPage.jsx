import Sidebar from '../../components/Sidebar/Sidebar';
import CourseRegistrationPageHeader from '../../components/CourseRegistrationPage/CourseRegistrationPageHeader';
import './CourseRegistrationPage.css';
export default function CourseRegistrationPage() {
  return (
    <div className="cr-layout">
      <Sidebar />
      <main className="cr-main">
        <CourseRegistrationPageHeader />
        <section className="cr-card">
          <h3>Course Registration</h3>
          <p>This page scaffold is ready for course catalog features.</p>
        </section>
      </main>
    </div>
  );
}
