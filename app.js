const SVG_NS = "http://www.w3.org/2000/svg";

const tree = document.getElementById("tree");
const svg = document.getElementById("tree-svg");
const panel = document.getElementById("info-content");
const infoPanel = document.getElementById("info-panel");
const mobileQuery = window.matchMedia("(max-width: 760px)");

let evolutionData = null;

/* =====================================================
   CONFIG
===================================================== */

const LEVEL_HEIGHT = 330;
const COLUMN_WIDTH = 340;
const CARD_WIDTH = 300;
const MOBILE_ROW_HEIGHT = 215;
const TOP_PADDING = 50;

const PLACEHOLDER =
`<div class="placeholder">Selecciona una especie</div>`;

/* =====================================================
   IMAGES
===================================================== */

const FALLBACK_IMAGE =
"https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Question_Mark.svg/512px-Question_Mark.svg.png";

async function fetchWikipediaImage(name){

    try{

        const title = encodeURIComponent(name.replaceAll(" ","_"));

        const response = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`
        );

        const data = await response.json();

        return data.thumbnail?.source || FALLBACK_IMAGE;

    }
    catch{

        return FALLBACK_IMAGE;

    }

}

/* =====================================================
   PERIOD FORMAT
===================================================== */

function formatMillions(value){

    if(value === 0) return "Presente";

    const abs = Math.abs(value);

    if(abs >= 1000000){

        return (abs / 1000000).toFixed(1) + " Ma";

    }

    return (abs / 1000).toFixed(0) + " ka";

}

function formatPeriod(species){

    return `${formatMillions(species.start)} — ${formatMillions(species.end)}`;

}

/* =====================================================
   SPECIES NODE
===================================================== */

async function createSpecies(species){

    const card = document.createElement("section");

    card.className = `species ${species.type || ""}`;
    card.id = species.id;

    const image = await fetchWikipediaImage(species.name);

    card.innerHTML = `
        <div class="node">
            <img src="${image}" alt="${species.name}" loading="lazy">
        </div>
        <div class="species-name">${species.name}</div>
        <div class="species-period">${formatPeriod(species)}</div>
        <div class="details">${species.description || ""}</div>
    `;

    card.addEventListener("click", e=>{

        e.stopPropagation();

        selectSpecies(species.id);

    });

    return card;

}

async function renderSpecies(){

    tree
    .querySelectorAll(".species")
    .forEach(node=>node.remove());

    const nodes = await Promise.all(
        evolutionData.species.map(createSpecies)
    );

    nodes.forEach(node=>tree.appendChild(node));

}

/* =====================================================
   LAYOUT
===================================================== */

function layout(){

    const width = tree.clientWidth;
    const mobile = mobileQuery.matches;

    let bottom = 0;

    evolutionData.species.forEach((species, index)=>{

        const card = document.getElementById(species.id);

        if(!card) return;

        let x;
        let y;
        let cardWidth;

        if(mobile){

            const offset = species.column * 22;

            x = width / 2 + offset;
            y = TOP_PADDING + index * MOBILE_ROW_HEIGHT;
            cardWidth = width - 32 - Math.abs(offset) * 2;

        }
        else{

            const step = Math.min(
                COLUMN_WIDTH,
                (width - CARD_WIDTH) / 4
            );

            x = width / 2 + species.column * step;
            y = TOP_PADDING + (species.level - 1) * LEVEL_HEIGHT;
            cardWidth = CARD_WIDTH;

        }

        card.style.left = `${x}px`;
        card.style.top = `${y}px`;
        card.style.width = `${cardWidth}px`;

        bottom = Math.max(bottom, y + card.offsetHeight);

    });

    tree.style.height = `${bottom + TOP_PADDING + 70}px`;

}

/* =====================================================
   PANEL
===================================================== */

function list(items){

    return items && items.length ? items.join("<br>") : "-";

}

function updatePanel(species){

    const descendants =
        evolutionData.species
        .filter(x => x.parent === species.id)
        .map(x => x.name);

    panel.innerHTML = `
        <h2>${species.name}</h2>
        <p>${formatPeriod(species)}</p>
        <hr>
        <h3>Capacidad Craneal</h3>
        <p>${species.brain_cc ? species.brain_cc + " cc" : "Sin dato"}</p>
        <h3>Regiones</h3>
        <p>${list(species.regions)}</p>
        <h3>Innovaciones</h3>
        <p>${list(species.innovations)}</p>
        <h3>Descendientes</h3>
        <p>${list(descendants)}</p>
        <h3>Descripción</h3>
        <p>${species.description}</p>
    `;

}

/* =====================================================
   SELECT
===================================================== */

function clearSelection(){

    document.body.classList.remove("tree-focus");

    document
    .querySelectorAll(".species")
    .forEach(node=>node.classList.remove("selected"));

    panel.innerHTML = PLACEHOLDER;

}

function selectSpecies(id){

    clearSelection();

    document.body.classList.add("tree-focus");

    const node = document.getElementById(id);

    node.classList.add("selected");

    if(mobileQuery.matches){

        // Deja libre la mitad inferior, ocupada por la ficha
        const rect = node.getBoundingClientRect();

        window.scrollTo({
            top: window.scrollY + rect.top - window.innerHeight * 0.1,
            behavior: "smooth"
        });

    }
    else{

        node.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }

    updatePanel(
        evolutionData.species.find(x => x.id === id)
    );

}

document.addEventListener("click", clearSelection);

infoPanel.addEventListener("click", e=>e.stopPropagation());

document
.getElementById("panel-close")
.addEventListener("click", clearSelection);

/* =====================================================
   CONNECTIONS
===================================================== */

// Offsets ignore CSS transforms, so lines stay stable while a card is scaled.
function anchor(id, side){

    const card = document.getElementById(id);

    if(!card) return null;

    const x = parseFloat(card.style.left);
    const top = parseFloat(card.style.top);

    if(side === "top"){

        return { x, y: top + card.querySelector(".node").offsetTop };

    }

    const period = card.querySelector(".species-period");

    return { x, y: top + period.offsetTop + period.offsetHeight };

}

function drawLine(from, to, type){

    const a = anchor(from, "bottom");
    const b = anchor(to, "top");

    if(!a || !b) return;

    const path = document.createElementNS(SVG_NS, "path");

    const sameRow =
        document.getElementById(from).style.top ===
        document.getElementById(to).style.top;

    if(sameRow){

        // Misma fila: arco por debajo de los textos hasta la base del destino
        const end = anchor(to, "bottom");
        const drop = 64;

        path.setAttribute(
            "d",
            `M ${a.x} ${a.y + 6}
             C ${a.x} ${a.y + drop} ${end.x} ${end.y + drop} ${end.x} ${end.y + 6}`
        );

    }
    else{

        const curve = Math.max(b.y - a.y, 40) * .5;

        path.setAttribute(
            "d",
            `M ${a.x} ${a.y + 6}
             C ${a.x} ${a.y + curve} ${b.x} ${b.y - curve} ${b.x} ${b.y - 6}`
        );

    }

    path.setAttribute("fill", "none");
    path.setAttribute("class", `connection-line connection-${type}`);

    svg.appendChild(path);

}

function drawTree(){

    svg.innerHTML = "";

    svg.setAttribute("width", tree.clientWidth);
    svg.setAttribute("height", tree.clientHeight);

    evolutionData.species.forEach(species=>{

        if(species.parent){

            drawLine(species.parent, species.id, "direct");

        }

        (species.connections || []).forEach(c=>{

            drawLine(species.id, c.target, c.type);

        });

    });

}

function refresh(){

    layout();
    drawTree();

}

/* =====================================================
   INIT
===================================================== */

async function init(){

    const response = await fetch("evolution.json");

    evolutionData = await response.json();

    await renderSpecies();

    refresh();

}

window.addEventListener("load", init);

let resizeTimer;

window.addEventListener("resize", ()=>{

    clearTimeout(resizeTimer);

    resizeTimer = setTimeout(()=>{

        if(evolutionData) refresh();

    }, 80);

});
