<template>
  <div class="dashboard-container">
    <!-- 系统状态卡片 -->
    <el-card class="status-card">
      <template #header>
        <div class="card-header">
          <span>系统状态</span>
          <el-button 
            type="primary" 
            link 
            @click="refreshStatus"
            :loading="loading"
          >
            <el-icon><Refresh /></el-icon>
          </el-button>
        </div>
      </template>
      <div class="status-content">
        <div class="status-item">
          <el-icon><Timer /></el-icon>
          <div class="item-info">
            <span class="label">运行时长</span>
            <span class="value">{{ systemStatus.uptime }}</span>
          </div>
        </div>
        <div class="status-item">
          <el-icon><Calendar /></el-icon>
          <div class="item-info">
            <span class="label">启动时间</span>
            <span class="value">{{ systemStatus.startTime }}</span>
          </div>
        </div>
        <div class="status-item">
          <el-icon><Connection /></el-icon>
          <div class="item-info">
            <span class="label">WebSocket</span>
            <span class="value" :class="{ 'text-success': systemStatus.wsConnected, 'text-danger': !systemStatus.wsConnected }">
              {{ systemStatus.wsConnected ? '已连接' : '未连接' }}
            </span>
          </div>
        </div>
        <div class="status-item">
          <el-icon><Monitor /></el-icon>
          <div class="item-info">
            <span class="label">内存占用</span>
            <span class="value">{{ formatMemory(systemStatus.memoryUsage) }}</span>
          </div>
        </div>
      </div>
    </el-card>
    <!-- 状态概览卡片 -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="status-card">
          <template #header>
            <div class="card-header">
              <span>插件统计</span>
            </div>
          </template>
          <div class="status-content">
            <div class="count-info">
              <h3>{{ pluginStats.total }}</h3>
              <p>插件总数</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="status-card">
          <template #header>
            <div class="card-header">
              <span>群聊统计</span>
            </div>
          </template>
          <div class="status-content">
            <div class="count-info">
              <h3>{{ groupStats.total }}</h3>
              <p>群聊总数</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <el-card class="dashboard-card">
      <template #header>
        <div class="card-header">
          <h2 class="section-title">系统控制</h2>
        </div>
      </template>
      <el-button 
        type="danger" 
        @click="confirmRestart"
        :loading="restarting"
      >
        重启机器人
      </el-button>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPlugins, getGroups, getSystemStatus } from '@/api'
import api from '@/api'
import { 
  Refresh, Timer, Calendar, 
  Connection, Monitor 
} from '@element-plus/icons-vue'

const pluginStats = ref({
  total: 0,
})

const groupStats = ref({
  total: 0,
})

const restarting = ref(false)

const systemStatus = ref({
  uptime: '加载中...',
  startTime: '加载中...',
  wsConnected: false,
  memoryUsage: 0
})
const loading = ref(false)

// 获取插件统计
const getPluginStats = async () => {
  try {
    const response = await getPlugins()
    pluginStats.value = {
      total: response.data.length,
    }
  } catch (error) {
    console.error('获取插件统计失败:', error)
  }
}

// 获取群聊统计
const getGroupStats = async () => {
  try {
    const response = await getGroups()
    groupStats.value = {
      total: response.data.length,
    }
  } catch (error) {
    console.error('获取群聊统计失败:', error)
  }
}

// 确认重启
const confirmRestart = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要重启机器人吗？重启过程中机器人将暂时无法响应消息。',
      '确认重启',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    restarting.value = true
    await api.post('/restart')
    ElMessage.success('重启指令已发送')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('重启失败')
    }
  } finally {
    restarting.value = false
  }
}

// 格式化内存大小
const formatMemory = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

// 刷新系统状态
const refreshStatus = async () => {
  loading.value = true
  try {
    const response = await getSystemStatus()
    systemStatus.value = response.data
  } catch (error) {
    console.error('获取系统状态失败:', error)
  } finally {
    loading.value = false
  }
}

// 定时更新状态
let timer = null
let refreshInterval = null

onMounted(() => {
  getPluginStats()
  getGroupStats()
  
  refreshStatus()
  refreshInterval = setInterval(refreshStatus, 60000) // 每分钟刷新一次
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
.dashboard-container {
  max-width: 1400px;
  margin: 20px auto;
  padding: 0 20px;
  height: 650px;
  overflow-y: auto;
  
  /* 隐藏滚动条但保持可滚动 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
}

/* 卡片布局优化 */
.status-card {
  margin-bottom: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
  background: linear-gradient(145deg, #ffffff, #f8f9fa);
}

.status-card:hover {
  transform: translateY(-2px);
}

/* 状态内容优化 */
.status-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 150px;
  padding: 20px;
}

.status-tag {
  font-size: 18px;
  padding: 10px 24px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-weight: 500;
}

.status-info p {
  margin: 12px 0;
  font-size: 14px;
  color: #6b7280;
}

/* 统计卡片优化 */
.count-info {
  text-align: center;
  padding: 20px;
}

.count-info h3 {
  font-size: 32px;
  margin: 16px 0;
  color: #3b82f6;
  font-weight: 600;
}

.count-info p {
  font-size: 16px;
  color: #6b7280;
}

/* 控制面板优化 */
.dashboard-card {
  margin-top: 8px;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 20px;
  color: #1f2937;
  margin: 0;
}

/* 按钮样式优化 */
.el-button--danger {
  padding: 12px 32px;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.2s ease;
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .el-col {
    width: 100%;
    margin-bottom: 16px;
  }
  
  .status-card {
    margin-bottom: 16px;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  padding: 10px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  transition: all 0.3s;
}

.status-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--el-box-shadow-light);
}

.status-item .el-icon {
  font-size: 24px;
  color: var(--el-color-primary);
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.value {
  font-size: 16px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.text-success {
  color: var(--el-color-success);
}

.text-danger {
  color: var(--el-color-danger);
}
</style>