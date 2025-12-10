<template>
  <div class="word-uploader-container">
    <!-- 笔记类型已在父组件选择，此处不再显示 -->
    <!-- 此组件专门用于笔记（Note）类型的Word文档上传 -->
    
    <!-- 文档上传框 -->
    <div 
      class="tab-content word-uploader"
      @dragenter.prevent="handleDragEnter"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
      :class="{ 'dragging': isDragging }"
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
        :disabled="disabled || uploading"
      >
        {{ uploading ? '上传中...' : '选择Word文档' }}
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
        <span class="progress-text">{{ uploadProgress }}%</span>
      </div>
    </div>
    
    <!-- 上传按钮 - 只在选择文件后显示 -->
    <div v-if="selectedFile" class="submit-button-container">
      <button 
        class="btn-success submit-button"
        @click="handleSubmit"
        :disabled="!props.noteType || uploading"
      >
        {{ !props.noteType ? '请先选择笔记类型' : (uploading ? '处理中...' : `获取${props.noteType}`) }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { NoteResult } from '../types/index';

// 定义属性
const props = defineProps<{
  modelValue?: File | null;
  disabled?: boolean;
  // 笔记类型 - 用于区分不同类型的笔记，如个案概念化、咨询技术分析等
  noteType?: string;
}>();

// 定义事件
const emit = defineEmits<{
    'fileSelected': [file: File | null];
    'upload-success': [result: NoteResult];
    'upload-error': [error: string];
    'uploadToExternalAPI': [result: NoteResult];
  }>();

// 响应式数据
const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref<boolean>(false);
const selectedFile = ref<File | null>(props.modelValue || null);
const uploading = ref<boolean>(false);
const uploadProgress = ref<number>(0);

// 监听modelValue变化已移除，因为不再使用v-model绑定

// 触发文件选择对话框
const triggerFileUpload = (): void => {
  if (!props.disabled && !uploading.value) {
    fileInput.value?.click();
  }
};

// 处理文件选择变化
const handleFileChange = (event: Event): void => {
  const target = event.target as HTMLInputElement;
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
  const allowedTypes = ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const allowedExtensions = ['.doc', '.docx'];
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  
  if (allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension)) {
    selectedFile.value = file;
    emit('fileSelected', file);
  } else {
    const errorMessage = '请上传Word文档 (.doc 或 .docx)';
    alert(errorMessage);
  }
};

// 移除文件
const removeFile = (): void => {
  selectedFile.value = null;
    if (fileInput.value) {
      fileInput.value.value = '';
    }
    emit('fileSelected', null);
};

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 处理提交逻辑
const handleSubmit = async (): Promise<void> => {
  // 调用实际的上传方法
  // 笔记类型检查已在父组件中完成
  await uploadToExternalAPI();
};

// 上传到服务器并解析
const uploadToExternalAPI = async (): Promise<void> => {
  if (!selectedFile.value) {
    const errorMessage = '请选择文件';
    emit('upload-error', errorMessage);
    return;
  }
  
  uploading.value = true;
  uploadProgress.value = 0;
  
  try {
    // 创建FormData对象
    const formData = new FormData();
    formData.append('file', selectedFile.value);
    // 添加笔记类型参数
    if (props.noteType) {
      formData.append('note_type', props.noteType);
    }
    // 使用专用的外部API接口
    
    // 分阶段进度更新，更真实地反映上传过程
    const updateProgress = () => {
      if (uploadProgress.value < 30) {
        uploadProgress.value += 5;
        setTimeout(updateProgress, 100);
      } else if (uploadProgress.value < 70) {
        // 模拟文件处理阶段
        uploadProgress.value += 3;
        setTimeout(updateProgress, 300);
      }
    };
    updateProgress();
    
    // 发送请求到后端处理Word文档，添加Authorization头
    const response = await fetch('/api/notes/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: formData,
      credentials: 'include' // 包含cookies以支持认证
    });
    
    // 处理阶段完成，进入结果返回阶段
    uploadProgress.value = 85;
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.message || `上传失败: ${response.statusText}`;
      throw new Error(errorMessage);
    }
    
    const result = await response.json();
    console.log('后端返回的逐字稿解析结果:', result);
    
    // 验证响应数据
    if (!result) {
      throw new Error('未收到有效的响应数据');
    }
    
    // 确保数据格式符合NoteResult类型
    const formattedResult: NoteResult = {
      title: result.title || '生成的笔记',
      note_content: result.note_content || result.content || result.text || '',
      conversation_summary: result.conversation_summary || result.summary || '',
      note_type: result.note_type || props.noteType || '未分类笔记',
      generated_at: result.generated_at || new Date().toISOString(),
      ...result
    };
    
    // 更新进度为100%
    uploadProgress.value = 100;
    
    // 触发事件，将结果传递给父组件
    emit('upload-success', formattedResult);
    // 确保同时触发uploadToExternalAPI事件，传递解析结果给父组件
    emit('uploadToExternalAPI', formattedResult);
    
    // 延迟重置上传状态，让用户看到100%的进度
    setTimeout(() => {
      uploadProgress.value = 0;
      uploading.value = false;
    }, 800);
    
  } catch (error) {
    console.error('上传错误:', error);
    const errorMessage = error instanceof Error ? error.message : '文件上传失败，请重试';
    emit('upload-error', errorMessage);
    uploading.value = false;
    uploadProgress.value = 0;
  }
};

// 暴露方法供父组件调用
defineExpose({
  triggerFileUpload,
  removeFile,
  validateAndSetFile,
  uploadToExternalAPI,
  setUploading: (status: boolean) => {
    uploading.value = status;
  },
  setUploadProgress: (progress: number) => {
    uploadProgress.value = progress;
  }
});
</script>

<style scoped>
.submit-button-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
/* 笔记类型选择区域样式 */
.note-type-selection-section {
  text-align: center;
  padding: 20px;
  margin-bottom: 20px;
  background-color: #f8f9fa;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
}

.note-type-selection-section h3 {
  margin: 0 0 10px 0;
  color: #495057;
  font-size: 18px;
}

.note-type-tips {
  color: #6c757d;
  font-size: 14px;
}
/* 外层容器样式 */
.word-uploader-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin-bottom: 0;
  width: 100%;
}

/* 主上传框样式优化 */
.word-uploader {
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
  min-width: unset; /* 移除最小宽度限制，确保在任何容器中都能正常显示 */
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 0; /* 与其他组件保持一致的间距 */
}

/* 添加装饰性背景元素 */


/* 提交按钮样式 */
.submit-button {
  padding: 10px 24px;
  background-color: #67c23a;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}

.submit-button:hover:not(:disabled) {
  background-color: #5daf34;
}

.submit-button:disabled {
  background-color: #c0c4cc;
  cursor: not-allowed;
}

.word-uploader::before {
  content: '';
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

.word-uploader:hover::before,
.word-uploader.dragging::before {
  opacity: 1;
}

/* 悬停效果增强 */
.word-uploader:hover:not(.disabled):not(.uploading) {
  border-color: #409eff;
  background-color: #ecf5ff;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.15);
}

/* 拖拽状态增强 */
.word-uploader.dragging {
  border-color: #409eff;
  background-color: #ecf5ff;
  transform: scale(1.01);
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.15);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.15);
  }
  50% {
    box-shadow: 0 6px 20px 0 rgba(0, 0, 0, 0.2);
  }
}

/* 禁用状态优化 */
.word-uploader.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: #f9fafb;
  border-color: #e5e7eb;
}

/* 上传中状态 */
.word-uploader.uploading {
  cursor: wait;
  opacity: 0.9;
  border-color: #409eff;
}

/* 隐藏的文件输入框 */
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

.word-uploader:hover:not(.disabled) .upload-tip {
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

/* 移除不必要的渐变动画，保持简约风格 */
.progress-fill::after {
  display: none;
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
  .word-uploader {
    padding: 24px 20px;
    min-height: 200px;
    border-radius: 10px;
    min-width: auto;
  }
  
  .upload-button {
  padding: 12px 24px;
  font-size: 16px;
  width: 100%;
  max-width: 350px;
  margin-bottom: 12px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.upload-button:hover:not(:disabled) {
  background-color: #66b1ff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
}

.upload-button:disabled {
  background-color: #c0c4cc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
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
  .word-uploader {
    padding: 20px 16px;
    min-height: 180px;
    min-width: auto;
  }
  
  .upload-tip {
  font-size: 14px;
  color: #606266;
  margin-bottom: 16px;
  font-weight: 400;
}
  
  .selected-file {
    padding: 12px;
  }
  
  .upload-button {
    max-width: 100%;
  }
}
</style>