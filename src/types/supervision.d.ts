// SupervisionResult 组件的类型声明文件

// 维度类型
export interface Dimension {
  name: string;
  score: number;
  description?: string;
  comment?: string;
}

// 轮次类型
export interface Round {
  roundNumber: number;
  dialogueItems: DialogueItem[];
  annotations: Annotation[];
  score?: number;
  dimensionScores?: Record<string, number>;
  analysis?: string;
  suggestions?: string[];
  client_message?: string;
  therapist_message?: string;
}

// 标注类型
export interface Annotation {
  id?: string;
  text: string;
  label: string;
  score?: number;
  roundNumber?: number;
}

// 对话项类型
export interface DialogueItem {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

// 带标注的对话项类型
export interface AnnotatedDialogueItem extends DialogueItem {
  annotation: Array<{
    sentence: string;
    label: string;
  }>;
}

// 外部API结果类型
export interface ExternalApiResult {
  idx: number;
  dialogue: AnnotatedDialogueItem[];
  analysis?: string;
  score?: number;
  suggestions?: string[];
}

// 督导结果数据类型
export interface SupervisionResultData {
  id?: string;
  supervisionType?: 'training' | 'assessment' | 'external' | 'round';
  overallScore?: number;
  overall_score?: number; // 兼容模板中使用的属性名
  dimensions?: Dimension[];
  rounds?: Round[];
  recommendations?: string[];
  summary?: string;
  createdAt?: string;
  externalData?: ExternalApiResult;
}

// 督导结果组件的Props类型
export interface SupervisionResultProps {
  result?: SupervisionResultData | ExternalApiResult | null;
  supervisionType?: 'training' | 'assessment' | 'external' | 'round' | 'overall';
  loading?: boolean;
  error?: string | null;
}

// 督导结果组件的Emits类型
export interface SupervisionResultEmits {
  (e: 'close'): void;
  (e: 'retry'): void;
  (e: 'export'): void;
  (e: 'print'): void;
}