<template>
  <div class="settings-container">
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <span>系统设置</span>
        </div>
      </template>
      <el-form :model="settings" label-width="120px">
        <!-- 背景设置 -->
        <el-form-item label="背景设置">
          <el-select v-model="settings.background.type" style="width: 100%; margin-bottom: 16px">
            <el-option label="默认" value="default" />
            <el-option label="图片" value="image" />
            <el-option label="视频" value="video" />
          </el-select>
          
          <template v-if="settings.background.type !== 'default'">
            <el-input
              v-model="settings.background.url"
              :placeholder="settings.background.type === 'image' ? '请输入图片URL' : '请输入视频URL'"
            >
              <template #append>
                <el-button @click="previewBackground">预览</el-button>
              </template>
            </el-input>
            
            <div class="background-preview" v-if="showPreview">
              <div class="preview-header">
                <span>背景预览</span>
                <el-button type="text" @click="showPreview = false">关闭</el-button>
              </div>
              <img 
                v-if="settings.background.type === 'image'" 
                :src="settings.background.url"
                @error="handlePreviewError"
              >
              <video 
                v-else 
                :src="settings.background.url"
                controls
                @error="handlePreviewError"
              />
            </div>
          </template>
        </el-form-item>

        <el-form-item label="WebSocket地址">
          <el-input v-model="settings.wsUrl" />
        </el-form-item>
        <el-form-item label="心跳间隔(ms)--该功能无效">
          <el-input-number v-model="settings.heartbeat" :min="1000" :step="1000" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveSystemSettings">保存设置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getSettings, saveSettings } from '@/api/index'

const settings = ref({
  wsUrl: '',
  heartbeat: 30000,
  background: {
    type: 'default',
    url: ''
  }
})

const showPreview = ref(false)

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
  try {
    await saveSettings(settings.value)
    applyBackground()
    ElMessage.success('设置保存成功')
  } catch (error) {
    ElMessage.error('保存设置失败')
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
  
  // 移除现有背景
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
    // 如果已存在视频，先移除
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
  padding: 20px;
}

.settings-card {
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  font-weight: bold;
}

.background-preview {
  margin-top: 16px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  overflow: hidden;
}

.preview-header {
  padding: 8px 16px;
  background: var(--el-fill-color-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.background-preview img,
.background-preview video {
  width: 100%;
  max-height: 300px;
  object-fit: contain;
  background: #000;
}
</style> 