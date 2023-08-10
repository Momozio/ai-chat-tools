<template>
	<el-dialog title="设置" :model-value="modelValue">
		<el-form :model="formData" label-width="120px">
			<el-form-item prop="key" label="openai key">
				<el-input v-model="formData.key" placeholder="请填写openai 秘钥" />
			</el-form-item>

			<el-form-item prop="apiUrl" label="openai 接口地址">
				<el-input
					v-model="formData.apiUrl"
					placeholder="请填写openai 接口路径(官网为 https://api.openai.com)"
				/>
			</el-form-item>
		</el-form>

		<template #footer>
			<span class="dialog-footer">
				<el-button @click="hideDialog">取消</el-button>
				<el-button type="primary" @click="saveSetting">保存</el-button>
			</span>
		</template>
	</el-dialog>
</template>

<script setup lang="ts">
import deepcopy from 'deepcopy';
import {storeToRefs} from 'pinia';
import {useChatConfigStore} from '@/store/config';

defineProps<{
	modelValue: boolean;
}>();
const emit = defineEmits(['update:modelValue']);
/** config store */
const chatConfigStore = useChatConfigStore();
const {openaiConfig} = storeToRefs(chatConfigStore);
/** 隐藏对话框 */
const hideDialog = () => {
	emit('update:modelValue', false);
};
/** 表单数据 */
const formData = reactive({
	key: '',
	apiUrl: '',
});

/** 保存设置 */
const saveSetting = () => {
	chatConfigStore.setOpenaiConfig(formData);
	ElMessage.success('已保存');
	hideDialog();
};

onBeforeMount(() => {
	const localOpenaiConfig = localStorage.getItem('openaiConfig');
	if (localOpenaiConfig != null) {
		formData.key = JSON.parse(localOpenaiConfig).key;
		formData.apiUrl = JSON.parse(localOpenaiConfig).apiUrl;
		openaiConfig.value = {
			key: JSON.parse(localOpenaiConfig).key,
			apiUrl: JSON.parse(localOpenaiConfig).apiUrl,
		};
	}
});
</script>

<style lang="scss" scoped></style>
