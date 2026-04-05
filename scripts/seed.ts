import { db } from "../src/server/db/client";
import { announcements, user } from "../src/server/db/schema";

async function main() {
  // Get first admin user
  const users = await db.select({ id: user.id }).from(user).limit(1);
  if (users.length === 0) {
    console.error("No user found. Create an admin user first.");
    process.exit(1);
  }
  const adminId = users[0].id;
  console.log("Admin ID:", adminId);

  const d = (year: number, month: number, day: number, hour = 0, min = 0) =>
    new Date(year, month - 1, day, hour, min);

  const seeds = [
    // ─── 일반 공지 (피드 전용) ───────────────────────────────

    // 1. 진행중 일반 공지 (중요)
    {
      title: "주일 예배 안내",
      bodyHtml:
        "<p>이번 주일 예배는 <strong>오전 11시</strong>에 진행됩니다.</p><ul><li>찬양: 오전 10시 50분</li><li>말씀: 오전 11시</li></ul>",
      priority: 15,
      startAt: d(2026, 4, 1),
      endAt: d(2026, 4, 30, 23, 59),
      showOnCalendar: false,
      isAllDay: false,
      isPublished: true,
    },
    // 2. 진행중 일반 공지
    {
      title: "청년부 소그룹 모집",
      bodyHtml:
        "<p>2026년 상반기 소그룹을 모집합니다. 관심 있는 분은 담당자에게 연락해주세요.</p>",
      priority: 5,
      startAt: d(2026, 3, 25),
      endAt: null,
      showOnCalendar: false,
      isAllDay: false,
      isPublished: true,
    },
    // 3. 게시 기간 지난 공지
    {
      title: "부활절 특별헌금 안내",
      bodyHtml:
        "<p>부활절을 맞아 특별헌금을 드립니다. 헌금 봉투를 사용해주세요.</p>",
      priority: 10,
      startAt: d(2026, 3, 15),
      endAt: d(2026, 3, 31, 23, 59),
      showOnCalendar: false,
      isAllDay: false,
      isPublished: true,
    },
    // 4. 진행중 일반 공지 (링크 포함)
    {
      title: "교회 주보 온라인 보기",
      bodyHtml: "<p>매주 주보를 온라인에서 확인하실 수 있습니다.</p>",
      linkUrl: "https://example.com/bulletin",
      priority: 3,
      startAt: d(2026, 4, 1),
      endAt: null,
      showOnCalendar: false,
      isAllDay: false,
      isPublished: true,
    },

    // ─── 달력 일정 (종일 / 연속 바) ─────────────────────────

    // 5. 수련회 — 종일 3일
    {
      title: "봄 수련회",
      bodyHtml:
        "<p>2026년 봄 수련회에 참석해주세요!</p><ul><li>장소: 양평 수양관</li><li>준비물: 세면도구, 성경</li></ul>",
      priority: 12,
      startAt: d(2026, 4, 1),
      endAt: d(2026, 4, 20, 23, 59),
      showOnCalendar: true,
      isAllDay: true,
      eventStartAt: d(2026, 4, 10),
      eventEndAt: d(2026, 4, 12, 23, 59),
      isPublished: true,
    },
    // 6. 부활절 연합예배 — 종일 1일
    {
      title: "부활절 연합예배",
      bodyHtml: "<p>부활절을 기념하는 연합예배입니다. 오전 10시에 시작합니다.</p>",
      priority: 10,
      startAt: d(2026, 4, 3),
      endAt: d(2026, 4, 6, 23, 59),
      showOnCalendar: true,
      isAllDay: true,
      eventStartAt: d(2026, 4, 5),
      eventEndAt: d(2026, 4, 5, 23, 59),
      isPublished: true,
    },

    // ─── 달력 일정 (시간 지정 / 개별 바) ─────────────────────

    // 7. 새벽기도회 — 매일 시간 지정 (여러 날, 개별 바로 표시)
    {
      title: "새벽기도회",
      bodyHtml: "<p>매일 새벽 6시 기도회가 진행됩니다.</p>",
      priority: 5,
      startAt: d(2026, 4, 1),
      endAt: d(2026, 4, 30, 23, 59),
      showOnCalendar: true,
      isAllDay: false,
      eventStartAt: d(2026, 4, 7, 6, 0),
      eventEndAt: d(2026, 4, 11, 7, 0),
      isPublished: true,
    },
    // 8. 성경공부 — 수요일 저녁
    {
      title: "수요 성경공부",
      bodyHtml: "<p>수요일 저녁 7시 30분, 소예배실에서 진행합니다.</p>",
      priority: 4,
      startAt: d(2026, 4, 1),
      endAt: d(2026, 4, 30, 23, 59),
      showOnCalendar: true,
      isAllDay: false,
      eventStartAt: d(2026, 4, 8, 19, 30),
      eventEndAt: d(2026, 4, 8, 21, 0),
      isPublished: true,
    },
    // 9. 찬양팀 연습 — 토요일 오후
    {
      title: "찬양팀 연습",
      bodyHtml: "<p>토요일 오후 3시~5시, 본당에서 진행합니다.</p>",
      priority: 2,
      startAt: d(2026, 4, 1),
      endAt: d(2026, 4, 30, 23, 59),
      showOnCalendar: true,
      isAllDay: false,
      eventStartAt: d(2026, 4, 11, 15, 0),
      eventEndAt: d(2026, 4, 11, 17, 0),
      isPublished: true,
    },

    // ─── 게시 기간 지난 달력 일정 ─────────────────────────────

    // 10. 지난 수련회
    {
      title: "겨울 수련회",
      bodyHtml: "<p>2026년 겨울 수련회가 은혜 가운데 마무리되었습니다.</p>",
      priority: 8,
      startAt: d(2026, 2, 1),
      endAt: d(2026, 3, 5, 23, 59),
      showOnCalendar: true,
      isAllDay: true,
      eventStartAt: d(2026, 2, 27),
      eventEndAt: d(2026, 3, 1, 23, 59),
      isPublished: true,
    },

    // ─── 미래 일정 ──────────────────────────────────────────

    // 11. 5월 어버이주일
    {
      title: "어버이주일 특별예배",
      bodyHtml:
        "<p>5월 어버이주일을 맞아 특별예배를 드립니다. 부모님과 함께 참석해주세요.</p>",
      priority: 10,
      startAt: d(2026, 4, 20),
      endAt: d(2026, 5, 10, 23, 59),
      showOnCalendar: true,
      isAllDay: true,
      eventStartAt: d(2026, 5, 10),
      eventEndAt: d(2026, 5, 10, 23, 59),
      isPublished: true,
    },
    // 12. 봉사활동
    {
      title: "지역사회 봉사활동",
      bodyHtml:
        "<p>4월 19일 토요일 오전 9시~12시, 지역 어르신 돌봄 봉사를 진행합니다.</p>",
      priority: 6,
      startAt: d(2026, 4, 5),
      endAt: d(2026, 4, 19, 23, 59),
      showOnCalendar: true,
      isAllDay: false,
      eventStartAt: d(2026, 4, 19, 9, 0),
      eventEndAt: d(2026, 4, 19, 12, 0),
      isPublished: true,
    },
  ];

  console.log(`Inserting ${seeds.length} seed announcements...`);

  for (const seed of seeds) {
    await db.insert(announcements).values({
      ...seed,
      createdBy: adminId,
      updatedBy: adminId,
    });
    console.log(`  ✓ ${seed.title}`);
  }

  console.log("Done!");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
