import { NavLink, useLocation, useResolvedPath } from "react-router-dom";

function NavLinkTab({ to, children, ...props }) {
  const path = useResolvedPath(to);
  const location = useLocation();

  const isActive = location.pathname === path.pathname;

  return (
    <li className={"rounded-t-lg px-5 py-3 " + (isActive ? "bg-white" : "")}>
      <NavLink to={to} {...props} className="text-accent-foreground">
        {children}
      </NavLink>
    </li>
  );
}

export default NavLinkTab;
