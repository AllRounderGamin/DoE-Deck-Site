async function setUp(){
  let defaultDecks = await fetch("./WeekAltDeckList2.txt");
  defaultDecks = await defaultDecks.text();
  createDeckList(defaultDecks);

  document.querySelector("#copyButton").addEventListener("click", copyDeckToClipboard);
  document.querySelector("#dropZone").addEventListener("drop", fileDropHandler);
  document.querySelector("#dropZone").addEventListener("dragover", (e) => {e.preventDefault();});
  document.querySelector("#resetButton").addEventListener("click", resetIndexes);
  document.querySelector("#generateButton").addEventListener("click", generateDeckSelection);
}


function clearCardBox(){
  const deckBoxes = document.querySelectorAll(".deckBox");
  for (let box of deckBoxes){
    while (box.firstChild){
      box.removeChild(box.lastChild);
    }
  }
}


function generateDeckSelection(){
  clearCardBox();
  if (DECK_LIST.length < 1){
    document.querySelector("#warningText").textContent = "No Decklist Loaded";
    return;;
  }
  let chosenDecks = [];
  let decksToChoose = JSON.parse(localStorage.getItem("DeckSelector-IndexArray"));
  if (decksToChoose.length < 3){
    document.querySelector("#warningText").textContent = "Less than 3 unique decks available, please reset chosen decks or upload a new deck list, then try generating again";
    return;
  }
  for (let i = 0; i < 3; i++){
    let repick = true;
    let skippedDecks = [];
    while (repick){
      let chosenIndex = Math.floor(Math.random() * decksToChoose.length);
      let deckIndex = decksToChoose[chosenIndex];

      let chosenDeck = DECK_LIST[deckIndex];
      if(!checkForDupes(chosenDeck, chosenDecks)){
        chosenDecks.push(DECK_LIST[deckIndex]);
        decksToChoose.splice(chosenIndex, 1);
        repick = false;
      } else {
        if (!skippedDecks.includes(deckIndex)){
          skippedDecks.push(deckIndex);
        } else {
          if (skippedDecks.length >= decksToChoose.length){
            document.querySelector("#warningText").textContent = "No non dupe deck found, please reset decks";
            return;
          }
        }
      }
    }
  }
  const deckBoxes = document.querySelector("#decks").children;
  for (let box of deckBoxes){
    for (let line in chosenDecks[0]){
      const deckLine = document.createElement("p");
      deckLine.textContent = chosenDecks[0][line];
      box.appendChild(deckLine);
    }
    chosenDecks.splice(0, 1);
  }
  localStorage.setItem("DeckSelector-IndexArray", JSON.stringify(decksToChoose));
  document.querySelector("#warningText").textContent = "";
}


function checkForDupes(newDeck, deckList){
  newDeck = newDeck.Cards.split(",").sort();
  for (let deck of deckList){
    deckCards = deck.Cards.split(",").sort();
    if (deckCards.length != newDeck.length){
      continue;
    }
    if (JSON.stringify(deckCards) === JSON.stringify(newDeck)){
      return true;
    }
  }
  return false;
}


async function copyDeckToClipboard(e){
  const decks = document.querySelectorAll(".deckBox");
  let clipboard = "";
  for (let deck of decks){
    for (let line of deck.textContent.split(";")){
      clipboard += line + ";\n";
    }
    clipboard = clipboard.substring(0, clipboard.length - 2);
    clipboard += "\n\n";
  }
  if (clipboard.length === 3){
    document.querySelector("#warningText").textContent = "No Decks To Copy!";
    return;
  }
  await navigator.clipboard.writeText(clipboard);
}


function resetIndexes(){
  if (DECK_LIST.length < 1){
    return;
  }
  localStorage.setItem("DeckSelector-IndexArray", JSON.stringify([...Array(DECK_LIST.length).keys()]));
  clearCardBox();
  document.querySelector("#warningText").textContent = "Chosen Decks Reset";
}


function fileDropHandler(e) {
  e.preventDefault();
  if (e.dataTransfer.files[0]) {
    const fileName = e.dataTransfer.files[0].name.split('.');
    if (fileName[fileName.length - 1] === 'txt') {
      const reader = new FileReader();
      reader.readAsText(e.dataTransfer.files[0]);
      reader.onload = () => { createDeckList(reader.result) };
    }
  }
}


function createDeckList(list){
  // I believe pushing the file to Github removes the \r, if the user tries to add a file copied from google sheets the \r returns
  // Annoyingly just splitting a \n causes the filter to not work and spam the console with error Issue Warnings, so this system is used instead
  const initList = list;
  list = initList.split('\r\n');
  if (list.length === 1){
    list = initList.split("\n");
  }
  /* Deck Rules
    1. The Start and End of a deck has Speech Marks
    2. Ignore Empty Lines (stored as "")
    3. If line does not start with " and ALSO does not end with a ; or " disregard the line (this is usually headings like "Deck 1")
  */
  list = list.filter((line) => {return line.length > 0;});
  let currentDeck = {Character: null, Name: null, Sleeve: null, Cards: null};
  let nextProp = "Character";
  const deckList = [];
  for (let line of list){
    line = line.trim();
    if (line[0] === '"' && line[line.length - 1] === ";"){
      if (nextProp != "Character"){
        console.log("Unexpected new input, starting new deck, previous deck: ", JSON.stringify(currentDeck));
        console.log("ISSUE LINE: ", line, " ISSUE PROP: ", nextProp, "ARRAY LEN: ", deckList.length);
      }
      currentDeck = {Character: line.substring(1), Name: null, Sleeve: null, Cards: null};
      nextProp = "Name";
    }
    else if (line[0] !== '"' && line.substring(line.length - 1) === ";"){
      if (nextProp === "Name"){
        currentDeck.Name = line;
        nextProp = "Sleeve";
      } 
      else if (nextProp === "Sleeve"){
        currentDeck.Sleeve = line;
        nextProp = "Cards";
      }
    }
    else if (line[line.length - 1] === '"' && nextProp === "Cards"){
      currentDeck.Cards = line.substring(0, line.length-1);
      deckList.push({...currentDeck});
      currentDeck = {Character: null, Name: null, Sleeve: null, Cards: null};
      nextProp = "Character";
    }
    else {
      console.log("Unexpected input, abandoning deck, current deck: ", JSON.stringify(currentDeck));
      console.log("ISSUE LINE: ", line, " ISSUE PROP: ", nextProp, "ARRAY LEN: ", deckList.length);
      currentDeck = {Character: null, Name: null, Sleeve: null, Cards: null};
      nextProp = "Character";
    }
  }
  if (deckList.length === 0){
    document.querySelector("#warningText").textContent = "Invalid Document, No decks were found, previous list not overwritten";
    return;
  }
  DECK_LIST = deckList;
  const storage = localStorage.getItem("DeckSelector-IndexArray");
  if (!storage){
    localStorage.setItem("DeckSelector-IndexArray", JSON.stringify([...Array(DECK_LIST.length).keys()]));
  }
  document.querySelector("#warningText").textContent = "Decks Loaded, if loading a different decklist remember to reset removed decks";
}



let DECK_LIST = [];
window.addEventListener("load", setUp);


