// --- Assets ---
const assets = {
  follower: [
    "assets/follower/follower_bronze.png",
    "assets/follower/follower_silver.png",
    "assets/follower/follower_gold.png",
    "assets/follower/follower_legendary.png",
    "assets/follower/follower_signature.png"
  ],
  spell: [
    "assets/spell/spell_bronze.png",
    "assets/spell/spell_silver.png",
    "assets/spell/spell_gold.png",
    "assets/spell/spell_legendary.png",
    "assets/spell/spell_signature.png"
  ],
  amulet: [
    "assets/amulet/amulet_bronze.png",
    "assets/amulet/amulet_silver.png",
    "assets/amulet/amulet_gold.png",
    "assets/amulet/amulet_legendary.png",
    "assets/amulet/amulet_signature.png"
  ],
  backgrounds: {
    Neutral: "assets/backgrounds/background_Neutral.png",
    Forestcraft: "assets/backgrounds/background_Forestcraft.png",
    Swordcraft: "assets/backgrounds/background_Swordcraft.png",
    Runecraft: "assets/backgrounds/background_Runecraft.png",
    Dragoncraft: "assets/backgrounds/background_Dragoncraft.png",
    Abysscraft: "assets/backgrounds/background_Abysscraft.png",
    Havencraft: "assets/backgrounds/background_Havencraft.png",
    Portalcraft: "assets/backgrounds/background_Portalcraft.png"
  },
  gems: {
    Neutral: "assets/gems/gem_Neutral.png",
    Forestcraft: "assets/gems/gem_Forestcraft.png",
    Swordcraft: "assets/gems/gem_Swordcraft.png",
    Runecraft: "assets/gems/gem_Runecraft.png",
    Dragoncraft: "assets/gems/gem_Dragoncraft.png",
    Abysscraft: "assets/gems/gem_Abysscraft.png",
    Havencraft: "assets/gems/gem_Havencraft.png",
    Portalcraft: "assets/gems/gem_Portalcraft.png"
  },
  boxes: {
    text_box: "assets/boxes/text_box.png",
    text_box_no_bottom: "assets/boxes/text_box_no_bottom.png",
    divider: "assets/boxes/divider.png",
    small_divider: "assets/boxes/small_divider.png",
    evolve: "assets/boxes/box_evolve.png",
    superEvolve: "assets/boxes/box_super_evolve.png",
    crest: "assets/boxes/box_crest.png",
    faith: "assets/boxes/box_faith.png"
  }
};

// --- DOM elements ---
const canvas = document.getElementById("previewCanvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = true; 
ctx.imageSmoothingQuality = "high";

const nameInput = document.getElementById("cardName");
const crestNameInput = document.getElementById("crestName");
const faithNameInput = document.getElementById("faithName");
const traitInput = document.getElementById("cardTrait");
const classSelect = document.getElementById("cardClass");
const typeSelect = document.getElementById("cardType");
const raritySelect = document.getElementById("cardRarity");
const costInput = document.getElementById("costValue");
const attackInput = document.getElementById("attackValue");
const defenseInput = document.getElementById("defenseValue");
const tokenCheckbox = document.getElementById("tokenCheckbox");
const wordCountCheckbox = document.getElementById("wordCountCheckbox");
const autoDividerCheckbox = document.getElementById("autoDividerCheckbox");
const saveCardOnlyCheckbox = document.getElementById("saveCardOnlyCheckbox");
const liveWordCounter = document.getElementById("liveWordCounter");
const textInputs = {
  card: document.getElementById("cardText"),
  evolve: document.getElementById("evolveText"),
  superEvolve: document.getElementById("superEvolveText"),
  crest: document.getElementById("crestText"),
  faith: document.getElementById("faithText")
};

// --- Crest and Faith uploads ---
const crestArtUpload = document.getElementById("crestArtUpload");
const faithArtUpload = document.getElementById("faithArtUpload");

let uploadedArt = null;
let crestArt = null;
let faithArt = null;

// --- Helpers ---
function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

function applySharpen(ctx, w, h, amount) {
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  const copy = new Uint8ClampedArray(data); 

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
       const i = (y * w + x) * 4;
       const up = ((y - 1) * w + x) * 4;
       const down = ((y + 1) * w + x) * 4;
       const left = (y * w + (x - 1)) * 4;
       const right = (y * w + (x + 1)) * 4;

       for (let c = 0; c < 3; c++) { 
         const edge = 4 * copy[i + c] - copy[up + c] - copy[down + c] - copy[left + c] - copy[right + c];
         data[i + c] = copy[i + c] + amount * edge;
       }
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

function drawScaledNumber(text, x, y, maxFontSize, maxWidth, fontFace, letterSpacing = 0, yNudgeCoefficient) {
  ctx.textAlign = "center";
  ctx.letterSpacing = `${letterSpacing}px`;
  let fontSize = maxFontSize;
  ctx.font = `${fontSize}px '${fontFace}'`;
  let textWidth = ctx.measureText(text).width;
  while (textWidth > maxWidth && fontSize > 10) {
    fontSize -= 2;
    ctx.font = `${fontSize}px '${fontFace}'`;
    textWidth = ctx.measureText(text).width;
  }
  const yNudge = (maxFontSize - fontSize) * yNudgeCoefficient;
  ctx.fillText(text, x, y + yNudge);
  ctx.letterSpacing = "0px";
}

function calculateTotalWordCount() {
  const allText = Object.values(textInputs).map(t => t.value).join(" ");
  const initialTokens = allText.split(/\s+/);
  let wordCount = 0;
  for (const token of initialTokens) {
    if (token.length === 0 || token === "----------") continue;
    const hyphenatedParts = token.split('-').filter(p => p.length > 0);
    wordCount += hyphenatedParts.length;
  }
  return wordCount;
}

function updateLiveWordCount() {
  if (!liveWordCounter) return; 
  if (wordCountCheckbox.checked) {
    const wordCount = calculateTotalWordCount();
    liveWordCounter.textContent = `(${wordCount} ${wordCount === 1 ? 'word' : 'words'})`;
    liveWordCounter.style.display = "inline"; 
  } else {
    liveWordCounter.style.display = "none"; 
  }
}

const imageCache = {};
async function getImage(src) {
  if (imageCache[src]) return imageCache[src];
  const img = await loadImage(src);
  imageCache[src] = img;
  return img;
}

Object.values(textInputs).forEach((textarea) => {
  textarea.addEventListener("input", () => {
    if (autoDividerCheckbox.checked) {
      const cursorPos = textarea.selectionStart;
      const value = textarea.value;
      const before = value.slice(0, cursorPos);
      const after = value.slice(cursorPos);
      if (before.endsWith("\n\n")) {
        const newValue = before.slice(0, -1) + "----------\n" + after;
        textarea.value = newValue;
        textarea.selectionStart = textarea.selectionEnd = cursorPos + 10;
      }
    }
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight) + 'px';
    updateLiveWordCount();
  });
});

wordCountCheckbox.addEventListener("change", updateLiveWordCount);
saveCardOnlyCheckbox.addEventListener("change", () => drawCard());

const HIGHLIGHT_KEYWORDS = [
  "Fanfare","Last Words","Engage","Strike","Storm","Ambush","Bane","Drain","Ward","Rush","Overflow",
  "On Spellboost","Clash","Mode","Intimidate","Aura","Barrier","Fuse","Fused","Necromancy","Combo",
  "Earth Rite","Rally","Countdown","Reanimate","Earth Sigil","Crystallize","Crystallized","Invoke",
  "Invoked","Sanguine","Skybound Art","Super Skybound Art","Maneuver","Maneuverable","Maneuvering",
  "Enhance","Union Burst","Accelerate","Burial Rite"
];
const HIGHLIGHT_REGEX = new RegExp(`\\b(${HIGHLIGHT_KEYWORDS.join("|")})\\b`, "g");

function drawStretchBox(img, x, y, stretchCount = 0, key = "") {
  const stretchPerBreak = 50;
  const stretchAmount = stretchCount * stretchPerBreak;
  let topHeight = 40, bottomHeight = 40;
  let middleStartY = topHeight;
  let middleHeight = img.height - topHeight - bottomHeight;
  if (key === "crest" || key === "faith") {
    topHeight = 107; middleStartY = 107; middleHeight = 38; bottomHeight = 28;
  } else if (key === "main") {
    topHeight = 60; bottomHeight = 120; middleStartY = topHeight; middleHeight = img.height - topHeight - bottomHeight;
  }
  ctx.drawImage(img, 0, 0, img.width, topHeight, x, y, img.width, topHeight);
  ctx.drawImage(img, 0, middleStartY, img.width, middleHeight, x, y + middleStartY, img.width, middleHeight + stretchAmount);
  ctx.drawImage(img, 0, img.height - bottomHeight, img.width, bottomHeight, x, y + middleStartY + middleHeight + stretchAmount, img.width, bottomHeight);
  return topHeight + middleHeight + bottomHeight + stretchAmount;
}

async function calculateTextBlockHeight(key) {
  const textValue = textInputs[key].value.trim();
  if (!textValue) return 0;
  const isSpecialBox = (key !== "card");
  const specialLineHeightBefore = 30, specialLineHeightAfter = 20;
  const cardLineHeightBefore = 30, cardLineHeightAfter = 40;
  const textStartX = 769 + 30, wrapLimitX = 1716, lineHeight = 50, baseFont = "33px 'Memento'";
  
  let processedText = textValue.replace(HIGHLIGHT_REGEX, "<K>$&</K>");
  if (key === "evolve" && processedText.startsWith("Evolve")) processedText = processedText.replace(/^Evolve/, "<K>Evolve</K>");
  if (key === "superEvolve" && processedText.startsWith("Super-Evolve")) processedText = processedText.replace(/^Super-Evolve/, "<K>Super-Evolve</K>");
  
  const tokenizerRegex = /(\*\*|_|<c>|<\/c>|<K>|<\/K>|----------|\n|\s+)/g;
  const allTokens = processedText.split(tokenizerRegex).filter(Boolean);
  let totalHeight = lineHeight, currentX = textStartX;
  let dryStyle = { bold: false, italic: false, isKeyword: false };
  let dryLastTokenWasDivider = false;

  const setDryFont = () => {
    const weight = dryStyle.bold || dryStyle.isKeyword ? "bold " : "";
    const style = dryStyle.italic ? "italic " : "";
    ctx.font = `${weight}${style}${baseFont}`;
  };

  for (const token of allTokens) {
    if (token === "**") { dryStyle.bold = !dryStyle.bold; continue; }
    if (token === "_") { dryStyle.italic = !dryStyle.italic; continue; }
    if (token === "<K>") { dryStyle.isKeyword = true; continue; }
    if (token === "</K>") { dryStyle.isKeyword = false; continue; }
    if (["<c>", "</c>"].includes(token)) continue;
    if (token === "\n") {
      totalHeight += dryLastTokenWasDivider ? (isSpecialBox ? specialLineHeightAfter : cardLineHeightAfter) : lineHeight;
      currentX = textStartX; dryLastTokenWasDivider = false; continue;
    }
    if (token.trim() === "----------") {
      if (currentX > textStartX) totalHeight += isSpecialBox ? specialLineHeightBefore : cardLineHeightBefore;
      currentX = textStartX; dryLastTokenWasDivider = true; continue;
    }
    dryLastTokenWasDivider = false;
    setDryFont();
    const tokenWidth = ctx.measureText(token).width;
    if (currentX > textStartX && currentX + tokenWidth > wrapLimitX && token.trim() !== "") {
      totalHeight += lineHeight; currentX = textStartX;
    }
    if (currentX === textStartX && token.trim() === "") continue;
    currentX += tokenWidth;
    if (dryStyle.italic) currentX += 3;
  }
  
  const boxImg = assets.boxes[key === "card" ? null : key] ? await getImage(assets.boxes[key]) : null;
  let boxHeight = 0;
  if (boxImg) {
      const topHeight = (key === "crest" || key === "faith") ? 107 : 40;
      const bottomHeight = (key === "crest" || key === "faith") ? 28 : 40;
      const middleHeight = boxImg.height - topHeight - bottomHeight;
      const stretchAmount = Math.max(0, (totalHeight / lineHeight) - 1) * 50;
      boxHeight = topHeight + middleHeight + bottomHeight + stretchAmount;
  }
  return Math.max(boxHeight, totalHeight + 40);
}

async function drawTextBlock(key, box, x, startY) {
  const textValue = textInputs[key].value.trim();
  if (!textValue) return 0;
  const isSpecialBox = (key !== "card");
  const specialLineHeightBefore = 30, specialLineHeightAfter = 20, specialDividerYOffset = 25;
  const cardLineHeightBefore = 30, cardLineHeightAfter = 40, cardDividerYOffset = 15;
  
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0;
  const textStartX = x + 30, wrapLimitX = 1716, lineHeight = 50, baseFont = "33px 'Memento'";
  
  let processedText = textValue.replace(HIGHLIGHT_REGEX, "<K>$&</K>");
  if (key === "evolve" && processedText.startsWith("Evolve")) processedText = processedText.replace(/^Evolve/, "<K>Evolve</K>");
  if (key === "superEvolve" && processedText.startsWith("Super-Evolve")) processedText = processedText.replace(/^Super-Evolve/, "<K>Super-Evolve</K>");

  const tokenizerRegex = /(\*\*|_|<c>|<\/c>|<K>|<\/K>|----------|\n|\s+)/g;
  const allTokens = processedText.split(tokenizerRegex).filter(Boolean);

  let totalHeight = lineHeight, currentX = textStartX;
  let dryStyle = { bold: false, italic: false, isKeyword: false };
  let dryLastTokenWasDivider = false;

  const setDryFont = () => {
    const weight = dryStyle.bold || dryStyle.isKeyword ? "bold " : "";
    const style = dryStyle.italic ? "italic " : "";
    ctx.font = `${weight}${style}${baseFont}`;
  };

  for (const token of allTokens) {
    if (token === "**") { dryStyle.bold = !dryStyle.bold; continue; }
    if (token === "_") { dryStyle.italic = !dryStyle.italic; continue; }
    if (token === "<K>") { dryStyle.isKeyword = true; continue; }
    if (token === "</K>") { dryStyle.isKeyword = false; continue; }
    if (["<c>", "</c>"].includes(token)) continue;
    if (token === "\n") {
      totalHeight += dryLastTokenWasDivider ? (isSpecialBox ? specialLineHeightAfter : cardLineHeightAfter) : lineHeight;
      currentX = textStartX; dryLastTokenWasDivider = false; continue;
    }
    if (token.trim() === "----------") {
      if (currentX > textStartX) totalHeight += isSpecialBox ? specialLineHeightBefore : cardLineHeightBefore;
      currentX = textStartX; dryLastTokenWasDivider = true; continue;
    }
    dryLastTokenWasDivider = false;
    setDryFont();
    const tokenWidth = ctx.measureText(token).width;
    if (currentX > textStartX && currentX + tokenWidth > wrapLimitX && token.trim() !== "") {
      totalHeight += lineHeight; currentX = textStartX;
    }
    if (currentX === textStartX && token.trim() === "") continue;
    currentX += tokenWidth;
    if (dryStyle.italic) currentX += 3;
  }

  const boxImg = box ? await getImage(assets.boxes[box]) : null;
  const stretchCount = Math.max(0, (totalHeight / lineHeight) - 1);
  const boxHeight = boxImg ? drawStretchBox(boxImg, x, startY, stretchCount, key) : 0;

  ctx.textAlign = "left"; ctx.shadowColor = "black"; ctx.shadowBlur = 4;
  let xPos = textStartX;
  let textY = startY + 50 + (key === "crest" || key === "faith" ? 90 : 0);
  let wetStyle = { bold: false, italic: false, color: null, isKeyword: false };
  let lastTokenWasDivider = false;

  const setWetStyle = () => {
    const weight = wetStyle.bold || wetStyle.isKeyword ? "bold " : "";
    const style = wetStyle.italic ? "italic " : "";
    ctx.font = `${weight}${style}${baseFont}`;
    ctx.fillStyle = wetStyle.color || (wetStyle.isKeyword ? "#f3d87d" : "#efeee9");
  };

  const dividerToUse = await getImage(assets.boxes[key === "card" ? "divider" : "small_divider"]);

  for (const token of allTokens) {
    if (token === "**") { wetStyle.bold = !wetStyle.bold; continue; }
    if (token === "_") { wetStyle.italic = !wetStyle.italic; continue; }
    if (token === "<c>") { wetStyle.color = "#f3d87d"; continue; }
    if (token === "</c>") { wetStyle.color = null; continue; }
    if (token === "<K>") { wetStyle.isKeyword = true; continue; }
    if (token === "</K>") { wetStyle.isKeyword = false; continue; }
    if (token === "\n") {
      textY += lastTokenWasDivider ? (isSpecialBox ? specialLineHeightAfter : cardLineHeightAfter) : lineHeight;
      xPos = textStartX; lastTokenWasDivider = false; continue;
    }
    if (token.trim() === "----------") {
      if (xPos > textStartX) textY += isSpecialBox ? specialLineHeightBefore : cardLineHeightBefore;
      const yOffset = isSpecialBox ? specialDividerYOffset : cardDividerYOffset;
      ctx.drawImage(dividerToUse, x, textY - yOffset);
      xPos = textStartX; lastTokenWasDivider = true; continue;
    }
    lastTokenWasDivider = false;
    setWetStyle();
    const tokenWidth = ctx.measureText(token).width;
    if (xPos > textStartX && xPos + tokenWidth > wrapLimitX && token.trim() !== "") {
      textY += lineHeight; xPos = textStartX;
    }
    if (xPos === textStartX && token.trim() === "") continue;
    ctx.fillText(token, xPos, textY);
    xPos += tokenWidth;
  }
  return Math.max(boxHeight, textY - startY + 40);
}

// --- drawCard ---
async function drawCard() {
  const textOrder = [{ key: "card", box: null }, { key: "evolve", box: "evolve" }, { key: "superEvolve", box: "superEvolve" }, { key: "crest", box: "crest" }, { key: "faith", box: "faith" }];
  const boxX = 768, startY = 246;
  const currentCardType = typeSelect.value.toLowerCase();
  const isFollower = (currentCardType === 'follower');
  const saveCardOnly = saveCardOnlyCheckbox.checked; 

  let stretchPixels = 0;
  if (!saveCardOnly) {
      let calculatedTotalY = startY;
      for (const { key } of textOrder) {
          const textValue = textInputs[key].value.trim();
          if (!textValue) continue; 
          const isEvolveBlock = (key === 'evolve' || key === 'superEvolve');
          if (isEvolveBlock && !isFollower) continue;
          const blockHeight = await calculateTextBlockHeight(key); 
          calculatedTotalY += blockHeight - 10;
      }
      const illustrator = document.getElementById("illustratorName").value.trim();
      const showBottomBar = wordCountCheckbox.checked || illustrator;
      const stretchThreshold = showBottomBar ? 825 : 900;
      stretchPixels = Math.max(0, calculatedTotalY - stretchThreshold);
  }

  const stretchCount = stretchPixels / 50;
  const boxAsset = (wordCountCheckbox.checked || document.getElementById("illustratorName").value.trim()) ? assets.boxes.text_box : assets.boxes.text_box_no_bottom;
  const mainBoxImg = await getImage(boxAsset);
  
  const baseHeight = 1080, baseWidth = 1920;
  const newWidth = saveCardOnly ? 729 : baseWidth;
  const newHeight = saveCardOnly ? 882 : (baseHeight + stretchPixels);

  if (canvas.height !== newHeight) canvas.height = newHeight;
  if (canvas.width !== newWidth) canvas.width = newWidth;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
  
  ctx.save();
  if (saveCardOnly) ctx.translate(-48, -153);

  if (!saveCardOnly) {
      const bg = await getImage(assets.backgrounds[classSelect.value]);
      const slicePointY = 1000;
      const topHeight = Math.min(slicePointY, bg.height);
      const bottomPartHeight = bg.height - topHeight;
      ctx.drawImage(bg, 0, 0, bg.width, topHeight, 0, 0, bg.width, topHeight);
      if (bottomPartHeight > 0) ctx.drawImage(bg, 0, topHeight, bg.width, bottomPartHeight, 0, topHeight, bg.width, bottomPartHeight + stretchPixels);
  }

  const [gem, frame] = await Promise.all([
    getImage(assets.gems[classSelect.value]),
    getImage(assets[typeSelect.value.toLowerCase()][["bronze", "silver", "gold", "legendary", "signature"].indexOf(raritySelect.value.toLowerCase())])
  ]);

  if (uploadedArt) {
    const s = previewState.main;
    const dWidth = uploadedArt.width * s.scale, dHeight = uploadedArt.height * s.scale;
    const bmp = await createImageBitmap(uploadedArt, 0, 0, uploadedArt.width, uploadedArt.height, { resizeWidth: Math.round(dWidth), resizeHeight: Math.round(dHeight), resizeQuality: "high" });
    ctx.save();
    ctx.beginPath(); ctx.rect(MAIN_ART_X, MAIN_ART_Y, MAIN_MASK_W, MAIN_MASK_H); ctx.closePath(); ctx.clip();
    ctx.drawImage(bmp, MAIN_ART_X + s.tx, MAIN_ART_Y + s.ty);
    ctx.restore();
    bmp.close();
  }

  ctx.drawImage(gem, 398, 863);
  ctx.drawImage(frame, 48, 153);

  if (!saveCardOnly) {
      const textBoxX = 722, textBoxY = 206;
      const dynamicBoxWidth = mainBoxImg.width, dynamicBoxHeight = mainBoxImg.height + stretchPixels; 
      const offCanvas = document.createElement("canvas");
      offCanvas.width = dynamicBoxWidth; offCanvas.height = dynamicBoxHeight;
      const offCtx = offCanvas.getContext("2d");
      offCtx.drawImage(canvas, textBoxX, textBoxY, dynamicBoxWidth, dynamicBoxHeight, 0, 0, dynamicBoxWidth, dynamicBoxHeight);
      offCtx.filter = "blur(5px)"; offCtx.drawImage(offCanvas, 0, 0);
      ctx.drawImage(offCanvas, textBoxX, textBoxY);

      drawStretchBox(mainBoxImg, textBoxX, textBoxY, stretchCount, "main");
      
      let currentY = startY;
      for (const { key, box } of textOrder) {
        const textValue = textInputs[key].value.trim();
        if (!textValue) continue; 
        const isEvolveBlock = (key === 'evolve' || key === 'superEvolve');
        if (isEvolveBlock && !isFollower) continue;
        const blockHeight = await drawTextBlock(key, box, boxX, currentY);
        
        const isCrest = key === "crest", isFaith = key === "faith";
        if (isCrest || isFaith) {
          const iconX = boxX + 120, iconY = currentY + 32;
          const iconImg = isCrest ? crestArt : faithArt;
          const nameField = document.getElementById(isCrest ? "crestName" : "faithName");
          const nameValue = nameField ? nameField.value.trim() : "";

          if (iconImg) {
            const s = previewState[isCrest ? "crest" : "faith"];
            const dWidth = iconImg.width * s.scale, dHeight = iconImg.height * s.scale;
            const bmp = await createImageBitmap(iconImg, 0, 0, iconImg.width, iconImg.height, { resizeWidth: Math.round(dWidth), resizeHeight: Math.round(dHeight), resizeQuality: "high" });
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = Math.round(dWidth); tempCanvas.height = Math.round(dHeight);
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(bmp, 0, 0);
            applySharpen(tempCtx, tempCanvas.width, tempCanvas.height, 0.25);
            ctx.save(); ctx.beginPath(); ctx.arc(iconX + ICON_W / 2, iconY + ICON_H / 2, ICON_W / 2, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
            ctx.drawImage(tempCanvas, iconX + s.tx, iconY + s.ty); ctx.restore(); bmp.close();
          }
          const defaultName = isCrest ? "Crest" : "Faith";
          const displayName = nameValue || defaultName;
          if (displayName) {
            ctx.save(); ctx.font = "33px 'Memento'"; ctx.fillStyle = "#f3d87d"; ctx.textAlign = "left"; ctx.shadowColor = "black"; ctx.shadowBlur = 4;
            ctx.fillText(displayName, iconX + ICON_W + 17, iconY + ICON_H / 2 + 10); ctx.restore();
          }
        }
        currentY += blockHeight - 10;
      }
  }

  ctx.shadowColor = "black"; ctx.shadowBlur = 6; ctx.fillStyle = "#efeee9";
  const nameText = nameInput.value.trim() || "Unnamed Card";

  if (!saveCardOnly) {
    ctx.font = "56px 'Memento'"; ctx.textAlign = "left"; ctx.fillText(nameText, 163, 150);
    ctx.font = "33px 'Memento'"; ctx.textAlign = "left"; ctx.fillText(traitInput.value.trim() || "—", 1306, 147);
  }

  let secondaryFontSize = 42;
  ctx.font = `${secondaryFontSize}px 'Memento'`;
  let textWidth = ctx.measureText(nameText).width;
  while (textWidth > 363 && secondaryFontSize > 2) {
    secondaryFontSize -= 2; ctx.font = `${secondaryFontSize}px 'Memento'`; textWidth = ctx.measureText(nameText).width;
  }
  ctx.textAlign = "center"; ctx.fillText(nameText, 455, 331 + (-0.75 * (42 - secondaryFontSize)/2)); // Approx center nudge

  const numberFont = 'Sv_numbers', numberSpacing = -5;
  drawScaledNumber(costInput.value, 197, 335, 80, 95, numberFont, numberSpacing, -0.2);
  if (typeSelect.value === "Follower") {
    drawScaledNumber(attackInput.value, 201, 922, 82, 90, numberFont, numberSpacing, -0.2);
    drawScaledNumber(defenseInput.value, 642, 917, 82, 90, numberFont, numberSpacing, -0.2);
  }
  ctx.letterSpacing = "0px";

  if (!saveCardOnly) {
      if (tokenCheckbox.checked) {
        ctx.font = "28px 'NotoSans'"; ctx.textAlign = "right"; ctx.fillText("*This is a token card.", 1788, canvas.height - 55);
      }
      const dynamicBottomBarY = 911 + stretchPixels;
      const illustrator = document.getElementById("illustratorName").value.trim();
      if (illustrator) {
        ctx.font = "28px 'NotoSans'"; ctx.textAlign = "left"; ctx.fillText(`Illustrator: ${illustrator}`, 790, dynamicBottomBarY);
      }
      if (wordCountCheckbox.checked) {
        ctx.font = "28px 'NotoSans'"; ctx.textAlign = "right"; ctx.fillText(`Word count: ${calculateTotalWordCount()}`, 1730, dynamicBottomBarY);
      }
  }
  ctx.restore(); ctx.shadowColor = "transparent"; ctx.shadowBlur = 0;
}

// --- Preview Logic ---
const MAIN_MASK_W = 450, MAIN_MASK_H = 560, MAIN_ART_X = 200, MAIN_ART_Y = 350, ICON_W = 56, ICON_H = 57;
let artX = MAIN_ART_X, artY = MAIN_ART_Y, artW = MAIN_MASK_W, artH = MAIN_MASK_H;
const ICON_SCALE = 5;

const mainPreviewCanvas = document.getElementById("mainPreviewCanvas");
const mainPreviewCtx = mainPreviewCanvas ? mainPreviewCanvas.getContext("2d") : null;
const mainZoomSlider = document.getElementById("mainZoomSlider");
const crestPreviewCanvas = document.getElementById("crestPreviewCanvas");
const crestPreviewCtx = crestPreviewCanvas ? crestPreviewCanvas.getContext("2d") : null;
const crestZoomSlider = document.getElementById("crestZoomSlider");
const faithPreviewCanvas = document.getElementById("faithPreviewCanvas");
const faithPreviewCtx = faithPreviewCanvas ? faithPreviewCanvas.getContext("2d") : null;
const faithZoomSlider = document.getElementById("faithZoomSlider");

if (crestPreviewCtx) crestPreviewCtx.scale(ICON_SCALE, ICON_SCALE);
if (faithPreviewCtx) faithPreviewCtx.scale(ICON_SCALE, ICON_SCALE);

const previewState = {
  main: { img: null, scale: 1, tx: 0, ty: 0, maskW: MAIN_MASK_W, maskH: MAIN_MASK_H, minScale: 1 },
  crest: { img: null, scale: 1, tx: 0, ty: 0, maskW: ICON_W, maskH: ICON_H, minScale: 1 },
  faith: { img: null, scale: 1, tx: 0, ty: 0, maskW: ICON_W, maskH: ICON_H, minScale: 1 }
};

function loadImageFromFile(file) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); res(img); };
    img.onerror = e => { URL.revokeObjectURL(url); rej(e); };
    img.src = url;
  });
}

function fitImageToMask(img, s) {
  const scale = Math.max(s.maskW / img.width, s.maskH / img.height);
  s.scale = scale; s.minScale = scale; 
  s.tx = (s.maskW - img.width * scale) / 2; s.ty = (s.maskH - img.height * scale) / 2;
}

function clampPan(s) {
  if (!s.img) return;
  const imgW = s.img.width * s.scale, imgH = s.img.height * s.scale;
  if (imgW <= s.maskW) s.tx = (s.maskW - imgW) / 2;
  else { const minX = s.maskW - imgW; if (s.tx < minX) s.tx = minX; if (s.tx > 0) s.tx = 0; }
  if (imgH <= s.maskH) s.ty = (s.maskH - imgH) / 2;
  else { const minY = s.maskH - imgH; if (s.ty < minY) s.ty = minY; if (s.ty > 0) s.ty = 0; }
}

function drawPreviewCanvas(ctx, canvasEl, s, shape) {
  if (!ctx || !canvasEl) return;
  const { img, scale, tx, ty, maskW, maskH } = s;
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
  ctx.fillStyle = "rgba(20,20,20,0.95)"; ctx.fillRect(0, 0, canvasEl.width, canvasEl.height); 
  const renderScale = canvasEl.width / maskW;
  
  if (!img) {
    ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 1/renderScale;
    if (shape === "circle") { ctx.beginPath(); ctx.arc(maskW / 2, maskH / 2, Math.min(maskW, maskH) / 2 - 1, 0, Math.PI * 2); ctx.stroke(); } 
    else ctx.strokeRect(0.5, 0.5, maskW - 1, maskH - 1);
    return;
  }

  ctx.save();
  if (shape === "circle") { ctx.beginPath(); ctx.arc(maskW / 2, maskH / 2, Math.min(maskW, maskH) / 2, 0, Math.PI * 2); ctx.closePath(); ctx.clip(); } 
  else { ctx.beginPath(); ctx.rect(0, 0, maskW, maskH); ctx.closePath(); ctx.clip(); }
  ctx.drawImage(img, tx, ty, img.width * scale, img.height * scale);
  ctx.restore();
}

function updateAll() {
  clampPan(previewState.main); clampPan(previewState.crest); clampPan(previewState.faith);
  if (previewState.main.img) uploadedArt = previewState.main.img;
  if (previewState.crest.img) crestArt = previewState.crest.img; else crestArt = null;
  if (previewState.faith.img) faithArt = previewState.faith.img; else faithArt = null;
  drawPreviewCanvas(mainPreviewCtx, mainPreviewCanvas, previewState.main, "rect");
  drawPreviewCanvas(crestPreviewCtx, crestPreviewCanvas, previewState.crest, "circle");
  drawPreviewCanvas(faithPreviewCtx, faithPreviewCanvas, previewState.faith, "circle");
}

document.getElementById("artUpload").addEventListener("change", async (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  document.getElementById("mainArtPreviewTitle").textContent = file.name;
  const img = await loadImageFromFile(file);
  previewState.main.img = img; fitImageToMask(img, previewState.main);
  mainZoomSlider.min = previewState.main.minScale; mainZoomSlider.max = previewState.main.minScale * 5; mainZoomSlider.value = previewState.main.scale; mainZoomSlider.step = (mainZoomSlider.max - mainZoomSlider.min)/100;
  updateAll();
});
crestArtUpload.addEventListener("change", async (e) => {
  const file = e.target.files && e.target.files[0]; if (!file) return;
  const img = await loadImageFromFile(file);
  previewState.crest.img = img; fitImageToMask(img, previewState.crest);
  crestZoomSlider.min = previewState.crest.minScale; crestZoomSlider.max = previewState.crest.minScale * 8; crestZoomSlider.value = previewState.crest.scale; crestZoomSlider.step = (crestZoomSlider.max - crestZoomSlider.min)/100;
  updateAll();
});
faithArtUpload.addEventListener("change", async (e) => {
  const file = e.target.files && e.target.files[0]; if (!file) return;
  const img = await loadImageFromFile(file);
  previewState.faith.img = img; fitImageToMask(img, previewState.faith);
  faithZoomSlider.min = previewState.faith.minScale; faithZoomSlider.max = previewState.faith.minScale * 8; faithZoomSlider.value = previewState.faith.scale; faithZoomSlider.step = (faithZoomSlider.max - faithZoomSlider.min)/100;
  updateAll();
});

function attachPanAndZoom(canvasEl, state, sliderEl) {
  if (!canvasEl) return;
  let dragging = false, lastX = 0, lastY = 0;
  const getEventPos = (e) => { const rect = canvasEl.getBoundingClientRect(); return { x: (e.touches ? e.touches[0].clientX : e.clientX) - rect.left, y: (e.touches ? e.touches[0].clientY : e.clientY) - rect.top }; };
  
  canvasEl.addEventListener("pointerdown", (e) => { if (!state.img) return; dragging = true; const p = getEventPos(e); lastX = p.x; lastY = p.y; canvasEl.setPointerCapture(e.pointerId); });
  canvasEl.addEventListener("pointermove", (e) => {
    if (!dragging || !state.img) return;
    const rect = canvasEl.getBoundingClientRect(); const scaleX = state.maskW / rect.width;
    const p = getEventPos(e);
    state.tx += (p.x - lastX) * scaleX; state.ty += (p.y - lastY) * scaleX;
    lastX = p.x; lastY = p.y; clampPan(state); updateAll();
  });
  canvasEl.addEventListener("pointerup", () => dragging = false);
  canvasEl.addEventListener("pointerleave", () => dragging = false);
  
  if (sliderEl) sliderEl.addEventListener("input", (ev) => {
    if (!state.img) return;
    const newScale = parseFloat(ev.target.value); const oldScale = state.scale;
    const cx = state.maskW / 2, cy = state.maskH / 2;
    state.tx = cx - (cx - state.tx) / oldScale * newScale; state.ty = cy - (cy - state.ty) / oldScale * newScale;
    state.scale = newScale; clampPan(state); updateAll();
  });
}
attachPanAndZoom(mainPreviewCanvas, previewState.main, mainZoomSlider);
attachPanAndZoom(crestPreviewCanvas, previewState.crest, crestZoomSlider);
attachPanAndZoom(faithPreviewCanvas, previewState.faith, faithZoomSlider);

document.querySelectorAll(".text-toolbar button").forEach((button) => {
  button.addEventListener("click", (e) => {
    e.preventDefault();
    const format = button.dataset.format;
    const textarea = button.closest(".field").querySelector("textarea");
    if (!textarea) return;
    const start = textarea.selectionStart, end = textarea.selectionEnd, value = textarea.value;
    const selected = value.slice(start, end);
    let open = "", close = "";
    if (format === "bold") { open = "**"; close = "**"; } else if (format === "italic") { open = "_"; close = "_"; } else if (format === "color") { open = "<c>"; close = "</c>"; } else if (format === "all") { open = "**_<c>"; close = "</c>_**"; }
    textarea.value = value.slice(0, start) + open + selected + close + value.slice(end);
    textarea.dispatchEvent(new Event("input"));
  });
});

document.fonts.ready.then(() => { setTimeout(() => { updateAll(); updateLiveWordCount(); renderWorkshopGrid(); }, 60); });

document.getElementById("previewBtn").addEventListener("click", async () => {
  const btn = document.getElementById("previewBtn"); const originalText = btn.textContent;
  btn.textContent = "Loading..."; btn.disabled = true;
  try {
    await document.fonts.ready; await Promise.all([document.fonts.load("60px 'Memento'"), document.fonts.load("60px 'Sv_numbers'"), document.fonts.load("30px 'NotoSans'")]);
    await drawCard(); 
    const dataUrl = canvas.toDataURL("image/png", 1.0);
    const win = window.open("");
    if (win) { win.document.body.style.margin = "0"; win.document.body.style.backgroundColor = "#222"; win.document.body.innerHTML = `<img src="${dataUrl}" style="max-width: 100%; height: auto; display: block; margin: auto;">`; }
  } catch (err) { console.error(err); alert("Error generating preview."); } finally { btn.textContent = originalText; btn.disabled = false; }
});

// =========================================
// --- CAROUSEL NAVIGATION ---
// =========================================
function navigateTo(page) {
  const track = document.getElementById("app-carousel");
  const viewport = document.getElementById("app-viewport");
  if (page === 'balance') track.style.transform = "translateX(0%)";
  else if (page === 'home') track.style.transform = "translateX(-33.3333%)";
  else if (page === 'workshop') track.style.transform = "translateX(-66.6666%)";
  if (viewport) viewport.scrollTo({ top: 0, behavior: 'smooth' });
}

// =========================================
// --- WORKSHOP & STORAGE ---
// =========================================
const STORAGE_KEY = 'sv_workshop_cards';

function getSavedCards() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveCardsToStorage(cards) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cards)); }
    catch (e) { console.error(e); alert("Failed to save to Workshop. Storage full."); }
}

function formatDetailsText(text) {
  if (!text) return "";
  let formatted = text.replace(HIGHLIGHT_REGEX, '<span class="details-keyword">$1</span>');
  formatted = formatted.replace(/----------/g, '<hr class="details-divider" style="margin: 10px 0; opacity: 0.2;">');
  formatted = formatted.replace(/<c>(.*?)<\/c>/g, '<span style="color: #f3d87d;">$1</span>');
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  formatted = formatted.replace(/_(.*?)_/g, '<i>$1</i>');
  return formatted;
}

// --- Modified Download ---
document.getElementById("downloadBtn").addEventListener("click", async () => { 
  const btn = document.getElementById("downloadBtn"); const originalText = btn.textContent;
  btn.textContent = "Processing..."; btn.disabled = true;

  try {
    await document.fonts.ready;
    await Promise.all([document.fonts.load("60px 'Memento'"), document.fonts.load("60px 'Sv_numbers'"), document.fonts.load("30px 'NotoSans'")]);
    await drawCard(); 

    const dataUrl = canvas.toDataURL("image/png", 0.8);
    
    const newCardData = {
        id: Date.now(),
        image: dataUrl,
        name: nameInput.value.trim() || "Unnamed Card",
        trait: traitInput.value.trim() || "-",
        class: classSelect.value,
        type: typeSelect.value,
        rarity: raritySelect.value,
        cost: costInput.value,
        attack: attackInput.value,
        defense: defenseInput.value,
        textRaw: {
            card: textInputs.card.value,
            evolve: textInputs.evolve.value,
            superEvolve: textInputs.superEvolve.value
        }
    };

    const currentCards = getSavedCards();
    currentCards.unshift(newCardData); 
    saveCardsToStorage(currentCards);
    renderWorkshopGrid();

    const link = document.createElement("a");
    link.download = `${newCardData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
    link.href = dataUrl; 
    link.click();
    
  } catch (err) { console.error(err); alert("Error saving card."); } finally { btn.textContent = originalText; btn.disabled = false; }
});

const workshopGrid = document.getElementById('workshopGrid');
const emptyMsg = document.getElementById('emptyWorkshopMsg');
const detailsPlaceholder = document.getElementById('detailsPlaceholder');
const detailsContent = document.getElementById('detailsContent');
const detailElements = {
    name: document.getElementById('detailName'),
    trait: document.getElementById('detailTraitValue'),
    class: document.getElementById('detailClassValue'),
    image: document.getElementById('detailMainImage'),
    cost: document.getElementById('detailCost'),
    statsRow: document.getElementById('detailStatsRow'),
    atk: document.getElementById('detailAtk'),
    def: document.getElementById('detailDef'),
    textBlock: document.getElementById('detailCardTextBlock'),
    evolveSection: document.getElementById('detailEvolveSection'),
    evolveText: document.getElementById('detailEvolveTextBlock'),
    superEvolveSection: document.getElementById('detailSuperEvolveSection'),
    superEvolveText: document.getElementById('detailSuperEvolveTextBlock')
};

function renderWorkshopGrid() {
  const cards = getSavedCards();
  const existingThumbnails = workshopGrid.querySelectorAll('.grid-thumbnail');
  existingThumbnails.forEach(el => el.remove());

  if (cards.length === 0) {
    emptyMsg.style.display = 'block'; resetDetailsPanel(); return;
  }
  emptyMsg.style.display = 'none';

  cards.forEach(cardObj => {
      const img = document.createElement('img');
      img.src = cardObj.image; img.alt = cardObj.name; img.className = 'grid-thumbnail';
      img.addEventListener('click', () => {
          document.querySelectorAll('.grid-thumbnail').forEach(t => t.classList.remove('active'));
          img.classList.add('active');
          populateWorkshopDetails(cardObj);
      });
      workshopGrid.appendChild(img);
  });
}

function populateWorkshopDetails(card) {
    detailsPlaceholder.style.display = 'none'; detailsContent.style.display = 'block';
    detailElements.name.textContent = card.name;
    detailElements.trait.textContent = card.trait;
    detailElements.class.textContent = card.class;
    detailElements.image.src = card.image;
    detailElements.cost.textContent = card.cost;

    if (card.type.toLowerCase() === 'follower') {
        detailElements.statsRow.style.display = 'flex';
        detailElements.atk.textContent = card.attack;
        detailElements.def.textContent = card.defense;
    } else {
        detailElements.statsRow.style.display = 'none';
    }

    detailElements.textBlock.innerHTML = formatDetailsText(card.textRaw.card);
    
    if (card.type.toLowerCase() === 'follower' && card.textRaw.evolve && card.textRaw.evolve.trim()) {
        detailElements.evolveSection.style.display = 'block';
        detailElements.evolveText.innerHTML = formatDetailsText(card.textRaw.evolve);
    } else { detailElements.evolveSection.style.display = 'none'; }

    if (card.type.toLowerCase() === 'follower' && card.textRaw.superEvolve && card.textRaw.superEvolve.trim()) {
        detailElements.superEvolveSection.style.display = 'block';
        detailElements.superEvolveText.innerHTML = formatDetailsText(card.textRaw.superEvolve);
    } else { detailElements.superEvolveSection.style.display = 'none'; }
}

function resetDetailsPanel() {
    detailsPlaceholder.style.display = 'block'; detailsContent.style.display = 'none';
    document.querySelectorAll('.grid-thumbnail').forEach(t => t.classList.remove('active'));
}

document.getElementById('clearWorkshopBtn').addEventListener('click', () => {
    if (confirm("Delete all saved cards?")) { localStorage.removeItem(STORAGE_KEY); renderWorkshopGrid(); }
});
