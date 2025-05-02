import {
  LuChartColumnIncreasing,
  LuHouse,
  LuSearch,
  LuUser,
} from "react-icons/lu";
import { NavLink } from "react-router-dom";

const getActiveLinkClassName = ({ isActive }) =>
  isActive ? "tw:text-blue-500!" : "tw:text-slate-500!";

export const MobileBottomNav = () => {
  return (
    <div className="tw:fixed tw:bottom-0 tw:sm:hidden tw:bg-white tw:w-full tw:h-16 tw:rounded-t-xl tw:flex tw:items-center tw:justify-around">
      <NavLink to="eatings" className={getActiveLinkClassName}>
        <div className="tw:flex tw:flex-col tw:items-center tw:gap-1">
          <LuHouse className="tw:w-[20px]!" />
          <span className="tw:text-xs">Home</span>
        </div>
      </NavLink>
      <NavLink to="dishes" className={getActiveLinkClassName}>
        <div className="tw:flex tw:flex-col tw:items-center tw:gap-1">
          <LuSearch className="tw:w-[20px]!" />
          <span className="tw:text-xs">Dishes</span>
        </div>
      </NavLink>
      <NavLink to="trends" className={getActiveLinkClassName}>
        <div className="tw:flex tw:flex-col tw:items-center tw:gap-1">
          <LuChartColumnIncreasing className="tw:w-[20px]!" />
          <span className="tw:text-xs">Insights</span>
        </div>
      </NavLink>
      <NavLink to="settings" className={getActiveLinkClassName}>
        <div className="tw:flex tw:flex-col tw:items-center tw:gap-1">
          <LuUser className="tw:w-[20px]!" />
          <span className="tw:text-xs">Account</span>
        </div>
      </NavLink>
    </div>
  );
};
