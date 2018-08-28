var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

const doc = document;
const nodePatchTypes = {
    CREATE: 'create node',
    REMOVE: 'remove node',
    REPLACE: 'replace node',
    UPDATE: 'update node'
};
const propPatchTypes = {
    REMOVE: 'remove prop',
    UPDATE: 'update prop'
};

let state = {
    num: 5
};
let timer;
let preVDom;

function setState(newState) {
    state = _extends({}, state, newState);
}

function flatten(arr) {
    return [].concat.apply([], arr);
}

// 生成vdom
function h(tag, props, ...children) {
    return {
        tag,
        props: props || {},
        children: flatten(children) || []
    };
}

function view() {
    return h(
        'div',
        null,
        'Hello World',
        h(
            'ul',
            { myText: 'dickens' },

            // 生成元素为0到n-1的数组
            [...Array(state.num).keys()].map(i => h(
                'li',
                { id: i, 'class': `li-${i}` },
                '\u7B2C',
                i
            ))
        )
    );
}

// 创建dom元素
function createElement(vdom) {
    // 如果vdom是字符串或者数字类型，则创建文本节点，比如“Hello World”
    if (typeof vdom === 'string' || typeof vdom === 'number') {
        return doc.createTextNode(vdom);
    }

    const { tag, props, children } = vdom;

    // 1. 创建元素
    const element = doc.createElement(tag);

    // 2. 属性赋值
    setProps(element, props);

    // 3. 创建子元素
    children.map(createElement).forEach(element.appendChild.bind(element));

    return element;
}

// 属性赋值
function setProps(element, props) {
    for (let key in props) {
        element.setAttribute(key, props[key]);
    }
}

// 比较props的变化
function diffProps(oldVDom, newVDom) {
    const allProps = _extends({}, oldVDom.props, newVDom.props);

    // 获取新旧所有属性名后，再逐一判断新旧属性值
    Object.keys(allProps).forEach(key => {
        const oldValue = oldVDom.props[key];
        const newValue = newVDom.props[key];

        // 删除属性
        if (newValue == undefined) {
            element.removeAttribute(key);
        }
        // 更新属性
        else if (oldValue == undefined || oldValue !== newValue) {
                element.setAttribute(key, newValue);
            }
    });
}

// 比较children的变化
function diffChildren(oldVDom, newVDom, parent) {
    // 获取子元素最大长度
    const childLength = Math.max(oldVDom.children.length, newVDom.children.length);

    // 遍历并diff子元素
    for (let i = 0; i < childLength; i++) {
        diff(oldVDom.children[i], newVDom.children[i], parent, i);
    }
}

function diff(oldVDom, newVDom, parent, index = 0) {
    // 新建node
    if (oldVDom == undefined) {
        parent.appendChild(createElement(newVDom));
        return;
    }

    const element = parent.childNodes[index];

    // 删除node
    if (newVDom == undefined) {
        parent.removeChild(element);
        return;
    }

    // 替换node
    if (typeof oldVDom !== typeof newVDom || (typeof oldVDom === 'string' || typeof oldVDom === 'number') && oldVDom !== newVDom || oldVDom.tag !== newVDom.tag) {
        parent.replaceChild(createElement(newVDom), element);
        return;
    }

    // 更新node
    if (oldVDom.tag) {
        // 比较props的变化
        diffProps(oldVDom, newVDom, element);

        // 比较children的变化
        diffChildren(oldVDom, newVDom, element);
    }
}

function tick(element) {
    if (state.num > 20) {
        clearTimeout(timer);
        return;
    }

    const newVDom = view();

    // 比较并更新节点
    diff(preVDom, newVDom, element);

    preVDom = newVDom;
}

function render(element) {
    // 初始化的VD
    const vdom = view();
    preVDom = vdom;

    console.log(vdom);

    const dom = createElement(vdom);
    element.appendChild(dom);

    // 每500毫秒改变一次state，并生成VD
    timer = setInterval(() => {
        state.num += 1;
        tick(element);
    }, 500);
}
