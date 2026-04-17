import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { clearAuthenticatedUser, readStoredUser } from '../lib/auth';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/find-ride', label: 'Find Ride' },
  { to: '/events', label: 'Events' },
  { to: '/events-calendar', label: 'Calendar' },
  { to: '/canteen', label: 'Canteen' },
  { to: '/study-area', label: 'Study Area' },
  { to: '/student-fines', label: 'My Fines' },
  { to: '/become-driver', label: 'Become a Driver' }
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => readStoredUser());

  useEffect(() => {
    const handleAuthChange = () => setCurrentUser(readStoredUser());
    window.addEventListener('auth-changed', handleAuthChange);

    return () => window.removeEventListener('auth-changed', handleAuthChange);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setAccountMenuOpen(false);
  }, [location.pathname, location.hash]);

  const firstName = currentUser?.name ? currentUser.name.split(' ')[0] : 'User';

  function handleLogout(event) {
    event.preventDefault();
    clearAuthenticatedUser();
    navigate('/login');
  }

  return (
    <header className="navbar-wrap">
      <nav className="navbar container">
        <Link to="/" className="brand">
          <span className="brand-mark">🚗</span>
          <span>SLIIT<span>Transport</span></span>
        </Link>

        <button
          type="button"
          className={`burger ${menuOpen ? 'open' : ''}`}
          aria-label="Toggle navigation"
          onClick={() => setMenuOpen((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`nav-panel ${menuOpen ? 'open' : ''}`}>
          <ul className="nav-links">
            {navLinks.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to} end={link.to === '/'}>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="nav-actions">
            {currentUser ? (
              <div className="account-menu">
                <button
                  type="button"
                  className="account-button"
                  onClick={() => setAccountMenuOpen((value) => !value)}
                >
                  <span className="account-avatar">👤</span>
                  <span>{firstName}</span>
                  <span className="account-caret">▾</span>
                </button>

                {accountMenuOpen ? (
                  <div className="account-dropdown">
                    {currentUser.role === 'admin' ? <Link to="/admin">Admin Panel</Link> : null}
                    {currentUser.role === 'admin' ? <Link to="/admin-canteen">Canteen Admin</Link> : null}
                    {currentUser.role === 'admin' ? <Link to="/admin-events">Event Admin</Link> : null}
                    {currentUser.role === 'driver' ? <Link to="/driver-dashboard">Dashboard</Link> : null}
                    {currentUser.role !== 'admin' && currentUser.role !== 'driver' ? <Link to="/rider-dashboard">Dashboard</Link> : null}
                    <Link to="/chat">Messages</Link>
                    <button type="button" className="dropdown-logout" onClick={handleLogout}>
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <Link to="/login" className="nav-link-ghost">
                  Login
                </Link>
                <Link to="/register" className="button button-primary button-small">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}