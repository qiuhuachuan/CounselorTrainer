<template>
  <div class="notes-page">
    <div class="page-header">
      <h1>笔记管理</h1>
      <button class="back-button" @click="$router.push('/personal-center')">
        <span class="icon">←</span> 返回个人中心
      </button>
    </div>

    <div class="notes-container">
      <!-- 笔记方式选择 -->
      <div class="notes-tabs">
        <button 
          class="tab-button" 
          :class="{ active: selectedTab === 'upload' }"
          @click="selectedTab = 'upload'"
        >
          上传文档生成笔记
        </button>
        <button 
          class="tab-button" 
          :class="{ active: selectedTab === 'session' }"
          @click="selectedTab = 'session'"
        >
          选择会话生成笔记
        </button>
      </div>

      <!-- 上传文档生成笔记 -->
      <div v-if="selectedTab === 'upload'" class="tab-content">
        <!-- 笔记类型选择 - 移到文档上传之前 -->
        <div v-if="!selectedNoteType" class="note-type-selection">
          <h3>请选择笔记类型</h3>
          <div class="note-types">
            <button 
              v-for="type in noteTypes" 
              :key="type"
              class="note-type-button"
              @click="handleNoteTypeSelect(type)"
            >
              {{ type }}
            </button>
          </div>
        </div>
        
        <!-- 文档上传区域 - 只有选择了笔记类型后才显示 -->
        <div v-if="selectedNoteType">
          <div class="note-type-info">
            <strong>当前选择的笔记类型：</strong>{{ selectedNoteType }}
            <button class="change-type-button" @click="selectedNoteType = ''">更改类型</button>
          </div>
          
          <!-- 确保上传组件有足够的空间显示 -->
          <div class="upload-container">
            <WordUploader 
              ref="wordUploader"
              :note-type="selectedNoteType"
              :disabled="generatingNote"
              @file-selected="handleFileSelected"
              @upload-success="(result) => handleUploadSuccess(result as LocalNoteResult)"
              @upload-error="handleUploadError"
              @uploadToExternalAPI="(result) => handleUploadToExternalAPI(result as LocalNoteResult)"
            />
          </div>
        </div>
      </div>

      <!-- 选择会话生成笔记 -->
      <div v-if="selectedTab === 'session'" class="tab-content">
        <div class="session-selection">
          <h3>选择会话</h3>
          <div v-if="loading" class="loading">加载会话中...</div>
          <div v-else-if="sessions.length === 0" class="empty-message">暂无会话记录</div>
          <div v-else class="session-list">
            <div 
              v-for="session in sessions" 
              :key="session.id"
              class="session-item"
              @click="handleSessionSelect(session)"
            >
              <div class="session-title">{{ session.title }}</div>
              <div class="session-meta">
              <span>{{ formatDate(session.createdAt || session.created_at) }}</span>
              <span>{{ `${session.messageCount} 条消息` }}</span>
              <span v-if="session.duration">{{ `${session.duration} 分钟` }}</span>
            </div>
            </div>
          </div>
        </div>

        <div v-if="selectedSession && !selectedNoteType" class="note-type-selection">
          <h3>请选择笔记类型</h3>
          <div class="note-types">
            <button 
              v-for="type in noteTypes" 
              :key="type"
              class="note-type-button"
              @click="handleNoteTypeSelect(type)"
            >
              {{ type }}
            </button>
          </div>
        </div>
      </div>

      <!-- 笔记生成进度 -->
      <div v-if="generatingNote" class="generating-progress">
        <div class="progress-spinner"></div>
        <p>正在生成笔记，请稍候...</p>
      </div>

      <!-- 笔记结果展示 -->
      <div v-if="uploadedFileInfo && uploadedFileInfo.result" class="note-result">
        <div class="result-header">
          <h2>{{ uploadedFileInfo.result.note_type }} - 笔记结果</h2>
          <div class="result-actions">
            <button class="action-button" @click="exportNote">导出笔记</button>
            <button class="action-button" @click="clearResult">重新生成</button>
          </div>
        </div>
        
        <div class="result-content">
          <div class="content-section">
          <h3>笔记内容</h3>
          <div class="note-content" v-html="formatNoteContent((uploadedFileInfo.result?.note_content || uploadedFileInfo.result?.content || uploadedFileInfo.result?.text || '') as string)"></div>
          <!-- 如果没有笔记内容，显示提示信息 -->
          <div v-if="!uploadedFileInfo.result?.note_content && !uploadedFileInfo.result?.content && !uploadedFileInfo.result?.text" class="no-content-message">
            暂无笔记内容，请重新上传或选择其他方式生成笔记。
          </div>
        </div>
          
          <div class="content-section">
          <h3>对话摘要</h3>
          <div class="conversation-summary" v-html="formatNoteContent((uploadedFileInfo.result?.conversation_summary || uploadedFileInfo.result?.summary || '') as string)"></div>
        </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import WordUploader from '../components/WordUploader.vue';

// 从types/index导入NoteResult类型
import type { NoteResult } from '@/types';

// 定义扩展的NoteResult类型以支持索引签名
interface LocalNoteResult extends NoteResult {
  [key: string]: unknown;
}

interface SessionOut {
  id: string;
  title: string;
  createdAt: string;
  messageCount: number;
  created_at?: string;
  duration?: number;
  [key: string]: unknown;
}

// 状态管理
const selectedTab = ref<'upload' | 'session'>('upload');
const noteTypes = ref<string[]>(['个案概念化', '咨询技术分析', '情绪识别与处理']);
const sessions = ref<SessionOut[]>([]);
const selectedSession = ref<SessionOut | null>(null);
const selectedNoteType = ref<string>('');
const generatingNote = ref(false);
const loading = ref(false);
const wordUploader = ref<InstanceType<typeof WordUploader> | null>(null);
// 存储上传的文件信息
const uploadedFileInfo = ref<{ file: File, result: LocalNoteResult } | null>(null);

// 获取笔记类型
const getNoteTypes = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('获取笔记类型失败: 未登录');
      return;
    }
    
    const response = await fetch('/api/note-types', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`获取笔记类型失败: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    if (Array.isArray(data)) {
      noteTypes.value = data;
    } else {
      console.error('获取笔记类型失败: 返回数据格式错误');
    }
  } catch (error: unknown) {
    console.error('获取笔记类型失败:', error);
    // 可以在这里添加用户友好的错误提示
  }
};

// 获取会话列表
const fetchSessions = async () => {
  loading.value = true;
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('未登录，请先登录');
    }
    
    const response = await fetch('/api/sessions', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || `获取会话列表失败: ${response.status}`);
    }
    
    const data = await response.json();
    // 验证数据格式并类型转换
    if (Array.isArray(data)) {
      sessions.value = data.map(session => ({
        id: session.id || '',
        title: session.title || '未命名会话',
        createdAt: session.createdAt || session.created_at || new Date().toISOString(),
        messageCount: session.messageCount || session.message_count || 0,
        duration: session.duration,
        ...session
      }));
    } else {
      sessions.value = [];
      console.error('获取会话列表失败: 返回数据不是数组');
    }
  } catch (error: unknown) {
    console.error('获取会话列表失败:', error);
    alert((error as Error).message || '获取会话列表失败，请稍后重试');
    sessions.value = []; // 确保sessions始终是数组
  } finally {
    loading.value = false;
  }
};

// 处理文件选择
const handleFileSelected = (file: File | null) => {
  if (file) {
    console.log('选择的文件:', file.name);
    // 先存储选择的文件信息，稍后上传成功后再补充结果
    if (!uploadedFileInfo.value || uploadedFileInfo.value.file.name !== file.name) {
      uploadedFileInfo.value = { 
        file: file, 
        result: {} as LocalNoteResult 
      };
    }
  } else {
    // 文件被移除
    console.log('文件已移除');
    uploadedFileInfo.value = null;
  }
};

// 处理文件上传成功
const handleUploadSuccess = (result: LocalNoteResult) => {
  selectedSession.value = null;
  console.log('文件上传成功:', result);
  
  try {
    // 确保结果数据结构完整并正确类型化
    const completeResult: LocalNoteResult = {
      ...result,
      note_content: typeof result.note_content === 'string' ? result.note_content : 
                    typeof result.content === 'string' ? result.content : 
                    typeof result.text === 'string' ? result.text : '',
      conversation_summary: typeof result.conversation_summary === 'string' ? result.conversation_summary : 
                           typeof result.summary === 'string' ? result.summary : '',
      note_type: result.note_type || selectedNoteType.value || '未分类笔记',
      generated_at: result.generated_at || new Date().toISOString()
    };
    
    // 存储上传结果到uploadedFileInfo中
    if (uploadedFileInfo.value?.file) {
      uploadedFileInfo.value = { 
        file: uploadedFileInfo.value.file, 
        result: completeResult 
      };
    } else {
      uploadedFileInfo.value = { 
        file: new File([''], 'placeholder.txt'), 
        result: completeResult 
      };
    }
  } catch (error: unknown) {
    console.error('处理上传结果失败:', error);
    alert('处理上传结果失败，请重试');
  }
};

// 处理外部API上传成功（WordUploader组件的特定事件）
const handleUploadToExternalAPI = (result: LocalNoteResult) => {
  console.log('外部API上传成功:', result);
  handleUploadSuccess(result); // 复用现有的成功处理逻辑
};

// 处理文件上传错误
const handleUploadError = (error: string | Error) => {
  // WordUploader组件可能传递string类型的错误
  const errorMessage = typeof error === 'string' ? error : error.message || '未知错误';
  console.error('上传错误:', errorMessage);
  alert(`上传失败: ${errorMessage}`);
  
  // 重置上传状态
  uploadedFileInfo.value = null;
  if (wordUploader.value) {
    try {
      wordUploader.value.removeFile();
    } catch (err) {
      console.error('重置上传组件失败:', err);
    }
  }
};

// 处理会话选择
const handleSessionSelect = (session: SessionOut) => {
  selectedSession.value = session;
};

// 处理笔记类型选择
const handleNoteTypeSelect = async (type: string) => {
  selectedNoteType.value = type;
  
  // 对于上传标签页，不再自动触发上传，让用户手动选择文件后点击按钮
  // 对于会话标签页，保持原有的自动生成逻辑
  if (selectedTab.value === 'session' && selectedSession.value) {
    // 从会话生成笔记
    await generateNoteFromSession(selectedSession.value.id, type);
  }
};

// 从上传的文件生成笔记的逻辑现在直接通过WordUploader组件的uploadToExternalAPI方法处理

// 从会话生成笔记
const generateNoteFromSession = async (sessionId: string, noteType: string) => {
  if (!sessionId || !noteType) {
    console.error('生成笔记失败: 缺少必要参数');
    return;
  }
  
  generatingNote.value = true;
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('未登录，请先登录');
    }
    
    const response = await fetch('/api/notes/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        session_id: sessionId,
        note_type: noteType
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || `生成笔记失败: ${response.status}`);
    }

    const data = await response.json();
    
    // 验证返回数据的有效性
    if (!data || typeof data !== 'object') {
      throw new Error('生成笔记失败: 返回数据格式错误');
    }
    
    // 确保结果数据结构完整并正确类型化
    const completeResult: LocalNoteResult = {
      ...data,
      note_content: data.note_content || data.content || data.text || '',
      conversation_summary: data.conversation_summary || data.summary || '',
      note_type: data.note_type || noteType,
      generated_at: data.generated_at || new Date().toISOString()
    };
    
    // 将生成的笔记结果存储到uploadedFileInfo中，保持显示逻辑一致
    uploadedFileInfo.value = {
      file: new File([], '生成的笔记.docx'),
      result: completeResult
    };
  } catch (error: unknown) {
    console.error('生成笔记错误:', error);
    alert((error as Error).message || '生成笔记失败，请重试');
  } finally {
    generatingNote.value = false;
  }
};

// 获取不带扩展名的文件名
const getFileNameWithoutExtension = (fileName: string): string => {
  if (!fileName || typeof fileName !== 'string') return '未知文件';
  const lastDotIndex = fileName.lastIndexOf('.');
  return lastDotIndex > -1 ? fileName.substring(0, lastDotIndex) : fileName;
};

// 导出笔记
const exportNote = () => {
  try {
    // 如果有上传的文件结果，使用它来导出
    if (uploadedFileInfo.value?.result && uploadedFileInfo.value.file) {
      // 创建一个包含笔记内容的Blob
      const result = uploadedFileInfo.value.result;
      const noteContent = result.note_content || result.content || result.text || '';
      const noteSummary = result.conversation_summary || result.summary || '';
      const noteType = result.note_type || '笔记';
      
      const fullContent = `# ${noteType}\n\n${noteContent}\n\n# 对话摘要\n\n${noteSummary}\n\n生成时间: ${new Date(result.generated_at || Date.now()).toLocaleString()}`;
      const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
      
      // 创建下载链接
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${getFileNameWithoutExtension(uploadedFileInfo.value.file.name)}_${noteType}_${new Date().toISOString().slice(0, 10)}.txt`;
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      
      // 清理
      document.body.removeChild(link);
      // 使用setTimeout确保在DOM操作完成后再清理
      setTimeout(() => {
        URL.revokeObjectURL(link.href);
      }, 100);
    }
  } catch (error: unknown) {
    console.error('导出笔记失败:', error);
    alert('导出笔记失败，请重试');
  }
};

// 清除结果
const clearResult = () => {
  selectedNoteType.value = ''; // 清除笔记类型选择，回到最初状态
  selectedSession.value = null;
  // 重置上传组件
  if (wordUploader.value) {
    // 使用WordUploader组件暴露的removeFile方法
    wordUploader.value.removeFile();
  }
  // 重置状态
  uploadedFileInfo.value = null;
};

// 格式化日期
const formatDate = (dateString?: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('日期格式化错误:', error);
    return '';
  }
}

// 格式化笔记内容，处理Markdown语法
const formatNoteContent = (content: string): string => {
  // 基本的Markdown到HTML转换，确保即使是纯文本也能正确显示
  if (!content || typeof content !== 'string' || content.trim() === '') {
    console.log('无内容可格式化');
    return '<p>暂无笔记内容</p>';
  }
  
  try {
    // 先处理换行符，将原始换行符转换为HTML换行
    let formatted = content.replace(/\n/g, '<br>');
    
    // 处理标题（从大到小）
    formatted = formatted
      .replace(/<br>### (.+?)(?=<br>|$)/g, '<br><h3>$1</h3><br>')
      .replace(/^### (.+?)(?=<br>|$)/g, '<h3>$1</h3><br>')
      .replace(/<br>## (.+?)(?=<br>|$)/g, '<br><h2>$1</h2><br>')
      .replace(/^## (.+?)(?=<br>|$)/g, '<h2>$1</h2><br>')
      .replace(/<br># (.+?)(?=<br>|$)/g, '<br><h1>$1</h1><br>')
      .replace(/^# (.+?)(?=<br>|$)/g, '<h1>$1</h1><br>');
    
    // 处理加粗和斜体（先处理加粗，避免被斜体部分覆盖）
    formatted = formatted
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // 更安全的列表项处理
    // 先识别所有列表块
    formatted = formatted.replace(/((?:<br>)?\-\s+[^<]+(?:<br>\-\s+[^<]+)*)/g, (match) => {
      // 将每个列表项转换为<li>并包装在<ul>中
      const items = match.replace(/(?:<br>)?\-\s+([^<]+)/g, '<li>$1</li>');
      return `<ul>${items}</ul>`;
    });
    
    // 对于没有特殊格式的内容，用段落标签包裹
    // 首先分割内容块（按多个换行符或HTML标签分割）
    const blocks = formatted.split(/(?=<h1>|<h2>|<h3>|<ul>)/);
    formatted = blocks.map(block => {
      // 检查块是否已经有HTML标签
      if (block.match(/^<(h1|h2|h3|ul|li|strong|em)/)) {
        return block;
      }
      // 对于纯文本块，添加段落标签
      return `<p>${block}</p>`;
    }).join('');
    
    console.log('格式化后的内容:', formatted);
    return formatted;
  } catch (error: unknown) {
    console.error('格式化笔记内容失败:', error);
    // 返回带段落标签的原始内容作为后备
    return `<p>${content}</p>`;
  }
};

// 组件挂载时执行
onMounted(() => {
  getNoteTypes();
  fetchSessions();
});
</script>

<style scoped>
.notes-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* 确保tab-content有足够的空间显示上传组件 */
.tab-content {
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  min-height: 400px;
}

/* 上传组件容器样式 */
.upload-container {
  margin-top: 20px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 笔记类型信息样式优化 */
.note-type-info {
  margin-bottom: 20px;
  padding: 12px 16px;
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

/* 更改类型按钮样式 */
.change-type-button {
  background-color: #0ea5e9;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.change-type-button:hover {
  background-color: #0284c7;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e1e4e8;
}

.page-header h1 {
  margin: 0;
  font-size: 28px;
  color: #333;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background-color: #0078d4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
}

.back-button:hover {
  background-color: #005a9e;
}

.back-button .icon {
  font-size: 18px;
}

.notes-container {
  background-color: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.notes-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  border-bottom: 2px solid #e1e4e8;
}

.tab-button {
  padding: 12px 24px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  font-size: 16px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
}

.tab-button.active {
  color: #0078d4;
  border-bottom-color: #0078d4;
}

.tab-button:hover:not(.active) {
  color: #0078d4;
  background-color: #f5f5f5;
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.session-selection {
  margin-bottom: 24px;
}

.session-selection h3 {
  margin-bottom: 16px;
  color: #333;
}

.loading, .empty-message {
  text-align: center;
  padding: 40px;
  color: #666;
}

.session-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.session-item {
  padding: 16px;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.session-item:hover {
  border-color: #0078d4;
  box-shadow: 0 2px 4px rgba(0, 120, 212, 0.1);
}

.session-title {
  font-weight: 500;
  margin-bottom: 8px;
  color: #333;
}

.session-meta {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #666;
}

.note-type-selection {
  margin-bottom: 24px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.note-type-selection h3 {
  margin-bottom: 16px;
  color: #333;
  text-align: center;
}

.note-types {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

/* 笔记类型信息显示样式 */
.note-type-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: #e7f3ff;
  border: 1px solid #b3d9ff;
  border-radius: 6px;
  margin-bottom: 20px;
}

.change-type-button {
  padding: 6px 12px;
  background-color: #0078d4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.change-type-button:hover {
  background-color: #005a9e;
}

.note-type-button {
  padding: 12px 24px;
  background-color: white;
  border: 1px solid #0078d4;
  color: #0078d4;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
}

.note-type-button:hover {
  background-color: #0078d4;
  color: white;
}

.generating-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  gap: 16px;
  text-align: center;
}

.progress-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #0078d4;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.note-result {
  margin-top: 30px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e1e4e8;
}

.result-header h2 {
  margin: 0;
  color: #333;
  font-size: 24px;
}

.result-actions {
  display: flex;
  gap: 12px;
}

.action-button {
  padding: 10px 20px;
  background-color: #0078d4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.action-button:hover {
  background-color: #005a9e;
}

.result-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.content-section {
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.content-section h3 {
  margin-bottom: 16px;
  color: #333;
  font-size: 18px;
}

.note-content {
  line-height: 1.6;
  color: #333;
  white-space: pre-wrap;
  min-height: 200px;
}

.no-content-message {
  color: #999;
  font-style: italic;
  text-align: center;
  padding: 40px 20px;
  background-color: white;
  border-radius: 4px;
  border: 1px dashed #ddd;
  margin-top: 16px;
}

.conversation-summary {
  line-height: 1.6;
  color: #666;
  background-color: white;
  padding: 16px;
  border-radius: 4px;
  border-left: 3px solid #0078d4;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .result-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .result-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .action-button {
    flex: 1;
    margin: 0 4px;
  }
}
</style>