// Shared Types Public API

// Timeline
// TechStackName / TECH_STACK_NAMES はSSOT（shared/config/tech-stack.ts）に移設したため、
// 技術名の一覧が必要な場合は `@/shared/config` から取得する。
export type {
	TechStackName,
	TimelineItem,
	TimelineItemCategory,
	TimelineItemPeriod,
} from "./timeline";
