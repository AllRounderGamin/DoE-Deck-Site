async function setUp(){
  let defaultCards = await fetch("./CardList.txt");
  let defaultChars = await fetch("./CharList.txt");
  defaultCards = await defaultCards.text();
  defaultChars = await defaultChars.text();
  CARD_LIST = await createGlobalList(defaultCards);
  createCharSelects(await createGlobalList(defaultChars));

  document.querySelector("#copyDeckButton").addEventListener("click", copyDeckToClipboard);
  document.querySelector("#copyCardsButton").addEventListener("click", copyCardstoClipboard);
  document.querySelector("#cardDropZone").addEventListener("drop", (e) => {fileDropHandler(e, "card")});
  document.querySelector("#cardDropZone").addEventListener("dragover", (e) => {e.preventDefault();});
  document.querySelector("#charDropZone").addEventListener("drop", (e) => {fileDropHandler(e, "char")});
  document.querySelector("#charDropZone").addEventListener("dragover", (e) => {e.preventDefault();});
  document.querySelector("#resetButton").addEventListener("click", resetIndexes);
  document.querySelector("#generateButton").addEventListener("click", drawCard);
  document.querySelector("#randomCharButton").addEventListener("click", selectRandomChar);
  document.querySelector("#deselectButton").addEventListener("click", () => {toggleCards(false)});
  document.querySelector("#selectAllCardsButton").addEventListener("click", () => {toggleCards(true)});
}


function clearCardBox(){
  const box = document.querySelector("#Cards");
  while (box.firstChild){
    box.removeChild(box.lastChild);
  }
  document.querySelector("#warningText").textContent = "";
}

function toggleCards(opt){
  const cards = document.querySelector("#Cards").querySelectorAll("input");
  for (let card of cards){
    card.checked = opt;
  }
}


function selectRandomChar(){
  const chars = document.querySelector("#Characters").querySelectorAll("input");
  if (chars.length < 1){
    return;
  }
  for (let char of chars){
    char.checked = false;
  }
  const index = Math.floor(Math.random() * chars.length);
  chars[index].checked = true;
}


function drawCard(){
  let cardsToChoose = JSON.parse(localStorage.getItem("DraftSelector-IndexArray"));
  const numToDraw = document.querySelector("#numberOfCards").value;
  // Html number inputs return non numbers as empty strings
  if (numToDraw.length === 0 || Math.floor(numToDraw) != numToDraw || numToDraw < 0){
    document.querySelector("#warningText").textContent = "Invalid draw value";
    return;
  }
  if (document.querySelector("#seedInput").value.length === 0){
    SEED = generateSeed();
  } else if (SEED === null) {
    SEED = Math.floor(document.querySelector("#seedInput").value);
  }
  if (document.querySelector("#seedInput").disabled === false){
    document.querySelector("#seedInput").value = Math.floor(SEED);
    document.querySelector("#seedInput").disabled = true;
  }
  for (let i = 0; i < numToDraw; i++){
    if  (cardsToChoose.length < 1){
      document.querySelector("#warningText").textContent = "No more cards to draw";
      return;
    }
    const chosenIndex = Math.floor(Mulberry32(SEED) * cardsToChoose.length);
    const cardIndex = cardsToChoose[chosenIndex];
    const newCardZone = document.createElement("div");
    newCardZone.setAttribute("class", "select");

    const newCard = document.createElement("input");
    newCard.type = "checkbox";
    newCard.value = CARD_LIST[cardIndex];
    newCard.id = CARD_LIST[cardIndex];

    const newCardLabel = document.createElement("label");
    newCardLabel.htmlFor = CARD_LIST[cardIndex];
    newCardLabel.textContent = CARD_LIST[cardIndex];

    newCardZone.appendChild(newCard);
    newCardZone.appendChild(newCardLabel);

    document.querySelector("#Cards").appendChild(newCardZone);
    cardsToChoose.splice(chosenIndex, 1);
    SEED = (Mulberry32(SEED)*2**32)>>>0
  }
  localStorage.setItem("DraftSelector-IndexArray", JSON.stringify(cardsToChoose));
  document.querySelector("#warningText").textContent = "";
}


async function copyDeckToClipboard(){
  let clipboard = "";
  const chars = document.querySelector("#Characters").querySelectorAll("input");
  let charFound = false;
  for (let char of chars){
    if (char.checked){
      charFound = true;
      clipboard += char.id + ";\n";
    }
  }
  if (!charFound){
    document.querySelector("#warningText").textContent = "No Character Selected";
    return;
  }
  clipboard += "Drafted Deck;\n";
  clipboard += "LandscapeRedSleeve;\n";
  const cards = document.querySelector("#Cards").querySelectorAll("input");
  let cardCount = 0;
  for (let card of cards){
    if (card.checked){
      cardCount++;
      clipboard += card.id + ",";
    }
  }
  clipboard = clipboard.substring(0, clipboard.length - 1);
  console.log(document.querySelector("#cardCheck").checked)
  if (document.querySelector("#cardCheck").checked && (cardCount < 8 || cardCount > 10)){
    document.querySelector("#warningText").textContent = "Invalid Card Count";
    return;
  }
  await navigator.clipboard.writeText(clipboard);
  document.querySelector("#warningText").textContent = "Deck Copied!";
}


async function copyCardstoClipboard(){
  const cards = document.querySelector("#Cards").querySelectorAll("input");
  clipboard = "";
  for (let card of cards){
    clipboard += card.id + ", ";
  }
  clipboard = clipboard.substring(0, clipboard.length - 2);
  await navigator.clipboard.writeText(clipboard);
  document.querySelector("#warningText").textContent = "Cards Copied!";
}


function resetIndexes(){
  if (CARD_LIST.length < 1){
    return;
  }
  localStorage.setItem("DraftSelector-IndexArray", JSON.stringify([...Array(CARD_LIST.length).keys()]));
  clearCardBox();
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
        reader.onload = async () => { createCharSelects(await createGlobalList(reader.result)) };
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
window.addEventListener("load", setUp);


async function createCharSelects(chars){
  const charArea = document.querySelector("#Characters");
  while (charArea.firstChild){
    charArea.removeChild(charArea.lastChild);
  }
  for (let char of chars){
    const charZone = document.createElement("div");
    charZone.setAttribute("class", "select");

    const input = document.createElement("input");
    input.type = "radio";
    input.id = char;
    input.value = char;
    input.name = "char";
    
    const label = document.createElement("label");
    label.for = char;
    label.textContent = char;

    charZone.appendChild(input);
    charZone.appendChild(label);

    charArea.appendChild(charZone);
  }
}

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