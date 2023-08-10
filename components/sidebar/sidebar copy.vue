<template>
	<client-only>
		<div
			class="bg-white relative z-10 transition-all duration-300"
			:class="!isFlod ? 'w-[260px] border border-slate-200 border-r-2' : 'w-0'"
			data-projection-id="130"
		>
			<!-- 展开按钮 -->
			<div
				class="absolute -right-16 top-4 border border-gray-300 rounded-md hover:bg-gray-50 w-8 h-8 flex justify-center items-center"
				@click="isFlod = false"
				v-if="isFlod"
			>
				<span class="rotate-90">
					<i class="iconfont icon-fold text-gray-500 text-xs"></i>
				</span>
			</div>
			<!-- nav -->
			<div
				class="p-4 flex overflow-hidden flex-col whitespace-nowrap"
				:class="!isFlod ? 'w-[260px] border-slate-200' : 'w-0 px-0'"
			>
				<!-- 标题 -->
				<div class="flex justify-between relative">
					<h1 class="text-xl"><span>&#128295;</span><span class="ml-2">Gpt tools</span></h1>
					<!-- 收起按钮 -->
					<div
						class="border border-gray-300 rounded-md hover:bg-gray-50 duration-100 w-8 h-8 flex justify-center items-center"
						@click="isFlod = true"
					>
						<span class="-rotate-90">
							<i class="iconfont icon-fold text-gray-500 text-xs"></i>
						</span>
					</div>
				</div>

				<!-- 创建聊天 -->
				<button
					class="flex items-center justify-center w-full mt-4 p-2 border- text-sm gray border border-gray-300 rounded-md hover:bg-gray-50"
					@click="createChat"
				>
					<i class="iconfont icon-plus mr-2 text-gray-600"></i>
					<span class="text-gray-600">创建聊天</span>
				</button>

				<!-- 聊天列表 -->
				<div class="mt-2">
					<!-- 聊天项 -->
					<el-scrollbar height="calc(100vh - 200px)">
						<div
							class="border px-3 py-2 rounded-md text-gray-700 mb-2 group"
							:class="
								currentChatId == chatHistoryItem.id
									? 'bg-gray-100 hover:bg-gray-200'
									: 'bg-white hover:bg-gray-100'
							"
							@click.stop="handleSelectChat(chatHistoryItem.id)"
							v-for="chatHistoryItem in chatHistory"
						>
							<div class="flex justify-between items-center">
								<div class="flex items-center overflow-hidden">
									<!-- 聊天图标 -->
									<i class="iconfont icon-chat text-xs mr-2" style="font-size: 14px"></i>
									<!-- 标题 -->
									<div class="text-sm truncate">
										{{ chatHistoryItem.title || '未命名' }}
									</div>
								</div>
								<client-only>
									<!-- 删除按钮 -->
									<el-popconfirm
										width="220"
										confirm-button-text="确定"
										cancel-button-text="取消"
										:icon="InfoFilled"
										icon-color="#626AEF"
										title="是否要删除该对话"
										@confirm="handleDeleteChatHistory(chatHistoryItem.id)"
									>
										<template #reference>
											<button @click.stop>
												<i
													class="iconfont icon-delete opacity-0 hover:text-black group-hover:opacity-100 transition-opacity"
													style="font-size: 14px"
												></i>
											</button>
										</template>
									</el-popconfirm>
								</client-only>
							</div>
							<!-- 日期 -->
							<span class="text-gray-300 text-xs">{{ chatHistoryItem.createTime }}</span>
						</div>
					</el-scrollbar>
				</div>
				<!-- 设置按钮 -->
				<button
					@click="isShowSettingModel = true"
					class="mt-4 w-[32px] h-[32px] bg-gray-50 hover:bg-gray-100 rounded-lg flex justify-center items-center shadow"
				>
					<i class="iconfont icon-setting text-gray-500 text-sm"></i>
				</button>
			</div>
		</div>
		<!-- 设置弹窗 -->
		<SettingPanel v-model="isShowSettingModel" />
	</client-only>
</template>

<script setup lang="ts">
import moment, {now} from 'moment';
import {useChatHistoryStore} from '@/store/chatHistory';
import {InfoFilled} from '@element-plus/icons-vue';
import {v4 as uuidv4} from 'uuid';
import {storeToRefs} from 'pinia';
import SettingPanel from '@/components/settingPanel.vue';
const isFlod = ref<boolean>(false);

/** chatHistory store */
const chatHistoryStore = useChatHistoryStore();
const {chatHistory, currentChatId} = storeToRefs(chatHistoryStore);

/** 创建聊天 */
const createChat = () => {
	const now = moment();
	const id = uuidv4();
	chatHistoryStore.pushChatHistory({
		id,
		createTime: now.format('YYYY-MM-DD HH:mm:ss'),
		title: '',
		messages: [
			{
				id: uuidv4(),
				role: 'system',
				content: '我是你的ai助理, 有什么能帮到你的吗',
				createTime: now.format('YYYY-MM-DD HH:mm:ss'),
			},
		],
	});
	// 设置当前chat id
	chatHistoryStore.setCurrentChatId(id);
};

/** 选择聊天 */
const handleSelectChat = (id: string) => {
	// 设置当前chat id
	chatHistoryStore.setCurrentChatId(id);
};

/** 删除聊天 */
const handleDeleteChatHistory = (id: string) => {
	chatHistoryStore.deleteChatHistory(id);
};

/** 关闭聊天 */
const handleCloseChat = () => {
	isFlod.value = false;
};

/** 是否展示设置面板 */
const isShowSettingModel = ref<boolean>(false);

onBeforeMount(() => {
	const localChatHistory = localStorage.getItem('chatHistory');
	const localCurrentChatId = localStorage.getItem('currentChatId');
	if (localChatHistory != null) {
		chatHistory.value = JSON.parse(localChatHistory);
	}
	if (localCurrentChatId != null){
		chatHistoryStore.setCurrentChatId(localCurrentChatId);	
	}
});
</script>
<style lang="scss" scoped></style>
