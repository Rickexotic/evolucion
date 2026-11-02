const SVG_NS = "http://www.w3.org/2000/svg";

const tree =
document.getElementById("tree");

const svg =
document.getElementById("tree-svg");

const panel =
document.getElementById("info-content");

let evolutionData = null;

/* ======================================================
   CONFIG
====================================================== */

const LEVEL_HEIGHT = 450;
const COLUMN_WIDTH = 420;
const TREE_CENTER = 1200;

/* ======================================================
   WIKIPEDIA
====================================================== */

const FALLBACK_IMAGE =
"https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Question_Mark.svg/512px-Question_Mark.svg.png";

async function fetchWikipediaImage(name){

    try{

        const title =
        encodeURIComponent(
            name.replaceAll(" ","_")
        );

        const url =
        `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`;

        const response =
        await fetch(url);

        const data =
        await response.json();

        return (
            data.thumbnail?.source ||
            FALLBACK_IMAGE
        );

    }
    catch{

        return FALLBACK_IMAGE;
    }

}

/* ======================================================
   PERIOD
====================================================== */

function formatMillions(value){

    if(value === 0)
        return "Presente";

    const abs =
    Math.abs(value);

    if(abs >= 1000000){

        return (
            abs / 1000000
        ).toFixed(1) + " Ma";

    }

    return (
        abs / 1000
    ).toFixed(0) + " ka";

}

function formatPeriod(species){

    return `
    ${formatMillions(species.start)}
    – 
    ${formatMillions(species.end)}
    `;

}

/* ======================================================
   POSITION
====================================================== */

function getX(species){

    return (
        TREE_CENTER +
        species.column *
        COLUMN_WIDTH
    );

}

function getY(species){

    return (
        species.level *
        LEVEL_HEIGHT
    );

}

/* ======================================================
   NODE
====================================================== */

async function createSpecies(species){

    const node =
    document.createElement("section");

    node.className =
    `species ${species.type || ""}`;

    node.id =
    species.id;

    const x =
    getX(species);

    const y =
    getY(species);

    node.style.left =
    `${x}px`;

    node.style.top =
    `${y}px`;

    const image =
    await fetchWikipediaImage(
        species.name
    );

    node.innerHTML = `

        <div class="node">

            <img
                src="${image}"
                alt="${species.name}">

        </div>

        <div class="species-name">

            ${species.name}

        </div>

        <div class="species-period">

            ${formatPeriod(species)}

        </div>

        <div class="details">

            ${species.description || ""}

        </div>

    `;

    node.addEventListener(

        "click",

        ()=>showSpecies(
            species.id
        )

    );

    return node;

}

/* ======================================================
   HTML
====================================================== */

async function renderSpecies(){

    tree.innerHTML = "";

    let maxLevel = 0;

    for(
        const species
        of
        evolutionData.species
    ){

        if(
            species.level >
            maxLevel
        ){
            maxLevel =
            species.level;
        }

        const node =
        await createSpecies(
            species
        );

        tree.appendChild(
            node
        );

    }

    tree.style.height =
    `${(maxLevel+2)*LEVEL_HEIGHT}px`;

}

/* ======================================================
   INFO
====================================================== */

function showSpecies(id){

    const species =
    evolutionData.species.find(
        x => x.id === id
    );

    if(!species)
        return;

    document
    .querySelectorAll(".species")
    .forEach(el=>{

        el.classList.remove(
            "selected"
        );

    });

    document.body
    .classList
    .add("tree-focus");

    document
    .getElementById(id)
    .classList
    .add("selected");

    const descendants =
    evolutionData.species
    .filter(
        x =>
        x.parent === species.id
    );

    panel.innerHTML = `

        <h2>${species.name}</h2>

        <p>
            ${formatPeriod(species)}
        </p>

        <hr>

        <h3>Capacidad Craneal</h3>

        <p>
            ${
            species.brain_cc ||
            "Sin dato"
            } cc
        </p>

        <h3>Regiones</h3>

        <p>
            ${
            species.regions
            ?
            species.regions.join("<br>")
            :
            "-"
            }
        </p>

        <h3>Innovaciones</h3>

        <p>
            ${
            species.innovations
            ?
            species.innovations.join("<br>")
            :
            "-"
            }
        </p>

        <h3>Descendientes</h3>

        <p>
            ${
            descendants.length
            ?
            descendants
            .map(x=>x.name)
            .join("<br>")
            :
            "-"
            }
        </p>

        <h3>Descripción</h3>

        <p>
            ${species.description}
        </p>

    `;

}

/* ======================================================
   SVG POSITIONS
====================================================== */

function center(id){

    const el =
    document.getElementById(id);

    if(!el)
        return null;

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

/* ======================================================
   DRAW LINE
====================================================== */

function drawLine(
    from,
    to,
    type="direct"
){

    const a =
    center(from);

    const b =
    center(to);

    if(!a || !b)
        return;

    const path =
    document.createElementNS(
        SVG_NS,
        "path"
    );

    const c =
    Math.abs(
        b.y-a.y
    )*.45;

    path.setAttribute(

        "d",

        `
        M ${a.x} ${a.y}

        C

        ${a.x}
        ${a.y+c}

        ${b.x}
        ${b.y-c}

        ${b.x}
        ${b.y}
        `
    );

    path.setAttribute(
        "fill",
        "none"
    );

    switch(type){

        case "direct":

            path.setAttribute(
                "stroke",
                "#111"
            );

            path.setAttribute(
                "stroke-width",
                "3"
            );

            break;

        case "hypothesis":

            path.setAttribute(
                "stroke",
                "#666"
            );

            path.setAttribute(
                "stroke-width",
                "2"
            );

            path.setAttribute(
                "stroke-dasharray",
                "14 10"
            );

            break;

        case "genetic":

            path.setAttribute(
                "stroke",
                "#2563eb"
            );

            path.setAttribute(
                "stroke-width",
                "2"
            );

            path.setAttribute(
                "stroke-dasharray",
                "3 8"
            );

            break;

    }

    svg.appendChild(path);

}

/* ======================================================
   TREE
====================================================== */

function drawTree(){

    svg.innerHTML = "";

    svg.style.height =
    tree.scrollHeight + "px";

    evolutionData.species.forEach(
        species => {

        if(species.parent){

            drawLine(

                species.parent,

                species.id,

                "direct"

            );

        }

        if(species.connections){

            species.connections.forEach(
                connection => {

                drawLine(

                    species.id,

                    connection.target,

                    connection.type

                );

            });

        }

    });

}

/* ======================================================
   JSON
====================================================== */

async function loadJson(){

    const response =
    await fetch(
        "evolution.json"
    );

    evolutionData =
    await response.json();

}

/* ======================================================
   INIT
====================================================== */

async function init(){

    await loadJson();

    await renderSpecies();

    drawTree();

}

window.addEventListener(
    "load",
    init
);

window.addEventListener(
    "resize",
    drawTree
);
