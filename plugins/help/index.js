class HelpPlugin {
    constructor(pluginManager) {
        this.description = '显示帮助信息';
        this.command = '帮助';  // 定义触发命令
        this.enabled = true; // 添加启用状态属性
        this.pluginManager = pluginManager;
    }

    async handle(message) {
        // 只显示已启用的插件
        let help = '支持的命令：\n';
        for (const [command, plugin] of this.pluginManager.plugins) {
            if (plugin.enabled) {
                help += `${command}: ${plugin.description}\n`;
            }
        }
        return help;
    }
}

module.exports = HelpPlugin; 