export function patch(oldVode,vnode){
	console.log(oldVode,vnode)
	//vnode 和ast抽象树很像 但是真实的情况下 我们还有v-model v-for 事件等等等情况 ast抽象树并不能生成真实的代码

	// 1. 判断是更新还是渲染
	const isRealElement=oldVode.nodeType;
	if(isRealElement){
		const oldElm = oldVode // div id=app
		const parentElm = oldElm.parentNode; //body 要把虚拟节点放到

		let el=createElm(vnode)
		parentElm.insertBefore(el,oldElm.nextSibling) //插入在老元素的ID之后 紧随那种 不能用append 要不然会在最后
		parentElm.removeChild(oldElm) // 删除老结点
		return el;
	}

	// 递归创建真实结点 替换掉老的结点。
}
function createElm(vnode){
	let {tag,data,key,children,text}=vnode
	//是标签 就创建标签
	if(typeof tag==='string'){
		vnode.el=document.createElement(tag);
		updateProperties(vnode);
		children.forEach(child=>{ //递归创建儿子节点，将儿子节点扔到父节点上。
			return vnode.el.appendChild(createElm(child))
		})
	}else{
		//虚拟DOM上映射着真实DOM 方便后续更新操作
		vnode.el=document.createTextNode(text)
	}
	return vnode.el // 记得是有返回值的
	// 如果不是标签 就是文本
}	
// 更新属性的值
function updateProperties(vnode){
	let newProps = vnode.data ||{}
	let el = vnode.el

	for(let key in newProps){
		if(key==='style'){
			for(let styleName in newProps.style){
				el.style[styleName]=newProps.style[styleName]
			}
		}else if(key==='class'){
			el.className =newProps.class
		}else{
			el.setAttribute(key,newProps[key])
		}
	}
}