/**
 * 카카오맵 SDK 로딩 유틸리티
 * 중복 로드 방지 + 콜백 기반 초기화
 */

let loadPromise: Promise<void> | null = null;

export function loadKakaoSDK(): Promise<void> {
  if (loadPromise) return loadPromise;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Kakao Maps SDK has no TypeScript definitions
  const win = window as any;
  if (win.kakao?.maps?.services) {
    loadPromise = Promise.resolve();
    return loadPromise;
  }

  const key = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
  if (!key || key === 'DEMO_KEY') {
    return Promise.reject(new Error('NEXT_PUBLIC_KAKAO_MAP_KEY not set'));
  }

  loadPromise = new Promise((resolve, reject) => {
    // 이미 스크립트 태그가 있으면 중복 추가 방지
    if (win.kakao?.maps) {
      win.kakao.maps.load(() => resolve());
      return;
    }

    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&libraries=services,clusterer&autoload=false`;
    script.async = true;
    script.onload = () => win.kakao.maps.load(() => resolve());
    script.onerror = () => reject(new Error('Kakao Maps SDK load failed'));
    document.head.appendChild(script);
  });

  return loadPromise;
}
