class UserInfoPlugin {
    constructor(pluginManager) {
        this.description = '查看个人信息';
        this.command = '个人信息';  // 定义触发命令
        this.enabled = true;
    }

    async handle(message, context) {
        if (!context || !context.sender) {
            return '无法获取用户信息';
        }

        try {
            let info = [
                '=== 个人信息 ===',
                `名称：${context.sender.nickname}`,
                `QQ号：${context.user_id}`
            ];

            // 如果是群聊消息，获取更多群相关信息
            if (context.message_type === 'group') {
                // 生成唯一的echo标识
                const groupEcho = `get_group_member_info_${Date.now()}`;
                const memberInfo = await this.getGroupMemberInfo(
                    context.group_id,
                    context.user_id,
                    groupEcho
                );

                info = info.concat([
                    `群名片：${memberInfo.card || '无'}`,
                    `群身份：${this.getRoleText(memberInfo.role)}`,
                    `群等级：${memberInfo.level || '0'}`,
                    `入群时间：${this.formatTime(memberInfo.join_time)}`
                ]);
            }

            // 获取用户资料卡
            const strangerEcho = `get_stranger_info_${Date.now()}`;
            const userInfo = await this.getStrangerInfo(context.user_id, strangerEcho);
            info = info.concat([
                `聊天气泡：${userInfo.qid || '未设置'}`,
                `注册时间：${this.formatTime(userInfo.join_time)}`
            ]);

            return info.join('\n');
        } catch (error) {
            console.error('获取用户信息失败:', error);
            return '获取用户信息失败，请稍后再试';
        }
    }

    // 获取群成员信息
    async getGroupMemberInfo(group_id, user_id, echo) {
        return new Promise((resolve, reject) => {
            const request = {
                action: 'get_group_member_info',
                params: {
                    group_id: Number(group_id),
                    user_id: Number(user_id),
                    no_cache: true
                },
                echo: echo
            };

            // 发送请求并等待响应
            global.ws.send(JSON.stringify(request));
            
            const messageHandler = (msg) => {
                try {
                    const response = JSON.parse(msg);
                    if (response.echo === echo) {
                        global.ws.removeListener('message', messageHandler);
                        if (response.status === 'ok') {
                            resolve(response.data);
                        } else {
                            reject(new Error(response.msg || '获取群成员信息失败'));
                        }
                    }
                } catch (error) {
                    // 不在这里reject，因为可能是其他消息
                    console.error('解析消息失败:', error);
                }
            };

            global.ws.on('message', messageHandler);

            // 设置超时
            setTimeout(() => {
                global.ws.removeListener('message', messageHandler);
                reject(new Error('获取群成员信息超时'));
            }, 10000); // 增加超时时间到10秒
        });
    }

    // 获取陌生人信息
    async getStrangerInfo(user_id, echo) {
        return new Promise((resolve, reject) => {
            const request = {
                action: 'get_stranger_info',
                params: {
                    user_id: Number(user_id),
                    no_cache: true
                },
                echo: echo
            };

            // 发送请求并等待响应
            global.ws.send(JSON.stringify(request));
            
            const messageHandler = (msg) => {
                try {
                    const response = JSON.parse(msg);
                    if (response.echo === echo) {
                        global.ws.removeListener('message', messageHandler);
                        if (response.status === 'ok') {
                            resolve(response.data);
                        } else {
                            reject(new Error(response.msg || '获取用户信息失败'));
                        }
                    }
                } catch (error) {
                    // 不在这里reject，因为可能是其他消息
                    console.error('解析消息失败:', error);
                }
            };

            global.ws.on('message', messageHandler);

            // 设置超时
            setTimeout(() => {
                global.ws.removeListener('message', messageHandler);
                reject(new Error('获取用户信息超时'));
            }, 10000); // 增加超时时间到10秒
        });
    }

    getRoleText(role) {
        const roles = {
            'owner': '群主',
            'admin': '管理员',
            'member': '群员'
        };
        return roles[role] || '未知';
    }

    formatTime(timestamp) {
        if (!timestamp) return '未知';
        const date = new Date(timestamp * 1000);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }
}

module.exports = UserInfoPlugin; 