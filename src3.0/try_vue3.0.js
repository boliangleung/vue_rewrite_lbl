
/**
 * 尝试手写vue3.0
 * 手写+笔记
*/


// 新版本的Vue 不需要实例化了 而且api几乎都是函数化编程 
// 而且其实语法还是在改变的挺多的 比如 19年10月的时候 响应式副作用函数叫effect 现在叫watcherEffect
// 所以具体真的要用vue3.0 还是等正式版出来再用 可以看看里面的源码

// 目的
// let obj = {name:'lbl'}
// var proxy = new reactive(obj)
// effect(()=> console.log(proxy.name))  执行两次 默认初始化执行一次 更改值的话会执行一次
// proxy.name='lhm'


// 定义一些常用的函数方法
function  isObject(data){
	return typeof data ==='object'&&data!==null;
}
// 处理数据的监听要用到
function hasOwn(target,key){
	return target.hasOwnProperty(key)
}
let toProxy = new WeakMap()
let toRow = new WeakMap() // 避免重复监听 


// 数据劫持
function reactive(target){
	// 因为这个函数 其他地方也要用到 抽出来
	return createReactiveObject(target)
}
function createReactiveObject(target){
	if(!isObject(target)){
		return target
	}
	let isProxy = toProxy.get(target)
	if(isProxy){
		return isProxy
	}
	if(toRow.has(target)){ // 可能直接传 已经proxy的东西进来
		return target
	}
	// 其实有5种是可选的
	let baseHandle = {
		get(target,key,receiver){
			track(target,key)
			let res=Reflect.get(target,key,receiver)  // 为什么不用target[key] 返回出去 因为你这个对象可能是writable的 会提示报错 而Reflect是不会报错的
			return res
		},
		set(target,key,value,receiver){
			let oldValue = target[key]
			let res = Reflect.set(target,key,value,receiver)
			if(hasOwn(target,key)){
				triggle(target,'add',key)
				// 新增属性
			}else if (oldValue!==value){
				// 修改属性
			triggle(target,'set',key)
			}// 避免修改的两次值都一样。
			return
		},
		deleteProperty(target,key){
			let res = Reflect.deleteProperty(target,key)
		}
	}

	let result = new Proxy(target,baseHandle)
	return result
}
// 还要处理数组的改变

// 上面做完数据监听 接下来是手机依赖和发布订阅
// 记得effect 可能有多个 所以用一个数组存起来  记住下面存effect的结构
// {
// 	target:{    map结构
// 		key1:[], set结构
// 		key2:[]
// 	},
//  target2:{}
// }
let activeWacthEffect= []
let depsMap = new Map()
function watchEffect(fn){
	let watchEffect= createActiveWatchEffect(fn)
	watchEffect() // 记得要执行一次
}
function createActiveWatchEffect(fn){
	let effect = function(){
		return run(effect,fn) 
	}

	return effect
}
function run(effect,fn){

	try{
		activeWacthEffect.push(effect)
		fn()	//根据JS 单线程的特性 执行完fn的时候 就已经会把数组的ffect加入到对应的结构里面的
	}finally{
		activeWacthEffect.pop()
	}	
}
// 收集依赖
function track(target,key){
	let watchEffect = activeWacthEffect[activeWacthEffect.length-1]
	if(watchEffect){ // 肯定是只有effect 才进行依赖收集
		let depsTarget = depsMap.get(target)
		if(!depsTarget){
			depsMap.set(target,depsTarget=new Map()) // 记得是set Target
		}
		let depsKey = depsTarget.get(key)
		if(!depsKey){
			depsTarget.set(key,depsKey=new Set()) // set KEY
		}
		if(!depsKey.has(watchEffect)){  // 如果不存在这个effect
			depsKey.add(watchEffect)
		}
	}
}
function triggle(target,type,key){
	let watchEffect = depsMap.get(target)
	if(watchEffect){
		let depsKey = watchEffect.get(key)
		if(depsKey){
			depsKey.forEach(effect=>{
				effect()
			})
		}
	}
}

let obj = {name:"lbl"}
let proxy = reactive(obj)
watchEffect(()=>{
	console.log(proxy.name)
})
proxy.name='88'