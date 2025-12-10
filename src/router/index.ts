import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Dashboard from '../views/Dashboard.vue'
import Chat from '../views/Chat.vue'
import PersonalCenter from '../views/PersonalCenter.vue'
import ExternalApiView from '../views/ExternalApiView.vue'
import SupervisionPage from '../views/SupervisionPage.vue'
import NotesPage from '../views/NotesPage.vue'
import ExternalApiResult from '../views/ExternalApiResult.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/personal-center',
    name: 'PersonalCenter',
    component: PersonalCenter,
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/external-api',
    name: 'ExternalApi',
    component: ExternalApiView,
    meta: { requiresAuth: true }
  },
  {
    path: '/chat/:sessionId?',
    name: 'Chat',
    component: Chat,
    meta: { requiresAuth: true }
  },
  {
    path: '/supervision',
    name: 'supervision',
    component: SupervisionPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/notes',
    name: 'Notes',
    component: NotesPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/external-api-result',
    name: 'external-api-result',
    component: ExternalApiResult,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const isAuthenticated = !!token;

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else if (isAuthenticated && (to.path === '/login' || to.path === '/register')) {
    // 已登录用户访问登录或注册页面时重定向到个人中心
    next('/personal-center')
  } else {
    next()
  }
})

export default router
