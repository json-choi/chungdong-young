# 정동 젊은이 교회 공지사항 시스템 - 구현 계획

## 기술 스택
- Next.js 15 (App Router)
- Neon DB (PostgreSQL) + Drizzle ORM
- Better Auth (email/password, admin-only)
- Vercel Blob (image upload)
- Shadcn UI + Tailwind CSS
- TipTap (restricted editor)
- @dnd-kit (priority reordering)
- Pretendard Variable font
- Vercel deployment

## 디자인 방향
- 색상: Deep Navy #1A2B48, Muted Crimson #962828, Off-white #F8F9FA, Charcoal #212529
- 타이포그래피: Pretendard Variable, line-height 1.75
- 우선순위 표시: 카드 왼쪽 세로 컬러바
- 이모지 금지, "바이브 코딩" 스타일 금지

## 파일 구조
```
src/
  app/
    (public)/
      page.tsx                    # 공개 공지사항 목록
      announcements/[id]/page.tsx # 상세 페이지
      layout.tsx                  # 공개 레이아웃 (교회명 헤더)
    admin/
      layout.tsx                  # 관리자 레이아웃 (사이드바, 인증 보호)
      page.tsx                    # 대시보드
      login/page.tsx              # 로그인
      announcements/
        page.tsx                  # 공지사항 관리 목록
        new/page.tsx              # 새 공지 작성
        [id]/edit/page.tsx        # 공지 수정
      settings/page.tsx           # 비밀번호 변경
    api/
      auth/[...all]/route.ts      # Better Auth handler
      announcements/route.ts      # 공개 GET
      admin/
        announcements/route.ts    # 관리자 CRUD
        announcements/[id]/route.ts
        blob/upload/route.ts      # Vercel Blob 업로드
        auth/register/route.ts    # 부트스트랩 관리자 등록
        auth/password/route.ts    # 비밀번호 변경
  server/
    auth/
      auth.ts                     # Better Auth config
      client.ts                   # Better Auth client
      guard.ts                    # Admin guard middleware
    db/
      client.ts                   # Drizzle + Neon client
      schema/
        auth.ts                   # Better Auth tables (user, session, account, verification)
        announcement.ts           # announcements table
      index.ts                    # Export all schemas
    validation/
      announcement.ts             # Zod schemas
  components/
    public/
      announcement-card.tsx
      announcement-list.tsx
      date-range-badge.tsx
      content-renderer.tsx
    admin/
      announcement-form.tsx
      announcement-table.tsx
      priority-dnd-list.tsx
      image-uploader.tsx
      admin-sidebar.tsx
    ui/                           # Shadcn components
  lib/
    utils.ts
```

## DB 스키마
- user, session, account, verification: Better Auth 기본 테이블
- announcements: id(uuid), title, body_html, link_url, priority(int), start_at, end_at, is_published, image_url, image_blob_path, created_by(FK), updated_by(FK), created_at, updated_at, deleted_at(soft delete)
- 제약: end_at >= start_at, 복합 인덱스 (is_published, start_at, end_at, priority)

## 인증 전략
- Better Auth + Credentials (email/password)
- 부트스트랩: 관리자가 0명일 때만 등록 허용
- 공개 페이지: 인증 없음
- 관리자 페이지: 세션 + admins 테이블 멤버십 확인

## 구현 순서
1. 프로젝트 초기 설정 (Next.js, Tailwind, Shadcn, fonts)
2. DB 스키마 + Drizzle 설정
3. Better Auth 설정 + 관리자 부트스트랩
4. 관리자 로그인/설정 UI
5. 공지사항 CRUD API
6. 관리자 공지 관리 UI (폼, 테이블, DnD, 이미지 업로드)
7. 공개 페이지 UI
8. 캐싱 + 최적화
