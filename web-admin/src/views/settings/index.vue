<template>
  <div class="settings-container">
    <!-- 顶部工具栏 -->
    <div class="settings-toolbar">
      <div class="toolbar-left">
        <h2 class="page-title">系统设置</h2>
        <el-tag type="success" size="small">基础配置</el-tag>
      </div>
      <div class="toolbar-right">
        <el-button 
          type="primary" 
          @click="saveSystemSettings" 
          :loading="saving"
        >
          <el-icon><Check /></el-icon>
          保存设置
        </el-button>
      </div>
    </div>

    <!-- 设置内容区 -->
    <div class="settings-scroll">
      <div class="settings-content">
        <el-form :model="settings" label-position="top">
          <!-- WebSocket 设置 -->
          <div class="setting-section">
            <div class="section-header">
              <el-icon><Connection /></el-icon>
              <h3>连接设置</h3>
            </div>
            <el-form-item label="WebSocket 地址">
              <el-input 
                v-model="settings.wsUrl" 
                placeholder="ws://localhost:8082"
              >
                <template #prefix>
                  <el-icon><Link /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item label="心跳间隔">
              <el-input-number 
                v-model="settings.heartbeat" 
                :min="1000" 
                :step="1000"
                style="width: 100%"
              />
              <div class="form-tip">单位：毫秒（ms），建议值：3000</div>
            </el-form-item>
          </div>

          <!-- 背景设置 -->
          <div class="setting-section">
            <div class="section-header">
              <el-icon><Picture /></el-icon>
              <h3>背景设置</h3>
            </div>
            <el-form-item label="背景类型">
              <el-select 
                v-model="settings.background.type" 
                style="width: 100%"
              >
                <el-option label="默认" value="default" />
                <el-option label="图片" value="image" />
                <el-option label="视频" value="video" />
              </el-select>
            </el-form-item>

            <template v-if="settings.background.type !== 'default'">
              <el-form-item :label="`${settings.background.type === 'image' ? '图片' : '视频'} URL`">
                <el-input
                  v-model="settings.background.url"
                  :placeholder="settings.background.type === 'image' ? '请输入图片URL' : '请输入视频URL'"
                >
                  <template #append>
                    <el-button @click="previewBackground">预览</el-button>
                  </template>
                </el-input>
              </el-form-item>
            </template>
          </div>

          <!-- 预览区域 -->
          <div v-if="showPreview" class="preview-section">
            <div class="preview-header">
              <h3>背景预览</h3>
              <el-button type="text" @click="showPreview = false">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
            <div class="preview-content">
              <img 
                v-if="settings.background.type === 'image'" 
                :src="settings.background.url"
                @error="handlePreviewError"
              >
              <video 
                v-else-if="settings.background.type === 'video'"
                :src="settings.background.url"
                controls
                @error="handlePreviewError"
              />
            </div>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getSettings, saveSettings } from '@/api/index'
import { 
  Check, Connection, Link, Picture, 
  Close 
} from '@element-plus/icons-vue'

const settings = ref({
  wsUrl: '',
  heartbeat: 3000,
  background: {
    type: 'default',
    url: ''
  }
})

const showPreview = ref(false)
const saving = ref(false)

// 获取设置
const loadSettings = async () => {
  try {
    const response = await getSettings()
    settings.value = response.data
    applyBackground()
  } catch (error) {
    ElMessage.error('获取设置失败')
  }
}

// 保存设置
const saveSystemSettings = async () => {
  saving.value = true
  try {
    await saveSettings(settings.value)
    applyBackground()
    ElMessage.success('设置保存成功')
  } catch (error) {
    ElMessage.error('保存设置失败')
  } finally {
    saving.value = false
  }
}

// 预览背景
const previewBackground = () => {
  if (!settings.value.background.url) {
    ElMessage.warning('请先输入URL')
    return
  }
  showPreview.value = true
}

// 处理预览错误
const handlePreviewError = () => {
  ElMessage.error('预览失败，请检查URL是否有效')
}

// 应用背景
const applyBackground = () => {
  const { type, url } = settings.value.background
  const app = document.querySelector('#app')
  
  app.style.backgroundImage = ''
  app.style.backgroundColor = ''
  
  if (type === 'default') {
    app.style.backgroundColor = 'var(--app-bg)'
  } else if (type === 'image') {
    app.style.backgroundImage = `url(${url})`
    app.style.backgroundSize = 'cover'
    app.style.backgroundPosition = 'center'
    app.style.backgroundRepeat = 'no-repeat'
  } else if (type === 'video') {
    const existingVideo = document.querySelector('.background-video')
    if (existingVideo) {
      existingVideo.remove()
    }
    
    if (url) {
      const video = document.createElement('video')
      video.className = 'background-video'
      video.src = url
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

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.settings-container {
  height: 670px;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-page);
  padding: 24px 24px 0;
  border-radius: 10px;
}

.settings-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background: var(--el-bg-color-page);
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.settings-scroll {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 24px;
  margin-right: -8px;
  padding-right: 8px;
}

.settings-content {
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 24px;
  box-shadow: var(--el-box-shadow-light);
}

.setting-section {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.setting-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.section-header .el-icon {
  font-size: 18px;
  color: var(--el-color-primary);
}

.form-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.preview-section {
  background: var(--el-fill-color-light);
  border-radius: 8px;
  overflow: hidden;
  margin-top: 24px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--el-fill-color);
  border-bottom: 1px solid var(--el-border-color-light);
}

.preview-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
}

.preview-content {
  padding: 16px;
}

.preview-content img,
.preview-content video {
  width: 100%;
  max-height: 300px;
  object-fit: contain;
  background: #000;
  border-radius: 4px;
}

/* 滚动条样式 */
.settings-scroll::-webkit-scrollbar {
  width: 6px;
}

.settings-scroll::-webkit-scrollbar-thumb {
  background: var(--el-border-color);
  border-radius: 3px;
}

.settings-scroll::-webkit-scrollbar-track {
  background: transparent;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .settings-container {
    padding: 16px 16px 0;
  }

  .settings-content {
    padding: 16px;
  }
}
</style> 