import type { ReactNode } from 'react';
import { TopNavBar } from '../../components/TopNavBar';
import { SideNavBar } from '../../components/SideNavBar';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <TopNavBar />
      <div className="flex">
        <SideNavBar />
        {children}
      </div>
    </>
  );
}
