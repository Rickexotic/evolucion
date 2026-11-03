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
const STAGE_ZOOM = 1.3;
const STAGE_MS = 900;

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

  const startLabel =
formatMillions(species.start);

const endLabel =
formatMillions(species.end);

const parts =
species.name.split(" ");

const genus =
parts.shift();

const speciesName =
parts.join(" ");

card.innerHTML = `

    <div class="species-visual">

        <div class="species-candle">

            <div class="candle-top">
                ${startLabel}
            </div>

            <div class="candle-line"></div>

            <div class="candle-body"></div>

            <div class="candle-line"></div>

            <div class="candle-bottom">
                ${endLabel}
            </div>

        </div>

        <div class="species-content">

            <div class="node">

                <img
                    src="${image}"
                    alt="${species.name}"
                    loading="lazy">

            </div>

            <div class="species-name">

                <span>${genus}</span>

                <span>${speciesName}</span>

            </div>

        </div>

    </div>

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

            x = width / 2 + 14 + offset;
            y = TOP_PADDING + index * MOBILE_ROW_HEIGHT;
            cardWidth = width - 90 - Math.abs(offset) * 2;

        }
        else{

            const left = Math.min(190, width * .13);
            const right = Math.min(200, width * .14);
            const inner = width - left - right;

            const step = Math.min(
                COLUMN_WIDTH,
                (inner - CARD_WIDTH) / 4
            );

            x = left + inner / 2 + species.column * step;
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

/* Gráficos comparativos: especie elegida vs Homo sapiens moderno */

function personSvg(height, max, cls){

    const h = Math.max(height / max * 100, 4);

    return `
        <svg class="cmp-person ${cls}" viewBox="0 0 40 100" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <g transform="translate(0 ${100 - h}) scale(${h / 100})">
                <circle cx="20" cy="9" r="7.5"/>
                <path d="M12 20h16l4 34h-5l-1 46h-6V62h-4v38h-6l-1-46h-5z"/>
            </g>
        </svg>
    `;

}

function compareBlock(label, mine, ref, species, unitFmt, visual){

    if(mine === null || mine === undefined){

        return `
            <div class="cmp-row">
                <div class="cmp-label">${label}</div>
                <div class="cmp-empty">${NO_DATA}</div>
            </div>
        `;

    }

    const max = Math.max(mine, ref);

    return `
        <div class="cmp-row">
            <div class="cmp-label">${label}</div>
            <div class="cmp-visual">
                ${visual(mine, ref, max)}
            </div>
            <div class="cmp-values">
                <span class="cmp-key cmp-mine">${unitFmt(mine)}</span>
                <span class="cmp-key cmp-ref">${unitFmt(ref)}</span>
            </div>
        </div>
    `;

}

function buildComparison(species){

    const m = species.morphology || {};
    const ref = (evolutionData.species.find(x=>x.id === "sapiens") || {}).morphology || {};
    const short = species.name.split(" ").map((w, i)=>i ? w : w[0] + ".").join(" ");

    const brain = (mine, other, max)=>{

        // El volumen crece con el cubo del radio
        const r = v=>Math.cbrt(v / max) * 100;

        return `
            <div class="cmp-brain">
                <span class="cmp-circle cmp-mine" style="--d:${r(mine)}%"></span>
                <span class="cmp-circle cmp-ref" style="--d:${r(other)}%"></span>
            </div>
        `;

    };

    const height = (mine, other, max)=>`
        <div class="cmp-people">
            ${personSvg(mine, max, "cmp-mine")}
            ${personSvg(other, max, "cmp-ref")}
        </div>
    `;

    const weight = (mine, other, max)=>`
        <div class="cmp-bars">
            <span class="cmp-bar cmp-mine" style="--w:${mine / max * 100}%"></span>
            <span class="cmp-bar cmp-ref" style="--w:${other / max * 100}%"></span>
        </div>
    `;

    return `
        <div class="cmp-legend">
            <span class="cmp-key cmp-mine">${short}</span>
            <span class="cmp-key cmp-ref">H. sapiens moderno</span>
        </div>
        ${compareBlock("Cerebro", m.brain_cc, ref.brain_cc, species, v=>`${v} cc`, brain)}
        ${compareBlock("Estatura", m.height_m, ref.height_m, species, v=>`${v} m`, height)}
        ${compareBlock("Peso", m.weight_kg, ref.weight_kg, species, v=>`${v} kg`, weight)}
        <p class="cmp-loco"><span class="muted">Locomoción:</span> ${m.locomotion || NO_DATA}</p>
    `;

}

function buildPanel(species){

    const discovery = species.discovery || {};
    const environment = species.environment || {};

    const columns = [

        [
            section("Distribución", `
                ${text(species.regions && species.regions.join(", "))}
                <div class="globe-slot"></div>
            `),
            section("Descubrimiento", rows([
                ["Año", show(discovery.year)],
                ["Sitio", show(discovery.site)],
                ["País", show(discovery.country)],
                ["Descubridores", show(
                    discovery.discoverers &&
                    discovery.discoverers.join(", ")
                )]
            ]))
        ],

        [
            section("Importancia evolutiva", text(species.importance)),
            section("Descripción", text(species.description)),
            section("Ambiente", rows([
                ["Hábitat", show(environment.habitat)],
                ["Clima", show(environment.climate)]
            ])),
            section("Datos clave", bullets(species.facts))
        ],

        [
            section("Comparativo con Homo sapiens", buildComparison(species))
        ]

    ];

    panelContent.innerHTML = columns
        .map(col=>`<div class="panel-col">${col.join("")}</div>`)
        .join("");

    showGlobe(species);

}

/* =====================================================
   TIMELINE (fondo del escenario: eras, años e hitos)
===================================================== */

const T0 = 7200000;

// Escala de raíz cuadrada: da más espacio a los períodos recientes
function timeTop(year){

    const ago = Math.min(Math.max(-year, 0), T0);

    return (1 - Math.sqrt(ago / T0)) * 100;

}

const PERIODS = [
    { name:"Neógeno", start:-7200000, end:-2580000 },
    { name:"Cuaternario", start:-2580000, end:0 }
];

const EPOCHS = [
    { name:"Mioceno", start:-7200000, end:-5333000, color:"#e3dfd2" },
    { name:"Plioceno", start:-5333000, end:-2580000, color:"#e9e6dc" },
    { name:"Pleistoceno", start:-2580000, end:-11700, color:"#efede6" },
    { name:"Holoceno", start:-11700, end:0, color:"#f5f4ef" }
];


const SIDE_PAD = 8;
function getMilestones(){

    return evolutionData?.milestones || [];

}

function formatYears(value){

    if(value === 0) return "hoy";

    const abs = Math.abs(value);

    if(abs >= 1000000) return `${+(abs / 1000000).toFixed(2)} Ma`;
    if(abs >= 1000) return `${+(abs / 1000).toFixed(1)} mil años`;

    return `${abs} años`;

}

function buildTimeline(){

    const bands = document.getElementById("tl-bands");
    const milestones = document.getElementById("tl-milestones");
    const dots = document.getElementById("tl-dots");

    const block = (item, cls, attrs, inner, extra = "")=>{

        const top = timeTop(item.start);
        const height = timeTop(item.end) - top;

        return `<div class="${cls}" ${attrs} style="top:${top}%;height:${height}%;${extra}">${inner}</div>`;

    };

    bands.innerHTML =
        EPOCHS.map((e, i)=>block(
            e, "tl-band", `data-epoch="${i}"`,
            `<div class="tl-epoch"><strong>${e.name}</strong><span>${formatYears(e.start)} – ${formatYears(e.end)}</span></div>`,
            `--c:${e.color}`
        ).replace("tl-band\"", `tl-band${timeTop(e.end) - timeTop(e.start) < 8 ? " is-thin" : ""}"`)).join("") +
        PERIODS.map(p=>block(p, "tl-period", "", `<span>${p.name}</span>`)).join("");

    milestones.innerHTML = MILESTONES.map((m, i)=>`
        <div class="tl-milestone" data-i="${i}" style="top:${timeTop(m.year)}%">
            <i></i><span>${m.label}<small>${formatYears(m.year)}</small></span>
        </div>
    `).join("");

    dots.innerHTML = evolutionData.species.map((sp, i)=>{

        const top = timeTop(sp.start);
        const height = timeTop(sp.end) - top;
        const shift = (i % 3 - 1) * 6;

        return `<i class="tl-bar" data-i="${i}" style="left:calc(${speciesX(sp)}% + ${shift}px);top:${top}%;height:max(${height}%,5px)"></i>`;

    }).join("") + evolutionData.species.map((sp, i)=>{

        const mid = (sp.start + sp.end) / 2;

        return `
            <button class="tl-dot" type="button" data-i="${i}"
                title="${sp.name}" aria-label="${sp.name}"
                style="left:${speciesX(sp)}%;top:${timeTop(mid)}%"></button>
        `;

    }).join("");

    dots.addEventListener("click", e=>{

        const dot = e.target.closest(".tl-dot");

        if(dot) goTo(+dot.dataset.i);

    });

}

function speciesX(species){

    return 50 + species.column * 15;

}

function updateTimeline(species, index){

    const mid = (species.start + species.end) / 2;
    const x = speciesX(species);
    stageFigure.style.setProperty("--x", `${x}%`);
    stageFigure.style.setProperty("--y", `${timeTop(mid)}%`);

    document.querySelectorAll(".tl-bar").forEach(bar=>{

        bar.classList.toggle("is-active", +bar.dataset.i === index);

    });

    document.querySelectorAll(".tl-dot").forEach(dot=>{

        dot.classList.toggle("is-active", +dot.dataset.i === index);

    });

    document.querySelectorAll(".tl-band").forEach(band=>{

        const e = EPOCHS[+band.dataset.epoch];

        band.classList.toggle("is-active", mid > e.start && mid <= e.end + 1);

    });

}

function fillPanel(index){

    const species = evolutionData.species[index];
    const total = evolutionData.species.length;

    stageImg.src = document.querySelector(`#${species.id} img`).src;
    stageImg.alt = species.name;
    stageName.textContent = species.name;
    stagePeriod.textContent = formatPeriod(species);

    updateTimeline(species, index);

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

    flyToStage(id);

    closeBtn.focus({ preventScroll: true });

}

/* =====================================================
   STAGE: desplazamiento suave desde la tarjeta + zoom 30 %
===================================================== */

function flyToStage(id){

    if(reduceMotion.matches) return;

    const source = document.querySelector(`#${id} .node`);
    const dest = stage.querySelector(".stage-image");

    if(!source || !dest) return;

    const from = source.getBoundingClientRect();

    // Medido en reposo, sin transformaciones ni transiciones
    stageFigure.getAnimations().forEach(x=>x.cancel());
    stageFigure.style.transition = "none";
    stageFigure.style.transform = "none";

    const to = dest.getBoundingClientRect();
    const fig = stageFigure.getBoundingClientRect();

    stageFigure.style.transform = "";
    void stageFigure.offsetWidth;
    stageFigure.style.transition = "";

    if(!to.width) return;

    const s = from.width / to.width;
    const rx = (to.left + to.width / 2) - (fig.left + fig.width / 2);
    const ry = (to.top + to.height / 2) - (fig.top + fig.height / 2);
    const dx = (from.left + from.width / 2) - (fig.left + fig.width / 2) - s * rx;
    const dy = (from.top + from.height / 2) - (fig.top + fig.height / 2) - s * ry;

    stageFigure.animate([
        {
            transform:`translate(${dx}px, ${dy}px) scale(${s})`,
            opacity:0
        },
        {
            opacity:1,
            offset:.25
        },
        {
            transform:`scale(${STAGE_ZOOM})`,
            opacity:1
        }
    ], {
        duration:STAGE_MS,
        easing:"cubic-bezier(.22,.8,.24,1)",
        delay:60,
        fill:"backwards"
    });

}

/* =====================================================
   GLOBE (esquema gris con la zona del hábitat resaltada)
===================================================== */

const COUNTRIES_URL =
"https://cdn.jsdelivr.net/gh/vasturiano/globe.gl@master/example/datasets/ne_110m_admin_0_countries.geojson";

const COUNTRY_ALIASES = {
    "Kenia":"Kenya", "Etiopía":"Ethiopia", "Sudáfrica":"South Africa",
    "Tanzania":"Tanzania", "Chad":"Chad", "Indonesia":"Indonesia",
    "Alemania":"Germany", "Rusia":"Russia", "Suecia":"Sweden"
};

const EAST_AFRICA = [
    "Kenya","Ethiopia","Tanzania","Uganda","Somalia","Eritrea",
    "Djibouti","Rwanda","Burundi","S. Sudan","Sudan"
];

const SOUTH_AFRICA = [
    "South Africa","Namibia","Botswana","Zimbabwe","Zambia","Mozambique",
    "Malawi","Lesotho","eSwatini","Angola"
];

const WEST_ASIA = [
    "Turkey","Syria","Iraq","Iran","Israel","Lebanon","Jordan","Saudi Arabia",
    "Yemen","Oman","United Arab Emirates","Kuwait","Qatar","Georgia",
    "Armenia","Azerbaijan","Palestine"
];

const CONTINENTS = { "África":"Africa", "Europa":"Europe", "Asia":"Asia" };

let globe = null;
let globeHost = null;
let countries = [];
let activeIds = new Set();

function regionMatcher(species){

    const names = new Set();
    const continents = new Set();
    let all = false;

    (species.regions || []).forEach(region=>{

        if(region === "Global") all = true;
        else if(CONTINENTS[region]) continents.add(CONTINENTS[region]);
        else if(region === "África Oriental") EAST_AFRICA.forEach(n=>names.add(n));
        else if(region === "África Austral") SOUTH_AFRICA.forEach(n=>names.add(n));
        else if(region === "Asia Occidental") WEST_ASIA.forEach(n=>names.add(n));
        else names.add(COUNTRY_ALIASES[region] || region);

    });

    return f=>{

        const p = f.properties;

        return all ||
            continents.has(p.CONTINENT) ||
            names.has(p.NAME) ||
            names.has(p.ADMIN);

    };

}

function featureCenter(f){

    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;

    const polys = f.geometry.type === "Polygon"
        ? [f.geometry.coordinates]
        : f.geometry.coordinates;

    // Solo el polígono más grande, para evitar territorios remotos
    let best = polys[0];
    let bestSize = -1;

    polys.forEach(poly=>{

        if(poly[0].length > bestSize){ best = poly; bestSize = poly[0].length; }

    });

    best[0].forEach(([lng, lat])=>{

        minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
        minLng = Math.min(minLng, lng); maxLng = Math.max(maxLng, lng);

    });

    return { lat:(minLat + maxLat) / 2, lng:(minLng + maxLng) / 2 };

}

function ensureGlobe(){

    if(globe || typeof Globe === "undefined") return;

    globeHost = document.createElement("div");
    globeHost.className = "globe-host";

    globe = Globe()(globeHost)
        .backgroundColor("rgba(0,0,0,0)")
        .showGlobe(true)
        .showAtmosphere(true)
        .atmosphereColor("#9a9a9a")
        .atmosphereAltitude(.12)
        .showGraticules(true)
        .polygonAltitude(f=>activeIds.has(f) ? .035 : .004)
        .polygonCapColor(f=>activeIds.has(f) ? "rgba(214,90,40,.92)" : "rgba(205,205,205,.9)")
        .polygonSideColor(()=>"rgba(120,120,120,.35)")
        .polygonStrokeColor(()=>"#8a8a8a")
        .polygonLabel(f=>f.properties.NAME)
        .polygonsTransitionDuration(300);

    const material = globe.globeMaterial();

    material.color.set("#efefef");
    material.emissive.set("#e4e4e4");
    material.emissiveIntensity = .5;

    const controls = globe.controls();

    controls.autoRotate = !reduceMotion.matches;
    controls.autoRotateSpeed = .6;
    controls.enableZoom = false;

    fetch(COUNTRIES_URL)
    .then(r=>r.json())
    .then(data=>{

        countries = data.features;

        globe.polygonsData(countries);

        if(currentIndex !== -1) showGlobe(evolutionData.species[currentIndex]);

    })
    .catch(()=>{});

}

function showGlobe(species){

    ensureGlobe();

    if(!globe) return;

    const slot = panelContent.querySelector(".globe-slot");

    if(!slot) return;

    slot.appendChild(globeHost);

    const size = Math.min(slot.clientWidth || 260, 260);

    globe.width(size).height(size);

    const match = regionMatcher(species);

    activeIds = new Set(countries.filter(match));

    // Fuerza el recálculo de colores y altura
    globe.polygonsData(countries.slice());

    const targets = [...activeIds];

    if(targets.length){

        const centers = targets.map(featureCenter);
        const lat = centers.reduce((n, c)=>n + c.lat, 0) / centers.length;
        let lng = centers.reduce((n, c)=>n + c.lng, 0) / centers.length;

        // Con regiones muy dispersas (Global) se mira al ecuador
        const spread = Math.max(...centers.map(c=>c.lng)) - Math.min(...centers.map(c=>c.lng));

        globe.pointOfView({
            lat: spread > 180 ? 10 : lat,
            lng: spread > 180 ? 20 : lng,
            altitude: spread > 90 ? 2.6 : 2
        }, reduceMotion.matches ? 0 : 900);

    }

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

    if(!e.target.closest(".stage-figure, .tl-dot")) closePanel();

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

/* =====================================================
   TIMELINE EN EL ÁRBOL (siempre visible)
===================================================== */

const treeLayer = document.createElement("div");

treeLayer.id = "tl-tree";
treeLayer.setAttribute("aria-hidden", "true");
tree.prepend(treeLayer);

// Interpola año -> y usando la posición de cada especie en el árbol
function makeYMap(height){

    const anchors = evolutionData.species
        .map(sp=>{

            const card = document.getElementById(sp.id);

            return {
                year:(sp.start + sp.end) / 2,
                y:parseFloat(card.style.top) + card.querySelector(".node").offsetHeight / 2
            };

        });

    const years = [-T0, ...anchors.map(a=>a.year), 0].sort((a, b)=>a - b);
    const ys = [0, ...anchors.map(a=>a.y), height].sort((a, b)=>a - b);

    return year=>{

        if(year <= years[0]) return ys[0];

        for(let i = 1; i < years.length; i++){

            if(year <= years[i]){

                const span = years[i] - years[i - 1] || 1;

                return ys[i - 1] + (ys[i] - ys[i - 1]) * (year - years[i - 1]) / span;

            }

        }

        return ys[ys.length - 1];

    };

}

function drawTreeTimeline(){

    const height = tree.clientHeight;
    const yOf = makeYMap(height);
   const milestones =
getMilestones();

    const bands = EPOCHS.map((e, i)=>{

        const top = yOf(e.start);

        const h = yOf(e.end) - top;

        return `
            <div class="tl-band${h < 60 ? " is-thin" : ""}" data-epoch="${i}" style="top:${top}px;height:${h}px;--c:${e.color}">
                <div class="tl-epoch"><strong>${e.name}</strong><span>${formatYears(e.start)} – ${formatYears(e.end)}</span></div>
            </div>
        `;

    }).join("");

    const periods = PERIODS.map(p=>{

        const top = yOf(p.start);

        return `<div class="tl-period" style="top:${top}px;height:${yOf(p.end) - top}px"><span>${p.name}</span></div>`;

    }).join("");

    const bars = evolutionData.species.map((sp, i)=>{

        const top = yOf(sp.start);
        const h = Math.max(yOf(sp.end) - top, 4);

        return `<i class="tl-bar" style="left:calc(var(--rail) + ${i * 3.5}px);top:${top}px;height:${h}px" title="${sp.name}"></i>`;

    }).join("");

   const MIN_MILESTONE_GAP = 78;

let lastY = -9999;

const positionedMilestones =

    milestones.map(m=>{

        let y = yOf(m.year);

        if(
            y - lastY
            <
            MIN_MILESTONE_GAP
        ){

            y =
            lastY +
            MIN_MILESTONE_GAP;

        }

        lastY = y;

        return {

            ...m,

            renderY:y

        };

    });

const marks =

    positionedMilestones.map(m=>`

        <div
            class="tl-milestone"
            style="top:${m.renderY}px">

            <i></i>

            <span>

                ${m.label}

                <small>

                    ${formatYears(m.year)}

                </small>

            </span>

        </div>

    `).join("");

    treeLayer.innerHTML = bands + periods + bars + `<div class="tl-milestones">${marks}</div>`;

}

function refresh(){

    layout();
    drawTree();
    drawTreeTimeline();

}

/* =====================================================
   INIT
===================================================== */

async function init(){

    const response = await fetch("evolution.json");

    evolutionData = await response.json();

    await renderSpecies();

    buildTimeline();

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
