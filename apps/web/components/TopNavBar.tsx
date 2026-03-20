import React from 'react';

export function TopNavBar() {
  return (
    <nav className="w-full sticky top-0 z-50 bg-white/80 backdrop-blur-xl shadow-sm flex items-center justify-between px-6 py-3">
      <div className="flex items-center gap-8">
        <span className="text-xl font-black tracking-tighter text-violet-700">LucidEditor</span>
        <div className="hidden md:flex items-center gap-6 font-sans antialiased text-sm font-medium">
          <a className="text-slate-600 hover:text-slate-900 transition-colors duration-200" href="#">Templates</a>
          <a className="text-slate-600 hover:text-slate-900 transition-colors duration-200" href="#">Features</a>
          <a className="text-slate-600 hover:text-slate-900 transition-colors duration-200" href="#">Learn</a>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant/15">
          <span className="material-symbols-outlined text-on-surface-variant text-sm" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>search</span>
          <input className="bg-transparent border-none focus:ring-0 text-sm w-48 placeholder:text-on-surface-variant" placeholder="Search brands..." type="text" />
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-600 hover:bg-slate-50 rounded-full transition-colors"><span className="material-symbols-outlined">notifications</span></button>
          <button className="p-2 text-slate-600 hover:bg-slate-50 rounded-full transition-colors"><span className="material-symbols-outlined">settings</span></button>
        </div>
        <button className="bg-gradient-to-br from-primary to-primary-container text-white px-5 py-2 rounded-full text-sm font-bold active:scale-95 transition-transform">Create a design</button>
        <div className="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden">
          <img alt="User profile" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB92df9kEsENuMCHx93-lcs_QYVQz9eiBHw5u5qyiRuRiijjWm6Kq0IcoaRgJ7CWl33oc2rkrLRvCju5d1e7E1S_32cMP5ZdJ3z2U2H5Q5uF1RsCI0oN5h-b2aqGlX_JeLj1b5Nhk17e7YMyUm0yOnpqgnfGZFXtbS-DdaYPTOuW5YaJtSAkQjiIGxWJ84nogSWYqNwmPL3r2my9u4-_fdQ19J6cKKLdYbdGjRb2OFaxKa1t_G9poW7ZdHEzPORlYLRNZffpslao_Y" />
        </div>
      </div>
    </nav>
  );
}
