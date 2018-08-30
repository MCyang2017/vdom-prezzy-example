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

const arr = [0, 1, 2, 3, 4];

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
    const elm = arr.pop();

    // 用于测试能不能正常删除元素
    if (state.num !== 9) arr.unshift(elm);

    // 用于测试能不能正常添加元素
    if (state.num === 12) arr.push(9);

    return (
        <div>
            Hello World
            <ul myText="dickens">
                {
                    arr.map( i => (
                        <li id={i} class={`li-${i}`} key={i}>
                            第{i}
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
    // 有key的子元素
    const nodesWithKey = {};
    let nodesWithKeyCount = 0;

    // 没key的子元素
    const nodesWithoutKey = [];
    let nodesWithoutKeyCount = 0;

    const childNodes = parent.childNodes,
          nodeLength = childNodes.length;

    const vChildren = newVDom.children,
          vLength = vChildren.length;

    // 用于优化没key子元素的数组遍历
    let min = 0;

    // 将子元素分成有key和没key两组
    for (let i = 0; i < nodeLength; i++) {
        const child = childNodes[i],
              props = child[ATTR_KEY];

        if (props !== undefined && props.key !== undefined) {
            nodesWithKey[props.key] = child;
            nodesWithKeyCount++;
        } else {
            nodesWithoutKey[nodesWithoutKeyCount++] = child;
        }
    }

    // 遍历vdom的所有子元素
    for (let i = 0; i < vLength; i++) {
        const vChild = vChildren[i],
              vProps = vChild.props;
        let dom;

        vKey = vProps!== undefined ? vProps.key : undefined;
        // 根据key来查找对应元素
        if (vKey !== undefined) {
            if (nodesWithKeyCount && nodesWithKey[vKey] !== undefined) {
                dom = nodesWithKey[vKey];
                nodesWithKey[vKey] = undefined;
                nodesWithKeyCount--; 
            }
        } 
        // 如果没有key字段，则找一个类型相同的元素出来做比较
        else if (min < nodesWithoutKeyCount) {
            for (let j = 0; j < nodesWithoutKeyCount; j++) {
                const node = nodesWithoutKey[j];
                if (node !== undefined && isSameType(node, vChild)) {
                    dom = node;
                    nodesWithoutKey[j] = undefined;
                    if (j === min) min++;
                    if (j === nodesWithoutKeyCount - 1) nodesWithoutKeyCount--;
                    break;
                }
            }
        }

        // diff返回是否更新元素
        const isUpdate = diff(dom, vChild, parent);

        // 如果是更新元素，且不是同一个dom元素，则移动到原先的dom元素之前
        if (isUpdate) {
            const originChild = childNodes[i];
            if (originChild !== dom) {
                parent.insertBefore(dom, originChild);
            }
        }
    }

    // 清理剩下的未使用的dom元素
    if (nodesWithKeyCount) {
       for (key in nodesWithKey) {
           const node = nodesWithKey[key];
           if (node !== undefined) {
               node.parentNode.removeChild(node);
           }
       } 
    }
    // 清理剩下的未使用的dom元素
    while (min <= nodesWithoutKeyCount) {
        const node = nodesWithoutKey[nodesWithoutKeyCount--];
		if ( node !== undefined) {
            node.parentNode.removeChild(node);
        }
	}
}

function diff(dom, newVDom, parent) {
    // 新建node
    if (dom == undefined) {
        parent.appendChild(createElement(newVDom));
        return false;
    }

    // 删除node
    if (newVDom == undefined) {
        parent.removeChild(dom);
        return false;
    }

    // 替换node
    if (!isSameType(dom, newVDom)) {
        parent.replaceChild(createElement(newVDom), dom);
        return false;
    }

    // 更新node
    if (dom.nodeType === Node.ELEMENT_NODE) {
        // 比较props的变化
        diffProps(newVDom, dom);

        // 比较children的变化
        diffChildren(newVDom, dom);
    }

    return true;
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
    const dom = element.firstChild;

    // 比较并更新节点
    diff(dom, newVDom, element);
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
