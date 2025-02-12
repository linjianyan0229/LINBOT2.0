<template>
  <div class="friends-container">
    <!-- 顶部工具栏 -->
    <div class="friends-toolbar">
      <div class="toolbar-left">
        <h2 class="page-title">好友列表</h2>
        <el-tag type="success" size="small">{{ friends.length }} 个好友</el-tag>
      </div>
      <div class="toolbar-right">
        <el-input
          v-model="searchQuery"
          placeholder="搜索好友..."
          clearable
          :prefix-icon="Search"
          class="search-input"
        />
        <el-button type="primary" @click="refreshFriends" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新列表
        </el-button>
      </div>
    </div>

    <!-- 好友列表 -->
    <div class="friends-scroll">
      <div class="friends-list" v-loading="loading">
        <div class="list-header">
          <div class="col-qq">QQ号</div>
          <div class="col-name">昵称</div>
          <div class="col-remark">备注</div>
          <div class="col-status">状态</div>
        </div>
        
        <div v-for="friend in filteredFriends" 
          :key="friend.user_id" 
          class="friend-item"
        >
          <div class="col-qq">{{ friend.user_id }}</div>
          <div class="col-name">
            <img 
              :src="`http://q1.qlogo.cn/g?b=qq&nk=${friend.user_id}&s=100`" 
              :alt="friend.nickname"
              class="avatar"
            >
            <span>{{ friend.nickname }}</span>
          </div>
          <div class="col-remark">{{ friend.remark || '-' }}</div>
          <div class="col-status">
            <el-tag 
              :type="Math.random() > 0.5 ? 'success' : 'info'" 
              size="small"
            >
              {{ Math.random() > 0.5 ? '在线' : '离线' }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Search } from '@element-plus/icons-vue'
import { getFriends } from '@/api'

const friends = ref([])
const loading = ref(false)
const searchQuery = ref('')

// 过滤好友列表
const filteredFriends = computed(() => {
  const query = searchQuery.value.toLowerCase()
  if (!query) return friends.value
  
  return friends.value.filter(friend => 
    friend.nickname.toLowerCase().includes(query) ||
    friend.user_id.toString().includes(query) ||
    (friend.remark && friend.remark.toLowerCase().includes(query))
  )
})

// 获取好友列表
const getFriendList = async () => {
  loading.value = true
  try {
    const response = await getFriends()
    friends.value = response.data
  } catch (error) {
    ElMessage.error('获取好友列表失败')
  } finally {
    loading.value = false
  }
}

// 刷新好友列表
const refreshFriends = () => {
  getFriendList()
}

onMounted(() => {
  getFriendList()
})
</script>

<style scoped>
.friends-container {
  height: 670px;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-page);
  padding: 24px 24px 0;
  border-radius: 10px;
}

.friends-toolbar {
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

.friends-scroll {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 24px;
  margin-right: -8px;  /* 为滚动条预留空间 */
  padding-right: 8px;  /* 补偿margin-right */
}

.friends-list {
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

.friend-item {
  display: flex;
  align-items: center;
  height: 60px;
  padding: 0 20px;
  transition: all 0.3s;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.friend-item:hover {
  background: var(--el-fill-color-lighter);
  transform: translateX(4px);
}

.col-qq {
  width: 120px;
  color: var(--el-text-color-regular);
}

.col-name {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  
  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 4px;
  }
}

.col-remark {
  width: 200px;
  color: var(--el-text-color-secondary);
}

.col-status {
  width: 100px;
  text-align: center;
}

/* 美化滚动条 */
.friends-scroll::-webkit-scrollbar {
  width: 6px;
}

.friends-scroll::-webkit-scrollbar-thumb {
  background: var(--el-border-color);
  border-radius: 3px;
}

.friends-scroll::-webkit-scrollbar-track {
  background: transparent;
}
</style> 