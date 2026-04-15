import { z } from "zod/v4";

export const MAX_IMAGES = 10;

export const IMAGE_ASPECTS = ["16:9", "4:3", "1:1", "3:4", "original"] as const;
export const IMAGE_FITS = ["cover", "contain"] as const;

export type ImageAspect = (typeof IMAGE_ASPECTS)[number];
export type ImageFit = (typeof IMAGE_FITS)[number];

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
  imageUrls: z
    .array(z.string().url("이미지 URL 형식이 올바르지 않습니다"))
    .max(MAX_IMAGES, `이미지는 최대 ${MAX_IMAGES}장까지 업로드할 수 있습니다`)
    .default([]),
  imageBlobPaths: z
    .array(z.string())
    .max(MAX_IMAGES, `이미지는 최대 ${MAX_IMAGES}장까지 업로드할 수 있습니다`)
    .default([]),
  imageAspect: z.enum(IMAGE_ASPECTS).default("16:9"),
  imageFit: z.enum(IMAGE_FITS).default("cover"),
  // Per-image focal points — CSS object-position ("<x>% <y>%"), index-aligned with imageUrls
  imageFocals: z
    .array(
      z
        .string()
        .regex(
          /^(100|[0-9]{1,2})% (100|[0-9]{1,2})%$/,
          "포커스 포인트 형식이 올바르지 않습니다"
        )
    )
    .max(MAX_IMAGES)
    .default([]),
});

export const updateAnnouncementSchema = createAnnouncementSchema.partial();

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
