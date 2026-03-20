import React from 'react';

export default function BrandKitPage() {
  return (
    <main className="ml-64 flex-1 p-8 bg-surface-container-low min-h-screen">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-on-surface mb-2">Brand Kit</h1>
          <p className="text-on-surface-variant font-medium">Manage your brand identities and assets across all projects.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-highest text-on-surface font-semibold text-sm hover:bg-slate-200 transition-colors">
            <span className="material-symbols-outlined text-lg">swap_horiz</span>
            Switch Brand
          </button>
          <button className="flex items-center gap-2 px-6 py-2 rounded-full bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-lg">add</span>
            New Brand Kit
          </button>
        </div>
      </header>
      <div className="grid grid-cols-12 gap-6">
        {/* Brand Selection & Status */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-xl p-6 shadow-sm flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight">Active Brand</h2>
            <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container text-[10px] font-black uppercase">Primary</span>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-low">
            <div className="w-16 h-16 rounded-lg bg-gradient-to-tr from-primary to-tertiary-container flex items-center justify-center text-white text-2xl font-black">L</div>
            <div>
              <p className="font-black text-lg text-on-surface">LucidEditor</p>
              <p className="text-xs text-on-surface-variant">Last updated 2 days ago</p>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Brand Guidelines</p>
            <div className="group p-3 rounded-lg border border-outline-variant/15 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant">description</span>
                <span className="text-sm font-semibold">Voice &amp; Tone.pdf</span>
              </div>
              <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">download</span>
            </div>
            <div className="group p-3 rounded-lg border border-outline-variant/15 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant">brush</span>
                <span className="text-sm font-semibold">Usage Rules.pdf</span>
              </div>
              <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">download</span>
            </div>
          </div>
        </div>
        {/* Logos Section */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold tracking-tight">Logos</h2>
            <button className="text-primary text-xs font-bold uppercase tracking-widest hover:underline">Manage All</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="aspect-square rounded-xl bg-surface-container-low flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/40 hover:border-primary/50 transition-colors cursor-pointer group">
              <span className="material-symbols-outlined text-3xl text-outline mb-2 group-hover:text-primary transition-colors">upload_file</span>
              <span className="text-xs font-bold text-on-surface-variant group-hover:text-primary transition-colors">Upload Logo</span>
            </div>
            <div className="aspect-square rounded-xl bg-slate-900 flex items-center justify-center p-6 relative group">
              <img alt="Logo White" className="max-h-full object-contain filter invert opacity-90" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAY0MPEPhs8S448Yqn_JDH0_tYmqZiy_xNBbyqgkrKT7tLcizmjwPIvbXi_XDdDUUfFW_n9o6hVS1PLhkuGJ-bJbXLyI5-RQmy9yM0ZApEW4-4stHFbudPDiKmg1VAd5hSuG3jyTgphht-onvlNX-0u-TIh6An_3rWLyxhvEhGdx7KSvCPEisqMiUANCzMBQpbfv-6A-MK4voScFjiXBKKjU5LlI8YGBdTf5_tvSxGP--SSiJ8AV0N7-I6QEzWdnZT_sJxTO_Jsv5o" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity rounded-xl">
                <button className="w-8 h-8 rounded-full bg-white text-on-surface flex items-center justify-center shadow-sm"><span className="material-symbols-outlined text-sm">edit</span></button>
                <button className="w-8 h-8 rounded-full bg-white text-error flex items-center justify-center shadow-sm"><span className="material-symbols-outlined text-sm">delete</span></button>
              </div>
            </div>
            <div className="aspect-square rounded-xl bg-white border border-outline-variant/15 flex items-center justify-center p-6 relative group">
              <img alt="Logo Color" className="max-h-full object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0u_5TIub-8zXVcePurPv5LmjtRmtvbCElnPxKaWXUm2ppG8ymw4k1i98zenBmhRH8quNhUfWU2zzGZg__jnnRzIzK-wYJz6y7gJKbG6kluTAloEUEwYbt9MsGdPbBq8-c1_lIKWgqfUWtEdkrJ3AvLsUJizXPxxdnMRPUEnYl0gtKOeEK5BzbJBt-13wmP9odpad5awSImCK90oWFvyCrBym7WkDtUBzpY-kCkF3XOy9_EFfpID9RebaQgCjC7H-u6dTdXYvtNSY" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity rounded-xl">
                <button className="w-8 h-8 rounded-full bg-white text-on-surface flex items-center justify-center shadow-sm"><span className="material-symbols-outlined text-sm">edit</span></button>
                <button className="w-8 h-8 rounded-full bg-white text-error flex items-center justify-center shadow-sm"><span className="material-symbols-outlined text-sm">delete</span></button>
              </div>
            </div>
          </div>
        </div>
        {/* Colors Section */}
        <div className="col-span-12 lg:col-span-7 bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Brand Colors</h2>
              <p className="text-xs text-on-surface-variant font-medium">Click a hex code to copy or edit the value.</p>
            </div>
            <button className="bg-surface-container-high px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">palette</span>
              Add Palette
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant border-b border-outline-variant/20 pb-2">Primary Palette</p>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg shadow-inner bg-primary"></div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-on-surface uppercase tracking-tight">Vivid Purple</p>
                    <code className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-primary">#710FE5</code>
                  </div>
                  <span className="material-symbols-outlined text-slate-300 text-sm">content_copy</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg shadow-inner bg-primary-container"></div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-on-surface uppercase tracking-tight">Light Lavender</p>
                    <code className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-primary">#8B3DFF</code>
                  </div>
                  <span className="material-symbols-outlined text-slate-300 text-sm">content_copy</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant border-b border-outline-variant/20 pb-2">Accent Palette</p>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg shadow-inner bg-secondary"></div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-on-surface uppercase tracking-tight">Deep Teal</p>
                    <code className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-secondary">#00696E</code>
                  </div>
                  <span className="material-symbols-outlined text-slate-300 text-sm">content_copy</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg shadow-inner bg-tertiary"></div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-on-surface uppercase tracking-tight">Electric Blue</p>
                    <code className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-tertiary">#5E0EF9</code>
                  </div>
                  <span className="material-symbols-outlined text-slate-300 text-sm">content_copy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Fonts Section */}
        <div className="col-span-12 lg:col-span-5 bg-white rounded-xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold tracking-tight">Brand Fonts</h2>
            <button className="text-primary text-sm font-bold"><span className="material-symbols-outlined text-lg align-middle">add_circle</span></button>
          </div>
          <div className="space-y-6 flex-1">
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/15 relative overflow-hidden group">
              <div className="absolute top-2 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-on-surface-variant hover:text-primary"><span className="material-symbols-outlined text-lg">settings</span></button>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Heading • <span className="text-primary">Inter Bold</span></p>
              <p className="text-2xl font-black tracking-tight text-on-surface leading-none">The Future of Content Creation</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/15 relative group">
              <div className="absolute top-2 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-on-surface-variant hover:text-primary"><span className="material-symbols-outlined text-lg">settings</span></button>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Subheading • <span className="text-primary">Inter Medium</span></p>
              <p className="text-lg font-medium tracking-tight text-on-surface-variant">Editorial design with precision and soul.</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/15 relative group">
              <div className="absolute top-2 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-on-surface-variant hover:text-primary"><span className="material-symbols-outlined text-lg">settings</span></button>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Body • <span className="text-primary">Inter Regular</span></p>
              <p className="text-sm leading-relaxed text-on-surface-variant line-clamp-2">Our mission is to empower creators with tools that vanish into the background, leaving only the work to shine.</p>
            </div>
          </div>
          <div className="mt-6">
            <button className="w-full py-2 bg-surface-container-high rounded-lg text-sm font-bold text-on-surface hover:bg-surface-container-highest transition-colors">Manage Custom Fonts</button>
          </div>
        </div>
        {/* Collaborative Brands */}
        <div className="col-span-12 mt-4">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-on-surface-variant mb-6 flex items-center gap-3">
            Other Brand Kits
            <div className="h-px flex-1 bg-outline-variant/20"></div>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-transparent hover:border-primary/20 transition-all cursor-pointer flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-white font-black">N</div>
              <div>
                <p className="text-sm font-bold">NexGen AI</p>
                <p className="text-[10px] text-on-surface-variant">Shared with 4 members</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-transparent hover:border-primary/20 transition-all cursor-pointer flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center text-white font-black">S</div>
              <div>
                <p className="text-sm font-bold">Solaris Inc</p>
                <p className="text-[10px] text-on-surface-variant">Active Project</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-transparent hover:border-primary/20 transition-all cursor-pointer flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white font-black">V</div>
              <div>
                <p className="text-sm font-bold">Vertex Labs</p>
                <p className="text-[10px] text-on-surface-variant">View Only</p>
              </div>
            </div>
            <div className="bg-surface-container-low border-2 border-dashed border-outline-variant/30 p-4 rounded-xl flex items-center justify-center gap-2 text-on-surface-variant hover:text-primary hover:border-primary/30 transition-all cursor-pointer">
              <span className="material-symbols-outlined text-sm">add</span>
              <span className="text-xs font-bold uppercase tracking-widest">Connect Brand</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
