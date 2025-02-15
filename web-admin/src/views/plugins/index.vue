<template>
  <div class="plugins-container">
    <!-- 顶部工具栏 -->
    <div class="plugins-toolbar">
      <div class="toolbar-left">
        <h2 class="page-title">插件管理</h2>
        <el-tag type="success" size="small">{{ plugins.length }} 个插件</el-tag>
      </div>
      <div class="toolbar-right">
        <el-button 
          type="primary" 
          @click="refreshPlugins" 
          :icon="Refresh"
          :loading="loading"
        >
          刷新列表
        </el-button>
      </div>
    </div>

    <!-- 插件列表区域 -->
    <div class="plugins-scroll">
      <div class="plugins-content" v-loading="loading">
        <!-- 分组视图 -->
        <el-card v-for="group in groups" :key="group.name" class="plugin-group-card">
          <template #header>
            <div class="group-header">
              <span class="group-name">{{ group.name }}</span>
              <el-switch
                v-model="group.enabled"
                @change="(val) => toggleGroup(group.name, val)"
                class="group-switch"
                inline-prompt
                active-text="启"
                inactive-text="禁"
              />
            </div>
          </template>
          
          <el-table 
            :data="group.plugins" 
            style="width: 100%"
            :header-cell-style="{ background: 'var(--el-fill-color-light)' }"
          >
            <el-table-column 
              prop="command" 
              label="命令" 
              width="180"
            >
              <template #default="{ row }">
                <div class="command-cell">
                  <el-icon><Operation /></el-icon>
                  <span>{{ row.command }}</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column 
              prop="description" 
              label="描述" 
              min-width="200"
            >
              <template #default="{ row }">
                <el-tooltip 
                  :content="row.description" 
                  placement="top" 
                  :show-after="1000"
                >
                  <span class="description-text">{{ row.description }}</span>
                </el-tooltip>
              </template>
            </el-table-column>

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
                    :icon="Edit"
                  >
                    编辑
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>
    </div>

    <!-- 添加编辑对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="`编辑插件 - ${currentPlugin?.command}`"
      width="80%"
      class="edit-dialog"
      :modal="true"
      :close-on-click-modal="false"
      :destroy-on-close="true"
      top="20px"
    >
      <div class="editor-container">
        <div class="editor-toolbar">
          <div class="toolbar-info">
            <el-icon><Document /></el-icon>
            <span>{{ currentPlugin?.command }}/index.js</span>
          </div>
          <div class="toolbar-actions">
            <el-tooltip content="保存修改" placement="bottom">
              <el-button 
                type="primary" 
                @click="savePluginCode"
                :loading="saving"
              >
                <el-icon><Check /></el-icon>
                保存
              </el-button>
            </el-tooltip>
          </div>
        </div>
        
        <!-- 代码编辑器 -->
        <div class="code-editor">
          <el-input
            v-model="editingCode"
            type="textarea"
            :autosize="false"
            :rows="24"
            font-family="monospace"
            resize="none"
            spellcheck="false"
          />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  getPlugins, updatePlugin, getPluginCode,
  getPluginGroups, updateGroupState,
  savePluginCode as apiSavePluginCode 
} from '@/api/index'
import { 
  Refresh, Operation, Edit, Document,
  Check, Close 
} from '@element-plus/icons-vue'

const plugins = ref([])
const groups = ref([])
const loading = ref(false)
const editDialogVisible = ref(false)
const currentPlugin = ref(null)
const editingCode = ref('')
const saving = ref(false)

// 计算编辑器行数
const editorRows = ref(28) // 设置一个合适的固定行数

// 获取插件列表
const refreshPlugins = async () => {
  loading.value = true
  try {
    const response = await getPlugins()
    plugins.value = response.data
    // 同时刷新分组信息
    await loadGroups()
    ElMessage.success('插件列表已更新')
  } catch (error) {
    ElMessage.error('获取插件列表失败')
  } finally {
    loading.value = false
  }
}

// 获取插件分组
const loadGroups = async () => {
  try {
    const response = await getPluginGroups()
    groups.value = response.data
  } catch (error) {
    console.error('获取插件分组失败:', error)
    ElMessage.error('获取插件分组失败')
  }
}

// 切换插件状态
const togglePlugin = async (plugin, enabled) => {
  try {
    await updatePlugin(plugin.command, enabled)
    ElMessage.success(`插件 ${plugin.command} 已${enabled ? '启用' : '禁用'}`)
    // 更新后重新加载分组信息以保持同步
    await loadGroups()
  } catch (error) {
    plugin.enabled = !enabled // 恢复状态
    ElMessage.error('更新插件状态失败')
  }
}

// 切换分组状态
const toggleGroup = async (groupName, enabled) => {
  try {
    await updateGroupState(groupName, enabled)
    ElMessage.success(`${groupName} 分组已${enabled ? '启用' : '禁用'}`)
    // 重新加载插件列表和分组
    await Promise.all([refreshPlugins(), loadGroups()])
  } catch (error) {
    console.error('更新分组状态失败:', error)
    ElMessage.error('更新分组状态失败')
  }
}

// 编辑插件
const editPlugin = async (plugin) => {
  try {
    currentPlugin.value = plugin;
    const response = await getPluginCode(plugin.command);
    editingCode.value = response.data.code;
    editDialogVisible.value = true;
  } catch (error) {
    ElMessage.error('获取插件代码失败');
  }
}

// 保存插件代码
const savePluginCode = async () => {
  if (!currentPlugin.value || !editingCode.value) return;
  
  try {
    await ElMessageBox.confirm(
      '确定要保存修改吗？这可能会影响插件的运行。',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    saving.value = true;
    await apiSavePluginCode(currentPlugin.value.command, editingCode.value);
    ElMessage.success('插件代码保存成功');
    editDialogVisible.value = false;
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('保存插件代码失败');
    }
  } finally {
    saving.value = false;
  }

}

onMounted(() => {
  refreshPlugins() // 只需要调用 refreshPlugins，因为它会同时加载分组信息
})
</script>

<style scoped>
.plugins-container {
  height: 670px;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-page);
  padding: 24px 24px 0;
  border-radius: 10px;
}

.plugins-toolbar {
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

.plugins-scroll {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 24px;
  margin-right: -8px;
  margin-bottom: 24px;
  padding-right: 8px;

  /* 隐藏滚动条但保持可滚动 */
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

.plugins-content {
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 16px;
  box-shadow: var(--el-box-shadow-light);
}

.command-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.command-cell .el-icon {
  font-size: 16px;
  color: var(--el-color-primary);
}

.description-text {
  display: inline-block;
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-column {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
}

.plugin-switch {
  --el-switch-on-color: var(--el-color-success);
  --el-switch-off-color: var(--el-color-danger);
}

/* 表格样式优化 */
:deep(.el-table) {
  --el-table-border-color: var(--el-border-color-lighter);
  --el-table-header-bg-color: var(--el-fill-color-light);
  --el-table-row-hover-bg-color: var(--el-fill-color-lighter);
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table__row) {
  transition: all 0.3s ease;
}

:deep(.el-table__row:hover) {
  transform: translateX(4px);
}

/* 滚动条样式 */
.plugins-scroll::-webkit-scrollbar {
  width: 6px;
}

.plugins-scroll::-webkit-scrollbar-thumb {
  background: var(--el-border-color);
  border-radius: 3px;
}

.plugins-scroll::-webkit-scrollbar-track {
  background: transparent;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .plugins-container {
    padding: 16px 16px 0;
  }

  .plugins-content {
    padding: 12px;
  }

  .action-column {
    flex-direction: column;
    gap: 8px;
  }
}

.edit-dialog {
  :deep(.el-dialog) {
    margin-top: 10px !important;
    height: 550px;
    display: flex;
    flex-direction: column;
    border-radius: 15px;
    box-shadow: var(--el-box-shadow-dark);
  }

  :deep(.el-dialog__header) {
    padding: 12px 16px;
    margin: 0;
    background: var(--el-color-primary);
    color: white;
    flex-shrink: 0;
    border-radius: 15px 15px 0 0;
  }

  :deep(.el-dialog__title) {
    color: white;
    font-size: 16px;
  }

  :deep(.el-dialog__headerbtn) {
    top: 12px;
    
    .el-dialog__close {
      color: white;
      
      &:hover {
        color: var(--el-color-primary-light-3);
      }
    }
  }

  :deep(.el-dialog__body) {
    flex: 1;
    padding: 0;
    overflow-y: auto;
    
    /* 滚动条样式 */
    &::-webkit-scrollbar {
      width: 6px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: var(--el-border-color);
      border-radius: 3px;
    }
    
    &::-webkit-scrollbar-track {
      background: transparent;
    }
  }
}

.editor-container {
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
}

.toolbar-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-regular);
  
  .el-icon {
    font-size: 16px;
    color: var(--el-color-primary);
  }
}

.code-editor {
  padding: 16px;
  background: var(--el-bg-color-page);
  display: flex;
  flex-direction: column;
  
  :deep(.el-textarea) {
    display: flex;
    
    .el-textarea__inner {
      font-family: 'Fira Code', monospace;
      font-size: 14px;
      line-height: 1.6;
      padding: 12px;
      background: var(--el-fill-color-light);
      border: none;
      border-radius: 4px;
      color: var(--el-text-color-primary);
      min-height: 400px;
    }
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .edit-dialog {
    :deep(.el-dialog) {
      width: 95% !important;
      margin: 60px auto !important;
      height: 550px;
    }
  }
  
  .editor-toolbar {
    padding: 8px 12px;
  }
  
  .code-editor {
    padding: 12px;
  }
}

.plugin-group-card {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.group-name {
  font-size: 16px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.group-switch {
  margin-left: 16px;
}
</style>
