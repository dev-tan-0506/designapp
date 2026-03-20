import React from 'react';
import Link from 'next/link';

export function SideNavBar() {
  return (
    <aside className="h-screen w-64 fixed left-0 top-0 pt-16 flex flex-col gap-2 p-4 border-r border-slate-200 bg-slate-50 z-40">
      <div className="px-4 py-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">L</div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-on-surface">Personal Workspace</p>
            <p className="text-[10px] uppercase font-bold tracking-widest text-primary">Pro Plan</p>
          </div>
        </div>
      </div>
      <nav className="flex flex-col gap-1 text-sm font-semibold tracking-tight">
        <Link className="text-slate-500 px-4 py-2 hover:bg-slate-200 rounded-lg transition-all duration-200 ease-in-out flex items-center gap-3" href="/dashboard">
          <span className="material-symbols-outlined">home</span> Home
        </Link>
        <Link className="text-slate-500 px-4 py-2 hover:bg-slate-200 rounded-lg transition-all duration-200 ease-in-out flex items-center gap-3" href="/dashboard/projects">
          <span className="material-symbols-outlined">folder_open</span> Projects
        </Link>
        <Link className="text-slate-500 px-4 py-2 hover:bg-slate-200 rounded-lg transition-all duration-200 ease-in-out flex items-center gap-3" href="/dashboard/templates">
          <span className="material-symbols-outlined">dashboard_customize</span> Templates
        </Link>
        <Link className="bg-violet-100 text-violet-800 rounded-lg px-4 py-2 flex items-center gap-3 transition-all duration-200 ease-in-out" href="/brand-kit">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span> Brand Kit
        </Link>
      </nav>
      <div className="mt-auto border-t border-slate-200 pt-4 flex flex-col gap-1">
        <Link className="text-slate-500 px-4 py-2 hover:bg-slate-200 rounded-lg transition-all duration-200 ease-in-out flex items-center gap-3" href="/dashboard/trash">
          <span className="material-symbols-outlined">delete</span> Trash
        </Link>
        <Link className="text-slate-500 px-4 py-2 hover:bg-slate-200 rounded-lg transition-all duration-200 ease-in-out flex items-center gap-3" href="/dashboard/help">
          <span className="material-symbols-outlined">help</span> Help
        </Link>
        <button className="mt-4 mx-2 bg-surface-container-high text-on-surface py-2 rounded-lg text-sm font-bold hover:bg-surface-container-highest transition-colors">Invite Members</button>
      </div>
    </aside>
  );
}
