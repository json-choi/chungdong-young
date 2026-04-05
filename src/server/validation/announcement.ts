import { z } from "zod/v4";

export const createAnnouncementSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요").max(200),
  bodyHtml: z.string().min(1, "내용을 입력해주세요"),
  linkUrl: z.url("올바른 URL을 입력해주세요").optional().or(z.literal("")),
  priority: z.number().int().min(0).default(0),
  showOnFeed: z.boolean().default(true),
  showOnCalendar: z.boolean().default(false),
  startAt: z.string().min(1, "게시 시작일을 선택해주세요"),
  endAt: z.string().optional().or(z.literal("")),
  isAllDay: z.boolean().default(false),
  eventStartAt: z.string().optional().or(z.literal("")),
  eventEndAt: z.string().optional().or(z.literal("")),
  isPublished: z.boolean().default(false),
  imageUrl: z.string().optional().or(z.literal("")),
  imageBlobPath: z.string().optional().or(z.literal("")),
});

export const updateAnnouncementSchema = createAnnouncementSchema.partial();

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
