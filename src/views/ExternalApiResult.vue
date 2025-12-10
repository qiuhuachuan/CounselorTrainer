<template>
  <div class="external-api-result">
    <div class="header">
      <h1>外部API解析结果</h1>
      <div class="header-actions">
    <button class="mock-button" @click="mockExampleData">加载示例数据</button>
    <button v-if="result" class="export-button" @click="exportResult">导出结果</button>
    <button class="back-button" @click="goBack">返回</button>
  </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <p class="error-message">{{ error }}</p>
      <button class="retry-button" @click="loadResultData">重试</button>
    </div>
    
    <!-- 结果展示 -->
    <div v-else-if="result" class="result-container">
      <div class="meta-info">
        <p><strong>索引ID:</strong> {{ result.idx }}</p>
        <p><strong>对话轮数:</strong> {{ result.dialogue.length }}</p>
      </div>
      
      <div class="dialogue-container">
        <h2>对话内容</h2>
        <div class="dialogue-list">
          <div 
            v-for="(turn, index) in result.dialogue" 
            :key="index" 
            :class="['dialogue-turn', turn.role]">
            <div class="dialogue-header">
              <span class="turn-number">第 {{ index + 1 }} 轮</span>
              <span class="role">{{ turn.role === 'assistant' ? '咨询师' : '来访者' }}</span>
            </div>
            <div class="dialogue-content">
              {{ turn.content }}
            </div>
            <div v-if="turn.annotation && turn.annotation.length > 0" class="annotations">
              <div class="annotations-header">
                <h4>标注信息</h4>
                <span class="annotations-count">{{ turn.annotation.length }} 项</span>
              </div>
              <div class="annotations-list">
                <div 
                  v-for="(annotation, annotIndex) in turn.annotation" 
                  :key="annotIndex"
                  class="annotation-item"
                  :class="getLabelClass(annotation.label)"
                  @click="toggleHighlight(annotIndex)">
                  <div class="annotation-header">
                    <span class="annotation-index">{{ annotIndex + 1 }}</span>
                    <span class="label">{{ annotation.label }}</span>
                    <span class="annotation-action">点击查看详情</span>
                  </div>
                  <div 
                    class="annotated-text"
                    :class="{ 'highlighted': highlightedAnnotations[`${index}-${annotIndex}`] }">
                    {{ annotation.sentence }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 无数据状态 -->
    <div v-else class="no-result">
      <p>暂无解析结果</p>
      <button class="back-to-upload" @click="goBack">返回上传</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const result = ref<ExternalApiResultType | null>(null);
const loading = ref<boolean>(true);
const error = ref<string>('');
// 用于跟踪高亮状态
const highlightedAnnotations = reactive<Record<string, boolean>>({});

// 定义结果数据的类型
interface Annotation {
  sentence: string;
  label: string;
}

interface DialogueTurn {
  role: 'assistant' | 'user';
  content: string;
  annotation: Annotation[];
}

interface ExternalApiResultType {
  idx: number;
  dialogue: DialogueTurn[];
}

// 清理localStorage中的结果数据 - 保留但稍后在goBack中使用
// const cleanupResult = () => {
//   try {
//     localStorage.removeItem('externalApiResult');
//   } catch (err) {
//     console.error('清理localStorage时出错:', err);
//   }
// };

// 处理数据加载
const loadResultData = (): void => {
  try {
    loading.value = true;
    error.value = '';
    
    // 1. 尝试从路由参数中获取数据
    if (route.params.result) {
      try {
        const resultData = JSON.parse(decodeURIComponent(route.params.result as string));
        if (validateResultData(resultData)) {
          result.value = resultData;
          return;
        }
      } catch (parseError) {
        console.warn('从路由参数解析数据失败，尝试从localStorage获取');
      }
    }
    
    // 2. 如果路由参数中没有，尝试从localStorage获取
    const savedResult = localStorage.getItem('externalApiResult');
    if (savedResult) {
      try {
        const parsedResult: ExternalApiResultType = JSON.parse(savedResult);
        if (validateResultData(parsedResult)) {
          result.value = parsedResult;
          return;
        }
      } catch (parseError) {
        console.error('从localStorage解析数据失败:', parseError);
        error.value = '解析结果数据时出错';
      }
    }
    
    // 3. 如果都没有找到数据，显示错误
    error.value = '未找到解析结果数据';
  } catch (err) {
    console.error('加载结果数据时出错:', err);
    error.value = '加载数据时发生错误';
  } finally {
    loading.value = false;
  }
};

// 验证结果数据的完整性
const validateResultData = (data: unknown): data is ExternalApiResultType => {
  if (!data || typeof data !== 'object') return false;
  
  const typedData = data as Record<string, unknown>;
  if (!('idx' in typedData) || !('dialogue' in typedData)) return false;
  
  if (!Array.isArray(typedData.dialogue)) return false;
  
  // 验证dialogue数组中的每个元素
  return typedData.dialogue.every((turn: unknown) => {
    if (!turn || typeof turn !== 'object') return false;
    
    const typedTurn = turn as Record<string, unknown>;
    return typeof typedTurn.role === 'string' &&
           ['assistant', 'user'].includes(typedTurn.role as string) &&
           typeof typedTurn.content === 'string';
  });
};

onMounted(() => {
  loadResultData();
});

// 处理路由参数或localStorage中的数据
const processResultData = (): boolean => {
  try {
    // 从localStorage获取数据
    const localStorageData = localStorage.getItem('tempResultData');
    if (localStorageData) {
      const parsedData = JSON.parse(localStorageData);
      if (validateResultData(parsedData)) {
        result.value = parsedData;
        return true;
      }
    }
  } catch (err) {
    console.error('处理结果数据时出错:', err);
  }
  return false;
};

const goBack = (): void => {
  // 返回到督导页面
  router.push('/supervision');
};

// 模拟示例数据，用于测试展示效果
const mockExampleData = (): void => {
  loading.value = true;
  error.value = '';
  
  // 示例数据
  const exampleData: ExternalApiResultType = {
    idx: 61,
    dialogue: [
      {
        role: "assistant",
        content: "你好，我知道初次来到这里可能会有些紧张，在这里，我们的对话是完全保密的，你可以放心分享一切，无论你想分享什么，都没有对错",
        annotation: [
          {
            sentence: "你好，我知道初次来到这里可能会有些紧张，在这里，我们的对话是完全保密的，你可以放心分享一切，无论你想分享什么，都没有对错",
            label: "Affirmation and Reassurance"
          }
        ]
      },
      {
        role: "user",
        content: "谢谢你，确实...嗯，说不紧张是假的，毕竟这是我第一次来心理咨询，之前其实我考虑了很久要不要来，分析了很多关于心理咨询的信息，也想过可能会遇到什么情况，但现在真的坐在这里，还是感觉有点...不太确定该怎么开始，或者说，不太确定该从哪个角度来描述我遇到的问题。",
        annotation: [
          {
            sentence: "谢谢你，确实...嗯，说不紧张是假的，毕竟这是我第一次来心理咨询，之前其实我考虑了很久要不要来，分析了很多关于心理咨询的信息，也想过可能会遇到什么情况，但现在真的坐在这里，还是感觉有点...不太确定该怎么开始，或者说，不太确定该从哪个角度来描述我遇到的问题。",
            label: "Confirming"
          }
        ]
      },
      {
        role: "assistant",
        content: "那是什么让您决定现在寻求帮助的呢？能具体描述困扰您的问题吗？",
        annotation: [
          {
            sentence: "那是什么让您决定现在寻求帮助的呢？",
            label: "Inquiring Subjective Information"
          },
          {
            sentence: "能具体描述困扰您的问题吗？",
            label: "Inquiring Subjective Information"
          }
        ]
      },
      {
        role: "user",
        content: "其实是三周前的一个周末，三件事情同时压过来——我女友很明确地跟我说希望年底前订婚，公司又给我安排了一个需要我独立决策的新项目，然后我爸妈也在视频通话里问我们买房的进展，这三重压力叠加起来，我那个周末整夜失眠、胸闷气短，完全无法集中注意力，我意识到我这种什么事都要反复分析、收集无数信息却永远做不出决定的状态，已经严重影响到我的生活质量和重要关系了。",
        annotation: [
          {
            sentence: "其实是三周前的一个周末，三件事情同时压过来——我女友很明确地跟我说希望年底前订婚，公司又给我安排了一个需要我独立决策的新项目，然后我爸妈也在视频通话里问我们买房的进展，这三重压力叠加起来，我那个周末整夜失眠、胸闷气短，完全无法集中注意力，我意识到我这种什么事都要反复分析、收集无数信息却永远做不出决定的状态，已经严重影响到我的生活质量和重要关系了。",
            label: "Giving Information"
          }
        ]
      },
      {
        role: "assistant",
        content: "嗯嗯，我很能理解你的感受，三件事情的同时发生让你喘不过气，但值得夸赞的一点是你能够意识到自己身体和心理的问题，并且尝试寻找解决办法。我们先一起来聊一聊第一件事情怎么样？女友很明确的表示希望可以年底完成订婚，是什么原因让你感到有所压力的呢？因为工作太忙没有精力，还是因为金钱压力？您可以说一说吗",
        annotation: [
          {
            sentence: "嗯嗯，我很能理解你的感受，三件事情的同时发生让你喘不过气，但值得夸赞的一点是你能够意识到自己身体和心理的问题，并且尝试寻找解决办法。",
            label: "Affirmation and Reassurance"
          },
          {
            sentence: "我们先一起来聊一聊第一件事情怎么样？",
            label: "Invite to Explore New Actions"
          },
          {
            sentence: "女友很明确的表示希望可以年底完成订婚，是什么原因让你感到有所压力的呢？",
            label: "Inquiring Subjective Information"
          },
          {
            sentence: "因为工作太忙没有精力，还是因为金钱压力？",
            label: "Inquiring Subjective Information"
          },
          {
            sentence: "您可以说一说吗",
            label: "Inquiring Subjective Information"
          }
        ]
      },
      {
        role: "user",
        content: "其实不是工作忙或者金钱的问题，我们的经济条件都还可以，主要是...怎么说呢，每次我们讨论订婚或者婚礼的具体安排时，我就会不由自主地开始分析各种因素——比如什么时候举办最合适、要考虑双方父母的期望、现在的经济环境是否适合、我的职业发展阶段是否合适转换身份等等，原本30分钟能聊完的话题，我能分析三个小时却得不出任何结论，我知道她开始对我这种模式感到疲惫和担心。",
        annotation: [
          {
            sentence: "其实不是工作忙或者金钱的问题，我们的经济条件都还可以，主要是...怎么说呢，每次我们讨论订婚或者婚礼的具体安排时，我就会不由自主地开始分析各种因素——比如什么时候举办最合适、要考虑双方父母的期望、现在的经济环境是否适合、我的职业发展阶段是否合适转换身份等等，原本30分钟能聊完的话题，我能分析三个小时却得不出任何结论，我知道她开始对我这种模式感到疲惫和担心。",
            label: "Giving Information"
          }
        ]
      }
    ]
  };
  
  // 模拟加载延迟
  setTimeout(() => {
    // 验证数据格式
    if (validateResultData(exampleData)) {
      result.value = exampleData;
      // 保存到localStorage，便于演示完整流程
      localStorage.setItem('tempResultData', JSON.stringify(exampleData));
    } else {
      error.value = '示例数据格式验证失败';
    }
    loading.value = false;
  }, 500);
};

// 根据标签内容返回不同的CSS类
const getLabelClass = (label: string): string => {
  const labelLower = label.toLowerCase();
  if (labelLower.includes('affirmation') || labelLower.includes('reassurance')) {
    return 'label-support';
  } else if (labelLower.includes('inquire')) {
    return 'label-inquiry';
  } else if (labelLower.includes('give')) {
    return 'label-information';
  } else if (labelLower.includes('confirm')) {
    return 'label-confirmation';
  } else if (labelLower.includes('invite')) {
    return 'label-invitation';
  }
  return 'label-default';
};

// 切换标注项的高亮状态
const toggleHighlight = (annotIndex: number): void => {
  // 获取当前对话轮次索引
  const turnIndex = result.value?.dialogue.findIndex(turn => {
    return turn.annotation && turn.annotation[annotIndex] !== undefined;
  }) || 0;
  
  const key = `${turnIndex}-${annotIndex}`;
  highlightedAnnotations[key] = !highlightedAnnotations[key];
};

// 导出结果功能
const exportResult = (): void => {
  if (!result.value) return;
  
  try {
    // 创建JSON字符串
    const jsonStr = JSON.stringify(result.value, null, 2);
    
    // 创建Blob对象
    const blob = new Blob([jsonStr], { type: 'application/json' });
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api_result_${Date.now()}.json`;
    
    // 触发下载
    document.body.appendChild(a);
    a.click();
    
    // 清理
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('导出结果失败:', err);
    error.value = '导出结果时发生错误';
  }
};
</script>

<style scoped>
.external-api-result {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header h1 {
  color: #333;
  font-size: 24px;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.mock-button,
.export-button,
.back-button {
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  min-width: 100px;
}

.mock-button {
  background-color: #17a2b8;
  color: white;
}

.mock-button:hover {
  background-color: #138496;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.export-button {
  background-color: #28a745;
  color: white;
}

.export-button:hover:not(:disabled) {
  background-color: #218838;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.export-button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.back-button {
  background-color: #6c757d;
  color: white;
}

.back-button:hover {
  background-color: #5a6268;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* 响应式优化 */
@media (max-width: 768px) {
  .header-actions {
    justify-content: center;
  }
  
  .mock-button,
  .export-button,
  .back-button {
    min-width: 120px;
    padding: 10px 16px;
  }
}

.result-container {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
}

.meta-info {
  margin-bottom: 20px;
  padding: 15px;
  background-color: white;
  border-radius: 6px;
  border-left: 4px solid #007bff;
}

.meta-info p {
  margin: 0;
  color: #666;
}

.dialogue-container h2 {
  color: #333;
  margin-bottom: 20px;
  font-size: 20px;
}

.dialogue-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dialogue-turn {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dialogue-turn.assistant {
  border-left: 4px solid #007bff;
}

.dialogue-turn.user {
  border-left: 4px solid #28a745;
}

.dialogue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.turn-number {
  color: #666;
  font-size: 12px;
  background-color: #f8f9fa;
  padding: 2px 8px;
  border-radius: 12px;
}

.role {
  font-weight: bold;
  color: white;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 14px;
}

.dialogue-turn.assistant .role {
  background-color: #007bff;
}

.dialogue-turn.user .role {
  background-color: #28a745;
}

.dialogue-content {
  line-height: 1.6;
  color: #333;
  margin-bottom: 15px;
  white-space: pre-wrap;
  word-break: break-word;
}

.annotations {  
  margin-top: 20px;  
  padding: 20px;  
  background-color: #f8f9fa;  
  border-radius: 8px;  
  border: 1px solid #e9ecef;
}

.annotations-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #dee2e6;
}

.annotations h4 {  
  margin: 0;  
  color: #495057;  
  font-size: 16px;  
  font-weight: 600;
}

.annotations-count {
  background-color: #6c757d;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.annotations-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.annotation-item {
  background-color: white;
  border-radius: 6px;
  padding: 15px;
  border-left: 4px solid #17a2b8;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.annotation-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.annotation-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.annotation-index {
  background-color: #e9ecef;
  color: #495057;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.label {
  display: inline-flex;
  align-items: center;
  background-color: #17a2b8;
  color: white;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.annotation-action {
  font-size: 11px;
  color: #6c757d;
  margin-left: auto;
  opacity: 0.7;
}

.annotated-text {
  margin: 8px 0 0 0;
  padding: 12px;
  font-size: 14px;
  line-height: 1.6;
  color: #495057;
  background-color: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid #adb5bd;
  transition: all 0.3s ease;
  max-height: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.annotated-text.highlighted {
  max-height: none;
  background-color: #e3f2fd;
  border-left-color: #2196f3;
  padding: 15px;
  font-size: 15px;
}

/* 不同类型标签的颜色 */
.annotation-item.label-support .label {
  background-color: #28a745;
}

.annotation-item.label-inquiry .label {
  background-color: #007bff;
}

.annotation-item.label-information .label {
  background-color: #ffc107;
  color: #212529;
}

.annotation-item.label-confirmation .label {
  background-color: #17a2b8;
}

.annotation-item.label-invitation .label {
  background-color: #6610f2;
}

.annotation-item.label-default .label {
  background-color: #6c757d;
}

/* 相应的左边框颜色 */
.annotation-item.label-support {
  border-left-color: #28a745;
}

.annotation-item.label-inquiry {
  border-left-color: #007bff;
}

.annotation-item.label-information {
  border-left-color: #ffc107;
}

.annotation-item.label-confirmation {
  border-left-color: #17a2b8;
}

.annotation-item.label-invitation {
  border-left-color: #6610f2;
}

/* 响应式优化 */
@media (max-width: 768px) {
  .annotation-header {
    flex-wrap: wrap;
  }
  
  .annotation-action {
    margin-left: 0;
    order: 3;
  }
  
  .annotated-text {
    font-size: 13px;
  }
}

.loading-container {
  text-align: center;
  padding: 80px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container {
  text-align: center;
  padding: 60px 20px;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  color: #721c24;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.error-message {
  margin-bottom: 20px;
  font-size: 16px;
}

.retry-button {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.retry-button:hover {
  background-color: #c82333;
}

.no-result {
  text-align: center;
  padding: 60px 20px;
  color: #666;
  font-size: 16px;
}

.back-to-upload {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-top: 20px;
  transition: background-color 0.3s;
}

.back-to-upload:hover {
  background-color: #0056b3;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .dialogue-turn {
    padding: 15px;
  }
  
  .external-api-result {
    padding: 15px;
  }
}
</style>