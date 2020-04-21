import {isObject,def} from "../utils/index"
import {arrayMethods} from "./array.js"

// ?为什么单独写类
// 如果要delete 内部是使用 vm.$delete 原理是splice
// 可以通过设置 __ob__ 判断它是不是一个已经监测过的类
class Observer{
	constructor(value){ // 仅仅初始化功能
		// vue如果数据的层次过多 需要递归的去解析对象中的属性，依次增加set和get方法 性能并不是特别好
		// vue3.0 使用了proxy 并不用递归地去解析 而且不用加set和get方法

		// value.__ob__ =this  // 我给每一个监控过的对象都增加一个__ob__属性 可以描述这个对象已经被监控过了
		// 如果像上面那样写 会死循环 因为下面会不断的遍历__ob__ 所以得设置成不可枚举的属性。
		def(value,'__ob__',this)

		// 需要对数组和对象分开监测 如果数组走walk 那么索引也会被监测 这并不是我们想要的。 console.log 可以看到
		if(Array.isArray(value)){
			// 如果是数组的话 并不会对索引进行观测 因为会导致性能问题
			// 前端是很少操作索引的 一般是 push pop ...7个方法
			// 所以我们需要做一个函数劫持 重写原型的方法 当数组调用这几个方法的时候 通知更新
			value['__proto__'] = arrayMethods
			// 这种模式 装修者模式 或者代理模式  arrayMethods 可以去调原生的方法 中间的时候 可以通知更新
			// 如果数组里面放的是对象 我们再监控
			this.observerArray(value)
		}else{
			this.walk(value)
		}
		// 观测的话 就两种方式 1种是数组 一种是对象
		// 如果是数组的话 我们还把原型的方法重写。 然后对数组里面的每一项进行监控。
		// 把这些方法 重新定义到了我们自己封装的方法。
		// 如果是对象的话 就对对象的属性通过Object.defineProperty进行重新定义。
	}
	walk(data){
		let keys = Object.keys(data); //[name,detail]
		for(let i=0;i<keys.length;i++){
			let key = keys[i]
			let value = data[key];
			defineReactive(data,key,value) // Vue 核心响应式方法
		}
	}
	observerArray(data){
		for(let i=0;i<data.length;i++){
			observe(data[i])
		}
	}
}

function defineReactive(data,key,value){
	observe(value)
	Object.defineProperty(data,key,{
		enumrable:true,
	    configurable:true,
	    get(){
	    	return value
	    },
	    set(newVal){
	    	if(newVal ===value) return;
	    	observe(newVal) // 继续劫持用户设置的值，因为有可能设置的值是一个对象
	    	value = newVal  // 利用闭包的特性
	    }
	})
}

// 把data中的数据 都使用Object.defineProperty重新定义
// 不能兼容IE8以下
export function observe(data){
	if(!isObject(data)){
		return  
	}
	return new Observer(data)  //用来观察数组
}