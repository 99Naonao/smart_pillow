export default {
	methods: {
		/**
		 * 把对象格式样式表转换为string格式
		 */
		transStyle(object) {
			let string = ''
			for (const key in object) {
				const _key = key.replace(/[A-Z]/g, $1 => '-' + $1.toLocaleLowerCase())
				string += `${_key}: ${object[key]}; `
			}
			if (string) string = string.substring(0, string.length - 1)
			console.log('transStyle:', string)
			return string
		}
	}
}