function drawConnections(){

const svg = document.getElementById("connections");

svg.innerHTML = "";

const sequence = [

"afarensis",
"habilis",
"ergaster",
"erectus",
"heidelbergensis",
"sapiens"

];

for(let i=0;i<sequence.length-1;i++){

const a =
document.getElementById(sequence[i]);

const b =
document.getElementById(sequence[i+1]);

const ar = a.getBoundingClientRect();
const br = b.getBoundingClientRect();

const ay =
ar.top + window.scrollY + ar.height/2;

const by =
br.top + window.scrollY + br.height/2;

const ax =
ar.left + ar.width/2;

const bx =
br.left + br.width/2;

const path =
document.createElementNS(
"http://www.w3.org/2000/svg",
"path"
);

path.setAttribute(
"d",
`
M ${ax} ${ay}
C ${ax+400} ${ay+200}
  ${bx-400} ${by-200}
  ${bx} ${by}
`
);

path.setAttribute(
"fill",
"none"
);

path.setAttribute(
"stroke",
"#111"
);

path.setAttribute(
"stroke-width",
"1.5"
);

path.setAttribute(
"opacity",
"0.25"
);

svg.appendChild(path);

}

}

window.addEventListener(
"load",
drawConnections
);

window.addEventListener(
"resize",
drawConnections
);
