import { NavLink, useLocation, useResolvedPath } from "react-router-dom";

function NavLinkTab({ to, children, ...props }) {
  const path = useResolvedPath(to);
  const location = useLocation();

  const isActive = location.pathname === path.pathname;

  return (
    <li className={isActive ? "is-active" : ""}>
      <NavLink to={to} {...props}>
        {children}
      </NavLink>
    </li>
  );
}

export default NavLinkTab;
