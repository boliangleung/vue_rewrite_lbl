import Watcher from './watcher'

// 依赖收集
let uid = 0
// 删除数据
function remove(array, item) {
  let index = array.indexOf(item)
  if (index > -1) {
    return array.splice(index, 1)
  }
}
class Dep {
  // static target: ?Watcher;
  // id: number;
  constructor() {
    this.id = uid++
    this.subs = []
  }
  // sub是watcher
  addSub(sub) {
    this.subs.push(sub)
  }
  removeSub(sub) {
    remove(this.subs, sub)
  }
  // 依赖收集，有需要才添加订阅
  depend() {
    if (Dep.target) {
      Dep.target.addDep(this) // watcher 里面的addDep方法
    }
  }
  notify() {
    const subs = this.subs.slice()
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update()
    }
  }
}

// The current target watcher being evaluated.
// This is globally unique because only one watcher
// can be evaluated at a time.

Dep.target = null
const targetStack = []
export function pushTarget(target) {
  targetStack.push(target)
  Dep.target = target
}

export function popTarget() {
  targetStack.pop()
  Dep.target = targetStack[targetStack.length - 1]
}

export default Dep
