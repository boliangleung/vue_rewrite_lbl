class Watcher{
	constructor(vm,exprorFn,callback,options){
		this.vm=vm
		this.exprorFn=exprorFn
		this.callback = callback
		this.options = options

		this.getter=exprorFn; //将内部传过来的的回调函数 放到getter属性上
		
		this.get()
	}
	get(){
		this.getter()
	}
}
export default Watcher;