const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const cors = require('cors');
const PluginManager = require('./plugins/PluginManager');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);

// 启用 CORS
app.use(cors());
app.use(express.json());

// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ server });

// 存储已连接的客户端
let connectedClient = null;

// 创建插件管理器实例（会自动加载插件）
const pluginManager = new PluginManager();

// API 路由
// 获取插件列表
app.get('/api/plugins', (req, res) => {
    const pluginList = [];
    for (const [command, plugin] of pluginManager.plugins) {
        pluginList.push({
            command,
            description: plugin.description,
            enabled: plugin.enabled
        });
    }
    res.json(pluginList);
});

// 更新插件状态
app.put('/api/plugins/:command', (req, res) => {
    const { command } = req.params;
    const { enabled } = req.body;
    
    if (pluginManager.updatePluginState(command, enabled)) {
        res.json({ success: true });
    } else {
        res.status(404).json({ error: '插件不存在' });
    }
});

// 获取系统设置
app.get('/api/settings', (req, res) => {
    try {
        // 从配置文件读取设置
        const settingsPath = path.join(__dirname, 'config', 'settings.json');
        let settings = {
            wsUrl: `ws://localhost:${PORT}`,
            heartbeat: 3000,
            background: { type: 'default', url: '' }
        };
        
        if (fs.existsSync(settingsPath)) {
            const savedSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            settings = { ...settings, ...savedSettings };
        }
        
        res.json(settings);
    } catch (error) {
        console.error('获取设置失败:', error);
        res.status(500).json({ error: '获取设置失败' });
    }
});

// 保存系统设置
app.post('/api/settings', (req, res) => {
    try {
        const { wsUrl, heartbeat, background } = req.body;
        // 确保config目录存在
        const configDir = path.join(__dirname, 'config');
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }
        
        // 保存设置到文件
        const settingsPath = path.join(configDir, 'settings.json');
        fs.writeFileSync(settingsPath, JSON.stringify({
            wsUrl,
            heartbeat,
            background
        }, null, 2));
        
        res.json({ success: true });
    } catch (error) {
        console.error('保存设置失败:', error);
        res.status(500).json({ error: '保存设置失败' });
    }
});

// 添加获取好友列表的API
app.get('/api/friends', (req, res) => {
    if (!connectedClient) {
        return res.status(503).json({ error: '机器人未连接' });
    }

    // 创建一个Promise来处理异步响应
    const getFriends = new Promise((resolve, reject) => {
        const request = {
            action: 'get_friend_list',
            echo: 'get_friend_list_api'
        };

        // 创建一个一次性的消息处理器
        const messageHandler = (msg) => {
            try {
                const data = JSON.parse(msg);
                if (data.echo === 'get_friend_list_api') {
                    connectedClient.removeListener('message', messageHandler);
                    resolve(data.data);
                }
            } catch (err) {
                reject(err);
            }
        };

        // 添加消息监听器
        connectedClient.on('message', messageHandler);

        // 发送请求
        connectedClient.send(JSON.stringify(request));

        // 设置超时
        setTimeout(() => {
            connectedClient.removeListener('message', messageHandler);
            reject(new Error('获取好友列表超时'));
        }, 5000);
    });

    // 处理响应
    getFriends
        .then(friends => res.json(friends))
        .catch(error => {
            console.error('获取好友列表错误:', error);
            res.status(500).json({ error: '获取好友列表失败' });
        });
});

// 添加获取群聊列表的API
app.get('/api/groups', (req, res) => {
    if (!connectedClient) {
        return res.status(503).json({ error: '机器人未连接' });
    }

    // 创建一个Promise来处理异步响应
    const getGroups = new Promise((resolve, reject) => {
        const request = {
            action: 'get_group_list',
            echo: 'get_group_list_api'
        };

        // 创建一个一次性的消息处理器
        const messageHandler = (msg) => {
            try {
                const data = JSON.parse(msg);
                if (data.echo === 'get_group_list_api') {
                    connectedClient.removeListener('message', messageHandler);
                    resolve(data.data);
                }
            } catch (err) {
                reject(err);
            }
        };

        // 添加消息监听器
        connectedClient.on('message', messageHandler);

        // 发送请求
        connectedClient.send(JSON.stringify(request));

        // 设置超时
        setTimeout(() => {
            connectedClient.removeListener('message', messageHandler);
            reject(new Error('获取群聊列表超时'));
        }, 5000);
    });

    // 处理响应
    getGroups
        .then(groups => res.json(groups))
        .catch(error => {
            console.error('获取群聊列表错误:', error);
            res.status(500).json({ error: '获取群聊列表失败' });
        });
});

// 添加获取群聊状态的API
app.get('/api/groups/states', (req, res) => {
    // 确保返回一个对象而不是字符串
    if (!pluginManager.groupStates) {
        res.json({});
        return;
    }
    res.json(pluginManager.groupStates);
});

// 添加更新群聊状态的API
app.put('/api/groups/:group_id/state', (req, res) => {
    const { group_id } = req.params;
    const { enabled } = req.body;
    
    try {
        pluginManager.setGroupState(group_id, enabled);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: '更新群聊状态失败' });
    }
});

// 重启 API
app.post('/api/restart', (req, res) => {
    try {
        // 关闭 WebSocket 连接
        if (connectedClient) {
            connectedClient.close();
        }

        // 直接退出进程
        setTimeout(() => {
            console.log('正在退出进程...');
            process.exit();
        }, 1000);

        res.json({ success: true, message: '正在重启...' });
    } catch (error) {
        console.error('重启失败:', error);
        res.status(500).json({ error: '重启失败' });
    }
});

// AI 设置相关 API
app.get('/api/ai/settings', (req, res) => {
    try {
        const aiPlugin = pluginManager.plugins.get('ai对话');
        if (!aiPlugin) {
            return res.status(404).json({ error: 'AI 插件未找到' });
        }

        const settings = {
            apiKey: aiPlugin.apiKey,
            currentModel: aiPlugin.currentModel,
            defaultPrompt: aiPlugin.defaultSystemPrompt,
            userPrompts: aiPlugin.userPrompts
        };

        res.json(settings);
    } catch (error) {
        console.error('获取 AI 设置失败:', error);
        res.status(500).json({ error: '获取设置失败' });
    }
});

app.post('/api/ai/settings', (req, res) => {
    try {
        const aiPlugin = pluginManager.plugins.get('ai对话');
        if (!aiPlugin) {
            return res.status(404).json({ error: 'AI 插件未找到' });
        }

        const { apiKey, currentModel, defaultPrompt, userPrompts } = req.body;

        // 更新设置
        aiPlugin.apiKey = apiKey;
        aiPlugin.currentModel = currentModel;
        aiPlugin.defaultSystemPrompt = defaultPrompt;
        // 使用 setUserPrompt 方法更新每个用户的提示词
        Object.entries(userPrompts).forEach(([userId, prompt]) => {
            aiPlugin.setUserPrompt(userId, prompt, true);  // true 表示是管理员修改
        });

        // 保存配置
        aiPlugin.saveModelConfig();

        res.json({ success: true });
    } catch (error) {
        console.error('保存 AI 设置失败:', error);
        res.status(500).json({ error: '保存设置失败' });
    }
});

// 获取插件代码
app.get('/api/plugins/:command/code', (req, res) => {
    const { command } = req.params;
    try {
        // 获取插件实例
        const plugin = pluginManager.plugins.get(command);
        if (!plugin) {
            return res.status(404).json({ error: '插件不存在' });
        }

        // 获取插件文件路径
        let pluginPath;
        const pluginsDir = path.join(__dirname, 'plugins');
        const items = fs.readdirSync(pluginsDir);
        
        // 遍历查找插件文件
        for (const item of items) {
            const itemPath = path.join(pluginsDir, item);
            const stat = fs.statSync(itemPath);
            
            if (stat.isDirectory()) {
                // 检查目录下的所有 js 文件
                const files = fs.readdirSync(itemPath);
                const jsFiles = files.filter(file => file.endsWith('.js'));
                
                for (const jsFile of jsFiles) {
                    const jsPath = path.join(itemPath, jsFile);
                    try {
                        const Plugin = require(jsPath);
                        const testPlugin = new Plugin();
                        if (testPlugin.command === command) {
                            pluginPath = jsPath;
                            break;
                        }
                    } catch (error) {
                        console.error(`检查插件文件 ${jsFile} 失败:`, error);
                    }
                }
            }
        }

        if (!pluginPath) {
            return res.status(404).json({ error: '插件文件不存在' });
        }

        const code = fs.readFileSync(pluginPath, 'utf8');
        res.json({ code });
    } catch (error) {
        console.error('读取插件代码失败:', error);
        res.status(500).json({ error: '读取插件代码失败' });
    }
});

// 保存插件代码
app.put('/api/plugins/:command/code', (req, res) => {
    const { command } = req.params;
    const { code } = req.body;
    
    try {
        // 获取插件实例
        const plugin = pluginManager.plugins.get(command);
        if (!plugin) {
            return res.status(404).json({ error: '插件不存在' });
        }

        // 获取插件文件路径（使用与上面相同的查找逻辑）
        let pluginPath;
        const pluginsDir = path.join(__dirname, 'plugins');
        const items = fs.readdirSync(pluginsDir);
        
        for (const item of items) {
            const itemPath = path.join(pluginsDir, item);
            const stat = fs.statSync(itemPath);
            
            if (stat.isDirectory()) {
                const files = fs.readdirSync(itemPath);
                const jsFiles = files.filter(file => file.endsWith('.js'));
                
                for (const jsFile of jsFiles) {
                    const jsPath = path.join(itemPath, jsFile);
                    try {
                        const Plugin = require(jsPath);
                        const testPlugin = new Plugin();
                        if (testPlugin.command === command) {
                            pluginPath = jsPath;
                            break;
                        }
                    } catch (error) {
                        console.error(`检查插件文件 ${jsFile} 失败:`, error);
                    }
                }
            }
        }

        if (!pluginPath) {
            return res.status(404).json({ error: '插件文件不存在' });
        }

        // 创建备份
        const backupPath = `${pluginPath}.backup`;
        fs.copyFileSync(pluginPath, backupPath);
        
        // 保存新代码
        fs.writeFileSync(pluginPath, code);
        res.json({ success: true });
    } catch (error) {
        console.error('保存插件代码失败:', error);
        res.status(500).json({ error: '保存插件代码失败' });
    }
});

// 获取插件分组信息
app.get('/api/plugins/groups', (req, res) => {
    try {
        const groups = pluginManager.getGroups();
        res.json(groups);
    } catch (error) {
        console.error('获取插件分组失败:', error);
        res.status(500).json({ error: '获取插件分组失败' });
    }
});

// 更新分组状态
app.put('/api/plugins/groups/:groupName', (req, res) => {
    const { groupName } = req.params;
    const { enabled } = req.body;
    
    try {
        const success = pluginManager.setGroupState(groupName, enabled);
        if (success) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: '分组不存在' });
        }
    } catch (error) {
        console.error('更新分组状态失败:', error);
        res.status(500).json({ error: '更新分组状态失败' });
    }
});

// WebSocket 连接处理
wss.on('connection', (ws) => {
    console.log('新的客户端连接');
    connectedClient = ws;
    // 将 WebSocket 连接设为全局变量，供插件使用
    global.ws = ws;

    // 连接成功后立即获取好友列表和群聊列表
    console.log('正在获取好友和群聊列表...');
    
    // 获取好友列表
    const friendListRequest = {
        action: 'get_friend_list',
        echo: 'get_friend_list'
    };
    ws.send(JSON.stringify(friendListRequest));

    // 获取群聊列表
    const groupListRequest = {
        action: 'get_group_list',
        echo: 'get_group_list'
    };
    ws.send(JSON.stringify(groupListRequest));

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            
            // 处理好友列表响应
            if (data.echo === 'get_friend_list') {
                console.log('\n获取到好友列表:');
                console.log('共有好友:', data.data.length, '个');
                data.data.forEach(friend => {
                    console.log(`QQ: ${friend.user_id}, 昵称: ${friend.nickname}, 备注: ${friend.remark || '无'}`);
                });
                return;
            }

            // 处理群聊列表响应
            if (data.echo === 'get_group_list') {
                console.log('\n获取到群聊列表:');
                console.log('共有群聊:', data.data.length, '个');
                data.data.forEach(group => {
                    console.log(`群号: ${group.group_id}, 群名: ${group.group_name}, 成员数: ${group.member_count}`);
                });
                return;
            }

            // 处理群信息响应
            if (data.echo === 'get_group_info') {
                if (data.status === 'ok' && data.data) {
                    console.log(`群名称: ${data.data.group_name}`);
                }
                return;
            }

            // 处理消息事件
            if (data.post_type === 'message') {
                handleQQMessage(data);
            }

        } catch (error) {
            console.error('消息处理错误:', error);
        }
    });

    // 处理连接关闭
    ws.on('close', () => {
        console.log('客户端断开连接');
        connectedClient = null;
    });

    // 处理错误
    ws.on('error', (error) => {
        console.error('WebSocket 错误:', error);
    });
});

// 生成回复内容的函数
function generateReply(message) {
    if (message.includes('你好')) {
        return '你好！我是机器人';
    }
    if (message.includes('时间')) {
        return `现在是: ${new Date().toLocaleString()}`;
    }
    if (message.includes('帮助')) {
        return '我可以回复以下指令：\n1. 你好\n2. 时间\n3. 帮助';
    }
    return `收到消息: ${message}`;
}

// 处理QQ消息的函数
function handleQQMessage(data) {
    try {
        if (data.message_type === 'private') {
            // 输出私聊消息信息
            console.log('\n[私聊消息]');
            console.log(`发送者: ${data.sender.nickname}(${data.user_id})`);
            
            // 显示消息内容（数组格式）
            if (Array.isArray(data.message)) {
                console.log('消息内容:');
                data.message.forEach(msg => {
                    if (msg.type === 'text') {
                        console.log(`- 文本: ${msg.data.text}`);
                    } else if (msg.type === 'at') {
                        console.log(`- @用户: ${msg.data.qq}`);
                    } else {
                        console.log(`- ${msg.type}: ${JSON.stringify(msg.data)}`);
                    }
                });
            } else {
                console.log(`消息内容: ${data.raw_message}`);
            }
            console.log('------------------------');

            // 解析消息内容
            let messageText = '';
            if (Array.isArray(data.message)) {
                messageText = data.message
                    .filter(msg => msg.type === 'text')
                    .map(msg => msg.data.text)
                    .join('');
            } else {
                messageText = data.raw_message || '';
            }

            // 使用插件系统处理消息
            pluginManager.handleMessage(messageText, data).then(reply => {
                if (reply) {
                    const response = {
                        action: 'send_private_msg',
                        params: {
                            user_id: data.user_id,
                            message: reply
                        }
                    };
                    
                    if (connectedClient) {
                        connectedClient.send(JSON.stringify(response));
                        console.log('[机器人回复]');
                        console.log(reply);
                        console.log('------------------------');
                    }
                }
            }).catch(error => {
                console.error('插件处理错误:', error);
            });
        }
        // 处理群消息
        else if (data.message_type === 'group') {
            // 检查群是否启用
            if (!pluginManager.isGroupEnabled(data.group_id)) {
                console.log(`群 ${data.group_id} 未启用机器人`);
                return;
            }

            // 输出消息信息（无论是否被插件处理）
            console.log('\n[群消息]');
            console.log(`群聊: ${data.group_name}(${data.group_id})`);
            console.log(`发送者: ${data.sender.nickname}(${data.user_id})`);
            
            // 显示消息内容（数组格式）
            if (Array.isArray(data.message)) {
                console.log('消息内容:');
                data.message.forEach(msg => {
                    if (msg.type === 'text') {
                        console.log(`- 文本: ${msg.data.text}`);
                    } else if (msg.type === 'at') {
                        console.log(`- @用户: ${msg.data.qq}`);
                    } else {
                        console.log(`- ${msg.type}: ${JSON.stringify(msg.data)}`);
                    }
                });
            } else {
                console.log(`消息内容: ${data.raw_message}`);
            }
            console.log('------------------------');

            // 解析消息内容
            let messageText = '';
            if (Array.isArray(data.message)) {
                messageText = data.message
                    .filter(msg => msg.type === 'text')
                    .map(msg => msg.data.text)
                    .join('');
            } else {
                messageText = data.raw_message || '';
            }

            // 使用插件系统处理消息
            pluginManager.handleMessage(messageText, data).then(reply => {
                if (reply) {
                    const response = {
                        action: 'send_group_msg',
                        params: {
                            group_id: data.group_id,
                            message: reply
                        }
                    };
                    
                    if (connectedClient) {
                        connectedClient.send(JSON.stringify(response));
                        console.log('[机器人回复]');
                        console.log(reply);
                        console.log('------------------------');
                    }
                }
            }).catch(error => {
                console.error('插件处理错误:', error);
            });
        }
    } catch (error) {
        console.error('处理消息错误:', error);
    }
}

// 创建一个简单的API接口来手动发送消息
app.post('/send', (req, res) => {
    if (!connectedClient) {
        return res.status(400).json({ error: '没有连接的客户端' });
    }

    try {
        connectedClient.send(JSON.stringify(req.body));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: '发送消息失败' });
    }
});

// 获取服务启动时间
let startTime = new Date();

// 获取系统运行信息
app.get('/api/system/status', (req, res) => {
    try {
        const uptime = Math.floor((new Date() - startTime) / 1000); // 转换为秒
        const formatUptime = (seconds) => {
            const days = Math.floor(seconds / (3600 * 24));
            const hours = Math.floor((seconds % (3600 * 24)) / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const parts = [];
            if (days > 0) parts.push(`${days}天`);
            if (hours > 0) parts.push(`${hours}小时`);
            if (minutes > 0) parts.push(`${minutes}分钟`);
            return parts.join('') || '刚刚启动';
        };

        // 获取 PM2 进程信息
        const pm2Status = {
            uptime: formatUptime(uptime),
            startTime: startTime.toLocaleString(),
            memoryUsage: process.memoryUsage().heapUsed,
            wsConnected: !!connectedClient,
        };

        res.json(pm2Status);
    } catch (error) {
        console.error('获取系统状态失败:', error);
        res.status(500).json({ error: '获取系统状态失败' });
    }
});

// 启动服务器
const PORT = process.env.PORT || 8082;
server.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
}); 