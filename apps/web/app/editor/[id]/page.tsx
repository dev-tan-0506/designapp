import { CanvasStage } from './_components/canvas-stage';

type EditorPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditorPage({ params }: EditorPageProps) {
  const { id } = await params;

  return <CanvasStage documentId={id} />;
}
