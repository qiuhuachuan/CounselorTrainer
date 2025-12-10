<template>
  <div class="chat-container">
    <!-- 顶部工具栏 -->
    <div class="chat-header">
      <div class="session-info">
        <h3>{{ chatStore.currentSession?.title }}</h3>
        <span class="client-type">{{ chatStore.currentSession?.clientType }}</span>
      </div>
      <div class="header-tools">
        <div class="round-counter">
          <span class="label">当前轮次：</span>
          <span class="value">第{{ chatStore.currentRound }}轮</span>
        </div>
        <div class="timer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12,6 12,12 16,14" />
          </svg>
          <span>{{ chatStore.formatTime(chatStore.elapsedTime) }}</span>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="chat-main">
      <!-- 对话消息区域 -->
      <div class="messages-container" ref="messagesContainer">
        <div
          v-for="message in chatStore.messages"
          :key="message.id"
          class="message"
          :class="{
            'user-message': message.sender === 'user',
            'client-message': message.sender === 'client',
          }"
        >
          <button
            class="collapse-btn"
            :class="{ collapsed: isCollapsed(message.id) }"
            @click="toggleCollapse(message.id)"
            :aria-expanded="!isCollapsed(message.id)"
            :title="isCollapsed(message.id) ? '展开' : '折叠'"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline
                v-if="!isCollapsed(message.id)"
                points="6 9 12 15 18 9"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <polyline
                v-else
                points="9 18 15 12 9 6"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
          <div class="message-avatar">
            <span v-if="message.sender === 'user'">👤</span>
            <span v-else>🤖</span>
          </div>
          <div class="message-content">
            <div class="message-header">
              <span class="sender-name">{{ message.sender === "user" ? "我" : "AI来访者" }}</span>
              <span class="message-round">第{{ message.round }}轮</span>
              <span class="message-time">{{ formatTime(message.timestamp) }}</span>
            </div>
            <div v-if="!isCollapsed(message.id)" class="message-text">
              {{ message.content }}
              <div
                v-if="
                  message.sender === 'client' &&
                  isStreaming &&
                  message.id === chatStore.messages[chatStore.messages.length - 1]?.id
                "
                class="typing-indicator"
              >
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
              </div>
            </div>
            <div v-else class="collapsed-placeholder">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline
                  points="9 18 15 12 9 6"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <span>已折叠消息</span>
            </div>
          </div>
        </div>

        <div v-if="chatStore.isLoading" class="loading-message">
          <div class="typing-indicator">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
          <span>AI来访者正在思考...</span>
        </div>
      </div>

      <!-- 右侧提示框 -->
      <div class="tips-panel">
        <div class="tips-header">
          <h4>💡 回复提示</h4>
          <button @click="refreshTips" class="refresh-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
        <div class="tips-content">
          <div v-for="(tip, index) in currentTips" :key="index" class="tip-item">
            <span class="tip-number">{{ index + 1 }}.</span>
            <span class="tip-text">{{ tip }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部输入区域 -->
    <div class="input-container">
      <div class="input-wrapper">
        <textarea
          v-model="inputMessage"
          @keydown.enter.prevent="handleSend"
          placeholder="请输入您的回复..."
          class="message-input"
          :disabled="chatStore.isLoading"
          rows="1"
          ref="textarea"
        ></textarea>
        <button
          @click="handleSend"
          class="send-btn"
          :disabled="!inputMessage.trim() || chatStore.isLoading"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </div>
      <div class="input-hints">
        <span>按 Enter 发送消息</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from "vue";
import { useChatStore } from "../stores";

const chatStore = useChatStore();
const inputMessage = ref("");
const messagesContainer = ref<HTMLElement>();
const textarea = ref<HTMLElement>();
const isStreaming = ref(false);

// 折叠状态：按消息ID记录
const collapsed = ref<Record<string, boolean>>({});

const isCollapsed = (id: string) => !!collapsed.value[id];
const toggleCollapse = (id: string) => {
  collapsed.value[id] = !collapsed.value[id];
};

const currentTips = ref([
  "尝试使用开放式问题，鼓励来访者表达更多",
  "保持耐心和同理心，给予来访者充分的时间",
  "注意倾听来访者的情绪变化，适时给予回应",
  "避免过早下结论，保持开放的态度",
]);

const tipsPool = [
  [
    "尝试使用开放式问题，鼓励来访者表达更多",
    "保持耐心和同理心，给予来访者充分的时间",
    "注意倾听来访者的情绪变化，适时给予回应",
    "避免过早下结论，保持开放的态度",
  ],
  [
    "使用反射性倾听技巧，重复来访者的话",
    "观察来访者的非语言行为，如语气和停顿",
    "适时提供情感支持，让来访者感受到理解",
    "保持专业的边界，避免过度卷入",
  ],
  [
    '使用"我"语句来表达理解，如"我能理解您的感受"',
    "询问具体细节，帮助来访者更清晰地表达",
    "总结来访者的观点，确认理解是否正确",
    "保持中立的态度，不急于评判",
  ],
  [
    "鼓励来访者探索自己的感受和想法",
    "使用澄清技巧，确保理解准确",
    "注意来访者的语言模式，识别潜在问题",
    "保持专注，避免分心或打断",
  ],
];

const handleSend = async () => {
  if (!inputMessage.value.trim() || chatStore.isLoading) return;

  const message = inputMessage.value.trim();
  inputMessage.value = "";

  // 调整文本框高度
  if (textarea.value) {
    textarea.value.style.height = "auto";
  }

  // 开始流式输出
  isStreaming.value = true;

  // 模拟流式输出效果
  setTimeout(() => {
    isStreaming.value = false;
  }, 3000);

  await chatStore.sendMessage(message);

  // 发送后刷新提示
  refreshTips();
};

const refreshTips = () => {
  const randomTips = tipsPool[Math.floor(Math.random() * tipsPool.length)];
  currentTips.value = [...(randomTips || [])];
};

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const scrollToBottom = async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

// 监听消息变化，自动滚动到底部
watch(
  () => chatStore.messages.length,
  () => {
    scrollToBottom();
  }
);

// 监听输入框高度变化
const adjustTextareaHeight = () => {
  if (textarea.value) {
    textarea.value.style.height = "auto";
    textarea.value.style.height = Math.min(textarea.value.scrollHeight, 120) + "px";
  }
};

watch(inputMessage, () => {
  adjustTextareaHeight();
});

onMounted(() => {
  // 启动计时器
  chatStore.startTimer();

  // 如果有消息，滚动到底部
  if (chatStore.messages.length > 0) {
    scrollToBottom();
  }
});
</script>

<script lang="ts">
export default {
  name: "ChatView",
};
</script>

<style scoped>
.chat-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.chat-header {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  padding: 15px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.session-info h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.client-type {
  color: #909399;
  font-size: 14px;
  margin-left: 8px;
}

.header-tools {
  display: flex;
  align-items: center;
  gap: 20px;
}

.round-counter {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f0f2f5;
  padding: 8px 12px;
  border-radius: 6px;
}

.round-counter .label {
  color: #666;
  font-size: 14px;
}

.round-counter .value {
  color: #409eff;
  font-weight: 600;
  font-size: 14px;
}

.timer {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.timer svg {
  color: #909399;
}

.chat-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.messages-container {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  position: relative;
}

.user-message {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.user-message .message-avatar {
  background: #409eff;
  color: white;
}

.message-content {
  max-width: 70%;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 12px;
  color: #909399;
}

.user-message .message-header {
  justify-content: flex-end;
}

.sender-name {
  font-weight: 500;
}

.message-round {
  background: #f0f2f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
}

.message-text {
  background: white;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  position: relative;
  word-wrap: break-word;
}

.user-message .message-text {
  background: #409eff;
  color: white;
}

.client-message .message-text {
  background: #67c23a;
  color: white;
}

.collapse-btn {
  position: absolute;
  left: -8px;
  top: 0;
  transform: translateX(-100%);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f0f2f5;
  border: 1px solid #dcdfe6;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}

.collapse-btn:hover {
  background: #ecf5ff;
  color: #409eff;
}

.collapse-btn.collapsed {
  background: #f5f7fa;
  color: #909399;
}

.collapsed-placeholder {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #f0f2f5;
  border-radius: 6px;
  color: #909399;
  font-size: 12px;
}

.typing-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.3;
  animation: typing 1.4s infinite ease-in-out;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing {
  0%,
  80%,
  100% {
    opacity: 0.3;
  }
  40% {
    opacity: 1;
  }
}

.loading-message {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #909399;
  font-size: 14px;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  margin-left: 52px;
}

.tips-panel {
  width: 300px;
  background: white;
  border-left: 1px solid #e0e0e0;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.tips-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.tips-header h4 {
  margin: 0;
  color: #333;
  font-size: 16px;
}

.refresh-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #909399;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.3s;
}

.refresh-btn:hover {
  color: #409eff;
  background: #f0f9ff;
}

.tips-content {
  flex: 1;
  overflow-y: auto;
}

.tip-item {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.4;
}

.tip-number {
  color: #409eff;
  font-weight: 600;
  flex-shrink: 0;
}

.tip-text {
  color: #666;
}

.input-container {
  background: white;
  border-top: 1px solid #e0e0e0;
  padding: 16px 20px;
}

.input-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  min-height: 44px;
  max-height: 120px;
  font-family: inherit;
  transition: border-color 0.3s;
}

.message-input:focus {
  outline: none;
  border-color: #409eff;
}

.message-input:disabled {
  background-color: #f5f7fa;
  cursor: not-allowed;
}

.send-btn {
  padding: 12px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-btn:hover:not(:disabled) {
  background: #3a8ee6;
}

.send-btn:disabled {
  background: #c0c4cc;
  cursor: not-allowed;
}

.input-hints {
  text-align: center;
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}
</style>
