<template>
  <div class="external-api-view">
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
          <h3 v-if="!isCollapsed">功能导航</h3>
        </div>

        <div class="nav-menu">
          <router-link
            to="/dashboard"
            class="nav-item"
            :class="{ active: $route.path === '/dashboard' }"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span v-if="!isCollapsed">对话训练</span>
          </router-link>
          <router-link
            to="/external-api"
            class="nav-item"
            :class="{ active: $route.path === '/external-api' }"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span v-if="!isCollapsed">外部API调用</span>
          </router-link>
          <router-link
            to="/personal-center"
            class="nav-item"
            :class="{ active: $route.path === '/personal-center' }"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span v-if="!isCollapsed">个人中心</span>
          </router-link>
        </div>
      </aside>

      <!-- 主要内容区域 -->
      <main class="content">
        <div class="content-header">
          <h2>外部API调用</h2>
          <p>上传Word文档并获取外部API处理结果</p>
        </div>

        <div class="content-body">
          <!-- 文件上传区域 -->
          <div class="upload-section">
            <WordUploader @uploadToExternalAPI="handleExternalApiResult" @error="handleError" />
          </div>

          <!-- 结果展示区域 -->
          <div v-if="externalResult" class="result-section">
            <SupervisionResult
              supervisionType="external"
              :result="externalResult"
              :loading="loading"
              :error="resultError"
              @close="clearResult"
            />
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores";
import WordUploader from "../components/WordUploader.vue";
import SupervisionResult from "../components/SupervisionResult.vue";
import type { NoteResult } from "../types/index";

const router = useRouter();
const authStore = useAuthStore();

const isCollapsed = ref(false);// 响应式数据
const externalResult = ref<NoteResult | null>(null);
const loading = ref(false);
const resultError = ref('');

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value;
};

const handleExternalApiResult = (result: NoteResult) => {
  console.log("收到外部API结果:", result);
  externalResult.value = result;
  resultError.value = "";
};

const handleError = (error: Error) => {
  console.error("发生错误:", error);
  resultError.value = error.message;
};

const clearResult = () => {
  externalResult.value = null;
  resultError.value = "";
};

const handleLogout = () => {
  authStore.logout();
  router.push("/login");
};
</script>

<style scoped>
.external-api-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f7fa;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 60px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.header-left h1 {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.username {
  color: #606266;
}

.logout-btn {
  padding: 6px 16px;
  background-color: #f56c6c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.logout-btn:hover {
  background-color: #f78989;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 240px;
  background-color: #fff;
  box-shadow: 2px 0 6px rgba(0, 21, 41, 0.1);
  transition: all 0.3s ease;
  overflow-y: auto;
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.toggle-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #909399;
  padding: 4px;
}

.toggle-btn:hover {
  color: #409eff;
}

.sidebar-header h3 {
  margin: 0;
  margin-left: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.nav-menu {
  padding: 8px 0;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: #606266;
  text-decoration: none;
  transition: all 0.3s;
  cursor: pointer;
}

.nav-item:hover {
  background-color: #f5f7fa;
  color: #409eff;
}

.nav-item.active {
  background-color: #ecf5ff;
  color: #409eff;
  border-right: 3px solid #409eff;
}

.nav-item span {
  margin-left: 12px;
  font-size: 14px;
}

.content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.content-header {
  margin-bottom: 24px;
}

.content-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.content-header p {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.content-body {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.upload-section {
  background-color: #fff;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.result-section {
  background-color: #fff;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>
