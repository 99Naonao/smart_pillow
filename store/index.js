import {
	createStore
} from 'vuex'
const store = createStore({
	state: { //存放状态
		"username": "foo",
		"age": 18
	}
})

export default store