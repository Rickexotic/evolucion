const SVG_NS = "http://www.w3.org/2000/svg";

function center(el){

    const r = el.getBoundingClientRect();

    return {

        x:
        r.left + r.width / 2 + window.scrollX,

        y:
        r.top + r.height / 2 + window.scrollY
    };
}

function clearSVG(){

    document.getElementById(
        "evolution-svg"
    ).innerHTML = "";
}

function curve(
    x1,
    y1,
    x2,
    y2,
    stroke="#111",
    width=3,
    opacity=.18
){

    const svg =
    document.getElementById(
        "evolution-svg"
    );

    const path =
    document.createElementNS(
        SVG_NS,
        "path"
    );

    const cp =
    Math.abs(y2-y1) * .4;

    path.setAttribute(
        "d",
        `
        M ${x1} ${y1}
        C ${x1} ${y1+cp}
        ${x2} ${y2-cp}
        ${x2} ${y2}
        `
    );

    path.setAttribute("fill","none");
    path.setAttribute("stroke",stroke);
    path.setAttribute("stroke-width",width);
    path.setAttribute("stroke-linecap","round");
    path.setAttribute("opacity",opacity);

    svg.appendChild(path);
}

/* ==========================
   CONEXIÓN ESPECIES
========================== */

function connectSpecies(
    sourceId,
    targetId
){

    const a =
    document.getElementById(sourceId);

    const b =
    document.getElementById(targetId);

    if(!a || !b){
        return;
    }

    const p1 =
    center(a);

    const p2 =
    center(b);

    curve(
        p1.x,
        p1.y,
        p2.x,
        p2.y
    );
}

/* ==========================
   BIFURCACIÓN
========================== */

function drawBranch(){

    const svg =
    document.getElementById(
        "evolution-svg"
    );

    const origin =
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
        !origin ||
        !neo ||
        !sap
    ){
        return;
    }

    const o =
    center(origin);

    const n =
    center(neo);

    const s =
    center(sap);

    curve(
        o.x,
        o.y,
        n.x,
        n.y,
        "#111",
        3,
        .25
    );

    curve(
        o.x,
        o.y,
        s.x,
        s.y,
        "#111",
        3,
        .25
    );

}

/* ==========================
   SATÉLITES
========================== */

function connectSatellites(){

    const svg =
    document.getElementById(
        "evolution-svg"
    );

    document
    .querySelectorAll(
        ".species"
    )
    .forEach(species=>{

        const photo =
        species.querySelector(
            ".photo"
        );

        if(!photo){
            return;
        }

        const p =
        center(photo);

        species
        .querySelectorAll(
            ".satellite"
        )
        .forEach(item=>{

            const s =
            center(item);

            const line =
            document.createElementNS(
                SVG_NS,
                "path"
            );

            line.setAttribute(
                "d",
                `
                M ${p.x} ${p.y}
                Q ${(p.x+s.x)/2}
                  ${(p.y+s.y)/2}
                  ${s.x} ${s.y}
                `
            );

            line.setAttribute(
                "fill",
                "none"
            );

            line.setAttribute(
                "stroke",
                "#999"
            );

            line.setAttribute(
                "stroke-width",
                "1"
            );

            line.setAttribute(
                "opacity",
                ".3"
            );

            svg.appendChild(
                line
            );

        });

    });

}

/* ==========================
   HITOS HUMANIDAD
========================== */

function connectMilestones(){

    const chain = [

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
        i<chain.length-1;
        i++
    ){

        connectSpecies(
            chain[i],
            chain[i+1]
        );

    }

}

/* ==========================
   MAIN TRUNK
========================== */

function connectMainEvolution(){

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

        connectSpecies(
            chain[i],
            chain[i+1]
        );

    }

}

/* ==========================
   RENDER
========================== */

function drawTree(){

    const svg =
    document.getElementById(
        "evolution-svg"
    );

    clearSVG();

    svg.setAttribute(
        "width",
        document.body.scrollWidth
    );

    svg.setAttribute(
        "height",
        document.body.scrollHeight
    );

    connectMainEvolution();

    drawBranch();

    connectMilestones();

    connectSatellites();
}

/* ==========================
   LOAD
========================== */

window.addEventListener(
    "load",
    drawTree
);

window.addEventListener(
    "resize",
    drawTree
);

window.addEventListener(
    "scroll",
    ()=>{

        if(window.scrollY % 100 === 0){

            drawTree();

        }

    }
);
