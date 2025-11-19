// --- Assets ---
const assets = {
  follower: [
    "assets/follower/follower_bronze.png",
    "assets/follower/follower_silver.png",
    "assets/follower/follower_gold.png",
    "assets/follower/follower_legendary.png"
  ],
  spell: [
    "assets/spell/spell_bronze.png",
    "assets/spell/spell_silver.png",
    "assets/spell/spell_gold.png",
    "assets/spell/spell_legendary.png"
  ],
  amulet: [
    "assets/amulet/amulet_bronze.png",
    "assets/amulet/amulet_silver.png",
    "assets/amulet/amulet_gold.png",
    "assets/amulet/amulet_legendary.png"
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

// --- Helpers ---
function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

// --- NEW: Sharpening Helper Function ---
// Applies a convolution filter to sharpen the image data on a canvas context
function applySharpen(ctx, w, h, amount) {
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  const copy = new Uint8ClampedArray(data); // Copy for reference

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
       const i = (y * w + x) * 4;
       
       // Neighbors for convolution
       const up = ((y - 1) * w + x) * 4;
       const down = ((y + 1) * w + x) * 4;
       const left = (y * w + (x - 1)) * 4;
       const right = (y * w + (x + 1)) * 4;

       // Simple Sharpen Kernel Logic:
       // pixel = pixel + amount * (4 * pixel - up - down - left - right)
       // This adds the "edges" back into the image to crisp it up.
       
       for (let c = 0; c < 3; c++) { // RGB channels
         const edge = 4 * copy[i + c] 
                      - copy[up + c] 
                      - copy[down + c] 
                      - copy[left + c] 
                      - copy[right + c];
         
         data[i + c] = copy[i + c] + amount * edge;
       }
       // Alpha channel (data[i+3]) is left alone
    }
  }
  ctx.putImageData(imgData, 0, 0);
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

  if (key === "crest" || key === "faith") {
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
  const tokenizerRegex = /(\*\*|_|<c>|<\/c>|<K>|<\/K>|----------|\n|\s+)/g;
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
    const tokenWidth = ctx.measureText(token).width;
    
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
      const topHeight = (key === "crest" || key === "faith") ? 107 : 40;
      const bottomHeight = (key === "crest" || key === "faith") ? 28 : 40;
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

  const tokenizerRegex = /(\*\*|_|<c>|<\/c>|<K>|<\/K>|----------|\n|\s+)/g;
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
    const tokenWidth = ctx.measureText(token).width;
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

  ctx.textAlign = "left";
  ctx.shadowColor = "black";
  ctx.shadowBlur = 4;

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
    const tokenWidth = ctx.measureText(token).width;
    if (xPos > textStartX && xPos + tokenWidth > wrapLimitX && token.trim() !== "") {
      textY += lineHeight;
      xPos = textStartX;
    }
    if (xPos === textStartX && token.trim() === "") continue;
    ctx.fillText(token, xPos, textY);
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
    { key: "faith", box: "faith" }
  ];
  const boxX = 768;
  const startY = 246;

  const currentCardType = typeSelect.value.toLowerCase();
  const isFollower = (currentCardType === 'follower');

  let calculatedTotalY = startY;
  for (const { key } of textOrder) {
      const textValue = textInputs[key].value.trim();
      if (!textValue) continue; 

      const isEvolveBlock = (key === 'evolve' || key === 'superEvolve');
      if (isEvolveBlock && !isFollower) {
          continue;
      }
      const blockHeight = await calculateTextBlockHeight(key); 
      calculatedTotalY += blockHeight - 10;
  }

  const illustrator = document.getElementById("illustratorName").value.trim();
  const showBottomBar = wordCountCheckbox.checked || illustrator;

  const defaultStretchThreshold = 900;
  const bottomBarStretchThreshold = 825;
  const stretchThreshold = showBottomBar ? bottomBarStretchThreshold : defaultStretchThreshold;
  
  const stretchPixels = Math.max(0, calculatedTotalY - stretchThreshold);
  const stretchCount = stretchPixels / 50;
  const boxAsset = showBottomBar ? assets.boxes.text_box : assets.boxes.text_box_no_bottom;
  
  const mainBoxImg = await getImage(boxAsset);
  
  const baseHeight = 1080; 
  const baseWidth = 1920;  
  const newHeight = baseHeight + stretchPixels;

  if (canvas.height !== newHeight) {
    canvas.height = newHeight;
  }
  if (canvas.width !== baseWidth) {
    canvas.width = baseWidth;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  ctx.imageSmoothingEnabled = true;
  // === FIX: Set quality again after resize ===
  ctx.imageSmoothingQuality = "high";

  const bg = await getImage(assets.backgrounds[classSelect.value]);
  const slicePointY = 1000;
  const topHeight = Math.min(slicePointY, bg.height);
  const bottomPartHeight = bg.height - topHeight;

  ctx.drawImage(bg, 0, 0, bg.width, topHeight, 0, 0, bg.width, topHeight);

  if (bottomPartHeight > 0) {
    const newBottomHeight = bottomPartHeight + stretchPixels;
    ctx.drawImage(bg, 0, topHeight, bg.width, bottomPartHeight, 0, topHeight, bg.width, newBottomHeight);
  }

  const [gem, frame] = await Promise.all([
    getImage(assets.gems[classSelect.value]),
    getImage(
      assets[typeSelect.value.toLowerCase()][
        ["bronze", "silver", "gold", "legendary"].indexOf(
          raritySelect.value.toLowerCase()
        )
      ]
    )
  ]);

  // === Masked Main Art ===
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
    if (isEvolveBlock && !isFollower) {
      continue;
    }

    const blockHeight = await drawTextBlock(key, box, boxX, currentY);
    const isCrest = key === "crest";
    const isFaith = key === "faith";
    if (isCrest || isFaith) {
      const iconX = boxX + 120;
      const iconY = currentY + 32;
      const iconImg = isCrest ? crestArt : faithArt;
      const nameField = document.getElementById(isCrest ? "crestName" : "faithName");
      const nameValue = nameField ? nameField.value.trim() : "";

      if (iconImg && (isCrest || isFaith)) {
        const s = previewState[isCrest ? "crest" : "faith"];
        
        // 1. Calculate dimensions
        const dWidth = iconImg.width * s.scale;
        const dHeight = iconImg.height * s.scale;

        // 2. Create high-quality bitmap (as before)
        const bmp = await createImageBitmap(iconImg, 0, 0, iconImg.width, iconImg.height, {
          resizeWidth: Math.round(dWidth),
          resizeHeight: Math.round(dHeight),
          resizeQuality: "high"
        });

        // 3. Create a temporary offscreen canvas to apply the sharpening filter
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = Math.round(dWidth);
        tempCanvas.height = Math.round(dHeight);
        const tempCtx = tempCanvas.getContext('2d');
        
        // Draw the bitmap to the temp canvas
        tempCtx.drawImage(bmp, 0, 0);
        
        // 4. Apply Manual Sharpening
        // Strength of 0.15 is "slightly less blurry" without being over-fried.
        applySharpen(tempCtx, tempCanvas.width, tempCanvas.height, 0.15);

        // 5. Draw the sharpened result to the main canvas
        ctx.save();
        ctx.beginPath();
        ctx.arc(iconX + ICON_W / 2, iconY + ICON_H / 2, ICON_W / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        
        // Draw from temp canvas (which accounts for s.tx/ty shifts in the draw call)
        // Wait, s.tx/ty shifts the *position* of the image relative to the circle mask.
        // The bitmap contains the *whole* scaled image.
        // So we draw the temp canvas at the offset location.
        ctx.drawImage(tempCanvas, iconX + s.tx, iconY + s.ty);
        
        ctx.restore();
        bmp.close();
      }
      
      const defaultName = isCrest ? "Crest" : "Faith";
      const displayName = nameValue || defaultName;
      if (displayName) {
        ctx.save();
        ctx.font = "33px 'Memento'";
        ctx.fillStyle = "#f3d87d";
        ctx.textAlign = "left";
        ctx.shadowColor = "black";
        ctx.shadowBlur = 4;
        ctx.fillText(displayName, iconX + ICON_W + 17, iconY + ICON_H / 2 + 10);
        ctx.restore();
      }
    }
    currentY += blockHeight - 10;
  }

  ctx.shadowColor = "black";
  ctx.shadowBlur = 6;
  ctx.fillStyle = "#efeee9";
  ctx.font = "56px 'Memento'";
  ctx.textAlign = "left";
  const nameText = nameInput.value.trim() || "Unnamed Card";
  ctx.fillText(nameText, 163, 150);

  let secondaryFontSize = 42;
  ctx.font = `${secondaryFontSize}px 'Memento'`;
  let textWidth = ctx.measureText(nameText).width;
  const maxWidth = 363;
  const baseY = 331;
  const offsetPerStep = -0.75;
  let shrinkSteps = 0;
  while (textWidth > maxWidth && secondaryFontSize > 2) {
    secondaryFontSize -= 2;
    shrinkSteps++;
    ctx.font = `${secondaryFontSize}px 'Memento'`;
    textWidth = ctx.measureText(nameText).width;
  }
  const secondaryNameY = baseY + (shrinkSteps * offsetPerStep);
  ctx.textAlign = "center";
  ctx.fillText(nameText, 455, secondaryNameY);

  ctx.font = "33px 'Memento'";
  ctx.textAlign = "left";
  const traitText = traitInput.value.trim() || "—";
  ctx.fillText(traitText, 1306, 147);

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

  if (tokenCheckbox.checked) {
    ctx.font = "28px 'NotoSans'";
    ctx.textAlign = "right";
    ctx.fillText("*This is a token card.", 1788, canvas.height - 55);
  }

  const bottomBarBaseY = 911;
  const dynamicBottomBarY = bottomBarBaseY + stretchPixels;

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
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0;
}

/***********************
  PREVIEW COLUMN HANDLERS (clamped)
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

document.getElementById("downloadBtn").addEventListener("click", async () => { 
  const btn = document.getElementById("downloadBtn");
  const originalText = btn.textContent;
  btn.textContent = "Generating...";
  btn.disabled = true;

  try {
    await drawCard(); 
    
    const canvas = document.getElementById("previewCanvas");
    const link = document.createElement("a");
    link.download = `${(nameInput.value.trim() || "card")}.png`;
    link.href = canvas.toDataURL("image/png", 1.0); 
    link.click();
    
  } catch (err) {
    console.error("Download failed:", err);
    alert("Error: Could not save image. Try again.");
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
});

document.getElementById("previewBtn").addEventListener("click", async () => {
  const btn = document.getElementById("previewBtn");
  const originalText = btn.textContent;
  btn.textContent = "Generating...";
  btn.disabled = true;

  try {
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
