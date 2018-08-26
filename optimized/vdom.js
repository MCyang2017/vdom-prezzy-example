let vdom = {
    "tag": "div",
    "props": {},
    "children": ["Hello World", {
        "tag": "ul",
        "props": {},
        "children": [{
            "tag": "li",
            "props": {
                "id": 0,
                "class": "li-0"
            },
            "children": ["第", 0]
        }]
    }]
}

let patchObj = {
    type: "update node",
    props: [],
    children: [
        null, 
        {
            type: "update node",
            props: [],
            children: [
                null, 
                {
                    type: "update node",
                    props: [],
                    children: [
                        null, 
                        {
                            type: "replace node",
                            vdom: 6
                        }
                    ]
                }
            ]
        },
        {
            type: "create node",
            vdom: {
                tag: "li",
                props: {
                    id: 5,
                    class: "li-5"
                },
                children: ["第", 30]
            }
        }
    ]
}