<template>
  <div class="groups-container">
    <!-- 顶部工具栏 -->
    <div class="groups-toolbar">
      <div class="toolbar-left">
        <h2 class="page-title">群聊列表</h2>
        <el-tag type="success" size="small">{{ groups.length }} 个群聊</el-tag>
      </div>
      <div class="toolbar-right">
        <el-input
          v-model="searchQuery"
          placeholder="搜索群聊..."
          clearable
          :prefix-icon="Search"
          class="search-input"
        />
        <el-button type="primary" @click="refreshGroups" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新列表
        </el-button>
      </div>
    </div>

    <!-- 群聊列表 -->
    <div class="groups-scroll">
      <div class="groups-list" v-loading="loading">
        <div class="list-header">
          <div class="col-id">群号</div>
          <div class="col-name">群名称</div>
          <div class="col-members">成员数</div>
          <div class="col-status">机器人状态</div>
        </div>
        
        <div v-for="group in filteredGroups" 
          :key="group.group_id" 
          class="group-item"
        >
          <div class="col-id">{{ group.group_id }}</div>
          <div class="col-name">
            <img 
              :src="`http://p.qlogo.cn/gh/${group.group_id}/${group.group_id}/100`" 
              :alt="group.group_name"
              class="group-avatar"
            >
            <span>{{ group.group_name }}</span>
          </div>
          <div class="col-members">
            <el-tooltip :content="`${group.member_count}/${group.max_member_count}`">
              <el-progress 
                :percentage="(group.member_count / group.max_member_count) * 100"
                :format="() => `${group.member_count}人`"
                :stroke-width="10"
              />
            </el-tooltip>
          </div>
          <div class="col-status">
            <el-switch
              v-model="groupStates[group.group_id]"
              @change="(val) => toggleGroupState(group.group_id, val)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Search, Message, Setting } from '@element-plus/icons-vue'
import { getGroups } from '@/api'
import axios from 'axios'

const groups = ref([])
const loading = ref(false)
const searchQuery = ref('')
const groupStates = ref({})

// API 实例
const api = axios.create({
  baseURL: 'http://localhost:8082/api'
})

// 过滤群聊列表
const filteredGroups = computed(() => {
  const query = searchQuery.value.toLowerCase()
  if (!query) return groups.value
  
  return groups.value.filter(group => 
    group.group_name.toLowerCase().includes(query) ||
    group.group_id.toString().includes(query)
  )
})

// 获取群聊列表和状态
const getGroupList = async () => {
  loading.value = true
  try {
    const [groupsRes, statesRes] = await Promise.all([
      getGroups(),
      api.get('/groups/states')
    ])
    groups.value = groupsRes.data
    groupStates.value = statesRes.data || {}
  } catch (error) {
    ElMessage.error('获取群聊信息失败')
    groupStates.value = {}
  } finally {
    loading.value = false
  }
}

// 切换群状态
const toggleGroupState = async (group_id, enabled) => {
  try {
    await api.put(`/groups/${group_id}/state`, { enabled })
    ElMessage.success(`群 ${group_id} 已${enabled ? '启用' : '禁用'}机器人`)
  } catch (error) {
    groupStates.value[group_id] = !enabled
    ElMessage.error('更新群状态失败')
  }
}

// 刷新群聊列表
const refreshGroups = () => {
  getGroupList()
}

onMounted(() => {
  getGroupList()
})
</script>

<style scoped>
.groups-container {
  height: 670px;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-page);
  padding: 24px 24px 0;
  border-radius: 10px;
}

.groups-toolbar {
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

.toolbar-right {
  display: flex;
  gap: 12px;
}

.search-input {
  width: 240px;
}

.groups-scroll {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 24px;
  margin-right: -8px;
  padding-right: 8px;
}

.groups-list {
  background: var(--el-bg-color);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--el-box-shadow-light);
}

.list-header {
  display: flex;
  align-items: center;
  height: 50px;
  padding: 0 20px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-weight: 500;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.group-item {
  display: flex;
  align-items: center;
  height: 60px;
  padding: 0 20px;
  transition: all 0.3s;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.group-item:hover {
  background: var(--el-fill-color-lighter);
  transform: translateX(4px);
}

.col-id {
  width: 120px;
  color: var(--el-text-color-regular);
}

.col-name {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  
  .group-avatar {
    width: 32px;
    height: 32px;
    border-radius: 4px;
  }
}

.col-members {
  width: 200px;
  padding: 0 20px;
}

.col-status {
  width: 100px;
  text-align: center;
}

/* 美化滚动条 */
.groups-scroll::-webkit-scrollbar {
  width: 6px;
}

.groups-scroll::-webkit-scrollbar-thumb {
  background: var(--el-border-color);
  border-radius: 3px;
}

.groups-scroll::-webkit-scrollbar-track {
  background: transparent;
}
</style> 