<template>
  <div class="plugins-container">
    <el-card class="plugins-card">
      <template #header>
        <div class="card-header">
          <h2 class="section-title">插件列表</h2>
          <el-button type="primary" @click="refreshPlugins" :icon="Refresh">
            刷新
          </el-button>
        </div>
      </template>
      <el-table :data="plugins" style="width: 100%" :border="false">
        <el-table-column prop="command" label="命令" width="180" />
        <el-table-column prop="description" label="描述" />
        <el-table-column label="操作" width="200" align="center">
          <template #default="scope">
            <div class="action-column">
              <el-switch
                v-model="scope.row.enabled"
                @change="(val) => togglePlugin(scope.row, val)"
                class="custom-switch"
              />
              <el-button
                type="primary"
                size="small"
                @click="editPlugin(scope.row)"
                class="edit-button"
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
import { Refresh } from '@element-plus/icons-vue'
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
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.action-column {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.edit-button {
  margin-left: 0 !important;
}

.custom-switch {
  --el-switch-on-color: var(--app-primary);
}
</style> 