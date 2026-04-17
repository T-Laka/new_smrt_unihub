import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <div className="footer-brand">🚗 SLIIT Transport</div>
          <p>
            Connecting SLIIT students for safe, affordable, and eco-friendly campus commutes since 2024.
          </p>
        </div>

        <div>
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/find-ride">Find a Ride</Link></li>
            <li><Link to="/become-driver">Become a Driver</Link></li>
          </ul>
        </div>

        <div>
          <h4>Account</h4>
          <ul>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/register">Register</Link></li>
            <li><Link to="/chat">Messages</Link></li>
          </ul>
        </div>
      </div>

      <div className="container footer-bottom">© 2026 SLIIT Student Transport. All rights reserved.</div>
    </footer>
  );
}