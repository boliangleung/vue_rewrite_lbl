export function createElement(tag,data={},...children){
	let key=data.key
	if(key){
		delete data.key;
	}
	return vnode(tag,data,key,children,undefined)
	// console.log(tag,data,children)
	
}
export function createTextNode(text){
	return vnode(undefined,undefined,undefined,undefined,text)
}

// 虚拟DOM节点 就是通过_c -v 实现用对象来描述DOM节点的结构 （实际还是对象）

function vnode(tag,data,key,children,text){
	return {
		tag,
		data,
		key,
		children,
		text
	}
}
// 当然vnode 我们以后也是可以扩展的 比如componentOptions等等

// 1. 将template转化成ast语法书--》生成render方法--》生成虚拟DOM---》真实DOM
// 更新过程  重新生成虚拟DOM -》 diff->更新DOM

// 第一次生成了ast ->render 函数。 更新的时候 我们直接获取render函数 进行值的更新 就可以生成vnode 然后和之前的做比较

// 就比如components的vnode 就还有componentOptions和element这个结点。其实都是大同小异。