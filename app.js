const SVG_NS = "http://www.w3.org/2000/svg";

const svg =
document.getElementById("tree-svg");

/* =========================================
   HELPERS
========================================= */

function center(el){

    const r =
    el.getBoundingClientRect();

    return {

        x:
        r.left +
        r.width/2 +
        window.scrollX,

        y:
        r.top +
        r.height/2 +
        window.scrollY
    };

}

function clearSVG(){

    svg.innerHTML = "";

}

/* =========================================
   DRAW PATH
========================================= */

function drawPath(

    from,
    to,
    options={}

){

    const p1 =
    center(
        document.getElementById(from)
    );

    const p2 =
    center(
        document.getElementById(to)
    );

    const cp =
    Math.abs(p2.y-p1.y)*.4;

    const path =
    document.createElementNS(
        SVG_NS,
        "path"
    );

    path.setAttribute(

        "d",

        `
        M ${p1.x} ${p1.y}

        C
        ${p1.x} ${p1.y+cp}
        ${p2.x} ${p2.y-cp}
        ${p2.x} ${p2.y}
        `
    );

    path.setAttribute(
        "fill",
        "none"
    );

    path.setAttribute(
        "stroke",
        options.color || "#111"
    );

    path.setAttribute(
        "stroke-width",
        options.width || 3
    );

    path.setAttribute(
        "opacity",
        options.opacity || .18
    );

    path.setAttribute(
        "data-from",
        from
    );

    path.setAttribute(
        "data-to",
        to
    );

    path.classList.add(
        "tree-line"
    );

    svg.appendChild(path);
}

/* =========================================
   MAIN EVOLUTION
========================================= */

function drawEarlyEvolution(){

    const flow = [

        "sahelanthropus",

        "orrorin",

        "ardipithecus",

        "anamensis",

        "afarensis"

    ];

    for(
        let i=0;
        i<flow.length-1;
        i++
    ){

        drawPath(
            flow[i],
            flow[i+1]
        );

    }

}

/* =========================================
   AUSTRALOPITHECUS BRANCH
========================================= */

function drawAustralBranch(){

    drawPath(
        "afarensis",
        "africanus",
        {opacity:.22}
    );

    drawPath(
        "afarensis",
        "sediba",
        {opacity:.22}
    );

}

/* =========================================
   HOMO
========================================= */

function drawHomoBranch(){

    drawPath(
        "afarensis",
        "habilis"
    );

    drawPath(
        "habilis",
        "rudolfensis"
    );

    drawPath(
        "rudolfensis",
        "erectus"
    );

    drawPath(
        "erectus",
        "heidelbergensis"
    );

}

/* =========================================
   LATE HUMANS
========================================= */

function drawLateHumans(){

    drawPath(
        "heidelbergensis",
        "neanderthal",
        {
            opacity:.24
        }
    );

    drawPath(
        "heidelbergensis",
        "denisova",
        {
            opacity:.24
        }
    );

    drawPath(
        "heidelbergensis",
        "sapiens",
        {
            opacity:.24
        }
    );

}

/* =========================================
   CIVILIZATION
========================================= */

function drawCivilization(){

    const flow = [

        "sapiens",

        "cognitive",

        "agriculture",

        "villages",

        "metallurgy",

        "cities",

        "sumeria"

    ];

    for(
        let i=0;
        i<flow.length-1;
        i++
    ){

        drawPath(
            flow[i],
            flow[i+1]
        );

    }

}

/* =========================================
   SATELLITES
========================================= */

function drawSatelliteLinks(){

    document
    .querySelectorAll(".species")
    .forEach(species=>{

        const node =
        species.querySelector(
            ".node"
        );

        if(!node) return;

        const n =
        center(node);

        species
        .querySelectorAll(
            ".satellites span"
        )
        .forEach(tag=>{

            const t =
            center(tag);

            const path =
            document.createElementNS(
                SVG_NS,
                "path"
            );

            path.setAttribute(

                "d",

                `
                M ${n.x} ${n.y}

                Q
                ${(n.x+t.x)/2}
                ${(n.y+t.y)/2}

                ${t.x} ${t.y}
                `

            );

            path.setAttribute(
                "fill",
                "none"
            );

            path.setAttribute(
                "stroke",
                "#666"
            );

            path.setAttribute(
                "stroke-width",
                "1"
            );

            path.setAttribute(
                "opacity",
                ".15"
            );

            svg.appendChild(path);

        });

    });

}

/* =========================================
   FOCUS
========================================= */

function clearFocus(){

    document.body
    .classList
    .remove("tree-focus");

    document
    .querySelectorAll(".species")
    .forEach(el=>{

        el.classList.remove(
            "selected"
        );

    });

}

function setupFocus(){

    document
    .querySelectorAll(".species")
    .forEach(node=>{

        node.onclick=()=>{

            const active=
            node.classList.contains(
                "selected"
            );

            clearFocus();

            if(active)
                return;

            document.body
            .classList
            .add("tree-focus");

            node.classList.add(
                "selected"
            );

            node.scrollIntoView({

                block:"center",

                behavior:"smooth"

            });

        };

    });

}

/* =========================================
   DRAW ALL
========================================= */

function redraw(){

    clearSVG();

    svg.setAttribute(
        "width",
        document.body.scrollWidth
    );

    svg.setAttribute(
        "height",
        document.body.scrollHeight
    );

    drawEarlyEvolution();

    drawAustralBranch();

    drawHomoBranch();

    drawLateHumans();

    drawCivilization();

    drawSatelliteLinks();
}

/* =========================================
   INIT
========================================= */

window.addEventListener(

    "load",

    ()=>{

        redraw();

        setupFocus();

    }

);

window.addEventListener(

    "resize",

    redraw

);
