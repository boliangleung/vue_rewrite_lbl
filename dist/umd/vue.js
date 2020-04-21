(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.Vue = factory());
}(this, (function () { 'use strict';

  function _typeof(obj) {
    "@babel/helpers - typeof";

    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function (obj) {
        return typeof obj;
      };
    } else {
      _typeof = function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }

    return _typeof(obj);
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _slicedToArray(arr, i) {
    return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
  }

  function _arrayWithHoles(arr) {
    if (Array.isArray(arr)) return arr;
  }

  function _iterableToArrayLimit(arr, i) {
    if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return;
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"] != null) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
  }

  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;

    for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

    return arr2;
  }

  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }

  function isObject(data) {
    return _typeof(data) === 'object' && data !== null;
  }
  function def(data, key, value) {
    Object.defineProperty(data, key, {
      enumerable: false,
      configurable: false,
      value: value
    });
  } // 相当于做了一层代理

  function proxy(vm, source, key) {
    // 可以了解去 getthis.name的时候 回去触发 this._data.name的get.(一样会) 。 set也一样 也就会触发一开始我们的set 会通知watcher更新
    Object.defineProperty(vm, key, {
      enumrable: true,
      configurable: true,
      get: function get() {
        return vm[source][key];
      },
      set: function set(newVal) {
        vm[source][key] = newVal;
      }
    });
  }

  // 需要重写一些会改变数组自身的方法 push shift pop unshift splice sort filter
  // 记得 不监控索引和不监控长度的
  var oldArrayMethods = Array.prototype;
  // arrayMethods._proto_ = oldArrayMethods
  // 首先会找aarayMethods 如果不存在 会查找oldArrayMethods 所以这是原型链查找的问题重写的没有 会继续向上查找

  var arrayMethods = Object.create(oldArrayMethods);
  var methods = ['push', 'shift', 'unshift', 'pop', 'splice', 'sort', 'filter'];
  methods.forEach(function (method) {
    def(arrayMethods, method, function () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      //console.log('用户调用了push方法') // 这相当 切片方程   相当于在原生的逻辑切了个片，然后把这个片塞到了新写的方法里面返回
      var result = oldArrayMethods[method].apply(this, args); // 实际上是调用原生的数组方法

      var ob = this.__ob__; // push unshift splice 添加的元素可能是一个新的元素

      var inserted; //用户输入的参数

      switch (method) {
        case 'push':
        case 'unshift':
          inserted = args;
          break;

        case 'splice':
          // 3个参数  第一个是删除的位置 第二个是 删除的数量  第三个 新增的属性
          inserted = args.slice(2);
      } // 因为监听方法 我们之前封装在了 observe 我们现在的this 是 value 所以我们想办法 把new Observer 放在value的一个属性 那么我们就可以调用observerArray了


      if (inserted) ob.observerArray(inserted); // 将新增属性一直检测。

      return result;
    });
  });

  // 如果要delete 内部是使用 vm.$delete 原理是splice
  // 可以通过设置 __ob__ 判断它是不是一个已经监测过的类

  var Observer = /*#__PURE__*/function () {
    function Observer(value) {
      _classCallCheck(this, Observer);

      // 仅仅初始化功能
      // vue如果数据的层次过多 需要递归的去解析对象中的属性，依次增加set和get方法 性能并不是特别好
      // vue3.0 使用了proxy 并不用递归地去解析 而且不用加set和get方法
      // value.__ob__ =this  // 我给每一个监控过的对象都增加一个__ob__属性 可以描述这个对象已经被监控过了
      // 如果像上面那样写 会死循环 因为下面会不断的遍历__ob__ 所以得设置成不可枚举的属性。
      def(value, '__ob__', this); // 需要对数组和对象分开监测 如果数组走walk 那么索引也会被监测 这并不是我们想要的。 console.log 可以看到

      if (Array.isArray(value)) {
        // 如果是数组的话 并不会对索引进行观测 因为会导致性能问题
        // 前端是很少操作索引的 一般是 push pop ...7个方法
        // 所以我们需要做一个函数劫持 重写原型的方法 当数组调用这几个方法的时候 通知更新
        value['__proto__'] = arrayMethods; // 这种模式 装修者模式 或者代理模式  arrayMethods 可以去调原生的方法 中间的时候 可以通知更新
        // 如果数组里面放的是对象 我们再监控

        this.observerArray(value);
      } else {
        this.walk(value);
      } // 观测的话 就两种方式 1种是数组 一种是对象
      // 如果是数组的话 我们还把原型的方法重写。 然后对数组里面的每一项进行监控。
      // 把这些方法 重新定义到了我们自己封装的方法。
      // 如果是对象的话 就对对象的属性通过Object.defineProperty进行重新定义。

    }

    _createClass(Observer, [{
      key: "walk",
      value: function walk(data) {
        var keys = Object.keys(data); //[name,detail]

        for (var i = 0; i < keys.length; i++) {
          var key = keys[i];
          var value = data[key];
          defineReactive(data, key, value); // Vue 核心响应式方法
        }
      }
    }, {
      key: "observerArray",
      value: function observerArray(data) {
        for (var i = 0; i < data.length; i++) {
          observe(data[i]);
        }
      }
    }]);

    return Observer;
  }();

  function defineReactive(data, key, value) {
    observe(value);
    Object.defineProperty(data, key, {
      enumrable: true,
      configurable: true,
      get: function get() {
        return value;
      },
      set: function set(newVal) {
        if (newVal === value) return;
        observe(newVal); // 继续劫持用户设置的值，因为有可能设置的值是一个对象

        value = newVal; // 利用闭包的特性
      }
    });
  } // 把data中的数据 都使用Object.defineProperty重新定义
  // 不能兼容IE8以下


  function observe(data) {
    if (!isObject(data)) {
      return;
    }

    return new Observer(data); //用来观察数组
  }

  function initState(vm) {
    var opts = vm.$options; // 初始化Vue的数据来源 props methods data computed watch 顺序 Vue 源码也是这样的顺序

    if (opts.props) ;

    if (opts.methods) ;

    if (opts.data) {
      initData(vm);
    }

    if (opts.computed) ;

    if (opts.watch) ;
  }

  function initData(vm) {
    var data = vm.$options.data; // 用户传的data

    data = vm._data = typeof data === 'function' ? data.call(vm) : data; //处理data
    // 对象劫持 用户改变了数据 我们希望可以得到通知 => 刷新
    // MVVM模式 数据变化驱动视图变化
    // Object.defineProperty()给属性添加get方法和set方法
    // 为了让用户更好的使用 用户可以使用this.xx 使用代理

    for (var key in data) {
      proxy(vm, '_data', key);
    }

    observe(data);
  }

  // ast语法树 是用对象来描述原生语法的  虚拟DOM 用对象来描述DOM节点的
  // ?:匹配不捕获
  // arguments[0] 匹配到的标签 arguments[1] 匹配到的标签名字
  // 这个也是参考JQ之父写的一个项目源码
  var ncname = "[a-zA-Z_][\\-\\.0-9_a-zA-Z]*"; // abc-aa

  var qnameCapture = "((?:".concat(ncname, "\\:)?").concat(ncname, ")");
  var startTagOpen = new RegExp("^<".concat(qnameCapture)); // 标签开头的正则 捕获的内容是 标签名 

  var endTag = new RegExp("^<\\/".concat(qnameCapture, "[^>]*>")); // 匹配标签结尾的 </div> 
  // ID="abc"(3)  'abc'(4) 'ab'(5) //可能捕获到的结果

  var attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+| ([^\s"'=<>`]+)))?/; // 匹配属性的 

  var startTagClose = /^\s*(\/?)>/; // 匹配标签结束的 >

  var defaultTagRE = /\{\{((?:.|\n)+?)\}\}/g; // 匹配{{}}

  var root = null; // 树根

  var currentParent; //保存当前父亲 渲染div 父亲就是空 渲染P 父亲是div  标识当前父亲是谁

  var stack = []; // 类型

  var ELEMENT_TYPE = 1;
  var TEXT_TYPE = 3; // <div><p>//要知道父子关系
  // [div,p,span,] 语法是否正确 使用栈的原理 进行匹配

  function createASTElement(tagName, attrs) {
    return {
      tag: tagName,
      attrs: attrs,
      type: ELEMENT_TYPE,
      children: [],
      parent: null
    };
  }

  function start(tagName, attrs) {
    // console.log("开始标签是：",tagName,"属性是:",attrs)
    // 遇到开始标签 创建一个ast元素
    var element = createASTElement(tagName, attrs);

    if (!root) {
      //因为只有一个DOM结点
      root = element;
    }

    currentParent = element; // 把当前元素标记成父ast树

    stack.push(element); // 将开始标签放到栈中 是放element 不是标签名
  }

  function chars(text) {
    // 去掉空字符串
    text = text.replace(/\s/g, '');

    if (text) {
      currentParent.children.push({
        text: text,
        type: TEXT_TYPE
      });
    } // console.log('文本是:',text)

  }

  function end(tagName) {
    // <div><p>//要知道父子关系
    // console.log(tagName)
    var element = stack.pop(); // 标识当前这个P是属于这个div的儿子的

    currentParent = stack[stack.length - 1]; // 如果存在 因为最后一个标签的话 可能呢是空的
    // 如果存在 那么该元素的父亲就是currentParent 
    // 父亲的子节点就是这个element
    // 特殊标签 暂时不做考虑 比如a标签

    if (currentParent) {
      // 实现了一个树的父子关系
      element.parent = currentParent;
      currentParent.children.push(element);
    } // 只能在关闭的时候 才可以确认父子关系 一开始是不可以的
    // 比如 div p span

  } // 核心规则 就是不停地去拿这些正则去匹配当前的字符串 每匹配到一段字符串 我们就截取字符串
  // 正则匹配 加循环 解析成AST语法树


  function parseHTML(html) {
    // 不停地去解析
    while (html) {
      var textEnd = html.indexOf('<');

      if (textEnd == 0) {
        // 如果当前索引为0 肯定是一个标签 开始标签或者结束标签
        var startTagMatch = parseStartTag(); // 通过这个方法获取到匹配的结果 tagName,attrs

        if (startTagMatch) {
          start(startTagMatch.tagName, startTagMatch.attrs); // 1.得到开始标签和结果是就要开始解析标签

          continue; // 如果开始标签匹配完之后 继续下一次匹配
        }

        var endTagMatch = html.match(endTag);

        if (endTagMatch) {
          advance(endTagMatch[0].length);
          end(endTagMatch[1]); // 2. 解析结束标签

          continue;
        }
      }

      var text = void 0; // 去掉div之后 下一行 一开始可能是空字符串 或者字符串 我们需要截取做处理

      if (textEnd >= 0) {
        text = html.substring(0, textEnd);
      } // 前进文本的位置


      if (text) {
        advance(text.length);
        chars(text); // 3.解析文本
      }
    } // 前进多少位 也就是截取


    function advance(n) {
      html = html.substring(n);
    }

    function parseStartTag() {
      var start = html.match(startTagOpen); // console.log(start)
      // ["<div", "div", index: 0, xx]  
      // 所以我们需要截取第一个<div

      if (start) {
        var match = {
          tagName: start[1],
          attrs: []
        };
        advance(start[0].length); // 将匹配到的标签从HTML删除

        var _end, attr; // 判断能否匹配到结束标签 匹配结束标签之前的数据 就是属性
        // 没有匹配到结束标签 且 attr匹配到了属性 就把这个属性添加到match 并在html删除该字符串


        while (!(_end = html.match(startTagClose)) && (attr = html.match(attribute))) {
          // 将属性进行解析
          advance(attr[0].length);
          match.attrs.push({
            name: attr[1],
            value: attr[3] || attr[4] || attr[5]
          }); // 第二个是 = 第三个是值 双引号 第四个单引号 第五个是没有符号
        }

        if (_end) {
          //去掉开始标签
          advance(_end[0].length);
        }

        return match;
      }
    } // 最终会生成一个AST树


    return root;
  } //处理attrs 生成我们想要的字符串


  function genProps(attrs) {
    console.log(attrs);
    var str = "";

    for (var i = 0; i < attrs.length; i++) {
      var attr = attrs[i];

      if (attr.name === "style") {
        (function () {
          // style="color:red;"=>style:{color:red,} => 最后再加{}
          var obj = {};
          attr.value.split(';').forEach(function (item) {
            var _item$split = item.split(':'),
                _item$split2 = _slicedToArray(_item$split, 2),
                key = _item$split2[0],
                value = _item$split2[1];

            obj[key] = value;
          }); // 重写style value的值

          attr.value = obj;
        })();
      } // JSON.stringify 用来解析{color:red 要不然解析不了}


      str += "".concat(attr.name, ":").concat(JSON.stringify(attr.value), ",");
    }

    return "{".concat(str.slice(0, -1), "}"); //最后一个逗号不要
  }

  function genChildren(el) {
    var children = el.children;

    if (children.length > 0) {
      return "".concat(children.map(function (c) {
        return gen(c);
      }).join(','));
    } else {
      return false;
    }
  }

  function generate(el) {
    var children = genChildren(el);
    return "_c(\"".concat(el.tag, "\",").concat(el.attrs.length > 0 ? genProps(el.attrs) : 'undefined').concat(children ? ",".concat(children) : '', ")");
  }

  function gen(node) {
    if (node.type === 1) {
      //元素标签
      return generate(node);
    } else {
      var text = node.text; //a  {{name}}  b {{age}}  c 

      var tokens = [];
      var match, index; // 每次的偏移量

      var lastIndex = defaultTagRE.lastIndex = 0; // 正则的坑 当他匹配一次之后 lastIndex的索引问题 
      // 只要是全局匹配 就需要将lastIndex每次匹配的lastIndex调到0处。 
      // /abc/.test('a') 第二次的话 就是false 所以需要重置

      while (match = defaultTagRE.exec(text)) {
        index = match.index;

        if (index > lastIndex) {
          //比较匹配到的值上次的值 
          tokens.push(JSON.stringify(text.slice(lastIndex, index))); // 相当于截取a  这段
        }

        tokens.push("_s(".concat(match[1].trim(), ")")); //{{name}}

        lastIndex = index + match[0].length; //记录用
      }

      if (lastIndex < text.length) {
        tokens.push(JSON.stringify(text.slice(lastIndex))); // 最后一次 c 没有匹配到
      }

      return "_v(".concat(tokens.join('+'), ")");
    }
  }

  function compileToFunction(template) {
    // 1. 解析HTML成AST语法树
    var root = parseHTML(template); // 2. 需要将ast语法树生成最终的render函数  核心逻辑 字符串拼接  

    var code = generate(root); // <div id="app">
    // <p>{{name}}</p>
    // <span>{{age}}</span>	
    // </div>
    // _c 创建结点 _s 创建字符串(原理是JSON.stringify) _v 创建文本
    // 最终结果 将ast树 再次转化成JS语法。
    // 开发时候 我们并不会去使用这样的一个模板 因为这样 很浪费性能。
    // render return _c('div',{id:app},_c('p',undefined,_v(_s(name))),_c('span',undefined,_v(_s(age))))
    // 3. 生成函数 所有模板的引擎实现 都需要new Function + with
    // with(this._data){
    // 	//这里的变量 可以取this._data这个作用域下的值。 
    // 	console.log(name)
    // }

    code = "with(this){return ".concat(code, "}");
    var renderFn = new Function(code); // vm._render 就是这样的实现
    // Vue的_render 是返回虚拟DOM的

    return renderFn; // console.log(root)
    // console.log(renderFn)
  }
  /**
  nodeType =1 文档元素 nodeType = 3文本类型

  分析 start div attrs:[{name:"id","value:"app"}]
  	start  p
  	text {{name}}
  	end   p
  	start span
  	text {{age}}
  	end  span
  	end div
  这个过程 就是截取字符串 抽出来当成ast语法树
  	 <div id="app">
  		<p>{{name}}</p>
  		<span>{{age}}</span>	
  	 </div>


  	转成AST语法树
  let root =｛
  	tag:'div',
  	attrs:[{name:id,value:"app"}],
  	parent:null,
  	type:1,
  	children:[{
  		tag:'p',
  		attrs:[],
  		parent:root,
  		type:1,
  		children:[{
  			text:"{{name}}",
  			type:3
  		}]
  	}]
   ｝

   不能有多个根节点 因为要做diff操作，diff操作是从树根开始 你不可能有两个树根。

   使用 const compiler = require(Vue-template-compiler) 包

   let r = compiler.compiler("<div></div>")
  **/

  var Watcher = /*#__PURE__*/function () {
    function Watcher(vm, exprorFn, callback, options) {
      _classCallCheck(this, Watcher);

      this.vm = vm;
      this.exprorFn = exprorFn;
      this.callback = callback;
      this.options = options;
      this.getter = exprorFn; //将内部传过来的的回调函数 放到getter属性上

      this.get();
    }

    _createClass(Watcher, [{
      key: "get",
      value: function get() {
        this.getter();
      }
    }]);

    return Watcher;
  }();

  function patch(oldVode, vnode) {
    console.log(oldVode, vnode); //vnode 和ast抽象树很像 但是真实的情况下 我们还有v-model v-for 事件等等等情况 ast抽象树并不能生成真实的代码
    // 1. 判断是更新还是渲染

    var isRealElement = oldVode.nodeType;

    if (isRealElement) {
      var oldElm = oldVode; // div id=app

      var parentElm = oldElm.parentNode; //body 要把虚拟节点放到

      var el = createElm(vnode);
      parentElm.insertBefore(el, oldElm.nextSibling); //插入在老元素的ID之后 紧随那种 不能用append 要不然会在最后

      parentElm.removeChild(oldElm); // 删除老结点
    } // 递归创建真实结点 替换掉老的结点。

  }

  function createElm(vnode) {
    var tag = vnode.tag,
        data = vnode.data,
        key = vnode.key,
        children = vnode.children,
        text = vnode.text; //是标签 就创建标签

    if (typeof tag === 'string') {
      vnode.el = document.createElement(tag);
      updateProperties(vnode);
      children.forEach(function (child) {
        //递归创建儿子节点，将儿子节点扔到父节点上。
        return vnode.el.appendChild(createElm(child));
      });
    } else {
      //虚拟DOM上映射着真实DOM 方便后续更新操作
      vnode.el = document.createTextNode(text);
    }

    return vnode.el; // 记得是有返回值的
    // 如果不是标签 就是文本
  } // 更新属性的值


  function updateProperties(vnode) {
    var newProps = vnode.data || {};
    var el = vnode.el;

    for (var key in newProps) {
      if (key === 'style') {
        for (var styleName in newProps.style) {
          el.style[styleName] = newProps.style[styleName];
        }
      } else if (key === 'class') {
        el.className = newProps["class"];
      } else {
        el.setAttribute(key, newProps[key]);
      }
    }
  }

  function lifecyleMixin(Vue) {
    Vue.prototype._update = function (vnode) {
      var vm = this; // 通过虚拟节点 渲染出真实的DOM
      // console.log(vnode)

      vm.$el = patch(vm.$el, vnode); //需要用虚拟节点创建出真实结点 替换掉真实的$el
      // patch 也是更新的 判断diff的一部分
    };
  }
  function mountComponent(vm, el) {
    var options = vm.$options; //render

    vm.$el = el; //真实的元素
    // watcher 就是用来渲染的
    // vm._render 通过解析render方法 渲染出虚拟DOM
    // vm._update 通过虚拟DOM 创建珍惜结点
    // 渲染页面

    var updateComponent = function updateComponent() {
      //无论渲染还是更新 都会调用此方法
      // 返回的是虚拟DOM_render
      vm._update(vm._render());
    }; // 渲染watcher 每一个组件都有一个watcher  渲染watcher 不需要通知谁 所以第三个是一个空函数


    new Watcher(vm, updateComponent, function () {}, true); //true标识他是一个渲染watcher
    // 一个组件只有一个渲染watcher
  }

  function initMixin(Vue) {
    // 在原型上添加一个init方法  初始化流程
    Vue.prototype._init = function (options) {
      // 做数据的劫持
      var vm = this;
      vm.$options = options; // this.$options就是用户传的属性
      // 初始化状态

      initState(vm); // 分割代码
      // 如果页面传入el属性 需要将页面渲染出来。
      // 如果页面传入了el 我们就要实现挂载
      // 编译过程

      if (vm.$options.el) {
        vm.$mount(vm.$options.el);
      }
    };

    Vue.prototype.$mount = function (el) {
      var vm = this;
      var options = vm.$options;
      el = document.querySelector(el); // 默认先会查找有没有render方法，没有render 会采用tempalate template也没有 就用el中的内容

      if (!options.render) {
        // 对模板进行编译
        var template = options.template; // 取出模板

        if (!template && el) {
          template = el.outerHTML;
        } // console.log(template)


        var render = compileToFunction(template);
        options.render = render; // 我们需要将template 转化成render方法 vue1.0 2.0 虚拟DOM 就可以用DOM DIFF的操作
        // <div id="app">
        // <p>{{name}}</p>
        // <span>{{age}}</span>	
        // </div>
        // _c 创建结点 _s 创建字符串(原理是JSON.stringify) _v 创建文本
        // render return _c('div',{id:app},_c('p',undefined,_v(_s(name))),_c('span',undefined,_v(_s(age))))
        // eval 不安全 因为 
        // let a=1;
        // eval(`console.log(a)`) 它会往上级作用域找 不干净 函数作用域是不会的。 
      } // 最终都是要得到 options.render
      // 渲染当前的组件 挂载这个组件


      mountComponent(vm, el); // vm上的render 执行后的结果 替换el就可以了。
    };
  }

  function createElement(tag) {
    var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var key = data.key;

    if (key) {
      delete data.key;
    }

    for (var _len = arguments.length, children = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      children[_key - 2] = arguments[_key];
    }

    return vnode(tag, data, key, children, undefined); // console.log(tag,data,children)
  }
  function createTextNode(text) {
    return vnode(undefined, undefined, undefined, undefined, text);
  } // 虚拟DOM节点 就是通过_c -v 实现用对象来描述DOM节点的结构 （实际还是对象）

  function vnode(tag, data, key, children, text) {
    return {
      tag: tag,
      data: data,
      key: key,
      children: children,
      text: text
    };
  } // 当然vnode 我们以后也是可以扩展的 比如componentOptions等等
  // 1. 将template转化成ast语法书--》生成render方法--》生成虚拟DOM---》真实DOM
  // 更新过程  重新生成虚拟DOM -》 diff->更新DOM
  // 第一次生成了ast ->render 函数。 更新的时候 我们直接获取render函数 进行值的更新 就可以生成vnode 然后和之前的做比较

  function renderMixin(Vue) {
    // _c 创建元素的虚拟节点
    // _v 创建文本的虚拟节点
    // _s JSON.stringify
    // 里面的_c =》this._c
    Vue.prototype._c = function () {
      return createElement.apply(void 0, arguments); //tag,data,children1,children2
    };

    Vue.prototype._v = function (text) {
      return createTextNode(text);
    };

    Vue.prototype._s = function (val) {
      return val == null ? '' : _typeof(val) === 'object' ? JSON.stringify(val) : val;
    };

    Vue.prototype._render = function () {
      var vm = this;
      var render = vm.$options.render;
      var vnode = render.call(vm); // 去实例上取值 

      return vnode;
    };
  }

  /**
   *@title Vue rewrite
   *
  **/

  function Vue(options) {
    // 必须new 实例化
    if (!this instanceof Vue) {
      return;
    } // 进行Vue的初始化工作


    this._init(options);
  } // 通过引入文件的方式 给Vue原型上添加方法


  initMixin(Vue);
  renderMixin(Vue);
  lifecyleMixin(Vue);

  return Vue;

})));
//# sourceMappingURL=vue.js.map
