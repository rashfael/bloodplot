import Vue from 'vue'
import Buntpapier from 'buntpapier'
import App from './App.vue'
import store from './store'

import 'styles/global.styl'

Vue.config.productionTip = false
Vue.use(Buntpapier)
new Vue({
	store,
	render: h => h(App)
}).$mount('#app')
