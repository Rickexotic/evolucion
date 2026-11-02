/* ==========================================
   CONFIG
========================================== */

const SVG_NS = "http://www.w3.org/2000/svg";

const SPECIES_FLOW = [
    "afarensis",
    "habilis",
    "ergaster",
    "erectus",
    "heidelbergensis"
];

const POST_SAPIENS_FLOW = [
    "sapiens",
    "cognitive",
    "agriculture",
    "villages",
    "metallurgy",
    "cities",
    "sumeria"
];

/* ==========================================
   HELPERS
========================================== */

function getCenter(element){

    const rect =
    element.getBoundingClientRect();

    return {

        x:
        rect.left +
        rect.width / 2 +
        window.scrollX,

        y:
        rect.top +
        rect.height / 2 +
        window.scrollY
    };

}

function clearSVG(){

    const svg =
    document.getElementById("evolution-svg");

    svg.innerHTML = "";

}

function createPath(d, color = "#1b1b1b", width = 2, opacity = 0.15){

    const path =
    document.createElementNS(
        SVG_NS,
        "path"
    );

    path.setAttribute("d", d);

    path.setAttribute("fill", "none");

    path.setAttribute("stroke", color);

    path.setAttribute("stroke-width", width);

    path.setAttribute("stroke-linecap", "round");

    path.setAttribute("opacity", opacity);

    return path;

}

/* ==========================================
   CONNECTION
========================================== */

function connect(fromId, toId){

    const svg =
    document.getElementById("evolution-svg");

    const from =
    document.getElementById(fromId);

    const to =
    document.getElementById(toId);

    if(!from || !to)
        return;

    const a =
    getCenter(from);

    const b =
    getCenter(to);

    const distance =
    Math.abs(
        b.y - a.y
    );

    const control =
    distance * 0.35;

    const d = `
        M ${a.x} ${a.y}
        C ${a.x} ${a.y + control}
          ${b.x} ${b.y - control}
          ${b.x} ${b.y}
    `;

    svg.appendChild(
        createPath(d)
    );

}

/* ==========================================
   BRANCH CONNECTION
========================================== */

function branchConnect(
    sourceId,
    targetId,
    direction
){

    const svg =
    document.getElementById("evolution-svg");

    const source =
    document.getElementById(sourceId);

    const target =
    document.getElementById(targetId);

    const a =
    getCenter(source);

    const b =
    getCenter(target);

    const offset =
    direction === "left"
        ? -300
        : 300;

    const d = `
       M ${a.x} ${a.y}

       C ${a.x + offset}
         ${a.y + 120}

         ${b.x - offset}
         ${b.y - 120}

         ${b.x}
         ${b.y}
    `;

    svg.appendChild(
        createPath(
            d,
            "#1b1b1b",
            2.2,
            0.20
        )
    );

}

/* ==========================================
   SATELLITE LINES
========================================== */

function drawSatelliteLinks(){

    const svg =
    document.getElementById("evolution-svg");

    document
    .querySelectorAll(".species")
    .forEach(species=>{

        const node =
        species.querySelector(".photo");

        if(!node)
            return;

        const center =
        getCenter(node);

        species
        .querySelectorAll(".satellite")
        .forEach(satellite=>{

            const p =
            getCenter(satellite);

            const d = `
                M ${center.x}
                ${center.y}

                Q ${(center.x+p.x)/2}
                ${(center.y+p.y)/2}

                ${p.x}
                ${p.y}
            `;

            svg.appendChild(
                createPath(
                    d,
                    "#444",
                    1,
                    0.10
                )
            );

        });

    });

}

/* ==========================================
   TIMELINE ORBITS
========================================== */

function createOrbit(
    x,
    y,
    radius,
    opacity
){

    const svg =
    document.getElementById(
        "evolution-svg"
    );

    const circle =
    document.createElementNS(
        SVG_NS,
        "circle"
    );

    circle.setAttribute(
        "cx",
        x
    );

    circle.setAttribute(
        "cy",
        y
    );

    circle.setAttribute(
        "r",
        radius
    );

    circle.setAttribute(
        "fill",
        "none"
    );

    circle.setAttribute(
        "stroke",
        "#111"
    );

    circle.setAttribute(
        "stroke-width",
        "1"
    );

    circle.setAttribute(
        "opacity",
        opacity
    );

    svg.appendChild(circle);

}

/* ==========================================
   DECORATIVE BACKGROUND
========================================== */

function buildOrbits(){

    const height =
    document.body.scrollHeight;

    createOrbit(
        250,
        1800,
        400,
        0.04
    );

    createOrbit(
        window.innerWidth - 200,
        3400,
        600,
        0.03
    );

    createOrbit(
        220,
        6200,
        500,
        0.03
    );

    createOrbit(
        window.innerWidth - 250,
        9300,
        700,
        0.03
    );

    createOrbit(
        window.innerWidth/2,
        height-800,
        550,
        0.025
    );

}

/* ==========================================
   DRAW
========================================== */

function drawEvolutionTree(){

    clearSVG();

    const svg =
    document.getElementById(
        "evolution-svg"
    );

    svg.setAttribute(
        "width",
        document.body.scrollWidth
    );

    svg.setAttribute(
        "height",
        document.body.scrollHeight
    );

    for(
        let i=0;
        i<SPECIES_FLOW.length-1;
        i++
    ){

        connect(
            SPECIES_FLOW[i],
            SPECIES_FLOW[i+1]
        );

    }

    branchConnect(
        "heidelbergensis",
        "neanderthal",
        "left"
    );

    branchConnect(
        "heidelbergensis",
        "sapiens",
        "right"
    );

    for(
        let i=0;
        i<POST_SAPIENS_FLOW.length-1;
        i++
    ){

        connect(
            POST_SAPIENS_FLOW[i],
            POST_SAPIENS_FLOW[i+1]
        );

    }

    drawSatelliteLinks();

    buildOrbits();

}

/* ==========================================
   REVEAL ANIMATION
========================================== */

function activateReveal(){

    const observer =
    new IntersectionObserver(

        entries=>{

            entries.forEach(entry=>{

                if(
                    entry.isIntersecting
                ){

                    entry.target
                    .classList
                    .add("visible");

                }

            });

        },

        {
            threshold:0.15
        }

    );

    document
    .querySelectorAll(
        ".species, .milestone, .civilization"
    )
    .forEach(el=>{

        observer.observe(el);

    });

}

/* ==========================================
   INIT
========================================== */

window.addEventListener(
    "load",
    ()=>{

        drawEvolutionTree();

        activateReveal();

    }
);

window.addEventListener(
    "resize",
    drawEvolutionTree
);
