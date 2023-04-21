export { }
import { MessageApi } from 'ant-design-vue/lib/message';

declare module 'vue' {
	interface ComponentCustomProperties {
		$message: MessageApi
	}
}