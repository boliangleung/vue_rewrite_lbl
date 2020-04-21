
/**
 *@title Vue rewrite
 *
**/
// 这个文件只是整合的功能
import {initMixin} from "./init"
import {renderMixin} from "./render"
import {lifecyleMixin} from "./lifecycle"

function Vue(options){
	// 必须new 实例化
	if(!this instanceof Vue){
		new Error("Vue should be instantiated use 'vew' ")
		return
	}
	// 进行Vue的初始化工作
	this._init(options)
}
// 通过引入文件的方式 给Vue原型上添加方法
initMixin(Vue)
renderMixin(Vue)
lifecyleMixin(Vue)

export default Vue