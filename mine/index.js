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

function createElement(vdom) {
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
function diffProps(oldVDom, newVDom) {
    const patches = [];

    const allProps = {...oldVDom.props, ...newVDom.props};

    // 获取新旧所有属性名后，再逐一判断新旧属性值
    Object.keys(allProps).forEach((key) => {
            const oldValue = oldVDom.props[key];
            const newValue = newVDom.props[key];

            if (newValue == undefined) {
                patches.push({
                    type: propPatchTypes.REMOVE,
                    key
                });
            } else if (oldValue == undefined || oldValue !== newValue) {
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
        const propsDiff = diffProps(oldVDom, newVDom);
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



function patchProps(element, props) {
    if (!props) {
        return;
    }

    props.forEach( patchObj => {
        if (patchObj.type === propPatchTypes.REMOVE) {
            element.removeAttribute(patchObj.key);
        } else if (patchObj.type === propPatchTypes.UPDATE) {
            element.setAttribute(patchObj.key, patchObj.value);
        }
    })
}

function patch(parent, patchObj, index=0) {
    if (!patchObj) {
        return;
    }

    if (patchObj.type === nodePatchTypes.CREATE) {
        return parent.appendChild(createElement(patchObj.vdom));
    }

    const element = parent.childNodes[index];

    if (patchObj.type === nodePatchTypes.REMOVE) {
        return parent.removeChild(element);
    }

    if (patchObj.type === nodePatchTypes.REPLACE) {
        return parent.replaceChild(createElement(patchObj.vdom), element);
    }

    if (patchObj.type === nodePatchTypes.UPDATE) {
        const {props, children} = patchObj;
        // 更新属性
        patchProps(element, props);
        // 更新子元素
        children.forEach( (patchObj, i) => {
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

    const patchObj = diff(preVDom, newVDom);

    preVDom = newVDom;

    console.log(patchObj);

    patch(element, patchObj);
}

function render(element) {
    const vdom = view();
    preVDom = vdom;

    const dom = createElement(vdom);
    element.appendChild(dom);

    timer = setInterval(() => {
        state.num += 1;
        tick(element);
    }, 500);
}
