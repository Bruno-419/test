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
 * @param {string} text - The number to draw (e.g., "100").
 * @param {number} x - The center x-coordinate.
 * @param {number} y - The baseline y-coordinate.
 * @param {number} maxFontSize - The font size to start at (e.g., 80).
 * @param {number} maxWidth - The maximum pixel width before shrinking.
 * @param {string} fontFace - The font family (e.g., 'Sv_numbers').
 * @param {number} letterSpacing - The letter spacing to apply.
 * @param {number} yNudgeCoefficient - The factor used to calculate the vertical correction (e.g., 0.4).
 */
function drawScaledNumber(text, x, y, maxFontSize, maxWidth, fontFace, letterSpacing = 0, yNudgeCoefficient) {
  ctx.textAlign = "center";
  ctx.letterSpacing = `${letterSpacing}px`; // Apply your letter spacing

  let fontSize = maxFontSize;
  ctx.font = `${fontSize}px '${fontFace}'`;
  let textWidth = ctx.measureText(text).width;

  // This loop shrinks the font size until the text fits
  while (textWidth > maxWidth && fontSize > 10) { // 10px is a safe minimum
    fontSize -= 2; // Shrink by 2px
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
    const cursorPos = textarea.selectionStart;
    const value = textarea.value;
    const before = value.slice(0, cursorPos);
    const after = value.slice(cursorPos);
    if (before.endsWith("\n\n")) {
      const newValue = before.slice(0, -1) + "----------\n" + after;
      textarea.value = newValue;
      textarea.selectionStart = textarea.selectionEnd = cursorPos + 10;
    }
  });
});


// --- Text highlight keywords ---
const HIGHLIGHT_KEYWORDS = [
  "Fanfare","Last Words","Engage","Strike","Storm","Ambush","Bane","Drain","Ward","Rush",
  "Overflow","Evolve","Super-Evolve","Spellboost","Clash","Mode","Intimidate","Aura","Barrier",
  "Fuse","Necromancy","Combo","Earth Rite","Rally","Countdown","Reanimate","Earth Sigil",
  "Crystallize","Invoke","Invoked","Sanguine","Skybound Art","Super Skybound Art","Maneuver",
  "Enhance","Union Burst","Accelerate"
];
const HIGHLIGHT_REGEX = new RegExp(`\\b(${HIGHLIGHT_KEYWORDS.join("|")})\\b`, "g");

// --- drawStretchBox (used by text boxes) ---
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
    // Slicing points for the main text box
    topHeight = 60; // The top decorative border
    bottomHeight = 120; // The bottom area with the gradient/space for illustrator
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

// --- NEW function to calculate height without drawing ---
async function calculateTextBlockHeight(key, startY) {
  const textValue = textInputs[key].value.trim();
  if (!textValue) return 0;

  // Shared constants for calculation
  const isSpecialBox = (key !== "card");
  const specialLineHeightBefore = 30;
  const specialLineHeightAfter = 20;

  // --- NEW: Add custom heights for the main card box divider ---
  const cardLineHeightBefore = 30; // Was lineHeight (50)
  const cardLineHeightAfter = 40;  // Was lineHeight (50)
  // --- END NEW ---
  
  const textStartX = 769 + 30; // boxX + 30
  const wrapLimitX = 1716;
  const lineHeight = 50;
  const baseFont = "33px 'Memento'";
  
  const processedText = textValue.replace(HIGHLIGHT_REGEX, "<K>$&</K>");
  const tokenizerRegex = /(\*\*|_|<c>|<\/c>|<K>|<\/K>|----------|\n|\s+)/g;
  const allTokens = processedText.split(tokenizerRegex).filter(Boolean);

  // Dry Run: Calculate layout and total height
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
      // --- MODIFIED: Use cardLineHeightAfter for main box ---
      totalHeight += dryLastTokenWasDivider ? (isSpecialBox ? specialLineHeightAfter : cardLineHeightAfter) : lineHeight;
      // --- END MODIFICATION ---
      currentX = textStartX;
      dryLastTokenWasDivider = false;
      continue;
    }
    
    if (token.trim() === "----------") {
      if (currentX > textStartX) {
        // --- MODIFIED: Use cardLineHeightBefore for main box ---
        totalHeight += isSpecialBox ? specialLineHeightBefore : cardLineHeightBefore;
        // --- END MODIFICATION ---
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
  
  // Calculate the height of the box itself
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

  return Math.max(boxHeight, totalHeight + 40); // Return the greater of the two heights
}

// --- drawTextBlock ---
async function drawTextBlock(key, box, x, startY) {
  const textValue = textInputs[key].value.trim();
  if (!textValue) return 0;

  // --- MODIFICATION: Define shared constants here ---
  const isSpecialBox = (key !== "card");
  const specialLineHeightBefore = 30; // Space *before* divider
  const specialLineHeightAfter = 20;  // Space *after* divider
  const specialDividerYOffset = 25;   // Nudge divider up

  // --- NEW: Add constants for the main card box ---
  const cardLineHeightBefore = 30; // Was 50 (lineHeight)
  const cardLineHeightAfter = 40;  // Was 50 (lineHeight)
  const cardDividerYOffset = 15;   // Was 10
  // --- END NEW ---

  // --- Common setup ---
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  const textStartX = x + 30;
  const wrapLimitX = 1716;
  const lineHeight = 50;
  const baseFont = "33px 'Memento'";

  // --- Pre-process text to wrap keywords in special tags for easier tokenizing ---
  const processedText = textValue.replace(HIGHLIGHT_REGEX, "<K>$&</K>");

  // --- Tokenizer that understands all formatting markers ---
  const tokenizerRegex = /(\*\*|_|<c>|<\/c>|<K>|<\/K>|----------|\n|\s+)/g;
  const allTokens = processedText.split(tokenizerRegex).filter(Boolean);

  // --- Dry Run: Calculate layout and total height ---
  let totalHeight = lineHeight; // Start with one line
  let currentX = textStartX;
  let dryStyle = { bold: false, italic: false, isKeyword: false };
  let dryLastTokenWasDivider = false;

  const setDryFont = () => {
    const weight = dryStyle.bold || dryStyle.isKeyword ? "bold " : "";
    const style = dryStyle.italic ? "italic " : "";
    ctx.font = `${weight}${style}${baseFont}`;
  };

  for (const token of allTokens) {
    // Update style state for measurement
    if (token === "**") { dryStyle.bold = !dryStyle.bold; continue; }
    if (token === "_") { dryStyle.italic = !dryStyle.italic; continue; }
    if (token === "<K>") { dryStyle.isKeyword = true; continue; }
    if (token === "</K>") { dryStyle.isKeyword = false; continue; }
    if (["<c>", "</c>"].includes(token)) continue;

    // Handle explicit line breaks
    if (token === "\n") {
      if (dryLastTokenWasDivider) {
        // --- MODIFIED: Use cardLineHeightAfter for main box ---
        totalHeight += isSpecialBox ? specialLineHeightAfter : cardLineHeightAfter;
      } else {
        totalHeight += lineHeight;
      }
      currentX = textStartX;
      dryLastTokenWasDivider = false;
      continue;
    }
    
    // Handle dividers
    if (token.trim() === "----------") {
      if (currentX > textStartX) { // Only add a line if not at the start
        // --- MODIFIED: Use cardLineHeightBefore for main box ---
        totalHeight += isSpecialBox ? specialLineHeightBefore : cardLineHeightBefore;
      }
      currentX = textStartX;
      dryLastTokenWasDivider = true;
      continue;
    }
    
    dryLastTokenWasDivider = false; // Reset on any other token

    // Measure token and check for wrapping
    setDryFont();
    const tokenWidth = ctx.measureText(token).width;
    
    if (currentX > textStartX && currentX + tokenWidth > wrapLimitX && token.trim() !== "") {
      totalHeight += lineHeight;
      currentX = textStartX;
    }

    // Don't add width for leading spaces on a new line
    if (currentX === textStartX && token.trim() === "") continue;

    currentX += tokenWidth;
    if (dryStyle.italic) currentX += 3; // Add extra space for italic slant
  }
  // --- End of Dry Run ---

  // --- Draw the stretchable box based on the calculated line count ---
  const boxImg = box ? await getImage(assets.boxes[box]) : null;
  const stretchCount = Math.max(0, (totalHeight / lineHeight) - 1);

  const boxHeight = boxImg
    ? drawStretchBox(boxImg, x, startY, stretchCount, key)
    : 0;

  // --- Wet Run: Actually draw the text onto the canvas ---
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
    // Update style state
    if (token === "**") { wetStyle.bold = !wetStyle.bold; continue; }
    if (token === "_") { wetStyle.italic = !wetStyle.italic; continue; }
    if (token === "<c>") { wetStyle.color = "#f3d87d"; continue; }
    if (token === "</c>") { wetStyle.color = null; continue; }
    if (token === "<K>") { wetStyle.isKeyword = true; continue; }
    if (token === "</K>") { wetStyle.isKeyword = false; continue; }
    
    // --- MODIFICATION: Updated \n handler ---
    // Handle line breaks
    if (token === "\n") {
      if (lastTokenWasDivider) {
        // This is the \n *after* a divider
        textY += isSpecialBox ? specialLineHeightAfter : cardLineHeightAfter; // MODIFIED
      } else {
        // This is a normal \n
        textY += lineHeight;
      }
      xPos = textStartX;
      lastTokenWasDivider = false; // Reset flag
      continue;
    }
    // --- END MODIFICATION ---

    // --- MODIFICATION: Updated "----------" handler ---
    // Handle divider
    if (token.trim() === "----------") {
      // 1. Handle line break *before* divider (if not at start of line)
      if (xPos > textStartX) {
        textY += isSpecialBox ? specialLineHeightBefore : cardLineHeightBefore; // MODIFIED
      }
      
      // 2. Draw the divider (nudged up)
      const yOffset = isSpecialBox ? specialDividerYOffset : cardDividerYOffset; // MODIFIED
      ctx.drawImage(dividerToUse, x, textY - yOffset);
      
      // 3. Reset X position and set flag
      xPos = textStartX;
      lastTokenWasDivider = true; // Set flag
      continue;
    }
    // --- END MODIFICATION ---
    
    // --- MODIFICATION: Reset flag on any other token ---
    lastTokenWasDivider = false;
    // --- END MODIFICATION ---

    setWetStyle();
    const tokenWidth = ctx.measureText(token).width;

    // Check for wrapping
    if (xPos > textStartX && xPos + tokenWidth > wrapLimitX && token.trim() !== "") {
      textY += lineHeight;
      xPos = textStartX;
    }
    
    // Don't draw leading spaces on a new line
    if (xPos === textStartX && token.trim() === "") continue;

    ctx.fillText(token, xPos, textY);
    xPos += tokenWidth;
    if (wetStyle.italic) xPos += 0;
  }
  
  return Math.max(boxHeight, textY - startY + 40);
}


// --- drawCard ---
async function drawCard() {
  const [bg, gem, frame] = await Promise.all([
    getImage(assets.backgrounds[classSelect.value]),
    getImage(assets.gems[classSelect.value]),
    getImage(
      assets[typeSelect.value.toLowerCase()][
        ["bronze", "silver", "gold", "legendary"].indexOf(
          raritySelect.value.toLowerCase()
        )
      ]
    )
  ]);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

  // === Masked Main Art ===
  if (uploadedArt) {
    const maskX = MAIN_ART_X;
    const maskY = MAIN_ART_Y;
    const maskW = MAIN_MASK_W;
    const maskH = MAIN_MASK_H;
    ctx.save();
    ctx.beginPath();
    ctx.rect(maskX, maskY, maskW, maskH);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(uploadedArt, artX, artY, artW, artH);
    ctx.restore();
  }

  ctx.drawImage(gem, 398, 863);
  ctx.drawImage(frame, 48, 153);

  // --- TEXT DRAWING LOGIC ---
  const boxX = 768;
  const startY = 246;
  const textOrder = [
    { key: "card", box: null },
    { key: "evolve", box: "evolve" },
    { key: "superEvolve", box: "superEvolve" },
    { key: "crest", box: "crest" },
    { key: "faith", box: "faith" }
  ];

  // --- STEP 1: Calculate total content height first ---
  let calculatedTotalY = startY;
  for (const { key } of textOrder) {
      if (!textInputs[key].value.trim()) continue;
      const blockHeight = await calculateTextBlockHeight(key);
      calculatedTotalY += blockHeight - 10;
  }

  // --- STEP 2: Draw the main text box with calculated stretch ---
  const illustrator = document.getElementById("illustratorName").value.trim();
  const showBottomBar = wordCountCheckbox.checked || illustrator;

  // --- MODIFICATION: Set different thresholds ---
  // This is the original threshold for the box *without* the bottom bar
  const defaultStretchThreshold = 900;
  // This is the new, *lower* threshold for the box *with* the bottom bar
  const bottomBarStretchThreshold = 825; // You can adjust this value (e.g., 800, 825)
  
  const stretchThreshold = showBottomBar ? bottomBarStretchThreshold : defaultStretchThreshold;
  // --- END MODIFICATION ---
  
  const stretchPixels = Math.max(0, calculatedTotalY - stretchThreshold);
  const stretchCount = stretchPixels / 50;
  const boxAsset = showBottomBar ? assets.boxes.text_box : assets.boxes.text_box_no_bottom;
  const mainBoxImg = await getImage(boxAsset);

  // --- NEW: DYNAMIC BLUR LOGIC ADDED HERE ---
  const textBoxX = 722; // The X position of the main text box graphic
  const textBoxY = 206; // The Y position of the main text box graphic
  
  // Calculate the final, stretched dimensions of the box
  const dynamicBoxWidth = mainBoxImg.width;
  const dynamicBoxHeight = mainBoxImg.height + stretchPixels;

  // Create an off-screen canvas for the blur effect
  const offCanvas = document.createElement("canvas");
  offCanvas.width = dynamicBoxWidth;
  offCanvas.height = dynamicBoxHeight;
  const offCtx = offCanvas.getContext("2d");

  // Draw the section of the *background* (bg) that is behind the text box
  offCtx.drawImage(bg, textBoxX, textBoxY, dynamicBoxWidth, dynamicBoxHeight, 0, 0, dynamicBoxWidth, dynamicBoxHeight);
  
  // Apply blur to the off-screen canvas
  offCtx.filter = "blur(5px)";
  offCtx.drawImage(offCanvas, 0, 0); // Re-draw on itself to apply the filter
  
  // Draw the blurred patch onto the *main* canvas
  ctx.drawImage(offCanvas, textBoxX, textBoxY);
  // --- END NEW BLUR LOGIC ---

  drawStretchBox(mainBoxImg, textBoxX, textBoxY, stretchCount, "main");
  
  // --- STEP 3: Now, draw all the text blocks on top ---
  let currentY = startY;
  for (const { key, box } of textOrder) {
    if (!textInputs[key].value.trim()) continue;
    const blockHeight = await drawTextBlock(key, box, boxX, currentY);
    const isCrest = key === "crest";
    const isFaith = key === "faith";
    if (isCrest || isFaith) {
      const t = getIconTransform(isCrest ? "crest" : "faith");
      const iconX = boxX + 120;
      const iconY = currentY + 32;
      const iconImg = isCrest ? crestArt : faithArt;
      const nameField = document.getElementById(isCrest ? "crestName" : "faithName");
      const nameValue = nameField ? nameField.value.trim() : "";

      if (iconImg && t) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(iconX + ICON_W / 2, iconY + ICON_H / 2, ICON_W / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(t.img, iconX + t.tx, iconY + t.ty, t.img.width * t.scale, t.img.height * t.scale);
        ctx.restore();
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

  // --- REMAINDER OF THE DRAWING LOGIC (NAMES, STATS, ETC) ---
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
    ctx.fillText("*This is a token card.", 1788, 1025);
  }

  // --- MODIFICATION: Calculate dynamic Y for bottom bar text ---
  // 'stretchPixels' was calculated in STEP 2 and is in scope here.
  const bottomBarBaseY = 911;
  const dynamicBottomBarY = bottomBarBaseY + stretchPixels;
  // --- END MODIFICATION ---

  if (illustrator) {
    ctx.font = "28px 'NotoSans'";
    ctx.textAlign = "left";
    // Use the new dynamic Y coordinate
    ctx.fillText(`Illustrator: ${illustrator}`, 790, dynamicBottomBarY);
  }
  if (wordCountCheckbox.checked) {
    const allText = Object.values(textInputs).map(t => t.value).join(" ");
    const wordCount = allText.split(/\s+/).filter(w => w.length).length;
    ctx.font = "28px 'NotoSans'";
    ctx.textAlign = "right";
    // Use the new dynamic Y coordinate
    ctx.fillText(`Word count: ${wordCount}`, 1730, dynamicBottomBarY);
  }
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0;
}

// --- Live updates with Debouncing ---
let redrawDebounceTimer = null;
function debouncedDrawCard() {
  clearTimeout(redrawDebounceTimer);
  redrawDebounceTimer = setTimeout(() => {
    safeDrawCard();
  }, 250); // 250ms delay before redrawing
}

[
  nameInput, traitInput, classSelect, raritySelect, costInput, attackInput, defenseInput,
  tokenCheckbox, wordCountCheckbox,
  ...Object.values(textInputs),
  document.getElementById("illustratorName"),
  document.getElementById("crestName"),
  document.getElementById("faithName")
].forEach(el => el?.addEventListener("input", debouncedDrawCard));

// --- Prevent overlapping draws ---
let isDrawing = false;
async function safeDrawCard() {
  if (isDrawing) return;
  isDrawing = true;
  try { await drawCard(); } catch (err) { console.error("drawCard error:", err); } finally { isDrawing = false; }
}

/***********************
  PREVIEW COLUMN HANDLERS (clamped)
***********************/
const MAIN_MASK_W = 450, MAIN_MASK_H = 560;
const MAIN_ART_X = 200, MAIN_ART_Y = 350;
const ICON_W = 56, ICON_H = 57;
let artX = MAIN_ART_X, artY = MAIN_ART_Y, artW = MAIN_MASK_W, artH = MAIN_MASK_H;
window.ICON_W = ICON_W; window.ICON_H = ICON_H;

const mainPreviewCanvas = document.getElementById("mainPreviewCanvas");
const mainPreviewCtx = mainPreviewCanvas ? mainPreviewCanvas.getContext("2d") : null;
const mainZoomSlider = document.getElementById("mainZoomSlider");
const crestPreviewCanvas = document.getElementById("crestPreviewCanvas");
const crestPreviewCtx = crestPreviewCanvas ? crestPreviewCanvas.getContext("2d") : null;
const crestZoomSlider = document.getElementById("crestZoomSlider");
const faithPreviewCanvas = document.getElementById("faithPreviewCanvas");
const faithPreviewCtx = faithPreviewCanvas ? faithPreviewCanvas.getContext("2d") : null;
const faithZoomSlider = document.getElementById("faithZoomSlider");
const artInput = document.getElementById("artUpload");
const crestInput = document.getElementById("crestArtUpload");
const faithInput = document.getElementById("faithArtUpload");

const previewState = {
  main: { img: null, scale: 1, tx: 0, ty: 0, maskW: MAIN_MASK_W, maskH: MAIN_MASK_H },
  crest: { img: null, scale: 1, tx: 0, ty: 0, maskW: ICON_W, maskH: ICON_H },
  faith: { img: null, scale: 1, tx: 0, ty: 0, maskW: ICON_W, maskH: ICON_H }
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
  s.tx = (s.maskW - img.width * scale) / 2;
  s.ty = (s.maskH - img.height * scale) / 2;
}

// clamp pan so that the image always covers the mask (or is centered if smaller)
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

  if (!img) {
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
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
  ctx.lineWidth = 1;
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

function getIconTransform(which) {
  const s = previewState[which];
  if (!s || !s.img) return null;
  return {
    img: s.img,
    scale: s.scale,
    tx: s.tx,
    ty: s.ty,
    width: s.img.width * s.scale,
    height: s.img.height * s.scale
  };
}

function updateAll() {
  clampPan(previewState.main);
  clampPan(previewState.crest);
  clampPan(previewState.faith);

  syncMainToGlobals();
  syncIconToGlobals("crest");
  syncIconToGlobals("faith");

  //safeDrawCard();

  drawPreviewCanvas(mainPreviewCtx, mainPreviewCanvas, previewState.main, "rect");
  drawPreviewCanvas(crestPreviewCtx, crestPreviewCanvas, previewState.crest, "circle");
  drawPreviewCanvas(faithPreviewCtx, faithPreviewCanvas, previewState.faith, "circle");
}

/* ---------- Upload handlers ---------- */
if (artInput) {
  artInput.addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const img = await loadImageFromFile(file);
      previewState.main.img = img;
      fitImageToMask(img, previewState.main);
      if (mainZoomSlider) mainZoomSlider.value = previewState.main.scale;
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
      if (crestZoomSlider) crestZoomSlider.value = previewState.crest.scale;
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
      if (faithZoomSlider) faithZoomSlider.value = previewState.faith.scale;
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
    const p = getEventPos(e, canvasEl);
    const dx = p.x - lastX, dy = p.y - lastY;
    lastX = p.x; lastY = p.y;
    state.tx += dx; state.ty += dy;
    clampPan(state);
    updateAll();
  });

  function stopDrag(e) {
    dragging = false;
    //if (canvasEl.releasePointerCapture) try { canvasEl.releasePointerCapture(e.pointerId); } catch (err) {}
  }
  canvasEl.addEventListener("pointerup", stopDrag);
  canvasEl.addEventListener("pointerleave", stopDrag);

  // wheel zoom
  canvasEl.addEventListener("wheel", (ev) => {
    if (!state.img) return;
    ev.preventDefault();
    const delta = ev.deltaY > 0 ? -0.05 : 0.05;
    const oldScale = state.scale;
    const newScale = Math.max(0.1, state.scale + delta);
    const rect = canvasEl.getBoundingClientRect();
    const cx = ev.clientX - rect.left;
    const cy = ev.clientY - rect.top;
    const imgSpaceX = (cx - state.tx) / oldScale;
    const imgSpaceY = (cy - state.ty) / oldScale;
    state.scale = newScale;
    state.tx = cx - imgSpaceX * newScale;
    state.ty = cy - imgSpaceY * newScale;
    clampPan(state);
    if (sliderEl) sliderEl.value = state.scale;
    updateAll();
  }, { passive: false });

  // slider
  if (sliderEl) {
    sliderEl.addEventListener("input", (ev) => {
      if (!state.img) return;
      const newScale = parseFloat(ev.target.value);
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

// --- Text Formatting Toolbar (Bold / Italic / Color) ---
// --- Toolbar: Bold / Italic / Color (uses ** / _ / <c> tags) ---
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
    else return;

    // If text selected -> wrap (toggle removal if already wrapped exactly)
    if (start !== end) {
      const before = value.slice(0, start);
      const after = value.slice(end);
      const currentlyWrapped = before.endsWith(openTag) && after.startsWith(closeTag);
      if (currentlyWrapped) {
        // remove wrapping
        const newBefore = before.slice(0, before.length - openTag.length);
        const newAfter = after.slice(closeTag.length);
        textarea.value = newBefore + selected + newAfter;
        textarea.setSelectionRange(newBefore.length, newBefore.length + selected.length);
      } else {
        // wrap (nesting is allowed)
        textarea.value = before + openTag + selected + closeTag + after;
        // select the inner text (optional); place caret after wrapped text
        textarea.setSelectionRange(start + openTag.length, end + openTag.length);
      }
      textarea.focus();
      textarea.dispatchEvent(new Event("input"));
      return;
    }

    // No selection -> insert open+close and position caret between them
    const before = value.slice(0, start);
    const after = value.slice(start);
    textarea.value = before + openTag + closeTag + after;
    const caret = before.length + openTag.length;
    textarea.setSelectionRange(caret, caret);
    textarea.focus();
    textarea.dispatchEvent(new Event("input"));
  });
});





// initial draw
document.fonts.ready.then(() => setTimeout(updateAll, 60));

// REPLACE the existing downloadBtn listener with this:
document.getElementById("downloadBtn").addEventListener("click", async () => { // <-- Made async
  
  // Add a "loading" state to the button
  const btn = document.getElementById("downloadBtn");
  const originalText = btn.textContent;
  btn.textContent = "Generating...";
  btn.disabled = true;

  try {
    // 1. Run the high-quality draw function ONCE.
    await drawCard(); 
    
    // 2. Continue with the download as normal.
    const canvas = document.getElementById("previewCanvas");
    const link = document.createElement("a");
    link.download = `${(nameInput.value.trim() || "card")}.png`;
    link.href = canvas.toDataURL("image/png", 1.0); // full quality
    link.click();
    
  } catch (err) {
    console.error("Download failed:", err);
    alert("Error: Could not save image. Try again.");
  } finally {
    // 3. Restore the button
    btn.textContent = originalText;
    btn.disabled = false;
  }
});

// ADD THIS ENTIRE NEW BLOCK AT THE END OF THE FILE

document.getElementById("previewBtn").addEventListener("click", async () => {
  // Add a "loading" state to the button
  const btn = document.getElementById("previewBtn");
  const originalText = btn.textContent;
  btn.textContent = "Generating...";
  btn.disabled = true;

  try {
    // 1. Run the high-quality draw function ONCE.
    await drawCard(); 
    
    // 2. Get the image data from the hidden canvas.
    const canvas = document.getElementById("previewCanvas");
    const dataUrl = canvas.toDataURL("image/png", 1.0);
    
    // 3. Open a new tab and display the image.
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
    // 4. Restore the button
    btn.textContent = originalText;
    btn.disabled = false;
  }
});
