# 전주상권 분석 시스템 (Jeonju Commercial Analysis System)

전주시의 음식점, 유동인구, 아파트 단지 등 공공데이터를 활용하여 상권의 유망도와 매출 핫스팟을 분석하는 지리 인텔리전스 대시보드입니다. 

## 🌐 라이브 데모 (Live Demo)
**[https://sangkwon.vercel.app](https://sangkwon.vercel.app)**

## 🚀 시작하기 (Getting Started)

이 프로젝트는 [Next.js](https://nextjs.org/)로 구축되었습니다.

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속하여 결과를 확인할 수 있습니다.

## 🔑 환경 변수 설정 (.env.local)

프로젝트를 실행하려면 다음 환경 변수가 필요합니다:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATA_GO_KR_API_KEY=your_public_data_portal_api_key
KAKAO_REST_API_KEY=your_kakao_rest_key
NEXT_PUBLIC_KAKAO_MAP_KEY=your_kakao_javascript_key
```

> **주의사항**: `NEXT_PUBLIC_KAKAO_MAP_KEY`를 사용할 때, 카카오 개발자 콘솔(Kakao Developers)의 **플랫폼 > Web 사이트 도메인** 설정 영역에 로컬호스트(`http://localhost:3000`)와 프로덕션 도메인(`https://sangkwon.vercel.app`)이 모두 꼭 등록되어 있어야 지도가 정상적으로 렌더링 됩니다.

## 🛠️ 주요 기술 스택

- **프레임워크**: Next.js (App Router), React
- **스타일링**: Tailwind CSS, Framer Motion (애니메이션)
- **데이터베이스**: Supabase (PostgreSQL)
- **지도/위치**: Kakao Maps API (JS SDK & REST API)
- **배포**: Vercel
