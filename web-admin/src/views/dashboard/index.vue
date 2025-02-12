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
const startTime = new Date()

const pluginStats = ref({
  total: 0,
})

const groupStats = ref({
  total: 0,
})

const restarting = ref(false)

// 更新在线时长
const updateUptime = () => {
  const now = new Date()
  const diff = Math.floor((now - startTime) / 1000 / 60)
  uptime.value = `${diff}分钟`
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

<style scoped>
.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
}

.status-card {
  margin-bottom: 20px;
  height: 200px;
}

.status-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 120px;
}

.status-tag {
  font-size: 16px;
  padding: 8px 16px;
  margin-bottom: 16px;
}

.status-info {
  text-align: center;
}

.status-info p {
  margin: 8px 0;
  color: var(--text-secondary);
}

.count-info {
  text-align: center;
  margin-bottom: 5px;
}

.count-info h3 {
  font-size: 24px;
  margin: 0;
  color: var(--app-primary);
}

.count-info p {
  margin: 4px 0;
  color: var(--text-secondary);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style> 