const fs = require('fs');
const path = require('path');

class PluginManager {
    constructor() {
        this.plugins = new Map();
        this.configPath = path.join(__dirname, 'config.json');
        this.loadConfig();
        this.loadPlugins();
    }

    // 加载配置文件
    loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
                this.pluginStates = config.pluginStates || {};
                this.groupStates = config.groupStates || {};
            } else {
                this.pluginStates = {};
                this.groupStates = {};
                this.saveConfig();
            }
        } catch (error) {
            console.error('加载配置文件失败:', error);
            this.pluginStates = {};
            this.groupStates = {};
        }
    }

    // 保存配置文件
    saveConfig() {
        try {
            const config = {
                pluginStates: this.pluginStates,
                groupStates: this.groupStates
            };
            fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
        } catch (error) {
            console.error('保存配置文件失败:', error);
        }
    }

    // 自动加载插件
    loadPlugins() {
        const pluginsDir = path.join(__dirname);
        const items = fs.readdirSync(pluginsDir);
        
        for (const item of items) {
            const itemPath = path.join(pluginsDir, item);
            
            if (item === 'PluginManager.js' || item === 'config.json' || !fs.statSync(itemPath).isDirectory()) {
                continue;
            }

            try {
                const Plugin = require(path.join(itemPath, 'index.js'));
                const plugin = new Plugin(this);
                const command = plugin.command || item;
                
                // 从配置文件加载插件状态
                plugin.enabled = this.pluginStates[command] !== false; // 默认为启用
                this.register(command, plugin);
            } catch (error) {
                console.error(`加载插件 ${item} 失败:`, error);
            }
        }
    }

    register(command, plugin) {
        if (this.plugins.has(command)) {
            console.log(`插件 ${command} 已存在，跳过加载`);
            return;
        }
        this.plugins.set(command, plugin);
        // 保存初始状态到配置
        if (this.pluginStates[command] === undefined) {
            this.pluginStates[command] = plugin.enabled;
            this.saveConfig();
        }
        console.log(`插件 ${command} 已注册，状态: ${plugin.enabled ? '启用' : '禁用'}`);
    }

    // 更新插件状态
    updatePluginState(command, enabled) {
        const plugin = this.plugins.get(command);
        if (plugin) {
            plugin.enabled = enabled;
            this.pluginStates[command] = enabled;
            this.saveConfig();
            return true;
        }
        return false;
    }

    // 处理消息
    async handleMessage(message, context) {
        // 先检查是否完全匹配任何命令
        for (const [command, plugin] of this.plugins) {
            // 检查插件是否启用
            if (!plugin.enabled) {
                continue;
            }

            // 如果是命令匹配
            if (message.trim() === command) {
                // 如果插件被禁用，返回提示信息
                if (!plugin.enabled) {
                    return `插件 ${command} 已被禁用，请联系管理员启用。`;
                }

                try {
                    return await plugin.handle(message, context);
                } catch (error) {
                    console.error(`插件 ${command} 处理错误:`, error);
                    return `处理命令 ${command} 时出错`;
                }
            }

            // 如果用户在对话模式中，继续处理消息
            if (plugin.activeUsers && plugin.activeUsers.has(context.user_id)) {
                try {
                    const reply = await plugin.handle(message, context);
                    if (reply) {
                        return reply;
                    }
                } catch (error) {
                    console.error(`插件 ${command} 处理错误:`, error);
                }
            }
        }
        return null;
    }

    getDefaultReply(message) {
        return `收到消息: ${message}\n输入 "帮助" 查看支持的命令`;
    }

    getHelpText() {
        let help = '支持的命令：\n';
        for (const [command, plugin] of this.plugins) {
            help += `${command}: ${plugin.description}\n`;
        }
        return help;
    }

    // 检查群聊是否启用
    isGroupEnabled(group_id) {
        return this.groupStates && this.groupStates[group_id] === true;
    }

    // 设置群聊状态
    setGroupState(group_id, enabled) {
        if (!this.groupStates) {
            this.groupStates = {};
        }
        this.groupStates[group_id] = enabled;
        this.saveConfig();
        return true;
    }
}

module.exports = PluginManager; 