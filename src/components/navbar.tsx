import { NavLink } from "react-router-dom";
import NavbarUser from "@/components/auth/navbar-user.tsx";
import ThemeSwitcher from "@/components/ThemeSwitcher";

function Navbar() {
  const getNavLinkClass = ({ isActive }) =>
    "navbar-item" + (isActive ? " is-active" : "");

  return (
    <nav
      className="navbar is-dark hidden sm:flex"
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
      </div>
      <div id="navbarMenu" className={"navbar-menu"}>
        <div className="navbar-start">
          <NavLink to="eatings" className={getNavLinkClass}>
            Eatings
          </NavLink>
          <NavLink to="dishes" className={getNavLinkClass}>
            Dishes
          </NavLink>
          <NavLink to="trends" className={getNavLinkClass}>
            Trends
          </NavLink>
          <NavLink to="account" className={getNavLinkClass}>
            Account
          </NavLink>
        </div>

        <div className="navbar-end">
          <div className="navbar-item is-hidden-touch">
            <ThemeSwitcher />
          </div>
          <div className="navbar-item">
            <NavbarUser />
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
