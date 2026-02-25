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
    faith: "assets/boxes/box_faith.png",
    accelerate: "assets/boxes/box_accelerate.png",
    crystallize: "assets/boxes/box_crystallize.png"
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
  faith: document.getElementById("faithText"),
  accelerate: document.getElementById("accelerateText"),
  crystallize: document.getElementById("crystallizeText")
};

// --- Crest and Faith uploads ---
const crestArtUpload = document.getElementById("crestArtUpload");
const faithArtUpload = document.getElementById("faithArtUpload");

let uploadedArt = null;
let crestArt = null;
let faithArt = null;

// --- Helper Functions ---

function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

// Sharpening Helper
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

// Hyphen Handling Helpers
function getPartsAndWidths(text, fontSize, baseFont = "Memento", hyphenFont = "Roboto") {
  const parts = text.split(/(-)/g);
  let totalWidth = 0;
  // Define extra spacing for the hyphen in titles
  const hyphenPadding = 8; 

  const widths = parts.map(part => {
    ctx.font = `${fontSize}px '${part === "-" ? hyphenFont : baseFont}'`;
    let w = ctx.measureText(part).width;
    // If it's a hyphen, add the padding to the width calculation
    if (part === "-") w += hyphenPadding;
    totalWidth += w;
    return w;
  });
  return { parts, widths, totalWidth };
}

function drawTextWithHyphenSwap(text, x, y, fontSize, align = "left", baseFont = "Memento", hyphenFont = "Roboto") {
  ctx.save();
  ctx.textAlign = "left"; 
  
  const { parts, widths, totalWidth } = getPartsAndWidths(text, fontSize, baseFont, hyphenFont);
  
  let currentX = x;
  if (align === "center") currentX = x - (totalWidth / 2);
  else if (align === "right") currentX = x - totalWidth;
  
  parts.forEach((part, i) => {
    ctx.font = `${fontSize}px '${part === "-" ? hyphenFont : baseFont}'`;
    
    // If it's a hyphen, nudge it to the right so it is centered in the extra space
    let drawX = currentX;
    if (part === "-") drawX += 4; // Half of the padding defined in getPartsAndWidths

    ctx.fillText(part, drawX, y);
    currentX += widths[i];
  });
  
  ctx.restore();
}

/**
 * Draws a number, scaling down the font size to fit a max width.
 */
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

// --- Word Count Functions ---
function calculateTotalWordCount() {
  const allText = Object.values(textInputs).map(t => t.value).join(" ");
  const initialTokens = allText.split(/\s+/);
  let wordCount = 0;
  for (const token of initialTokens) {
    if (token.length === 0 || token === "----------") {
      continue;
    }
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

// --- Auto insert "----------" marker ---
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

// --- Text highlight keywords ---
const HIGHLIGHT_KEYWORDS = [
  "Fanfare","Last Words","Engage","Strike","Storm","Ambush","Bane","Drain","Ward","Rush","Overflow",
  "On Spellboost","Clash","Mode","Intimidate","Aura","Barrier","Fuse","Fused","Necromancy","Combo",
  "Earth Rite","Rally","Countdown","Reanimate","Earth Sigil","Crystallize","Crystallized","Invoke",
  "Invoked","Sanguine","Skybound Art","Super Skybound Art","Maneuver","Maneuverable","Maneuvering",
  "Enhance","Union Burst","Accelerate","Burial Rite"
];
const HIGHLIGHT_REGEX = new RegExp(`\\b(${HIGHLIGHT_KEYWORDS.join("|")})\\b`, "g");

// --- drawStretchBox ---
function drawStretchBox(img, x, y, stretchCount = 0, key = "") {
  const stretchPerBreak = 50;
  const stretchAmount = stretchCount * stretchPerBreak;
  let topHeight = 40, bottomHeight = 40;
  let middleStartY = topHeight;
  let middleHeight = img.height - topHeight - bottomHeight;

  if (key === "crest" || key === "faith" || key === "accelerate" || key === "crystallize") {
    topHeight = 107;
    middleStartY = 107;
    middleHeight = 38;
    bottomHeight = 28;
  } else if (key === "main") {
    topHeight = 60;
    bottomHeight = 120;
    middleStartY = topHeight;
    middleHeight = img.height - topHeight - bottomHeight;
  }

  ctx.drawImage(img, 0, 0, img.width, topHeight, x, y, img.width, topHeight);
  ctx.drawImage(
    img,
    0, middleStartY, img.width, middleHeight,
    x, y + middleStartY, img.width, middleHeight + stretchAmount
  );
  ctx.drawImage(
    img,
    0, img.height - bottomHeight, img.width, bottomHeight,
    x, y + middleStartY + middleHeight + stretchAmount,
    img.width, bottomHeight
  );
  return topHeight + middleHeight + bottomHeight + stretchAmount;
}

// --- Calculate Height ---
async function calculateTextBlockHeight(key, startY) {
  const textValue = textInputs[key].value.trim();
  if (!textValue) return 0;

  const isSpecialBox = (key !== "card");
  const specialLineHeightBefore = 30;
  const specialLineHeightAfter = 20;
  const cardLineHeightBefore = 30;
  const cardLineHeightAfter = 40;
  
  const textStartX = 769 + 30;
  const wrapLimitX = 1716;
  const lineHeight = 50;
  const baseFont = "33px 'Memento'";
  
  let processedText = textValue.replace(HIGHLIGHT_REGEX, "<K>$&</K>");
  if (key === "evolve" && processedText.startsWith("Evolve")) {
    processedText = processedText.replace(/^Evolve/, "<K>Evolve</K>");
  }
  if (key === "superEvolve" && processedText.startsWith("Super-Evolve")) {
    processedText = processedText.replace(/^Super-Evolve/, "<K>Super-Evolve</K>");
  }
  
  const tokenizerRegex = /(\*\*|_|<c>|<\/c>|<K>|<\/K>|----------|\n|\s+|-)/g;
  const allTokens = processedText.split(tokenizerRegex).filter(Boolean);

  let totalHeight = lineHeight;
  let currentX = textStartX;
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
      currentX = textStartX;
      dryLastTokenWasDivider = false;
      continue;
    }
    
    if (token.trim() === "----------") {
      if (currentX > textStartX) {
        totalHeight += isSpecialBox ? specialLineHeightBefore : cardLineHeightBefore;
      }
      currentX = textStartX;
      dryLastTokenWasDivider = true;
      continue;
    }
    
    dryLastTokenWasDivider = false;

    setDryFont();
    if (token === "-") {
      const weight = dryStyle.bold || dryStyle.isKeyword ? "bold " : "";
      const style = dryStyle.italic ? "italic " : "";
      ctx.font = `${weight}${style}33px 'Roboto'`;
    }

    let tokenWidth = ctx.measureText(token).width;
    if (token === "-") tokenWidth += 4; 
    
    if (currentX > textStartX && currentX + tokenWidth > wrapLimitX && token.trim() !== "") {
      totalHeight += lineHeight;
      currentX = textStartX;
    }

    if (currentX === textStartX && token.trim() === "") continue;
    currentX += tokenWidth;
    if (dryStyle.italic) currentX += 3;
  }
  
  const boxImg = assets.boxes[key === "card" ? null : key] ? await getImage(assets.boxes[key]) : null;
  const stretchCount = Math.max(0, (totalHeight / lineHeight) - 1);
  let boxHeight = 0;
  if (boxImg) {
      const topHeight = (key === "crest" || key === "faith" || key === "accelerate" || key === "crystallize") ? 107 : 40;
      const bottomHeight = (key === "crest" || key === "faith" || key === "accelerate" || key === "crystallize") ? 28 : 40;
      const middleHeight = boxImg.height - topHeight - bottomHeight;
      const stretchAmount = stretchCount * 50;
      boxHeight = topHeight + middleHeight + bottomHeight + stretchAmount;
  }

  return Math.max(boxHeight, totalHeight + 40);
}

// --- drawTextBlock ---
async function drawTextBlock(key, box, x, startY) {
  const textValue = textInputs[key].value.trim();
  if (!textValue) return 0;

  const isSpecialBox = (key !== "card");
  const specialLineHeightBefore = 30;
  const specialLineHeightAfter = 20;
  const specialDividerYOffset = 25;
  const cardLineHeightBefore = 30;
  const cardLineHeightAfter = 40;
  const cardDividerYOffset = 15;

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  const textStartX = x + 30;
  const wrapLimitX = 1716;
  const lineHeight = 50;
  const baseFont = "33px 'Memento'";

  let processedText = textValue.replace(HIGHLIGHT_REGEX, "<K>$&</K>");
  if (key === "evolve" && processedText.startsWith("Evolve")) {
    processedText = processedText.replace(/^Evolve/, "<K>Evolve</K>");
  }
  if (key === "superEvolve" && processedText.startsWith("Super-Evolve")) {
    processedText = processedText.replace(/^Super-Evolve/, "<K>Super-Evolve</K>");
  }

  const tokenizerRegex = /(\*\*|_|<c>|<\/c>|<K>|<\/K>|----------|\n|\s+|-)/g;
  const allTokens = processedText.split(tokenizerRegex).filter(Boolean);

  // --- Dry Run (Height Calc) ---
  let totalHeight = lineHeight;
  let currentX = textStartX;
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
      if (dryLastTokenWasDivider) {
        totalHeight += isSpecialBox ? specialLineHeightAfter : cardLineHeightAfter;
      } else {
        totalHeight += lineHeight;
      }
      currentX = textStartX;
      dryLastTokenWasDivider = false;
      continue;
    }
    
    if (token.trim() === "----------") {
      if (currentX > textStartX) {
        totalHeight += isSpecialBox ? specialLineHeightBefore : cardLineHeightBefore;
      }
      currentX = textStartX;
      dryLastTokenWasDivider = true;
      continue;
    }
    
    dryLastTokenWasDivider = false;
    setDryFont();
    
    if (token === "-") {
      const weight = dryStyle.bold || dryStyle.isKeyword ? "bold " : "";
      const style = dryStyle.italic ? "italic " : "";
      ctx.font = `${weight}${style}33px 'Roboto'`;
    }

    let tokenWidth = ctx.measureText(token).width;
    if (token === "-") tokenWidth += 4; 

    if (currentX > textStartX && currentX + tokenWidth > wrapLimitX && token.trim() !== "") {
      totalHeight += lineHeight;
      currentX = textStartX;
    }
    if (currentX === textStartX && token.trim() === "") continue;
    currentX += tokenWidth;
    if (dryStyle.italic) currentX += 3;
  }

  const boxImg = box ? await getImage(assets.boxes[box]) : null;
  const stretchCount = Math.max(0, (totalHeight / lineHeight) - 1);

  const boxHeight = boxImg
    ? drawStretchBox(boxImg, x, startY, stretchCount, key)
    : 0;

  // --- Drawing Run ---
  ctx.textAlign = "left";
  ctx.shadowColor = "black";
  ctx.shadowBlur = 4;

  let xPos = textStartX;
  let textY = startY + 50 + (key === "crest" || key === "faith" || key === "accelerate" || key === "crystallize" ? 90 : 0);
  let wetStyle = { bold: false, italic: false, color: null, isKeyword: false };
  let lastTokenWasDivider = false;

  const setWetStyle = () => {
    const weight = wetStyle.bold || wetStyle.isKeyword ? "bold " : "";
    const style = wetStyle.italic ? "italic " : "";
    ctx.font = `${weight}${style}${baseFont}`;
    ctx.fillStyle = wetStyle.color || (wetStyle.isKeyword ? "#f3d87d" : "#efeee9");
  };

  const dividerToUse = await getImage(
    assets.boxes[key === "card" ? "divider" : "small_divider"]
  );

  for (const token of allTokens) {
    if (token === "**") { wetStyle.bold = !wetStyle.bold; continue; }
    if (token === "_") { wetStyle.italic = !wetStyle.italic; continue; }
    if (token === "<c>") { wetStyle.color = "#f3d87d"; continue; }
    if (token === "</c>") { wetStyle.color = null; continue; }
    if (token === "<K>") { wetStyle.isKeyword = true; continue; }
    if (token === "</K>") { wetStyle.isKeyword = false; continue; }
    
    if (token === "\n") {
      if (lastTokenWasDivider) {
        textY += isSpecialBox ? specialLineHeightAfter : cardLineHeightAfter;
      } else {
        textY += lineHeight;
      }
      xPos = textStartX;
      lastTokenWasDivider = false;
      continue;
    }

    if (token.trim() === "----------") {
      if (xPos > textStartX) {
        textY += isSpecialBox ? specialLineHeightBefore : cardLineHeightBefore;
      }
      const yOffset = isSpecialBox ? specialDividerYOffset : cardDividerYOffset;
      ctx.drawImage(dividerToUse, x, textY - yOffset);
      xPos = textStartX;
      lastTokenWasDivider = true;
      continue;
    }
    lastTokenWasDivider = false;
    setWetStyle();

    if (token === "-") {
      const weight = wetStyle.bold || wetStyle.isKeyword ? "bold " : "";
      const style = wetStyle.italic ? "italic " : "";
      ctx.font = `${weight}${style}33px 'Roboto'`;
    }

    let tokenWidth = ctx.measureText(token).width;
    let drawX = xPos;

    if (token === "-") {
        tokenWidth += 4; 
        drawX += 2; 
    }

    if (xPos > textStartX && xPos + tokenWidth > wrapLimitX && token.trim() !== "") {
      textY += lineHeight;
      xPos = textStartX;
      drawX = xPos + (token === "-" ? 2 : 0); 
    }
    if (xPos === textStartX && token.trim() === "") continue;
    ctx.fillText(token, drawX, textY);
    xPos += tokenWidth;
    if (wetStyle.italic) xPos += 0;
  }
  
  return Math.max(boxHeight, textY - startY + 40);
}


// --- drawCard ---
async function drawCard() {
  const textOrder = [
    { key: "card", box: null },
    { key: "evolve", box: "evolve" },
    { key: "superEvolve", box: "superEvolve" },
    { key: "crest", box: "crest" },
    { key: "faith", box: "faith" },
    { key: "accelerate", box: "accelerate" },
    { key: "crystallize", box: "crystallize" }
  ];
  const boxX = 768;
  const startY = 246;

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
      const defaultStretchThreshold = 900;
      const bottomBarStretchThreshold = 825;
      const stretchThreshold = showBottomBar ? bottomBarStretchThreshold : defaultStretchThreshold;
      stretchPixels = Math.max(0, calculatedTotalY - stretchThreshold);
  }

  const stretchCount = stretchPixels / 50;
  const boxAsset = (wordCountCheckbox.checked || document.getElementById("illustratorName").value.trim()) ? assets.boxes.text_box : assets.boxes.text_box_no_bottom;
  const mainBoxImg = await getImage(boxAsset);
  
  const baseHeight = 1080; 
  const baseWidth = 1920;
  const newWidth = saveCardOnly ? 729 : baseWidth;
  const newHeight = saveCardOnly ? 882 : (baseHeight + stretchPixels);

  if (canvas.height !== newHeight) canvas.height = newHeight;
  if (canvas.width !== newWidth) canvas.width = newWidth;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.save();
  if (saveCardOnly) {
    ctx.translate(-48, -153);
  }

  if (!saveCardOnly) {
      const bg = await getImage(assets.backgrounds[classSelect.value]);
      const slicePointY = 1000;
      const topHeight = Math.min(slicePointY, bg.height);
      const bottomPartHeight = bg.height - topHeight;
      ctx.drawImage(bg, 0, 0, bg.width, topHeight, 0, 0, bg.width, topHeight);
      if (bottomPartHeight > 0) {
        const newBottomHeight = bottomPartHeight + stretchPixels;
        ctx.drawImage(bg, 0, topHeight, bg.width, bottomPartHeight, 0, topHeight, bg.width, newBottomHeight);
      }
  }

  const [gem, frame] = await Promise.all([
    getImage(assets.gems[classSelect.value]),
    getImage(assets[typeSelect.value.toLowerCase()][["bronze", "silver", "gold", "legendary", "signature"].indexOf(raritySelect.value.toLowerCase())])
  ]);

  if (uploadedArt) {
    const s = previewState.main;
    const dWidth = uploadedArt.width * s.scale;
    const dHeight = uploadedArt.height * s.scale;
    const bmp = await createImageBitmap(uploadedArt, 0, 0, uploadedArt.width, uploadedArt.height, {
      resizeWidth: Math.round(dWidth),
      resizeHeight: Math.round(dHeight),
      resizeQuality: "high" 
    });
    ctx.save();
    ctx.beginPath();
    ctx.rect(MAIN_ART_X, MAIN_ART_Y, MAIN_MASK_W, MAIN_MASK_H);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(bmp, MAIN_ART_X + s.tx, MAIN_ART_Y + s.ty);
    ctx.restore();
    bmp.close();
  }

  ctx.drawImage(gem, 398, 863);
  ctx.drawImage(frame, 48, 153);

  if (!saveCardOnly) {
      const textBoxX = 722;
      const textBoxY = 206;
      const dynamicBoxWidth = mainBoxImg.width;
      const dynamicBoxHeight = mainBoxImg.height + stretchPixels; 

      const offCanvas = document.createElement("canvas");
      offCanvas.width = dynamicBoxWidth;
      offCanvas.height = dynamicBoxHeight;
      const offCtx = offCanvas.getContext("2d");
      offCtx.drawImage(canvas, textBoxX, textBoxY, dynamicBoxWidth, dynamicBoxHeight, 0, 0, dynamicBoxWidth, dynamicBoxHeight);
      offCtx.filter = "blur(5px)";
      offCtx.drawImage(offCanvas, 0, 0);
      ctx.drawImage(offCanvas, textBoxX, textBoxY);

      drawStretchBox(mainBoxImg, textBoxX, textBoxY, stretchCount, "main");
      
      let currentY = startY;
      for (const { key, box } of textOrder) {
        const textValue = textInputs[key].value.trim();
        if (!textValue) continue; 
        const isEvolveBlock = (key === 'evolve' || key === 'superEvolve');
        if (isEvolveBlock && !isFollower) continue;

        const blockHeight = await drawTextBlock(key, box, boxX, currentY);
        
        const isCrest = key === "crest";
        const isFaith = key === "faith";
        const isAccelerate = key === "accelerate";
        const isCrystallize = key === "crystallize";
        if (isCrest || isFaith || isAccelerate || isCrystallize) {
          const iconX = boxX + 120;
          const iconY = currentY + 32;
          const iconImg = isCrest ? crestArt : faithArt;
          const nameField = document.getElementById(isCrest ? "crestName" : "faithName");
          const nameValue = nameField ? nameField.value.trim() : "";

          if (iconImg) {
            const s = previewState[isCrest ? "crest" : "faith"];
            const dWidth = iconImg.width * s.scale;
            const dHeight = iconImg.height * s.scale;
            const bmp = await createImageBitmap(iconImg, 0, 0, iconImg.width, iconImg.height, {
              resizeWidth: Math.round(dWidth),
              resizeHeight: Math.round(dHeight),
              resizeQuality: "high"
            });
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = Math.round(dWidth);
            tempCanvas.height = Math.round(dHeight);
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(bmp, 0, 0);
            applySharpen(tempCtx, tempCanvas.width, tempCanvas.height, 0.25);

            ctx.save();
            ctx.beginPath();
            ctx.arc(iconX + ICON_W / 2, iconY + ICON_H / 2, ICON_W / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(tempCanvas, iconX + s.tx, iconY + s.ty);
            ctx.restore();
            bmp.close();
          }
          
          const defaultName = isCrest ? "Crest" : "Faith";
          const displayName = nameValue || defaultName;
          if (displayName) {
            ctx.save();
            ctx.fillStyle = "#f3d87d";
            ctx.shadowColor = "black";
            ctx.shadowBlur = 4;
            drawTextWithHyphenSwap(displayName, iconX + ICON_W + 17, iconY + ICON_H / 2 + 10, 33, "left");
            ctx.restore();
          }
          else {
             const costField = document.getElementById(isAccelerate ? "accelerateCost" : "crystallizeCost");
             const costVal = costField ? costField.value : "1";
             const displayName = (isAccelerate ? "Accelerate " : "Crystallize ") + costVal;
             
             if (displayName) {
              ctx.save();
              ctx.fillStyle = "#f3d87d";
              ctx.shadowColor = "black";
              ctx.shadowBlur = 4;
              drawTextWithHyphenSwap(displayName, iconX + ICON_W + 17, iconY + ICON_H / 2 + 10, 33, "left");
              ctx.restore();
             }
          }
        }
        currentY += blockHeight - 10;
      }
  }

  ctx.shadowColor = "black";
  ctx.shadowBlur = 6;
  ctx.fillStyle = "#efeee9";
  
  const nameText = nameInput.value.trim() || "Unnamed Card";

  if (!saveCardOnly) {
    drawTextWithHyphenSwap(nameText, 163, 150, 56, "left");
    const traitText = traitInput.value.trim() || "—";
    drawTextWithHyphenSwap(traitText, 1306, 147, 33, "left");
  }

  let secondaryFontSize = 42;
  let { totalWidth } = getPartsAndWidths(nameText, secondaryFontSize);
  const maxWidth = 363;
  const baseY = 331;
  const offsetPerStep = -0.75;
  let shrinkSteps = 0;
  
  while (totalWidth > maxWidth && secondaryFontSize > 2) {
    secondaryFontSize -= 2;
    shrinkSteps++;
    totalWidth = getPartsAndWidths(nameText, secondaryFontSize).totalWidth;
  }
  const secondaryNameY = baseY + (shrinkSteps * offsetPerStep);
  drawTextWithHyphenSwap(nameText, 455, secondaryNameY, secondaryFontSize, "center");

  const numberSpacing = -5;
  const numberFont = 'Sv_numbers';
  const costMaxWidth = 95;
  const statMaxWidth = 90;
  const COST_NUDGE = -0.2;
  const STAT_NUDGE = -0.2;

  drawScaledNumber(costInput.value, 197, 335, 80, costMaxWidth, numberFont, numberSpacing, COST_NUDGE);

  if (typeSelect.value === "Follower") {
    drawScaledNumber(attackInput.value, 201, 922, 82, statMaxWidth, numberFont, numberSpacing, STAT_NUDGE);
    drawScaledNumber(defenseInput.value, 642, 917, 82, statMaxWidth, numberFont, numberSpacing, STAT_NUDGE);
  }
  ctx.letterSpacing = "0px";

  if (!saveCardOnly) {
      if (tokenCheckbox.checked) {
        ctx.font = "28px 'NotoSans'";
        ctx.textAlign = "right";
        ctx.fillText("*This is a token card.", 1788, canvas.height - 55);
      }

      const bottomBarBaseY = 911;
      const dynamicBottomBarY = bottomBarBaseY + stretchPixels;

      const illustrator = document.getElementById("illustratorName").value.trim();
      if (illustrator) {
        ctx.font = "28px 'NotoSans'";
        ctx.textAlign = "left";
        ctx.fillText(`Illustrator: ${illustrator}`, 790, dynamicBottomBarY);
      }
      if (wordCountCheckbox.checked) {
        const wordCount = calculateTotalWordCount();
        ctx.font = "28px 'NotoSans'";
        ctx.textAlign = "right";
        ctx.fillText(`Word count: ${wordCount}`, 1730, dynamicBottomBarY);
      }
  }
  
  ctx.restore();
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0;
}

/***********************
  PREVIEW COLUMN HANDLERS
***********************/
const MAIN_MASK_W = 450, MAIN_MASK_H = 560;
const MAIN_ART_X = 200, MAIN_ART_Y = 350;
const ICON_W = 56, ICON_H = 57;
let artX = MAIN_ART_X, artY = MAIN_ART_Y, artW = MAIN_MASK_W, artH = MAIN_MASK_H;
window.ICON_W = ICON_W; window.ICON_H = ICON_H;

const ICON_SCALE = 5;

const mainPreviewCanvas = document.getElementById("mainPreviewCanvas");
const mainPreviewCtx = mainPreviewCanvas ? mainPreviewCanvas.getContext("2d") : null;
if (mainPreviewCtx) mainPreviewCtx.imageSmoothingEnabled = true;
const mainZoomSlider = document.getElementById("mainZoomSlider");

const crestPreviewCanvas = document.getElementById("crestPreviewCanvas");
const crestPreviewCtx = crestPreviewCanvas ? crestPreviewCanvas.getContext("2d") : null;
if (crestPreviewCtx) {
  crestPreviewCtx.imageSmoothingEnabled = true; 
  crestPreviewCtx.scale(ICON_SCALE, ICON_SCALE);
}
const crestZoomSlider = document.getElementById("crestZoomSlider");

const faithPreviewCanvas = document.getElementById("faithPreviewCanvas");
const faithPreviewCtx = faithPreviewCanvas ? faithPreviewCanvas.getContext("2d") : null;
if (faithPreviewCtx) {
  faithPreviewCtx.imageSmoothingEnabled = true; 
  faithPreviewCtx.scale(ICON_SCALE, ICON_SCALE);
}
const faithZoomSlider = document.getElementById("faithZoomSlider");

const artInput = document.getElementById("artUpload");
const crestInput = document.getElementById("crestArtUpload");
const faithInput = document.getElementById("faithArtUpload");

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
  s.scale = scale;
  s.minScale = scale; 
  s.tx = (s.maskW - img.width * scale) / 2;
  s.ty = (s.maskH - img.height * scale) / 2;
}

function clampPan(s) {
  if (!s.img) return;
  const imgW = s.img.width * s.scale;
  const imgH = s.img.height * s.scale;
  if (imgW <= s.maskW) {
    s.tx = (s.maskW - imgW) / 2;
  } else {
    const minX = s.maskW - imgW;
    const maxX = 0;
    if (s.tx < minX) s.tx = minX;
    if (s.tx > maxX) s.tx = maxX;
  }
  if (imgH <= s.maskH) {
    s.ty = (s.maskH - imgH) / 2;
  } else {
    const minY = s.maskH - imgH;
    const maxY = 0;
    if (s.ty < minY) s.ty = minY;
    if (s.ty > maxY) s.ty = maxY;
  }
}

function drawPreviewCanvas(ctx, canvasEl, s, shape) {
  if (!ctx || !canvasEl) return;
  const { img, scale, tx, ty, maskW, maskH } = s;
  
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
  ctx.fillStyle = "rgba(20,20,20,0.95)";
  ctx.fillRect(0, 0, canvasEl.width, canvasEl.height); 

  const renderScale = canvasEl.width / maskW;
  const borderThickness = 1 / renderScale;

  if (!img) {
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = borderThickness;
    if (shape === "circle") {
      ctx.beginPath();
      ctx.arc(maskW / 2, maskH / 2, Math.min(maskW, maskH) / 2 - 1, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeRect(0.5, 0.5, maskW - 1, maskH - 1);
    }
    return;
  }

  ctx.save();
  if (shape === "circle") {
    ctx.beginPath();
    ctx.arc(maskW / 2, maskH / 2, Math.min(maskW, maskH) / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
  } else {
    ctx.beginPath();
    ctx.rect(0, 0, maskW, maskH);
    ctx.closePath();
    ctx.clip();
  }

  ctx.drawImage(img, tx, ty, img.width * scale, img.height * scale);
  ctx.restore();

  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = borderThickness;
  if (shape === "circle") {
    ctx.beginPath();
    ctx.arc(maskW / 2, maskH / 2, Math.min(maskW, maskH) / 2 - 1, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.strokeRect(0.5, 0.5, maskW - 1, maskH - 1);
  }
}

function syncMainToGlobals() {
  const s = previewState.main;
  if (!s.img) {
    uploadedArt = null;
    artW = MAIN_MASK_W;
    artH = MAIN_MASK_H;
    artX = MAIN_ART_X;
    artY = MAIN_ART_Y;
    return;
  }
  uploadedArt = s.img;
  artW = Math.round(s.img.width * s.scale);
  artH = Math.round(s.img.height * s.scale);
  artX = Math.round(MAIN_ART_X + s.tx);
  artY = Math.round(MAIN_ART_Y + s.ty);
}

function syncIconToGlobals(which) {
  const s = previewState[which];
  if (!s.img) {
    if (which === "crest") crestArt = null;
    else faithArt = null;
    return;
  }
  if (which === "crest") crestArt = s.img;
  else faithArt = s.img;
  window.ICON_W = s.maskW;
  window.ICON_H = s.maskH;
}

function updateAll() {
  clampPan(previewState.main);
  clampPan(previewState.crest);
  clampPan(previewState.faith);

  syncMainToGlobals();
  syncIconToGlobals("crest");
  syncIconToGlobals("faith");

  drawPreviewCanvas(mainPreviewCtx, mainPreviewCanvas, previewState.main, "rect");
  drawPreviewCanvas(crestPreviewCtx, crestPreviewCanvas, previewState.crest, "circle");
  drawPreviewCanvas(faithPreviewCtx, faithPreviewCanvas, previewState.faith, "circle");
}

/* ---------- Upload handlers ---------- */
if (artInput) {
  artInput.addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const mainArtTitleEl = document.getElementById("mainArtPreviewTitle");
    if (mainArtTitleEl) {
      mainArtTitleEl.textContent = file.name;
    }
    try {
      const img = await loadImageFromFile(file);
      previewState.main.img = img;
      fitImageToMask(img, previewState.main);
      if (mainZoomSlider) {
        const min = previewState.main.minScale;
        const max = min * 5; 
        mainZoomSlider.min = min;
        mainZoomSlider.max = max;
        mainZoomSlider.step = (max - min) / 100;
        mainZoomSlider.value = previewState.main.scale;
      }
      updateAll();
    } catch (err) {
      console.error("Failed to load main art:", err);
    }
  });
}
if (crestInput) {
  crestInput.addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const img = await loadImageFromFile(file);
      previewState.crest.img = img;
      fitImageToMask(img, previewState.crest);
      if (crestZoomSlider) {
        const min = previewState.crest.minScale;
        const max = min * 8; 
        crestZoomSlider.min = min;
        crestZoomSlider.max = max;
        crestZoomSlider.step = (max - min) / 100;
        crestZoomSlider.value = previewState.crest.scale;
      }
      updateAll();
    } catch (err) {
      console.error("Failed to load crest art:", err);
    }
  });
}
if (faithInput) {
  faithInput.addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const img = await loadImageFromFile(file);
      previewState.faith.img = img;
      fitImageToMask(img, previewState.faith);
      if (faithZoomSlider) {
        const min = previewState.faith.minScale;
        const max = min * 8; 
        faithZoomSlider.min = min;
        faithZoomSlider.max = max;
        faithZoomSlider.step = (max - min) / 100;
        faithZoomSlider.value = previewState.faith.scale;
      }
      updateAll();
    } catch (err) {
      console.error("Failed to load faith art:", err);
    }
  });
}

/* ---------- Pan & zoom helpers ---------- */
function getEventPos(e, canvasEl) {
  const rect = canvasEl.getBoundingClientRect();
  if (e.touches && e.touches.length) {
    return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
  } else {
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }
}

function attachPanAndZoom(canvasEl, state, sliderEl) {
  if (!canvasEl) return;
  let dragging = false;
  let lastX = 0, lastY = 0;

  canvasEl.addEventListener("pointerdown", (e) => {
    if (!state.img) return;
    dragging = true;
    const p = getEventPos(e, canvasEl);
    lastX = p.x; lastY = p.y;
    if (canvasEl.setPointerCapture) try { canvasEl.setPointerCapture(e.pointerId); } catch (err) {}
  });

  canvasEl.addEventListener("pointermove", (e) => {
    if (!dragging || !state.img) return;
    
    const rect = canvasEl.getBoundingClientRect();
    const scaleX = state.maskW / rect.width; 

    const p = getEventPos(e, canvasEl);
    const dx = (p.x - lastX) * scaleX;
    const dy = (p.y - lastY) * scaleX; 

    lastX = p.x; lastY = p.y;
    state.tx += dx; state.ty += dy;
    clampPan(state);
    updateAll();
  });

  function stopDrag(e) {
    dragging = false;
  }
  canvasEl.addEventListener("pointerup", stopDrag);
  canvasEl.addEventListener("pointerleave", stopDrag);

  canvasEl.addEventListener("wheel", (ev) => {
    if (!state.img) return;
    ev.preventDefault();
    
    const zoomIntensity = 0.05;
    const delta = ev.deltaY > 0 ? -1 : 1; 
    const oldScale = state.scale;
    
    const minScale = state.minScale;
    const maxScale = sliderEl ? parseFloat(sliderEl.max) : oldScale * 2;
    
    let newScale = oldScale * (1 + delta * zoomIntensity);
    newScale = Math.max(minScale, Math.min(maxScale, newScale));
    
    const rect = canvasEl.getBoundingClientRect();
    const scaleFactor = state.maskW / rect.width;

    const cx = (ev.clientX - rect.left) * scaleFactor;
    const cy = (ev.clientY - rect.top) * scaleFactor;

    const imgSpaceX = (cx - state.tx) / oldScale;
    const imgSpaceY = (cy - state.ty) / oldScale;
    
    state.scale = newScale;
    state.tx = cx - imgSpaceX * newScale;
    state.ty = cy - imgSpaceY * newScale;
    clampPan(state);
    if (sliderEl) sliderEl.value = state.scale;
    updateAll();
  }, { passive: false });

  if (sliderEl) {
    sliderEl.addEventListener("input", (ev) => {
      if (!state.img) return;
      const newScale = Math.max(state.minScale, parseFloat(ev.target.value)); 
      const oldScale = state.scale;
      const cx = state.maskW / 2, cy = state.maskH / 2;
      const imgSpaceX = (cx - state.tx) / oldScale;
      const imgSpaceY = (cy - state.ty) / oldScale;
      state.scale = newScale;
      state.tx = cx - imgSpaceX * newScale;
      state.ty = cy - imgSpaceY * newScale;
      clampPan(state);
      updateAll();
    });
  }
}

attachPanAndZoom(mainPreviewCanvas, previewState.main, mainZoomSlider);
attachPanAndZoom(crestPreviewCanvas, previewState.crest, crestZoomSlider);
attachPanAndZoom(faithPreviewCanvas, previewState.faith, faithZoomSlider);

document.querySelectorAll(".text-toolbar button").forEach((button) => {
  button.addEventListener("click", (e) => {
    e.preventDefault();
    const format = button.dataset.format;
    const field = button.closest(".field");
    if (!field) return;
    const textarea = field.querySelector("textarea");
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    const selected = value.slice(start, end);

    let openTag = "", closeTag = "";
    if (format === "bold") { openTag = "**"; closeTag = "**"; }
    else if (format === "italic") { openTag = "_"; closeTag = "_"; }
    else if (format === "color") { openTag = "<c>"; closeTag = "</c>"; }
    else if (format === "all") { openTag = "**_<c>"; closeTag = "</c>_**"; }
    else return;

    if (start !== end) {
      const before = value.slice(0, start);
      const after = value.slice(end);
      const currentlyWrapped = before.endsWith(openTag) && after.startsWith(closeTag);
      if (currentlyWrapped) {
        const newBefore = before.slice(0, before.length - openTag.length);
        const newAfter = after.slice(closeTag.length);
        textarea.value = newBefore + selected + newAfter;
        textarea.setSelectionRange(newBefore.length, newBefore.length + selected.length);
      } else {
        textarea.value = before + openTag + selected + closeTag + after;
        textarea.setSelectionRange(start + openTag.length, end + openTag.length);
      }
      textarea.focus();
      textarea.dispatchEvent(new Event("input"));
      return;
    }

    const before = value.slice(0, start);
    const after = value.slice(start);
    textarea.value = before + openTag + closeTag + after;
    const caret = before.length + openTag.length;
    textarea.setSelectionRange(caret, caret);
    textarea.focus();
    textarea.dispatchEvent(new Event("input"));
  });
});

document.fonts.ready.then(() => {
  setTimeout(() => {
    updateAll();
    updateLiveWordCount(); 
  }, 60);
});

document.getElementById("previewBtn").addEventListener("click", async () => {
  const btn = document.getElementById("previewBtn");
  const originalText = btn.textContent;
  
  btn.textContent = "Loading assets...";
  btn.disabled = true;

  try {
    await document.fonts.ready;
    await Promise.all([
        document.fonts.load("60px 'Memento'"),
        document.fonts.load("60px 'Sv_numbers'"),
        document.fonts.load("30px 'NotoSans'"),
        document.fonts.load("30px 'Roboto'")
    ]);

    btn.textContent = "Generating...";

    await drawCard(); 
    
    const canvas = document.getElementById("previewCanvas");
    const dataUrl = canvas.toDataURL("image/png", 1.0);
    
    const previewWindow = window.open("");
    if (previewWindow) {
      previewWindow.document.title = `${(nameInput.value.trim() || "card")}-preview`;
      previewWindow.document.body.style.margin = "0";
      previewWindow.document.body.style.backgroundColor = "#222";
      previewWindow.document.body.innerHTML = `<img src="${dataUrl}" alt="Card Preview" style="max-width: 100%; height: auto; display: block; margin: auto;">`;
    } else {
      alert("Pop-up blocked! Please allow pop-ups for this site to use the preview feature.");
    }

  } catch (err) {
    console.error("Preview failed:", err);
    alert("Error: Could not generate preview. Try again.");
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
});


// --- Navigation Carousel Logic ---
function navigateTo(page) {
  const track = document.getElementById("app-carousel");
  
  if (page === 'balance') {
    track.style.transform = "translateX(0%)";
  } else if (page === 'home') {
    track.style.transform = "translateX(-33.3333%)";
  } else if (page === 'workshop') {
    track.style.transform = "translateX(-66.6666%)";
  }
  
  const viewport = document.getElementById("app-viewport");
  if (viewport) viewport.scrollTo({ top: 0, behavior: 'smooth' });
}


// --- WORKSHOP LOGIC (IndexedDB) ---

const DB_NAME = "ShadowverseWorkshopDB";
const STORE_NAME = "cards";
const DB_VERSION = 1;

// NEW: Global variables to track workshop navigation state
let workshopCardsCache = []; 
let visibleCardsCache = []; // New cache for filtered results
let currentCardIndex = -1;
let currentClassFilter = "All"; // Default filter

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject("IndexedDB error: " + event.target.errorCode);
    };
  });
}

async function saveToWorkshop(cardData) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(cardData); 

    request.onsuccess = () => resolve();
    request.onerror = (e) => reject(e.target.error);
  });
}

async function getWorkshopData() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const data = request.result;
      data.sort((a, b) => b.id - a.id);
      resolve(data);
    };
    request.onerror = (e) => reject(e.target.error);
  });
}

async function clearWorkshop() {
  if(confirm("Are you sure you want to clear your card history?")) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        renderWorkshop();
        resolve();
      };
      request.onerror = (e) => reject(e.target.error);
    });
  }
}

async function renderWorkshop() {
  const grid = document.getElementById("workshopGrid");
  if (!grid) return;
  
  grid.innerHTML = ""; 

  try {
    // 1. Get fresh data
    const data = await getWorkshopData();
    workshopCardsCache = data; 

    // 2. Apply Filter
    if (currentClassFilter === "All") {
      visibleCardsCache = data;
    } else {
      visibleCardsCache = data.filter(card => card.class === currentClassFilter);
    }

    if (visibleCardsCache.length === 0) {
      if (data.length === 0) {
        grid.innerHTML = '<p class="placeholder-text">No cards generated yet. Create and download a card to see it here!</p>';
      } else {
        grid.innerHTML = `<p class="placeholder-text">No ${currentClassFilter} cards found.</p>`;
      }
      return;
    }

    // 3. Render only visible cards
    visibleCardsCache.forEach((card, index) => {
      const cardEl = document.createElement("div");
      cardEl.className = "workshop-card";
      
      // Update Click to use index tracking based on VISIBLE cache
      cardEl.onclick = () => {
          currentCardIndex = index;
          openWorkshopModal(index); 
      };

      const img = document.createElement("img");
      img.src = card.image;
      img.loading = "lazy";

      cardEl.appendChild(img);
      grid.appendChild(cardEl);
    });
  } catch (err) {
    console.error("Error loading workshop:", err);
    grid.innerHTML = '<p class="placeholder-text" style="color:#d55;">Error loading workshop history.</p>';
  }
}

// Setup Filter Button Listeners
document.addEventListener("DOMContentLoaded", () => {
  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      // UI Update
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      // Logic Update
      currentClassFilter = btn.dataset.filter;
      renderWorkshop();
    });
  });
});

const workshopModal = document.getElementById("workshopModal");

// Helper to format text for HTML (Modal) matching Canvas logic
function formatWorkshopHTML(text) {
  if (!text) return "";

  // 1. Escape HTML entities
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2. Restore supported custom tags
  html = html
    .replace(/&lt;c&gt;/g, "<c>")
    .replace(/&lt;\/c&gt;/g, "</c>");

  // 3. Handle Evolve/Super-Evolve start-of-line highlighting
  if (html.startsWith("Evolve")) {
    html = html.replace(/^Evolve/, '<span class="sv-keyword">Evolve</span>');
  }
  if (html.startsWith("Super-Evolve")) {
    html = html.replace(/^Super-Evolve/, '<span class="sv-keyword">Super-Evolve</span>');
  }

  // 4. Highlight standard keywords
  html = html.replace(HIGHLIGHT_REGEX, '<span class="sv-keyword">$1</span>');

  // 5. Apply formatting codes
  html = html.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>'); // Bold
  html = html.replace(/_(.*?)_/g, '<i>$1</i>');       // Italic
  html = html.replace(/<c>(.*?)<\/c>/g, '<span style="color:#f3d87d">$1</span>'); // Color
  
  // 6. Dividers (----------)
  // UPDATED: Consumes the optional newline (\n?) immediately following the divider
  // to prevent an extra line break from appearing after the line.
  html = html.replace(/----------\n?/g, '<hr class="sv-divider">');

  // 7. Newlines (Convert remaining newlines to <br>)
  html = html.replace(/\n/g, '<br>');

  return html;
}

// REFACTORED: Now accepts an index and pulls from cache
function openWorkshopModal(index) {
  if (index < 0 || index >= visibleCardsCache.length) return;
  
  const card = workshopCardsCache[index];

  document.getElementById("modalCardImage").src = card.image;
  document.getElementById("modalCardName").textContent = card.name;

  const traitVal = card.trait ? card.trait : "-";
  const classVal = card.class ? card.class : "Neutral";
  const illustratorVal = card.illustrator ? card.illustrator : "-";

  const metaHTML = `
    <span class="sv-gold-label">Trait:</span> ${traitVal}
    <span class="sv-meta-separator">|</span>
    <span class="sv-gold-label">Class:</span> ${classVal}
    <span class="sv-meta-separator">|</span>
    <span class="sv-gold-label">Illustrator:</span> ${illustratorVal}
  `;
  
  const metaContainer = document.getElementById("modalMetaString");
  if (metaContainer) {
      metaContainer.innerHTML = metaHTML;
  }
  
  const container = document.getElementById("modalTextContainer");
  container.innerHTML = ""; 

  // 1. Render Main Card Text
  if (card.text.card) {
    const p = document.createElement("div");
    p.className = "sv-text-block";
    p.innerHTML = formatWorkshopHTML(card.text.card);
    container.appendChild(p);
  }

  const isFollower = card.type === "Follower";

  // 2. Identify presence of extras to determine if divider is needed
  const hasEvolve = isFollower && card.text.evolve;
  const hasSuperEvolve = isFollower && card.text.superEvolve;
  const hasCrest = !!card.text.crest;
  const hasFaith = !!card.text.faith;
  const hasAccelerate = !!card.text.accelerate;
  const hasCrystallize = !!card.text.crystallize;

  const hasAnyExtra = hasEvolve || hasSuperEvolve || hasCrest || hasFaith || hasAccelerate || hasCrystallize;

  // 3. Insert Structural Divider between Card Text and Extras
  if (card.text.card && hasAnyExtra) {
    const hr = document.createElement("hr");
    hr.className = "sv-divider";
    container.appendChild(hr);
  }

  // 4. Render Evolve / Super-Evolve (Standard Text Blocks)
  if (hasEvolve) {
    const p = document.createElement("div");
    p.className = "sv-text-block";
    p.innerHTML = formatWorkshopHTML(card.text.evolve);
    container.appendChild(p);
  }

  if (hasSuperEvolve) {
    const p = document.createElement("div");
    p.className = "sv-text-block";
    p.innerHTML = formatWorkshopHTML(card.text.superEvolve);
    container.appendChild(p);
  }

  // 5. Render Crest / Faith (New Sub-box Structure)
  // Helper to create the sub-box
  const createSubBox = (type, name, text) => {
    const wrapper = document.createElement("div");
    wrapper.className = "sv-sub-box";

    const header = document.createElement("div");
    header.className = "sv-sub-header";

    // Icon
    const img = document.createElement("img");
    img.src = `assets/misc/${type.toLowerCase()}.png`; // Expects 'crest.png' or 'faith.png'
    img.alt = type;
    
    // Title
    const titleSpan = document.createElement("span");
    titleSpan.textContent = name || type; // Use custom name or default to Type (Crest/Faith)

    header.appendChild(img);
    header.appendChild(titleSpan);

    const content = document.createElement("div");
    content.className = "sv-sub-content";
    content.innerHTML = formatWorkshopHTML(text);

    wrapper.appendChild(header);
    wrapper.appendChild(content);

    return wrapper;
  };

  if (hasAccelerate) {
    container.appendChild(createSubBox("Accelerate", "Accelerate " + (card.costs?.accelerate || "1"), card.text.accelerate));
  }
  if (hasCrystallize) {
    container.appendChild(createSubBox("Crystallize", "Crystallize " + (card.costs?.crystallize || "1"), card.text.crystallize));
  }

  if (hasCrest) {
    container.appendChild(createSubBox("Crest", card.names.crest, card.text.crest));
  }

  if (hasFaith) {
    container.appendChild(createSubBox("Faith", card.names.faith, card.text.faith));
  }

  document.getElementById("workshopModal").style.display = "block";
}

// NEW: Navigation Function
function navigateModal(direction) {
  if (visibleCardsCache.length === 0) return;

  currentCardIndex += direction;

  // Infinite loop logic
  if (currentCardIndex < 0) {
    currentCardIndex = visibleCardsCache.length - 1;
  } else if (currentCardIndex >= visibleCardsCache.length) {
    currentCardIndex = 0;
  }

  openWorkshopModal(currentCardIndex);
}

// Attach Event Listeners for Navigation
const prevBtn = document.getElementById('modalPrevBtn');
const nextBtn = document.getElementById('modalNextBtn');

if(prevBtn) prevBtn.onclick = (e) => { e.stopPropagation(); navigateModal(-1); };
if(nextBtn) nextBtn.onclick = (e) => { e.stopPropagation(); navigateModal(1); };

// Optional: Keyboard support
document.addEventListener('keydown', (e) => {
    const modal = document.getElementById("workshopModal");
    if (modal.style.display === "block") {
      if (e.key === "ArrowLeft") navigateModal(-1);
      if (e.key === "ArrowRight") navigateModal(1);
    }
});

function closeWorkshopModal() {
  workshopModal.style.display = "none";
}

window.addEventListener("click", (e) => {
  if (e.target === workshopModal) {
    closeWorkshopModal();
  }
});

document.addEventListener("DOMContentLoaded", renderWorkshop);

document.getElementById("downloadBtn").addEventListener("click", async () => { 
  const btn = document.getElementById("downloadBtn");
  const originalText = btn.textContent;
  
  btn.textContent = "Processing...";
  btn.disabled = true;

  try {
    await document.fonts.ready;
    await Promise.all([
        document.fonts.load("60px 'Memento'"),
        document.fonts.load("60px 'Sv_numbers'"),
        document.fonts.load("30px 'NotoSans'"),
        document.fonts.load("30px 'Roboto'")
    ]);

    const wasChecked = saveCardOnlyCheckbox.checked;
    
    saveCardOnlyCheckbox.checked = true;
    await drawCard();
    const workshopImageBase64 = canvas.toDataURL("image/png", 0.8); 
    
    const cardMetadata = {
      id: Date.now(),
      image: workshopImageBase64,
      name: nameInput.value.trim() || "Unnamed Card",
      trait: traitInput.value.trim(),
      class: classSelect.value,
      type: typeSelect.value,
      rarity: raritySelect.value,
      illustrator: document.getElementById("illustratorName").value.trim(),
      names: {
        crest: document.getElementById("crestName").value.trim(),
        faith: document.getElementById("faithName").value.trim()
      },
      costs: {
        accelerate: document.getElementById("accelerateCost").value,
        crystallize: document.getElementById("crystallizeCost").value
      },
      text: {
        card: textInputs.card.value.trim(),
        evolve: textInputs.evolve.value.trim(),
        superEvolve: textInputs.superEvolve.value.trim(),
        crest: textInputs.crest.value.trim(),
        faith: textInputs.faith.value.trim(),
        accelerate: textInputs.accelerate.value.trim(),
        crystallize: textInputs.crystallize.value.trim()
      }
    };

    try {
      await saveToWorkshop(cardMetadata);
      await renderWorkshop();
    } catch (dbError) {
      console.warn("Failed to save to workshop history (IndexedDB error):", dbError);
    }

    if (!wasChecked) {
      saveCardOnlyCheckbox.checked = false;
      await drawCard(); 
    }

    const downloadLink = document.createElement("a");
    downloadLink.download = `${(nameInput.value.trim() || "card")}.png`;
    downloadLink.href = canvas.toDataURL("image/png", 1.0); 
    downloadLink.click();
    
  } catch (err) {
    console.error("Download failed:", err);
    alert("Error: Could not save image. Try again.");
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
});

// ------------------------------------
// OFFICIAL CARDS SEARCH FUNCTIONALITY
// ------------------------------------
let officialCards = [];

async function fetchOfficialCards() {
  try {
    // Assuming cards.txt is at cards/cards.txt relative to the HTML
    const response = await fetch('cards.txt');
    if (!response.ok) {
      console.warn("Could not fetch cards.txt");
      return;
    }
    const text = await response.text();
    parseOfficialCards(text);
  } catch (err) {
    console.error("Error fetching card database:", err);
  }
}

function parseOfficialCards(fullText) {
  // Pattern to find "Card Name: ...", "Card ID: ..."
  // We'll split the file by the "====================..." separators first
  const sections = fullText.split(/={10,}/);
  
  officialCards = [];

  sections.forEach(section => {
    // Basic extraction
    const nameMatch = section.match(/Card Name:\s*(.+)/);
    const idMatch = section.match(/Card ID:\s*(\d+)/);
    
    if (nameMatch && idMatch) {
      const name = nameMatch[1].trim();
      const id = idMatch[1].trim();
      
      officialCards.push({ name, id, fullText: section });
    }
  });

  // Sort alphabetically by name
  officialCards.sort((a, b) => a.name.localeCompare(b.name));
  console.log(`Loaded ${officialCards.length} official cards.`);
}

function setupSearch(inputId, resultsId) {
  const input = document.getElementById(inputId);
  const resultsContainer = document.getElementById(resultsId);

  if (!input || !resultsContainer) return;

  // On Input
  input.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (query.length === 0) {
      resultsContainer.style.display = 'none';
      return;
    }

    const matches = officialCards.filter(card => 
      card.name.toLowerCase().includes(query) || card.id.includes(query)
    );

    renderResults(matches, resultsContainer, input);
  });

  // Hide when clicking outside
  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !resultsContainer.contains(e.target)) {
      resultsContainer.style.display = 'none';
    }
  });
  
  // Show results again on focus if text exists
  input.addEventListener('focus', () => {
      if (input.value.trim().length > 0) {
          input.dispatchEvent(new Event('input'));
      }
  });
}

function renderResults(matches, container, inputField) {
  container.innerHTML = '';
  
  if (matches.length === 0) {
    container.style.display = 'none';
    return;
  }

  matches.forEach(card => {
    const li = document.createElement('li');
    li.innerHTML = `${card.name} <span class="card-id-preview">ID: ${card.id}</span>`;
    
    li.onclick = () => {
      inputField.value = card.name;
      container.style.display = 'none';
      
      // NEW: Logic for Balance Page
      if (inputField.id === 'balanceSearchInput') {
        populateBalanceForm(card);
      } 
      // Existing Logic for Workshop/Other
      else {
        console.log("Selected card:", card);
      }
    };
    
    container.appendChild(li);
  });

  container.style.display = 'block';
}

function populateBalanceForm(card) {
  // Hide placeholder, show form
  const placeholder = document.querySelector('#page-balance .placeholder-content');
  if (placeholder) placeholder.style.display = 'none';
  
  const form = document.getElementById('balanceAdjustmentForm');
  if (form) form.style.display = 'block';

  // Stats
  document.getElementById('adjCost').value = card.cost || 0;
  document.getElementById('adjAttack').value = card.attack || 0;
  document.getElementById('adjDefense').value = card.defense || 0;

  // Trait
  document.getElementById('adjTrait').value = (card.trait === '-' ? '' : card.trait) || '';

  // Text Fields
  document.getElementById('adjCardText').value = card.text.card || '';
  document.getElementById('adjEvolveText').value = card.text.evolve || '';
  document.getElementById('adjSuperEvolveText').value = card.text.superEvolve || '';
  document.getElementById('adjCrestText').value = card.text.crest || '';
  document.getElementById('adjFaithText').value = card.text.faith || '';
}

// Initialize Search on Load
document.addEventListener("DOMContentLoaded", () => {
  fetchOfficialCards().then(() => {
    setupSearch('balanceSearchInput', 'balanceSearchResults');
    setupSearch('workshopSearchInput', 'workshopSearchResults');
  });
});








