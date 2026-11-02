const SVG_NS = "http://www.w3.org/2000/svg";

const svg = document.getElementById("tree-svg");

/* =====================================================
   HELPERS
===================================================== */

function point(el){

    const r = el.getBoundingClientRect();

    return {

        x:
        r.left +
        r.width / 2 +
        window.scrollX,

        y:
        r.top +
        r.height / 2 +
        window.scrollY
    };

}

function clearSVG(){

    svg.innerHTML = "";

}

function createPath(
    d,
    color="#1f1f1f",
    width=2,
    opacity=.18
){

    const path =
    document.createElementNS(
        SVG_NS,
        "path"
    );

    path.setAttribute(
        "d",
        d
    );

    path.setAttribute(
        "fill",
        "none"
    );

    path.setAttribute(
        "stroke",
        color
    );

    path.setAttribute(
        "stroke-width",
        width
    );

    path.setAttribute(
        "stroke-linecap",
        "round"
    );

    path.setAttribute(
        "opacity",
        opacity
    );

    svg.appendChild(path);

}

/* =====================================================
   CURVA
===================================================== */

function connect(a,b){

    const p1 =
    point(document.getElementById(a));

    const p2 =
    point(document.getElementById(b));

    const c =
    Math.abs(
        p2.y - p1.y
    ) * .45;

    createPath(

        `
        M ${p1.x} ${p1.y}

        C
        ${p1.x} ${p1.y + c}
        ${p2.x} ${p2.y - c}
        ${p2.x} ${p2.y}

        `,

        "#1b1b1b",
        3,
        .18
    );

}

/* =====================================================
   CONEXION SATELITE
===================================================== */

function connectSatellites(){

    document
    .querySelectorAll(".species")
    .forEach(species=>{

        const node =
        species.querySelector(".node");

        if(!node) return;

        const n =
        point(node);

        species
        .querySelectorAll(".satellites span")
        .forEach(tag=>{

            const t =
            point(tag);

            createPath(

                `
                M ${n.x} ${n.y}

                Q
                ${(n.x+t.x)/2}
                ${(n.y+t.y)/2}

                ${t.x}
                ${t.y}
                `,

                "#666",
                1.1,
                .15
            );

        });

    });

}

/* =====================================================
   TRONCO PRINCIPAL
===================================================== */

function drawMainEvolution(){

    const chain = [

        "afarensis",

        "habilis",

        "ergaster",

        "erectus",

        "heidelbergensis"

    ];

    for(
        let i=0;
        i<chain.length-1;
        i++
    ){

        connect(
            chain[i],
            chain[i+1]
        );

    }

}

/* =====================================================
   BIFURCACION
===================================================== */

function drawBranch(){

    const root =
    document.getElementById(
        "heidelbergensis"
    );

    const neo =
    document.getElementById(
        "neanderthal"
    );

    const sap =
    document.getElementById(
        "sapiens"
    );

    if(
        !root ||
        !neo ||
        !sap
    ){
        return;
    }

    const r =
    point(root);

    const n =
    point(neo);

    const s =
    point(sap);

    createPath(

        `
        M ${r.x} ${r.y}

        C
        ${r.x-250} ${r.y+180}
        ${n.x+180} ${n.y-100}
        ${n.x} ${n.y}
        `,

        "#111",
        3,
        .25
    );

    createPath(

        `
        M ${r.x} ${r.y}

        C
        ${r.x+250} ${r.y+180}
        ${s.x-180} ${s.y-100}
        ${s.x} ${s.y}
        `,

        "#111",
        3,
        .25
    );

}

/* =====================================================
   RAMA SAPIENS
===================================================== */

function drawSapiensLine(){

    const sapiensFlow = [

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
        i<sapiensFlow.length-1;
        i++
    ){

        connect(

            sapiensFlow[i],

            sapiensFlow[i+1]

        );

    }

}

/* =====================================================
   ORIGEN
===================================================== */

function drawOriginCircle(){

    const first =
    document.getElementById(
        "afarensis"
    );

    if(!first)
        return;

    const p =
    point(first);

    const circle =
    document.createElementNS(
        SVG_NS,
        "circle"
    );

    circle.setAttribute(
        "cx",
        p.x
    );

    circle.setAttribute(
        "cy",
        p.y-160
    );

    circle.setAttribute(
        "r",
        12
    );

    circle.setAttribute(
        "fill",
        "#111"
    );

    circle.setAttribute(
        "opacity",
        ".35"
    );

    svg.appendChild(
        circle
    );

}

/* =====================================================
   FIN SUMERIA
===================================================== */

function drawEndCircle(){

    const last =
    document.getElementById(
        "sumeria"
    );

    if(!last)
        return;

    const p =
    point(last);

    const circle =
    document.createElementNS(
        SVG_NS,
        "circle"
    );

    circle.setAttribute(
        "cx",
        p.x
    );

    circle.setAttribute(
        "cy",
        p.y+180
    );

    circle.setAttribute(
        "r",
        12
    );

    circle.setAttribute(
        "fill",
        "#111"
    );

    circle.setAttribute(
        "opacity",
        ".35"
    );

    svg.appendChild(
        circle
    );

}

/* =====================================================
   DRAW
===================================================== */

function drawTree(){

    clearSVG();

    svg.setAttribute(
        "width",
        document.documentElement.scrollWidth
    );

    svg.setAttribute(
        "height",
        document.documentElement.scrollHeight
    );

    drawOriginCircle();

    drawMainEvolution();

    drawBranch();

    drawSapiensLine();

    connectSatellites();

    drawEndCircle();

}

/* =====================================================
   INIT
===================================================== */

window.addEventListener(

    "load",

    ()=>{

        drawTree();

    }

);

window.addEventListener(

    "resize",

    ()=>{

        drawTree();

    }

);
