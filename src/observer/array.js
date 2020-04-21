
// 需要重写一些会改变数组自身的方法 push shift pop unshift splice sort filter
// 记得 不监控索引和不监控长度的
let oldArrayMethods = Array.prototype
import {def} from "../utils/index"
// value._proto_ = arrayMethods
// arrayMethods._proto_ = oldArrayMethods
// 首先会找aarayMethods 如果不存在 会查找oldArrayMethods 所以这是原型链查找的问题重写的没有 会继续向上查找
export let arrayMethods=Object.create(oldArrayMethods);
const methods=['push','shift','unshift','pop','splice','sort','filter'];
methods.forEach(method=>{
	
	def(arrayMethods,method,function(...args){
		//console.log('用户调用了push方法') // 这相当 切片方程   相当于在原生的逻辑切了个片，然后把这个片塞到了新写的方法里面返回

		const result = oldArrayMethods[method].apply(this,args) // 实际上是调用原生的数组方法
		let ob = this.__ob__
		// push unshift splice 添加的元素可能是一个新的元素
		let inserted ;//用户输入的参数
		switch(method){
			case 'push':
			case 'unshift':
			inserted = args;
			break;
			case 'splice':   // 3个参数  第一个是删除的位置 第二个是 删除的数量  第三个 新增的属性
			inserted = args.slice(2)
			default:
			break;
		}
		// 因为监听方法 我们之前封装在了 observe 我们现在的this 是 value 所以我们想办法 把new Observer 放在value的一个属性 那么我们就可以调用observerArray了
		if(inserted)  ob.observerArray(inserted) // 将新增属性一直检测。

		return result
	}) 
})