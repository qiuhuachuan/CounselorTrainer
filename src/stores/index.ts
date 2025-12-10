import { defineStore } from "pinia";
import { ref } from "vue";

// 来访者类型映射表，与Dashboard.vue中的clientTypes保持一致
const clientTypeMap = {
  "1": "亲密关系-来访者：林女士",
  焦虑型来访者: "焦虑型来访者",
  抑郁型来访者: "抑郁型来访者",
  愤怒型来访者: "愤怒型来访者",
  依赖型来访者: "依赖型来访者",
};

// 根据clientType获取完整的来访者名称
const getClientTypeName = (clientType: string): string => {
  return clientTypeMap[clientType as keyof typeof clientTypeMap] || clientType;
};

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface ChatSession {
  id: string;
  title: string;
  clientType: string;
  createdAt: string;
  lastMessageAt: string;
  messageCount: number;
}

export interface Message {
  id: string;
  content: string;
  sender: "user" | "client";
  timestamp: string;
  round: number;
}

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem("token"));

  const login = async (username: string, password: string) => {
    // 模拟登录API
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      const data = await response.json();
      user.value = data.user;
      token.value = data.token;
      localStorage.setItem("token", data.token);
      return true;
    }
    return false;
  };

  const register = async (username: string, email: string, password: string) => {
    // 模拟注册API
    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, password }),
    });

    if (response.ok) {
      const data = await response.json();
      user.value = data.user;
      token.value = data.token;
      localStorage.setItem("token", data.token);
      return true;
    }
    return false;
  };

  const logout = () => {
    user.value = null;
    token.value = null;
    localStorage.removeItem("token");
  };

  return {
    user,
    token,
    login,
    register,
    logout,
  };
});

export const useChatStore = defineStore("chat", () => {
  const sessions = ref<ChatSession[]>([]);
  const currentSession = ref<ChatSession | null>(null);
  const messages = ref<Message[]>([]);
  const isLoading = ref(false);
  const currentRound = ref(1);
  const elapsedTime = ref(0);
  const timerInterval = ref<number | null>(null);

  const createSession = async (clientType: string) => {
    try {
      // 获取完整的来访者名称
      const clientTypeName = getClientTypeName(clientType);

      // 调用后端API创建会话
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ clientType }),
      });

      if (!response.ok) {
        throw new Error("创建会话失败");
      }

      const newSession = await response.json();
      // 更新会话标题为友好的显示名称
      newSession.title = `与${clientTypeName}的对话`;

      sessions.value.unshift(newSession);
      currentSession.value = newSession;
      messages.value = [];
      currentRound.value = 1;
      return newSession;
    } catch (error) {
      console.error("创建会话时出错:", error);
      // 降级处理：如果API调用失败，创建本地会话
      const clientTypeName = getClientTypeName(clientType);
      const fallbackSession: ChatSession = {
        id: Date.now().toString(),
        title: `与${clientTypeName}的对话`,
        clientType,
        createdAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
        messageCount: 0,
      };

      sessions.value.unshift(fallbackSession);
      currentSession.value = fallbackSession;
      messages.value = [];
      currentRound.value = 1;
      return fallbackSession;
    }
  };

  const loadSession = async (sessionId: string) => {
    try {
      // 查找本地会话
      const session = sessions.value.find((s) => s.id === sessionId);
      if (session) {
        // 更新会话标题为友好的显示名称
        session.title = `与${getClientTypeName(session.clientType)}的对话`;
        currentSession.value = session;

        // 调用后端API加载消息历史
        const response = await fetch(`/api/sessions/${sessionId}/messages`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.ok) {
          messages.value = await response.json();
          // 根据加载的消息历史计算当前轮次
          if (messages.value.length > 0) {
            // 找出最大的轮数
            const maxRound = Math.max(...messages.value.map((msg) => msg.round));
            // 当前轮次应该是最大轮数 + 1，因为下一条消息将属于新的一轮
            currentRound.value = maxRound + 1;
          } else {
            // 如果没有消息，当前轮次为1
            currentRound.value = 1;
          }
        } else {
          // 降级处理：使用默认消息
          messages.value = [
            {
              id: "1",
              content: "您好，我是您的AI来访者，有什么可以帮助您的吗？",
              sender: "client",
              timestamp: new Date().toISOString(),
              round: 1,
            },
          ];
          // 降级处理时，当前轮次为2，因为默认消息是第1轮
          currentRound.value = 2;
        }
      }
    } catch (error) {
      console.error("加载会话时出错:", error);
      // 降级处理
      const session = sessions.value.find((s) => s.id === sessionId);
      if (session) {
        // 更新会话标题为友好的显示名称
        session.title = `与${getClientTypeName(session.clientType)}的对话`;
        currentSession.value = session;
        messages.value = [
          {
            id: "1",
            content: "您好，我是您的AI来访者，有什么可以帮助您的吗？",
            sender: "client",
            timestamp: new Date().toISOString(),
            round: 1,
          },
        ];
        // 降级处理时，当前轮次为2，因为默认消息是第1轮
        currentRound.value = 2;
      }
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch("/api/sessions", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const fetchedSessions = await response.json();
        // 更新所有会话的标题为友好的显示名称
        fetchedSessions.forEach((session: ChatSession) => {
          session.title = `与${getClientTypeName(session.clientType)}的对话`;
        });
        sessions.value = fetchedSessions;
      } else {
        console.error("获取会话列表失败");
      }
    } catch (error) {
      console.error("获取会话列表时出错:", error);
    }
  };

  const sendMessage = async (content: string) => {
    if (!currentSession.value) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: "user",
      timestamp: new Date().toISOString(),
      round: currentRound.value,
    };

    messages.value.push(userMessage);
    console.log(messages.value);
    isLoading.value = true;

    try {
      // 准备完整的对话历史，包括刚刚添加的用户消息
      const conversation = messages.value.map((msg) => ({
        role: msg.sender === "user" ? "user" : "client",
        content: msg.content,
      }));

      // 调用后端API发送消息，同时传递clientType和完整对话历史
      const response = await fetch(`/api/sessions/${currentSession.value.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          content,
          clientType: currentSession.value.clientType, // 将profile的key发送给后端
          conversation, // 发送完整对话历史
        }),
      });

      if (!response.ok) {
        throw new Error("发送消息失败");
      }

      // 从后端获取AI的回复
      const aiResponse = await response.json();
      const clientMessage: Message = {
        id: aiResponse.id,
        content: aiResponse.content,
        sender: "client",
        timestamp: aiResponse.timestamp,
        round: aiResponse.round,
      };

      messages.value.push(clientMessage);
      // 使用后端返回的轮数作为当前轮数，并增加1为下一轮对话做准备
      currentRound.value = aiResponse.round + 1;

      // 更新会话信息
      if (currentSession.value) {
        currentSession.value.messageCount = messages.value.length;
        currentSession.value.lastMessageAt = new Date().toISOString();
      }
    } catch (error) {
      console.error("发送消息时出错:", error);
      // 降级处理：如果API调用失败，使用模拟回复
      // 保持当前轮数作为消息轮数
      const messageRound = currentRound.value;
      // 增加轮数计数为下一轮准备
      currentRound.value++;

      const clientMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "很抱歉，我暂时无法连接到服务器。让我尝试回答您的问题...",
        sender: "client",
        timestamp: new Date().toISOString(),
        round: messageRound, // 使用当前轮数
      };
      messages.value.push(clientMessage);
    } finally {
      isLoading.value = false;
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      // 调用后端API删除会话
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("删除会话失败");
      }

      // 从本地状态中移除会话
      const index = sessions.value.findIndex((s) => s.id === sessionId);
      if (index !== -1) {
        sessions.value.splice(index, 1);
      }

      // 如果删除的是当前会话，加载第一个可用会话
      if (currentSession.value && currentSession.value.id === sessionId) {
        if (sessions.value.length > 0) {
          const firstSession = sessions.value[0];
          if (firstSession) {
            currentSession.value = firstSession;
            await loadSession(firstSession.id);
          }
        } else {
          currentSession.value = null;
          messages.value = [];
        }
      }
    } catch (error) {
      console.error("删除会话时出错:", error);
      // 降级处理：仅从本地状态移除
      const index = sessions.value.findIndex((s) => s.id === sessionId);
      if (index !== -1) {
        sessions.value.splice(index, 1);
      }

      if (currentSession.value && currentSession.value.id === sessionId) {
        if (sessions.value.length > 0) {
          const firstSession = sessions.value[0];
          if (firstSession) {
            currentSession.value = firstSession;
            await loadSession(firstSession.id);
          }
        } else {
          currentSession.value = null;
          messages.value = [];
        }
      }
    }
  };

  const startTimer = () => {
    if (timerInterval.value) clearInterval(timerInterval.value);
    elapsedTime.value = 0;
    timerInterval.value = setInterval(() => {
      elapsedTime.value++;
    }, 1000);
  };

  const stopTimer = () => {
    if (timerInterval.value) {
      clearInterval(timerInterval.value);
      timerInterval.value = null;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return {
    sessions,
    currentSession,
    messages,
    isLoading,
    currentRound,
    elapsedTime,
    createSession,
    loadSession,
    sendMessage,
    startTimer,
    stopTimer,
    formatTime,
    fetchSessions,
    deleteSession,
  };
});
