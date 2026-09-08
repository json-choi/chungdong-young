# Cloudflare 배포 메모

Cloudflare 미리보기 https://chungdong-young.cjs5241.workers.dev 에 배포했다. 운영 도메인과 Vercel production은 아직 전환하지 않았다. 프로젝트 전용 KV를 개인 계정에 생성했다.
개인 소유 Cloudflare 계정과 개인 GitHub 세션을 먼저 확인한다. 서로 다른 계정의 토큰·버킷·zone을 공유하지 않는다.

배포는 `.github/workflows/cloudflare.yml`의 수동 실행으로 시작한다. `cloudflare-production` 환경에
`CLOUDFLARE_ACCOUNT_ID` 변수와 해당 계정에만 권한이 있는 `CLOUDFLARE_API_TOKEN` secret이 필요하다.
앱 실행 비밀은 GitHub 빌드 변수에 넣지 않고 Worker Secrets에 등록한다. `.env*`, `.dev.vars*`와 빌드 출력은 커밋하지 않는다.
CI는 아직 원격 실행하지 않았다. DNS는 프리뷰 기능 검증 후에만 전환한다.

## 구성 및 설정

- vinext beta → Workers + Static Assets + Images + KV. KV는 프로젝트 전용 namespace로 연결했다.
- 빌드 변수: `NEXT_PUBLIC_BETTER_AUTH_URL`, `R2_PUBLIC_URL`.
- 런타임: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `ADMIN_SETUP_KEY`, `NEXT_PUBLIC_BETTER_AUTH_URL`.
- R2: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`.
- 기존 Blob 참조가 남아 있는 전환 기간에는 `BLOB_READ_WRITE_TOKEN`을 유지한다. `IMAGE_STORAGE_PROVIDER=vercel`은 명시적인 이전 앱 호환 모드이며 기본 업로드는 R2다.
- 프리뷰 인증 URL과 운영 인증 URL을 분리한다. 운영 도메인은 `chungdong.notish.cloud`를 보존한다.

## 이미지 이전

`scripts/migrate-storage.ts`의 단계는 다음과 같다. 환경은 안전한 외부 파일에서 주입한다.

1. `prepare`: 공지 내용·이미지 참조를 백업하고 참조된 Blob만 다운로드한다. 현재 조사 결과 공지 24건, 이미지 1개, 242,094바이트.
2. `copy`: R2 업로드 후 전체 내용을 재다운로드하여 SHA-256 일치를 확인한다.
3. 양쪽 앱에서 공지 쓰기를 잠시 중지하고 새 `prepare`와 `copy`로 최종 차이를 반영한다.
4. `MIGRATION_WRITES_PAUSED=1`로 `rewrite`: 일치하는 manifest만 허용하고 테이블 잠금·행별 원본 비교·트랜잭션으로 주소를 교체한다. 변경된 행이 있으면 전체 실패한다.
5. 이미지·본문 표시·새 업로드·삭제를 확인한 뒤 쓰기를 재개한다. 원본 Blob은 삭제하지 않는다.

로컬에서는 prepare만 실행했다. R2 복사와 DB UPDATE는 실행하지 않았다. 쓰기 중지는 배포 운영 절차로 확보해야 하며 환경변수 자체가 운영 쓰기를 차단하지는 않는다.
롤백 시 기존 코드가 새 공개 R2 URL은 읽을 수 있지만 새 업로드/삭제는 R2 대응 코드와 설정이 필요하다. DNS만 복원하고 R2 객체를 삭제하지 않는다. 이후 편집이 있으면 과거 DB snapshot 전체 덮어쓰기를 하지 않는다.

## 검증 및 전환

Workers 빌드·TypeScript, 로컬 홈페이지 200·비인증 관리자 API 401, 이미지 키 경계 테스트 3개 통과.
이미지 전체 변환, 실제 Better Auth 로그인·수정·업로드·삭제, 마이그레이션 트랜잭션은 원격에서 검증해야 한다.
notish.cloud의 다른 서브도메인·메일 레코드를 확인하고 보존한 뒤 Cloudflare DNS로 이전한다.

미리보기에는 별도 Better Auth URL을 설정하고 원본 Blob 업로드 모드를 유지했다. 원격 공개 페이지/이미지 200과 관리자 API 401을 확인했다.
