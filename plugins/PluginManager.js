const fs = require('fs');
const path = require('path');

class PluginManager {
    constructor() {
        this.plugins = new Map();
        this.groups = new Map();  // 存储插件组信息
        this.configPath = path.join(__dirname, 'config.json');
        this.loadConfig();
        this.loadPlugins();
        this.syncConfig();
    }

    // 加载配置文件
    loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
                this.pluginStates = config.pluginStates || {};
                this.groupStates = config.groupStates || {};
                this.groupSettings = config.groupStates || {};
            } else {
                this.pluginStates = {};
                this.groupStates = {};
                this.groupSettings = {};
                this.saveConfig();
            }
        } catch (error) {
            console.error('加载配置文件失败:', error);
            this.pluginStates = {};
            this.groupStates = {};
            this.groupSettings = {};
        }
    }

    // 同步配置文件
    syncConfig() {
        try {
            // 获取当前加载的所有插件命令
            const currentPlugins = new Set(this.plugins.keys());
            
            // 获取配置文件中的所有插件
            const configuredPlugins = new Set(Object.keys(this.pluginStates));
            
            // 找出需要删除的插件（在配置中但不在当前插件列表中）
            const pluginsToRemove = new Set(
                [...configuredPlugins].filter(x => !currentPlugins.has(x))
            );
            
            // 找出需要添加的插件（在当前插件列表中但不在配置中）
            const pluginsToAdd = new Set(
                [...currentPlugins].filter(x => !configuredPlugins.has(x))
            );

            // 删除不存在的插件配置
            for (const plugin of pluginsToRemove) {
                delete this.pluginStates[plugin];
                console.log(`已从配置文件中移除不存在的插件: ${plugin}`);
            }

            // 添加新插件的配置
            for (const plugin of pluginsToAdd) {
                const pluginInstance = this.plugins.get(plugin);
                if (pluginInstance) {
                    this.pluginStates[plugin] = pluginInstance.enabled;
                    console.log(`已将新插件添加到配置文件: ${plugin}`);
                }
            }

            // 如果有变更，保存配置
            if (pluginsToRemove.size > 0 || pluginsToAdd.size > 0) {
                this.saveConfig();
                console.log('配置文件已同步');
            }
        } catch (error) {
            console.error('同步配置文件失败:', error);
        }
    }

    // 保存配置文件
    saveConfig() {
        try {
            // 创建备份
            if (fs.existsSync(this.configPath)) {
                const backupPath = `${this.configPath}.backup`;
                fs.copyFileSync(this.configPath, backupPath);
            }

            // 保存新配置
            const config = {
                pluginStates: this.pluginStates,
                groupStates: this.groupStates,
                groupStates: this.groupSettings
            };
            
            fs.writeFileSync(
                this.configPath, 
                JSON.stringify(config, null, 2)
            );
        } catch (error) {
            console.error('保存配置文件失败:', error);
            // 如果保存失败且存在备份，恢复备份
            const backupPath = `${this.configPath}.backup`;
            if (fs.existsSync(backupPath)) {
                try {
                    fs.copyFileSync(backupPath, this.configPath);
                    console.log('已恢复配置文件备份');
                } catch (backupError) {
                    console.error('恢复配置文件备份失败:', backupError);
                }
            }
        }
    }

    // 递归扫描插件目录
    scanPlugins(dir = __dirname) {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            if (item === 'PluginManager.js' || item === 'config.json') continue;
            
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                // 第二级目录作为分组
                if (dir === __dirname) {
                    const groupName = item;
                    const groupInfo = {
                        name: groupName,
                        enabled: this.groupStates[groupName] !== false,
                        plugins: []
                    };
                    
                    // 递归扫描分组内的所有目录
                    const scanDir = (currentPath) => {
                        const files = fs.readdirSync(currentPath);
                        for (const file of files) {
                            const filePath = path.join(currentPath, file);
                            const fileStat = fs.statSync(filePath);
                            
                            if (fileStat.isDirectory()) {
                                // 递归扫描子目录
                                scanDir(filePath);
                            } else if (file.endsWith('.js')) {
                                try {
                                    const Plugin = require(filePath);
                                    const plugin = new Plugin(this);
                                    
                                    // 添加插件到分组
                                    groupInfo.plugins.push({
                                        command: plugin.command,
                                        description: plugin.description,
                                        filename: path.relative(fullPath, filePath),
                                        enabled: this.pluginStates[plugin.command] !== false
                                    });
                                    
                                    // 设置插件状态
                                    plugin.enabled = this.pluginStates[plugin.command] !== false;
                                    
                                    // 将插件添加到管理器
                                    this.plugins.set(plugin.command, plugin);
                                } catch (error) {
                                    console.error(`加载插件 ${filePath} 失败:`, error);
                                }
                            }
                        }
                    };
                    
                    // 开始扫描分组目录
                    scanDir(fullPath);
                    
                    // 保存分组信息
                    this.groups.set(groupName, groupInfo);
                }
            }
        }
    }

    // 递归加载插件
    loadPlugins() {
        this.plugins.clear();
        this.groups.clear();
        this.scanPlugins();
        this.saveConfig();
        console.log('插件加载完成，当前已加载插件：', Array.from(this.plugins.keys()));
    }

    // 从目录加载插件
    loadPluginsFromDirectory(directory) {
        const items = fs.readdirSync(directory);
        
        for (const item of items) {
            const itemPath = path.join(directory, item);
            
            // 跳过 PluginManager 和配置文件
            if (item === 'PluginManager.js' || item === 'config.json') {
                continue;
            }

            try {
                const stat = fs.statSync(itemPath);
                
                if (stat.isDirectory()) {
                    // 如果是目录，检查是否包含 .js 文件
                    const files = fs.readdirSync(itemPath);
                    const jsFiles = files.filter(file => file.endsWith('.js'));
                    
                    for (const jsFile of jsFiles) {
                        this.loadPluginFile(path.join(itemPath, jsFile), item);
                    }
                } else if (stat.isFile() && item.endsWith('.js')) {
                    // 如果是 JS 文件，直接加载
                    this.loadPluginFile(itemPath);
                }
            } catch (error) {
                console.error(`加载 ${item} 时出错:`, error);
            }
        }
    }

    // 加载插件文件
    loadPluginFile(filePath, folderName = null) {
        try {
            const Plugin = require(filePath);
            const plugin = new Plugin(this);
            
            // 获取插件命令名
            let command = plugin.command;
            
            // 如果插件没有定义命令，使用文件名或文件夹名
            if (!command) {
                const fileName = path.basename(filePath, '.js');
                command = folderName || fileName;
            }
            
            // 检查插件是否有效
            if (this.isValidPlugin(plugin)) {
                // 从配置文件加载插件状态
                plugin.enabled = this.pluginStates[command] !== false; // 默认为启用
                this.register(command, plugin);
            } else {
                console.warn(`插件 ${command} 无效，已跳过加载`);
            }
        } catch (error) {
            console.error(`加载插件文件 ${filePath} 失败:`, error);
        }
    }

    // 检查插件是否有效
    isValidPlugin(plugin) {
        return plugin && 
               typeof plugin.handle === 'function' && 
               typeof plugin.description === 'string';
    }

    // 注册插件
    register(command, plugin) {
        if (this.plugins.has(command)) {
            console.log(`插件 ${command} 已存在，跳过加载`);
            return;
        }
        
        this.plugins.set(command, plugin);
        
        // 如果配置文件中没有该插件的状态，添加它
        if (this.pluginStates[command] === undefined) {
            this.pluginStates[command] = plugin.enabled;
            this.saveConfig();
            console.log(`新插件 ${command} 已添加到配置文件`);
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

            // 修改为前缀匹配（支持带参数）
            if (message.trim().startsWith(command + ' ') || message.trim() === command) {
                // 如果插件被禁用，返回提示信息
                if (!plugin.enabled) {
                    return `插件 ${command} 已被禁用，请联系管理员启用。`;
                }

                try {
                    // 传递去除命令后的消息内容
                    const args = message.trim().slice(command.length).trim();
                    return await plugin.handle(args, context);
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

    // 获取插件分组信息
    getGroups() {
        const groups = [];
        for (const [name, info] of this.groups) {
            // 更新分组内插件的状态
            info.plugins = info.plugins.map(plugin => ({
                ...plugin,
                enabled: this.pluginStates[plugin.command] !== false
            }));

            groups.push({
                name,
                enabled: info.enabled,
                plugins: info.plugins
            });
        }
        return groups;
    }

    // 设置分组状态
    setGroupState(groupName, enabled) {
        const group = this.groups.get(groupName);
        if (group) {
            group.enabled = enabled;
            this.groupStates[groupName] = enabled;
            
            // 更新组内所有插件状态
            group.plugins.forEach(plugin => {
                const p = this.plugins.get(plugin.command);
                if (p) {
                    p.enabled = enabled;
                    this.pluginStates[plugin.command] = enabled;
                }
            });
            
            this.saveConfig();
            return true;
        }
        return false;
    }
}

module.exports = PluginManager; 