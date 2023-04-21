import { createApp } from 'vue'
import App from './App.vue'
import Antd from 'ant-design-vue'
import { message } from 'ant-design-vue';
import 'ant-design-vue/dist/antd.css';
import './assets/main.css'

const root = createApp(App)
root.use(Antd)
root.config.globalProperties.$message = message
root.mount('#app')