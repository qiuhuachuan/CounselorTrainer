<template>
  <div class="personal-center">
    <!-- 顶部导航栏 -->
    <header class="header">
      <div class="header-left">
        <h1>AI x 咨询师培训系统</h1>
      </div>
      <div class="header-right">
        <span class="username">{{ authStore.user?.username }}</span>
        <button @click="handleLogout" class="logout-btn">退出登录</button>
      </div>
    </header>

    <div class="main-content">
      <!-- 左侧边栏 -->
      <aside class="sidebar">
        <div class="sidebar-nav">
          <div
            class="nav-item"
            :class="{ active: activeTab === 'ai-training' }"
            @click="activeTab = 'ai-training'"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <span>AI x 咨询师培训</span>
          </div>

          <div
            class="nav-item"
            :class="{ active: activeTab === 'notes' }"
            @click="activeTab = 'notes'"
          >
            <span class="icon-text">📝</span>
            <span>笔记管理</span>
          </div>
          <div
            class="nav-item"
            :class="{ active: activeTab === 'supervision' }"
            @click="activeTab = 'supervision'"
          >
            <span class="icon-text">👥</span>
            <span>督导功能</span>
          </div>
        </div>
      </aside>

      <!-- 主要内容区域 -->
      <main class="content">
        <!-- AI x 咨询师培训 -->
        <div v-if="activeTab === 'ai-training'" class="tab-content">
          <h2>AI x 咨询师培训</h2>
          <p>通过与AI模拟的不同类型咨询师进行对话练习，提升您的咨询技能。</p>

          <div class="training-options">
            <div class="training-card">
              <h3>对话练习</h3>
              <p>与不同类型的AI来访者进行实时对话，练习咨询技巧。</p>
              <button @click="goToDashboard" class="btn-primary">开始练习</button>
            </div>
            <div class="training-card">
              <h3>练习历史</h3>
              <p>查看所有历史对话记录，回顾和分析您的咨询过程。</p>
              <button @click="goToDashboard" class="btn-secondary">查看历史</button>
            </div>
            <div class="training-card">
              <h3>技能评估</h3>
              <p>根据您的对话表现，获取专业的技能评估和改进建议。</p>
              <button class="btn-disabled" disabled>功能开发中</button>
            </div>
          </div>
        </div>

        <!-- 笔记管理 -->
        <div v-else-if="activeTab === 'notes'" class="tab-content">
          <h2>笔记管理</h2>
          <p>记录和管理您在咨询过程中的重要笔记和观察。</p>

          <div v-if="errorMessage" class="error-notice">
            {{ errorMessage }}
          </div>

          <div v-if="showResult && noteResult" class="result-container">
            <div class="result-header">
              <h3>笔记结果</h3>
              <button @click="closeNoteResult" class="close-btn">关闭</button>
            </div>
            <div class="result-content">
              <div
                v-if="currentNoteType === 'case_conceptualization'"
                class="conceptualization-notes"
              >
                <h4>个案概念化</h4>
                <div
                  class="note-content"
                  v-html="renderMarkdown(noteResult?.note_content || '暂无内容')"
                ></div>
              </div>
              <div v-else-if="currentNoteType === 'SOAP_note'" class="soap-notes">
                <h4>SOAP笔记</h4>
                <div
                  class="note-content"
                  v-html="renderMarkdown(noteResult?.note_content || '暂无内容')"
                ></div>
              </div>
              <div v-else-if="currentNoteType === 'treatment_plan'" class="treatment-plan-notes">
                <h4>治疗计划</h4>
                <div
                  class="note-content"
                  v-html="renderMarkdown(noteResult?.note_content || '暂无内容')"
                ></div>
              </div>
            </div>
          </div>

          <div v-else>
            <!-- 笔记类型选择 -->
            <div class="note-type-selection">
              <div class="module-header">
                <h3>选择笔记类型</h3>
                <p>请先选择您需要的笔记类型</p>
              </div>
              <div class="module-content">
                <div class="form-group">
                  <label for="notes-type-select">笔记类型</label>
                  <select v-model="selectedNoteType" id="notes-type-select" class="form-control">
                    <option value="">请选择笔记类型</option>
                    <option v-for="type in noteTypes" :key="type.value" :value="type.value">
                      {{ type.label }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <!-- 模块一：使用会话记录 -->
            <div class="supervision-module" v-if="selectedNoteType">
              <div class="module-header">
                <h3>使用会话记录</h3>
                <p>选择历史会话记录进行笔记管理</p>
              </div>
              <div class="module-content">
                <div class="form-group">
                  <label for="notes-session-select">选择会话</label>
                  <select v-model="selectedSession" id="notes-session-select" class="form-control">
                    <option value="">请选择一个会话</option>
                    <option
                      v-for="session in sessions"
                      :key="session.id"
                      :value="session.id.toString()"
                    >
                      {{ session.title }} ({{ formatDate(session.created_at) }})
                    </option>
                  </select>
                </div>

                <div v-if="selectedSession" class="supervision-options">
                  <div class="note-type-info">
                    <p>
                      当前选择的笔记类型：
                      <strong>{{
                        noteTypes.find((t) => t.value === selectedNoteType)?.label
                      }}</strong>
                      <button @click="selectedNoteType = ''" class="change-type-button">
                        更改类型
                      </button>
                    </p>
                  </div>

                  <div class="option-card">
                    <h4>查看会话笔记</h4>
                    <p>查看和编辑与所选会话相关的笔记内容。</p>
                    <button
                      @click="viewSessionNotes"
                      class="btn-primary"
                      :disabled="!selectedSession || !selectedNoteType || loading"
                    >
                      {{ loading ? "处理中..." : "查看笔记" }}
                    </button>
                  </div>
                  <div class="option-card">
                    <h4>创建新笔记</h4>
                    <p>为所选会话创建新的笔记记录。</p>
                    <button
                      @click="createSessionNotes"
                      class="btn-primary"
                      :disabled="!selectedSession || !selectedNoteType || loading"
                    >
                      {{ loading ? "处理中..." : "创建笔记" }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 模块二：上传Word文档 -->
            <div class="supervision-module" v-if="selectedNoteType">
              <div class="module-header">
                <h3>上传Word文档</h3>
                <p>上传咨询笔记文档进行管理</p>
              </div>
              <div class="module-content">
                <WordUploader
                  v-model="selectedFile"
                  :note-type="selectedNoteType"
                  @upload-success="handleUploadSuccess"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 督导功能 -->
        <div v-else-if="activeTab === 'supervision'" class="tab-content">
          <SupervisionPage />
        </div>
        <!-- 默认内容展示 -->
        <div v-else class="tab-content">
          <div class="placeholder">
            <p>请选择左侧菜单查看相应内容</p>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores";
import { marked } from "marked";
import WordUploader from "../components/WordUploader.vue";
import SupervisionPage from "./SupervisionPage.vue";
import type { NoteResult } from "../types/index";

// 将markdown转换为HTML的函数
const renderMarkdown = (text: string): string => {
  if (!text) return "";
  try {
    // 使用marked.parse的同步模式
    return marked.parse(text) as string;
  } catch (error) {
    console.error("Markdown解析错误:", error);
    return text; // 解析失败时返回原始文本
  }
};

// 类型定义
interface Session {
  id: number;
  title: string;
  created_at: string;
}

const router = useRouter();
const authStore = useAuthStore();
const activeTab = ref<string>("ai-training");

// 督导功能相关数据
const selectedNoteType = ref<string>("");
const noteTypes = [
  { value: "个案概念化", label: "个案概念化" },
  { value: "SOAP笔记", label: "SOAP笔记" },
  { value: "治疗计划", label: "治疗计划" },
];
const selectedSession = ref<string>("");
const sessions = ref<Session[]>([]);
const selectedFile = ref<File | null>(null);

const handleLogout = () => {
  authStore.logout();
  router.push("/login");
};

const goToDashboard = () => {
  router.push("/dashboard");
};

// 格式化日期
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// 加载会话列表
const loadSessions = async (): Promise<void> => {
  try {
    const token = localStorage.getItem("token") || "";
    const response = await fetch("http://localhost:8000/api/sessions", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.ok) {
      const data = await response.json();
      sessions.value = data;
    }
  } catch (error: unknown) {
    console.error("加载会话列表失败:", error);
  }
};

// 处理笔记上传成功事件
const handleUploadSuccess = (result: NoteResult) => {
  noteResult.value = result;
  showResult.value = true;
  console.log("上传成功，结果数据：", result);
};

// 响应式数据
const loading = ref<boolean>(false);
const errorMessage = ref<string>("");
const noteResult = ref<NoteResult | null>(null);
const showResult = ref<boolean>(false);
const currentNoteType = ref<"case_conceptualization" | "SOAP_note" | "treatment_plan">(
  "case_conceptualization"
);

// 关闭笔记结果
const closeNoteResult = () => {
  showResult.value = false;
  noteResult.value = null;
  errorMessage.value = "";
};

// 笔记管理相关方法
const viewSessionNotes = async () => {
  if (!selectedSession.value) {
    errorMessage.value = "请选择一个会话";
    return;
  }

  if (!selectedNoteType.value) {
    errorMessage.value = "请选择笔记类型";
    return;
  }

  loading.value = true;
  errorMessage.value = "";

  try {
    const token = localStorage.getItem("token");
    const response = await fetch(
      `http://localhost:8000/api/notes/session/${selectedSession.value}?note_type=${selectedNoteType.value}`,
      {
        headers: {
          Authorization: `Bearer ${token || ""}`,
        },
      }
    );

    if (response.ok) {
      noteResult.value = await response.json();
      currentNoteType.value = selectedNoteType.value as
        | "case_conceptualization"
        | "SOAP_note"
        | "treatment_plan";
      showResult.value = true;
      console.log("会话笔记结果:", noteResult.value);
    } else {
      const error = await response.json();
      errorMessage.value = error.detail || "获取笔记失败";
    }
  } catch (error: unknown) {
    console.error("获取笔记失败:", error);
    errorMessage.value = "网络错误，请稍后重试";
  } finally {
    loading.value = false;
  }
};

const createSessionNotes = async () => {
  if (!selectedSession.value) {
    errorMessage.value = "请选择一个会话";
    return;
  }

  if (!selectedNoteType.value) {
    errorMessage.value = "请选择笔记类型";
    return;
  }

  loading.value = true;
  errorMessage.value = "";

  try {
    const token = localStorage.getItem("token");
    const response = await fetch(
      `http://localhost:8000/api/notes/session/${selectedSession.value}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ note_type: selectedNoteType.value }),
      }
    );

    if (response.ok) {
      noteResult.value = await response.json();
      currentNoteType.value = selectedNoteType.value as
        | "case_conceptualization"
        | "SOAP_note"
        | "treatment_plan";
      showResult.value = true;
      console.log("创建笔记结果:", noteResult.value);
    } else {
      const error = await response.json();
      errorMessage.value = error.detail || "创建笔记失败";
    }
  } catch (error: unknown) {
    console.error("创建笔记失败:", error);
    errorMessage.value = "网络错误，请稍后重试";
  } finally {
    loading.value = false;
  }
};

// 组件挂载时加载数据
onMounted(() => {
  loadSessions();
});
</script>

<script lang="ts">
export default {
  name: "PersonalCenter",
};
</script>

<style scoped>
.personal-center {
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

.header {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  padding: 0 20px;
  height: 60px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left h1 {
  color: #333;
  font-size: 20px;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.username {
  color: #666;
  font-size: 14px;
}

.logout-btn {
  background: #f56c6c;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.logout-btn:hover {
  background: #f45c5c;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  width: 100%;
}

.sidebar {
  width: 220px;
  background: white;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
}

.sidebar-nav {
  padding: 20px 0;
}

.nav-item {
  padding: 15px 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #666;
  font-size: 14px;
  transition: all 0.3s;
}

.nav-item:hover {
  background-color: #f5f7fa;
  color: #409eff;
}

.nav-item.active {
  background-color: #e6f2ff;
  color: #409eff;
  border-right: 3px solid #409eff;
}

.content {
  flex: 1;
  background: #f5f5f5;
  overflow-y: auto;
  padding: 20px;
}

.tab-content {
  background: white;
  border-radius: 8px;
  padding: 30px;
  min-height: 100%;
}

.tab-content h2 {
  color: #333;
  font-size: 24px;
  margin-bottom: 16px;
}

.tab-content p {
  color: #666;
  font-size: 14px;
  margin-bottom: 24px;
}

.training-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.training-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 24px;
  transition: all 0.3s;
}

.training-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.training-card h3 {
  color: #333;
  font-size: 18px;
  margin-bottom: 12px;
}

.option-card h4 {
  color: #333;
  font-size: 16px;
  margin-bottom: 10px;
  font-weight: 500;
}

.error-notice {
  background-color: #f8d7da;
  color: #721c24;
  padding: 10px 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  border: 1px solid #f5c6cb;
}

.supervision-module {
  max-width: 800px;
  margin: 0 auto 30px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.supervision-module:hover {
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
}

.module-header {
  background-color: #f5f7fa;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
}

.module-header h3 {
  color: #333;
  font-size: 18px;
  margin-bottom: 8px;
  font-weight: 600;
}

.module-header p {
  color: #606266;
  font-size: 14px;
  margin-bottom: 0;
}

.module-content {
  padding: 24px;
  background-color: white;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #606266;
  font-size: 14px;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  color: #606266;
  background-color: #fff;
  transition: border-color 0.3s;
}

.form-control:focus {
  outline: none;
  border-color: #409eff;
}

.supervision-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.option-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  background-color: #fafafa;
  transition: all 0.3s;
}

.option-card:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

.training-card p {
  color: #666;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 20px;
}

.btn-primary,
.btn-secondary,
.btn-disabled {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: #409eff;
  color: white;
}

.btn-primary:hover {
  background: #3a8ee6;
}

.btn-primary:disabled {
  opacity: 0.7;
}

.btn-secondary {
  background: #ffffff;
  color: #409eff;
  border: 1px solid #409eff;
}

.btn-secondary:hover {
  background: #f0f9ff;
}

.btn-disabled {
  background: #f5f7fa;
  color: #c0c4cc;
  cursor: not-allowed;
}

.placeholder {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.placeholder svg {
  margin-bottom: 20px;
}

.placeholder p {
  font-size: 16px;
  margin-bottom: 0;
}

/* 笔记类型选择样式 */
.note-type-selection {
  margin-bottom: 20px;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.note-type-selection .module-header h3 {
  margin-top: 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

/* 督导功能样式 */
.supervision-history {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.supervision-request-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s;
  background-color: #fff;
}

.supervision-request-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.request-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.request-id {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.request-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-pending {
  background-color: #fff3cd;
  color: #856404;
}

.status-processing {
  background-color: #d1ecf1;
  color: #0c5460;
}

.status-completed {
  background-color: #d4edda;
  color: #155724;
}

.status-rejected {
  background-color: #f8d7da;
  color: #721c24;
}

.request-info {
  margin-bottom: 15px;
}

.request-time {
  color: #909399;
  font-size: 13px;
  margin-bottom: 8px;
}

.request-description {
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.request-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.request-actions .btn-primary,
.request-actions .btn-secondary {
  padding: 6px 16px;
  font-size: 13px;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.modal-header .close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #909399;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.3s;
}

.modal-header .close-btn:hover {
  background-color: #f5f7fa;
  color: #606266;
}

.modal-body {
  padding: 24px;
  flex: 1;
  overflow-y: auto;
}

.modal-footer {
  padding: 20px 24px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 督导详情样式 */
.supervision-detail {
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: relative;
}

.detail-section {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 20px;
}

.detail-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.detail-section h4 {
  color: #333;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}

.detail-section p {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 8px;
}

.feedback-content {
  background-color: #f9f9f9;
  padding: 16px;
  border-radius: 8px;
  margin-top: 20px;
  line-height: 1.6;
  color: #333;
}

.feedback-content h1,
.feedback-content h2,
.feedback-content h3,
.feedback-content h4,
.feedback-content h5,
.feedback-content h6 {
  margin-top: 16px;
  margin-bottom: 8px;
  color: #333;
}

.feedback-content p {
  margin: 8px 0;
  margin-bottom: 15px;
  color: #606266;
}

.feedback-content ul,
.feedback-content ol {
  margin: 8px 0;
  padding-left: 20px;
}

.feedback-content pre,
.feedback-content code {
  background: #f0f0f0;
  border-radius: 4px;
  padding: 4px 8px;
}

.feedback-content pre {
  padding: 12px;
  overflow-x: auto;
}

/* 适配响应式 */
@media (max-width: 768px) {
  .request-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .request-actions {
    flex-direction: column;
  }

  .modal-content {
    width: 95%;
    margin: 20px;
  }

  .personal-center {
    flex-direction: column;
  }
  .sidebar {
    width: 100%;
    height: auto;
  }
  .main-content {
    width: 100%;
    padding: 16px;
  }
}

.placeholder {
  text-align: center;
  padding: 40px 20px;
}

.note-type-info {
  margin-top: 15px;
  padding: 10px 15px;
  background-color: #e8f4fd;
  border-left: 4px solid #409eff;
  border-radius: 4px;
}

.note-type-info p {
  margin: 0;
  color: #333;
}

.change-type-button {
  margin-left: 10px;
  padding: 4px 12px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.change-type-button:hover {
  background-color: #66b1ff;
}

/* 笔记内容样式 */
.note-content {
  padding: 20px;
  background-color: #ffffff;
  border-radius: 8px;
  margin-top: 10px;
  line-height: 1.6;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell,
    sans-serif;
}

/* Markdown样式 */
.note-content h1,
.note-content h2,
.note-content h3,
.note-content h4,
.note-content h5,
.note-content h6 {
  color: #2c3e50;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

.note-content h1 {
  font-size: 1.8em;
  border-bottom: 2px solid #eaecef;
  padding-bottom: 0.3em;
}
.note-content h2 {
  font-size: 1.5em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}
.note-content h3 {
  font-size: 1.2em;
}

.note-content p {
  margin-bottom: 1em;
  text-align: justify;
}

.note-content ul,
.note-content ol {
  margin-bottom: 1em;
  padding-left: 2em;
}

.note-content li {
  margin-bottom: 0.5em;
}

.note-content ul li::marker {
  color: #409eff;
}

.note-content ol li::marker {
  color: #67c23a;
}

.note-content blockquote {
  margin: 1em 0;
  padding: 0.5em 1em;
  border-left: 4px solid #409eff;
  background-color: #f4f4f5;
  color: #606266;
}

.note-content code {
  padding: 0.2em 0.4em;
  background-color: #f4f4f5;
  border-radius: 3px;
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  font-size: 0.9em;
  color: #e96900;
}

.note-content pre {
  padding: 1em;
  background-color: #f4f4f5;
  border-radius: 6px;
  overflow-x: auto;
  margin: 1em 0;
}

.note-content pre code {
  background: none;
  padding: 0;
  color: inherit;
  font-size: 0.9em;
}

.note-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
}

.note-content th,
.note-content td {
  padding: 8px 12px;
  border: 1px solid #eaeaea;
}

.note-content th {
  background-color: #f4f4f5;
  font-weight: 600;
}

.note-content tr:nth-child(even) {
  background-color: #f9f9f9;
}

/* 笔记结果容器样式 */
.result-container {
  margin-top: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e0e0e0;
}

.result-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: #f56c6c;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.close-btn:hover {
  background: #f45c5c;
}

.result-content {
  padding: 20px;
  background-color: white;
}

.conceptualization-notes,
.soap-notes,
.treatment-plan-notes {
  margin-bottom: 20px;
}

.conceptualization-notes h4,
.soap-notes h4,
.treatment-plan-notes h4 {
  color: #409eff;
  font-size: 16px;
  margin-bottom: 15px;
  font-weight: 600;
}
</style>
