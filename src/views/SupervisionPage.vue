<template>
  <div class="supervision-page">
    <div class="container">
      <h1 class="page-title">督导分析</h1>

      <!-- 上传部分 -->
      <div class="upload-section" :class="{ hidden: selectedFile && !resultData }">
        <SupervisionWordUploader
          ref="wordUploaderRef"
          @file-selected="handleFileSelected"
          @upload-success="handleUploadSuccess"
          @upload-error="handleUploadError"
          :loading="loading"
          :supervision-type="selectedSupervisionType"
        />

        <!-- 督导类型选择 -->
        <div class="supervision-type-section" v-if="!resultData">
          <label>选择督导类型：</label>
          <select v-model="selectedSupervisionType" class="supervision-type-select">
            <option value="">请选择类型</option>
            <option v-for="type in supervisionTypes" :key="type" :value="type">
              {{ type }}
            </option>
          </select>
        </div>

        <!-- 错误提示 -->
        <div v-if="error" class="error-notification">
          <span class="error-icon">⚠️</span>
          {{ error }}
        </div>
      </div>

      <!-- 确认发送部分 -->
      <div class="confirm-section" v-if="selectedFile && !resultData">
        <div class="file-info">
          <h3>文件选择成功</h3>
          <p>文件名: {{ selectedFile.name }}</p>
          <p>文件大小: {{ formatFileSize(selectedFile.size) }}</p>
        </div>

        <div class="action-buttons">
          <button
            class="send-button"
            @click="sendToBackend"
            :disabled="loading || !selectedSupervisionType"
          >
            {{
              loading
                ? "发送中..."
                : !selectedSupervisionType
                ? "请先选择督导类型"
                : "发送到后端分析"
            }}
          </button>
          <button class="cancel-button" @click="handleRetry" :disabled="loading">重新上传</button>
        </div>
      </div>

      <!-- 结果展示部分 -->
      <div class="result-section">
        <SupervisionResult
          :result="resultData"
          :loading="loading"
          :error="error"
          :supervision-type="selectedSupervisionType"
          @close="handleCloseResult"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import SupervisionWordUploader from "../components/SupervisionWordUploader.vue";
import SupervisionResult from "../components/SupervisionResult.vue";
import type { SupervisionResult as SupervisionResultType } from "../types/index";

// 状态管理
const loading = ref(false);
const error = ref("");
const wordUploaderRef = ref<InstanceType<typeof SupervisionWordUploader> | null>(null);
const selectedFile = ref<File | null>(null);
const resultData = ref<SupervisionResultType | null>(null);
const selectedSupervisionType = ref<string>("");
const supervisionTypes = ref<string[]>(["督导总结", "技术分析", "案例评估", "其他类型"]);

// 处理文件选择成功
const handleFileSelected = (file: File | null) => {
  selectedFile.value = file;
  resultData.value = null;
  error.value = "";
  console.log("handleFileSelected 被调用，文件:", file);
  console.log("selectedFile.value 现在为:", selectedFile.value);
  console.log("selectedSupervisionType.value 现在为:", selectedSupervisionType.value);
  console.log("按钮是否应该显示:", !!selectedFile.value && !resultData.value);
  console.log("按钮是否应该启用:", !loading.value && !!selectedSupervisionType.value);
};

// 处理文件上传成功
const handleUploadSuccess = async (response: SupervisionResultType) => {
  try {
    loading.value = true;
    error.value = "";

    console.log("handleUploadSuccess 被调用，完整响应:", response);
    console.log("响应中是否包含dialogue字段:", "dialogue" in response);
    console.log("dialogue字段的值:", response.dialogue);
    console.log("dialogue字段的类型:", typeof response.dialogue);
    console.log("dialogue字段的长度:", response.dialogue?.length);

    // 存储原始响应用于调试
    localStorage.setItem("debugResponse", JSON.stringify(response));

    // 确保dialogue字段存在且是数组
    if (response.dialogue && !Array.isArray(response.dialogue)) {
      console.error("dialogue字段不是数组:", response.dialogue);
      response.dialogue = [];
    }

    // 验证结果数据的完整性
    if (!response) {
      error.value = "上传结果格式不正确，请重试";
      return;
    }

    // 保存响应
    resultData.value = response; // 直接保存SupervisionResult类型的结果
    console.log("保存到resultData后的dialogue值:", resultData.value?.dialogue);

    // 自动保存到localStorage，作为备用
    try {
      localStorage.setItem("externalApiResult", JSON.stringify(response));
    } catch (e) {
      console.error("保存结果到localStorage失败:", e);
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : "处理上传结果时出错";
    resultData.value = null;
    console.error("处理上传结果时出错:", err);
  } finally {
    loading.value = false;
  }
};

// 删除了未使用的viewResult函数

// 清空结果函数被注释，因为当前不需要此功能
// const clearResult = () => {
//   uploadedResponse.value = null;
//   uploadSuccessMessage.value = '';
//   try {
//     localStorage.removeItem('externalApiResult');
//   } catch (e) {
//     console.error('清空localStorage时出错:', e);
//   }
// };

// 发送到后端分析
const sendToBackend = async () => {
  try {
    loading.value = true;
    error.value = "";

    console.log("sendToBackend 开始执行");
    console.log("selectedFile.value:", selectedFile.value);
    console.log("wordUploaderRef.value:", wordUploaderRef.value);
    console.log("selectedSupervisionType:", selectedSupervisionType.value);

    if (!selectedFile.value) {
      throw new Error("请先选择文件");
    }

    // 通过ref调用SupervisionWordUploader组件的上传方法
    if (wordUploaderRef.value) {
      // 组件内部会调用uploadToBackend方法并触发upload-success事件
      console.log("调用 wordUploaderRef.value.uploadToBackend()");
      resultData.value = await wordUploaderRef.value.uploadToBackend();
      console.log("开始上传文件到后端...");
    } else {
      throw new Error("上传组件未初始化");
    }
  } catch (err) {
    console.error("sendToBackend 出错:", err);
    error.value = err instanceof Error ? err.message : "发送到后端分析时出错";
    resultData.value = null;
  } finally {
    loading.value = false;
  }
};

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
};

// 处理文件上传错误
const handleUploadError = (err: Error | string) => {
  error.value = err instanceof Error ? err.message : String(err);
  console.error("上传错误:", err);
};

// 关闭结果展示，返回上传界面
const handleCloseResult = () => {
  resultData.value = null;
  selectedFile.value = null;
  error.value = "";
};

// 重试上传
const handleRetry = () => {
  resultData.value = null;
  selectedFile.value = null;
  error.value = "";
};

// 移除未使用的导出和打印处理函数
</script>

<style scoped>
.supervision-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.hidden {
  display: none;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.page-title {
  text-align: center;
  color: #333;
  padding: 30px 20px;
  margin: 0;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.upload-section {
  padding: 40px;
}

.result-section {
  padding: 40px;
}

.upload-success {
  text-align: center;
  padding: 60px 20px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 12px;
  border: 1px solid #bae6fd;
}

.success-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.upload-success h3 {
  color: #0369a1;
  margin-bottom: 15px;
  font-size: 24px;
}

.upload-success p {
  color: #0891b2;
  margin-bottom: 30px;
  font-size: 16px;
}

.view-result-button {
  background-color: #0284c7;
  color: white;
  border: none;
  padding: 14px 40px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);
}

.view-result-button:hover:not(:disabled) {
  background-color: #0369a1;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(2, 132, 199, 0.4);
}

.view-result-button:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.error-notification {
  background-color: #fef0f0;
  border: 1px solid #fbc4c4;
  color: #f56c6c;
  padding: 12px 20px;
  border-radius: 6px;
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.error-icon {
  font-size: 16px;
}

.confirm-section {
  padding: 40px;
  text-align: center;
}

.file-info {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
  text-align: left;
}

.file-info h3 {
  margin-top: 0;
  color: #409eff;
}

.file-info p {
  margin: 10px 0;
  color: #606266;
}

.action-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.send-button {
  background-color: #409eff;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.send-button:hover:not(:disabled) {
  background-color: #66b1ff;
}

.send-button:disabled {
  background-color: #c0c4cc;
  cursor: not-allowed;
}

.cancel-button {
  background-color: white;
  color: #606266;
  border: 1px solid #dcdfe6;
  padding: 12px 30px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.cancel-button:hover:not(:disabled) {
  color: #409eff;
  border-color: #c6e2ff;
}

.cancel-button:disabled {
  color: #c0c4cc;
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .supervision-page {
    padding: 10px;
  }

  .upload-section,
  .confirm-section,
  .result-section {
    padding: 20px;
  }

  .page-title {
    padding: 20px 15px;
    font-size: 20px;
  }

  .action-buttons {
    flex-direction: column;
    align-items: stretch;
  }

  .send-button,
  .cancel-button {
    width: 100%;
  }
}
</style>
