!function(e,R){"object"==typeof exports&&"object"==typeof module?module.exports=R():"function"==typeof define&&define.amd?define("dscc",[],R):"object"==typeof exports?exports.dscc=R():e.dscc=R()}(window,function(){return C={},n.m=t={"./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/*! no static exports found */function(e,N,R){"use strict";var i=this&&this.__assign||function(){return(i=Object.assign||function(e){for(var R,t=1,C=arguments.length;t<C;t++)for(var n in R=arguments[t])Object.prototype.hasOwnProperty.call(R,n)&&(e[n]=R[n]);return e}).apply(this,arguments)};Object.defineProperty(N,"__esModule",{value:!0});
/*!
  @license
  Copyright 2019 Google LLC

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  https://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/
var a=R(/*! ./types */"./src/types.ts");!function(e){for(var R in e)N.hasOwnProperty(R)||(N[R]=e[R])}(R(/*! ./types */"./src/types.ts")),N.getWidth=function(){return document.body.clientWidth},N.getHeight=function(){return document.documentElement.clientHeight},N.getComponentId=function(){var e=new URLSearchParams(window.location.search).get("dscId");if(null!==e)return e;throw new Error("dscId must be in the query parameters. This is a bug in ds-component, please file a bug: https://github.com/googledatastudio/ds-component/issues/new")};function E(e){return e===a.ConfigDataElementType.DIMENSION?-1:1}function r(e){return e.type===a.ConfigDataElementType.DIMENSION||e.type===a.ConfigDataElementType.METRIC}function _(e){var R=[];e.config.data.forEach(function(e){e.elements.filter(r).forEach(function(e){R.push(e)})});var t,C=(t=function(e,R){return E(e.type)-E(R.type)},R.map(function(e,R){return{item:e,index:R}}).sort(function(e,R){return t(e.item,R.item)||e.index-R.index}).map(function(e){return e.item})),n=[];return C.forEach(function(e){e.value.forEach(function(){return n.push(e.id)})}),n}function o(R){return function(e){var t,C,n={};return C=R,((t=e).length<C.length?t.map(function(e,R){return[e,C[R]]}):C.map(function(e,R){return[t[R],e]})).forEach(function(e){var R=e[0],t=e[1];void 0===n[t]&&(n[t]=[]),n[t].push(R)},{}),n}}N.fieldsByConfigId=function(e){var R=e.fields.reduce(function(e,R){return e[R.id]=R,e},{}),t={};return e.config.data.forEach(function(e){e.elements.filter(r).forEach(function(e){t[e.id]=e.value.map(function(e){return R[e]})})}),t};function U(e){var R={};return(e.config.style||[]).forEach(function(e){e.elements.forEach(function(e){if(void 0!==R[e.id])throw new Error("styleIds must be unique. Your styleId: '"+e.id+"' is used more than once.");R[e.id]={value:e.value,defaultValue:e.defaultValue}})},{}),R}function Y(e){return e.config.themeStyle}function n(e){switch(e){case a.DSInteractionType.FILTER:return a.InteractionType.FILTER}}function s(e){var R=e.config.interactions;return void 0===R?{}:R.reduce(function(e,R){var t=R.supportedActions.map(n),C={type:n(R.value.type),data:R.value.data};return e[R.id]={value:C,supportedActions:t},e},{})}function u(e){return(e.dataResponse.dateRanges||[]).reduce(function(e,R){return e[R.id]={start:R.start,end:R.end},e},{})}function T(e){var R=e.config.colorMap||{};return i({},R)}N.tableTransform=function(e){return{tables:(R=e,C=N.fieldsByConfigId(R),n=_(R),E={},r=n.map(function(e){void 0===E[e]?E[e]=0:E[e]++;var R=E[e],t=C[e][R];return i(i({},t),{configId:e})}),(t={})[a.TableType.DEFAULT]={headers:[],rows:[]},o=t,R.dataResponse.tables.forEach(function(e){o[e.id]={headers:r,rows:e.rows}}),o),dateRanges:u(e),fields:N.fieldsByConfigId(e),style:U(e),theme:Y(e),interactions:s(e),colorMap:T(e)};var R,t,C,n,E,r,o},N.objectTransform=function(e){return{tables:(C=_(R=e),(t={})[a.TableType.DEFAULT]=[],n=t,R.dataResponse.tables.forEach(function(e){var R=e.rows.map(o(C));if(e.id===a.TableType.DEFAULT)n[e.id]=R;else{var t=n[e.id];n[e.id]=void 0===t?R:t.concat(R)}}),n),dateRanges:u(e),fields:N.fieldsByConfigId(e),style:U(e),theme:Y(e),interactions:s(e),colorMap:T(e)};var R,t,C,n};function c(e){var R,t=!1;return e===N.tableTransform||e===N.objectTransform?t=!0:(R=!1,"identity"===e("identity")&&(R=!0,console.warn("This is an unsupported data format. Please use one of the supported transforms:\n       dscc.objectFormat or dscc.tableFormat.")),R&&(t=!0)),t}N.subscribeToData=function(R,t){if(c(t.transform)){var e=function(e){e.data.type===a.MessageType.RENDER?R(t.transform(e.data)):console.error("MessageType: "+e.data.type+" is not supported by this version of the library.")};window.addEventListener("message",e);var C={componentId:N.getComponentId(),type:a.ToDSMessageType.VIZ_READY};return window.parent.postMessage(C,"*"),function(){return window.removeEventListener("message",e)}}throw new Error("Only the built in transform functions are supported.")},N.sendInteraction=function(e,R,t){var C=N.getComponentId(),n={type:a.ToDSMessageType.INTERACTION,id:e,data:t,componentId:C};window.parent.postMessage(n,"*")},N.clearInteraction=function(e,R){N.sendInteraction(e,R,void 0)}},"./src/types.ts":
/*!**********************!*\
  !*** ./src/types.ts ***!
  \**********************/
/*! no static exports found */function(e,R,t){"use strict";var C,n,E,r,o,N,i;Object.defineProperty(R,"__esModule",{value:!0}),(C=R.ConceptType||(R.ConceptType={})).METRIC="METRIC",C.DIMENSION="DIMENSION",(R.MessageType||(R.MessageType={})).RENDER="RENDER",(n=R.FieldType||(R.FieldType={})).YEAR="YEAR",n.YEAR_QUARTER="YEAR_QUARTER",n.YEAR_MONTH="YEAR_MONTH",n.YEAR_WEEK="YEAR_WEEK",n.YEAR_MONTH_DAY="YEAR_MONTH_DAY",n.YEAR_MONTH_DAY_HOUR="YEAR_MONTH_DAY_HOUR",n.QUARTER="QUARTER",n.MONTH="MONTH",n.WEEK="WEEK",n.MONTH_DAY="MONTH_DAY",n.DAY_OF_WEEK="DAY_OF_WEEK",n.DAY="DAY",n.HOUR="HOUR",n.MINUTE="MINUTE",n.DURATION="DURATION",n.COUNTRY="COUNTRY",n.COUNTRY_CODE="COUNTRY_CODE",n.CONTINENT="CONTINENT",n.CONTINENT_CODE="CONTINENT_CODE",n.SUB_CONTINENT="SUB_CONTINENT",n.SUB_CONTINENT_CODE="SUB_CONTINENT_CODE",n.REGION="REGION",n.REGION_CODE="REGION_CODE",n.CITY="CITY",n.CITY_CODE="CITY_CODE",n.METRO_CODE="METRO_CODE",n.LATITUDE_LONGITUDE="LATITUDE_LONGITUDE",n.NUMBER="NUMBER",n.PERCENT="PERCENT",n.TEXT="TEXT",n.BOOLEAN="BOOLEAN",n.URL="URL",n.IMAGE="IMAGE",n.CURRENCY_AED="CURRENCY_AED",n.CURRENCY_ALL="CURRENCY_ALL",n.CURRENCY_ARS="CURRENCY_ARS",n.CURRENCY_AUD="CURRENCY_AUD",n.CURRENCY_BDT="CURRENCY_BDT",n.CURRENCY_BGN="CURRENCY_BGN",n.CURRENCY_BOB="CURRENCY_BOB",n.CURRENCY_BRL="CURRENCY_BRL",n.CURRENCY_CAD="CURRENCY_CAD",n.CURRENCY_CDF="CURRENCY_CDF",n.CURRENCY_CHF="CURRENCY_CHF",n.CURRENCY_CLP="CURRENCY_CLP",n.CURRENCY_CNY="CURRENCY_CNY",n.CURRENCY_COP="CURRENCY_COP",n.CURRENCY_CRC="CURRENCY_CRC",n.CURRENCY_CZK="CURRENCY_CZK",n.CURRENCY_DKK="CURRENCY_DKK",n.CURRENCY_DOP="CURRENCY_DOP",n.CURRENCY_EGP="CURRENCY_EGP",n.CURRENCY_ETB="CURRENCY_ETB",n.CURRENCY_EUR="CURRENCY_EUR",n.CURRENCY_GBP="CURRENCY_GBP",n.CURRENCY_HKD="CURRENCY_HKD",n.CURRENCY_HRK="CURRENCY_HRK",n.CURRENCY_HUF="CURRENCY_HUF",n.CURRENCY_IDR="CURRENCY_IDR",n.CURRENCY_ILS="CURRENCY_ILS",n.CURRENCY_INR="CURRENCY_INR",n.CURRENCY_IRR="CURRENCY_IRR",n.CURRENCY_ISK="CURRENCY_ISK",n.CURRENCY_JMD="CURRENCY_JMD",n.CURRENCY_JPY="CURRENCY_JPY",n.CURRENCY_KRW="CURRENCY_KRW",n.CURRENCY_LKR="CURRENCY_LKR",n.CURRENCY_LTL="CURRENCY_LTL",n.CURRENCY_MNT="CURRENCY_MNT",n.CURRENCY_MVR="CURRENCY_MVR",n.CURRENCY_MXN="CURRENCY_MXN",n.CURRENCY_MYR="CURRENCY_MYR",n.CURRENCY_NOK="CURRENCY_NOK",n.CURRENCY_NZD="CURRENCY_NZD",n.CURRENCY_PAB="CURRENCY_PAB",n.CURRENCY_PEN="CURRENCY_PEN",n.CURRENCY_PHP="CURRENCY_PHP",n.CURRENCY_PKR="CURRENCY_PKR",n.CURRENCY_PLN="CURRENCY_PLN",n.CURRENCY_RON="CURRENCY_RON",n.CURRENCY_RSD="CURRENCY_RSD",n.CURRENCY_RUB="CURRENCY_RUB",n.CURRENCY_SAR="CURRENCY_SAR",n.CURRENCY_SEK="CURRENCY_SEK",n.CURRENCY_SGD="CURRENCY_SGD",n.CURRENCY_THB="CURRENCY_THB",n.CURRENCY_TRY="CURRENCY_TRY",n.CURRENCY_TWD="CURRENCY_TWD",n.CURRENCY_TZS="CURRENCY_TZS",n.CURRENCY_UAH="CURRENCY_UAH",n.CURRENCY_USD="CURRENCY_USD",n.CURRENCY_UYU="CURRENCY_UYU",n.CURRENCY_VEF="CURRENCY_VEF",n.CURRENCY_VND="CURRENCY_VND",n.CURRENCY_YER="CURRENCY_YER",n.CURRENCY_ZAR="CURRENCY_ZAR",(E=R.TableType||(R.TableType={})).DEFAULT="DEFAULT",E.COMPARISON="COMPARISON",E.SUMMARY="SUMMARY",(r=R.DateRangeType||(R.DateRangeType={})).DEFAULT="DEFAULT",r.COMPARISON="COMPARISON",(o=R.ConfigDataElementType||(R.ConfigDataElementType={})).METRIC="METRIC",o.DIMENSION="DIMENSION",o.MAX_RESULTS="MAX_RESULTS",(N=R.ConfigStyleElementType||(R.ConfigStyleElementType={})).TEXTINPUT="TEXTINPUT",N.SELECT_SINGLE="SELECT_SINGLE",N.CHECKBOX="CHECKBOX",N.FONT_COLOR="FONT_COLOR",N.FONT_SIZE="FONT_SIZE",N.FONT_FAMILY="FONT_FAMILY",N.FILL_COLOR="FILL_COLOR",N.BORDER_COLOR="BORDER_COLOR",N.AXIS_COLOR="AXIS_COLOR",N.GRID_COLOR="GRID_COLOR",N.OPACITY="OPACITY",N.LINE_WEIGHT="LINE_WEIGHT",N.LINE_STYLE="LINE_STYLE",N.BORDER_RADIUS="BORDER_RADIUS",N.INTERVAL="INTERVAL",N.SELECT_RADIO="SELECT_RADIO",(R.DSInteractionType||(R.DSInteractionType={})).FILTER="FILTER",(i=R.ToDSMessageType||(R.ToDSMessageType={})).VIZ_READY="vizReady",i.INTERACTION="vizAction",(R.InteractionType||(R.InteractionType={})).FILTER="FILTER"}},n.c=C,n.d=function(e,R,t){n.o(e,R)||Object.defineProperty(e,R,{enumerable:!0,get:t})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(R,e){if(1&e&&(R=n(R)),8&e)return R;if(4&e&&"object"==typeof R&&R&&R.__esModule)return R;var t=Object.create(null);if(n.r(t),Object.defineProperty(t,"default",{enumerable:!0,value:R}),2&e&&"string"!=typeof R)for(var C in R)n.d(t,C,function(e){return R[e]}.bind(null,C));return t},n.n=function(e){var R=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(R,"a",R),R},n.o=function(e,R){return Object.prototype.hasOwnProperty.call(e,R)},n.p="",n(n.s="./src/index.ts");function n(e){if(C[e])return C[e].exports;var R=C[e]={i:e,l:!1,exports:{}};return t[e].call(R.exports,R,R.exports,n),R.l=!0,R.exports}var t,C});// Spartans Flag Field Heatmap - viz source (sem dscc.min.js ainda)
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

      const attempts    = Number(p.Attempts    || 0);
      const completions = Number(p.Completions || 0);
      const key = `${fz}|${zone}|${side}`;

      if (zone === "FRONT_PYLON" || zone === "BACK_PYLON") {
        if (!pylonCounts[key]) pylonCounts[key] = { att: 0, comp: 0 };
        pylonCounts[key].att  += attempts;
        pylonCounts[key].comp += completions;
      } else {
        if (!zoneCounts[key]) zoneCounts[key] = { att: 0, comp: 0 };
        zoneCounts[key].att  += attempts;
        zoneCounts[key].comp += completions;
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
            // OUT LEFT / OUT RIGHT ficam encostadas nos pylons laterais
            if (zoneType === "OUT") {
              if (side === "LEFT") {
                // empurra um pouco pro meio do campo
                labelX += cellW * 0.18;
              } else if (side === "RIGHT") {
                labelX -= cellW * 0.18;
              }
            }
            // primeira e última linha (mais perto de pylons de cima/baixo)
            if (rowIndex === 0) {
              labelY += cellH * 0.20;       // desce um pouco
            } else if (rowIndex === rows - 1) {
              labelY -= cellH * 0.20;       // sobe um pouco
            }
          }

          createText(fieldGroup, labelX, labelY, `${comp}/${att}`, "zone-label");
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
      const attArr  = row["met_PassAttempts"] || [];
      const compArr = row["met_PassCompleted"] || [];

      const attempts    = Number(attArr[0]  ?? 0);
      const completions = Number(compArr[0] ?? 0);

      return {
        TargetFieldZone: String(fzArr[0] ?? ""),
        TargetZone: String(zoneArr[0] ?? ""),
        TargetZoneSide: String(sideArr[0] ?? ""),
        Attempts: attempts,
        Completions: completions
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
