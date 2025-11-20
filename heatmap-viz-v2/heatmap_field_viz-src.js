// Spartans Flag Field Heatmap - source (sem dscc.min.js)
(function () {
  // ==========================
  // ESTADO GLOBAL
  // ==========================
  let stylesInjected = false;
  let lastPasses = [];
  let selectedZoneKey = null; // ex: "15to20|HOOK|MIDDLE"

  // ----------------------
  // 0. CSS injetado
  // ----------------------
  function ensureStyles() {
    if (stylesInjected) return;
    stylesInjected = true;

    const style = document.createElement("style");
    style.innerHTML = `
      body {
        background: #081622;
        color: #eee;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      #field {
        max-width: 1100px;
        width: 100%;
        height: auto;
      }

      /* Campo inteiro (verde único) */
      .field-bg {
        fill: #0a8a3e;
        stroke: #ffffff;
        stroke-width: 4;
      }

      .field-bg-overlay {
        fill: #0a8a3e; /* mesmo verde do campo */
        stroke: none;
      }

      /* Zona sem corrida (só linha tracejada) */
      .no-run-line {
        stroke: #ffffff;
        stroke-width: 2;
        stroke-dasharray: 6 6;
      }

      /* Linha do meio (separa esquerda x direita) */
      .mid-line {
        stroke: #ffffff;
        stroke-width: 2;
      }

      /* Marcas de 1 jarda na borda inferior */
      .yard-tick {
        stroke: #ffffff;
        stroke-width: 1;
        stroke-opacity: 0.7;
      }

      /* Grid das zonas */
      .grid-line {
        stroke: rgba(255, 255, 255, 0.25);
        stroke-width: 1;
      }
      .zone-rect {
        stroke: rgba(255, 255, 255, 0.18);
        stroke-width: 1;
        fill: transparent;
      }
      .zone-fill {
        stroke: none;
      }

      /* Pylons dentro das endzones */
      .pylon-rect {
        stroke: #ffffff;
        stroke-width: 1.5;
        fill: transparent;
      }
      .pylon-fill {
        stroke: none;
      }

      .zone-label {
        fill: #ffffff;
        font-size: 11px;
        font-weight: 600;
        text-anchor: middle;
        dominant-baseline: central;
        pointer-events: none;
      }

      /* Célula clicável (hitbox) */
      .zone-hit {
        fill: transparent;
        cursor: pointer;
      }

      /* Linhas dos passes (AirYds) */
      .pass-line {
        stroke-width: 3;
        stroke-linecap: round;
        stroke-opacity: 0.8;
      }
      .pass-start {
        fill: #ffd740;
        stroke: #000000;
        stroke-width: 1;
      }
      .pass-x {
        stroke-width: 2.5;
        stroke-linecap: round;
      }

      /* Linhas de YAC */
      .yac-line {
        stroke: #40c4ff;
        stroke-width: 3;
        stroke-linecap: round;
        stroke-dasharray: 6 4;
        stroke-opacity: 0.8;
      }
      .yac-x {
        stroke: #40c4ff;
        stroke-width: 2.5;
        stroke-linecap: round;
        stroke-opacity: 0.8;
      }
    `;
    document.head.appendChild(style);
  }

  // ==========================
  // 1. FUNÇÃO PRINCIPAL DE DESENHO
  // ==========================
  function renderField() {
    ensureStyles();

    const passes = lastPasses || [];

    // Pega ou cria o SVG
    let svg = document.getElementById("field");
    if (!svg) {
      svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("id", "field");
      svg.style.width = "100%";
      svg.style.height = "100%";
      document.body.appendChild(svg);
    }

    // limpa o SVG
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    // ==========================
    // 2. CONFIG DO CAMPO
    // ==========================

    // 14 colunas, da esquerda (sua endzone) pra direita (endzone adversária)
    const FIELD_ZONES = [
      "SELF_ENDZONE_BACK",
      "SELF_ENDZONE_FRONT",
      "0to5",
      "5to10",
      "10to15",
      "15to20",
      "20to25",
      "25to30",
      "30to35",
      "35to40",
      "40to45",
      "45to50",
      "OPP_ENDZONE_FRONT",
      "OPP_ENDZONE_BACK"
    ];

    // 5 faixas verticais (de cima pra baixo): OUT L / CURL L / HOOK / CURL R / OUT R
    const LANE_ROWS = {
      "OUT|LEFT": 0,
      "CURL|LEFT": 1,
      "HOOK|MIDDLE": 2,
      "CURL|RIGHT": 3,
      "OUT|RIGHT": 4
    };

    // ==========================
    // 3. AGREGAÇÃO (att/comp) p/ heatmap
    // ==========================

    const zoneCounts = {};   // key -> { att, comp }
    const pylonCounts = {};  // key -> { att, comp }
    const pylonCenters = {}; // key -> { cx, cy, x, y, w, h }

    passes.forEach(p => {
      const fz   = String(p.TargetFieldZone || "").trim();
      const zone = String(p.TargetZone || "").trim();
      const side = String(p.TargetZoneSide || "").trim();
      if (!fz || !zone || !side) return;

      const passCompleted = !!p.PassCompleted;
      const key = `${fz}|${zone}|${side}`;

      if (zone === "FRONT_PYLON" || zone === "BACK_PYLON") {
        if (!pylonCounts[key]) pylonCounts[key] = { att: 0, comp: 0 };
        pylonCounts[key].att  += 1;
        pylonCounts[key].comp += passCompleted ? 1 : 0;
      } else {
        if (!zoneCounts[key]) zoneCounts[key] = { att: 0, comp: 0 };
        zoneCounts[key].att  += 1;
        zoneCounts[key].comp += passCompleted ? 1 : 0;
      }
    });

    const maxNormal = Math.max(
      1,
      ...Object.values(zoneCounts).map(z => z.att || 0),
      1
    );
    const maxPylon = Math.max(
      1,
      ...Object.values(pylonCounts).map(z => z.att || 0),
      1
    );

    // ==========================
    // 4. DESENHO DO CAMPO
    // ==========================

    const width = 1000;
    const height = 360;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    const margin = { top: 30, right: 60, bottom: 30, left: 60 };
    const fieldW = width - margin.left - margin.right;
    const fieldH = height - margin.top - margin.bottom;

    const cols = FIELD_ZONES.length; // 14
    const rows = 5;
    const cellW = fieldW / cols;
    const cellH = fieldH / rows;

    const fieldGroup = createGroup(svg, margin.left, margin.top);

    // fundo verde único
    createRect(fieldGroup, 0, 0, fieldW, fieldH, "field-bg");

    // linha do meio (separa esquerda/direita)
    createLine(fieldGroup, fieldW / 2, 0, fieldW / 2, fieldH, "mid-line");

    // grid horizontal
    for (let r = 0; r <= rows; r++) {
      const y = r * cellH;
      createLine(fieldGroup, 0, y, fieldW, y, "grid-line");
    }

    // grid vertical
    for (let c = 0; c <= cols; c++) {
      const x = c * cellW;
      createLine(fieldGroup, x, 0, x, fieldH, "grid-line");
    }

    // linhas tracejadas marcando o fim da zona sem corrida (0–5 e 45–50)
    const idxNoRunLeft = FIELD_ZONES.indexOf("0to5");
    const idxNoRunRight = FIELD_ZONES.indexOf("45to50");

    if (idxNoRunLeft !== -1) {
      const xInnerLeft = (idxNoRunLeft + 1) * cellW;
      createLine(fieldGroup, xInnerLeft, 0, xInnerLeft, fieldH, "no-run-line");
    }
    if (idxNoRunRight !== -1) {
      const xInnerRight = idxNoRunRight * cellW;
      createLine(fieldGroup, xInnerRight, 0, xInnerRight, fieldH, "no-run-line");
    }

    // linhas “de goal” das endzones
    const xSelfGoal =
      (FIELD_ZONES.indexOf("SELF_ENDZONE_FRONT") + 1) * cellW; // entre SELF_ENDZONE_FRONT e 0to5
    const xOppGoal =
      FIELD_ZONES.indexOf("OPP_ENDZONE_FRONT") * cellW; // entre 45to50 e OPP_ENDZONE_FRONT

    createLine(fieldGroup, xSelfGoal, 0, xSelfGoal, fieldH, "mid-line");
    createLine(fieldGroup, xOppGoal, 0, xOppGoal, fieldH, "mid-line");

    // Pequenas marcas de jarda (0..50) na borda inferior (sem endzones)
    const yardTickHeight = 6;
    for (let yard = 0; yard <= 50; yard++) {
      const tX = xSelfGoal + (yard / 5) * cellW;
      if (tX < xSelfGoal - 0.5 || tX > xOppGoal + 0.5) continue;
      createLine(
        fieldGroup,
        tX,
        fieldH,
        tX,
        fieldH - yardTickHeight,
        "yard-tick"
      );
    }

    // desenha cada célula de zona (OUT/CURL/HOOK) com heatmap + click
    for (let c = 0; c < cols; c++) {
      const fieldZone = FIELD_ZONES[c];
      const x = c * cellW;

      for (const laneKey in LANE_ROWS) {
        const rowIndex = LANE_ROWS[laneKey];
        const y = rowIndex * cellH;
        const [zoneType, side] = laneKey.split("|");
        const key = `${fieldZone}|${zoneType}|${side}`;
        const stats = zoneCounts[key] || { att: 0, comp: 0 };
        const att = stats.att || 0;
        const comp = stats.comp || 0;

        // borda da célula
        createRect(fieldGroup, x, y, cellW, cellH, "zone-rect");

        if (att > 0) {
          const intensity = att / maxNormal; // 0..1
          const alpha = 0.2 + 0.7 * intensity; // 0.2..0.9
          const fill = `rgba(220, 40, 40, ${alpha.toFixed(2)})`;

          const rectFill = createRect(fieldGroup, x, y, cellW, cellH, "zone-fill");
          rectFill.setAttribute("fill", fill);

          // posição padrão no centro da célula
          let labelX = x + cellW / 2;
          let labelY = y + cellH / 2;

          // se for endzone, afasta o texto das áreas dos pylons
          if (fieldZone.includes("ENDZONE")) {
            if (zoneType === "OUT") {
              if (side === "LEFT") {
                labelX += cellW * 0.18;
              } else if (side === "RIGHT") {
                labelX -= cellW * 0.18;
              }
            }
            if (rowIndex === 0) {
              labelY += cellH * 0.20;
            } else if (rowIndex === rows - 1) {
              labelY -= cellH * 0.20;
            }
          }

          createText(fieldGroup, labelX, labelY, `${comp}/${att}`, "zone-label");
        }

        // hitbox clicável da zona
        const hitRect = createRect(fieldGroup, x, y, cellW, cellH, "zone-hit");
        hitRect.addEventListener("click", () => {
          const zoneKey = key;
          if (selectedZoneKey === zoneKey) {
            selectedZoneKey = null; // desmarca
          } else {
            selectedZoneKey = zoneKey;
          }
          renderField(); // redesenha com/sem linhas
        });
      }
    }

    // ==========================
    // 5. PYLONS (4 em cada endzone)
    // ==========================

    const pylonSize = cellH * 0.45;
    const pylonMarginY = cellH * 0.1;

    // SELF_ENDZONE: BACK (col 0) e FRONT (col 1)
    drawEndzonePylons("SELF_ENDZONE_BACK", "SELF_ENDZONE_FRONT");
    // OPP_ENDZONE: FRONT (col 12) e BACK (col 13)
    drawEndzonePylons("OPP_ENDZONE_BACK", "OPP_ENDZONE_FRONT");

    function drawEndzonePylons(backZone, frontZone) {
      const idxBack = FIELD_ZONES.indexOf(backZone);
      const idxFront = FIELD_ZONES.indexOf(frontZone);
      if (idxBack === -1 || idxFront === -1) return;

      const xBack = idxBack * cellW + (cellW - pylonSize) / 2;
      const xFront = idxFront * cellW + (cellW - pylonSize) / 2;

      const topY = pylonMarginY;
      const bottomY = fieldH - pylonSize - pylonMarginY;

      // FRONT_PYLON (coluna "front")
      drawPylonCell(frontZone, "FRONT_PYLON", "LEFT", xFront, topY);
      drawPylonCell(frontZone, "FRONT_PYLON", "RIGHT", xFront, bottomY);

      // BACK_PYLON (coluna "back")
      drawPylonCell(backZone, "BACK_PYLON", "LEFT", xBack, topY);
      drawPylonCell(backZone, "BACK_PYLON", "RIGHT", xBack, bottomY);
    }

    function drawPylonCell(fieldZone, zoneType, side, x, y) {
      const key = `${fieldZone}|${zoneType}|${side}`;
      const stats = pylonCounts[key] || { att: 0, comp: 0 };
      const att = stats.att || 0;
      const comp = stats.comp || 0;

      // salva centro do pylon pra desenhar linhas de passe até ele
      pylonCenters[key] = {
        cx: x + pylonSize / 2,
        cy: y + pylonSize / 2,
        x,
        y,
        w: pylonSize,
        h: pylonSize
      };

      // limpa o heatmap embaixo do pylon
      createRect(fieldGroup, x, y, pylonSize, pylonSize, "field-bg-overlay");

      // borda do pylon
      createRect(fieldGroup, x, y, pylonSize, pylonSize, "pylon-rect");

      if (att > 0) {
        const intensity = att / maxPylon;
        const alpha = 0.2 + 0.7 * intensity;
        const fill = `rgba(220, 40, 40, ${alpha.toFixed(2)})`;

        const rectFill = createRect(fieldGroup, x, y, pylonSize, pylonSize, "pylon-fill");
        rectFill.setAttribute("fill", fill);

        createText(
          fieldGroup,
          x + pylonSize / 2,
          y + pylonSize / 2,
          `${comp}/${att}`,
          "zone-label"
        );
      }

      // hitbox clicável do pylon
      const hitRect = createRect(fieldGroup, x, y, pylonSize, pylonSize, "zone-hit");
      hitRect.addEventListener("click", () => {
        if (selectedZoneKey === key) {
          selectedZoneKey = null;
        } else {
          selectedZoneKey = key;
        }
        renderField();
      });
    }

    function clamp(v, min, max) {
      return v < min ? min : v > max ? max : v;
    }

    // Calcula coordenada vertical (Y) de destino (normal ou pylon)
    function getTargetY(p) {
      const fieldZone = String(p.TargetFieldZone || "").trim();
      const zoneType  = String(p.TargetZone || "").trim();
      const side      = String(p.TargetZoneSide || "").trim();
      const key       = `${fieldZone}|${zoneType}|${side}`;

      // Se for pylon, usa o centro salvo
      if (zoneType === "FRONT_PYLON" || zoneType === "BACK_PYLON") {
        const info = pylonCenters[key];
        if (info) return info.cy;
        return null;
      }

      const laneKey   = `${zoneType}|${side}`;
      const laneIndex = LANE_ROWS[laneKey];
      if (laneIndex == null) return null;

      const y = (laneIndex + 0.5) * cellH;
      return y;
    }

    // ==========================
    // 6. LINHAS DOS PASSES (AirYds) + YAC
    //    -> só desenha se houver zona selecionada
    // ==========================

    const hasStartYard = passes.some(p => !isNaN(Number(p.StartYard)));

    if (hasStartYard && selectedZoneKey) {
      const linesGroup = createGroup(fieldGroup, 0, 0);

      const passesForZone = passes.filter(p => {
        const key = `${String(p.TargetFieldZone || "").trim()}|${String(
          p.TargetZone || ""
        ).trim()}|${String(p.TargetZoneSide || "").trim()}`;
        return key === selectedZoneKey;
      });

      passesForZone.forEach((p, index) => {
        const passBy  = String(p.PassBy || "").trim();
        const catchBy = String(p.CatchBy || "").trim();

        const startYard = Number(p.StartYard);
        const airYds    = Number(p.AirYds);
        const yac       = Number(p.YAC);

        if (isNaN(startYard)) return;

        const targetY = getTargetY(p);
        if (targetY == null) return;

        // --- JITTER VERTICAL LEVE POR PASSE (mais espalhado) ---
        // 9 níveis: -amp .. +amp
        const jitterAmp = Math.min(cellH * 0.35, 16);
        const jitterStep = jitterAmp / 4; // [-4..4] * step
        const jitter = ((index % 9) - 4) * jitterStep;

        const passCompleted = !!p.PassCompleted;
        const strokeColor   = passCompleted ? "#00e676" : "#ff5252";
        const baseOpacity   = 0.85;

        const startClamped = clamp(startYard, 0, 50);
        const airEff = isNaN(airYds) ? 0 : airYds;
        let catchYard = startClamped + airEff;
        catchYard = clamp(catchYard, 0, 50);

        const x1 = xSelfGoal + (startClamped / 5) * cellW;
        const y1 = fieldH / 2 + jitter; // início do passe
        const x2 = xSelfGoal + (catchYard / 5) * cellW;
        const y2 = targetY + jitter;     // fim do passe

        const passGroup = createGroup(linesGroup, 0, 0);

        // linha do passe (AirYds)
        const line = createLine(passGroup, x1, y1, x2, y2, "pass-line");
        line.setAttribute("stroke", strokeColor);
        line.setAttribute("stroke-opacity", String(baseOpacity));

        // início
        createCircle(passGroup, x1, y1, 4, "pass-start");

        // X no fim do passe
        const xSize = 7;
        const px1 = createLine(passGroup, x2 - xSize, y2 - xSize, x2 + xSize, y2 + xSize, "pass-x");
        const px2 = createLine(passGroup, x2 - xSize, y2 + xSize, x2 + xSize, y2 - xSize, "pass-x");
        [px1, px2].forEach(seg => {
          seg.setAttribute("stroke", strokeColor);
          seg.setAttribute("stroke-opacity", String(baseOpacity));
        });

        // tooltip do passe
        if (passBy || !isNaN(airYds)) {
          const titleEl = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "title"
          );
          const airStr = !isNaN(airYds) ? `, AirYds: ${airYds}` : "";
          titleEl.textContent = `PassBy: ${passBy || "N/A"}${airStr}`;
          passGroup.appendChild(titleEl);
        }

        // highlight da linha do passe
        passGroup.addEventListener("mouseover", () => {
          line.setAttribute("stroke-opacity", "1");
          px1.setAttribute("stroke-opacity", "1");
          px2.setAttribute("stroke-opacity", "1");
          linesGroup.appendChild(passGroup);
        });
        passGroup.addEventListener("mouseout", () => {
          line.setAttribute("stroke-opacity", String(baseOpacity));
          px1.setAttribute("stroke-opacity", String(baseOpacity));
          px2.setAttribute("stroke-opacity", String(baseOpacity));
        });

        // ---- YAC (se existir) ----
        if (!isNaN(yac) && yac !== 0) {
          let runYard = catchYard + yac;
          runYard = clamp(runYard, 0, 50);

          const x3 = xSelfGoal + (runYard / 5) * cellW;
          const y3 = y2; // mesma linha vertical do alvo, com jitter

          const yacGroup = createGroup(linesGroup, 0, 0);
          const yacAbs = Math.abs(yac);
          const yacOpacity = Math.max(0.3, Math.min(0.9, 0.3 + 0.05 * yacAbs));

          const yLine = createLine(yacGroup, x2, y2, x3, y3, "yac-line");
          yLine.setAttribute("stroke-opacity", String(yacOpacity));

          const ySize = 7;
          const yx1 = createLine(
            yacGroup,
            x3 - ySize,
            y3 - ySize,
            x3 + ySize,
            y3 + ySize,
            "yac-x"
          );
          const yx2 = createLine(
            yacGroup,
            x3 - ySize,
            y3 + ySize,
            x3 + ySize,
            y3 - ySize,
            "yac-x"
          );
          [yx1, yx2].forEach(seg => {
            seg.setAttribute("stroke-opacity", String(yacOpacity));
          });

          const catchLabel = catchBy || "N/A";
          const title2 = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "title"
          );
          title2.textContent = `CatchBy: ${catchLabel}, YAC: ${yac}`;
          yacGroup.appendChild(title2);

          // HOVER DO YAC (ficar mais visível e por cima de tudo)
          yacGroup.addEventListener("mouseover", () => {
            yLine.setAttribute("stroke-opacity", "1");
            yx1.setAttribute("stroke-opacity", "1");
            yx2.setAttribute("stroke-opacity", "1");
            linesGroup.appendChild(yacGroup);
          });
          yacGroup.addEventListener("mouseout", () => {
            yLine.setAttribute("stroke-opacity", String(yacOpacity));
            yx1.setAttribute("stroke-opacity", String(yacOpacity));
            yx2.setAttribute("stroke-opacity", String(yacOpacity));
          });
        }
      });
    }

    // ==========================
    // 7. SETA DE ORIENTAÇÃO
    // ==========================
    const arrowGroup = createGroup(svg, 0, 0);

    const arrowY = margin.top + fieldH + 18; // posição vertical abaixo do campo
    const arrowStartX = margin.left + 40; // ponta esquerda (início)
    const arrowEndX = margin.left + fieldW - 40; // ponta direita (fim)

    // linha da seta (esquerda -> direita)
    createLine(arrowGroup, arrowStartX, arrowY, arrowEndX, arrowY, "mid-line");

    // cabeça da seta apontando para a direita
    const arrowHead = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "polygon"
    );
    arrowHead.setAttribute(
      "points",
      `${arrowEndX},${arrowY} ${arrowEndX - 18},${arrowY - 8} ${
        arrowEndX - 18
      },${arrowY + 8}`
    );
    arrowHead.setAttribute("fill", "#ffffff");
    arrowGroup.appendChild(arrowHead);

    // texto explicando o sentido
    createText(
      arrowGroup,
      (arrowStartX + arrowEndX) / 2,
      arrowY - 10,
      "Sentido do campo",
      "zone-label"
    );

    // ==========================
    // 8. HELPERS SVG
    // ==========================
    function createGroup(parent, tx, ty) {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      if (tx || ty) g.setAttribute("transform", `translate(${tx},${ty})`);
      parent.appendChild(g);
      return g;
    }
    function createLine(parent, x1, y1, x2, y2, cls) {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", x1);
      line.setAttribute("y1", y1);
      line.setAttribute("x2", x2);
      line.setAttribute("y2", y2);
      if (cls) line.setAttribute("class", cls);
      parent.appendChild(line);
      return line;
    }
    function createRect(parent, x, y, w, h, cls) {
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", x);
      rect.setAttribute("y", y);
      rect.setAttribute("width", w);
      rect.setAttribute("height", h);
      if (cls) rect.setAttribute("class", cls);
      parent.appendChild(rect);
      return rect;
    }
    function createText(parent, x, y, text, cls) {
      const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
      t.setAttribute("x", x);
      t.setAttribute("y", y);
      if (cls) t.setAttribute("class", cls);
      t.textContent = text;
      parent.appendChild(t);
      return t;
    }
    function createCircle(parent, cx, cy, r, cls) {
      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("cx", cx);
      c.setAttribute("cy", cy);
      c.setAttribute("r", r);
      if (cls) c.setAttribute("class", cls);
      parent.appendChild(c);
      return c;
    }
  }

  // ==========================
  // 9. INTEGRAÇÃO COM LOOKER
  // ==========================
  function drawViz(data /*, config */) {
    const rows = (data && data.tables && data.tables.DEFAULT) || [];

    const passes = rows.map(row => {
      const fzArr        = row["dim_TargetFieldZone"] || [];
      const zoneArr      = row["dim_TargetZone"] || [];
      const sideArr      = row["dim_TargetZoneSide"] || [];
      const startZoneArr = row["dim_StartFieldZone"] || [];
      const passByArr    = row["dim_PassBy"] || [];
      const catchByArr   = row["dim_CatchBy"] || [];
      const startYArr    = row["met_StartYard"] || [];
      const airArr       = row["met_AirYds"] || [];
      const yacArr       = row["met_YAC"] || [];
      const completedArr = row["met_PassCompleted"] || []; // 0/1

      return {
        TargetFieldZone: String(fzArr[0] ?? ""),
        TargetZone: String(zoneArr[0] ?? ""),
        TargetZoneSide: String(sideArr[0] ?? ""),
        StartFieldZone: String(startZoneArr[0] ?? ""),
        PassBy: String(passByArr[0] ?? ""),
        CatchBy: String(catchByArr[0] ?? ""),
        StartYard: Number(startYArr[0] ?? NaN),
        AirYds: Number(airArr[0] ?? NaN),
        YAC: Number(yacArr[0] ?? NaN),
        PassCompleted: Number(completedArr[0] ?? 0) ? 1 : 0
      };
    });

    lastPasses = passes;
    selectedZoneKey = null; // reset seleção ao mudar filtro
    renderField();
  }

  if (typeof dscc !== "undefined") {
    // Ambiente Looker Studio
    dscc.subscribeToData(drawViz, { transform: dscc.objectTransform });
  } else {
    // Fallback local pra testar em HTML puro
    document.addEventListener("DOMContentLoaded", function () {
      lastPasses = lastPasses = [
        {
          "TargetFieldZone": "10to15",
          "TargetZone": "HOOK",
          "TargetZoneSide": "MIDDLE",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "StartYard": 5.0,
          "AirYds": 0.0,
          "YAC": 0.0,
          "PassCompleted": 0
        },
        {
          "TargetFieldZone": "15to20",
          "TargetZone": "OUT",
          "TargetZoneSide": "LEFT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "StartYard": 5.0,
          "AirYds": 0.0,
          "YAC": 0.0,
          "PassCompleted": 0
        },
        {
          "TargetFieldZone": "SELF_ENDZONE",
          "TargetZone": "HOOK",
          "TargetZoneSide": "MIDDLE",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "StartYard": 2.5,
          "AirYds": 0.0,
          "YAC": 0.0,
          "PassCompleted": 0
        },
        {
          "TargetFieldZone": "35to40",
          "TargetZone": "CURL",
          "TargetZoneSide": "RIGHT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "StartYard": 2.5,
          "AirYds": 0.0,
          "YAC": 0.0,
          "PassCompleted": 0
        },
        {
          "TargetFieldZone": "10to15",
          "TargetZone": "OUT",
          "TargetZoneSide": "LEFT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "CatchBy": "Febiki",
          "StartYard": 5.0,
          "AirYds": 5.0,
          "YAC": 2.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "15to20",
          "TargetZone": "CURL",
          "TargetZoneSide": "LEFT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "CatchBy": "Lacra",
          "StartYard": 12.0,
          "AirYds": 6.0,
          "YAC": 3.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "OPP_ENDZONE_FRONT",
          "TargetZone": "CURL",
          "TargetZoneSide": "RIGHT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "CatchBy": "Munford",
          "StartYard": 21.0,
          "AirYds": 29.0,
          "YAC": 0.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "OPP_ENDZONE_FRONT",
          "TargetZone": "CURL",
          "TargetZoneSide": "LEFT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "CatchBy": "Lacra",
          "StartYard": 40.0,
          "AirYds": 10.0,
          "YAC": 0.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "OPP_ENDZONE_FRONT",
          "TargetZone": "HOOK",
          "TargetZoneSide": "MIDDLE",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "CatchBy": "Febiki",
          "StartYard": 27.0,
          "AirYds": 23.0,
          "YAC": 0.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "OPP_ENDZONE_FRONT",
          "TargetZone": "HOOK",
          "TargetZoneSide": "MIDDLE",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "StartYard": 40.0,
          "AirYds": 0.0,
          "YAC": 0.0,
          "PassCompleted": 0
        },
        {
          "TargetFieldZone": "15to20",
          "TargetZone": "OUT",
          "TargetZoneSide": "LEFT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "CatchBy": "Febiki",
          "StartYard": 5.0,
          "AirYds": 13.0,
          "YAC": 1.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "25to30",
          "TargetZone": "OUT",
          "TargetZoneSide": "RIGHT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "CatchBy": "Lacra",
          "StartYard": 19.0,
          "AirYds": 7.0,
          "YAC": 5.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "35to40",
          "TargetZone": "HOOK",
          "TargetZoneSide": "MIDDLE",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "CatchBy": "Lacra",
          "StartYard": 31.0,
          "AirYds": 7.0,
          "YAC": 5.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "45to50",
          "TargetZone": "CURL",
          "TargetZoneSide": "RIGHT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "CatchBy": "Noturno",
          "StartYard": 43.0,
          "AirYds": 6.0,
          "YAC": 1.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "OPP_ENDZONE_BACK",
          "TargetZone": "CURL",
          "TargetZoneSide": "LEFT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "CatchBy": "Lacra",
          "StartYard": 40.0,
          "AirYds": 10.0,
          "YAC": 0.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "5to10",
          "TargetZone": "CURL",
          "TargetZoneSide": "RIGHT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "CatchBy": "Noturno",
          "StartYard": 5.0,
          "AirYds": 5.0,
          "YAC": 3.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "20to25",
          "TargetZone": "OUT",
          "TargetZoneSide": "LEFT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "CatchBy": "Febiki",
          "StartYard": 13.0,
          "AirYds": 10.0,
          "YAC": 0.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "OPP_ENDZONE_FRONT",
          "TargetZone": "FRONT_PYLON",
          "TargetZoneSide": "LEFT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "CatchBy": "Febiki",
          "StartYard": 23.0,
          "AirYds": 27.0,
          "YAC": 0.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "OPP_ENDZONE_BACK",
          "TargetZone": "BACK_PYLON",
          "TargetZoneSide": "LEFT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "StartYard": 40.0,
          "AirYds": 0.0,
          "YAC": 0.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "15to20",
          "TargetZone": "OUT",
          "TargetZoneSide": "LEFT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "CatchBy": "Febiki",
          "StartYard": 5.0,
          "AirYds": 14.0,
          "YAC": 0.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "20to25",
          "TargetZone": "OUT",
          "TargetZoneSide": "LEFT",
          "PlayType": "PASS",
          "PassBy": "Munford",
          "CatchBy": "Lacra",
          "StartYard": 19.0,
          "AirYds": 4.0,
          "YAC": 9.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "OPP_ENDZONE_FRONT",
          "TargetZone": "CURL",
          "TargetZoneSide": "LEFT",
          "PlayType": "PASS",
          "PassBy": "Munford",
          "StartYard": 33.0,
          "AirYds": 0.0,
          "YAC": 0.0,
          "PassCompleted": 0
        },
        {
          "TargetFieldZone": "5to10",
          "TargetZone": "CURL",
          "TargetZoneSide": "LEFT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "CatchBy": "Lacra",
          "StartYard": 5.0,
          "AirYds": 5.0,
          "YAC": 11.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "OPP_ENDZONE_FRONT",
          "TargetZone": "HOOK",
          "TargetZoneSide": "MIDDLE",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "CatchBy": "Febiki",
          "StartYard": 21.0,
          "AirYds": 29.0,
          "YAC": 0.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "OPP_ENDZONE_FRONT",
          "TargetZone": "HOOK",
          "TargetZoneSide": "MIDDLE",
          "PlayType": "PASS",
          "PassBy": "Febiki",
          "StartYard": 40.0,
          "AirYds": 0.0,
          "YAC": 0.0,
          "PassCompleted": 0
        },
        {
          "TargetFieldZone": "20to25",
          "TargetZone": "OUT",
          "TargetZoneSide": "LEFT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "CatchBy": "Tomás",
          "StartYard": 5.0,
          "AirYds": 16.0,
          "YAC": -1.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "OPP_ENDZONE_FRONT",
          "TargetZone": "FRONT_PYLON",
          "TargetZoneSide": "RIGHT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "StartYard": 20.0,
          "AirYds": 0.0,
          "YAC": 0.0,
          "PassCompleted": 0
        },
        {
          "TargetFieldZone": "30to35",
          "TargetZone": "OUT",
          "TargetZoneSide": "LEFT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "StartYard": 20.0,
          "AirYds": 0.0,
          "YAC": 0.0,
          "PassCompleted": 0
        },
        {
          "TargetFieldZone": "25to30",
          "TargetZone": "OUT",
          "TargetZoneSide": "RIGHT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "StartYard": 20.0,
          "AirYds": 0.0,
          "YAC": 0.0,
          "PassCompleted": 0
        },
        {
          "TargetFieldZone": "15to20",
          "TargetZone": "OUT",
          "TargetZoneSide": "RIGHT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "StartYard": 5.0,
          "AirYds": 0.0,
          "YAC": 0.0,
          "PassCompleted": 0
        },
        {
          "TargetFieldZone": "10to15",
          "TargetZone": "HOOK",
          "TargetZoneSide": "MIDDLE",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "CatchBy": "Pedrinho",
          "StartYard": 5.0,
          "AirYds": 10.0,
          "YAC": 6.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "25to30",
          "TargetZone": "CURL",
          "TargetZoneSide": "LEFT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "CatchBy": "Índio",
          "StartYard": 21.0,
          "AirYds": 4.0,
          "YAC": 1.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "OPP_ENDZONE_BACK",
          "TargetZone": "BACK_PYLON",
          "TargetZoneSide": "RIGHT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "StartYard": 26.0,
          "AirYds": 0.0,
          "YAC": 0.0,
          "PassCompleted": 0
        },
        {
          "TargetFieldZone": "30to35",
          "TargetZone": "CURL",
          "TargetZoneSide": "LEFT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "StartYard": 26.0,
          "AirYds": 0.0,
          "YAC": 0.0,
          "PassCompleted": 0
        },
        {
          "TargetFieldZone": "OPP_ENDZONE_BACK",
          "TargetZone": "CURL",
          "TargetZoneSide": "LEFT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "CatchBy": "Pedrinho",
          "StartYard": 26.0,
          "AirYds": 24.0,
          "YAC": 0.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "OPP_ENDZONE_FRONT",
          "TargetZone": "HOOK",
          "TargetZoneSide": "MIDDLE",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "StartYard": 45.0,
          "AirYds": 0.0,
          "YAC": 0.0,
          "PassCompleted": 0
        },
        {
          "TargetFieldZone": "10to15",
          "TargetZone": "HOOK",
          "TargetZoneSide": "MIDDLE",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "CatchBy": "Febiki",
          "StartYard": 5.0,
          "AirYds": 7.0,
          "YAC": 14.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "OPP_ENDZONE_BACK",
          "TargetZone": "CURL",
          "TargetZoneSide": "RIGHT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "StartYard": 26.0,
          "AirYds": 0.0,
          "YAC": 0.0,
          "PassCompleted": 0
        },
        {
          "TargetFieldZone": "30to35",
          "TargetZone": "OUT",
          "TargetZoneSide": "RIGHT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "StartYard": 26.0,
          "AirYds": 0.0,
          "YAC": 0.0,
          "PassCompleted": 0
        },
        {
          "TargetFieldZone": "35to40",
          "TargetZone": "OUT",
          "TargetZoneSide": "LEFT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "CatchBy": "Febiki",
          "StartYard": 27.0,
          "AirYds": 12.0,
          "YAC": 0.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "OPP_ENDZONE_FRONT",
          "TargetZone": "HOOK",
          "TargetZoneSide": "MIDDLE",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "CatchBy": "Febiki",
          "StartYard": 38.0,
          "AirYds": 12.0,
          "YAC": 0.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "OPP_ENDZONE_FRONT",
          "TargetZone": "CURL",
          "TargetZoneSide": "LEFT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "CatchBy": "Febiki",
          "StartYard": 45.0,
          "AirYds": 10.0,
          "YAC": 0.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "35to40",
          "TargetZone": "HOOK",
          "TargetZoneSide": "LEFT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "StartYard": 5.0,
          "AirYds": 0.0,
          "YAC": 0.0,
          "PassCompleted": 0
        },
        {
          "TargetFieldZone": "20to25",
          "TargetZone": "OUT",
          "TargetZoneSide": "RIGHT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "StartYard": 5.0,
          "AirYds": 0.0,
          "YAC": 0.0,
          "PassCompleted": 0
        },
        {
          "TargetFieldZone": "20to25",
          "TargetZone": "OUT",
          "TargetZoneSide": "LEFT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "CatchBy": "Munford",
          "StartYard": 5.0,
          "AirYds": 19.0,
          "YAC": 0.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "25to30",
          "TargetZone": "OUT",
          "TargetZoneSide": "LEFT",
          "PlayType": "PASS",
          "PassBy": "Munford",
          "CatchBy": "Pedrinho",
          "StartYard": 24.0,
          "AirYds": 5.0,
          "YAC": 3.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "30to35",
          "TargetZone": "HOOK",
          "TargetZoneSide": "MIDDLE",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "CatchBy": "Noturno",
          "StartYard": 32.0,
          "AirYds": 1.0,
          "YAC": 11.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "OPP_ENDZONE_FRONT",
          "TargetZone": "FRONT_PYLON",
          "TargetZoneSide": "RIGHT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "CatchBy": "Munford",
          "StartYard": 44.0,
          "AirYds": 6.0,
          "YAC": 0.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "OPP_ENDZONE_BACK",
          "TargetZone": "BACK_PYLON",
          "TargetZoneSide": "RIGHT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "CatchBy": "Lacra",
          "StartYard": 45.0,
          "AirYds": 5.0,
          "YAC": 0.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "5to10",
          "TargetZone": "OUT",
          "TargetZoneSide": "RIGHT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "CatchBy": "Lacra",
          "StartYard": 5.0,
          "AirYds": 3.0,
          "YAC": 1.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "45to50",
          "TargetZone": "CURL",
          "TargetZoneSide": "LEFT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "StartYard": 9.0,
          "AirYds": 0.0,
          "YAC": 0.0,
          "PassCompleted": 0
        },
        {
          "TargetFieldZone": "15to20",
          "TargetZone": "CURL",
          "TargetZoneSide": "LEFT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "CatchBy": "Lacra",
          "StartYard": 9.0,
          "AirYds": 8.0,
          "YAC": 5.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "20to25",
          "TargetZone": "OUT",
          "TargetZoneSide": "LEFT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "CatchBy": "Febiki",
          "StartYard": 22.0,
          "AirYds": 3.0,
          "YAC": 5.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "OPP_ENDZONE_FRONT",
          "TargetZone": "FRONT_PYLON",
          "TargetZoneSide": "RIGHT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "StartYard": 30.0,
          "AirYds": 0.0,
          "YAC": 0.0,
          "PassCompleted": 0
        },
        {
          "TargetFieldZone": "30to35",
          "TargetZone": "CURL",
          "TargetZoneSide": "LEFT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "CatchBy": "Noturno",
          "StartYard": 30.0,
          "AirYds": 1.0,
          "YAC": 6.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "OPP_ENDZONE_BACK",
          "TargetZone": "BACK_PYLON",
          "TargetZoneSide": "RIGHT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "StartYard": 37.0,
          "AirYds": 0.0,
          "YAC": 0.0,
          "PassCompleted": 0
        },
        {
          "TargetFieldZone": "OPP_ENDZONE_BACK",
          "TargetZone": "HOOK",
          "TargetZoneSide": "MIDDLE",
          "PlayType": "PASS",
          "PassBy": "Munford",
          "StartYard": 37.0,
          "AirYds": 0.0,
          "YAC": 0.0,
          "PassCompleted": 0
        },
        {
          "TargetFieldZone": "20to25",
          "TargetZone": "HOOK",
          "TargetZoneSide": "MIDDLE",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "StartYard": 5.0,
          "AirYds": 0.0,
          "YAC": 0.0,
          "PassCompleted": 0
        },
        {
          "TargetFieldZone": "15to20",
          "TargetZone": "OUT",
          "TargetZoneSide": "RIGHT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "CatchBy": "Lacra",
          "StartYard": 5.0,
          "AirYds": 13.0,
          "YAC": 1.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "OPP_ENDZONE_FRONT",
          "TargetZone": "CURL",
          "TargetZoneSide": "LEFT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "CatchBy": "Febiki",
          "StartYard": 19.0,
          "AirYds": 31.0,
          "YAC": 0.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "OPP_ENDZONE_BACK",
          "TargetZone": "BACK_PYLON",
          "TargetZoneSide": "RIGHT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "CatchBy": "Lacra",
          "StartYard": 45.0,
          "AirYds": 0.0,
          "YAC": 0.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "OPP_ENDZONE_FRONT",
          "TargetZone": "FRONT_PYLON",
          "TargetZoneSide": "RIGHT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "StartYard": 40.0,
          "AirYds": 0.0,
          "YAC": 0.0,
          "PassCompleted": 0
        },
        {
          "TargetFieldZone": "5to10",
          "TargetZone": "OUT",
          "TargetZoneSide": "RIGHT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "CatchBy": "Munford",
          "StartYard": 5.0,
          "AirYds": 5.0,
          "YAC": 0.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "20to25",
          "TargetZone": "OUT",
          "TargetZoneSide": "LEFT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "CatchBy": "Munford",
          "StartYard": 10.0,
          "AirYds": 14.0,
          "YAC": 6.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "OPP_ENDZONE_BACK",
          "TargetZone": "CURL",
          "TargetZoneSide": "LEFT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "StartYard": 30.0,
          "AirYds": 0.0,
          "YAC": 0.0,
          "PassCompleted": 0
        },
        {
          "TargetFieldZone": "35to40",
          "TargetZone": "OUT",
          "TargetZoneSide": "LEFT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "StartYard": 30.0,
          "AirYds": 0.0,
          "YAC": 0.0,
          "PassCompleted": 0
        },
        {
          "TargetFieldZone": "35to40",
          "TargetZone": "OUT",
          "TargetZoneSide": "RIGHT",
          "PlayType": "PASS",
          "PassBy": "Munford",
          "CatchBy": "Febiki",
          "StartYard": 30.0,
          "AirYds": 9.0,
          "YAC": 8.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "OPP_ENDZONE_FRONT",
          "TargetZone": "CURL",
          "TargetZoneSide": "RIGHT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "CatchBy": "Munford",
          "StartYard": 47.0,
          "AirYds": 3.0,
          "YAC": 0.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "OPP_ENDZONE_BACK",
          "TargetZone": "BACK_PYLON",
          "TargetZoneSide": "LEFT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "CatchBy": "Lacra",
          "StartYard": 45.0,
          "AirYds": 5.0,
          "YAC": 0.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "25to30",
          "TargetZone": "CURL",
          "TargetZoneSide": "LEFT",
          "PlayType": "PASS",
          "PassBy": "Kadu",
          "CatchBy": "Lacra",
          "StartYard": 15.0,
          "AirYds": 12.0,
          "YAC": 0.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "OPP_ENDZONE_BACK",
          "TargetZone": "BACK_PYLON",
          "TargetZoneSide": "RIGHT",
          "PlayType": "PASS",
          "PassBy": "Mamão",
          "CatchBy": "Kadu",
          "StartYard": 45.0,
          "AirYds": 5.0,
          "YAC": 0.0,
          "PassCompleted": 1
        },
        {
          "TargetFieldZone": "OPP_ENDZONE_FRONT",
          "TargetZone": "FRONT_PYLON",
          "TargetZoneSide": "LEFT",
          "PlayType": "PASS",
          "PassBy": "Munford",
          "StartYard": 40.0,
          "AirYds": 0.0,
          "YAC": 0.0,
          "PassCompleted": 0
        }
      ];
      
      renderField();
    });
  }
})();