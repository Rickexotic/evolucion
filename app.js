const SVG_NS = "http://www.w3.org/2000/svg";

const tree =
document.getElementById("tree");

const svg =
document.getElementById("tree-svg");

const panel =
document.getElementById("info-content");

let evolutionData = null;

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
   SPECIES CARD
====================================================== */

async function createSpecies(species){

    const card =
    document.createElement("section");

    card.className =
    `species ${species.clade}`;

    card.id =
    species.id;

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
        ()=>showSpecies(
            species.id
        )
    );

    return card;
}

/* ======================================================
   PERIOD
====================================================== */

function formatMillions(v){

    if(v === 0)
        return "Presente";

    const abs =
    Math.abs(v);

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
   HTML RENDER
====================================================== */

async function renderSpecies(){

    tree.innerHTML = "";

    for
    (
      const species
      of
      evolutionData.species
    ){

        const node =
        await createSpecies(
            species
        );

        tree.appendChild(
            node
        );

    }

}

/* ======================================================
   INFO PANEL
====================================================== */

function showSpecies(id){

    const species =
    evolutionData.species.find(
        x => x.id === id
    );

    if(!species)
        return;

    document.body
    .classList
    .add("tree-focus");

    document
    .querySelectorAll(".species")
    .forEach(el=>{

        el.classList.remove(
            "selected"
        );

    });

    document
    .getElementById(id)
    .classList
    .add("selected");

    const descendants =
    evolutionData.species
    .filter(
        x =>
        x.parent === species.id
    )
    .map(
        x=>x.name
    );

    panel.innerHTML = `

        <h2>

            ${species.name}

        </h2>

        <p>

            ${formatPeriod(species)}

        </p>

        <hr>

        <p>

            <strong>
            Clado
            </strong><br>

            ${species.clade}

        </p>

        <p>

            <strong>
            Capacidad craneal
            </strong><br>

            ${
            species.brain_cc ||
            "Sin dato"
            }

        </p>

        <p>

            <strong>
            Regiones
            </strong><br>

            ${
            species.regions
            ?
            species.regions.join("<br>")
            :
            "-"
            }

        </p>

        <p>

            <strong>
            Innovaciones
            </strong><br>

            ${
            species.innovations
            ?
            species.innovations.join("<br>")
            :
            "-"
            }

        </p>

        <p>

            <strong>
            Descendientes
            </strong><br>

            ${
            descendants.length
            ?
            descendants.join("<br>")
            :
            "-"
            }

        </p>

        <p>

            ${species.description}

        </p>

    `;

}

/* ======================================================
   SVG
====================================================== */

function center(id){

    const el =
    document.getElementById(
        id
    );

    if(!el)
        return null;

    const r =
    el.getBoundingClientRect();

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

/* ======================================================
   SVG LINE
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

    const curve =
    Math.abs(
        b.y-a.y
    )*.5;

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
   TREE DRAW
====================================================== */

function drawTree(){

    svg.innerHTML = "";

    for(
        const species
        of
        evolutionData.species
    ){

        if(species.parent){

            drawLine(

                species.parent,

                species.id,

                "direct"

            );

        }

        if(species.connections){

            species.connections
            .forEach(c=>{

                drawLine(

                    species.id,

                    c.target,

                    c.type

                );

            });

        }

    }

}

/* ======================================================
   LOAD
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
