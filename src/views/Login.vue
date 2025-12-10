<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-inner">
        <div class="auth-header">
          <h1>AI来访者培训系统</h1>
          <p>用户登录</p>
        </div>

        <form @submit.prevent="handleLogin" class="auth-form">
          <div class="form-group">
            <label for="username">用户名</label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              required
              placeholder="请输入用户名"
              :disabled="isLoading"
            />
          </div>

          <div class="form-group">
            <label for="password">密码</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              placeholder="请输入密码"
              :disabled="isLoading"
            />
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <button type="submit" class="submit-btn" :disabled="isLoading">
            {{ isLoading ? "登录中..." : "登录" }}
          </button>
        </form>

        <div class="auth-footer">
          <p>还没有账号？<router-link to="/register">立即注册</router-link></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores";

const router = useRouter();
const authStore = useAuthStore();

const form = ref({
  username: "",
  password: "",
});

const isLoading = ref(false);
const error = ref("");

const handleLogin = async () => {
  if (!form.value.username || !form.value.password) {
    error.value = "请输入用户名和密码";
    return;
  }

  isLoading.value = true;
  error.value = "";

  try {
    const success = await authStore.login(form.value.username, form.value.password);

    if (success) {
      router.push("/personal-center");
    } else {
      error.value = "登录失败，用户名或密码错误";
    }
  } catch (_) {
    error.value = "登录失败，请稍后重试";
  } finally {
    isLoading.value = false;
  }
};
</script>

<script lang="ts">
export default {
  name: "AuthLogin",
};
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  padding: 20px;
  position: relative;
}

.auth-card {
  background: #ffffff;
  border-radius: 0;
  box-shadow: none;
  padding: 40px 20px;
  width: 100%;
  position: relative;
  z-index: 1;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
}

.auth-inner {
  max-width: 520px;
  margin: 0 auto;
}

.auth-header {
  text-align: center;
  margin-bottom: 40px;
}

.auth-header h1 {
  color: #333333;
  font-size: 28px;
  margin-bottom: 8px;
  font-weight: 600;
  letter-spacing: -0.5px;
}

.auth-header p {
  color: #666666;
  font-size: 16px;
  font-weight: 400;
}

.auth-form {
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 28px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #555555;
  font-weight: 500;
  font-size: 14px;
}

.form-group input {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 400;
  transition: all 0.3s ease;
  background: #fafafa;
  color: #333333;
}

.form-group input:focus {
  outline: none;
  border-color: #4a90e2;
  background: #ffffff;
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.1);
}

.form-group input::placeholder {
  color: #999999;
  font-weight: 400;
}

.form-group input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.6;
}

.error-message {
  color: #e74c3c;
  font-size: 12px;
  margin-top: 4px;
  font-weight: 400;
  animation: slideIn 0.3s ease;
}

.submit-btn {
  width: 100%;
  padding: 16px 20px;
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.2);
}

.submit-btn:hover {
  background: #357abd;
  box-shadow: 0 6px 16px rgba(74, 144, 226, 0.3);
}

.submit-btn:active {
  background: #2968a3;
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.2);
}

.submit-btn:disabled {
  background: #cccccc;
  cursor: not-allowed;
  box-shadow: none;
  opacity: 0.7;
}

.auth-footer {
  text-align: center;
  color: #666666;
  font-size: 14px;
  font-weight: 400;
  margin-top: 30px;
}

.auth-footer p {
  margin: 0;
}

.auth-footer a {
  color: #4a90e2;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.auth-footer a:hover {
  color: #357abd;
  text-decoration: underline;
}

/* PC端优化 */
@media (min-width: 768px) {
  .auth-card {
    max-width: 480px;
    padding: 60px 50px;
  }

  .auth-header h1 {
    font-size: 32px;
  }

  .auth-header p {
    font-size: 18px;
  }

  .form-group input {
    padding: 16px 18px;
    font-size: 16px;
  }

  .submit-btn {
    padding: 16px 20px;
    font-size: 16px;
  }
}

/* 大屏幕优化 */
@media (min-width: 1200px) {
  .auth-card {
    max-width: 520px;
    padding: 70px 60px;
  }

  .auth-header h1 {
    font-size: 36px;
  }

  .auth-header p {
    font-size: 20px;
  }

  .form-group input {
    padding: 18px 20px;
    font-size: 17px;
  }

  .submit-btn {
    padding: 18px 24px;
    font-size: 17px;
  }
}

/* 使卡片在所有断点下保持全宽 */
@media (min-width: 768px) {
  .auth-card {
    max-width: none !important;
  }
}
@media (min-width: 1200px) {
  .auth-card {
    max-width: none !important;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
