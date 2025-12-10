// 通用类型定义文件

// 会话类型
export interface SessionOut {
  id: string;
  title: string;
  createdAt: string;
  messageCount: number;
  lastMessage?: string;
}

// 对话注释类型
export interface DialogueAnnotation {
  sentence: string;
  label: string;
}

// 对话回合类型
export interface DialogueTurn {
  role: "assistant" | "user";
  content: string;
  annotation?: DialogueAnnotation[];
}

// 技术分析详情类型
export interface TechniqueAnalysis {
  techniques_used: string[];
  effectiveness: Array<{
    round: number;
    effectiveness: string;
  }>;
  improvement_suggestions: string[];
}

// 笔记结果类型
export interface NoteResult {
  note_type: string;
  note_content: string;
  conversation_summary: string;
  generated_at: string;
  // 技术分析相关字段
  technique_analysis?: TechniqueAnalysis;
  overall_report?: string;
  overall_analysis?: string;
  // 对话记录字段
  dialogue?: DialogueTurn[];
  [key: string]: unknown;
}

// 督导结果类型
export interface SupervisionResult {
  // 对话记录字段
  dialogue?: DialogueTurn[];
  [key: string]: unknown;
}

// 外部API调用结果类型
export interface ExternalApiResult {
  success: boolean;
  data?: unknown;
  message?: string;
  fileName?: string;
}
