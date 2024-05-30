async function setUp(){
  let defaultCards = await fetch("./CardList.txt");
  defaultCards = await defaultCards.text();
  createCardList(defaultCards);

  document.querySelector("#copyDeckButton").addEventListener("click", copyDeckToClipboard);
  document.querySelector("#copyCardsButton").addEventListener("click", copyCardstoClipboard);
  document.querySelector("#dropZone").addEventListener("drop", fileDropHandler);
  document.querySelector("#dropZone").addEventListener("dragover", (e) => {e.preventDefault();});
  document.querySelector("#resetButton").addEventListener("click", resetIndexes);
  document.querySelector("#generateButton").addEventListener("click", drawCard);
}


function clearCardBox(){
  const box = document.querySelector("#Cards");
  while (box.firstChild){
    box.removeChild(box.lastChild);
  }
  document.querySelector("#warningText").textContent = "";
}


function drawCard(){
  let cardsToChoose = JSON.parse(localStorage.getItem("DraftSelector-IndexArray"));
  const numToDraw = document.querySelector("#numberOfCards").value;
  if (!Number.isInteger(+numToDraw)){
    document.querySelector("#warningText").textContent = "Invalid draw value";
    return;
  }
  for (let i = 0; i < numToDraw; i++){
    if  (cardsToChoose.length < 1){
      document.querySelector("#warningText").textContent = "No more cards to draw";
      return;
    }
    const chosenIndex = Math.floor(Math.random() * cardsToChoose.length);
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
  if (cardCount < 8 || cardCount > 10){
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
}


async function fileDropHandler(e) {
  e.preventDefault();
  if (e.dataTransfer.files[0]) {
    const fileName = e.dataTransfer.files[0].name.split('.');
    if (fileName[fileName.length - 1] === 'txt') {
      const reader = new FileReader();
      reader.readAsText(e.dataTransfer.files[0]);
      reader.onload = () => { createCardList(reader.result) };
    }
  }
}


async function createCardList(list){
  const initList = list.splice();
  list = initList.split('\r\n');
  if (list.length === 1){
    list = initList.split("/n");
  }
  list = list.filter((line) => {return line.length > 0;});
  CARD_LIST = list;
  resetIndexes();
  document.querySelector("#warningText").textContent = "Cards Loaded!";
}

let CARD_LIST = [];
window.addEventListener("load", setUp);


