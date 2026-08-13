import TvMenuRuntime from '@/components/tv-menu/TvMenuRuntime';

export default function TvMenuBoardPage({ params }: { params: { boardId: string } }) {
  return <TvMenuRuntime boardId={params.boardId} />;
}
