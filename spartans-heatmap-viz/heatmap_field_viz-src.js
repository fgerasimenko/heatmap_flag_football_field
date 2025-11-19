// Spartans Flag Field Heatmap - viz source (sem dscc.min.js ainda)
(function () {
  // ----------------------
  // 0. Inject CSS once
  // ----------------------
  let stylesInjected = false;
  function ensureStyles() {
    if (stylesInjected) return;
    stylesInjected = true;

    const style = document.createElement('style');
    style.innerHTML = `
      svg {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .field-bg {
        fill: #1b5e20;
      }
      .mid-line {
        stroke: #ffffff;
        stroke-width: 3;
      }
      .grid-line {
        stroke: #ffffff;
        stroke-width: 1;
        stroke-opacity: 0.2;
      }
      .no-run-line {
        stroke: #ffffff;
        stroke-width: 2;
        stroke-dasharray: 4 4;
        stroke-opacity: 0.8;
      }
      .zone-rect {
        fill: none;
        stroke: rgba(255,255,255,0.25);
        stroke-width: 1;
      }
      .zone-fill {
        /* fill set dynamically */
      }
      .pylon-rect {
        fill: none;
        stroke: rgba(255,255,255,0.7);
        stroke-width: 1.5;
      }
      .pylon-fill {
        /* fill set dynamically */
      }
      .zone-label {
        fill: #ffffff;
        font-size: 11px;
        text-anchor: middle;
        dominant-baseline: middle;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
  }

  // ----------------------
  // 1. Render function
  // ----------------------
  function renderField(passes) {
    ensureStyles();

    // Get or create SVG container
    let svg = document.getElementById("field");
    if (!svg) {
      svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("id", "field");
      svg.style.width = "100%";
      svg.style.height = "100%";
      document.body.appendChild(svg);
    }

    // Clear previous content
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    // ==========================
    // 2. FIELD CONFIG
    // ==========================
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

    const LANE_ROWS = {
      "OUT|LEFT": 0,
      "CURL|LEFT": 1,
      "HOOK|MIDDLE": 2,
      "CURL|RIGHT": 3,
      "OUT|RIGHT": 4
    };

    // ==========================
    // 3. AGGREGATION (att/comp)
    // ==========================
    const zoneCounts = {};   // key -> { att, comp }
    const pylonCounts = {};  // key -> { att, comp }

    (passes || []).forEach(p => {
      const fz   = String(p.TargetFieldZone || "").trim();
      const zone = String(p.TargetZone || "").trim();
      const side = String(p.TargetZoneSide || "").trim();
      if (!fz || !zone || !side) return;

      const completed = !!p.PassCompleted;
      const key = `${fz}|${zone}|${side}`;

      if (zone === "FRONT_PYLON" || zone === "BACK_PYLON") {
        if (!pylonCounts[key]) pylonCounts[key] = { att: 0, comp: 0 };
        pylonCounts[key].att += 1;
        if (completed) pylonCounts[key].comp += 1;
      } else {
        if (!zoneCounts[key]) zoneCounts[key] = { att: 0, comp: 0 };
        zoneCounts[key].att += 1;
        if (completed) zoneCounts[key].comp += 1;
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
    // 4. DRAW FIELD
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

    // background
    createRect(fieldGroup, 0, 0, fieldW, fieldH, "field-bg");

    // mid field line
    createLine(fieldGroup, fieldW / 2, 0, fieldW / 2, fieldH, "mid-line");

    // horizontal grid
    for (let r = 0; r <= rows; r++) {
      const y = r * cellH;
      createLine(fieldGroup, 0, y, fieldW, y, "grid-line");
    }

    // vertical grid
    for (let c = 0; c <= cols; c++) {
      const x = c * cellW;
      createLine(fieldGroup, x, 0, x, fieldH, "grid-line");
    }

    // dashed no-run borders (0–5 and 45–50 inner borders)
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

    // goal lines (endzones)
    const xSelfGoal =
      (FIELD_ZONES.indexOf("SELF_ENDZONE_FRONT") + 1) * cellW;
    const xOppGoal =
      FIELD_ZONES.indexOf("OPP_ENDZONE_FRONT") * cellW;

    createLine(fieldGroup, xSelfGoal, 0, xSelfGoal, fieldH, "mid-line");
    createLine(fieldGroup, xOppGoal, 0, xOppGoal, fieldH, "mid-line");

    // zones (OUT/CURL/HOOK) with heatmap + "comp/att"
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

        // border
        createRect(fieldGroup, x, y, cellW, cellH, "zone-rect");

        if (att > 0) {
          const intensity = att / maxNormal;
          const alpha = 0.2 + 0.7 * intensity;
          const fill = `rgba(220, 40, 40, ${alpha.toFixed(2)})`;

          const rectFill = createRect(fieldGroup, x, y, cellW, cellH, "zone-fill");
          rectFill.setAttribute("fill", fill);

          createText(
            fieldGroup,
            x + cellW / 2,
            y + cellH / 2,
            `${comp}/${att}`,
            "zone-label"
          );
        }
      }
    }

    // ==========================
    // 5. PYLONS
    // ==========================
    const pylonSize = cellH * 0.45;
    const pylonMarginY = cellH * 0.1;

    drawEndzonePylons("SELF_ENDZONE_BACK", "SELF_ENDZONE_FRONT");
    drawEndzonePylons("OPP_ENDZONE_BACK", "OPP_ENDZONE_FRONT");

    function drawEndzonePylons(backZone, frontZone) {
      const idxBack = FIELD_ZONES.indexOf(backZone);
      const idxFront = FIELD_ZONES.indexOf(frontZone);
      if (idxBack === -1 || idxFront === -1) return;

      const xBack = idxBack * cellW + (cellW - pylonSize) / 2;
      const xFront = idxFront * cellW + (cellW - pylonSize) / 2;

      const topY = pylonMarginY;
      const bottomY = fieldH - pylonSize - pylonMarginY;

      drawPylonCell(frontZone, "FRONT_PYLON", "LEFT", xFront, topY);
      drawPylonCell(frontZone, "FRONT_PYLON", "RIGHT", xFront, bottomY);

      drawPylonCell(backZone, "BACK_PYLON", "LEFT", xBack, topY);
      drawPylonCell(backZone, "BACK_PYLON", "RIGHT", xBack, bottomY);
    }

    function drawPylonCell(fieldZone, zoneType, side, x, y) {
      const key = `${fieldZone}|${zoneType}|${side}`;
      const stats = pylonCounts[key] || { att: 0, comp: 0 };
      const att = stats.att || 0;
      const comp = stats.comp || 0;

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
    }

    // ==========================
    // 6. ARROW (direction left -> right)
    // ==========================
    const arrowGroup = createGroup(svg, 0, 0);
    const arrowY = margin.top + fieldH + 18;
    const arrowStartX = margin.left + 40;
    const arrowEndX = margin.left + fieldW - 40;

    createLine(arrowGroup, arrowStartX, arrowY, arrowEndX, arrowY, "mid-line");

    const arrowHead = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "polygon"
    );
    arrowHead.setAttribute(
      "points",
      `${arrowEndX},${arrowY} ${arrowEndX - 18},${arrowY - 8} ${arrowEndX - 18},${arrowY + 8}`
    );
    arrowHead.setAttribute("fill", "#ffffff");
    arrowGroup.appendChild(arrowHead);

    createText(
      arrowGroup,
      (arrowStartX + arrowEndX) / 2,
      arrowY - 10,
      "Sentido do campo",
      "zone-label"
    );

    // ==========================
    // 7. SVG HELPERS
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
  }

  // ----------------------
  // 2. Looker Studio hook
  // ----------------------
  function drawViz(data /*, config */) {
  // objectTransform → DEFAULT é um array de objetos
    const rows = (data && data.tables && data.tables.DEFAULT) || [];

    const passes = rows.map(row => {
      const fzArr   = row["dim_TargetFieldZone"] || [];
      const zoneArr = row["dim_TargetZone"] || [];
      const sideArr = row["dim_TargetZoneSide"] || [];
      const compArr = row["met_PassCompleted"] || [];

      return {
        TargetFieldZone: String(fzArr[0] ?? ""),
        TargetZone: String(zoneArr[0] ?? ""),
        TargetZoneSide: String(sideArr[0] ?? ""),
        PassCompleted: !!(compArr[0])
      };
    });

    renderField(passes);
  }

  if (typeof dscc !== "undefined") {
    // Looker Studio runtime
    dscc.subscribeToData(drawViz, { transform: dscc.objectTransform });
  } else {
    // Local test fallback (opcional)
    document.addEventListener("DOMContentLoaded", function () {
      const samplePasses = [
        {
          TargetFieldZone: "10to15",
          TargetZone: "OUT",
          TargetZoneSide: "LEFT",
          PassCompleted: true
        },
        {
          TargetFieldZone: "10to15",
          TargetZone: "OUT",
          TargetZoneSide: "LEFT",
          PassCompleted: false
        },
        {
          TargetFieldZone: "15to20",
          TargetZone: "HOOK",
          TargetZoneSide: "MIDDLE",
          PassCompleted: true
        },
        {
          TargetFieldZone: "SELF_ENDZONE_FRONT",
          TargetZone: "FRONT_PYLON",
          TargetZoneSide: "LEFT",
          PassCompleted: false
        },
        {
          TargetFieldZone: "OPP_ENDZONE_BACK",
          TargetZone: "BACK_PYLON",
          TargetZoneSide: "RIGHT",
          PassCompleted: true
        }
      ];
      renderField(samplePasses);
    });
  }
})();
