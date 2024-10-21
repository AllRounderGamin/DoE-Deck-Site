async function setUp(){
  let defaultCards = await fetch("../CardList.txt");
  let defaultChars = await fetch("../CharList.txt");
  defaultCards = await defaultCards.text();
  defaultChars = await defaultChars.text();
  CARD_LIST = await createGlobalList(defaultCards);
  CHAR_LIST = await createGlobalList(defaultChars);

  document.querySelector("#copyDeckButton").addEventListener("click", copyDeckToClipboard);
  document.querySelector("#cardDropZone").addEventListener("drop", (e) => {fileDropHandler(e, "card")});
  document.querySelector("#cardDropZone").addEventListener("dragover", (e) => {e.preventDefault();});
  document.querySelector("#charDropZone").addEventListener("drop", (e) => {fileDropHandler(e, "char")});
  document.querySelector("#charDropZone").addEventListener("dragover", (e) => {e.preventDefault();});
  document.querySelector("#resetButton").addEventListener("click", resetIndexes);
  document.querySelector("#generateButton").addEventListener("click", createDeck);
}


function clearDeckBox(){
  const box = document.querySelector("#spellsChose");
  while (box.firstChild){
    box.removeChild(box.lastChild);
  }
  document.querySelector("#charName").textContent = "";
  document.querySelector("#warningText").textContent = "";
}


function createDeck(){
  clearDeckBox();
  if (document.querySelector("#seedInput").value.length === 0){
    SEED = generateSeed();
  } else if (SEED === null) {
    SEED = Math.floor(document.querySelector("#seedInput").value);
  }
  if (document.querySelector("#seedInput").disabled === false){
    document.querySelector("#seedInput").disabled = true;
  }
  document.querySelector("#seedInput").value = Math.floor(SEED);

  const numToDraw = Math.floor(Mulberry32(SEED) * 3) + 8;
  SEED = (Mulberry32(SEED)*2**32)>>>0;

  const character = CHAR_LIST[Math.floor(Mulberry32(SEED) * CHAR_LIST.length)];
  document.querySelector("#charName").textContent = character;
  SEED = (Mulberry32(SEED)*2**32)>>>0;

  const cardsToChoose = [...CARD_LIST];

  for (let i = 0; i < numToDraw; i++){
    const cardIndex = Math.floor(Mulberry32(SEED) * cardsToChoose.length);
    const newCard = document.createElement("p");
    newCard.setAttribute("class", "card");
    newCard.textContent = cardsToChoose[cardIndex];
    cardsToChoose.splice(cardIndex, 1);


    document.querySelector("#spellsChose").appendChild(newCard);
    SEED = (Mulberry32(SEED)*2**32)>>>0
  }
  document.querySelector("#warningText").textContent = "";
}


async function copyDeckToClipboard(){
  let clipboard = "";
  const char = document.querySelector("#charName").textContent;
  clipboard += char + ";\n";
  clipboard += "Complete Chaos;\n";
  clipboard += "LandscapeRedSleeve;\n";
  const cards = document.querySelector("#spellsChose").querySelectorAll("p");
  for (let card of cards){
    clipboard += card.textContent + ",";
    }
  clipboard = clipboard.substring(0, clipboard.length - 1);
  await navigator.clipboard.writeText(clipboard);
  document.querySelector("#warningText").textContent = "Deck Copied!";
}


function resetIndexes(){
  if (CARD_LIST.length < 1){
    return;
  }
  clearDeckBox();
  document.querySelector("#seedInput").value = "";
  document.querySelector("#seedInput").disabled = false;
  SEED = null;
}


async function fileDropHandler(e, type) {
  e.preventDefault();
  if (e.dataTransfer.files[0]) {
    const fileName = e.dataTransfer.files[0].name.split('.');
    if (fileName[fileName.length - 1] === 'txt') {
      const reader = new FileReader();
      reader.readAsText(e.dataTransfer.files[0]);
      if (type === "card"){
        reader.onload = async () => { CARD_LIST = await createGlobalList(reader.result) };
      } else if (type === "char"){
        reader.onload = async () => { CHAR_LIST = await createGlobalList(reader.result) };
      }
    }
  }
}


async function createGlobalList(list){
  // copied over from Deck Selector just in case, since I made the file in notepad not sheets it *should* be unnecessary but better safe than sorry
  const initList = list;
  list = initList.split('\r\n');
  if (list.length === 1){
    list = initList.split("\n");
  }
  list = list.filter((line) => {return line.length > 0;});
  resetIndexes();
  document.querySelector("#warningText").textContent = "List Loaded!";
  return list;
}

let CARD_LIST = [];
let SEED = null;
let CHAR_LIST = [];
window.addEventListener("load", setUp);


// https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript

function Mulberry32(a){
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

function generateSeed(){
  return (Math.random()*2**32)>>>0;
}