import axios from 'axios'

const api = axios.create({
    baseURL: 'http://localhost:8082/api',
    timeout: 5000
})

export const getPlugins = () => {
    return api.get('/plugins')
}

export const updatePlugin = (command, enabled) => {
    return api.put(`/plugins/${command}`, { enabled })
}

export const getSettings = () => {
    return api.get('/settings')
}

export const saveSettings = (settings) => {
    return api.post('/settings', settings)
}

// 获取好友列表
export const getFriends = () => {
    return api.get('/friends');
};

// 获取群聊列表
export const getGroups = () => {
    return api.get('/groups');
};

// 获取 AI 设置
export const getAISettings = () => {
    return api.get('/ai/settings');
};

// 保存 AI 设置
export const saveAISettings = (settings) => {
    return api.post('/ai/settings', settings);
};

// 获取插件代码
export const getPluginCode = (command) => {
    return api.get(`/plugins/${encodeURIComponent(command)}/code`);
};

// 保存插件代码
export const savePluginCode = (command, code) => {
    return api.put(`/plugins/${encodeURIComponent(command)}/code`, { code });
};

// 获取系统运行状态
export const getSystemStatus = () => {
    return api.get('/system/status');
};

// 获取插件分组
export const getPluginGroups = () => {
    return api.get('/plugins/groups')
}

// 更新分组状态
export const updateGroupState = (groupName, enabled) => {
    return api.put(`/plugins/groups/${groupName}`, { enabled })
}

export default api 