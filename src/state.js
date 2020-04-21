import {observe} from "./observer/index"
import {proxy} from "./utils/index"
export function initState(vm){
	const opts = vm.$options
	// 初始化Vue的数据来源 props methods data computed watch 顺序 Vue 源码也是这样的顺序
	if(opts.props){
		initProps(vm)
	}
	if(opts.methods){
		initMethod(vm)
	}
	if(opts.data){
		initData(vm)
	}
	if(opts.computed){
		initComputed(vm)
	}
	if(opts.watch){
		initWatch(vm)
	}
}
function initProps(vm){

}
function initMethod(vm){

}
function initData(vm){
	let data = vm.$options.data // 用户传的data
	data = vm._data = typeof data ==='function'?data.call(vm):data  //处理data
	// 对象劫持 用户改变了数据 我们希望可以得到通知 => 刷新
	// MVVM模式 数据变化驱动视图变化
	// Object.defineProperty()给属性添加get方法和set方法

	// 为了让用户更好的使用 用户可以使用this.xx 使用代理
	for(let key in data){
		proxy(vm,'_data',key)
	}
	observe(data);
}
function initComputed(vm){

}
function initWatch(vm){

}
