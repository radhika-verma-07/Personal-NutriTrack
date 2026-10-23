import { Link, NavLink, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const navLinkClassName = ({ isActive }) =>
    `navbar-link${isActive ? " active" : ""}`;

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("userProfile");

    navigate("/login");
  };

  return (
    <nav className="main-navbar" aria-label="Primary navigation">
      {/* Logo */}
      <Link to="/dashboard" className="navbar-logo">
        <span className="logo-icon">🥗</span>

        <div>
          <span className="logo-main">Personal NutriTrack</span>

          <span className="logo-subtitle">Eat Smart • Live Healthy</span>
        </div>
      </Link>

      {/* Navigation Links */}
      <div className="navbar-links">
        <NavLink to="/dashboard" className={navLinkClassName}>
          Dashboard
        </NavLink>

        <NavLink to="/food-upload" className={navLinkClassName}>
          Analyze Food
        </NavLink>

        <NavLink to="/food-vault" className={navLinkClassName}>
          Food Vault
        </NavLink>

        <NavLink to="/activity" className={navLinkClassName}>
          Activity
        </NavLink>

        <NavLink to="/weight" className={navLinkClassName}>
          Weight
        </NavLink>

        <NavLink to="/weekly" className={navLinkClassName}>
          Weekly
        </NavLink>

        <button type="button" onClick={handleLogout} className="navbar-logout">
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
