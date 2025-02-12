<template>
  <el-container class="layout-container">
    <el-aside width="240px" class="aside">
      <div class="logo">
        <!-- <el-icon class="logo-icon" :size="24"><Monitor /></el-icon> -->
        <img src="/icon.jpg" alt="logo" class="logo-icon" style="width: 40px; height: 40px; border-radius: 50%;">
        <span class="logo-text">LIN BOT</span>
      </div>
      <el-menu
        default-active="dashboard"
        class="el-menu-vertical"
        :router="true"
      >
        <el-menu-item index="dashboard" class="menu-item">
          <el-icon><DataBoard /></el-icon>
          <span>机器人状态</span>
        </el-menu-item>
        <el-menu-item index="plugins" class="menu-item">
          <el-icon><Connection /></el-icon>
          <span>插件管理</span>
        </el-menu-item>
        <el-menu-item index="ai-settings" class="menu-item">
          <el-icon><ChatLineRound /></el-icon>
          <span>AI 设置</span>
        </el-menu-item>
        <el-menu-item index="friends" class="menu-item">
          <el-icon><User /></el-icon>
          <span>好友列表</span>
        </el-menu-item>
        <el-menu-item index="groups" class="menu-item">
          <el-icon><ChatRound /></el-icon>
          <span>群聊列表</span>
        </el-menu-item>
        <el-menu-item index="settings" class="menu-item">
          <el-icon><Setting /></el-icon>
          <span>系统设置</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-content">
          <h1 class="title">QQ机器人管理系统</h1>
        </div>
      </el-header>
      <el-main class="main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
      <el-footer class="footer">
        <div class="footer-content">
          <p>© 2025 LIN BOT. All rights reserved.</p>
        </div>
      </el-footer>
    </el-container>
  </el-container>
</template>

<script setup>
import { Connection, Setting, Monitor, User, ChatRound, DataBoard, ChatLineRound } from '@element-plus/icons-vue'
import { onMounted } from 'vue'
import { getSettings } from '@/api'

// 应用背景设置
const applyBackground = (background) => {
  const app = document.querySelector('#app')
  
  // 移除现有背景
  app.style.backgroundImage = ''
  app.style.backgroundColor = ''
  
  if (background.type === 'default') {
    app.style.backgroundColor = 'var(--app-bg)'
  } else if (background.type === 'image') {
    app.style.backgroundImage = `url(${background.url})`
    app.style.backgroundSize = 'cover'
    app.style.backgroundPosition = 'center'
    app.style.backgroundRepeat = 'no-repeat'
  } else if (background.type === 'video') {
    // 如果已存在视频，先移除
    const existingVideo = document.querySelector('.background-video')
    if (existingVideo) {
      existingVideo.remove()
    }
    
    if (background.url) {
      const video = document.createElement('video')
      video.className = 'background-video'
      video.src = background.url
      video.autoplay = true
      video.loop = true
      video.muted = true
      video.style.position = 'fixed'
      video.style.top = '0'
      video.style.left = '0'
      video.style.width = '100%'
      video.style.height = '100%'
      video.style.objectFit = 'cover'
      video.style.zIndex = '-1'
      document.body.appendChild(video)
    }
  }
}

// 加载设置
const loadSettings = async () => {
  try {
    const response = await getSettings()
    if (response.data.background) {
      applyBackground(response.data.background)
    }
  } catch (error) {
    console.error('加载背景设置失败:', error)
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.layout-container {
  height: 98vh;
  background: var(--app-bg);
}

.aside {
  background: rgba(255, 255, 255, 0.5);
  box-shadow: 4px 0 16px rgba(0, 0, 0, 0.06);
  border-radius: 0 24px 24px 0;
  margin: 16px 0 16px 16px;
  padding: 16px 0;
  backdrop-filter: blur(0px);
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 24px;
  margin-bottom: 16px;
}

.logo-icon {
  color: var(--app-primary);
  margin-right: 12px;
}

.logo-text {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
}

.header {
  background: transparent;
  padding: 16px 24px;
  height: auto !important;
}

.title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
}

.main {
  margin-left: 24px;
  margin-bottom: 18px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 16px;
  backdrop-filter: blur(0px);
}

.el-menu {
  border: none;
  padding: 0 8px;
  background: transparent !important;
}

.menu-item {
  font-size: 15px;
  height: 48px !important;
  line-height: 48px !important;
  background: transparent !important;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 全局背景样式 */
#app {
  min-height: 100vh;
  transition: background-image 0.3s ease;
  background-color: var(--app-bg);
}

.background-video {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
}

/* 确保内容在背景之上 */
.layout-container {
  position: relative;
  z-index: 1;
  background: transparent;
}

/* 菜单项悬停效果 */
:deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.3) !important;
}

/* 选中的菜单项 */
:deep(.el-menu-item.is-active) {
  background: rgba(255, 255, 255, 0.5) !important;
}

.footer-content{
  text-align: center;
}
</style>