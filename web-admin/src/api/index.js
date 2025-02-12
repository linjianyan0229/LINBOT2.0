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

export default api 