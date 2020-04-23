import Dep, { pushTarget } from './dep'

class Watcher {
  constructor(vm, exprorFn, cb, options) {
    // 传进来的对象
    this.vm = vm

    // 在Vue中cb是更新视图的核心，调用diff并更新视图过程
    this.cb = cb
    // 收集Deps 用于移除监听
    this.newDeps = []
    this.getter = exprorFn //将内部传过来的的回调函数 放到getter属性上 执行回调函数

    this.options = options

    //设置Dep.target的值，依赖收集时watch 对象
    this.value = this.get()
  }
  get() {
    // 设置Dep.target值 用于依赖收集
    pushTarget(this)
    const vm = this.vm
    let value = this.getter.call(vm, vm)
    return value
  }
  //添加依赖
  addDep(dep) {
    //  这里简单处理，在VUE中 做了重复筛选，即依赖只收集一次，不重复收集依赖
    this.newDeps.push(dep)
    dep.addSub(this)
  }
  // 更新
  update() {
    this.run()
  }
  run() {
    //这里只做简单的console.log 处理，在Vue中会调用diff过程从而更新视图
    console.log(`这里会去执行Vue的diff相关方法，进而更新数据`)
  }
}
export default Watcher
