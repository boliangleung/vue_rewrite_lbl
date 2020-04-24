import Watcher from './observer/watcher'
import { patch } from './vdom/patch'
export function lifecyleMixin(Vue) {
  Vue.prototype._update = function(vnode) {
    const vm = this
    // 通过虚拟节点 渲染出真实的DOM
    // console.log(vnode)
    vm.$el = patch(vm.$el, vnode) //需要用虚拟节点创建出真实结点 替换掉真实的$el
    // patch 也是更新的 判断diff的一部分
  }
}

export function mountComponent(vm, el) {
  const options = vm.$options //render
  vm.$el = el //真实的元素

  // watcher 就是用来渲染的
  // vm._render 通过解析render方法 渲染出虚拟DOM
  // vm._update 通过虚拟DOM 创建珍惜结点

  // 渲染页面
  let updateComponent = () => {
    //无论渲染还是更新 都会调用此方法
    // 返回的是虚拟DOM_render
    vm._update(vm._render())
  }
  debugger
  // 渲染watcher 每一个组件都有一个watcher  渲染watcher 不需要通知谁 所以第三个是一个空函数
  new Watcher(vm, updateComponent, () => {}, true) //true标识他是一个渲染watcher
  // 一个组件只有一个渲染watcher
}
