const axios = require('axios');
const fs = require('fs');
const path = require('path');
const tunnel = require('tunnel');

class AIChatPlugin {
    constructor(pluginManager) {
        this.description = 'AI对话 (用法：ai对话 开始对话，设置提示词[管理员] 更改AI设定，切换模型[管理员] 更改AI模型)';
        this.command = 'ai对话';
        this.enabled = true;
        this.activeUsers = new Set();
        this.settingPrompt = new Set();
        this.settingModel = new Set();
        this.adminQQ = ['2259596781']; // 管理员QQ号列表

        // 默认系统提示词
        this.defaultSystemPrompt = "你是一个友好、专业的AI助手，擅长用简单易懂的方式解答问题。";
        
        // 设置文件路径
        this.promptConfigFile = path.join(__dirname, 'prompt_config.json');
        this.modelConfigFile = path.join(__dirname, 'model_config.json');
        this.historyDir = path.join(__dirname, 'history');

        // 初始化配置
        this.models = {
            'deepseek-chat': 'DeepSeek-V3 通用对话模型',
            'deepseek-reasoner': 'DeepSeek-R1 推理增强模型'
        };
        this.apiKey = 'sk-ac921f6c00874e91a9118e4c7c048558';
        this.apiUrl = 'https://api.deepseek.com/v1/chat/completions';

        // 初始化 API 客户端
        const agent = tunnel.httpsOverHttp({
            proxy: {
                host: '127.0.0.1',
                port: 7897
            }
        });

        this.axiosInstance = axios.create({
            baseURL: this.apiUrl,
            timeout: 60000,
            httpsAgent: agent,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            }
        });

        // 确保目录存在
        if (!fs.existsSync(this.historyDir)) {
            fs.mkdirSync(this.historyDir, { recursive: true });
        }

        // 加载配置
        this.loadPromptConfig();
        this.loadModelConfig();
    }

    // 加载提示词配置
    loadPromptConfig() {
        try {
            if (fs.existsSync(this.promptConfigFile)) {
                const data = fs.readFileSync(this.promptConfigFile, 'utf8');
                this.userPrompts = JSON.parse(data);
            } else {
                this.userPrompts = {};
                this.savePromptConfig();
            }
        } catch (error) {
            console.error('加载提示词配置失败:', error);
            this.userPrompts = {};
        }
    }

    // 保存提示词配置
    savePromptConfig() {
        try {
            const configDir = path.dirname(this.promptConfigFile);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            
            const data = JSON.stringify(this.userPrompts, null, 2);
            fs.writeFileSync(this.promptConfigFile, data);
            console.log('提示词配置已保存:', data);
        } catch (error) {
            console.error('保存提示词配置失败:', error);
        }
    }

    // 设置用户的提示词
    setUserPrompt(userId, prompt) {
        this.userPrompts[userId] = prompt;
        console.log('保存提示词:', {
            userId,
            prompt,
            allPrompts: this.userPrompts
        });
        this.savePromptConfig();
    }

    // 获取用户的提示词
    getUserPrompt(userId) {
        return this.userPrompts[userId] || this.defaultSystemPrompt;
    }

    // 获取用户历史记录文件路径
    getUserHistoryPath(userId) {
        return path.join(this.historyDir, `${userId}.json`);
    }

    // 加载用户历史记录
    loadUserHistory(userId) {
        const historyPath = this.getUserHistoryPath(userId);
        try {
            if (fs.existsSync(historyPath)) {
                const data = fs.readFileSync(historyPath, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('加载用户历史记录失败:', error);
        }
        // 使用用户的自定义提示词或默认提示词
        return [{
            role: "system",
            content: this.getUserPrompt(userId)
        }];
    }

    // 保存用户历史记录
    async saveUserHistory(userId, messages) {
        const historyPath = this.getUserHistoryPath(userId);
        try {
            await fs.promises.writeFile(
                historyPath, 
                JSON.stringify(messages, null, 2),
                { flag: 'w' }  // 使用 'w' 模式覆盖写入
            );
        } catch (error) {
            console.error('保存用户历史记录失败:', error);
        }
    }

    // 检查是否是管理员
    isAdmin(userId) {
        return this.adminQQ.includes(userId.toString());
    }

    // 加载模型配置
    loadModelConfig() {
        try {
            if (fs.existsSync(this.modelConfigFile)) {
                const data = fs.readFileSync(this.modelConfigFile, 'utf8');
                const config = JSON.parse(data);
                this.currentModel = config.currentModel;
            } else {
                this.currentModel = 'deepseek-chat'; // 默认模型
                this.saveModelConfig();
            }
        } catch (error) {
            console.error('加载模型配置失败:', error);
            this.currentModel = 'deepseek-chat';
        }
    }

    // 保存模型配置
    saveModelConfig() {
        try {
            const configDir = path.dirname(this.modelConfigFile);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            
            const config = {
                currentModel: this.currentModel
            };
            
            fs.writeFileSync(this.modelConfigFile, JSON.stringify(config, null, 2));
            console.log('模型配置已保存:', config);
        } catch (error) {
            console.error('保存模型配置失败:', error);
        }
    }

    async handle(messageText, context) {
        const userId = context.user_id;
        console.log('AI对话处理开始:', { userId, messageText });
        
        try {
            if (!context || !context.user_id) {
                return null;
            }

            messageText = messageText.trim();

            console.log('当前状态:', {
                userId,
                isActive: this.activeUsers.has(userId),
                isSetting: this.settingPrompt.has(userId),
                message: messageText
            });

            // 处理开启对话命令
            if (messageText === 'ai对话') {
                this.activeUsers.add(userId);
                this.settingPrompt.delete(userId);  // 清除可能的设置状态
                
                // 重新加载提示词配置
                this.loadPromptConfig();
                
                // 创建新的对话历史，使用最新的提示词
                const messages = [{
                    role: "system",
                    content: this.getUserPrompt(userId)
                }];
                this.saveUserHistory(userId, messages);
                
                return '来啦来啦，宝宝。现在可以直接和我对话啦！\n输入"设置提示词"可以设置我的性格哦~\n输入"结束对话"结束对话。';
            }

            // 处理结束对话命令
            if (messageText === '结束对话') {
                this.activeUsers.delete(userId);
                this.settingPrompt.delete(userId);
                return '宝宝下次陪我多聊聊嘛，QAQ！';
            }

            // 处理设置提示词命令
            if (messageText === '设置提示词') {
                this.settingPrompt.add(userId);
                return '请告诉我你希望我是什么样的助手呢？\n例如：\n- 你是一个可爱的猫娘助手\n- 你是一个专业的程序员\n- 你是一个知识渊博的历史学家\n\n发送你想要的设定就可以啦~';
            }

            // 处理提示词设置
            if (this.settingPrompt.has(userId)) {
                const newPrompt = messageText.trim();
                if (!newPrompt) {
                    return '提示词不能为空哦~';
                }

                console.log('设置新提示词:', {
                    userId,
                    prompt: newPrompt
                });

                // 保存新提示词
                this.setUserPrompt(userId, newPrompt);
                
                // 清空历史记录，使用新的提示词
                const messages = [{
                    role: "system",
                    content: newPrompt
                }];
                this.saveUserHistory(userId, messages);

                // 更新状态
                this.settingPrompt.delete(userId);
                this.activeUsers.add(userId);

                return `好的主人~我已经记住新的设定啦！\n现在的我是：${newPrompt}\n\n让我们开始对话吧！`;
            }

            // 处理切换模型命令
            if (messageText === '切换模型') {
                if (!this.isAdmin(userId)) {
                    return '抱歉，只有管理员才能切换模型呢~ (*/ω＼*)';
                }
                this.settingModel.add(userId);
                const modelList = Object.entries(this.models)
                    .map(([id, desc]) => `${id}: ${desc}`)
                    .join('\n');
                return `请选择要使用的模型：\n当前模型：${this.currentModel} (${this.models[this.currentModel]})\n\n可用模型：\n${modelList}\n\n请直接输入模型ID进行切换`;
            }

            // 处理模型切换
            if (this.settingModel.has(userId)) {
                if (!this.isAdmin(userId)) {
                    this.settingModel.delete(userId);
                    return '抱歉，只有管理员才能切换模型呢~ (*/ω＼*)';
                }
                
                const modelId = messageText.trim();
                if (!this.models[modelId]) {
                    return `无效的模型ID，可用的模型有：\n${Object.keys(this.models).join('\n')}`;
                }
                
                this.currentModel = modelId;
                this.saveModelConfig();  // 保存模型配置
                this.settingModel.delete(userId);
                return `模型已切换为：${modelId} (${this.models[modelId]})\n现在可以继续对话啦~`;
            }

            // 如果用户不在对话模式且不在设置提示词模式，直接返回
            if (!this.activeUsers.has(userId)) {
                return null;
            }

            // 加载用户历史记录
            const messages = this.loadUserHistory(userId);
            
            // 添加用户消息
            messages.push({ role: "user", content: messageText });

            // 调用 DeepSeek API
            const response = await this.axiosInstance.post(this.apiUrl, {
                model: this.currentModel,
                messages: messages,
                max_tokens: 4096,
                stream: false,
            });

            // 如果是推理模型，记录推理过程
            if (this.currentModel === 'deepseek-reasoner' && response.data.choices[0].message.reasoning_content) {
                console.log('\n=== 推理过程 ===');
                console.log(response.data.choices[0].message.reasoning_content);
                console.log('================\n');
            }

            const reply = response.data.choices[0].message.content;

            // 添加助手回复（不包含推理过程）
            messages.push({ role: "assistant", content: reply });

            // 保持历史记录在合理范围内（最多保留10条对话）
            if (messages.length > 11) {
                messages.splice(1, messages.length - 11);
            }

            // 保存更新后的历史记录
            this.saveUserHistory(userId, messages);

            return reply;
        } catch (error) {
            console.error('AI对话处理错误:', error);
            return '抱歉，AI对话出现错误，请稍后再试。';
        }
    }
}

module.exports = AIChatPlugin;