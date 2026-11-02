const SVG_NS = "http://www.w3.org/2000/svg";

const tree =
document.getElementById("tree");

const svg =
document.getElementById("tree-svg");

const panel =
document.getElementById("info-content");

let evolutionData = null;

/* =====================================================
   CONFIG
===================================================== */

const LEVEL_HEIGHT = 320;
const COLUMN_WIDTH = 360;
const TREE_CENTER = 1200;

/* =====================================================
   IMAGES
===================================================== */

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

/* =====================================================
   PERIOD FORMAT
===================================================== */

function formatMillions(value){

    if(value === 0){

        return "Presente";

    }

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
    —
    ${formatMillions(species.end)}
    `;

}

/* =====================================================
   POSITION
===================================================== */

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

/* =====================================================
   SPECIES NODE
===================================================== */

async function createSpecies(species){

    const card =
    document.createElement("section");

    card.className =
    `species ${species.type || ""}`;

    card.id =
    species.id;

    card.style.left =
    `${getX(species)}px`;

    card.style.top =
    `${getY(species)}px`;

    const image =
    await fetchWikipediaImage(
        species.name
    );

    card.innerHTML = `

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

    card.addEventListener(
        "click",
        e=>{

            e.stopPropagation();

            selectSpecies(
                species.id
            );

        }
    );

    return card;

}

/* =====================================================
   RENDER NODES
===================================================== */

async function renderSpecies(){

    tree
    .querySelectorAll(".species")
    .forEach(node=>node.remove());

    let maxLevel = 0;

    for(
        const species
        of
        evolutionData.species
    ){

        maxLevel =
        Math.max(
            maxLevel,
            species.level
        );

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

/* =====================================================
   PANEL
===================================================== */

function updatePanel(species){

    const descendants =

        evolutionData.species
        .filter(

            x =>
            x.parent === species.id

        )

        .map(
            x => x.name
        );

    panel.innerHTML = `

        <h2>

            ${species.name}

        </h2>

        <p>

            ${formatPeriod(species)}

        </p>

        <hr>

        <h3>
            Capacidad Craneal
        </h3>

        <p>

            ${
                species.brain_cc
                ?
                species.brain_cc + " cc"
                :
                "Sin dato"
            }

        </p>

        <h3>
            Regiones
        </h3>

        <p>

            ${
                species.regions
                ?
                species.regions.join("<br>")
                :
                "-"
            }

        </p>

        <h3>
            Innovaciones
        </h3>

        <p>

            ${
                species.innovations
                ?
                species.innovations.join("<br>")
                :
                "-"
            }

        </p>

        <h3>
            Descendientes
        </h3>

        <p>

            ${
                descendants.length
                ?
                descendants.join("<br>")
                :
                "-"
            }

        </p>

        <h3>
            Descripción
        </h3>

        <p>

            ${species.description}

        </p>

    `;

}

/* =====================================================
   SELECT
===================================================== */

function clearSelection(){

    document.body
    .classList
    .remove("tree-focus");

    document
    .querySelectorAll(".species")
    .forEach(node=>{

        node.classList.remove(
            "selected"
        );

    });

}

function selectSpecies(id){

    clearSelection();

    document.body
    .classList
    .add("tree-focus");

    const node =
    document.getElementById(id);

    node.classList.add(
        "selected"
    );

    node.scrollIntoView({

        behavior:"smooth",

        block:"center"

    });

    const species =

        evolutionData.species.find(

            x =>
            x.id === id

        );

    updatePanel(species);

}

/* =====================================================
   CLICK OUTSIDE
===================================================== */

document.addEventListener(

    "click",

    ()=>{

        clearSelection();

        panel.innerHTML = `

            <div class="placeholder">

                Selecciona una especie

            </div>

        `;

    }

);

/* =====================================================
   SVG HELPERS
===================================================== */

function getNodePoint(id, side){

    const el =
    document
    .getElementById(id)
    ?.querySelector(".node");

    if(!el) return null;

    const r =
    el.getBoundingClientRect();

    const svgRect =
    svg.getBoundingClientRect();

    return {

        x:
        r.left +
        r.width/2 +
        - svgRect.left,

        y:
        (side === "bottom" ? r.bottom : r.top) -
        svgRect.top

    };

}

/* =====================================================
   CURVES
===================================================== */

function drawLine(
    from,
    to,
    type="direct"
){
const a =
getNodePoint(from, "bottom");

const b =
getNodePoint(to, "top");

    if(
        !a ||
        !b
    ){
        return;
    }

    const path =
    document.createElementNS(
        SVG_NS,
        "path"
    );

    const curve =
    Math.abs(
        b.y-a.y
    ) * .45;

    path.setAttribute(

        "d",

        `
        M ${a.x} ${a.y}

        C

        ${a.x}
        ${a.y+curve}

        ${b.x}
        ${b.y-curve}

        ${b.x}
        ${b.y}
        `

    );

    path.setAttribute(
        "fill",
        "none"
    );

    path.setAttribute(
        "class",
        `connection-line connection-${type}`
    );

    svg.appendChild(path);

}

/* =====================================================
   DRAW TREE
===================================================== */

function drawTree(){

    svg.innerHTML = "";

    svg.setAttribute(
        "width",
        tree.clientWidth
    );

    svg.setAttribute(
        "height",
        tree.clientHeight
    );

    evolutionData.species.forEach(

        species=>{

            if(species.parent){

                drawLine(

                    species.parent,

                    species.id,

                    "direct"

                );

            }

            if(species.connections){

                species.connections.forEach(

                    c=>{

                        drawLine(

                            species.id,

                            c.target,

                            c.type

                        );

                    }

                );

            }

        }

    );

}

/* =====================================================
   LOAD JSON
===================================================== */

async function loadJson(){

    const response =

        await fetch(
            "evolution.json"
        );

    evolutionData =
        await response.json();

}

/* =====================================================
   INIT
===================================================== */

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
