'use client';

type EditorPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditorPage({ params }: EditorPageProps) {
  const { id } = await params;

  return (
    <main style={{ padding: '3rem' }}>
      <h1>Canvas editor shell</h1>
      <p>Document ID: {id}</p>
    </main>
  );
}
