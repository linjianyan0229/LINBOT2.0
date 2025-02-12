class ShutdownPlugin {
    constructor(pluginManager) {
        this.description = '关闭机器人 (用法：关机 关闭机器人[管理员])';
        this.command = '关机';
        this.enabled = true;
        this.adminQQ = ['2259596781']; // 管理员QQ号列表
        this.pluginManager = pluginManager;
    }

    // 检查是否是管理员
    isAdmin(userId) {
        return this.adminQQ.includes(userId.toString());
    }

    async handle(message, context) {
        if (!context || !context.user_id) {
            return null;
        }

        const userId = context.user_id;
        const messageText = message.trim();

        if (messageText === '关机') {
            // 检查是否是管理员
            if (!this.isAdmin(userId)) {
                return '抱歉，只有管理员才能关闭机器人哦~';
            }

            // 直接返回关机消息
            const reply = '正在关闭机器人...\n如需重新启动，请手动执行 pm2 start qq-bot 命令';
            
            // 延迟1秒后退出进程
            setTimeout(() => {
                console.log('正在关闭机器人...');
                // 使用退出码 1 表示需要停止
                process.exit(1);
            }, 1000);
            
            return reply;
        }

        return null;
    }
}

module.exports = ShutdownPlugin; 