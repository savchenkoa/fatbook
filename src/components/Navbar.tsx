import { useState } from "react";
import { NavLink } from "react-router-dom";
import CurrentUser from "@/components/auth/CurrentUser";
import ThemeSwitcher from "@/components/ThemeSwitcher";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const getNavLinkClass = ({ isActive }) =>
    "navbar-item" + (isActive ? " is-active" : "");
  const dropdownActiveClassName = menuOpen ? " is-active" : "";
  const handleBurgerClick = (e) => {
    e.preventDefault();
    setMenuOpen(!menuOpen);
  };
  const handleLinkClick = () => setMenuOpen(false);

  return (
    <nav
      className="navbar is-dark"
      role="navigation"
      aria-label="main navigation"
    >
      <div className="navbar-brand">
        <a className="navbar-item" href="/">
          <img src="/burger.png" alt="burger-icon" width="28" height="28" />
          <h1 className="is-size-4 has-text-weight-bold ml-2">Fatbook</h1>
        </a>

        <p className="navbar-item is-hidden-desktop ml-auto">
          <ThemeSwitcher />
        </p>
        <a
          role="button"
          className={"navbar-burger ml-0" + dropdownActiveClassName}
          aria-label="menu"
          aria-expanded="false"
          data-target="navbarMenu"
          href="/public"
          onClick={handleBurgerClick}
        >
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </a>
      </div>
      <div id="navbarMenu" className={"navbar-menu" + dropdownActiveClassName}>
        <div className="navbar-start">
          <NavLink
            to="eatings"
            className={getNavLinkClass}
            onClick={handleLinkClick}
          >
            Eatings
          </NavLink>
          <NavLink
            to="dishes"
            className={getNavLinkClass}
            onClick={handleLinkClick}
          >
            Dishes
          </NavLink>
          <NavLink
            to="trends"
            className={getNavLinkClass}
            onClick={handleLinkClick}
          >
            Trends
          </NavLink>
          <NavLink
            to="settings"
            className={getNavLinkClass}
            onClick={handleLinkClick}
          >
            Settings
          </NavLink>
        </div>

        <div className="navbar-end">
          <div className="navbar-item is-hidden-touch">
            <ThemeSwitcher />
          </div>
          <div className="navbar-item">
            <CurrentUser />
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
