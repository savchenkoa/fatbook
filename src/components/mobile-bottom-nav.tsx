import {
  LuChartColumnIncreasing,
  LuHouse,
  LuSearch,
  LuUser,
} from "react-icons/lu";
import { NavLink } from "react-router-dom";

const getActiveLinkClassName = ({ isActive }) =>
  isActive ? "text-blue-500!" : "text-slate-500!";

export function MobileBottomNav() {
  return (
    <div className="fixed bottom-0 flex h-18 w-full items-center justify-around border-t-1 bg-white pb-1.5 sm:hidden">
      <NavLink to="eatings" className={getActiveLinkClassName}>
        <div className="flex flex-col items-center gap-1">
          <LuHouse className="w-[20px]!" />
          <span className="text-xs">Home</span>
        </div>
      </NavLink>
      <NavLink to="dishes" className={getActiveLinkClassName}>
        <div className="flex flex-col items-center gap-1">
          <LuSearch className="w-[20px]!" />
          <span className="text-xs">Dishes</span>
        </div>
      </NavLink>
      <NavLink to="insights" className={getActiveLinkClassName}>
        <div className="flex flex-col items-center gap-1">
          <LuChartColumnIncreasing className="w-[20px]!" />
          <span className="text-xs">Insights</span>
        </div>
      </NavLink>
      <NavLink to="account" className={getActiveLinkClassName}>
        <div className="flex flex-col items-center gap-1">
          <LuUser className="w-[20px]!" />
          <span className="text-xs">Account</span>
        </div>
      </NavLink>
    </div>
  );
}
