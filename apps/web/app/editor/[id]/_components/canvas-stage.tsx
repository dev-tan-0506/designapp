'use client';

import { useEffect, useRef, useState } from 'react';
import {
  CanvasRenderer,
  createBenchmarkDocument,
  dispatchDocumentChanged,
  onCanvasRendered,
  onDocumentChanged,
  runRendererBenchmark,
  type CanvasRenderedDetail,
} from '@design-editor/canvas-engine';

import { useDocumentStore } from '../../../../stores/use-document-store';

type CanvasStageProps = {
  documentId: string;
};

const INITIAL_RENDER_DETAIL: CanvasRenderedDetail = {
  documentId: null,
  elementCount: 0,
  durationMs: 0,
  renderCount: 0,
};

export function CanvasStage({ documentId }: CanvasStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const eventTargetRef = useRef<EventTarget>(new EventTarget());
  const initialDispatchRef = useRef(false);
  const benchmarkCompletedRef = useRef(false);
  const document = useDocumentStore((state) => state.document);
  const seedDocument = useDocumentStore((state) => state.seedDocument);
  const [renderDetail, setRenderDetail] = useState(INITIAL_RENDER_DETAIL);
  const [benchmarkAverage, setBenchmarkAverage] = useState<number | null>(null);

  useEffect(() => {
    seedDocument(documentId);
  }, [documentId, seedDocument]);

  useEffect(() => {
    if (!canvasRef.current) {
      return undefined;
    }

    const eventTarget = eventTargetRef.current;
    const renderer = new CanvasRenderer(canvasRef.current, {
      eventTarget,
    });
    rendererRef.current = renderer;

    const unsubscribeDocument = onDocumentChanged(eventTarget, ({ document: nextDocument }) => {
      renderer.setDocument(nextDocument);
    });
    const unsubscribeRendered = onCanvasRendered(eventTarget, (detail) => {
      setRenderDetail(detail);
    });

    return () => {
      unsubscribeDocument();
      unsubscribeRendered();
      renderer.destroy();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!document) {
      return;
    }

    if (!benchmarkCompletedRef.current && rendererRef.current) {
      const benchmarkResult = runRendererBenchmark(
        rendererRef.current,
        createBenchmarkDocument(200),
      );
      setBenchmarkAverage(benchmarkResult.averageMs);
      benchmarkCompletedRef.current = true;
    }

    dispatchDocumentChanged(
      eventTargetRef.current,
      document,
      initialDispatchRef.current ? 'store' : 'initial-load',
    );
    initialDispatchRef.current = true;
  }, [document]);

  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top left, rgba(251, 191, 36, 0.22), transparent 30%), linear-gradient(180deg, #fbfaf5 0%, #efe8dc 100%)',
        padding: '2rem',
      }}
    >
      <section
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'grid',
          gap: '1.5rem',
        }}
      >
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'end',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: '0.8rem',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: '#8c5a25',
              }}
            >
              Story 1.2
            </p>
            <h1
              style={{
                margin: '0.4rem 0 0',
                fontSize: 'clamp(2rem, 4vw, 3.6rem)',
                lineHeight: 0.95,
                color: '#1f2937',
              }}
            >
              Canvas renderer foundation
            </h1>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(110px, 1fr))',
              gap: '0.75rem',
              width: 'min(560px, 100%)',
            }}
          >
            <MetricCard label="Elements" value={document?.elements.length ?? 0} />
            <MetricCard label="Renders" value={renderDetail.renderCount} />
            <MetricCard label="Last Frame" value={`${renderDetail.durationMs.toFixed(2)}ms`} />
            <MetricCard
              label="Benchmark Avg"
              value={benchmarkAverage === null ? 'Pending' : `${benchmarkAverage.toFixed(2)}ms`}
            />
          </div>
        </header>

        <div
          style={{
            display: 'grid',
            gap: '1.25rem',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(260px, 320px)',
            alignItems: 'start',
          }}
        >
          <div
            style={{
              padding: '1rem',
              borderRadius: '28px',
              background: 'rgba(255, 255, 255, 0.76)',
              border: '1px solid rgba(122, 85, 38, 0.16)',
              boxShadow: '0 20px 60px rgba(120, 93, 47, 0.12)',
              overflow: 'auto',
            }}
          >
            <canvas
              ref={canvasRef}
              aria-label="Design canvas foundation"
              style={{
                display: 'block',
                maxWidth: '100%',
                height: 'auto',
                borderRadius: '22px',
                background: '#fffdf8',
              }}
            />
          </div>

          <aside
            style={{
              padding: '1.25rem',
              borderRadius: '28px',
              background: '#1f2937',
              color: '#f8fafc',
              display: 'grid',
              gap: '1rem',
            }}
          >
            <div>
              <p style={{ margin: 0, opacity: 0.72, fontSize: '0.84rem' }}>Document</p>
              <h2 style={{ margin: '0.3rem 0 0', fontSize: '1.3rem' }}>
                {document?.name ?? 'Loading document'}
              </h2>
            </div>
            <div
              style={{
                padding: '0.95rem',
                borderRadius: '18px',
                background: 'rgba(255, 255, 255, 0.08)',
              }}
            >
              <p style={{ margin: 0, fontSize: '0.84rem', opacity: 0.72 }}>Canvas ID</p>
              <p style={{ margin: '0.35rem 0 0', fontFamily: 'monospace' }}>{documentId}</p>
            </div>
            <div
              style={{
                display: 'grid',
                gap: '0.75rem',
              }}
            >
              {(document?.elements ?? []).map((element) => (
                <div
                  key={element.id}
                  style={{
                    padding: '0.8rem 0.9rem',
                    borderRadius: '16px',
                    background: 'rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '0.8rem',
                    }}
                  >
                    <strong style={{ fontSize: '0.94rem' }}>{element.name}</strong>
                    <span style={{ opacity: 0.72, textTransform: 'uppercase', fontSize: '0.72rem' }}>
                      {element.type}
                    </span>
                  </div>
                  <p style={{ margin: '0.35rem 0 0', opacity: 0.68, fontSize: '0.82rem' }}>
                    {Math.round(element.width)} x {Math.round(element.height)} at ({Math.round(element.x)},{' '}
                    {Math.round(element.y)})
                  </p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div
      style={{
        padding: '0.9rem 1rem',
        borderRadius: '18px',
        background: 'rgba(255, 255, 255, 0.8)',
        border: '1px solid rgba(122, 85, 38, 0.16)',
      }}
    >
      <p style={{ margin: 0, fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </p>
      <strong
        style={{
          display: 'block',
          marginTop: '0.35rem',
          fontSize: '1.25rem',
          color: '#1f2937',
        }}
      >
        {value}
      </strong>
    </div>
  );
}

