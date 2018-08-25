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

function flatten(elm) {
    return [].concat.apply([], elm);
}

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
            null,
            h(
                'li',
                { id: '1', 'class': 'li-1' },
                '\u7B2C1'
            )
        )
    );
}

function setProps(element, props) {
    for (let key in props) {
        element.setAttribute(key, props[key]);
    }
}

function createElement(vdom) {
    if (typeof vdom === 'string' || typeof vdom === 'number') {
        return doc.createTextNode(vdom);
    }

    const { tag, props, children } = vdom;

    const element = doc.createElement(tag);

    setProps(element, props);

    children.map(createElement).forEach(element.appendChild.bind(element));

    return element;
}

function render(parent) {
    const vdom = view();

    const element = createElement(vdom);

    parent.appendChild(element);
}
