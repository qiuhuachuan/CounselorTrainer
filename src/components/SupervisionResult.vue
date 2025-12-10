<template>
  <div class="supervision-result">
    <!-- 标题区域 -->
    <div class="result-header">
      <h2>
        {{
          supervisionType === "case_conceptualization"
            ? "个案概念化结果"
            : supervisionType === "technique_analysis" || supervisionType === "技术分析"
            ? "技术分析结果"
            : supervisionType === "督导总结"
            ? "督导总结结果"
            : supervisionType === "案例评估"
            ? "案例评估结果"
            : supervisionType === "supervision"
            ? "督导分析结果"
            : "督导结果"
        }}
      </h2>
    </div>

    <!-- 督导分析 -> 技术分析 -> 结果显示 -->
    <div class="result-content">
      <!-- 实际对话记录显示 -->
      <div class="result-card dialogue-card">
        <div class="card-header">
          <h3 class="card-title">对话记录</h3>
        </div>
        <div class="card-body">
          <div class="dialogue-container">
            <div
              v-for="(turn, index) in result?.dialogue"
              :key="index"
              :class="['dialogue-turn', turn.role === 'assistant' ? 'assistant-turn' : 'user-turn']"
            >
              <div class="dialogue-role">
                {{ turn.role === "assistant" ? "咨询师" : "来访者" }}
              </div>
              <div class="dialogue-content">
                {{ turn.content }}
              </div>
              <div
                v-if="turn.annotation && turn.annotation.length > 0"
                class="dialogue-annotations"
              >
                <div class="annotation-title">技术注释:</div>
                <ul class="annotation-list">
                  <li v-for="(anno, annoIndex) in turn.annotation" :key="annoIndex">
                    <span class="annotation-label">{{ anno.label }}:</span> {{ anno.sentence }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button class="btn btn-primary" @click="exportResult">
          <span class="btn-icon">📥</span> 导出结果
        </button>
        <button class="btn btn-secondary" @click="printReport">
          <span class="btn-icon">🖨️</span> 打印报告
        </button>
        <button class="btn btn-outline" @click="handleClose">
          <span class="btn-icon">✕</span> 关闭
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from "vue";
import type { SupervisionResult } from "../types/index";

// 定义组件属性类型
interface SupervisionResultProps {
  supervisionType: string;
  result: SupervisionResult | null;
  loading?: boolean;
  error?: string;
}

// 定义事件类型
type SupervisionResultEmits = {
  (e: "close"): void;
};

// 获取props和emits
const props = defineProps<SupervisionResultProps>();
const emit = defineEmits<SupervisionResultEmits>();

// 笔记类型映射
const noteTypeLabels: Record<string, string> = {
  supervision: "督导分析",
  technique_analysis: "技术分析",
};

// 获取笔记类型标签
function getNoteTypeLabel(type: unknown): string {
  if (typeof type !== "string") return "";
  return noteTypeLabels[type] || type;
}

// 事件处理函数
function handleClose(): void {
  emit("close");
}

function exportResult(): void {
  // 创建一个新窗口用于打印
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    // 如果无法打开新窗口，使用默认打印
    window.print();
    return;
  }

  // 构建打印内容
  const content = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${getNoteTypeLabel(props.result?.note_type || "")}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1, h2, h3, h4 { color: #333; }
        h1 { font-size: 24px; margin-bottom: 20px; }
        h2 { font-size: 20px; margin-top: 30px; }
        h3 { font-size: 18px; margin-top: 25px; }
        h4 { font-size: 16px; margin-top: 20px; }
        p { margin-bottom: 15px; }
        .metadata { background-color: #f8f9fa; padding: 10px; border-radius: 4px; margin-bottom: 20px; font-size: 14px; }
        .markdown-content { white-space: pre-wrap; }
      </style>
    </head>
    <body>
      <h1>${getNoteTypeLabel(props.result?.note_type || "")}</h1>
      <div class="metadata">
        <p><strong>生成时间:</strong> ${formatDate(props.result?.generated_at || "")}</p>
      </div>
      <div class="markdown-content">${formatContent(props.result?.note_content || "")}</div>
      ${
        typeof props.result?.conversation_summary === "string" &&
        props.result.conversation_summary.trim() &&
        props.result.conversation_summary !== "占位符"
          ? `
      <h2>对话摘要</h2>
      <p>${props.result.conversation_summary}</p>
      `
          : ""
      }
    </body>
    </html>
  `;

  // 写入内容并打印
  printWindow.document.write(content);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function printReport(): void {
  exportResult();
}

// 简化且高效的Markdown渲染函数
function formatContent(content: unknown): string {
  if (typeof content !== "string") return "";

  // 临时存储修改后的内容
  let formatted = content;

  // 1. 首先处理所有换行符，将\n替换为<br>，确保所有文本正确显示
  formatted = formatted.replace(/\n/g, "<br>");

  // 2. 处理加粗 (**text**)
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  // 3. 处理特殊格式的标题
  formatted = formatted.replace(/\*\*【([^】]*)】\*\*/g, '<h4 class="special-title">$1</h4>');

  // 4. 处理带加粗标题的列表项
  formatted = formatted.replace(
    /(\d+)\.\s+\*\*(.*?)\*\*:\s+(.*?)(<br>|$)/g,
    "<p><strong>$1. $2:</strong> $3</p>$4"
  );

  // 5. 处理有序列表项
  formatted = formatted.replace(/(\d+)\.\s+([^<]+)(<br>|$)/g, "<p>$1. $2</p>$3");

  // 6. 处理技术分析特定格式
  if (
    formatted.includes("使用的技术") ||
    formatted.includes("技术有效性") ||
    formatted.includes("改进建议")
  ) {
    // 处理技术分析标题
    formatted = formatted.replace(
      /\*\*(使用的技术|技术有效性|改进建议)\*\*/g,
      '<h3 class="technique-section">$1</h3>'
    );

    // 处理技术列表项
    formatted = formatted.replace(/•\s+(.*?)(<br>|$)/g, "<li>$1</li>$2");

    // 包裹列表
    formatted = formatted.replace(/(<li>.*?<\/li>)+/g, '<ul class="technique-list">$&</ul>');
  }

  // 7. 确保整个内容被包裹在适当的容器中
  if (!/^<p|<h[1-6]|<ul/.test(formatted)) {
    formatted = `<p>${formatted}</p>`;
  }

  return formatted;
}

// 格式化日期显示
function formatDate(dateString: unknown): string {
  if (typeof dateString !== "string") return "";

  try {
    const date = new Date(dateString);
    // 使用Intl.DateTimeFormat获取更友好的日期格式
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  } catch (error) {
    console.error("日期格式化错误:", error);
    return dateString;
  }
}
</script>

<style scoped>
/* 主容器样式 */
.supervision-result {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial,
    sans-serif;
  color: #333;
  line-height: 1.6;
}

/* 标题区域 */
.result-header {
  margin-bottom: 30px;
  text-align: center;
}

.result-header h2 {
  color: #2c3e50;
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  padding: 0;
}

/* 状态容器样式 */
.status-container {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px;
  border-radius: 12px;
  margin-bottom: 20px;
}

/* 加载状态 */
.status-container.loading {
  background-color: #f8f9fa;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e3f2fd;
  border-top: 3px solid #2196f3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  color: #666;
  font-size: 16px;
  margin: 0;
}

/* 错误状态 */
.status-container.error {
  background-color: #ffebee;
  border: 1px solid #ffcdd2;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-message {
  color: #c62828;
  font-size: 16px;
  margin-bottom: 20px;
}

/* 空状态 */
.status-container.empty {
  background-color: #f5f5f5;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-message {
  color: #757575;
  font-size: 16px;
  margin: 0;
}

/* 结果内容区域 */
.result-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 卡片样式 */
.result-card {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.result-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.12);
}

/* 卡片头部 */
.card-header {
  background-color: #f8f9fa;
  padding: 16px 24px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

/* 笔记类型标签 */
.note-type-badge {
  background-color: #3498db;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 卡片内容 */
.card-body {
  padding: 24px;
}

/* Markdown内容样式 */
.markdown-content {
  white-space: pre-wrap;
  word-wrap: break-word;
}

.markdown-content h1,
.markdown-content h2,
.markdown-content h3,
.markdown-content h4,
.markdown-content h5,
.markdown-content h6 {
  color: #2c3e50;
  margin-top: 24px;
  margin-bottom: 16px;
  line-height: 1.3;
}

.markdown-content h4.special-title {
  color: #3498db;
  border-left: 4px solid #3498db;
  padding-left: 12px;
  margin-top: 20px;
  margin-bottom: 12px;
}

.markdown-content p {
  margin-bottom: 16px;
  color: #4a5568;
}

.markdown-content strong {
  color: #2d3748;
  font-weight: 600;
}

.markdown-content em {
  font-style: italic;
}

.markdown-content ul,
.markdown-content ol {
  padding-left: 24px;
  margin-bottom: 16px;
}

.markdown-content li {
  margin-bottom: 8px;
}

.markdown-content blockquote {
  border-left: 4px solid #3498db;
  padding-left: 16px;
  margin-left: 0;
  margin-right: 0;
  color: #718096;
  font-style: italic;
}

.markdown-content pre {
  background-color: #f7fafc;
  border-radius: 6px;
  padding: 16px;
  overflow-x: auto;
  margin-bottom: 16px;
}

.markdown-content code {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  background-color: #f7fafc;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 0.9em;
}

.markdown-content pre code {
  background-color: transparent;
  padding: 0;
}

.markdown-content hr {
  border: 0;
  height: 1px;
  background-color: #e2e8f0;
  margin: 24px 0;
}

/* 列表项样式 */
.list-item {
  display: flex;
  margin-bottom: 12px;
  align-items: flex-start;
}

.bullet-point {
  color: #3498db;
  font-weight: bold;
  margin-right: 8px;
  flex-shrink: 0;
}

/* 对话摘要样式 */
.conversation-summary {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #28a745;
  line-height: 1.7;
  color: #4a5568;
}

/* 信息项样式 */
.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e9ecef;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  color: #6c757d;
  font-weight: 500;
}

.info-value {
  color: #2c3e50;
  font-weight: 400;
}

/* 按钮样式 */
.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 30px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  gap: 6px;
  min-width: 120px;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-primary:hover {
  background-color: #2980b9;
  transform: translateY(-1px);
}

.btn-secondary {
  background-color: #28a745;
  color: white;
}

.btn-secondary:hover {
  background-color: #218838;
  transform: translateY(-1px);
}

.btn-outline {
  background-color: transparent;
  color: #6c757d;
  border: 1px solid #6c757d;
}

.btn-outline:hover {
  background-color: #6c757d;
  color: white;
  transform: translateY(-1px);
}

.btn-retry {
  background-color: #ffc107;
  color: #212529;
}

.btn-retry:hover {
  background-color: #e0a800;
  transform: translateY(-1px);
}

.btn-icon {
  font-size: 16px;
}

/* 技术分析相关样式 */
.technique-list {
  list-style-type: disc;
  padding-left: 20px;
  margin: 0;
}

.technique-list li {
  margin-bottom: 8px;
  padding-left: 8px;
  line-height: 1.6;
}

.effectiveness-item {
  margin-bottom: 12px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #28a745;
}

.effectiveness-item:last-child {
  margin-bottom: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .supervision-result {
    padding: 16px;
  }

  .result-header h2 {
    font-size: 24px;
  }

  .card-header {
    padding: 12px 16px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .card-body {
    padding: 16px;
  }

  .action-buttons {
    flex-direction: column;
    align-items: stretch;
  }

  .btn {
    width: 100%;
  }

  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .technique-list {
    padding-left: 16px;
  }

  .effectiveness-item {
    padding: 8px;
  }
}

@media (max-width: 480px) {
  .supervision-result {
    padding: 12px;
  }

  .result-header h2 {
    font-size: 20px;
  }

  .card-title {
    font-size: 16px;
  }

  .markdown-content h4.special-title {
    font-size: 14px;
  }
}

/* 对话记录样式 */
.dialogue-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dialogue-turn {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 100%;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.assistant-turn {
  background-color: #e3f2fd;
  border-left: 4px solid #2196f3;
  align-self: flex-start;
}

.user-turn {
  background-color: #f5f5f5;
  border-left: 4px solid #9e9e9e;
  align-self: flex-start;
}

.dialogue-role {
  font-weight: 600;
  font-size: 14px;
  color: #2c3e50;
  margin-bottom: 4px;
}

.assistant-turn .dialogue-role {
  color: #1976d2;
}

.user-turn .dialogue-role {
  color: #424242;
}

.dialogue-content {
  font-size: 14px;
  line-height: 1.6;
  color: #4a5568;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.dialogue-annotations {
  margin-top: 8px;
  padding: 12px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.annotation-title {
  font-weight: 600;
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.annotation-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.annotation-list li {
  font-size: 13px;
  line-height: 1.5;
  margin-bottom: 6px;
  padding-left: 16px;
  position: relative;
}

.annotation-list li:before {
  content: "•";
  position: absolute;
  left: 0;
  color: #2196f3;
  font-weight: bold;
}

.annotation-label {
  font-weight: 600;
  color: #2196f3;
  margin-right: 6px;
}

/* 打印样式优化 */
@media print {
  .action-buttons {
    display: none;
  }

  .result-card {
    box-shadow: none;
    border: 1px solid #ddd;
  }

  .dialogue-turn {
    box-shadow: none;
    border: 1px solid #e0e0e0;
  }
}

/* 调试信息样式 */
.debug-section {
  margin-top: 20px;
  padding: 16px;
  background-color: #f0f0f0;
  border-radius: 8px;
}

.debug-section h4 {
  margin-top: 0;
  color: #333;
}

.debug-section pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 12px;
  color: #333;
  max-height: 300px;
  overflow-y: auto;
  background-color: #fff;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #ddd;
}
</style>
