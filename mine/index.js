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
let preVDom;

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
            <ul>
                {
                    // 生成元素为0到n-1的数组
                    [...Array(state.num).keys()]
                        .map( i => (
                            <li id={i} class={`li-${i}`}>
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
    for (let key in props) {
        element.setAttribute(key, props[key]);
    }
}

/**
 * [{
 *      type,
 *      key,
 *      value
 * }]
 */
// 比较props的变化
function diffProps(oldVDom, newVDom) {
    const patches = [];

    const allProps = {...oldVDom.props, ...newVDom.props};

    // 获取新旧所有属性名后，再逐一判断新旧属性值
    Object.keys(allProps).forEach((key) => {
            const oldValue = oldVDom.props[key];
            const newValue = newVDom.props[key];

            // 删除属性
            if (newValue == undefined) {
                patches.push({
                    type: propPatchTypes.REMOVE,
                    key
                });
            } 
            // 更新属性
            else if (oldValue == undefined || oldValue !== newValue) {
                patches.push({
                    type: propPatchTypes.UPDATE,
                    key,
                    value: newValue
                });
            }
        }
    )

    return patches;
}

// 比较children的变化
function diffChildren(oldVDom, newVDom) {
    const patches = [];
    
    // 获取子元素最大长度
    const childLength = Math.max(oldVDom.children.length, newVDom.children.length);

    // 遍历并diff子元素
    for (let i = 0; i < childLength; i++) {
        patches.push(diff(oldVDom.children[i], newVDom.children[i]));
    }

    return patches;
}

/**
 * {
 *      type,
 *      vdom,
 *      props,
 *      children
 * }
 */
function diff(oldVDom, newVDom) {
    // 新建node
    if (oldVDom == undefined) {
        return {
            type: nodePatchTypes.CREATE,
            vdom: newVDom
        }
    }

    // 删除node
    if (newVDom == undefined) {
        return {
            type: nodePatchTypes.REMOVE
        }
    }

    // 替换node
    if (
        typeof oldVDom !== typeof newVDom ||
        ((typeof oldVDom === 'string' || typeof oldVDom === 'number') && oldVDom !== newVDom) ||
        oldVDom.tag !== newVDom.tag
    ) {
       return {
           type: nodePatchTypes.REPLACE,
           vdom: newVDom
       } 
    }

    // 更新node
    if (oldVDom.tag) {
        // 比较props的变化
        const propsDiff = diffProps(oldVDom, newVDom);

        // 比较children的变化
        const childrenDiff = diffChildren(oldVDom, newVDom);

        // 如果props或者children有变化，才需要更新
        if (propsDiff.length > 0 || childrenDiff.some( patchObj => (patchObj !== undefined) )) {
            return {
                type: nodePatchTypes.UPDATE,
                props: propsDiff,
                children: childrenDiff
            }   
        }
        
    }
}


// 更新属性
function patchProps(element, props) {
    if (!props) {
        return;
    }

    props.forEach( patchObj => {
        // 删除属性
        if (patchObj.type === propPatchTypes.REMOVE) {
            element.removeAttribute(patchObj.key);
        } 
        // 更新或新建属性
        else if (patchObj.type === propPatchTypes.UPDATE) {
            element.setAttribute(patchObj.key, patchObj.value);
        }
    })
}

// 给dom打个补丁
function patch(parent, patchObj, index=0) {
    if (!patchObj) {
        return;
    }

    // 新建元素
    if (patchObj.type === nodePatchTypes.CREATE) {
        return parent.appendChild(createElement(patchObj.vdom));
    }

    const element = parent.childNodes[index];

    // 删除元素
    if (patchObj.type === nodePatchTypes.REMOVE) {
        return parent.removeChild(element);
    }

    // 替换元素
    if (patchObj.type === nodePatchTypes.REPLACE) {
        return parent.replaceChild(createElement(patchObj.vdom), element);
    }

    // 更新元素
    if (patchObj.type === nodePatchTypes.UPDATE) {
        const {props, children} = patchObj;

        // 更新属性
        patchProps(element, props);

        // 更新子元素
        children.forEach( (patchObj, i) => {
            // 更新子元素时，需要将子元素的序号传入
            patch(element, patchObj, i)
        });
    }
}

function tick(element) {
    if (state.num > 20) {
        clearTimeout(timer);
        return;
    }

    const newVDom = view();

    // 生成差异对象
    const patchObj = diff(preVDom, newVDom);

    preVDom = newVDom;

    // 给dom打个补丁
    patch(element, patchObj);
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
