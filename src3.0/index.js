/**
 * Vue3.0 中响应的核心方法
 let proxy = Vue.reactive({name:"lbl"})
 // 副作用 一开始是执行一次 当proxy.name改变的时候 又会触发视图更新 执行一变。
 Vue.effect(()=>{
	console.log(proxy.name) // 
 })
 proxy.name='jw'
 Vue.effect 最新改成了 Vue.watchEffect
**/

// proxy 兼容性差 IE11不兼容

// VUE3.0 响应式原理
// vue2.0 缺陷 1. 2.0 会默认进行递归(最大的问题)  2 数组改变lenth 是无效的 因为2.0是通过函数劫持的方法监听数组 3.对象不存在的属性不能被拦截

let toProxy = new WeakMap();// 弱引用的映射表 es6 放置的是     原对象：代理过的对象
let toRaw = new WeakMap(); //	被代理过的对象：源对象

// 因为当这个对象不用的时候 可以被回收掉 所以不用map

function isObject(data){
	return typeof data==='object'&&data!==null
}
function hasOwn(target,key){
	return target.hasOwnProperty(key)
}


// 1.响应式的方法
function reactive(target){
	//  创建响应式对象
	return createReactiveObject(target)
}

// 创建响应式对象
function createReactiveObject(target){
	if(!isObject(target)){  // 如果不是对象 直接返回
		return target	
	}
	let proxy=toProxy.get(target)  //如果已经代理过了 就将结果返回
	if(proxy){
		return proxy
	}
	if(toRaw.has(target)){
		return target
	}
	// reflect 优点 不会报错 而且 会有返回值 会替代掉object 上的方法
	let baseHandler={
		// 你可以认为 relect的方法 和proxy方法一样  而且支持数组的劫持 不用改写。
		get(target,key,receiver){  // target key 代理后的对象  不能写receiver[key] 因为造成死循环 key是name值 target是
			// 新版本 proxy+reflect 反射  reflect 和object.definePropery用法差不多 说明object.defineProerty以后可以废弃了。

			// Object.getOwnPropertyDescriptor() //无法获取symbol属性   Reflect.ownKeys()  你可以认为 Reflect在后期 可以替换Object对象这个API的东西
			// console.log('获取',target,key,receiver)
			track(target,key)
			let result = Reflect.get(target,key,receiver)    // 和target[key]写法差不多一样的

			// result 获取当前值
			return isObject(result)?reactive(result):result;
		},
		set(target,key,value,receiver){
			// 怎么去 识别是改属性 还是新增属性
			let hadKey = hasOwn(target,key)
			let oldValue = target[key]
			// target[key]=value  如果设置没成功 如果这个对象不可以更改 configurale writable
			let res = Reflect.set(target,key,value,receiver)
			if(!hadKey){
				trigger(target,'add',key)
				// console.log('新增属性')  
			// 因为 arr.push  是二次过程 比如 arr.push(4) 第一次的时候 他的Length已经是改了的
			//  所以第二次进来 value length=4 其实和之前那个值是一样的
			}else if(oldValue !==value){
				trigger(target,'set',key)
				// console.log('修改属性')
			} //为了避免无意义的修改
			// 如果设置没成功 如果不可以更改writable
			return res
			console.log('设置')
		},
		deleteProperty(target,key){
			console.log('删除')
			let res= Reflect.deleteProperty(target,key) 
			return res
	
		}
	}
	let observed = new Proxy(target,baseHandler)
	toProxy.set(target,observed);
	toRaw.set(observed,target);
	// 防止你多次new
	return observed
}

// let proxy = reactive({name:'zf',age:{year:20}})   // 多层代理 通过get方法来判断
// proxy.name='66'
// console.log(proxy.name)
// proxy.name='999'  对象不存在的属性也会被拦截了
// delete proxy.name

// 修改多层
// proxy.age.year=666  // 他是会先触发到proxy.age 然后返回一个对象 {year:20} 然后我们只要再对这个返回的对象进行响应式即可

// 其实也是递归 但是和2.0不一样 2.0是一上来就全递归 而3.0是 取值的时候 有必要才递归。 就比如 一开始我们设置 age:{year:20} 是没有递归proxy 只有等我们用到了 才递归。
// console.log(proxy.age.year)   // 获取一次 proxy.age 然后返回 {year:20} 然后改变year 再设置 所以是一次获取 一次设置 不是二次获取

// let objct={name:'lbl'}  //需要记录一下 如果这个对象代理过了 就不要在new了。
// let proxy=reactive(object)
// reactive(object)
// reactive(object)
// reactive(object)
// reactive(proxy)  会导致多层代理 需要处理
// 内部用了hash表 映射表 {key=>value}

// let arr=[1,2,3]
// let proxy = reactive(arr)
// proxy.push(6) // 添加了一个数据4 并且把length改成4   arr[3]=6 arr.length=4.   所以会触发2次set()


// 依赖收集 发布订阅

// 栈 先进后出   主要是通过集合和hash表
let activeEffectStack=[]; //栈型结果

// effect 相关
// target:{
// 	key1:[effect],
// 	key2:[effect]
// }
// 存effect函数数据
let depsMap = new WeakMap()
// 收集依赖
function track(target,key){
	// 如果这个target中的Key变化了 我就执行数组里的方法
	// console.log(target)
	let depsTarget = depsMap.get(target)
	let effectFn = activeEffectStack[activeEffectStack.length-1]
	if(effectFn){ // 有对应才关联
		if(!depsTarget){
			depsMap.set(target,depsTarget=new Map())
		}
		let depsKey = depsTarget.get(key)
		if(!depsKey){
			depsTarget.set(key,depsKey=new Set())
		}
		if(!depsKey.has(effectFn)){
			depsKey.add(effectFn)
		}
	// 动态创建依赖关系
	}
	// 什么都不做
}

//发布更新
function trigger(target,type,key){
	let depsTarget = depsMap.get(target)
	if(depsTarget){
		let depsKey = depsTarget.get(key);
		if(depsKey){ // 将当前的key 对应的effect 依次执行
			depsKey.forEach(effect=>{
				effect()
			})
		}
		
	}
}

// 响应式 副作用
function effect(fn){
	// 需要把这个fn这个函数编程响应式函数
	let effect = createReactiveEffect(fn)
	effect()  // 默认先执行一次
}
function createReactiveEffect(fn){
	let effect = function(){  //这个就是创建的响应式effect
		return run(effect,fn) // 运行 1.让fn执行 第二个是 把这个effect 存到栈中

	}
	return effect
}
function run(effect,fn){
	try{
		activeEffectStack.push(effect)  // 因为可能有很多个effect
		fn(); //JS 单线程 等加完之后 就要删除
	}finally{
		activeEffectStack.pop()
	}
}

let obj = new reactive({name:'2f'})
effect(()=>{ // effect会执行两次，默认先执行一次 之后依赖的数据变化了 会再次执行
	console.log(obj.name)
})
obj.name='test effect'


// reflect 在以后的日子 可能会慢慢的代替object的使用 如果兼容性支持的话

// Reflect可以将Object对象的一些明显属于语言内部的方法（比如Object.defineProperty），放到Reflect对象上。
// 修改某些Object方法的返回结果，让其变得更合理。
// 让Object操作都变成函数行为。某些Object操作是命令式，比如name in obj和delete obj[name]，
// 而Reflect.has(obj, name)和Reflect.deleteProperty(obj, name)让它们变成了函数行为。
// Reflect对象的方法与Proxy对象的方法一一对应，
// 只要是Proxy对象的方法，就能在Reflect对象上找到对应的方法。这就让Proxy对象可以方便地调用对应的Reflect方法，完成默认行为，作为修改行为的基础。
// 也就是说，不管Proxy怎么修改默认行为，你总可以在Reflect上获取默认行为

