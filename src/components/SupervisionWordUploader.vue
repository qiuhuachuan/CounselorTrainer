<template>
  <div class="supervision-word-uploader-container">
    <!-- 文档上传框 -->
    <div
      class="tab-content supervision-word-uploader"
      @dragenter.prevent="handleDragEnter"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
      :class="{ dragging: isDragging }"
    >
      <input
        ref="fileInput"
        type="file"
        accept=".doc,.docx"
        class="hidden-input"
        @change="handleFileChange"
      />
      <button
        class="btn-primary upload-button"
        @click="triggerFileUpload"
        :disabled="props.disabled || uploading"
      >
        {{ uploading ? "上传中..." : "选择Word文档" }}
      </button>
      <div class="upload-tip">或拖拽文件到此处</div>

      <!-- 已选文件显示 -->
      <div v-if="selectedFile" class="selected-file">
        <div class="file-info">
          <span class="file-name">{{ selectedFile.name }}</span>
          <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
        </div>
        <button class="remove-button" @click="removeFile">移除</button>
      </div>

      <!-- 上传进度 -->
      <div v-if="uploadProgress > 0 && uploadProgress < 100" class="upload-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
        </div>
        <div class="progress-text">{{ uploadProgress }}%</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits } from "vue";
import type { SupervisionResult } from "../types/index";

// 定义组件属性
const props = defineProps<{
  // 禁用状态
  disabled?: boolean;
  // 加载状态（由父组件控制）
  loading?: boolean;
  // 督导类型
  supervisionType?: string;
}>();

// 定义组件事件
const emit = defineEmits<{
  // 文件选择事件
  "file-selected": [file: File | null];
  // 上传成功事件
  "upload-success": [result: SupervisionResult];
  // 上传失败事件
  "upload-error": [error: Error];
}>();

// 状态管理
const selectedFile = ref<File | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const uploading = ref(false);
const uploadProgress = ref(0);

// 触发文件上传
const triggerFileUpload = () => {
  if (!props.disabled && !uploading.value) {
    fileInput.value?.click();
  }
};

// 处理文件选择
const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    validateAndSetFile(file);
  }
};

// 拖拽相关事件处理
const handleDragEnter = (e: DragEvent): void => {
  e.preventDefault();
  isDragging.value = true;
};

const handleDragOver = (e: DragEvent): void => {
  e.preventDefault();
  isDragging.value = true;
};

const handleDragLeave = (e: DragEvent): void => {
  e.preventDefault();
  isDragging.value = false;
};

const handleDrop = (e: DragEvent): void => {
  e.preventDefault();
  isDragging.value = false;

  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  }
};

// 验证并设置文件
const validateAndSetFile = (file: File): void => {
  const allowedTypes = [
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  const allowedExtensions = [".doc", ".docx"];
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."));

  if (allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension)) {
    selectedFile.value = file;
    emit("file-selected", file);
  } else {
    const errorMessage = "请上传Word文档 (.doc 或 .docx)";
    emit("upload-error", new Error(errorMessage));
  }
};

// 移除文件
const removeFile = (): void => {
  selectedFile.value = null;
  if (fileInput.value) {
    fileInput.value.value = "";
  }
  emit("file-selected", null);
};

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// 暴露方法给父组件
defineExpose({
  // 手动上传文件到后端
  async uploadToBackend() {
    console.log("uploadToBackend 开始执行");

    if (!selectedFile.value) {
      console.error("uploadToBackend: 请先选择文件");
      throw new Error("请先选择文件");
    }

    uploading.value = true;
    uploadProgress.value = 10;
    console.log("uploadToBackend: 上传状态设置为true，进度10%");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile.value);

      // 添加督导类型参数
      if (props.supervisionType) {
        formData.append("supervision_type", props.supervisionType);
        console.log("uploadToBackend: 添加督导类型参数:", props.supervisionType);
      } else {
        console.warn("uploadToBackend: 未提供督导类型参数");
      }

      // 设置进度为30% - 表示准备阶段
      uploadProgress.value = 30;
      console.log("uploadToBackend: 准备阶段完成，进度30%");

      // 检查请求URL和参数
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/supervision/upload`;
      const token = localStorage.getItem("token");
      console.log("uploadToBackend: 准备发送请求到:", apiUrl);
      console.log("uploadToBackend: Token存在:", !!token);
      console.log("uploadToBackend: 文件大小:", selectedFile.value.size);
      console.log("uploadToBackend: 文件类型:", selectedFile.value.type);

      // 发送请求到后端处理Word文档，添加Authorization头
      console.log("uploadToBackend: 开始发送请求...");
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token || ""}`,
        },
        body: formData,
        credentials: "include", // 包含cookies以支持认证
      });

      console.log("uploadToBackend: 请求发送完成，响应状态:", response.status);

      // 处理阶段完成，进入结果返回阶段
      uploadProgress.value = 85;
      console.log("uploadToBackend: 处理阶段完成，进度85%");

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.detail || errorData.message || `上传失败: ${response.statusText}`;
        console.error("uploadToBackend: 请求失败:", errorMessage);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("uploadToBackend: 后端返回结果:", result);

      // 确保数据格式符合SupervisionResult类型
      const formattedResult: SupervisionResult = {
        ...result,
        dialogue: Array.isArray(result.dialogue) ? result.dialogue : [],
      };

      // 更新进度为100%
      uploadProgress.value = 100;
      console.log("uploadToBackend: 上传完成，进度100%");

      // 触发上传成功事件
      emit("upload-success", formattedResult);
      console.log("uploadToBackend: 触发上传成功事件");

      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "上传失败，请稍后重试";
      console.error("uploadToBackend: 错误:", error);
      emit("upload-error", error instanceof Error ? error : new Error(errorMessage));
      throw error;
    } finally {
      // 重置上传状态
      setTimeout(() => {
        uploading.value = false;
        uploadProgress.value = 0;
        console.log("uploadToBackend: 重置上传状态");
      }, 500);
    }
  },

  // 重置组件状态
  reset() {
    selectedFile.value = null;
    if (fileInput.value) {
      fileInput.value.value = "";
    }
    uploading.value = false;
    uploadProgress.value = 0;
    emit("file-selected", null);
  },

  // 获取当前选择的文件
  getSelectedFile() {
    return selectedFile.value;
  },
});
</script>

<style scoped>
.supervision-word-uploader-container {
  width: 100%;
}

.supervision-word-uploader {
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  padding: 32px;
  text-align: center;
  transition: all 0.3s ease;
  background-color: #ffffff;
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-width: 600px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 0;
}

/* 添加装饰性背景元素 */
.supervision-word-uploader::before {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(64, 158, 255, 0.05) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 0;
}

.supervision-word-uploader:hover::before,
.supervision-word-uploader.dragging::before {
  opacity: 1;
}

/* 悬停效果增强 */
.supervision-word-uploader:hover:not(.disabled):not(.uploading) {
  border-color: #409eff;
  background-color: #ecf5ff;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.15);
}

/* 拖拽状态增强 */
.supervision-word-uploader.dragging {
  border-color: #409eff;
  background-color: #ecf5ff;
  transform: scale(1.01);
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.15);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.15);
  }
  50% {
    box-shadow: 0 6px 20px 0 rgba(0, 0, 0, 0.2);
  }
}

/* 禁用状态优化 */
.supervision-word-uploader.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: #f9fafb;
  border-color: #e5e7eb;
}

/* 上传中状态 */
.supervision-word-uploader.uploading {
  cursor: wait;
  opacity: 0.9;
  border-color: #409eff;
}

/* 隐藏输入框 */
.hidden-input {
  display: none;
}

/* 上传按钮美化 */
.btn-primary {
  background: #409eff;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
  box-shadow: none;
}

.upload-button {
  margin-bottom: 12px;
  width: 100%;
}

/* 按钮悬停效果 */
.btn-primary:hover:not(:disabled) {
  background: #66b1ff;
  transform: translateY(0);
  box-shadow: none;
  color: white;
}

/* 按钮点击效果 */
.upload-button:active:not(:disabled) {
  transform: translateY(0);
}

/* 按钮禁用状态 */
.btn-primary:disabled {
  background: #c0c4cc;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

/* 提示文字样式 */
.upload-tip {
  color: #606266;
  font-size: 14px;
  margin-bottom: 16px;
  transition: color 0.3s ease;
  position: relative;
  z-index: 1;
}

.supervision-word-uploader:hover:not(.disabled) .upload-tip {
  color: #409eff;
}

/* 已选文件展示优化 */
.selected-file {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
  width: 100%;
  margin-top: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
  animation: slideUp 0.4s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.selected-file:hover {
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.15);
  border-color: #dcdfe6;
}

/* 文件信息布局优化 */
.file-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
  overflow: hidden;
  min-width: 0;
}

/* 文件名样式 */
.file-name {
  font-weight: 600;
  color: #303133;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 300px;
  font-size: 14px;
}

/* 文件大小样式 */
.file-size {
  font-size: 12px;
  color: #606266;
  margin-top: 4px;
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 12px;
}

/* 移除按钮美化 */
.remove-button {
  background: #f56c6c;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: none;
}

.remove-button:hover {
  background: #f78989;
  transform: translateY(0);
  box-shadow: none;
  color: white;
}

.remove-button:active {
  transform: translateY(0);
}

/* 上传进度容器 */
.upload-progress {
  width: 100%;
  margin-top: 20px;
  position: relative;
  z-index: 1;
  animation: slideUp 0.4s ease;
}

/* 进度条背景 */
.progress-bar {
  width: 100%;
  height: 10px;
  background-color: #e5e7eb;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 8px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 进度条填充 */
.progress-fill {
  height: 100%;
  background: #67c23a;
  border-radius: 5px;
  transition: width 0.5s ease;
  position: relative;
}

/* 进度文本 */
.progress-text {
  font-size: 13px;
  color: #606266;
  text-align: center;
  display: block;
  font-weight: 500;
}

/* 响应式设计增强 */
@media (max-width: 768px) {
  .supervision-word-uploader {
    padding: 24px 20px;
    min-height: 200px;
    border-radius: 10px;
    min-width: auto;
  }

  .upload-button {
    padding: 11px 20px;
    font-size: 14px;
    width: 100%;
    max-width: 300px;
  }

  .selected-file {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .remove-button {
    align-self: flex-end;
  }

  .file-name {
    max-width: 100%;
  }
}

@media (max-width: 480px) {
  .supervision-word-uploader {
    padding: 20px 16px;
    min-height: 180px;
    min-width: auto;
  }

  .upload-tip {
    font-size: 13px;
    margin-bottom: 12px;
  }

  .selected-file {
    padding: 12px;
  }

  .upload-button {
    max-width: 100%;
  }
}
</style>
