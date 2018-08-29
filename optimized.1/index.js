const doc = document;
const nodePatchTypes = {
    CREATE: 'create node',
    REMOVE: 'remove node',
    REPLACE: 'replace node',
    UPDATE: 'update node'
}
const propPatchTypes = {
    REMOVE: 'remove prop',
    UPDATE: 'update prop'
}

let state = {
    num: 5
};
let timer;

const ATTR_KEY = '__preprops_';

function setState(newState) {
    state = {...state, ...newState};
}

function flatten(arr) {
    return []
        .concat
        .apply([], arr)
}

// 生成vdom
function h(tag, props, ...children) {
    return {
        tag,
        props: props || {},
        children: flatten(children) || []
    }
}

function view() {
    return (
        <div>
            Hello World
            <ul myText="dickens">
                {
                    // 生成元素为0到n-1的数组
                    [...Array(state.num).keys()]
                        .map( i => (
                            <li id={i} class={`li-${Math.floor(Math.random() * 100) % 5}`}>
                                第{i * state.num}
                            </li>
                        ))
                }
            </ul>
        </div>
    );
}

// 创建dom元素
function createElement(vdom) {
    // 如果vdom是字符串或者数字类型，则创建文本节点，比如“Hello World”
    if (typeof vdom === 'string' || typeof vdom === 'number') {
        return doc.createTextNode(vdom);
    }

    const {tag, props, children} = vdom;

    // 1. 创建元素
    const element = doc.createElement(tag);

    // 2. 属性赋值
    setProps(element, props);

    // 3. 创建子元素
    children.map(createElement)
            .forEach(element.appendChild.bind(element));

    return element;
}

// 属性赋值
function setProps(element, props) {
     // 属性赋值
    element[ATTR_KEY] = props;

    for (let key in props) {
        element.setAttribute(key, props[key]);
    }
}

// 比较props的变化
function diffProps(newVDom, element) {
    let newProps = {...element[ATTR_KEY]};
    const allProps = {...newProps, ...newVDom.props};

    // 获取新旧所有属性名后，再逐一判断新旧属性值
    Object.keys(allProps).forEach((key) => {
            const oldValue = newProps[key];
            const newValue = newVDom.props[key];

            // 删除属性
            if (newValue == undefined) {
                element.removeAttribute(key);
                delete newProps[key];
            } 
            // 更新属性
            else if (oldValue == undefined || oldValue !== newValue) {
                element.setAttribute(key, newValue);
                newProps[key] = newValue;
            }
        }
    )

    // 属性重新赋值
    element[ATTR_KEY] = newProps;
}

// 比较children的变化
function diffChildren(newVDom, parent) {
    // 获取子元素最大长度
    const childLength = Math.max(parent.childNodes.length, newVDom.children.length);

    // 遍历并diff子元素
    for (let i = 0; i < childLength; i++) {
        diff(newVDom.children[i], parent, i);
    }
}

function diff(newVDom, parent, index=0) {
    
    const element = parent.childNodes[index];

    // 新建node
    if (element == undefined) {
        parent.appendChild(createElement(newVDom));
        return;
    }

    // 删除node
    if (newVDom == undefined) {
        parent.removeChild(element);
        return;
    }

    // 替换node
    if (!isSameType(element, newVDom)) {
        parent.replaceChild(createElement(newVDom), element);
        return;
    }

    // 更新node
    if (element.nodeType === Node.ELEMENT_NODE) {
        // 比较props的变化
        diffProps(newVDom, element);

        // 比较children的变化
        diffChildren(newVDom, element);
    }
}

// 比较元素类型是否相同
function isSameType(element, newVDom) {
    const elmType = element.nodeType;
    const vdomType = typeof newVDom;

    // 当dom元素是文本节点的情况
    if (elmType === Node.TEXT_NODE && 
        (vdomType === 'string' || vdomType === 'number') &&
        element.nodeValue == newVDom
    ) {
       return true; 
    }

    // 当dom元素是普通节点的情况
    if (elmType === Node.ELEMENT_NODE && element.tagName.toLowerCase() == newVDom.tag) {
        return true;
    }

    return false;
}

function tick(element) {
    if (state.num > 20) {
        clearTimeout(timer);
        return;
    }

    const newVDom = view();

    // 比较并更新节点
    diff(newVDom, element);
}

function render(element) {
    // 初始化的VD
    const vdom = view();

    console.log(vdom);

    const dom = createElement(vdom);
    element.appendChild(dom);

    // 每500毫秒改变一次state，并生成VD
    timer = setInterval(() => {
        state.num += 1;
        tick(element);
    }, 500);
}
