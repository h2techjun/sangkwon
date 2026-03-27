# Jeonju Sangkwon - 전주 상권 분석 시스템

@AGENTS.md

## 프로젝트 개요
전주시 상권 데이터 분석 및 시각화 시스템. 점포, 교통량, 인구, 아파트 데이터 기반 상권 분석.

## 기술 스택
| 구분 | 기술 |
|------|------|
| Frontend | Next.js 16 / React 19 / TypeScript |
| 스타일링 | Tailwind CSS v4 + Framer Motion |
| DB | Supabase (PostgreSQL) |
| 지도 | Kakao Maps API (JS SDK + REST) |
| 차트 | Recharts |
| 공공 데이터 | Data.go.kr API, KOSIS API |
| 배포 | Vercel |

## 구조
```
src/
  app/
    api/          # API 라우트 (stores, traffic, apartments, analyze)
    map/          # 지도 시각화
    industry/     # 업종 통계
    population/   # 인구 데이터
    compare/      # 비교 분석
    roads/        # 도로 교통량
    search/       # 검색
    report/       # 리포트
  components/
    cards/        # StatCard 등
    charts/       # ChartBar, ChartLine, ChartPie
    layout/       # Header, Layout
    providers/    # Context Providers
    ui/           # UI 컴포넌트
  lib/            # 유틸, 타입, 목업 데이터
```

## 규칙
- Kakao Maps API 키는 환경변수로만 관리
- 공공 데이터 API 호출 시 rate limit 및 에러 핸들링 필수
- 루트의 유틸 스크립트(`check_*.js`, `import_*.js`)는 데이터 처리용 — 프로덕션 코드 아님
