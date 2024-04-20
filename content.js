const g_observers = [];
const CANVAS_RATIO = 1.5;

const SHOWN_ICON_BASE64 = "PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNMy42ODggMTJhMTUuNjM0IDE1LjYzNCAwIDAgMCAyLjA4OSAyLjgyYzEuNDk4IDEuNiAzLjYwNiAzLjA5NyA2LjIyMyAzLjA5N3M0LjcyNC0xLjQ5NyA2LjIyMy0zLjA5N0ExNS42IDE1LjYgMCAwIDAgMjAuMzEyIDEyYTE0IDE0IDAgMCAwLS4zODgtLjYzNSAxNS42IDE1LjYgMCAwIDAtMS43LTIuMTg1Yy0xLjUtMS42LTMuNjA3LTMuMDk3LTYuMjI0LTMuMDk3UzcuMjc2IDcuNTggNS43NzYgOS4xOGExNS42IDE1LjYgMCAwIDAtMS43MDEgMi4xODUgMTQgMTQgMCAwIDAtLjM4OC42MzVtMTguMTQ5LS4zMzYtLjAwMS0uMDAyLS4wMDMtLjAwNi0uMDEtLjAxOGExMCAxMCAwIDAgMC0uMTU4LS4yOTIgMTcuMTUzIDE3LjE1MyAwIDAgMC0yLjM0OC0zLjE5MkMxNy42OTMgNi40MiAxNS4yMTcgNC41ODQgMTIgNC41ODRTNi4zMDcgNi40MiA0LjY4MiA4LjE1M2ExNyAxNyAwIDAgMC0yLjM0OCAzLjE5MiAxMCAxMCAwIDAgMC0uMTU4LjI5MmwtLjAxLjAxOC0uMDAyLjAwNi0uMDAxLjAwMXMwIC4wMDIuNjcuMzM3bC0uNjctLjMzNWEuNzUuNzUgMCAwIDAgMCAuNjdsLjY3LS4zMzUtLjY3LjMzNnYuMDAybC4wMDQuMDA2LjAwOS4wMThhMTAgMTAgMCAwIDAgLjE1OC4yOTIgMTcuMTQ5IDE3LjE0OSAwIDAgMCAyLjM0OCAzLjE5MmMxLjYyNSAxLjczNCA0LjEwMSAzLjU3IDcuMzE4IDMuNTdzNS42OTItMS44MzYgNy4zMTgtMy41N2ExNyAxNyAwIDAgMCAyLjM0Ny0zLjE5MiAxMCAxMCAwIDAgMCAuMTU5LS4yOTJsLjAwOS0uMDE4LjAwMy0uMDA1di0uNjc1bTAgLjY3MWEuNzUuNzUgMCAwIDAgMC0uNjd6IiBjbGlwLXJ1bGU9ImV2ZW5vZGQiPjwvcGF0aD48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik04Ljc1IDEyYTMuMjUgMy4yNSAwIDEgMSA2LjUgMCAzLjI1IDMuMjUgMCAwIDEtNi41IDAiIGNsaXAtcnVsZT0iZXZlbm9kZCI+PC9wYXRoPg==";

const disconnect = (observer) =>
{
    if (!observer)
    {
        return null;
    }

    let found_index = -1;
    for (let i = 0; i < g_observers.length && found_index < 0; i++)
    {
        if (g_observers[i] === observer)
        {
            found_index = i;
        }
    }
    if (found_index >= 0)
    {
        g_observers.splice(found_index, 1);
    }
    else
    {
        console.error("Disconnect detached observer!");
    }

    observer.disconnect();
    return null;
};

const availableNodes = ["div", "span", "li", "button", "ul"];
const inputNodes = ["input", "select", "textarea"];

const checkElement = (node, element) =>
{
    if (!!element.className && node.className.includes(element.className))
    {
        return true;
    }
    const keys = Object.keys(element);
    if (keys.length == 1 && keys[0] == "tag")
    {
        const tag = ((node.tagName) ? node.tagName.toLowerCase().trim() : "");
        return (element.tag == tag);
    }
    
    let found = false;
    if (!found && !!element.testId)
    {
        const v = node.getAttribute("data-testid");
        found = (element.testId == v)
    }
    if (!found && !!element.title)
    {
        const v = node.getAttribute("title");
        if (!!v)
        {
            const t = v.toLowerCase().trim();
            found = (element.title == t);
        }
    }
    if (!found && !!element.subtree)
    {
        const innerNode = selectSubelement(node, {...element, subtree: false});
        found = !!innerNode;
    }
    return found;
};

const checkFirstNode = (list, element) =>
{
    const node = list[0];
    
    if (!!node.tagName)
    {
        const tag = node.tagName.toLowerCase().trim();
        if (availableNodes.includes(tag) && checkElement(node, element))
        {
            return node;
        }
    }
    return null;
};

const selectSubelement = (node, element) =>
{
    if (!element.tag)
    {
        console.error("Illegal element structure: TAG is undefined");
        return null;
    }

    const elements = node.getElementsByTagName(element.tag);
    for (let i = 0; i < elements.length; i++)
    {
        if (checkElement(elements[i], element))
        {
            return elements[i];
        }
    }
    return null;
};

const selectElement = (node, element) =>
{
    if (checkElement(node, element))
    {
        return node;
    }
    const keys = Object.keys(element);
    if (keys.length == 1 && keys[0] == "tag")
    {
        const elements = node.getElementsByTagName(element.tag);
        return ((elements.length > 0) ? elements[0] : null);
    }

    return selectSubelement(node, element);
};

const selectAllElements = (node, element, firstLevelChild) =>
{
    if (!node)
    {
        throw new Error("Illegal NODE for selection"); 
    }

    if (!!element["tag"])
    {
        const elements = node.getElementsByTagName(element.tag);
        const result = [];
        for (let i = 0; i < elements.length; i++)
        {
            if (!firstLevelChild || node === element.parentNode)
            {
                if (checkElement(elements[i], element))
                {
                    result.push(elements[i]);
                }
            }
        }
        return result;
    }
    console.log(element);
    throw new Error("Illegal element PATTERN for selection");
};

const waitAttribute = (parentNode, name, value, callback) =>
{
    const config = 
    {
        attributes: true
    };
    const privateCallback = (args, sender) =>
    {
        console.log("%cprivate callback attributes...", "color: rgb(200,200,200)");
        for (const m of args)
        {
            if (m.type == "attributes")
            {
                if (m.attributeName == name)
                {
                    if (typeof(value) == "string")
                    {
                        const val = m.target.getAttribute("name");
                        if (typeof(val) == "string")
                        {
                            const v = val.toLocaleLowerCase().trim();
                            if (v == value.toLocaleLowerCase().trim())
                            {
                                callback(parentNode, name, value);
                            }
                        }
                    }
                    else                        
                    {
                        callback(parentNode, name);
                    }
                }
            }
        }
    };

    const observer = new MutationObserver(privateCallback);
    observer.observe(parentNode, config);
    
    g_observers.push(observer);
    return observer;
};

//
// TODO: implement waitOnce() to optimize number of callbacks on FE rendering
//
const waitFirstElement = (parentNode, element, callback, detached, modified) =>
{
    //
    // TODO: for subtree detection return triggered node directly (not root of subtree)
    //
    const content = (typeof(modified) == "function");
    const nodes = (typeof(callback) == "function" || typeof(detached) == "function") && !modified;
    const subtree = content || nodes;
    const config = 
    {
        characterData: content,
        attributes: false,
        childList: nodes,
        subtree: subtree
    };

    const privateCallback = (args, sender) =>
    {
        console.log("%cprivate callback...", "color: rgb(200,200,200)");
        for (const m of args)
        {
            if (m.type == "childList")
            {
                if (typeof(callback) == "function" &&
                    m.addedNodes && m.addedNodes.length > 0)
                {
                    if (element.className == "elements__SidebarHeader")
                    {
                        const a = 0;
                    }
                    const node = checkFirstNode(m.addedNodes, element);
                    if (!!node)
                    {
                        console.log(`%cadded ${print(element)}` , "color: rgb(200,200,200)");
                        callback(node);
                    }
                }
                else if (typeof(detached) == "function" && 
                    m.removedNodes && m.removedNodes.length > 0)
                {
                    const node = checkFirstNode(m.removedNodes, {...element, subtree: element.subtreeOnDetach});
                    if (!!node)
                    {
                        console.log(`%cremoved ${print(element)}` , "color: rgb(200,200,200)");
                        detached(node);
                    }
                }
            }
            else if (m.type == "characterData")
            {
                if (typeof(modified) == "function")
                {
                    modified(parentNode);
                }
            }
            else
            {
                console.log(m);
            }
        }
    };

    const observer = new MutationObserver(privateCallback);
    observer.observe(parentNode, config);
    
    g_observers.push(observer);
    return observer;
};

const print = (element) =>
{
    let str = "";

    if (element.tag)
    {
        str += element.tag;
    }
    else
    {
        str += "*";
    }

    if (element.className)
    {
        str += `.${element.className}`;
    }

    if (element.testId)
    {
        str += `#${element.testId}`;
    }
    return str;
};

const ELEMENTS = 
{
    PLAYER: 
    {
        tag: "div",
        testId: "media-player-decoder"
    },
    TIMESTAMP: 
    {
        tag: "span",
        testId: "current-time"
    },
    TIMERANGE:
    {
        tag: "input",
        testId: "time-range"
    },
    CONTROLBAR:
    {
        tag: "div",
        testId: "controls-bar"
    },
    TOOLTIP: 
    {
        tag: "div",
        testId: "description-modal"
    },
    TOOLBAR: 
    {
        tag: "div",
        className: "sc-jSUZER"
    },
    CANVAS:
    {
        tag: "div",
        className: "canvas-container",
        subtreeOnDetach: true
    },
    VIDEO:
    {
        tag: "video",
        testId: "video-player"
    },
    SNAPSHOTS:
    {
        tag: "div",
        testId: "snapshotsListPanel",
        subtree: true
    },
    SIDEBAR_HEADER:
    {
        tag: "div",
        className: "elements__SidebarHeader"
    },
    ADD_OBJECT:
    {
        FORM:
        {
            tag: "div",
            testId: "symbol-form"
        },
        TYPE_SELECTOR:
        {
            tag: "div",
            testId: "slot-container-HO"
        },
        SOURCE_SELECTOR:
        {
            tag: "div",
            testId: "FieldContainer-AD"
        },
        OBJECT_TYPE:
        {
            tag: "div",
            testId: "app6d-type-button"
        },
        OBJECT_LABEL:
        {
            tag: "span",
            testId: "symbol-type-label"
        },
        OBJECT_NAME:
        {
            tag: "input",
            testId: "T"
        },
        OBJECT_DATETIME: 
        {
            tag: "div",
            testId: "FieldContainer-W"
        },
        OBJECT_COUNT:
        {
            tag: "div",
            testId: "FieldContainer-C"
        }
    },
    SIDEBAR:
    {
        tag: "div",
        className: "SideBar__SidebarContent",

        ATTACHMENTS:
        {
            tag: "div",
            testId: "uploaded-attachments-list"
        }
    },
    
    SNAPSHOTS_LABEL:
    {
        tag: "div",
        testId: "snapshotsListPanel"
    },
    SNAPSHOTS_BUTTON:
    {
        tag: "li",
        testId: "snapshots",
        subtree: true
    },
    INPUT:
    {
        tag: "input"
    },
    SELECT_BUTTON:
    {
        tag: "button",
        title: "виділити"
    },
    DELETE_BUTTON: 
    {
        tag: "button",
        title: "видалити"
    },
    SAVE_BUTTON:
    {
        tag: "button",
        title: "зберегти",
        subtree: true
    },
    REPORT_DIALOG:
    {
        tag: "div",
        className: "elements__GenerateObjectContainer"
    },
    ELEMENT_POPOVER_AREA:
    {
        tag: "div",
        className: "Popover__PopoverDragArea",
        CONTENT:
        {
            tag: "div",
            className: "elements__PassportContainer-sc"
        }
    },
    POPOVER:
    {
        CONTAINER:
        {
            tag: "div",
            className: "elements__PassportContainer-sc"
        },
        CONTENT:
        {
            tag: "div",
            className: "BattleSpaceObjectPassport__PassportContent"
        },
        ATTACHMENTS:
        {
            tag: "div",
            testId: "object-popover-attachments-list",
            subtree: true
        },
        TABLE:
        {
            tag: "div",
            className: "elements__Table-sc"
        },
        ROW:
        {
            tag: "div",
            className: "elements__TableRowContainer"
        }
    }
};

const SHAPES = 
{
    circle:
    {
        line: 4,
        color: "rgb(238,77,77)"
    }
};

const g_root = document.getElementById("root");

let g_altBar = null;
let g_player = null;

const shiftPlayer = (container) =>
{
    const player = selectElement(container, ELEMENTS.PLAYER);
    if (!player)
    {
        console.log("%cCannot find player in container!", "color: rgb(200,0,0)");
        return;
    }

    g_player = player;
    
    // don't shift player element to avoid height limitation that distract canvas proportions
    //g_player.style.marginBottom = "56px";
    //g_player.style.maxHeight = "calc(100% - 72px)";

    return g_player;
};

const HOTKEYS = 
{
    SPACE: 32,
    FORWARD: 39,
    BACKWARD: 37,
    NEXT: 190,
    PREV: 188
};

const g_buttons =
[
    {
        caption: "<<",
        className: "back10",
        hotkey: HOTKEYS.BACKWARD
    },
    {
        caption: "<",
        className: "back1" ,
        hotkey: HOTKEYS.PREV
    },
    {
        id: "play",
        caption: "||",
        className: "play",
        hotkey: HOTKEYS.SPACE,
        preClick: e =>
        {
            const b = e.target;
            if (b.classList.includes("pause"))
            {
                b.classList.remove("pause");
            }
            else
            {
                b.classList.add("pause");
            }
        }
    },
    {
        caption: ">",
        className: "forw1",
        hotkey: HOTKEYS.NEXT
    },
    {
        caption: ">>",
        className: "forw10",
        hotkey: HOTKEYS.FORWARD
    }
];

const allowed_inputs = ["video_progress_input"];

const disableActions = e =>
{
    const buttons = g_buttons.filter(b => !!b.wrapped && !!b.hotkey);
    const hotkeys = buttons.map(b => b.hotkey);
    const index = hotkeys.indexOf(e.keyCode);
    if (index >= 0)
    {
        const active = document.activeElement;
        if (active)
        {
            const tn = active.tagName;
            if (tn)
            {
                const tag = tn.toLowerCase().trim();
                if (!input_tags.includes(tag))
                {
                    e.preventDefault();
                    e.stopPropagation();

                    return true;
                }
            }
        }
    }

    return false;
};

const g_transparent_player = new Flag(false);
const videoKeyHandler = e =>
{    
    console.log(`%cVideo hotkeys handler: ${e.keyCode}` , "color: rgb(200,200,200)");

    const buttons = g_buttons.filter(b => !!b.wrapped && !!b.hotkey);
    const hotkeys = buttons.map(b => b.hotkey);
    const index = hotkeys.indexOf(e.keyCode);
    if (index >= 0)
    {
        const active = document.activeElement;
        console.log(`%cVideo hotkeys handler: index = ${index}` , "color: rgb(200,200,200)");

        if (active)
        {
            const tn = active.tagName;
            console.log(`%cVideo hotkeys handler: tag = ${tn}` , "color: rgb(200,200,200)");

            if (tn)
            {
                const tag = tn.toLowerCase().trim();
                const id = active.id;
                if (!inputNodes.includes(tag) || allowed_inputs.includes(id))
                {
                    e.preventDefault();
                    e.stopPropagation();
                    const target = buttons[index].target;

                    console.log(`%cVideo hotkeys handler: emulate click ${target.className}` , "color: rgb(200,200,200)");
                    target.click();
                    
                    return true;
                }
            }
        }
    }
    else if (e.keyCode == 81)
    {
        if (g_player)
        {
            if (!g_transparent_player.get())
            {
                g_transparent_player.set();
                g_player.style.opacity = "0.45";
                g_player.style.pointerEvents = "none";
            }
        }
    }

    return false;
};

const videoKeyUpHandler = e =>
{    
    if (e.keyCode == 81)
    {
        if (g_player)
        {
            if (g_transparent_player.get())
            {
                g_player.style.opacity = "";
                g_player.style.pointerEvents = "";
                g_transparent_player.reset();
            }
        }
    }
};

let g_controls_observer = null;
const catchPlayer = (container) =>
{
    if (!g_player)
    {
        //console.log(container);
        g_player = container;
    }

    g_controls_observer = waitFirstElement(container, ELEMENTS.CONTROLBAR, controlbar =>
    {
        catchControlBar(controlbar);
    });

    catchToolbar(container);
};

const initProgress = (progress, input) =>
{
    const step = input.getAttribute("step");
    const min = input.getAttribute("min");
    const max = input.getAttribute("max");

    progress.setAttribute("step", step);
    progress.setAttribute("max", max);
    progress.setAttribute("min", min);
    console.log(`RANGE MAX: ${max}`);

    progress.value = 0;

    const video = selectElement(g_player, ELEMENTS.VIDEO);
    
    const syncProgress = (sync) =>
    {
        if (sync)
        {
            video.currentTime = progress.value;
        }
    };
    const resetInterval = () =>
    {
        if (g_progress_timer)
        {
            clearInterval(g_progress_timer);
            g_progress_timer = null;
        }
    };

    progress.addEventListener("change", e =>
    {
        resetInterval();
        syncProgress(video);
    });
    progress.addEventListener("mousedown", e =>
    {
        g_progress_timer = setInterval(() => syncProgress(g_progress_timer), 500);
    });
    progress.addEventListener("mouseup", e =>  resetInterval());
};

let g_caption_observer = null;
let g_range_observer = null;
let g_progress_timer = null;
const catchControlBar = (container) =>
{
    console.log("HIDE CONTROLBAR");
    const controlbar = selectElement(container, ELEMENTS.CONTROLBAR);
    if (!controlbar)
    {
        console.log("%cCannot find controlbar in container!", "color: rgb(200,0,0)");
        return;
    }    
    controlbar.style.display = "none";

    g_player = shiftPlayer(g_root);

    if (!!g_altBar)
    {
        console.log("%cAlt control bar already exists!", "color: rgb(200,0,0)");
        return;
    }

    const buttons = controlbar.getElementsByTagName("button");

    g_altBar = document.createElement("div");
    g_altBar.className = "video_alt_control_bar";

    g_root.appendChild(g_altBar);

    for (let i = 0; i < buttons.length; i++)
    {
        const altButton = document.createElement("button");
        const b = buttons[i];
        altButton.addEventListener("click", e =>
        {
            if (typeof(b.preClick) == "function")
            {
                b.preClick(e);
            }
            b.click();
            if (typeof(b.postClick) == "function")
            {
                b.postClick(e);
            }
        });
        
        if (i < g_buttons.length)
        {
            if (typeof(g_buttons[i].caption) == "string")
            {
                const cap = g_buttons[i].caption.trim();
                if (!!cap) altButton.innerText = cap;
            }
            if (typeof(g_buttons[i].className) == "string")
            {
                const cl = g_buttons[i].className.trim();
                if (!!cl) altButton.className = cl;
            }

            g_buttons[i].target = altButton;
            g_buttons[i].wrapped = b;
        }
        else
        {
            altButton.style.display = "none";
        }

        g_altBar.appendChild(altButton);
    }

    const progress = document.createElement("input");
    progress.className = "video_progress_bar";
    progress.setAttribute("type", "range");
    progress.setAttribute("tabindex", "-1");
    progress.id = "video_progress_input";
    g_altBar.appendChild(progress);

    const timestamp = document.createElement("div");
    timestamp.className = "video_alt_timestamp";
    g_altBar.appendChild(timestamp);

    const input = selectElement(controlbar, ELEMENTS.TIMERANGE);
    if (input)
    {
        const attr_max = input.getAttribute("max");
        if (!!attr_max && parseFloat(attr_max) > 0.0)
        {
            initProgress(progress, input);
        }
        else
        {
            g_range_observer = waitAttribute(input, "max", null, () =>
            {
                g_range_observer = disconnect(g_range_observer);
                initProgress(progress, input);
            });
        }
    }

    const span = selectElement(controlbar, ELEMENTS.TIMESTAMP);
    if (span)
    {
        timestamp.innerText = span.innerText;
        g_caption_observer = waitFirstElement(span, "", null, null, caption =>
        {
            timestamp.innerText = caption.innerText;
            if (input) progress.value = input.value;
        });
    }

    window.addEventListener("keydown", videoKeyHandler, true);
    window.addEventListener("keyup", videoKeyUpHandler, true);
};

const removeControlBar = (container) =>
{
    console.log("SHOW CONTROLBAR");
    const controlbar = selectElement(container, ELEMENTS.CONTROLBAR);
    if (controlbar)
    {
        controlbar.style.display = "";
    }

    if (g_player)
    {
        g_player.style.marginBottom = "";
        g_player = null;
    }

    if (!g_altBar)
    {
        console.log("%cAlt control bar doesn't exist!", "color: rgb(200,0,0)");
        return;
    }

    g_altBar.parentNode.removeChild(g_altBar);
    g_altBar = null;

    disconnect(g_caption_observer);
    disconnect(g_controls_observer);
    if (!!g_range_observer) disconnect(g_range_observer);

    window.removeEventListener("keydown", videoKeyHandler);
    window.removeEventListener("keyup", videoKeyUpHandler);

    g_buttons.map(b =>
    {
        delete b.target;
        delete b.wrapped;
    });

    detachToolbar();
    if (!!g_up_canvas) detachCanvas();
};

let g_up_canvas = null;
let g_ext_canvas = null;
let g_extraButtons = {};

let g_center = null;
let g_last_p = null;

const distance = (p1, p2) =>
{
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

const getRadius = (e) =>
{
    const pos = getCanvasPoint(e);
    const r = distance(g_center, pos);

    return r;
};

const clearRect = (canvas) =>
{
    if (g_rect)
    {
        const context = canvas.getContext("2d");
        context.clearRect(g_rect.x, g_rect.y, g_rect.w, g_rect.h);
    }
};

let g_rect = null;

const getRectOfRadius = (canvas, r) =>
{
    return {
        x: Math.max(0, g_center.x - r - SHAPES.circle.line),
        y: Math.max(0, g_center.y - r - SHAPES.circle.line),
        w: Math.min(canvas.width, 2 * r + 2 * SHAPES.circle.line),
        h: Math.min(canvas.height, 2 * r + 2 * SHAPES.circle.line)
    };
};

const drawCircle = (canvas, e) =>
{
    const context = canvas.getContext("2d");
    const r = getRadius(e);

    g_rect = getRectOfRadius(canvas, r);

    context.beginPath();
    context.arc(g_center.x, g_center.y, parseInt(r), 0, 2 * Math.PI);
    context.stroke();
};

const getRhomb = (x, y, x0, y0, r) =>
{
    const p1 = {x: x0, y: y0};

    const sin_a = (p1.y - y) / r;
    const cos_a = (p1.x - x) / r;

    const p3 = 
    {
        x: x - r * cos_a,
        y: y - r * sin_a
    };
    const p2 =
    {
        x: x + r * 0.7 * sin_a,
        y: y - r * 0.7 * cos_a 
    };
    const p4 =
    {
        x: x - r * 0.7 * sin_a,
        y: y + r * 0.7 * cos_a
    };

    return [p1, p2, p3, p4];
}

const getTriangle = (x, y, x0, y0, r) =>
{
    const p1 = {x: x0, y: y0};

    let a0 = Math.acos((p1.x - x) / r) * ((y0 - y) / Math.abs(y0 - y));
   
    const a1 = a0 + 2 * Math.PI / 3;
    const a2 = a1 + 2 * Math.PI / 3;

    const p2 = 
    {
        x: x + r * Math.cos(a1),
        y: y + r * Math.sin(a1)
    };

    const p3 =
    {
        x: x + r * Math.cos(a2),
        y: y + r * Math.sin(a2) 
    };
    

    return [p1, p2, p3];
};

const drawPath = (context, path, closed) =>
{
    context.beginPath();
    context.moveTo(path[0].x, path[0].y);
    for (let i = 0; i < path.length; i++)
    {
        context.lineTo(path[i].x, path[i].y);
    }
    if (closed)
    {
        context.lineTo(path[0].x, path[0].y);
    }
    context.stroke();
};

const drawRhomb = (canvas, e) =>
{
    const context = canvas.getContext("2d");
    const r = getRadius(e);
    const p0 = getCanvasPoint(e);

    g_rect = getRectOfRadius(canvas, r);
    
    const path = getRhomb(g_center.x, g_center.y, p0.x, p0.y, r);
    
    drawPath(context, path, true);
};

const drawTriangle = (canvas, e) =>
{
    const context = canvas.getContext("2d");
    const r = getRadius(e);
    const p0 = getCanvasPoint(e);

    g_rect = getRectOfRadius(canvas, r);

    const path = getTriangle(g_center.x, g_center.y, p0.x, p0.y, r);
    
    drawPath(context, path, true);
};

const onCanvasMouseMove = e =>
{
    if (g_center)
    {
        g_last_p = getCanvasPoint(e);
        clearRect(g_ext_canvas);

        if (g_last_button.eq("video_toolbar_extra_button_circle"))
        {
            drawCircle(g_ext_canvas, e);
        }
        else if (g_last_button.eq("video_toolbar_extra_button_rhomb"))
        {
            drawRhomb(g_ext_canvas, e);
        }
        else if (g_last_button.eq("video_toolbar_extra_button_triangle"))
        {
            drawTriangle(g_ext_canvas, e);
        }
        else
        {
            console.error("Illegal combination of shape button and canvas: " + g_last_button.get());
        }
    }
};

const onCanvasMouseUp = e =>
{
    if (g_center)
    {
        let shape = null;
        if (g_last_button.eq("video_toolbar_extra_button_circle"))
        {
            shape = buildCircle(g_center.x, g_center.y, getRadius(e));
        }
        else if (g_last_button.eq("video_toolbar_extra_button_rhomb"))
        {
            const p = getCanvasPoint(e);
            shape = buildRhomb(g_center.x, g_center.y, p.x, p.y, getRadius(e));
        }
        else if (g_last_button.eq("video_toolbar_extra_button_triangle"))
        {
            const p = getCanvasPoint(e);
            shape = buildTriangle(g_center.x, g_center.y, p.x, p.y, getRadius(e));
        }

        if (shape)
        {
            emulateShape(g_up_canvas, shape);
        }
        else
        {
            console.error("Illegal combination of shape button and canvas: " + g_last_button.get());
        }

        clearRect(g_ext_canvas);
    }
    g_center = null;
    g_last_p = null;
};

const onCanvasMouseOut = e =>
{
    if (g_center)
    {
        clearRect(g_ext_canvas);
    }

    g_center = null;
    g_last_p = null;
};

const cloneCanvasParams = (trigger) =>
{
    setTimeout(() =>
    {
        if (!!g_up_canvas)
        {
            g_ext_canvas.width = g_up_canvas.width/CANVAS_RATIO;
            g_ext_canvas.height = g_up_canvas.height/CANVAS_RATIO;

            const context = g_ext_canvas.getContext("2d");
            const up_context = g_up_canvas.getContext("2d");
            context.strokeStyle = up_context.strokeStyle;
            context.lineWidth = up_context.lineWidth;

            if (trigger)
            {
                triggerMouseDown(g_up_canvas, 0, 0);
                triggerMouseUp(g_up_canvas, 0, 0);
            }
        }
    }, 10);
};

const getCanvasPoint = (e) =>
{
    const ratio = 1;
    return {x: e.layerX * ratio, y: e.layerY * ratio};
};

const onCanvasMouseDown = e =>
{
    g_center = getCanvasPoint(e);
    
    cloneCanvasParams(false);
};

const triggerMouseEvent = (node, eventType, params) =>
{
    const mouseEvent = new MouseEvent(
        eventType,
        {
            ...params,
            bubbles: true,
            cancelable: true,
            view: window
        });
    node.dispatchEvent(mouseEvent);
};

const triggerInputEvent = (node, text) =>
{
    const inputEvent = new InputEvent(
        "input",
        {
            data: text,
            bubbles: true,
            cancelable: true,
            view: window
        });
    node.dispatchEvent(inputEvent);
};

const triggerCoordinates = (node, x, y) =>
{
    const rect = node.getBoundingClientRect();
    return {
        pageX: parseInt(rect.left + x),
        pageY: parseInt(rect.top + y),
        clientX: parseInt(rect.left + x),
        clientY: parseInt(rect.top + y),
        layerX: parseInt(x),
        layseY: parseInt(y)
    };
};

const triggerMouseMove = (node, x , y) =>
{
    triggerMouseEvent(node, "mousemove", triggerCoordinates(node, x, y));
};
const triggerMouseDown = (node, x, y) =>
{
    triggerMouseEvent(node, "mousedown", triggerCoordinates(node, x, y));
};
const triggerMouseUp = (node, x, y) =>
{
    triggerMouseEvent(node, "mouseup", triggerCoordinates(node, x, y));
};

const buildCircle = (x, y, r) =>
{
    const N = 100;

    console.log(`%cEmulate circle: X=${x}, Y=${y}, R=${r}`, "color: rgb(200,200,200");
    const points = [];
    const da = 2 * Math.PI / (N - 1);
    for ( let a = 0; a < 2 * Math.PI; a += da)
    {
        const p =
        {
            x: x + Math.cos(a) * r,
            y: y + Math.sin(a) * r
        };
        points.push(p);
    }
    return points;
};

const buildLine = (p1, p2) =>
{
    const N = 25;
    const tg_a = (p2.y - p1.y) / (p2.x - p1.x);
    const dx = (p2.x - p1.x) / N;
    const dy = dx * tg_a;
    const points = [];
    for (let i = 0; i < N + 1; i++)
    {
        const p =
        {
            x: p1.x + dx * i,
            y: p1.y + dy * i
        };
        points.push(p);
    }
    return points;
};

const buildPath = (path, closed) =>
{
    const points = [];
    if (path.length <= 1)
    {
        return points;
    }
    
    for (let i = 0; i < path.length - 1; i++)
    {
        const line = buildLine(path[i], path[i+1]);
        points.push(...line);
    }
    if (closed)
    {
        const last_line = buildLine(path[path.length - 1], path[0]);
        points.push(...last_line);
    }
    
    return points;
};

const buildRhomb = (x, y, x0, y0, r) =>
{
    console.log(`%cEmulate rhomb: X=${x}, Y=${y}, R=${r}`, "color: rgb(200,200,200");

    const rhomb = getRhomb(x, y, x0, y0, r);
    const shape = buildPath(rhomb, true);

    shape.type = "rhomb";
    return shape;
};

const buildTriangle = (x, y, x0, y0, r) =>
{
    console.log(`%cEmulate triangle: X=${x}, Y=${y}, R=${r}`, "color: rgb(200,200,200");

    const triangle = getTriangle(x, y, x0, y0, r);
    return buildPath(triangle, true);
};

let g_rhomb_count = 0;
const emulateShape = (node, points) =>
{
    if (points.length <= 0)
    {
        return;
    }

    triggerMouseDown(node, points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++)
    {
        triggerMouseMove(node, points[i].x, points[i].y);
    }
    const last =  points[points.length - 1];
    triggerMouseUp(node, last.x, last.y);

    if (points.type == "rhomb")
    {
        g_rhomb_count++;
    }
};

function Flag (value)
{
    let m_flag = value;

    this.get = () =>
    {
        return m_flag;
    };

    this.set = () =>
    {
        m_flag = true;
    };
    this.reset = () =>
    {
        m_flag = false;
    }
}

function Register (value)
{
    let m_value = value;

    this.get = () =>
    {
        return m_value;
    };
    this.set = (val) =>
    {
        m_value = val;
    };

    this.eq = (val) =>
    {
        return (this.get() == val);
    };

    this.data = null;
}

const highlightButton = (button, highlight) =>
{
    if (highlight)
    {
        button.style.position = "";
        button.style.backgroundColor = "";

        button.classList.add("kIULYw");
    }
    else
    {
        button.style.position = "static";
        button.style.backgroundColor = "transparent";

        button.classList.remove("kIULYw");
    }
};

const highlightExtButton = (button, highlight) =>
{
    if (!button) return;

    if (highlight)
    {
        button.style.backgroundColor = "rgb(67, 73, 86)";
        button.style.borderBottom = "3px solid rgb(70,116,220)";
    }
    else
    {
        button.style.backgroundColor = "";
        button.style.borderBottom = "";
    }
};

const g_remember_last_button = new Flag(true);
const g_last_button = new Register(null);

const onClickShape = e =>
{
    highlightExtButton(g_extraButtons[g_last_button.get()], false);
    g_last_button.set(e.target.id);

    g_remember_last_button.reset();
    g_pensil_button.click();

    initExtCanvas(true);
    highlightButton(g_pensil_button, false);

    highlightExtButton(e.target, true);
};

let g_pensil_button = null;
let g_compas_button = null;
let g_orientir_button = null;
let g_save_button = null;
let g_copy_button = null;

let g_selbutton_observer = null;
let g_delbutton_observer = null;
let g_savebutton_observer = null;

const catchToolbar = (container) =>
{
    const toolbar = selectElement(container, ELEMENTS.TOOLBAR);
    if (!toolbar)
    {
        console.log("%cCannot get video toolbar!", "color: rgb(200,0,0)");
        return;
    }

    const buttons = toolbar.getElementsByTagName("button");

    const catchedButtonClick = e =>
    {
        if (g_remember_last_button.get())
        {
            highlightExtButton(g_extraButtons[g_last_button.get()], false);
            
            if (e.currentTarget.id == g_pensil_button.id)
            {
                highlightButton(g_pensil_button, true);
            }

            g_last_button.set(e.target.id);
            initExtCanvas(false);
        }
        g_remember_last_button.set();
    };

    const catchButton = (button, id) =>
    {
        if (!button.id)
        {
            button.id = id;
            button.addEventListener("click", catchedButtonClick);
        }
    };

    for (let i = 0; i < buttons.length; i++)
    {
        const title = buttons[i].getAttribute("title");
        if (title)
        {
            const t = title.toLowerCase().trim();
            if (t == "олівець")
            {
                g_pensil_button = buttons[i];
                buttons[i].id = "catched_toolbutton_pensil";
            }
            else if (t == "збільшити")
            {
                buttons[i].style.display = "none";
                buttons[i].id = "catched_toolbutton_zoomin";
            }
            else if (t == "зменшити")
            {
                buttons[i].style.display = "none";
                buttons[i].id = "catched_toolbutton_zoomout";
            }
            else if (t == "компас")
            {
                g_compas_button = buttons[i];
                //buttons[i].style.display = "none";
                buttons[i].id = "catched_toolbutton_compas";
            }
            else if (t == "орієнтир")
            {
                g_orientir_button = buttons[i];
                buttons[i].style.display = "none";
                buttons[i].id = "catched_toolbutton_orientir";
            }
        }

        if (!buttons[i].id)
        {
            buttons[i].id = "catched_toolbutton_" + i;
        }

        buttons[i].addEventListener("click", catchedButtonClick);
    }

    g_compas_button.addEventListener("click", e =>
    {
        setTimeout(() =>
        {
            const nodes = g_player.getElementsByTagName("video");
            const rect = nodes[0].getBoundingClientRect();
            const x = rect.width - 80;
            const y = 80;
            triggerMouseDown(g_up_canvas, x, y);
            triggerMouseUp(g_up_canvas, x, y);

            setTimeout(() =>
            {
                triggerMouseDown(g_up_canvas, x, y);
                triggerMouseUp(g_up_canvas, x, y);
            }, 100);
        }, 10);
    });

    const circleButton = document.createElement("button");
    circleButton.className = "sc-bcXHqe sc-hHTYSt sc-dmctIk fMkGtt crcckl video_toolbar_extra_button";
    circleButton.id = "video_toolbar_extra_button_circle";
    circleButton.addEventListener("click", onClickShape);
    g_extraButtons[circleButton.id] = circleButton;

    const rhombButton = document.createElement("button");
    rhombButton.className = "sc-bcXHqe sc-hHTYSt sc-dmctIk fMkGtt crcckl video_toolbar_extra_button";
    rhombButton.id = "video_toolbar_extra_button_rhomb";
    rhombButton.addEventListener("click", onClickShape);
    g_extraButtons[rhombButton.id] = rhombButton;

    const triangleButton = document.createElement("button");
    triangleButton.className = "sc-bcXHqe sc-hHTYSt sc-dmctIk fMkGtt crcckl video_toolbar_extra_button";
    triangleButton.id = "video_toolbar_extra_button_triangle";
    triangleButton.addEventListener("click", onClickShape);
    g_extraButtons[triangleButton.id] = triangleButton;

    g_selbutton_observer = waitFirstElement(toolbar, ELEMENTS.SELECT_BUTTON, button =>
    {
        console.log("SELECT button detected");
        catchButton(button, "catched_toolbutton_select");
    });
    g_delbutton_observer = waitFirstElement(toolbar, ELEMENTS.DELETE_BUTTON, button =>
    {
        console.log("DELETE button detected");
        catchButton(button, "catched_toolbutton_delete");
    });
    
    toolbar.appendChild(circleButton);
    toolbar.appendChild(rhombButton);
    toolbar.appendChild(triangleButton);

    g_savebutton_observer = waitFirstElement(toolbar, ELEMENTS.SAVE_BUTTON, catched_element =>
    {
        console.log("SAVE button detected");

        const save_buttons = catched_element.getElementsByTagName("button");
        if (save_buttons.length > 0)
        {
            g_save_button = save_buttons[0];
            g_save_button.id = "catched_toolbutton_save";
            
            const ul = g_save_button.nextSibling;
            ul.style.display = "none";

            const g_copy_button = save_buttons[save_buttons.length - 1];
            g_save_button.addEventListener("click", e =>
            {
                console.log("COPY IMAGE emulate click");
                g_copy_button.click();
            });
        }
    });
};

const catchCanvas = (container) =>
{
    console.log("ATTACH CANVAS");
    if (!!g_ext_canvas)
    {
        console.log("%cCanvas already catched!", "color: rgb(200,0,0)");
        return;
    }

    const elements = container.getElementsByTagName("canvas");
    if (elements.length < 2)
    {
        console.log("%cIllegal canvas container configuration!", "color: rgb(200,0,0)");
        return;
    }

    g_up_canvas = elements[1];

    g_ext_canvas = document.createElement("canvas");
    g_up_canvas.parentNode.appendChild(g_ext_canvas);

    g_ext_canvas.addEventListener("mousemove", onCanvasMouseMove);
    g_ext_canvas.addEventListener("mousedown", onCanvasMouseDown);
    g_ext_canvas.addEventListener("mouseup", onCanvasMouseUp);
    g_ext_canvas.addEventListener("mouseout", onCanvasMouseOut);

    g_ext_canvas.className = "video_canvas extra_canvas";
    
    initExtCanvas(true);
    g_rhomb_count = 0;
};

const initExtCanvas = (trigger) =>
{
    if (g_ext_canvas)
    {
        if (g_last_button.eq("video_toolbar_extra_button_circle"))
        {
            console.log("%cCircle", "color: rgb(0,0,200)");
            g_ext_canvas.style.display = "";
        }
        else if (g_last_button.eq("video_toolbar_extra_button_rhomb"))
        {
            console.log("%cRhomb", "color: rgb(0,0,200)");
            g_ext_canvas.style.display = "";
        }
        else if (g_last_button.eq("video_toolbar_extra_button_triangle"))
        {
            console.log("%cTriangle", "color: rgb(0,0,200)");
            g_ext_canvas.style.display = "";
        }
        else
        {
            console.log("%cDefault shape", "color: rgb(0,0,200)");
            g_ext_canvas.style.display = "none";
        }

        cloneCanvasParams(trigger);
    }
};

const detachCanvas = () =>
{
    console.log("DETACH CANVAS");
    if (!g_up_canvas)
    {
        console.log("%cCanvas already detached!", "color: rgb(200,0,0)");
        return;
    }

    g_up_canvas = null;
    g_ext_canvas = null;
};

const detachToolbar = () =>
{
    for (const k in g_extraButtons)
    {
        const b = g_extraButtons[k];
        b.parentNode.removeChild(b);
    }
    g_extraButtons = {};

    g_selbutton_observer = disconnect(g_selbutton_observer);
    g_delbutton_observer = disconnect(g_delbutton_observer);
    g_savebutton_observer = disconnect(g_savebutton_observer);
};

const hideTooltip = (tooltip) =>
{
    console.log("HIDE TOOLTIP!");
    tooltip.style.display = "none";
};

const hideFirstSnapshot = (list) =>
{
    if (g_snapshots_buton_clicked_flag)
    {
        console.log("Snapshots list just opened...");
        return;
    }

    console.log("HIDE FIRST SNAPSHOT");
    
    const search_line = list.firstChild;
    const first_snapshot = search_line.nextSibling;
    if (!!first_snapshot)
    {
        const icons = first_snapshot.getElementsByTagName("svg");
        if (icons.length > 0)
        {
            const svg = icons[0];
            const icon_base64 = btoa(svg.innerHTML);
            
            //it's so dumb to define it by icon... but Delta
            if (icon_base64 == SHOWN_ICON_BASE64)
            {
                first_snapshot.click();
            }
        }
    }
};

g_snapshots_buton_clicked_flag = false;
const catchSnapshots = (node) =>
{
    const button = selectElement(node, {...ELEMENTS.SNAPSHOTS_BUTTON, subtree: false});
    button.addEventListener("click", e =>
    {
        console.log("Snapshots clicked");
        g_snapshots_buton_clicked_flag = true;
    });
};

const reorderSnapshots = (node) =>
{
    console.log("REORDER SNAPSHOTS");
    
    const label = (checkElement(node, ELEMENTS.SNAPSHOTS_LABEL) ? node : node.firstChild);
    const sidebar = label.parentNode;

    const reorder = () =>
    {
        const list = label.nextSibling;
        if (!list)
        {
            console.error("Illegal snapshots sidebar configuration");
            return;
        }
        
        const search_line = list.firstChild;
        if (!search_line)
        {
            console.error("Illegal snapshots search field");
            return;
        }
        
        list.removeChild(search_line);

        const cnt = list.children.length - 1;
        for (let i = cnt; i >= 0; i--)
        {
            if (i == cnt) list.appendChild(search_line);

            const line = list.children[i];
            line.parentNode.removeChild(line);
            list.appendChild(line);
        }

        list.scrollTop = 0;
        hideFirstSnapshot(list);

        g_snapshots_buton_clicked_flag = false;
    };

    const search = selectElement(sidebar, ELEMENTS.INPUT);
    if (search)
    {
        reorder();
    }
    else
    {
        let sidebar_observer = waitFirstElement(sidebar, {...ELEMENTS.INPUT, subtree: true}, () =>
        {
            sidebar_observer = disconnect(sidebar_observer);
            reorder();
        });
    }
};

const setReportDescription = (input) =>
{
    const wc = document.getElementById("widgetContainer");
    const fields = wc.getElementsByClassName("elements__ControlCounter-sc-1w1ryg9-2");
    const field = fields[0];
    
    const text = field.innerText;
    const parts = text.split(":");
    const count = parseInt(parts[1]);

    let nFlights = parseInt(count / 7);
    const mod = count - nFlights * 7;
    if (mod > 4)
    {
        nFlights++;
    }
    if (nFlights < 1)
    {
        nFlights = 1;
    }

    const shift = parseInt(20 * Math.random() - 10);
    const duration = nFlights * (100 + shift);

    let descr = "Вильотів: " + nFlights + "\nчас в повітрі: " + duration + " хв.\nцілей виявлено/підтвердж.: " + count;
    input.focus();
    input.value = descr;
    triggerInputEvent(input, descr);

};

const initReportDialog = (dialog) =>
{
    console.log("REPORT DIALOG DETECTED");

    const input = dialog.querySelector("input[name=filename]");

    const str = input.value;
    const re = /(\d{2})\D(\d{2})\D(\d{4})/;
    const matches = str.match(re);
    
    let filename = str;
    if (matches)
    {
        filename = "Heidrun_" + matches[3] + "_" + matches[2] + "_" + matches[1];
    }
    
    input.focus();
    input.value = filename;
    triggerInputEvent(input, filename);

    const sels = dialog.getElementsByClassName("react-select__control");
    const s = sels[0];
    triggerMouseDown(s, 10, 10);

    setTimeout(() =>
    {
        const lines = dialog.getElementsByClassName("react-select__menu");
        const opts = lines[0].firstChild;
        const caps = opts.getElementsByTagName("div");
        for (let j = 0; j < caps.length; j++)
        {
            if (caps[j].innerText.includes("PDF"))
            {
                caps[j].click();
            }
        }
    }, 10);

    const descr_input = dialog.querySelector("textarea[name=description]");
    setReportDescription(descr_input);
};

let popover_content_observer = null;
let popover_area_observer = null;
let g_popover = null;

const waitPopoverContent = content =>
{
    console.log("POPOVER CONTENT DETECTED");

    const container = selectElement(g_popover, ELEMENTS.POPOVER.CONTAINER);
    
    const root_rect = g_root.getBoundingClientRect();
    const popover_rect = g_popover.getBoundingClientRect();
    const maxHeight = Math.min(root_rect.height - popover_rect.y - 140, 800);
    container.style.maxHeight = maxHeight + "px";

    const firstTable = selectElement(content, ELEMENTS.POPOVER.TABLE);
    const rows = selectAllElements(firstTable, ELEMENTS.POPOVER.ROW);
    let sk_location = null;
    for (let i = 0; i < rows.length; i++)
    {
        const text = rows[i].innerText;
        const lines = text.split("\n");

        if (lines.some(l => l.match(/\d{2}\D\d{7},\s+\d{2}\D\d{7}/)))
        {
            sk_location = lines[lines.length - 1];
        }
    }
    firstTable.style.display = "none";

    if (!!sk_location)
    {
        const el_current_location = g_root.querySelector("div[data-testid=current-location]");
        if (!!el_current_location)
        {
            el_current_location.innerHTML = sk_location;
        }
    }
};

const catchPopover = (area) =>
{
    console.log("POPOVER DETECTED");
    //const popover = selectElement(area, ELEMENTS.ELEMENT_POPOVER_AREA.CONTENT);
    g_popover = area;

    popover_content_observer = waitFirstElement(area, ELEMENTS.POPOVER.CONTENT, waitPopoverContent)
};

const removePopover = () =>
{
    console.log("POPOVER REMOVED");

    popover_content_observer = disconnect(popover_content_observer);
    popover_area_observer = disconnect(popover_area_observer);
    
    g_popover = null;
};

const OBJECT_NAME_TABLE_BY_LABEL =
{
    "Важка гаубиця": "Гармата",
    "Автомобіль загального призначення": "АТ",
    "Вантажівка (транспортний засіб підвищеної прохідності)": "ВАТ",
    "Бойова броньована машина (ББМ, БМП)": "ББМ",
    "Сухопутне озброєння та військова техніка": "Замаскована ВТ",
    "Сухопутний підрозділ": "Зосередження ВТ та о/с"
};

const addObjectDetected = (sidebar) =>
{
    console.log("ADD OBJECT DETECTED");

    //
    // TODO: unify code to set selector value
    //
    let select_observer = waitFirstElement(sidebar, ELEMENTS.ADD_OBJECT.FORM, form =>
    {
        console.log("OBJECT FORM LOADED");
        const selector = selectElement(form, ELEMENTS.ADD_OBJECT.TYPE_SELECTOR);
        const value_div = selectElement(selector, {tag: "div", className: "singleValue"});
        const value = value_div.innerText.toLowerCase().trim();
        if (value.includes("невідомий"))
        {
            console.log("Object type is UNKNOWN");
            const field = selector.firstChild.lastChild.lastChild;
            triggerMouseDown(field, 10, 10);
            setTimeout(() =>
            {
                const options = selector.firstChild.lastChild.lastChild.firstChild.children;
                for (let i = 0; i < options.length; i++)
                {
                    const text = options[i].innerText.toLowerCase().trim();
                    if (text.includes("ворожий"))
                    {
                        options[i].click();
                    }
                }
            }, 50);
        }

        const source = selectElement(form, ELEMENTS.ADD_OBJECT.SOURCE_SELECTOR);
        const source_div = selectElement(source, {tag: "div", className: "singleValue"});
        const obj_src = source_div.innerText.toLowerCase().trim();
        if (obj_src.includes("невизначен"))
        {
            console.log("Object source is UNDEFINED");
            const field = source.firstChild.lastChild.lastChild;
            triggerMouseDown(field, 10, 10);
            setTimeout(() =>
            {
                const options = source.firstChild.lastChild.lastChild.firstChild.children;
                for (let i = 0; i < options.length; i++)
                {
                    const text = options[i].innerText.toLowerCase().trim();
                    if (text.includes("повітряна"))
                    {
                        options[i].click();
                    }
                }
            }, 50);
        }

        const object_type = selectElement(sidebar, ELEMENTS.ADD_OBJECT.OBJECT_TYPE);
        if (object_type)
        {
            const object_label = selectElement(object_type, ELEMENTS.ADD_OBJECT.OBJECT_LABEL);
            if (object_label)
            {
                const label_text = object_label.innerText;
                console.log(label_text);

                const name = OBJECT_NAME_TABLE_BY_LABEL[label_text];
                if (!!name)
                {
                    const input = selectElement(form, ELEMENTS.ADD_OBJECT.OBJECT_NAME)
                    if (input)
                    {
                        console.log("Object name: " + name);

                        input.focus();
                        input.value = name;
                        triggerInputEvent(input, name);
                    }
                }
            }
        }

        const object_count_field = selectElement(sidebar, ELEMENTS.ADD_OBJECT.OBJECT_COUNT);
        if (!!object_count_field)
        {
            const inputs = object_count_field.getElementsByTagName("input");
            if (inputs.length > 0)
            {
                const input = inputs[0];
                input.focus();
                const val = Math.max(1, g_rhomb_count);
                input.value = val;
                triggerInputEvent(input, val);
            }
        }

        if (!!g_player)
        {
            const close_button = g_player.querySelector("button[title='Закрити']");
            if (!!close_button)
            {
                const expand_button = close_button.previousSibling;
                const title = expand_button.getAttribute("title");
                if (title == "Збільшити")
                {
                    expand_button.click();
                }
            }
        }

        const date_elements = sidebar.getElementsByClassName("react-datepicker__input-container");
        if (date_elements.length > 0)
        {
            const object_datepicker = date_elements[0];
            const inputs = object_datepicker.getElementsByTagName("input");
            if (inputs.length > 0)
            {
                const object_date_input = inputs[0];
                object_date_input.focus();
                setTimeout(() =>
                {
                    const popover_elements = sidebar.getElementsByClassName("react-datepicker-popper");
                    if (popover_elements.length > 0)
                    {
                        const object_datepicker_popover = popover_elements[0];
                        const buttons = object_datepicker_popover.getElementsByTagName("button");
                        if (buttons.length > 0)
                        {
                            const object_now_button = buttons[buttons.length - 1];
                            object_now_button.click();
                        }
                    }

                    setTimeout(() =>
                    {
                        const date_time_field = selectElement(sidebar, ELEMENTS.ADD_OBJECT.OBJECT_DATETIME);
                        if (date_time_field)
                        {
                            const time_fields = date_time_field.getElementsByClassName("timePickerContainer");
                            if (time_fields.length > 0)
                            {
                                const time_field = time_fields[0];
                                const time_inputs = time_field.getElementsByTagName("input");
                                if (time_inputs.length > 0)
                                {
                                    const time_input = time_inputs[0];
                                    time_input.focus();
                                }
                            }
                        }
                    }, 100);
                }, 100);
            } 
        }

        disconnect(select_observer);
    });
};

const getImageUrl = (url, image) =>
{
    const parts = url.split("/");
    const objectId = parts[parts.length - 1];

    const imageId = image.id;
    const imgUrl = `/storage/attachment/from-object-id/${objectId}?id=${imageId}`;

    return imgUrl;
};

const g_last_url = new Register("");
const g_last_obj = new Register("");

const loadAttachmentsPreview = (url, container, element, register) =>
{
    fetch(url)
        .then(res => res.json())
        .then((data) =>
        {
            register.data = (data.attachments ? data.attachments : data);
            register.set(url);

            showAttachmentsPreview(container, element, register);
        });
};

const getThumbCanvas = () =>
{
    let c = document.getElementById("thumbnails_canvas");
    if (!c)
    {
        c = document.createElement("canvas");
        c.id = "thumbnails_canvas";
        document.body.appendChild(c);
        c.width = 150;
        c.height = 100;
    }
    return c;
};

const loadImage = (url, image, callback) =>
{
    const imgUrl = getImageUrl(url, image);
    const base64 = localStorage.getItem(imgUrl);

    if (!base64)
    {
        const img = new Image();
        img.onload = e =>
        {
            const canvas = getThumbCanvas();
            const context = canvas.getContext("2d");
            context.drawImage(e.target, 0, 0, 150, 100);

            canvas.toBlob(blob =>
            {
                const reader = new FileReader();
                reader.readAsDataURL(blob); 
                reader.onloadend = () =>
                {
                    const b64 = reader.result;                
                    localStorage.setItem(imgUrl, b64);
                    callback(b64);
                }
            });
        };
        img.src = imgUrl;
    }
    else
    {
        callback(base64);
    }
};

const g_update_attachments_list = new Flag(false);
const updateAttachmentsList = (attachments_list, register) =>
{
    if (!attachments_list || !g_update_attachments_list.get())
    {
        return;
    }

    const images = attachments_list.getElementsByClassName("elements__FileIconContainer-sc-zge5rm-0");
            
    console.log(`Show attachments preview (${images.length})...`);

    const imgs = register.data || [];
    if (images.length > 0 && imgs.length >= images.length)
    {
        for (let i = 0; i < images.length; i++)
        {
            const img = document.createElement("img");
            img.className = images[i].className;
            img.style.height = "calc(100% - 12px)";
            img.style.width = "50%";
            loadImage(register.get(), imgs[i], base64 =>
            {
                img.setAttribute("src", base64);
            });

            const node = images[i];
            node.parentNode.insertBefore(img, node);
            node.parentNode.removeChild(node);
        }
    }
};

const showAttachmentsPreview = (container, element, register) =>
{
    if (!container)
    {
        return;
    }

    const attachments_list = selectElement(container, element);
    updateAttachmentsList(attachments_list, register);
};

let g_attachments_observer = null;
const editObjectDetected = (sidebar) =>
{
    console.log("EDIT OBJECT DETECTED");

    g_attachments_observer = waitFirstElement(sidebar, ELEMENTS.SIDEBAR.ATTACHMENTS, list =>
    {
        console.log("ATTACHMENTS LIST DETECTED");

        showAttachmentsPreview(sidebar, ELEMENTS.SIDEBAR.ATTACHMENTS, g_last_url);
    });
};

let g_sidebar = null;
let g_object_observer = null;
const detectSidebar = (sidebar) =>
{
    console.log("SIDEBAR DETECTED");
    g_sidebar = sidebar;

    const header = selectElement(sidebar, ELEMENTS.SIDEBAR_HEADER);
    if (header)
    {
        const text = header.innerText.toLowerCase().trim();
        if(text.includes("редагування об"))
        {
            editObjectDetected(sidebar);
        }
        else if (text.includes("створення об"))
        {
            addObjectDetected(sidebar);
        }
    }
    
    g_object_observer = waitFirstElement(sidebar, ELEMENTS.SIDEBAR_HEADER, header =>
    {
        console.log("SIDEBAR HEADER DETECTED");
        const text = header.innerText.toLowerCase().trim();
        if (text.includes("створення об"))
        {
            addObjectDetected(sidebar);
        }
    });
};

const removedSidebar = (sidebar) =>
{
    console.log("SIDEBAR REMOVED");
    g_object_observer = disconnect(g_object_observer);
    g_attachments_observer = disconnect(g_attachments_observer);

    g_sidebar = null;
};


const patchAttachmentsPreview = () =>
{
    g_update_attachments_list.set();

    chrome.storage.onChanged.addListener((changes, namespace) =>
    {
        //console.log(namespace);
        if (namespace == "session")
        {
            for (const key in changes)
            {
                if (key == "url")
                {
                    const url = changes[key].newValue;
                    console.log("URL:" + url);

                    if (g_last_url != url)
                    {
                        loadAttachmentsPreview(url, g_sidebar, ELEMENTS.SIDEBAR.ATTACHMENTS, g_last_url);
                    }
                }
                else if (key == "obj")
                {
                    const url = changes[key].newValue;
                    console.log("OBJ:" + url);
                    if (!g_last_obj.eq(url))
                    {
                        loadAttachmentsPreview(url, g_popover, ELEMENTS.POPOVER.ATTACHMENTS, g_last_obj);
                    }
                }
            }
        }
    });
};

//
// TODO: optimize number of callbacks through hierarchical observers (detect parent before detect all expecting children)
//
waitFirstElement(g_root, ELEMENTS.TOOLTIP, hideTooltip);
let nav_observer = waitFirstElement(g_root, ELEMENTS.SNAPSHOTS_BUTTON, node =>
{
    nav_observer = disconnect(nav_observer);
    catchSnapshots(node);
});
waitFirstElement(g_root, ELEMENTS.PLAYER, catchPlayer, removeControlBar);
waitFirstElement(g_root, ELEMENTS.CANVAS, catchCanvas, detachCanvas);
waitFirstElement(g_root, ELEMENTS.SNAPSHOTS, reorderSnapshots);
waitFirstElement(g_root, ELEMENTS.SIDEBAR, detectSidebar, removedSidebar);
waitFirstElement(g_root, ELEMENTS.REPORT_DIALOG, initReportDialog);

waitFirstElement(g_root, ELEMENTS.ELEMENT_POPOVER_AREA, catchPopover, removePopover);

//patchAttachmentsPreview();
