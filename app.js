const SVG_NS = "http://www.w3.org/2000/svg";

const svg = document.getElementById("tree-svg");

/* =====================================================
   WIKIPEDIA IMAGES
===================================================== */

const FALLBACK_IMAGE =
"https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Question_Mark.svg/512px-Question_Mark.svg.png";

async function fetchWikipediaImage(species){

    try{

        const title =
        encodeURIComponent(
            species.replaceAll(" ","_")
        );

        const url =
        `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`;

        const response =
        await fetch(url);

        if(!response.ok)
            return FALLBACK_IMAGE;

        const data =
        await response.json();

        if(
            data.thumbnail &&
            data.thumbnail.source
        ){

            return data.thumbnail.source;

        }

        return FALLBACK_IMAGE;

    }
    catch{

        return FALLBACK_IMAGE;

    }

}

/* =====================================================
   IMAGE LOADER
===================================================== */

async function loadSpeciesImages(){

    const images =
    document.querySelectorAll(
        "img[data-species]"
    );

    const promises = [];

    images.forEach(img=>{

        const species =
        img.dataset.species;

        promises.push(

            fetchWikipediaImage(species)
            .then(src=>{

                img.src = src;

            })

        );

    });

    await Promise.all(promises);

}

/* =====================================================
   SVG HELPERS
===================================================== */

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

function drawCurve(

    from,
    to,
    options={}

){

    const start =
    document.getElementById(from);

    const end =
    document.getElementById(to);

    if(
        !start ||
        !end
    ){
        return;
    }

    const a =
    center(start);

    const b =
    center(end);

    const curve =
    Math.abs(
        b.y-a.y
    ) * .45;

    const path =
    document.createElementNS(
        SVG_NS,
        "path"
    );

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
        "stroke",
        options.color || "#111"
    );

    path.setAttribute(
        "stroke-width",
        options.width || 2.5
    );

    path.setAttribute(
        "opacity",
        options.opacity || .18
    );

    if(options.dash){

        path.setAttribute(
            "stroke-dasharray",
            "8 6"
        );

    }

    path.classList.add(
        "tree-path"
    );

    svg.appendChild(path);

}

/* =====================================================
   MAIN EVOLUTION
===================================================== */

function drawEarlyTree(){

    const chain = [

        "sahelanthropus",

        "orrorin",

        "ardipithecus",

        "anamensis",

        "afarensis"

    ];

    for(
        let i=0;
        i<chain.length-1;
        i++
    ){

        drawCurve(
            chain[i],
            chain[i+1]
        );

    }

}

/* =====================================================
   AUSTRALOPITHECUS BRANCH
===================================================== */

function drawAustralopithecusTree(){

    drawCurve(
        "afarensis",
        "africanus"
    );

    drawCurve(
        "afarensis",
        "sediba"
    );

}

/* =====================================================
   HOMO
===================================================== */

function drawHomoTree(){

    drawCurve(
        "afarensis",
        "habilis"
    );

    drawCurve(
        "habilis",
        "rudolfensis"
    );

    drawCurve(
        "rudolfensis",
        "erectus"
    );

    drawCurve(
        "erectus",
        "heidelbergensis"
    );

}

/* =====================================================
   MODERN HUMANS
===================================================== */

function drawModernTree(){

    drawCurve(
        "heidelbergensis",
        "neanderthal"
    );

    drawCurve(
        "heidelbergensis",
        "denisova"
    );

    drawCurve(
        "heidelbergensis",
        "sapiens"
    );

}

/* =====================================================
   CIVILIZATION
===================================================== */

function drawCivilizationTree(){

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

        drawCurve(
            chain[i],
            chain[i+1]
        );

    }

}

/* =====================================================
   SATELLITES
===================================================== */

function drawSatelliteLinks(){

    document
    .querySelectorAll(".species")
    .forEach(species=>{

        const node =
        species.querySelector(
            ".node"
        );

        if(!node)
            return;

        const p =
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
                M ${p.x} ${p.y}

                Q
                ${(p.x+t.x)/2}
                ${(p.y+t.y)/2}

                ${t.x}
                ${t.y}
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
                ".12"
            );

            svg.appendChild(path);

        });

    });

}

/* =====================================================
   ZOOM / FOCUS
===================================================== */

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

        node.addEventListener(
            "click",
            ()=>{

                const active =
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

                    behavior:"smooth",

                    block:"center"

                });

            }
        );

    });

}

/* =====================================================
   REDRAW
===================================================== */

function redrawTree(){

    clearSVG();

    svg.setAttribute(
        "width",
        document.documentElement.scrollWidth
    );

    svg.setAttribute(
        "height",
        document.documentElement.scrollHeight
    );

    drawEarlyTree();

    drawAustralopithecusTree();

    drawHomoTree();

    drawModernTree();

    drawCivilizationTree();

    drawSatelliteLinks();

}

/* =====================================================
   INIT
===================================================== */

window.addEventListener(

    "load",

    async ()=>{

        await loadSpeciesImages();

        redrawTree();

        setupFocus();

    }

);

window.addEventListener(

    "resize",

    ()=>{

        redrawTree();

    }

);
