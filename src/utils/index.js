export function isObject(data){
	return typeof data ==='object'&&data!==null
}
export function def(data,key,value){
	Object.defineProperty(data,key,{
		enumerable:false,
		configurable:false,
		value
	})
}
// 相当于做了一层代理
export function proxy(vm,source,key){
	// 可以了解去 getthis.name的时候 回去触发 this._data.name的get.(一样会) 。 set也一样 也就会触发一开始我们的set 会通知watcher更新
	Object.defineProperty(vm,key,{
		enumrable:true,
	    configurable:true,
	    get(){
	    	return vm[source][key]
	    },
	    set(newVal){
	    	vm[source][key]=newVal
	    }
	})
}