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
ctx.imageSmoothingEnabled = true; // This will be reset on canvas resize, so we re-apply it
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
const illustratorInput = document.getElementById("illustratorName");
const textInputs = {
  card: document.getElementById("cardText"),
  evolve: document.getElementById("evolveText"),
  superEvolve: document.getElementById("superEvolveText"),
  crest: document.getElementById("crestText"),
  faith: document.getElementById("faithText")
};
const textOrder = [
  { key: "card", box: null },
  { key: "evolve", box: "evolve" },
  { key: "superEvolve", box: "superEvolve" },
  { key: "crest", box: "crest" },
  { key: "faith", box: "faith" }
];


// --- Crest and Faith uploads ---
const crestArtUpload = document.getElementById("crestArtUpload");
const faithArtUpload = document.getElementById("faithArtUpload");

const mainArtTitle = document.getElementById("mainArtTitle");

let uploadedArt = null;
let crestArt = null;
let faithArt = null;

// --- OPTIMIZATION: Cache for drawScaledNumber ---
// Prevents re-calculating font sizes for the same numbers
const numberRenderCache = {};

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
  const cacheKey = `${text}|${maxFontSize}|${maxWidth}|${letterSpacing}|${yNudgeCoefficient}`;
  
  // OPTIMIZATION: Check cache first
  if (numberRenderCache[cacheKey]) {
    const cached = numberRenderCache[cacheKey];
    ctx.font = cached.font;
    ctx.letterSpacing = cached.letterSpacing;
    ctx.textAlign = "center";
    ctx.fillText(text, x, y + cached.yNudge);
    ctx.letterSpacing = "0px";
    return;
  }
  
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

  // OPTIMIZATION: Store result in cache
  numberRenderCache[cacheKey] = {
    font: ctx.font,
    letterSpacing: `${letterSpacing}px`,
    yNudge: yNudge
  };
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
  });
});


// --- Text highlight keywords ---
const HIGHLIGHT_KEYWORDS = [
  "Fanfare","Last Words","Engage","Strike","Storm","Ambush","Bane","Drain","Ward","Rush","Overflow",
  "On Spellboost","Clash","Mode","Intimidate","Aura","Barrier","Fuse","Fused","Necromancy","Combo",
  "Earth Rite","Rally","Countdown","Reanimate","Earth Sigil","Crystallize","Crystallized","Invoke",
  "Invoked","Sanguine","Skybound Art","Super Skybound Art","Maneuver","Maneuverable","Maneuvering",
  "Enhance","Union Burst","Accelerate","Burial Rite"
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


// --- REFACTOR: NEW Function to calculate text layout ---
// This is the "Dry Run". It calculates all positions and heights.
// It returns a "layout" object that the draw function can use,
// so we *never* have to measure text twice.
function calculateTextLayout(key) {
  const textValue = textInputs[key].value.trim();
  if (!textValue) return null;

  // --- Constants ---
  const isSpecialBox = (key !== "card");
  const specialLineHeightBefore = 30;
  const specialLineHeightAfter = 20;
  const cardLineHeightBefore = 30;
  const cardLineHeightAfter = 40;
  const textStartX = 769 + 30; // boxX + 30
  const wrapLimitX = 1716;
  const lineHeight = 50;
  const baseFont = "33px 'Memento'";

  // --- Tokenizing ---
  let processedText = textValue.replace(HIGHLIGHT_REGEX, "<K>$&</K>");
  if (key === "evolve" && processedText.startsWith("Evolve")) {
    processedText = processedText.replace(/^Evolve/, "<K>Evolve</K>");
  }
  if (key === "superEvolve" && processedText.startsWith("Super-Evolve")) {
    processedText = processedText.replace(/^Super-Evolve/, "<K>Super-Evolve</K>");
  }
  const tokenizerRegex = /(\*\*|_|<c>|<\/c>|<K>|<\/K>|----------|\n|\s+)/g;
  const allTokens = processedText.split(tokenizerRegex).filter(Boolean);

  // --- Layout Calculation ---
  let lines = []; // This will store our "draw" commands
  let currentX = textStartX;
  let currentY = lineHeight; // Start at first line's Y
  let currentLine = [];
  let style = { bold: false, italic: false, isKeyword: false };
  let lastTokenWasDivider = false;

  const setStyleFont = () => {
    const weight = style.bold || style.isKeyword ? "bold " : "";
    const styleStr = style.italic ? "italic " : "";
    ctx.font = `${weight}${styleStr}${baseFont}`;
  };

  const pushLine = () => {
    if (currentLine.length > 0) lines.push(currentLine);
    currentLine = [];
  };

  for (const token of allTokens) {
    // Update style state for measurement
    if (token === "**") { style.bold = !style.bold; continue; }
    if (token === "_") { style.italic = !style.italic; continue; }
    if (token === "<K>") { style.isKeyword = true; continue; }
    if (token === "</K>") { style.isKeyword = false; continue; }
    if (["<c>", "</c>"].includes(token)) continue; // Color tokens are handled in draw pass

    // Handle explicit line breaks
    if (token === "\n") {
      pushLine();
      currentY += lastTokenWasDivider ? (isSpecialBox ? specialLineHeightAfter : cardLineHeightAfter) : lineHeight;
      currentX = textStartX;
      lastTokenWasDivider = false;
      continue;
    }
    
    // Handle dividers
    if (token.trim() === "----------") {
      if (currentX > textStartX) { // Only add a line if not at the start
        pushLine();
        currentY += isSpecialBox ? specialLineHeightBefore : cardLineHeightBefore;
      }
      lines.push({ type: "divider", y: currentY }); // Add divider command
      currentX = textStartX;
      lastTokenWasDivider = true;
      continue;
    }
    
    lastTokenWasDivider = false; // Reset on any other token

    // Measure token and check for wrapping
    setStyleFont();
    const tokenWidth = ctx.measureText(token).width;
    
    if (currentX > textStartX && currentX + tokenWidth > wrapLimitX && token.trim() !== "") {
      pushLine();
      currentY += lineHeight;
      currentX = textStartX;
    }

    // Don't add leading spaces on a new line
    if (currentX === textStartX && token.trim() === "") continue;

    currentLine.push({
      token,
      x: currentX,
      y: currentY,
      style: { ...style } // Copy current style
    });

    currentX += tokenWidth;
    if (style.italic) currentX += 3; // Add extra space for italic slant
  }
  
  // Push any remaining tokens on the last line
  pushLine();

  // --- Calculate final heights ---
  const totalTextHeight = currentY; // The Y position of the *last* line
  const stretchCount = Math.max(0, Math.ceil((totalTextHeight / lineHeight)) - 1);
  
  let boxHeight = 0;
  if (assets.boxes[key === "card" ? null : key]) {
      const topHeight = (key === "crest" || key === "faith") ? 107 : 40;
      const bottomHeight = (key ==="crest" || key === "faith") ? 28 : 40;
      // This is a dummy calculation just to get the box height.
      // We use a fixed middle height from the asset.
      const middleHeight = (key === "crest" || key === "faith") ? 38 : (330 - topHeight - bottomHeight); // 330 is fallback img height
      const stretchAmount = stretchCount * 50;
      boxHeight = topHeight + middleHeight + bottomHeight + stretchAmount;
  }

  return {
    lines, // The array of all draw commands
    stretchCount,
    // The total height this block will occupy
    totalHeight: Math.max(boxHeight, totalTextHeight + 40) // Add padding
  };
}

// --- REFACTOR: NEW Function to calculate total canvas size ---
// This runs the layout calculation for all text blocks
// and determines the final canvas height and stretch.
async function calculateCanvasDimensions() {
  const boxX = 768;
  const startY = 246;
  const baseHeight = 1080;
  
  let layouts = {}; // Store results
  let calculatedTotalY = startY;

  for (const { key } of textOrder) {
      const layout = calculateTextLayout(key); // Run the dry run
      if (layout) {
          layouts[key] = layout;
          calculatedTotalY += layout.totalHeight - 10;
      }
  }

  // --- Calculate stretch amount for the *main box* ---
  const illustrator = illustratorInput.value.trim();
  const showBottomBar = wordCountCheckbox.checked || !!illustrator;

  const defaultStretchThreshold = 900;
  const bottomBarStretchThreshold = 825;
  const stretchThreshold = showBottomBar ? bottomBarStretchThreshold : defaultStretchThreshold;
  
  const stretchPixels = Math.max(0, calculatedTotalY - stretchThreshold);
  const newHeight = baseHeight + stretchPixels;
  
  // Calculate dynamic Y position for illustrator/word count
  const bottomBarBaseY = 911;
  const dynamicBottomBarY = bottomBarBaseY + stretchPixels;

  return {
    layouts, // All pre-calculated text layouts
    newHeight,
    stretchPixels,
    dynamicBottomBarY,
    illustrator,
    showBottomBar
  };
}


// --- REFACTOR: Modified drawTextBlock ---
// This is now the "Wet Run". It *only* draws.
// It receives the pre-calculated layout object.
async function drawTextBlock(key, box, startY, layout) {
  if (!layout) return 0; // No text, do nothing

  // --- Constants ---
  const isSpecialBox = (key !== "card");
  const specialDividerYOffset = 25;
  const cardDividerYOffset = 15;
  const textStartX = 769 + 30; // boxX + 30
  const baseFont = "33px 'Memento'";

  // --- Draw the stretchable box ---
  const boxImg = box ? await getImage(assets.boxes[box]) : null;
  const boxHeight = boxImg
    ? drawStretchBox(boxImg, 768, startY, layout.stretchCount, key)
    : 0;

  // --- Draw the text ---
  ctx.textAlign = "left";
  ctx.shadowColor = "black";
  ctx.shadowBlur = 4;

  // Get the correct divider image
  const dividerToUse = await getImage(
    assets.boxes[key === "card" ? "divider" : "small_divider"]
  );

  let wetStyle = { bold: false, italic: false, color: null, isKeyword: false };

  const setWetStyle = (style) => {
    const weight = style.bold || style.isKeyword ? "bold " : "";
    const styleStr = style.italic ? "italic " : "";
    ctx.font = `${weight}${styleStr}${baseFont}`;
    ctx.fillStyle = wetStyle.color || (style.isKeyword ? "#f3d87d" : "#efeee9");
  };
  
  // This is now a simple loop, no more logic/measurement
  for (const line of layout.lines) {
    // Handle dividers
    if (line.type === "divider") {
      const yOffset = isSpecialBox ? specialDividerYOffset : cardDividerYOffset;
      ctx.drawImage(dividerToUse, 768, startY + line.y - yOffset);
      continue;
    }
    
    // Handle text lines
    // (Reset color at the start of each line)
    wetStyle.color = null; 
    for (const item of line) {
        // Tokenizer logic for colors (not part of measurement)
        if (item.token === "<c>") { wetStyle.color = "#f3d87d"; continue; }
        if (item.token === "</c>") { wetStyle.color = null; continue; }

        setWetStyle(item.style);
        ctx.fillText(item.token, item.x, startY + item.y);
    }
  }
  
  // Return the pre-calculated height
  return layout.totalHeight;
}


// --- REFACTOR: Heavily modified drawCard function ---
async function drawCard() {
  // --- STEP 1: Calculate all layouts and canvas size ---
  // This one function now does all the "thinking".
  const { 
    layouts, 
    newHeight, 
    stretchPixels, 
    dynamicBottomBarY, 
    illustrator, 
    showBottomBar 
  } = await calculateCanvasDimensions();

  // --- STEP 2: Resize canvas (if needed) and clear ---
  if (canvas.height !== newHeight) {
    canvas.height = newHeight;
  }
  if (canvas.width !== 1920) {
    canvas.width = 1920;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // !! IMPORTANT: Re-apply context properties reset by resize
  ctx.imageSmoothingEnabled = true; 

  // --- STEP 3: Draw Background ---
  const bg = await getImage(assets.backgrounds[classSelect.value]);
  // 2-Slice Background Draw
  const slicePointY = 1000;
  const topHeight = Math.min(slicePointY, bg.height);
  const bottomPartHeight = bg.height - topHeight;

  ctx.drawImage(bg, 0, 0, bg.width, topHeight, 0, 0, bg.width, topHeight);
  if (bottomPartHeight > 0) {
    const newBottomHeight = bottomPartHeight + stretchPixels;
    ctx.drawImage(bg, 0, topHeight, bg.width, bottomPartHeight, 0, topHeight, bg.width, newBottomHeight);
  }

  // --- STEP 4: Draw Main Art ---
  if (uploadedArt) {
    const s = previewState.main;
    const dWidth = uploadedArt.width * s.scale;
    const dHeight = uploadedArt.height * s.scale;

    // Use createImageBitmap for high-quality resize
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

  // --- STEP 5: Draw Frame & Stats (under text box) ---
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
  ctx.drawImage(gem, 398, 863);
  ctx.drawImage(frame, 48, 153);
  
  // Draw Name, Trait, Stats
  ctx.shadowColor = "black";
  ctx.shadowBlur = 6;
  ctx.fillStyle = "#efeee9";
  ctx.font = "56px 'Memento'";
  ctx.textAlign = "left";
  const nameText = nameInput.value.trim() || "Unnamed Card";
  ctx.fillText(nameText, 163, 150);

  // Secondary name (on frame)
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

  // Trait
  ctx.font = "33px 'Memento'";
  ctx.textAlign = "left";
  const traitText = traitInput.value.trim() || "—";
  ctx.fillText(traitText, 1306, 147);

  // Numbers (Cost, Atk, Def)
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
  ctx.letterSpacing = "0px"; // Reset
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; // Reset

  // --- STEP 6: Draw Main Text Box (Blur + Frame) ---
  const textBoxX = 722;
  const textBoxY = 206;
  const boxAsset = showBottomBar ? assets.boxes.text_box : assets.boxes.text_box_no_bottom;
  const mainBoxImg = await getImage(boxAsset);

  const dynamicBoxWidth = mainBoxImg.width;
  const dynamicBoxHeight = mainBoxImg.height + stretchPixels; 

  // Dynamic Blur
  const offCanvas = document.createElement("canvas");
  offCanvas.width = dynamicBoxWidth;
  offCanvas.height = dynamicBoxHeight;
  const offCtx = offCanvas.getContext("2d");
  
  offCtx.drawImage(canvas, textBoxX, textBoxY, dynamicBoxWidth, dynamicBoxHeight, 0, 0, dynamicBoxWidth, dynamicBoxHeight);
  offCtx.filter = "blur(5px)";
  offCtx.drawImage(offCanvas, 0, 0);
  ctx.drawImage(offCanvas, textBoxX, textBoxY);
  
  // Draw stretched box frame on top of blur
  // OPTIMIZATION: We use `stretchPixels` directly to get the count
  const stretchCount = stretchPixels / 50;
  drawStretchBox(mainBoxImg, textBoxX, textBoxY, stretchCount, "main");

  // --- STEP 7: Draw All Text Blocks ---
  const boxX = 768;
  const startY = 246;
  let currentY = startY;
  
  for (const { key, box } of textOrder) {
    const layout = layouts[key]; // Get pre-calculated layout
    if (!layout) continue;
    
    // Pass the layout to the draw function
    const blockHeight = await drawTextBlock(key, box, currentY, layout);
    
    // Draw Crest/Faith art (this logic is fine)
    const isCrest = key === "crest";
    const isFaith = key ==="faith";
    if (isCrest || isFaith) {
      const iconX = boxX + 120;
      const iconY = currentY + 32;
      const iconImg = isCrest ? crestArt : faithArt;
      const nameField = document.getElementById(isCrest ? "crestName" : "faithName");
      const nameValue = nameField ? nameField.value.trim() : "";

      if (iconImg && (isCrest || isFaith)) {
        const s = previewState[isCrest ? "crest" : "faith"];
        const dWidth = iconImg.width * s.scale;
        const dHeight = iconImg.height * s.scale;

        const bmp = await createImageBitmap(iconImg, 0, 0, iconImg.width, iconImg.height, {
          resizeWidth: Math.round(dWidth),
          resizeHeight: Math.round(dHeight),
          resizeQuality: "high"
        });
  
        ctx.save();
        ctx.beginPath();
        ctx.arc(iconX + ICON_W / 2, iconY + ICON_H / 2, ICON_W / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        
        ctx.drawImage(bmp, iconX + s.tx, iconY + s.ty);
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
    // Increment Y position for next block
    currentY += blockHeight - 10;
  }

  // --- STEP 8: Draw Bottom Bar Text (Token, WC, Illustrator) ---
  ctx.shadowColor = "transparent"; 
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#efeee9";
  
  if (tokenCheckbox.checked) {
    ctx.font = "28px 'NotoSans'";
    ctx.textAlign = "right";
    ctx.fillText("*This is a token card.", 1788, canvas.height - 55);
  }
  
  if (illustrator) {
    ctx.font = "28px 'NotoSans'";
    ctx.textAlign = "left";
    ctx.fillText(`Illustrator: ${illustrator}`, 790, dynamicBottomBarY);
  }
  if (wordCountCheckbox.checked) {
    const allText = Object.values(textInputs).map(t => t.value).join(" ");
    const wordCount = allText.split(/\s+/).filter(w => w.length).length;
    ctx.font = "28px 'NotoSans'";
    ctx.textAlign = "right";
    ctx.fillText(`Word count: ${wordCount}`, 1730, dynamicBottomBarY);
  }
}

// --- Live updates with Debouncing (Unchanged, this is good) ---
let redrawDebounceTimer = null;
function debouncedDrawCard() {
  clearTimeout(redrawDebounceTimer);
  redrawDebounceTimer = setTimeout(() => {
    safeDrawCard();
  }, 250); // 250ms delay
}

// --- Prevent overlapping draws (Unchanged, this is good) ---
let isDrawing = false;
async function safeDrawCard() {
  if (isDrawing) return;
  isDrawing = true;
  try { await drawCard(); } catch (err) { console.error("drawCard error:", err); } finally { isDrawing = false; }
}

/***********************
  PREVIEW COLUMN HANDLERS (clamped)
  (No significant changes here, this part is efficient)
***********************/
const MAIN_MASK_W = 450, MAIN_MASK_H = 560;
const MAIN_ART_X = 200, MAIN_ART_Y = 350;
const ICON_W = 56, ICON_H = 57;
let artX = MAIN_ART_X, artY = MAIN_ART_Y, artW = MAIN_MASK_W, artH = MAIN_MASK_H;
window.ICON_W = ICON_W; window.ICON_H = ICON_H;

const mainPreviewCanvas = document.getElementById("mainPreviewCanvas");
const mainPreviewCtx = mainPreviewCanvas ? mainPreviewCanvas.getContext("2d") : null;
if (mainPreviewCtx) mainPreviewCtx.imageSmoothingEnabled = true;
const mainZoomSlider = document.getElementById("mainZoomSlider");
const crestPreviewCanvas = document.getElementById("crestPreviewCanvas");
const crestPreviewCtx = crestPreviewCanvas ? crestPreviewCanvas.getContext("2d") : null;
if (crestPreviewCtx) crestPreviewCtx.imageSmoothingEnabled = true;
const crestZoomSlider = document.getElementById("crestZoomSlider");
const faithPreviewCanvas = document.getElementById("faithPreviewCanvas");
const faithPreviewCtx = faithPreviewCanvas ? faithPreviewCanvas.getContext("2d") : null;
if (faithPreviewCtx) faithPreviewCtx.imageSmoothingEnabled = true;
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
  s.minScale = scale; // <-- Store the minimum scale
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
    return;
  }
  uploadedArt = s.img;
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
}


function updateAllPreviews() {
  clampPan(previewState.main);
  clampPan(previewState.crest);
  clampPan(previewState.faith);

  syncMainToGlobals();
  syncIconToGlobals("crest");
  syncIconToGlobals("faith");

  // This function *only* draws the small previews, not the main card
  drawPreviewCanvas(mainPreviewCtx, mainPreviewCanvas, previewState.main, "rect");
  drawPreviewCanvas(crestPreviewCtx, crestPreviewCanvas, previewState.crest, "circle");
  drawPreviewCanvas(faithPreviewCtx, faithPreviewCanvas, previewState.faith, "circle");
  
  // Trigger the main card redraw
  debouncedDrawCard();
}

/* ---------- Upload handlers ---------- */
if (artInput) {
  artInput.addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      if (mainArtTitle) mainArtTitle.textContent = "Card Art"; // Reset on cancel
      return;
    }
    if (mainArtTitle) mainArtTitle.textContent = file.name; // <-- THIS LINE IS ADDED

    try {
      const img = await loadImageFromFile(file);
      previewState.main.img = img;
      fitImageToMask(img, previewState.main);
      if (mainZoomSlider) {
        const min = previewState.main.minScale;
        const max = min * 5; // 500% zoom from fit
        mainZoomSlider.min = min;
        mainZoomSlider.max = max;
        mainZoomSlider.step = (max - min) / 100; // 100 steps in slider
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
        const max = min * 8; // 800% zoom from fit for icons
        crestZoomSlider.min = min;
        crestZoomSlider.max = max;
        crestZoomSlider.step = (max - min) / 100;
        crestZoomSlider.value = previewState.crest.scale;
      }
      updateAllPreviews();
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
        const max = min * 8; // 800% zoom from fit for icons
        faithZoomSlider.min = min;
        faithZoomSlider.max = max;
        faithZoomSlider.step = (max - min) / 100;
        faithZoomSlider.value = previewState.faith.scale;
      }
      updateAllPreviews();
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
    updateAllPreviews(); // This now triggers the main redraw
  });

  function stopDrag(e) {
    dragging = false;
  }
  canvasEl.addEventListener("pointerup", stopDrag);
  canvasEl.addEventListener("pointerleave", stopDrag);

  // wheel zoom
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
    const cx = ev.clientX - rect.left;
    const cy = ev.clientY - rect.top;
    const imgSpaceX = (cx - state.tx) / oldScale;
    const imgSpaceY = (cy - state.ty) / oldScale;
    state.scale = newScale;
    state.tx = cx - imgSpaceX * newScale;
    state.ty = cy - imgSpaceY * newScale;
    clampPan(state);
    if (sliderEl) sliderEl.value = state.scale;
    updateAllPreviews();
  }, { passive: false });

  // slider
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
      updateAllPreviews();
    });
  }
}

attachPanAndZoom(mainPreviewCanvas, previewState.main, mainZoomSlider);
attachPanAndZoom(crestPreviewCanvas, previewState.crest, crestZoomSlider);
attachPanAndZoom(faithPreviewCanvas, previewState.faith, faithZoomSlider);

// --- Text Formatting Toolbar (Unchanged) ---
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
    } else {
      const before = value.slice(0, start);
      const after = value.slice(start);
      textarea.value = before + openTag + closeTag + after;
      const caret = before.length + openTag.length;
      textarea.setSelectionRange(caret, caret);
    }
    textarea.focus();
    // Manually trigger our debounced draw
    debouncedDrawCard(); 
  });
});

// --- Download & Preview Buttons (Unchanged, they are good) ---
document.getElementById("downloadBtn").addEventListener("click", async () => {
  const btn = document.getElementById("downloadBtn");
  const originalText = btn.textContent;
  btn.textContent = "Generating...";
  btn.disabled = true;

  try {
    await safeDrawCard(); // Run the safe draw
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
    await safeDrawCard(); // Run the safe draw
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


// --- CLEANUP: Moved from index.html ---
// This code now runs after the whole script is loaded.
document.addEventListener('DOMContentLoaded', () => {
  const cardTypeSelect = document.getElementById('cardType');
  const statExtraFields = document.getElementById('statExtraFields');

  function toggleStatsVisibility() {
    if (!cardTypeSelect || !statExtraFields) return;
    const value = cardTypeSelect.value.toLowerCase();
    statExtraFields.style.visibility = (value === 'follower') ? 'visible' : 'hidden';
  }

  // Initial setup
  toggleStatsVisibility();
  cardTypeSelect.addEventListener('change', toggleStatsVisibility);
  
  // Add all input event listeners
  [
    nameInput, traitInput, classSelect, raritySelect, costInput, attackInput, defenseInput,
    tokenCheckbox, wordCountCheckbox, autoDividerCheckbox,
    illustratorInput, crestNameInput, faithNameInput,
    ...Object.values(textInputs)
  ].forEach(el => {
    if (el) {
      el.addEventListener("input", debouncedDrawCard);
    }
  });

  // initial draw on font load
  document.fonts.ready.then(() => {
      // Small delay to ensure fonts are *actually* rendered
      setTimeout(safeDrawCard, 50); 
  });
});
