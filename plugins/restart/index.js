const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class RestartPlugin {
    constructor(pluginManager) {
        this.description = '重启机器人（仅管理员可用）';
        this.command = '重启';
        this.enabled = true;
        this.configFile = path.join(__dirname, 'config.json');
        this.loadConfig();
    }

    // 加载配置文件
    loadConfig() {
        try {
            if (fs.existsSync(this.configFile)) {
                const data = fs.readFileSync(this.configFile, 'utf8');
                this.config = JSON.parse(data);
            } else {
                // 默认配置
                this.config = {
                    adminQQ: ['2259596781'] // 替换为实际的管理员QQ号
                };
                this.saveConfig();
            }
        } catch (error) {
            console.error('加载重启插件配置失败:', error);
            this.config = {
                adminQQ: ['123456789']
            };
        }
    }

    // 保存配置文件
    saveConfig() {
        try {
            fs.writeFileSync(this.configFile, JSON.stringify(this.config, null, 2));
        } catch (error) {
            console.error('保存重启插件配置失败:', error);
        }
    }

    // 检查是否是管理员
    isAdmin(userId) {
        return this.config.adminQQ.includes(userId.toString());
    }

    // 执行重启
    async executeRestart() {
        console.log('主人，我要重启啦...');
        
        try {
            const reply = '好的主人，我去重启一下，马上就回来找你~';
            
            setTimeout(() => {
                if (global.ws) {
                    global.ws.close();
                }
                console.log('正在重启机器人...');
                
                // 使用 PM2 命令行重启
                exec('pm2 restart qq-bot', (error) => {
                    if (error) {
                        console.error('PM2 重启失败:', error);
                        process.exit(0);  // 如果命令执行失败，使用进程退出作为备选方案
                    }
                });
            }, 1000);
            
            return reply;
        } catch (error) {
            console.error('重启失败:', error);
            return '呜呜呜，重启失败了，请检查一下我的状态...';
        }
    }

    async handle(message, context) {
        if (!context || !context.user_id) {
            return null;
        }

        // 检查是否是管理员
        if (!this.isAdmin(context.user_id)) {
            return '抱歉呢，你不是我的主人呢~ (*/ω＼*)';
        }

        return await this.executeRestart();
    }
}

module.exports = RestartPlugin; 