<template>
  <div class="plugins-container">
    <el-card class="plugins-card glass-effect">
      <template #header>
        <div class="card-header">
          <div class="header-content">
            <el-icon class="card-icon"><Monitor /></el-icon>
            <h2 class="section-title">插件管理</h2>
          </div>
          <el-button 
            type="primary" 
            @click="refreshPlugins" 
            :icon="Refresh"
            class="refresh-button"
          >
            刷新
          </el-button>
        </div>
      </template>
      <el-table 
        :data="plugins" 
        style="width: 100%" 
        stripe
        class="plugins-table"
      >
        <el-table-column 
          prop="command" 
          label="命令" 
          width="160"
        />
        <el-table-column 
          prop="description" 
          label="描述" 
          min-width="200"
        />
        <el-table-column 
          label="操作" 
          width="200" 
          align="center"
        >
          <template #default="scope">
            <div class="action-column">
              <el-switch
                v-model="scope.row.enabled"
                @change="(val) => togglePlugin(scope.row, val)"
                class="plugin-switch"
                inline-prompt
                active-text="启"
                inactive-text="禁"
              />
              <el-button
                type="primary"
                size="small"
                @click="editPlugin(scope.row)"
                class="action-button"
              >
                编辑
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Box, Monitor } from '@element-plus/icons-vue'
import { getPlugins, updatePlugin } from '@/api/index'

const plugins = ref([])

// 获取插件列表
const getPluginList = async () => {
  try {
    const response = await getPlugins()
    plugins.value = response.data
  } catch (error) {
    ElMessage.error('获取插件列表失败')
  }
}

// 刷新插件列表
const refreshPlugins = async () => {
  await getPluginList()
  ElMessage.success('刷新成功')
}

// 切换插件状态
const togglePlugin = async (plugin, enabled) => {
  try {
    await updatePlugin(plugin.command, enabled)
    ElMessage.success(`${plugin.command} ${enabled ? '已启用' : '已禁用'}`)
  } catch (error) {
    plugin.enabled = !enabled // 恢复状态
    ElMessage.error('更新插件状态失败')
    // 刷新列表以确保显示正确的状态
    await getPluginList()
  }
}

// 编辑插件
const editPlugin = (plugin) => {
  // TODO: 实现插件编辑功能
  ElMessage.info('编辑插件功能开发中')
}

onMounted(() => {
  getPluginList()
})
</script>

<style scoped>
.plugins-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.plugins-card {
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  transition: all 0.3s ease;
}

.glass-effect {
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.glass-effect:hover {
  transform: translateY(-3px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-icon {
  font-size: 24px;
  color: var(--el-color-primary);
}

.section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.refresh-button {
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.plugins-table {
  --el-table-border-color: var(--el-border-color-lighter);
  --el-table-header-bg-color: rgba(245, 247, 250, 0.6);
  --el-table-row-hover-bg-color: rgba(245, 247, 250, 0.4);
}

.action-column {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.plugin-switch {
  --el-switch-on-color: var(--el-color-success);
  --el-switch-off-color: var(--el-color-danger);
  --el-switch-border-color: var(--el-border-color);
  height: 24px;
}

.action-button {
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.action-button:hover {
  transform: translateY(-1px);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .action-column {
    flex-direction: column;
    gap: 8px;
  }
  
  .plugin-switch {
    margin-bottom: 8px;
  }
}
</style> 