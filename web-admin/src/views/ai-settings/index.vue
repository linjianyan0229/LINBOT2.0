<template>
  <div class="ai-settings-container">
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <h2 class="section-title">AI 配置中心</h2>
          <el-button 
            type="primary" 
            @click="saveSettings" 
            :loading="saving"
          >
            保存设置
          </el-button>
        </div>
      </template>

      <div class="settings-layout">
        <!-- 左侧基础设置 -->
        <div class="basic-settings">
          <div class="section-header">
            <el-icon><Setting /></el-icon>
            <h3>基础配置</h3>
          </div>
          <el-form :model="settings" label-position="top">
            <el-form-item label="API Key">
              <el-input 
                v-model="settings.apiKey" 
                placeholder="请输入 DeepSeek API Key"
                show-password
              />
            </el-form-item>

            <el-form-item label="当前模型">
              <el-select 
                v-model="settings.currentModel" 
                style="width: 100%"
              >
                <el-option
                  v-for="[id, desc] in Object.entries(modelOptions)"
                  :key="id"
                  :label="`${id} (${desc})`"
                  :value="id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="默认提示词">
              <el-input
                v-model="settings.defaultPrompt"
                type="textarea"
                :rows="4"
                placeholder="请输入默认提示词"
              />
            </el-form-item>
          </el-form>
        </div>

        <!-- 右侧用户提示词设置 -->
        <div class="user-settings">
          <div class="section-header">
            <div class="header-left">
              <el-icon><User /></el-icon>
              <h3>用户提示词配置</h3>
            </div>
            <el-button
              type="primary"
              link
              @click="showAllPrompts"
              class="more-button"
            >
              <el-icon><More /></el-icon>
              更多
            </el-button>
          </div>
          <div class="prompts-container">
            <div class="user-prompts-list">
              <div 
                v-for="(prompt, userId) in settings.userPrompts" 
                :key="userId" 
                class="user-prompt-item"
              >
                <div class="user-prompt-header">
                  <span class="user-id">用户 ID: {{ userId }}</span>
                  <el-button 
                    type="danger" 
                    size="small" 
                    @click="deleteUserPrompt(userId)"
                    :icon="Delete"
                  >
                    删除
                  </el-button>
                </div>
                <el-input
                  v-model="settings.userPrompts[userId]"
                  type="textarea"
                  :rows="3"
                  placeholder="用户个性化提示词"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 全部用户提示词列表弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      title="全部用户提示词"
      width="60%"
      class="prompts-dialog"
    >
      <el-table :data="promptsList" style="width: 100%" stripe>
        <el-table-column prop="userId" label="用户 ID" width="180" />
        <el-table-column prop="prompt" label="提示词" show-overflow-tooltip>
          <template #default="{ row }">
            <el-input
              v-model="settings.userPrompts[row.userId]"
              type="textarea"
              :rows="2"
              placeholder="用户个性化提示词"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button
              type="danger"
              size="small"
              @click="deleteUserPrompt(row.userId)"
              :icon="Delete"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="saveAndClose">
            保存更改
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Delete, Setting, User, More } from '@element-plus/icons-vue'
import { getAISettings, saveAISettings } from '@/api'

const saving = ref(false)
const settings = ref({
  apiKey: '',
  currentModel: 'deepseek-chat',
  defaultPrompt: '',
  userPrompts: {}
})

const modelOptions = {
  'deepseek-chat': 'DeepSeek-V3 通用对话模型',
  'deepseek-reasoner': 'DeepSeek-R1 推理增强模型'
}

// 加载设置
const loadSettings = async () => {
  try {
    const response = await getAISettings()
    settings.value = response.data
  } catch (error) {
    ElMessage.error('获取 AI 设置失败')
  }
}

// 保存设置
const saveSettings = async () => {
  saving.value = true
  try {
    await saveAISettings(settings.value)
    ElMessage.success('设置保存成功')
  } catch (error) {
    ElMessage.error('保存设置失败')
  } finally {
    saving.value = false
  }
}

// 删除用户提示词
const deleteUserPrompt = (userId) => {
  delete settings.value.userPrompts[userId]
}

// 弹窗控制
const dialogVisible = ref(false)

// 计算属性：转换用户提示词为表格数据
const promptsList = computed(() => {
  return Object.entries(settings.value.userPrompts).map(([userId, prompt]) => ({
    userId,
    prompt
  }))
})

// 显示所有提示词
const showAllPrompts = () => {
  dialogVisible.value = true
}

// 保存并关闭弹窗
const saveAndClose = async () => {
  await saveSettings()
  dialogVisible.value = false
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.ai-settings-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.settings-card {
  min-height: 600px;
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.section-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.settings-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0;
  height: calc(100% - 60px);
}

.basic-settings,
.user-settings {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.basic-settings {
  border-right: 1px solid var(--el-border-color-light);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.section-header .el-icon {
  font-size: 18px;
  color: var(--el-color-primary);
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.more-button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: 14px;
}

.prompts-container {
  flex: 1;
  min-height: 0;
  position: relative;
}

.user-prompts-list {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: auto;
  padding-right: 8px;
}

.user-prompt-item {
  margin-bottom: 16px;
  padding: 16px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  transition: all 0.3s ease;
}

.user-prompt-item:hover {
  transform: translateX(4px);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.user-prompt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.user-id {
  font-weight: 500;
  color: var(--el-text-color-secondary);
}

/* 滚动条样式 */
:deep(.user-prompts-list::-webkit-scrollbar) {
  width: 6px;
}

:deep(.user-prompts-list::-webkit-scrollbar-thumb) {
  background: var(--el-border-color);
  border-radius: 3px;
}

:deep(.user-prompts-list::-webkit-scrollbar-track) {
  background: transparent;
}

/* 响应式布局 */
@media (max-width: 992px) {
  .settings-layout {
    grid-template-columns: 1fr;
  }
  
  .basic-settings {
    border-right: none;
    border-bottom: 1px solid var(--el-border-color-light);
  }

  .user-settings {
    border-left: none;
    border-top: 1px solid var(--el-border-color-light);
    height: 400px;
  }
}

/* 弹窗样式 */
.prompts-dialog {
  :deep(.el-dialog__body) {
    padding: 20px;
    max-height: 60vh;
    overflow-y: auto;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style> 