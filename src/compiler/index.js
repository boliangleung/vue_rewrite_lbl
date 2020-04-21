
// ast语法树 是用对象来描述原生语法的  虚拟DOM 用对象来描述DOM节点的

// ?:匹配不捕获
// arguments[0] 匹配到的标签 arguments[1] 匹配到的标签名字

// 这个也是参考JQ之父写的一个项目源码
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`; // abc-aa
const qnameCapture = `((?:${ncname}\\:)?${ncname})`;
const startTagOpen = new RegExp(`^<${qnameCapture}`); // 标签开头的正则 捕获的内容是 标签名 
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // 匹配标签结尾的 </div> 
// ID="abc"(3)  'abc'(4) 'ab'(5) //可能捕获到的结果
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+| ([^\s"'=<>`]+)))?/; // 匹配属性的 
const startTagClose = /^\s*(\/?)>/; // 匹配标签结束的 >
const defaultTagRE = /\{\{((?:.|\n)+?)\}\}/g   // 匹配{{}}

let root=null; // 树根
let currentParent; //保存当前父亲 渲染div 父亲就是空 渲染P 父亲是div  标识当前父亲是谁
let stack=[];
// 类型
const ELEMENT_TYPE=1;
const TEXT_TYPE=3;
// <div><p>//要知道父子关系
// [div,p,span,] 语法是否正确 使用栈的原理 进行匹配

function createASTElement(tagName,attrs){
	return {
		tag:tagName,
		attrs,
		type:ELEMENT_TYPE,
		children:[],
		parent:null
	}
}

function start(tagName,attrs){
	// console.log("开始标签是：",tagName,"属性是:",attrs)

	// 遇到开始标签 创建一个ast元素
	let element=createASTElement(tagName,attrs);
	if(!root){ //因为只有一个DOM结点
		root=element
	}
	currentParent = element;// 把当前元素标记成父ast树
	stack.push(element)  // 将开始标签放到栈中 是放element 不是标签名
}

function chars(text){
	// 去掉空字符串
	text=text.replace(/\s/g,'');
	if(text){
		currentParent.children.push({
			text,
			type:TEXT_TYPE
		})
	}
	// console.log('文本是:',text)
}
function end(tagName){
	// <div><p>//要知道父子关系
	// console.log(tagName)
	let element = stack.pop()
	// 标识当前这个P是属于这个div的儿子的
	currentParent = stack[stack.length-1];
	// 如果存在 因为最后一个标签的话 可能呢是空的
	// 如果存在 那么该元素的父亲就是currentParent 
	// 父亲的子节点就是这个element
	// 特殊标签 暂时不做考虑 比如a标签
	if(currentParent){
		// 实现了一个树的父子关系
		element.parent = currentParent
		currentParent.children.push(element)
	}
	// 只能在关闭的时候 才可以确认父子关系 一开始是不可以的
	// 比如 div p span
}




// 核心规则 就是不停地去拿这些正则去匹配当前的字符串 每匹配到一段字符串 我们就截取字符串
// 正则匹配 加循环 解析成AST语法树
function parseHTML(html){
	// 不停地去解析
	while(html){
		let textEnd = html.indexOf('<');
		if(textEnd==0){
			// 如果当前索引为0 肯定是一个标签 开始标签或者结束标签
			let startTagMatch = parseStartTag(); // 通过这个方法获取到匹配的结果 tagName,attrs
			if(startTagMatch){
				start(startTagMatch.tagName,startTagMatch.attrs)  // 1.得到开始标签和结果是就要开始解析标签
				continue;
				// 如果开始标签匹配完之后 继续下一次匹配
			}
			let endTagMatch=html.match(endTag)
			if(endTagMatch){
				advance(endTagMatch[0].length);
				end(endTagMatch[1])		// 2. 解析结束标签
				continue;
			}	
		}
		let text;
		// 去掉div之后 下一行 一开始可能是空字符串 或者字符串 我们需要截取做处理
		if(textEnd>=0){
			text = html.substring(0,textEnd)  
		}
		// 前进文本的位置
		if(text){
			advance(text.length)
			chars(text)   // 3.解析文本
		}

	}
	// 前进多少位 也就是截取
	function advance(n){
		html = html.substring(n);
	}
	function parseStartTag(){
		let start = html.match(startTagOpen)
		// console.log(start)
		// ["<div", "div", index: 0, xx]  
		// 所以我们需要截取第一个<div
		if(start){
			const  match={
				tagName:start[1],
				attrs:[]
			}
			advance(start[0].length) // 将匹配到的标签从HTML删除
			let end,attr;
			// 判断能否匹配到结束标签 匹配结束标签之前的数据 就是属性
			// 没有匹配到结束标签 且 attr匹配到了属性 就把这个属性添加到match 并在html删除该字符串
			while( !(end = html.match(startTagClose))&&(attr = html.match(attribute))){
				// 将属性进行解析
				advance(attr[0].length)
				match.attrs.push({name:attr[1],value:attr[3]||attr[4]||attr[5]}) // 第二个是 = 第三个是值 双引号 第四个单引号 第五个是没有符号
			}
			if(end){ //去掉开始标签
				advance(end[0].length)
			}
			return match
		}
	}
	// 最终会生成一个AST树
	return root
}
//处理attrs 生成我们想要的字符串
function genProps(attrs){
	console.log(attrs)
	let str=""
	for(let i=0;i<attrs.length;i++){
		let attr = attrs[i]
		if(attr.name==="style"){
			// style="color:red;"=>style:{color:red,} => 最后再加{}
			let  obj={}
			attr.value.split(';').forEach(item=>{
				let [key,value] = item.split(':');
				obj[key] = value
			});
			// 重写style value的值
			attr.value=obj;
		}
		// JSON.stringify 用来解析{color:red 要不然解析不了}
		str += `${attr.name}:${JSON.stringify(attr.value)},`
	}
	return `{${str.slice(0,-1)}}` //最后一个逗号不要
}
function genChildren(el){
	let children  = el.children
	if(children.length>0){
		return `${children.map(c => gen(c)).join(',')}`
	}else{
		return false
	}
}
function generate(el){
	let children = genChildren(el)
	let code=``
	return `_c("${el.tag}",${
		el.attrs.length>0?genProps(el.attrs):'undefined'
	}${children?`,${children}`:''})`
}
function gen(node){
	if(node.type===1){
		//元素标签
		return generate(node)
	}else{
		let text =node.text; //a  {{name}}  b {{age}}  c 
		let tokens=[];
		let match,index;
		// 每次的偏移量
		let lastIndex = defaultTagRE.lastIndex=0; // 正则的坑 当他匹配一次之后 lastIndex的索引问题 
		// 只要是全局匹配 就需要将lastIndex每次匹配的lastIndex调到0处。 
		// /abc/.test('a') 第二次的话 就是false 所以需要重置
		while(match=defaultTagRE.exec(text)){
			index = match.index
			if(index>lastIndex){  //比较匹配到的值上次的值 
				tokens.push(JSON.stringify(text.slice(lastIndex,index)))// 相当于截取a  这段
			}
			tokens.push(`_s(${match[1].trim()})`); //{{name}}
			lastIndex=index+match[0].length; //记录用
		}
		if(lastIndex<text.length){
			tokens.push(JSON.stringify(text.slice(lastIndex)))// 最后一次 c 没有匹配到
		}
		
		return `_v(${tokens.join('+')})`
	}
}

export function compileToFunction(template){
	// 1. 解析HTML成AST语法树
	let root = parseHTML(template)

	// 2. 需要将ast语法树生成最终的render函数  核心逻辑 字符串拼接  

	let code = generate(root)
		// <div id="app">
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
	code = `with(this){return ${code}}`
	let renderFn = new Function(code)
	// vm._render 就是这样的实现

	// Vue的_render 是返回虚拟DOM的
	return renderFn;
	// console.log(root)
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