<template>
	<div class="ai-chat">
		<!-- 工具栏 -->
		<div class="tool-box">
			<!-- 模型选择 -->
			<div class="select-box">
				<span class="select-tip">模型</span>
				<el-select v-model="chatConfig.model" placeholder="请选择模型">
					<el-option v-for="model in models" :key="model" :value="model" :label="model"></el-option>
				</el-select>
			</div>
		</div>
		<!-- chat 列表 -->
		<div class="chat-list-box">
			<!-- chat item -->
			<ChatItem :chatData="chat" v-for="(chat, index) in chatList" :key="index" />
		</div>
		<!-- 底部输入框 -->
		<div class="bottom-box">
			<div class="input-box">
				<el-input v-model="chatValue" size="large" />
				<el-button
					@click="submitChat"
					v-if="state == 'stop' || state == 'wait'"
					size="large"
					type="primary"
				>
					提交
				</el-button>
				<el-button @click="endChat" v-if="state == 'loading'" size="large">暂停</el-button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import {ElMessage} from 'element-plus';
import {onMounted, reactive, ref} from 'vue';
import {fetchEventSource} from '@microsoft/fetch-event-source';
import {Ichat, IchatResult} from '@/types/openai';
import {useChatConfigStore} from '@/store/config';
import ChatItem from '@/components/chatItem.vue';
import {v4 as uuidv4} from 'uuid';
import 'github-markdown-css';
import {storeToRefs} from 'pinia';

/** config store */
const chatConfigStore = useChatConfigStore();
const {chatConfig} = storeToRefs(chatConfigStore);

/** key */
const key: string = '4XgFUI0QooHS8Y_KnOWcT717J88bfhGuIZfqZ3KqT7E';
/** api url */
const apiUrl: string = 'https://chimeragpt.adventblocks.cc/api/v1/chat/completions';

/** 运行状态 */
const state = ref<'loading' | 'stop' | 'wait'>('wait');

/** 提交chat内容 */
const chatValue = ref<string>('');

/** 聊天列表 */
const chatList = reactive<Ichat[]>([
	{role: 'system', content: '我是你的ai助理, 有什么能帮到你的吗'},
]);

/** 提交chat */
const submitChat = () => {
	const message = chatValue.value;
	if (message.trim() === '') {
		ElMessage.warning('请输入内容');
		return;
	}

	// 追加用户对话
	chatList.push({id: uuidv4(), role: 'user', content: message});

	// 最近的一组对话
	let messages: Ichat[] = chatList.slice(-3).map((chat) => {
		return {
			content: chat.content,
			role: chat.role,
		};
	});

	// 发送chat
	sendChat([...messages]);

	// 清空
	chatValue.value = '';
};

/** 暂停chat */
const endChat = () => {
	state.value = 'stop';
};

/** 发送chat */
const sendChat = async (messages: Ichat[]) => {
	state.value = 'loading';
	const ctrl = new AbortController();
	try {
		fetchEventSource(apiUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${key}`,
			},
			body: JSON.stringify({
				messages,
				...chatConfigStore.chatConfig,
			}),
			signal: ctrl.signal,
			async onopen() {
				chatList.push({role: 'system', content: ''});
			},
			onmessage(ev) {
				if (ev.data === '[DONE]') {
					state.value = 'stop';
					ctrl.abort();
				}
				// 返回内容
				const dataJson: IchatResult = JSON.parse(ev.data);
				const content = dataJson.choices[0].delta.content;

				// 校验
				if (state.value === 'stop' || dataJson.choices[0].finish_reason || content == undefined) {
					state.value = 'stop';
					ctrl.abort();
				} else {
					// 追加
					chatList[chatList.length - 1].content += content;
					// 滚动到底部
					nextTick(() => {
						window.scrollTo(0, document.body.scrollHeight);
					});
				}
			},
			onclose() {
				// 最后一条重新设置
				ctrl.abort();
				state.value = 'stop';
			},
			
			onerror(err) {
				console.log('err', err);
				ElMessage.error(JSON.stringify(err));
				state.value = 'stop';
				// 最后一条重新设置
				chatList[chatList.length - 1].content = 'network error';
			},
		});
	} catch (error) {
		console.log('error',error)
		// 最后一条重新设置
		chatList[chatList.length - 1].content = 'network error';
	}
};

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
.ai-chat {
	padding-bottom: 100px;
	max-width: 1000px;
	margin: 0 auto;

	// 工具栏
	.tool-box {
		margin: 16px 0;
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
	}

	// 底部内容
	.bottom-box {
		position: fixed;
		padding: 40px 0 30px;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		justify-content: center;
		background-image: linear-gradient(180deg, hsla(0, 0%, 100%, 0) 13.94%, #fff 54.73%);
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
