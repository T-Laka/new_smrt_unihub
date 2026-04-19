import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import FindRidePage from './pages/FindRidePage';
import BecomeDriverPage from './pages/BecomeDriverPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RiderDashboardPage from './pages/RiderDashboardPage';
import DriverDashboardPage from './pages/DriverDashboardPage';
import ChatPage from './pages/ChatPage';
import AdminPage from './pages/AdminPage';
import AdminStudyAreaPage from './pages/AdminStudyAreaPage';
import CanteenAdminPage from './pages/CanteenAdminPage';
import AdminEventsPage from './pages/AdminEventsPage';
import TrackRidePage from './pages/TrackRidePage';
import EventsPage from './pages/EventsPage';
import EventDetailsPage from './pages/EventDetailsPage';
import EventBookingPage from './pages/EventBookingPage';
import CreateEventPage from './pages/CreateEventPage';
import EventStallRequestPage from './pages/EventStallRequestPage';
import EventMemoriesPage from './pages/EventMemoriesPage';
import EventsCalendarPage from './pages/EventsCalendarPage';
import MyEventBookingsPage from './pages/MyEventBookingsPage';
import DashboardTestPage from './pages/DashboardTestPage';
import StudyAreaPage from './pages/StudyAreaPage';
import StudentFinesPage from './pages/StudentFinesPage';
import CanteenPage from './pages/CanteenPage';
import CanteenOffersPage from './pages/CanteenOffersPage';
import CanteenFoodStockPage from './pages/CanteenFoodStockPage';
import CanteenRequestPage from './pages/CanteenRequestPage';
import HelperProfilePage from './pages/HelperProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import { CanteenProvider } from './context/CanteenContext';

export default function App() {
  const location = useLocation();
  const path = location.pathname.toLowerCase();
  const isAdminRoute =
    path === '/admin' ||
    path === '/admin-dashboard' ||
    path.startsWith('/admin-') ||
    path.startsWith('/admin/') ||
    path === '/canteenadmin' ||
    path === '/canteeenadmin' ||
    path === '/admincanteen' ||
    path === '/adminevent';

  return (
    <CanteenProvider>
      <div className={`app-shell ${isAdminRoute ? 'admin-shell' : ''}`}>
        {isAdminRoute ? (
          <header className="admin-topbar-wrap">
            <div className="container admin-topbar">
              <Link to="/admin" className="admin-brand">Admin Dashboard</Link>
              <nav className="admin-topbar-links">
                <Link to="/admin">Overview</Link>
                <Link to="/admin-canteen">Canteen Admin</Link>
                <Link to="/admin-events">Event Admin</Link>
                <Link to="/admin-study-area">Study Area Admin</Link>
              </nav>
            </div>
          </header>
        ) : (
          <Navbar />
        )}
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/find-ride" element={<FindRidePage />} />
            <Route path="/become-driver" element={<BecomeDriverPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/rider-dashboard" element={<RiderDashboardPage />} />
            <Route path="/driver-dashboard" element={<DriverDashboardPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin-dashboard" element={<Navigate to="/admin" replace />} />
            <Route path="/admin-study-area" element={<AdminStudyAreaPage />} />
            <Route path="/admin-canteen" element={<CanteenAdminPage />} />
            <Route path="/admin/canteen" element={<CanteenAdminPage />} />
            <Route path="/canteenadmin" element={<CanteenAdminPage />} />
            <Route path="/canteeenadmin" element={<CanteenAdminPage />} />
            <Route path="/admincanteen" element={<CanteenAdminPage />} />
            <Route path="/admin-events" element={<AdminEventsPage />} />
            <Route path="/admin/events" element={<AdminEventsPage />} />
            <Route path="/adminevent" element={<AdminEventsPage />} />
            <Route path="/track-ride" element={<TrackRidePage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetailsPage />} />
            <Route path="/events/:id/book" element={<EventBookingPage />} />
            <Route path="/create-event" element={<CreateEventPage />} />
            <Route path="/event-stalls/new" element={<EventStallRequestPage />} />
            <Route path="/event-memories" element={<EventMemoriesPage />} />
            <Route path="/events-calendar" element={<EventsCalendarPage />} />
            <Route path="/my-event-bookings" element={<MyEventBookingsPage />} />
            <Route path="/canteen" element={<CanteenPage />} />
            <Route path="/canteen-offers" element={<CanteenOffersPage />} />
            <Route path="/canteen-food-stock" element={<CanteenFoodStockPage />} />
            <Route path="/canteen-requests" element={<CanteenRequestPage />} />
            <Route path="/helper-profile" element={<HelperProfilePage />} />
            <Route path="/study-area" element={<StudyAreaPage />} />
            <Route path="/student-fines" element={<StudentFinesPage />} />
            <Route path="/dashboard-test" element={<DashboardTestPage />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        {!isAdminRoute ? <Footer /> : null}
      </div>
    </CanteenProvider>
  );
}