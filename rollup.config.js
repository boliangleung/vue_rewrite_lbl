import babel from "rollup-plugin-babel"
import serve from "rollup-plugin-serve"

export default{
	input:"./src/index.js", // 入口
	output:{
		file:"dist/umd/vue.js",
		name:"Vue", //指定打包后全局变量的名字 也就是函数库
		format:"umd", //统一模块规范
		sourcemap:true // es6->es5 开启源码调试 可以找到源代码报错位置
	},
	plugins:[
		babel({
			//为了避免转译第三方脚本，我们需要设置一个 exclude 的配置选项来忽略掉 node_modules 目录
			exclude:"node_modules/**"
		}),
		process.env.ENV ==="development"?serve({
			open:true,
			openPage:'/public/index.html',
			port:1023,
			contentBase:""
		}):null
	]
}