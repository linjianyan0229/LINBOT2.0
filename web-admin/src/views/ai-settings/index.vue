<template>
  <div class="ai-settings-container">
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <h2 class="section-title">deepseekAI设置</h2>
          <el-button type="primary" @click="saveSettings" :loading="saving">
            保存设置
          </el-button>
        </div>
      </template>

      <el-form :model="settings" label-position="top">
        <!-- API Key 设置 -->
        <el-form-item label="API Key">
          <el-input 
            v-model="settings.apiKey" 
            placeholder="请输入 DeepSeek API Key"
            show-password
          />
        </el-form-item>

        <!-- 模型选择 -->
        <el-form-item label="当前模型">
          <el-select v-model="settings.currentModel" style="width: 100%">
            <el-option
              v-for="[id, desc] in Object.entries(modelOptions)"
              :key="id"
              :label="`${id} (${desc})`"
              :value="id"
            />
          </el-select>
        </el-form-item>

        <!-- 默认提示词 -->
        <el-form-item label="默认提示词">
          <el-input
            v-model="settings.defaultPrompt"
            type="textarea"
            :rows="4"
            placeholder="请输入默认提示词"
          />
        </el-form-item>

        <!-- 用户提示词列表 -->
        <el-form-item label="用户提示词配置">
          <div v-for="(prompt, userId) in settings.userPrompts" :key="userId" class="user-prompt-item">
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
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
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

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.ai-settings-container {
  max-width: 800px;
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
}

.user-prompt-item {
  margin-bottom: 16px;
  padding: 16px;
  border-radius: 8px;
  background: #f5f7fa;
}

.user-prompt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.user-id {
  font-weight: 500;
  color: var(--text-secondary);
}
</style> 