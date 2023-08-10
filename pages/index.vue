<template>
	<div class="overflow-hidden w-full h-screen relative flex">
		<Sidebar />
		<div class="ai-chat flex h-full max-w-full flex-1 flex-col">
			<!-- 工具栏 -->
			<div class="tool-box px-8">
				<!-- 模型选择 -->
				<div class="select-box">
					<span class="select-tip">模型</span>
					<el-select v-model="chatConfig.model" placeholder="请选择模型">
						<el-option
							v-for="model in models"
							:key="model"
							:value="model"
							:label="model"
						></el-option>
					</el-select>
				</div>
			</div>
			<!-- chat 列表 -->
			<el-scrollbar ref="scrollbar" height="100%">
				<div ref="chatListRef" class="chat-list-box">
					<!-- chat item -->
					<ChatItem
						@rebuildChat="rebuildChat"
						@endChat="endChat"
						@deleteChatItem="deleteChatItem"
						:chatData="chat"
						:state="state"
						v-for="(chat, index) in chatList"
						:key="index"
					/>
				</div>
			</el-scrollbar>
			<!-- 底部输入框 -->
			<div class="bottom-box left-0 md:left-[260px]">
				<!-- 重新生成按钮 -->
				<!-- 暂停按钮 -->
				<!-- <button class="bottom-push-btn" @click="endChat">暂停生成</button> -->
				<Transition name="bottom-v-slide">
					<el-button
						class="bottom-push-btn"
						v-show="state == 'loading'"
						type="primary"
						@click="endChat"
					>
						<i class="icon-stop iconfont"></i>
						<span>暂停生成</span>
					</el-button>
				</Transition>
				<Transition name="bottom-input">
					<div class="input-box" v-show="state != 'loading'">
						<el-input v-model="chatValue" size="large" @keyup.enter.native="submitChat" />
						<el-button
							@click="submitChat"
							v-if="state == 'stop' || state == 'wait'"
							size="large"
							type="primary"
						>
							提交
						</el-button>
					</div>
				</Transition>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import {ElMessage} from 'element-plus';
import {onMounted, reactive, ref} from 'vue';
import {fetchEventSource} from '@microsoft/fetch-event-source';
import {Ichat, IchatMessage, IchatResult} from '@/types/openai';
import {useChatConfigStore} from '@/store/config';
import ChatItem from '@/components/chatItem.vue';
import moment from 'moment';
import {v4 as uuidv4} from 'uuid';
import 'github-markdown-css';
import {storeToRefs} from 'pinia';
import Sidebar from '@/components/sidebar/sidebar.vue';
import {useChatHistoryStore} from '@/store/chatHistory';
import deepcopy from 'deepcopy';
import axios from 'axios';

/** config store */
const chatConfigStore = useChatConfigStore();
const {chatConfig, openaiConfig} = storeToRefs(chatConfigStore);
/** chathistory store */
const chatHistoryStore = useChatHistoryStore();
const {currentChatId, chatHistory} = storeToRefs(chatHistoryStore);
/** config store */

/** 运行状态 */
const state = ref<'loading' | 'stop' | 'wait'>('wait');

/** scroll bar ref */
const scrollbar = ref();
/** chatListRef */
const chatListRef = ref();
/** 提交chat内容 */
const chatValue = ref<string>('');
const now = moment();
/** 聊天列表 */
const chatList = reactive<Ichat[]>([]);
/** 如果当前聊天id改变，修改chatList为历史记录 */
watch(
	() => currentChatId.value,
	(newValue) => {
		if (newValue != '') {
			chatList.length = 0;
			const chatHistory = chatHistoryStore.getChatHistoryById(newValue);
			if (chatHistory) {
				chatList.length = 0;
				chatList.push(...chatHistory.messages);
			}
			// 滚动到底部
			nextTick(() => {
				scrollbar.value.setScrollTop(chatListRef.value.clientHeight);
			});
		}
	}
);
watch(chatList, (newValue) => {
	if (currentChatId.value != '' && chatList.length > 0) {
		chatHistoryStore.setChatMessage(currentChatId.value, deepcopy(newValue));
	}
});

/** 生成标题 */
const generateTitle = () => {
	// 如果没有标题，使用gpt生成个标题
	axios({
		method: 'post',
		url: openaiConfig.value.apiUrl + '/v1/chat/completions',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${openaiConfig.value.key}`,
		},
		data: {
			messages: [
				{
					role: 'user',
					content:
						'请根据已下的对话生成一个标题,只能在7个字以内不得超过，一下是对话内容:' +
						JSON.stringify(chatList.slice(1, 3)),
				},
			],

			...chatConfigStore.chatConfig,
			stream: false,
		},
	}).then((response) => {
		chatHistoryStore.setChatHistoryTitle(
			currentChatId.value,
			response.data.choices[0].message.content
		);
	});
};

// watchEffect(()=>{
// 	if(chatList.length>0 && currentChatId.value!=''){
// 		console.log('chatList',chatList,chatList.length)
// 		chatHistoryStore.setChatMessage(currentChatId.value, chatList)
// 	}
// })

/** 生成一条聊天信息 */
const generateChat = (role: string, content: string = '') => {
	const now = moment();
	return {
		id: uuidv4(),
		role,
		content,
		createTime: now.format('YYYY-MM-DD HH:mm:ss'),
	};
};

/** 删除该聊天 */
const deleteChatItem = (id: string) => {
	console.log('deleteChatItem');
	chatList.splice(
		chatList.findIndex((item) => item.id === id),
		1
	);
};

/** 提交chat */
const submitChat = () => {
	// 校验openai设置
	if (openaiConfig.value.key === '' || openaiConfig.value.apiUrl === '') {
		ElMessage.warning('请设置chatgpt 秘钥(左下角设置)');
		return;
	}
	// 校验输入
	const message = chatValue.value;
	if (message.trim() === '') {
		ElMessage.warning('请输入内容');
		return;
	}

	// 追加用户对话
	chatList.push(generateChat('user', message));

	// 最近的一组对话
	let messages: IchatMessage[] = chatList.slice(-3).map((chat) => {
		return {
			content: chat.content,
			role: chat.role,
		};
	});

	if (messages.length == 0) return;

	// 发送chat
	sendChat([...messages]);

	// 清空
	chatValue.value = '';
};

/**
 * 重新生成
 * @param id 聊天 id
 */
const rebuildChat = (id: string) => {
	// 校验openai设置
	if (openaiConfig.value.key === '' || openaiConfig.value.apiUrl === '') {
		ElMessage.warning('请设置chatgpt 秘钥(左下角设置)');
		return;
	}
	let chatIndex = chatList.length - 1;
	// 如果指定了要重新生成的chat id
	if (id) {
		const idIndex = chatList.findIndex((chat) => chat.id === id);
		if (idIndex != -1 && chatList[idIndex].role === 'system') {
			chatIndex = idIndex;
		}
	}
	let messages: IchatMessage[] = getPreviousThreeChat(chatIndex).map((chat) => {
		return {
			content: chat.content,
			role: chat.role,
		};
	});

	if (messages.length == 0) return;

	// 发送chat
	sendChat([...messages], id);
};

/** 获取改下标的前3个对话 */
function getPreviousThreeChat(index: number) {
	if (index < 3) {
		// 如果下标小于3，直接返回前面的元素，不足3个则返回数组的全部元素
		return chatList.slice(0, index);
	} else {
		return chatList.slice(index - 3, index);
	}
}

/** 获取该id的chat */
function getChatById(id: string): Ichat | null {
	const idIndex = chatList.findIndex((chat) => chat.id === id);
	return idIndex != -1 ? chatList[idIndex] : null;
}

/** 暂停chat */
const endChat = () => {
	state.value = 'stop';
};

/** 发送chat */
const sendChat = async (messages: IchatMessage[], rebuildChatId?: string) => {
	state.value = 'loading';
	const ctrl = new AbortController();
	try {
		fetchEventSource(openaiConfig.value.apiUrl + '/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${openaiConfig.value.key}`,
			},
			body: JSON.stringify({
				messages,
				...chatConfigStore.chatConfig,
			}),
			signal: ctrl.signal,
			async onopen() {
				// 如果是重新生成
				if (rebuildChatId) {
					const rebuildChat = getChatById(rebuildChatId);
					if (rebuildChat == null) {
						ElMessage.warning('不存在该聊天');
						ctrl.abort();
						state.value = 'stop';
						return;
					}
					rebuildChat.content = '';
					const now = moment();
					rebuildChat.createTime = now.format('YYYY-MM-DD HH:mm:ss');
				}
				// 新增
				else {
					chatList.push(generateChat('system'));
				}
			},
			onmessage(ev) {
				if (ev.data === '[DONE]') {
					state.value = 'stop';
					ctrl.abort();
					if (
						chatList.length > 2 &&
						chatHistoryStore.getChatHistoryById(currentChatId.value)?.title === ''
					) {
						generateTitle();
					}
					return;
				}
				if (isJSONString(ev.data)) {
					// 返回内容
					const dataJson: IchatResult = JSON.parse(ev.data);
					const content = dataJson.choices[0].delta.content;

					// 校验
					if (state.value === 'stop' || dataJson.choices[0].finish_reason || content == undefined) {
						state.value = 'stop';
						ctrl.abort();
						return;
					} else {
						// 如果是重新生成
						if (rebuildChatId) {
							const targetChat = getChatById(rebuildChatId);
							if (targetChat) {
								// 追加
								targetChat.content += content;
							}
						}
						// 新增到最后一条
						else {
							const targetChat = chatList[chatList.length - 1];
							// 追加
							targetChat.content += content;
							// 滚动到底部
							nextTick(() => {
								scrollbar.value.setScrollTop(chatListRef.value.clientHeight);
							});
						}
					}
				}
			},
			onclose() {
				// 最后一条重新设置
				ctrl.abort();
				state.value = 'stop';

				return;
			},

			onerror(err) {
				ElMessage.error(err.message);
				state.value = 'stop';
				return;
			},
		});
	} catch (error) {
		console.error('error', error);
	}
};

function isJSONString(str: string) {
	try {
		JSON.parse(str);
		return true;
	} catch (error) {
		return false;
	}
}

/** 模型列表 */
const models = reactive<string[]>([
	'gpt-4',
	'gpt-4-0314',
	'gpt-4-0613',
	'gpt-4-32k',
	'gpt-4-32k-0314',
	'gpt-4-32k-0613',
	'gpt-3.5-turbo',
	'gpt-3.5-turbo-0301',
	'gpt-3.5-turbo-0613',
	'gpt-3.5-turbo-16k',
	'gpt-3.5-turbo-16k-0613',
]);

onMounted(() => {
	//   sendChat();
});
</script>

<style lang="scss">
// vue动画
.bottom-input-enter-from,
.bottom-input-leave-to {
	opacity: 0;
	transform: translateY(24px) !important;
}

.bottom-input-enter-active,
.bottom-input-leave-active {
	transition: all 0.5s ease;
}
.bottom-v-slide-enter-from,
.bottom-v-slide-leave-to {
	opacity: 0;
}

.bottom-v-slide-enter-active,
.bottom-v-slide-leave-active {
	transition: all 0.5s ease;
}
.ai-chat {
	margin: 0 auto;

	// 工具栏
	.tool-box {
		margin: 16px auto;
		max-width: 1000px;

		.select-box {
			display: flex;
			align-items: center;
			.select-tip {
				margin-right: 8px;
				font-size: 14px;
				color: #666;
			}
		}
	}

	// chat 列表
	.chat-list-box {
		max-width: 1000px;
		padding-bottom: 100px;
		margin: 0 auto;
	}

	// 底部内容
	.bottom-box {
		position: fixed;
		padding: 40px 0 30px;
		bottom: 0;
		right: 0;
		display: flex;
		justify-content: center;
		background-image: linear-gradient(180deg, hsla(0, 0%, 100%, 0) 13.94%, #fff 54.73%);
		// 暂停按钮
		.bottom-push-btn {
			position: absolute;
			left: 50%;
			transform: translateX(-50%);
			bottom: 90px;
			i {
				font-size: 14px;
				margin-right: 8px;
			}
		}

		// 输入框
		.input-box {
			max-width: 600px;
			width: 600px;
			display: flex;
			justify-content: center;
			justify-content: space-between;
			align-items: center;
			padding: 10px;
			padding: 8px;
		}
	}
}

.hljs {
	color: #abb2bf !important;
	background-color: #282c34 !important;
}
</style>
