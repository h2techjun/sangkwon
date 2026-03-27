import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <p className="text-6xl mb-4">404</p>
      <h2 className="text-2xl font-bold mb-2">페이지를 찾을 수 없습니다</h2>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        요청하신 페이지가 존재하지 않거나 이동되었습니다.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-colors"
      >
        대시보드로 돌아가기
      </Link>
    </div>
  );
}
