const fs = require('fs');
const filePath = 'c:/Users/tantr/OneDrive/Desktop/code/design editor/apps/web/app/editor/[id]/_components/canvas-stage.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

const startIdx = content.indexOf('  return (\n    <>\n      <main');
const endMarker = '  );\n}\n\nfunction MetricCard';
const endIdx = content.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error("Could not find start or end index!");
  process.exit(1);
}

const newReturn = `  return (
    <div className="flex flex-col h-screen overflow-hidden bg-surface text-on-surface">
      <header className="bg-white/80 backdrop-blur-xl w-full sticky top-0 z-50 shadow-sm flex items-center justify-between px-6 py-3 border-b border-surface-container">
        <div className="flex items-center gap-8">
          <span className="text-xl font-black tracking-tighter text-primary">LucidEditor</span>
          <nav className="hidden md:flex items-center gap-6 font-sans antialiased text-sm font-medium">
            <a className="text-primary font-bold border-b-2 border-primary pb-1" href="#">Templates</a>
            <a className="text-on-surface-variant hover:text-on-surface transition-colors duration-200" href="#">Features</a>
            <a className="text-on-surface-variant hover:text-on-surface transition-colors duration-200" href="#">Learn</a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-surface-container-low rounded-lg transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
            </button>
            <button className="p-2 hover:bg-surface-container-low rounded-lg transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant">settings</span>
            </button>
          </div>
          <button className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-6 py-2 rounded-full text-sm font-bold tracking-tight active:scale-95 transition-transform" onClick={() => openNewDesignDialog(document?.canvas)}>
            Create a design
          </button>
          <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container-highest">
            <img alt="User profile" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHagMYU3-RkBdDBSBorjj0J-m5A9iqB2iWfKBxXsCOyLEDm1c111q4oTDV30DlvDQLHOu7GRxnYhRtFjlzNYkkfqbE29gUdxqZ4taK7NIqmce5lDHpbx7cBZ8rgnVNWbTYKE9SE8BroHvUfpD7awriBcvvEobKuhQPyv74L_Mq_NU-NqNSrCiq2wxMK5w_0PZRI16SQ8AsEiOch_IRjX6rlnhG-MN2gPw7NjIZas77cwSGXjBPGIKYLAYd0YQlMpg24naeYQUVBeo" />
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        <aside className="h-full w-20 flex flex-col items-center z-40 bg-white border-r border-surface-container">
          <div className="flex flex-col gap-1 w-full py-4">
            <button onClick={() => { setActiveTool('select'); stopTextEditing(); }} className={activeTool === 'select' ? "text-primary border-l-4 border-primary bg-primary/5 flex flex-col items-center py-4 gap-1 group w-full" : "text-on-surface-variant flex flex-col items-center py-4 gap-1 hover:text-primary transition-all w-full"}>
              <span className="material-symbols-outlined scale-110" style={{ fontVariationSettings: "'FILL' 1" }}>pan_tool</span>
              <span className="text-[10px] uppercase font-bold tracking-widest">Select</span>
            </button>
            <button onClick={() => setActiveTool('text')} className={activeTool === 'text' ? "text-primary border-l-4 border-primary bg-primary/5 flex flex-col items-center py-4 gap-1 group w-full" : "text-on-surface-variant flex flex-col items-center py-4 gap-1 hover:text-primary transition-all w-full"}>
              <span className="material-symbols-outlined">title</span>
              <span className="text-[10px] uppercase font-bold tracking-widest">Text</span>
            </button>
            <button onClick={handleImageToolClick} className={activeTool === 'image' ? "text-primary border-l-4 border-primary bg-primary/5 flex flex-col items-center py-4 gap-1 group w-full" : "text-on-surface-variant flex flex-col items-center py-4 gap-1 hover:text-primary transition-all w-full"}>
              <span className="material-symbols-outlined">image</span>
              <span className="text-[10px] uppercase font-bold tracking-widest">Image</span>
            </button>
            <button onClick={() => setActiveTool('rectangle')} className={activeTool === 'rectangle' ? "text-primary border-l-4 border-primary bg-primary/5 flex flex-col items-center py-4 gap-1 group w-full" : "text-on-surface-variant flex flex-col items-center py-4 gap-1 hover:text-primary transition-all w-full"}>
              <span className="material-symbols-outlined">rectangle</span>
              <span className="text-[10px] uppercase font-bold tracking-widest">Rect</span>
            </button>
            <button onClick={() => setActiveTool('ellipse')} className={activeTool === 'ellipse' ? "text-primary border-l-4 border-primary bg-primary/5 flex flex-col items-center py-4 gap-1 group w-full" : "text-on-surface-variant flex flex-col items-center py-4 gap-1 hover:text-primary transition-all w-full"}>
              <span className="material-symbols-outlined">circle</span>
              <span className="text-[10px] uppercase font-bold tracking-widest">Ellipse</span>
            </button>
          </div>
        </aside>

        <aside className="h-full w-80 bg-surface-container-lowest border-r border-surface-container flex flex-col overflow-y-auto custom-scrollbar">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold tracking-tight text-on-surface">Properties</h2>
            </div>
            <div className="space-y-6">
              
              {propertiesMode === 'text' ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <p className="text-xs opacity-70 m-0">Text properties</p>
                      <h3 className="m-0 mt-1 text-sm font-bold">{selectedText?.name ?? 'No text selected'}</h3>
                    </div>
                    {textEditingElementId === selectedText?.id ? (
                      <button onClick={stopTextEditing} className="px-3 py-1 bg-surface-container-highest rounded-full text-xs font-bold text-on-surface transition-colors hover:bg-outline-variant/30">Done</button>
                    ) : (
                      <button onClick={() => { if (selectedText) setTextEditingElementId(selectedText.id); }} className="px-3 py-1 bg-surface-container-high rounded-full text-xs font-bold text-on-surface transition-colors hover:bg-outline-variant/30">Edit</button>
                    )}
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => setTypographyMode('simple')} className={\`px-3 py-1.5 rounded-full text-xs font-semibold \${typographyMode === 'simple' ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-surface-container border border-outline-variant/30 text-on-surface'}\`}>Simple</button>
                     <button onClick={() => setTypographyMode('pro')} className={\`px-3 py-1.5 rounded-full text-xs font-semibold \${typographyMode === 'pro' ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-surface-container border border-outline-variant/30 text-on-surface'}\`}>Pro</button>
                  </div>
                  
                  <div className="bg-surface-container-lowest rounded-xl border border-surface-container p-2">
                    <FontPicker
                        apiKey={GOOGLE_FONTS_API_KEY}
                        query={fontSearchQuery}
                        status={fontSearchStatus}
                        selectedFamily={selectedText?.fontFamily ?? DEFAULT_TEXT_FONT_FAMILY}
                        isCatalogConfigured={Boolean(GOOGLE_FONTS_API_KEY)}
                        onQueryChange={setFontSearchQuery}
                        onStatusChange={setFontSearchStatus}
                        onSelectFamily={handleApplyFontFamily}
                    />
                  </div>
                  
                  <div className="grid gap-1">
                    <label className="text-xs opacity-70">Font size</label>
                    <input type="number" min={8} max={240} className="w-full bg-surface-container-low rounded-lg border border-outline-variant/20 px-3 py-2 text-sm text-on-surface"
                       value={selectedText?.fontSize ?? DEFAULT_TEXT_FONT_SIZE}
                       onChange={(event) => updateActiveTextStyle({ fontSize: clampFontSize(Number.parseInt(event.target.value, 10) || DEFAULT_TEXT_FONT_SIZE) })} />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-xs opacity-70">Fill</label>
                    <input type="color" className="w-full h-10 bg-transparent rounded-lg border border-outline-variant/20 cursor-pointer"
                       value={toColorInputValue(selectedText?.fill, DEFAULT_TEXT_FILL)}
                       onChange={(event) => updateActiveTextStyle({ fill: event.target.value })} />
                  </div>

                  {typographyMode === 'pro' && (
                     <>
                       <div className="flex gap-2 flex-wrap mt-2">
                         <button onClick={() => updateActiveTextStyle({ fontWeight: (selectedText?.fontWeight ?? 400) >= 700 ? 400 : 700 })} className={\`px-3 py-1.5 rounded-lg text-xs font-semibold \${((selectedText?.fontWeight ?? 400) >= 700) ? 'bg-primary/10 text-primary' : 'bg-surface-container-low text-on-surface'}\`}>Bold</button>
                         <button onClick={() => updateActiveTextStyle({ fontStyle: selectedText?.fontStyle === 'italic' ? 'normal' : 'italic' })} className={\`px-3 py-1.5 rounded-lg text-xs font-semibold \${(selectedText?.fontStyle === 'italic') ? 'bg-primary/10 text-primary' : 'bg-surface-container-low text-on-surface'}\`}>Italic</button>
                         <button onClick={() => updateActiveTextStyle({ underline: !(selectedText?.underline ?? false) })} className={\`px-3 py-1.5 rounded-lg text-xs font-semibold \${(selectedText?.underline ?? false) ? 'bg-primary/10 text-primary' : 'bg-surface-container-low text-on-surface'}\`}>Underline</button>
                       </div>
                       <div className="flex gap-2 flex-wrap mt-2">
                         {(['left', 'center', 'right'] as const).map((alignment) => (
                           <button key={alignment} onClick={() => updateActiveTextStyle({ textAlign: alignment })} className={\`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize \${(selectedText?.textAlign === alignment) ? 'bg-primary/10 text-primary' : 'bg-surface-container-low text-on-surface'}\`}>{alignment}</button>
                         ))}
                       </div>
                     </>
                  )}
                </div>
              ) : propertiesMode === 'shape' ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs opacity-70 m-0">Shape properties</p>
                    <h3 className="m-0 mt-1 text-sm font-bold">{selectedShape?.name ?? 'No shape selected'}</h3>
                  </div>
                  <div className="grid gap-1">
                    <label className="text-xs opacity-70">Fill</label>
                    <input type="color" className="w-full h-10 bg-transparent rounded-lg border border-outline-variant/20 cursor-pointer"
                       value={toColorInputValue(selectedShape?.fill, DEFAULT_SHAPE_FILL)}
                       onChange={(event) => updateSelectedShapeStyle({ fill: event.target.value })} />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-xs opacity-70">Stroke</label>
                    <input type="color" className="w-full h-10 bg-transparent rounded-lg border border-outline-variant/20 cursor-pointer"
                       value={toColorInputValue(selectedShape?.stroke?.color, DEFAULT_SHAPE_STROKE_COLOR)}
                       onChange={(event) => updateSelectedShapeStyle({ strokeColor: event.target.value })} />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-xs opacity-70">Stroke width</label>
                    <input type="number" min={1} max={32} className="w-full bg-surface-container-low rounded-lg border border-outline-variant/20 px-3 py-2 text-sm text-on-surface"
                       value={selectedShape?.stroke?.width ?? DEFAULT_SHAPE_STROKE_WIDTH}
                       onChange={(event) => updateSelectedShapeStyle({ strokeWidth: clampStrokeWidth(Number.parseInt(event.target.value, 10) || 1) })} />
                  </div>
                </div>
              ) : propertiesMode === 'image' ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs opacity-70 m-0">Image properties</p>
                    <h3 className="m-0 mt-1 text-sm font-bold">{selectedImage?.name ?? 'No image selected'}</h3>
                  </div>
                  <div className="p-3 bg-surface-container-low border border-outline-variant/10 rounded-xl">
                    <p className="text-xs opacity-70 m-0">Placed size</p>
                    <p className="font-mono text-sm m-0 mt-1">{selectedImage ? \`\${Math.round(selectedImage.width)} x \${Math.round(selectedImage.height)}px\` : 'Pending'}</p>
                  </div>
                  <div className="p-3 bg-surface-container-low border border-outline-variant/10 rounded-xl">
                    <p className="text-xs opacity-70 m-0">Intrinsic size</p>
                    <p className="font-mono text-sm m-0 mt-1">{selectedImage ? \`\${selectedImage.intrinsicWidth} x \${selectedImage.intrinsicHeight}px\` : 'Pending'}</p>
                  </div>
                  <div className="p-3 bg-surface-container-low border border-outline-variant/10 rounded-xl">
                    <p className="text-xs opacity-70 m-0">Upload status</p>
                    <p className="font-mono text-sm m-0 mt-1">{imageUploadStatus === 'error' ? (imageUploadError ?? 'error') : imageUploadStatus}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-sm font-bold m-0 mb-2 text-on-surface">No element selected</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Use the Text, Image, or shape tools, or select an element from the canvas or list below.
                  </p>
                </div>
              )}
              
              <hr className="border-outline-variant/20 my-6" />
              
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">Layers</p>
                {(document?.elements ?? []).map((element) => (
                  <button
                    key={element.id}
                    type="button"
                    onClick={() => {
                      selectElement(element.id);
                      if (element.type !== 'text' && textEditingElementId) {
                        stopTextEditing();
                      }
                    }}
                    onDoubleClick={() => {
                      if (element.type === 'text') {
                        setTextEditingElementId(element.id);
                      }
                    }}
                    className={\`w-full text-left p-3 rounded-xl transition-all border \${element.id === selectedElementId ? 'bg-primary/10 border-primary/30 text-primary shadow-sm' : 'bg-surface-container-low hover:bg-surface-container border-transparent text-on-surface'}\`}
                  >
                    <div className="flex justify-between items-center gap-3">
                      <strong className="text-sm font-bold truncate">{element.name}</strong>
                      <span className="text-[9px] uppercase tracking-widest font-bold opacity-60 bg-white/50 px-1.5 py-0.5 rounded">{element.type}</span>
                    </div>
                  </button>
                ))}
              </div>

            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col bg-surface-dim relative overflow-hidden">
          <nav className="w-full bg-white/90 backdrop-blur-md border-b border-surface-container px-6 py-2 flex items-center gap-4 z-30">
            <div className="flex items-center gap-4 ml-auto text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">speed</span> {benchmarkAverage === null ? 'Pending' : \`\${benchmarkAverage.toFixed(2)}ms\`}</span>
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">memory</span> Renders: {renderDetail.renderCount}</span>
            </div>
          </nav>

          <div className="absolute bottom-12 right-6 flex items-center bg-white/80 backdrop-blur-xl rounded-full px-4 py-2 gap-4 z-40 shadow-sm border border-outline-variant/10">
            <div className="flex items-center gap-2">
              <button className="p-1 hover:text-primary transition-colors flex items-center justify-center" onClick={() => {
                      rendererRef.current?.zoomBy(1 / 1.15, {
                        x: stageSize.width / 2,
                        y: stageSize.height / 2,
                      });
                      syncViewportFromRenderer();
                    }}>
                <span className="material-symbols-outlined text-sm">zoom_out</span>
              </button>
              <span className="text-xs font-bold w-12 text-center">{Math.round(zoomPercent)}%</span>
              <button className="p-1 hover:text-primary transition-colors flex items-center justify-center" onClick={() => {
                      rendererRef.current?.zoomBy(1.15, {
                        x: stageSize.width / 2,
                        y: stageSize.height / 2,
                      });
                      syncViewportFromRenderer();
                    }}>
                <span className="material-symbols-outlined text-sm">zoom_in</span>
              </button>
            </div>
            <div className="h-4 w-px bg-surface-container-highest"></div>
            <button className="p-1 hover:text-primary transition-colors flex items-center justify-center" onClick={fitRendererToViewport}>
              <span className="material-symbols-outlined text-sm">fullscreen</span>
            </button>
          </div>

          <div className="flex-1 w-full h-full overflow-hidden relative custom-scrollbar flex items-center justify-center p-8 bg-surface-dim">
             <div
              onDragOver={handleStageDragOver}
              onDragEnter={handleStageDragOver}
              onDragLeave={handleStageDragLeave}
              onDrop={handleStageDrop}
              ref={stageViewportRef}
              className="w-full h-full relative"
              style={{
                outline: isDragOver ? '3px dashed rgba(245, 158, 11, 0.85)' : 'none',
                outlineOffset: '-6px',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  void handleFileInputChange(event);
                }}
                className="hidden"
              />
              <canvas
                ref={canvasRef}
                aria-label="Design canvas stage"
                onWheel={handleWheel}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                onLostPointerCapture={handlePointerCancel}
                className="block touch-none"
                style={{
                  cursor: isPanning
                    ? 'grabbing'
                    : isSpacePressed
                      ? 'grab'
                      : activeTool === 'text'
                        ? 'text'
                        : activeTool === 'image'
                          ? 'copy'
                        : isShapeTool(activeTool)
                          ? 'crosshair'
                          : 'default',
                }}
              />
              {editingText ? (
                <TextEditorOverlay
                  element={editingText}
                  zoom={zoomPercent / 100}
                  pan={pan}
                  onChange={(text) => updateTextElementContent(editingText.id, text)}
                  onStopEditing={stopTextEditing}
                />
              ) : null}
              
              <div style={{ position: 'absolute' }}>
                {imageUploadStatus !== 'idle' && (
                  <div className={\`absolute right-4 top-4 max-w-[340px] rounded-[18px] px-4 py-3 text-sm text-white shadow-xl \${imageUploadStatus === 'error' ? 'bg-red-700/95' : imageUploadStatus === 'success' ? 'bg-green-700/95' : 'bg-slate-800/95'}\`}>
                    {imageUploadStatus === 'loading'
                        ? 'Uploading image asset and preparing signed canvas URL...'
                        : imageUploadStatus === 'success'
                          ? 'Image asset uploaded and placed on the canvas.'
                          : imageUploadError}
                  </div>
                )}
              </div>
            </div>
          </div>

          <footer className="h-8 bg-surface-container px-4 flex flex-shrink-0 items-center justify-between text-[10px] text-on-surface-variant/70 font-medium z-30">
            <div className="flex items-center gap-4">
              <span>{document ? \`\${document.name} (\${document.canvas.width} x \${document.canvas.height}px)\` : 'Loading...'}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary"></span> All changes saved</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hover:text-on-surface cursor-pointer">Help Center</span>
              <span className="hover:text-on-surface cursor-pointer">Keyboard Shortcuts</span>
            </div>
          </footer>
        </main>
      </div>
      
      <NewDesignDialog
        isOpen={isNewDesignDialogOpen}
        width={newDesignWidth}
        height={newDesignHeight}
        onWidthChange={(width) => setNewDesignDimensions({ width, height: newDesignHeight })}
        onHeightChange={(height) => setNewDesignDimensions({ width: newDesignWidth, height })}
        onClose={closeNewDesignDialog}
        onCreate={handleCreateNewDesign}
      />
    </div>
  );
`;

const before = content.slice(0, startIdx);
const after = content.slice(endIdx);
const newContent = before + newReturn + "\n" + after;

fs.writeFileSync(filePath, newContent, 'utf-8');
console.log("Successfully replaced Editor JSX!");
