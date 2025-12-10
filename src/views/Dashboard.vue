<template>
  <div class="dashboard">
    <!-- 顶部导航栏 -->
    <header class="header">
      <div class="header-left">
        <button @click="goToHome" class="home-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
          返回主页
        </button>
        <h1>AI x 咨询师培训系统</h1>
      </div>
      <div class="header-right">
        <span class="username">{{ authStore.user?.username }}</span>
        <button @click="handleLogout" class="logout-btn">退出登录</button>
      </div>
    </header>

    <div class="main-content">
      <!-- 左侧边栏 -->
      <aside class="sidebar" :class="{ collapsed: isCollapsed }">
        <div class="sidebar-header">
          <button @click="toggleSidebar" class="toggle-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h3 v-if="!isCollapsed">对话历史</h3>
        </div>

        <div class="new-chat-btn-container">
          <button @click="showClientSelection = true" class="new-chat-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span v-if="!isCollapsed">新建对话</span>
          </button>
        </div>

        <div class="chat-sessions">
          <div
            v-for="session in chatStore.sessions"
            :key="session.id"
            class="session-item"
            :class="{ active: session.id === chatStore.currentSession?.id }"
          >
            <div class="session-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <div v-if="!isCollapsed" class="session-info" @click="openSession(session.id)">
              <div class="session-title">{{ session.title }}</div>
              <div class="session-meta">
                <span>{{ session.clientType }}</span>
                <span>•</span>
                <span>{{ formatDate(session.createdAt) }}</span>
                <span class="message-count">{{ session.messageCount }}条消息</span>
              </div>
            </div>
            <button
              v-if="!isCollapsed"
              class="delete-btn"
              @click.stop="deleteSession(session.id)"
              title="删除对话"
            >
              ×
            </button>
          </div>
        </div>
      </aside>

      <!-- 主要内容区域 -->
      <main class="content">
        <div v-if="!chatStore.currentSession" class="welcome-screen">
          <div class="welcome-content">
            <h2>欢迎使用AI来访者培训系统</h2>
            <p>点击左侧"新建对话"开始与AI来访者进行练习</p>
            <div class="quick-actions">
              <button @click="showClientSelection = true" class="action-btn primary">
                开始新对话
              </button>
            </div>
          </div>
        </div>

        <Chat v-else />
      </main>
    </div>

    <!-- 来访者选择弹窗 -->
    <div v-if="showClientSelection" class="modal-overlay" @click="showClientSelection = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>选择来访者类型</h3>
          <button @click="showClientSelection = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="client-types">
            <div
              v-for="client in clientTypes"
              :key="client.type"
              @click="createNewSession(client.type)"
              class="client-card"
            >
              <div class="client-icon">{{ client.icon }}</div>
              <div class="client-info">
                <h4>{{ client.name }}</h4>
                <p>{{ client.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore, useChatStore } from "../stores";
import Chat from "./Chat.vue";

const router = useRouter();
const authStore = useAuthStore();
const chatStore = useChatStore();

const isCollapsed = ref(false);
const showClientSelection = ref(false);

// 来访者类型配置，key从1开始计数
// 1对应后端"亲密关系-来访者：林女士"的profile
const clientTypes = [
  {
    type: "1",
    name: "亲密关系-来访者：林女士",
    description: "31岁单身女性，存在亲密关系恐惧和抵触问题",
    icon: "👩‍💼",
  },
  {
    type: "焦虑型来访者",
    name: "焦虑型来访者",
    description: "表现出焦虑症状的来访者，需要耐心倾听和引导",
    icon: "😰",
  },
  {
    type: "抑郁型来访者",
    name: "抑郁型来访者",
    description: "情绪低落、兴趣减退的来访者，需要共情和支持",
    icon: "😔",
  },
  {
    type: "愤怒型来访者",
    name: "愤怒型来访者",
    description: "情绪激动、易怒的来访者，需要理解和疏导",
    icon: "😠",
  },
  {
    type: "依赖型来访者",
    name: "依赖型来访者",
    description: "过度依赖、缺乏自信的来访者，需要鼓励和赋能",
    icon: "🥺",
  },
];

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value;
};

const openSession = async (sessionId: string) => {
  await chatStore.loadSession(sessionId);
};

const deleteSession = async (sessionId: string) => {
  if (confirm("确定要删除这个对话历史吗？此操作不可恢复。")) {
    await chatStore.deleteSession(sessionId);
  }
};

const createNewSession = async (clientType: string) => {
  showClientSelection.value = false;
  await chatStore.createSession(clientType);
};

const handleLogout = () => {
  authStore.logout();
  router.push("/login");
};

const goToHome = () => {
  router.push("/personal-center");
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes <= 1 ? "刚刚" : `${minutes}分钟前`;
    }
    return `${hours}小时前`;
  } else if (days === 1) {
    return "昨天";
  } else if (days < 7) {
    return `${days}天前`;
  } else {
    return date.toLocaleDateString();
  }
};

onMounted(async () => {
  // 从后端获取会话历史
  await chatStore.fetchSessions();

  // 初始化时如果有会话，加载第一个会话
  if (chatStore.sessions.length > 0) {
    const firstSession = chatStore.sessions[0];
    if (firstSession) {
      await chatStore.loadSession(firstSession.id);
    }
  }
});
</script>

<script lang="ts">
export default {
  name: "MainDashboard",
};
</script>

<style scoped>
.dashboard {
  height: 100vh;
  width: 100%;
  min-width: 100%;
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
  min-width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.home-btn {
  background: #409eff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  margin-right: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background-color 0.3s;
}

.home-btn:hover {
  background: #3a8ee6;
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
  min-width: 100%;
}

.sidebar {
  width: 280px;
  background: white;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  transition: width 0.3s;
}

.sidebar.collapsed {
  width: 60px;
}

.sidebar-header {
  padding: 15px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.sidebar-header h3 {
  margin: 0;
  color: #333;
  font-size: 16px;
}

.toggle-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  color: #666;
  transition: color 0.3s;
}

.toggle-btn:hover {
  color: #333;
}

.new-chat-btn-container {
  padding: 15px;
  border-bottom: 1px solid #e0e0e0;
}

.new-chat-btn {
  width: 100%;
  padding: 10px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  transition: background-color 0.3s;
}

.new-chat-btn:hover {
  background: #3a8ee6;
}

.chat-sessions {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

.session-item {
  padding: 12px 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  transition: background-color 0.3s;
  border-radius: 6px;
  margin: 0 10px;
}

.delete-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #666;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  opacity: 0;
  transition: all 0.2s ease;
}

.session-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background-color: #ffecec;
  color: #ff4d4f;
}

.message-count {
  margin-left: auto;
  color: #909399;
  font-size: 12px;
}

.session-item:hover {
  background-color: #f5f7fa;
}

.session-item.active {
  background-color: #e6f2ff;
  color: #409eff;
}

.session-icon {
  color: #909399;
}

.session-info {
  flex: 1;
  min-width: 0;
}

.session-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #333;
}

.session-meta {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 4px;
}

.content {
  flex: 1;
  background: #f5f5f5;
  overflow: hidden;
  /* 移除固定宽度计算，依靠flex布局自然填充剩余空间 */
  width: auto;
  min-width: 0; /* 允许内容区域可以缩小 */
}

.welcome-screen {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.welcome-content {
  text-align: center;
  max-width: 500px;
  padding: 40px;
}

.welcome-content h2 {
  color: #333;
  font-size: 28px;
  margin-bottom: 16px;
}

.welcome-content p {
  color: #666;
  font-size: 16px;
  margin-bottom: 32px;
}

.quick-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.action-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s;
}

.action-btn.primary {
  background: #409eff;
  color: white;
}

.action-btn.primary:hover {
  background: #3a8ee6;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #909399;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.client-types {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.client-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 16px;
}

.client-card:hover {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.client-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.client-info h4 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 16px;
}

.client-info p {
  margin: 0;
  color: #666;
  font-size: 14px;
  line-height: 1.4;
}
</style>
