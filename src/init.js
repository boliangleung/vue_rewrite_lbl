
import {initState} from "./state"
import {compileToFunction} from "./compiler/index"
import {mountComponent} from "./lifecycle"

export  function initMixin(Vue){
	// 在原型上添加一个init方法  初始化流程
	Vue.prototype._init = function(options){
		// 做数据的劫持
		const vm=this
		vm.$options = options // this.$options就是用户传的属性

		// 初始化状态
		initState(vm) // 分割代码


		// 如果页面传入el属性 需要将页面渲染出来。
		// 如果页面传入了el 我们就要实现挂载
		// 编译过程
		if(vm.$options.el){
			vm.$mount(vm.$options.el)
		}
	}

	Vue.prototype.$mount=function(el){
		const vm = this;
		const options = vm.$options
		el = document.querySelector(el)
		// 默认先会查找有没有render方法，没有render 会采用tempalate template也没有 就用el中的内容
		if(!options.render){
			// 对模板进行编译
			let template = options.template; // 取出模板
			if(!template&&el){
				template = el.outerHTML
			}
			// console.log(template)
			const render = compileToFunction(template)

			options.render = render
			// 我们需要将template 转化成render方法 vue1.0 2.0 虚拟DOM 就可以用DOM DIFF的操作
			// <div id="app">
			// <p>{{name}}</p>
			// <span>{{age}}</span>	
			// </div>
			// _c 创建结点 _s 创建字符串(原理是JSON.stringify) _v 创建文本
			// render return _c('div',{id:app},_c('p',undefined,_v(_s(name))),_c('span',undefined,_v(_s(age))))
			// eval 不安全 因为 
			// let a=1;
			// eval(`console.log(a)`) 它会往上级作用域找 不干净 函数作用域是不会的。 
		}
		// 最终都是要得到 options.render
		// 渲染当前的组件 挂载这个组件
		mountComponent(vm,el) // vm上的render 执行后的结果 替换el就可以了。
	}
}