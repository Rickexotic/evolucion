const SVG_NS = "http://www.w3.org/2000/svg";

const tree = document.getElementById("tree");
const svg = document.getElementById("tree-svg");
const stage = document.getElementById("stage");
const stageImg = document.getElementById("stage-img");
const stageName = document.getElementById("stage-name");
const stagePeriod = document.getElementById("stage-period");
const stageFigure = stage.querySelector(".stage-figure");
const panelBody = document.getElementById("panel-body");
const panelContent = document.getElementById("panel-content");
const panelCount = document.getElementById("panel-count");
const prevBtn = document.getElementById("panel-prev");
const nextBtn = document.getElementById("panel-next");
const closeBtn = document.getElementById("panel-close");
const inertTargets = [document.querySelector(".hero"), tree];

const mobileQuery = window.matchMedia("(max-width: 760px)");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let evolutionData = null;
let currentIndex = -1;
let lastFocus = null;

/* =====================================================
   CONFIG
===================================================== */

const LEVEL_HEIGHT = 330;
const COLUMN_WIDTH = 340;
const CARD_WIDTH = 300;
const MOBILE_ROW_HEIGHT = 215;
const TOP_PADDING = 50;
const SWAP_MS = 180;

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
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Ver ficha de ${species.name}`);

    const image = await fetchWikipediaImage(species.name);

    card.innerHTML = `
        <div class="node">
            <img src="${image}" alt="${species.name}" loading="lazy">
        </div>
        <div class="species-name">${species.name}</div>
        <div class="species-period">${formatPeriod(species)}</div>
    `;

    card.addEventListener("click", ()=>openSpecies(species.id));

    card.addEventListener("keydown", e=>{

        if(e.key === "Enter" || e.key === " "){

            e.preventDefault();

            openSpecies(species.id);

        }

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
   PANEL CONTENT
===================================================== */

const NO_DATA = `<span class="muted">Sin dato</span>`;

function show(value, unit = ""){

    if(value === null || value === undefined || value === ""){

        return NO_DATA;

    }

    return unit ? `${value} ${unit}` : `${value}`;

}

function section(title, body){

    return `
        <div class="panel-section">
            <h3>${title}</h3>
            ${body}
        </div>
    `;

}

function text(value){

    return `<p>${value ? value : NO_DATA}</p>`;

}

function rows(entries){

    return `
        <dl>
            ${entries.map(([label, value])=>`
                <div>
                    <dt>${label}</dt>
                    <dd>${value}</dd>
                </div>
            `).join("")}
        </dl>
    `;

}

function bullets(items){

    if(!items || !items.length) return `<p>${NO_DATA}</p>`;

    return `<ul>${items.map(item=>`<li>${item}</li>`).join("")}</ul>`;

}

function buildPanel(species){

    const morphology = species.morphology || {};
    const discovery = species.discovery || {};
    const environment = species.environment || {};
    const evolution = species.evolution || {};

    const descendants =
        evolution.descendants && evolution.descendants.length
        ? evolution.descendants.join(", ")
        : "Ninguno";

    const columns = [

        [
            section("Importancia evolutiva", text(species.importance)),
            section("Era", text(species.time_band)),
            section("Descripción", text(species.description))
        ],

        [
            section("Morfología", rows([
                ["Cerebro", show(morphology.brain_cc, "cc")],
                ["Altura", show(morphology.height_m, "m")],
                ["Peso", show(morphology.weight_kg, "kg")],
                ["Locomoción", show(morphology.locomotion)]
            ])),
            section("Ambiente", rows([
                ["Hábitat", show(environment.habitat)],
                ["Clima", show(environment.climate)]
            ]))
        ],

        [
            section("Innovaciones", bullets(species.innovations)),
            section("Datos clave", bullets(species.facts))
        ],

        [
            section("Descubrimiento", rows([
                ["Año", show(discovery.year)],
                ["Sitio", show(discovery.site)],
                ["País", show(discovery.country)],
                ["Descubridores", show(
                    discovery.discoverers &&
                    discovery.discoverers.join(", ")
                )]
            ])),
            section("Distribución", text(
                species.regions && species.regions.join(", ")
            )),
            section("Evolución", rows([
                ["Antecesor", show(evolution.ancestor ?? "Desconocido")],
                ["Descendientes", descendants]
            ]))
        ]

    ];

    panelContent.innerHTML = columns
        .map(col=>`<div class="panel-col">${col.join("")}</div>`)
        .join("");

}

function fillPanel(index){

    const species = evolutionData.species[index];
    const total = evolutionData.species.length;

    stageImg.src = document.querySelector(`#${species.id} img`).src;
    stageImg.alt = species.name;
    stageName.textContent = species.name;
    stagePeriod.textContent = formatPeriod(species);

    buildPanel(species);

    panelBody.scrollTop = 0;

    panelCount.textContent = `${index + 1} de ${total}`;

    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === total - 1;

}

/* =====================================================
   OPEN / CLOSE
===================================================== */

function setInert(value){

    inertTargets.forEach(el=>{ el.inert = value; });

}

function openSpecies(id){

    const index = evolutionData.species.findIndex(x=>x.id === id);

    if(index === -1) return;

    lastFocus = document.activeElement;

    currentIndex = index;

    fillPanel(index);

    setInert(true);

    stage.setAttribute("aria-hidden", "false");

    document.body.classList.add("panel-open");

    closeBtn.focus({ preventScroll: true });

}

function goTo(index){

    const total = evolutionData.species.length;

    if(index < 0 || index >= total || index === currentIndex) return;

    currentIndex = index;

    if(reduceMotion.matches){

        fillPanel(index);

        return;

    }

    stageFigure.classList.add("is-swapping");

    setTimeout(()=>{

        fillPanel(index);

        stageFigure.classList.remove("is-swapping");

    }, SWAP_MS);

}

function closePanel(){

    if(currentIndex === -1) return;

    const card = document.getElementById(
        evolutionData.species[currentIndex].id
    );

    currentIndex = -1;

    document.body.classList.remove("panel-open");

    stage.setAttribute("aria-hidden", "true");

    setInert(false);

    setPointer(0, 0);

    // Tras navegar entre especies, la tarjeta puede quedar fuera de pantalla
    const rect = card.getBoundingClientRect();

    if(rect.top < 0 || rect.bottom > window.innerHeight){

        card.scrollIntoView({
            behavior: reduceMotion.matches ? "auto" : "smooth",
            block: "center"
        });

    }

    (lastFocus && lastFocus.isConnected ? lastFocus : card)
    .focus({ preventScroll: true });

}

closeBtn.addEventListener("click", closePanel);
prevBtn.addEventListener("click", ()=>goTo(currentIndex - 1));
nextBtn.addEventListener("click", ()=>goTo(currentIndex + 1));

// Clic en el fondo del escenario (fuera de la imagen) cierra el panel
stage.addEventListener("click", e=>{

    if(!e.target.closest(".stage-figure")) closePanel();

});

document.addEventListener("keydown", e=>{

    if(currentIndex === -1) return;

    if(e.key === "Escape") closePanel();
    if(e.key === "ArrowLeft") goTo(currentIndex - 1);
    if(e.key === "ArrowRight") goTo(currentIndex + 1);

});

/* =====================================================
   PARALLAX
===================================================== */

const target = { x: 0, y: 0 };
const eased = { x: 0, y: 0 };

let rafId = 0;

function tick(){

    eased.x += (target.x - eased.x) * .09;
    eased.y += (target.y - eased.y) * .09;

    stage.style.setProperty("--px", eased.x.toFixed(3));
    stage.style.setProperty("--py", eased.y.toFixed(3));

    const settled =
        Math.abs(target.x - eased.x) < .002 &&
        Math.abs(target.y - eased.y) < .002;

    rafId = settled ? 0 : requestAnimationFrame(tick);

}

function setPointer(x, y){

    target.x = Math.max(-1, Math.min(1, x));
    target.y = Math.max(-1, Math.min(1, y));

    if(!rafId && !reduceMotion.matches){

        rafId = requestAnimationFrame(tick);

    }

}

window.addEventListener("pointermove", e=>{

    if(currentIndex === -1) return;

    setPointer(
        (e.clientX / window.innerWidth - .5) * 2,
        (e.clientY / window.innerHeight - .5) * 2
    );

});

window.addEventListener("pointerup", e=>{

    if(e.pointerType !== "mouse") setPointer(0, 0);

});

// En pantallas táctiles el desplazamiento del panel mueve la imagen
panelBody.addEventListener("scroll", ()=>{

    setPointer(target.x, -Math.min(panelBody.scrollTop / 160, 1));

}, { passive: true });

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

        if(evolutionData && currentIndex === -1) refresh();

    }, 80);

});
