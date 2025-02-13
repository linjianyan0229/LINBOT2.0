<template>
  <div class="dashboard-container">
    <!-- 状态概览卡片 -->
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="status-card">
          <template #header>
            <div class="card-header">
              <span>机器人状态</span>
            </div>
          </template>
          <div class="status-content">
            <el-tag :type="isConnected ? 'success' : 'danger'" class="status-tag">
              {{ isConnected ? '已连接' : '未连接' }}
            </el-tag>
            <div class="status-info">
              <p>在线时长: {{ uptime }}</p>
              <p>最后心跳: {{ lastHeartbeat }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
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
      <el-col :span="8">
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
import { getPlugins, getGroups } from '@/api'
import api from '@/api'

const isConnected = ref(true)
const uptime = ref('0分钟')
const lastHeartbeat = ref('--')
let wsStartTime = null

const pluginStats = ref({
  total: 0,
})

const groupStats = ref({
  total: 0,
})

const restarting = ref(false)

// 更新在线时长
const updateUptime = () => {
  if (!wsStartTime) return
  
  const now = new Date()
  const diffInSeconds = Math.floor((now - wsStartTime) / 1000)
  
  const days = Math.floor(diffInSeconds / 86400)
  const hours = Math.floor((diffInSeconds % 86400) / 3600)
  const minutes = Math.floor((diffInSeconds % 3600) / 60)
  
  let uptimeText = ''
  if (days > 0) {
    uptimeText += `${days}天`
  }
  if (hours > 0 || days > 0) {
    uptimeText += `${hours}小时`
  }
  uptimeText += `${minutes}分钟`
  
  uptime.value = uptimeText
}

// 定时更新状态
let timer = null

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
    wsStartTime = new Date() // 重启后重置启动时间
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('重启失败')
    }
  } finally {
    restarting.value = false
  }
}

onMounted(() => {
  getPluginStats()
  getGroupStats()
  wsStartTime = new Date() // 设置初始启动时间
  
  // 启动定时器
  timer = setInterval(() => {
    updateUptime()
    lastHeartbeat.value = new Date().toLocaleTimeString()
  }, 1000)
})

onUnmounted(() => {
  // 清理定时器
  if (timer) {
    clearInterval(timer)
  }
})
</script>

// ... template部分保持不变 ...

<style scoped>
.dashboard-container {
  max-width: 1400px;
  margin: 20px auto;
  padding: 0 20px;
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
  margin-top: 24px;
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
</style>