import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { fabric } from "fabric";
import jsPDF from "jspdf";
import { buildAllPages } from "./pageBuilder";
import { SDG_ICON_DATA, SDG_COLORS } from "../../data/sdgIcons";
import { useForm } from "../../context/FormContext";
import "./CanvasEditor.css";

const CW = 842;
const CANVAS_STORAGE_KEY = "vsme_canvas_draft";
const USER_OBJECTS_KEY = "vsme_canvas_user_objects";
const PAGE_OVERRIDES_KEY = "vsme_canvas_page_overrides";
const CH = 595;
const ML = 30;
const CONTENT_W = CW - ML * 2;

const FONTS = [
  "Arial",
  "Georgia",
  "Times New Roman",
  "Courier New",
  "Trebuchet MS",
  "Verdana",
];
const FONT_SIZES = [7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48];

const THEMES = [
  {
    id: "navy",
    label: "Navy",
    primary: "#112a57",
    light: "#e8eef7",
    dark: "#07111e",
  },
  {
    id: "green",
    label: "Forest",
    primary: "#276B4D",
    light: "#e8f2ed",
    dark: "#1a4530",
  },
  {
    id: "blue",
    label: "Ocean",
    primary: "#2563eb",
    light: "#dbeafe",
    dark: "#1e3a8a",
  },
  {
    id: "purple",
    label: "Dusk",
    primary: "#7c3aed",
    light: "#ede9fe",
    dark: "#4c1d95",
  },
  {
    id: "slate",
    label: "Minimal",
    primary: "#334155",
    light: "#f1f5f9",
    dark: "#0f172a",
  },
];

const FONT_PAIRS = [
  { id: "editorial", label: "Editorial", heading: "Georgia", body: "Arial" },
  { id: "corporate", label: "Corporate", heading: "Arial", body: "Arial" },
  {
    id: "humanist",
    label: "Humanist",
    heading: "Trebuchet MS",
    body: "Verdana",
  },
  {
    id: "classic",
    label: "Classic",
    heading: "Times New Roman",
    body: "Georgia",
  },
];

// Strip src only from programmatic images (those with a phId) — they can be reloaded from
// data.images. User-added images (userAdded: true, no phId) keep their full src because
// they have no other persistent source.
function _stripImgSrc(json) {
  if (!json?.objects) return json;
  return {
    ...json,
    objects: json.objects.map((o) =>
      o.type === "image" && o.data?.phId ? { ...o, src: "" } : o,
    ),
  };
}

// Re-populate stripped phId images from the live form images map, then call onDone.
function _restoreImgSrc(canvas, images, theme, onDone) {
  const imgObjs = canvas
    .getObjects()
    .filter((o) => o.type === "image" && !o.getSrc?.() && o.data?.phId);
  recolorCanvas(canvas, theme);
  if (!imgObjs.length) {
    canvas.renderAll();
    onDone();
    return;
  }
  let pending = imgObjs.length;
  const checkDone = () => {
    if (--pending <= 0) {
      canvas.renderAll();
      onDone();
    }
  };
  imgObjs.forEach((imgObj) => {
    const src = images?.[imgObj.data.phId];
    if (!src) {
      checkDone();
      return;
    }
    const el = new Image();
    el.onload = () => {
      imgObj.setElement(el);
      imgObj.dirty = true;
      checkDone();
    };
    el.onerror = checkDone;
    el.src = src;
  });
}

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m
    ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
    : { r: 22, g: 163, b: 74 };
}
function makeThemeFromColor(primary) {
  const { r, g, b } = hexToRgb(primary);
  const light =
    "#" +
    [r, g, b]
      .map((v) =>
        Math.min(255, Math.round(v + (255 - v) * 0.85))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("");
  const dark =
    "#" +
    [r, g, b]
      .map((v) =>
        Math.round(v * 0.35)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("");
  return { id: "custom", label: "Custom", primary, light, dark };
}

function recolorObj(obj, theme) {
  const role = obj.data?.tr;
  if (role) {
    if (role === "p") obj.set("fill", theme.primary);
    if (role === "l") obj.set("fill", theme.light);
    if (role === "d") obj.set("fill", theme.dark);
    if (role === "pt") obj.set("fill", theme.primary);
    if (role === "dt") obj.set("fill", theme.dark);
    if (role === "ps") obj.set("stroke", theme.primary);
    obj.dirty = true;
  }
  if (obj._objects) obj._objects.forEach((c) => recolorObj(c, theme));
}
function recolorCanvas(canvas, theme) {
  canvas.getObjects().forEach((o) => recolorObj(o, theme));
  canvas.requestRenderAll();
}

function fabricColorToHex(c) {
  if (!c || c === "transparent" || typeof c !== "string") return "#000000";
  if (c.startsWith("#"))
    return c.length === 4
      ? "#" + c[1] + c[1] + c[2] + c[2] + c[3] + c[3]
      : c.slice(0, 7);
  const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (m)
    return (
      "#" +
      [m[1], m[2], m[3]].map((v) => (+v).toString(16).padStart(2, "0")).join("")
    );
  return "#000000";
}
function applyColorToObj(obj, color) {
  if (obj.data) delete obj.data.tr;
  if (obj.type === "line") obj.set("stroke", color);
  else if (obj.fill === "transparent" && obj.stroke) obj.set("stroke", color);
  else obj.set("fill", color);
  obj.dirty = true;
}

function sel(obj) {
  obj.set({
    borderColor: "#2563eb",
    cornerColor: "#2563eb",
    cornerStyle: "circle",
    cornerSize: 9,
    transparentCorners: false,
    padding: 2,
  });
  return obj;
}
function tb(text, opts = {}) {
  return sel(
    new fabric.Textbox(String(text ?? ""), {
      fontFamily: "Arial",
      editable: true,
      lockScalingY: false,
      lockScalingX: false,
      ...opts,
    }),
  );
}

// ─── Section band ────────────────────────────────────────────────────────────

function makeSectionBand(badge, title, config, y) {
  const { theme, fontPair } = config;
  const H = 50;
  const hasBadge = badge && badge.length > 0;
  const bw = badge && badge.length > 2 ? 34 : 26;
  const titleX = hasBadge ? ML + bw + 12 : ML;
  const objs = [
    sel(
      new fabric.Rect({
        left: 0,
        top: y,
        width: CW,
        height: H,
        fill: "#ffffff",
        strokeWidth: 0,
      }),
    ),
  ];
  if (hasBadge) {
    objs.push(
      sel(
        new fabric.Rect({
          left: ML,
          top: y + 14,
          width: bw,
          height: 19,
          fill: theme.primary,
          rx: 9,
          ry: 9,
          strokeWidth: 0,
          data: { tr: "p" },
        }),
      ),
    );
    objs.push(
      tb(badge, {
        left: ML,
        top: y + 18,
        width: bw,
        textAlign: "center",
        fontSize: 8,
        fontWeight: "bold",
        fill: "#fff",
        fontFamily: fontPair.body,
      }),
    );
  }
  objs.push(
    tb(title, {
      left: titleX,
      top: y + 11,
      width: CW - titleX - 42,
      fontSize: 18,
      fontWeight: "bold",
      fill: theme.primary,
      fontFamily: fontPair.heading,
      editable: true,
      data: { tr: "pt", type: "section-title" },
    }),
  );
  objs.push(
    sel(
      new fabric.Line([ML, y + H, CW - ML, y + H], {
        stroke: theme.primary,
        strokeWidth: 0.8,
        opacity: 0.3,
        data: { tr: "ps" },
      }),
    ),
  );
  return objs;
}

// ─── KPI box ─────────────────────────────────────────────────────────────────

function makeKpiBox(x, y, w, h, metric, config) {
  const { theme, fontPair } = config;
  const valStr = String(metric.value ?? "—");
  const vfs = Math.min(22, Math.max(11, Math.round(24 - valStr.length * 1.4)));
  return [
    sel(
      new fabric.Rect({
        left: x,
        top: y,
        width: w,
        height: h,
        fill: "#f5f5f5",
        rx: 4,
        ry: 4,
        strokeWidth: 0,
      }),
    ),
    tb(valStr, {
      left: x + 6,
      top: y + 8,
      width: w - 12,
      textAlign: "center",
      fontSize: vfs,
      fontWeight: "bold",
      fill: theme.primary,
      fontFamily: fontPair.heading,
      data: { tr: "pt" },
    }),
    tb(String(metric.unit || ""), {
      left: x + 6,
      top: y + 36,
      width: w - 12,
      textAlign: "center",
      fontSize: 7,
      fill: "#888888",
    }),
    tb(metric.label, {
      left: x + 6,
      top: y + 48,
      width: w - 12,
      textAlign: "center",
      fontSize: 7.5,
      fontWeight: "600",
      fill: "#555555",
    }),
  ];
}

function makeDataRow(x, y, w, label, value) {
  const labelW = Math.round(w * 0.38);
  return [
    tb(label, {
      left: x + 4,
      top: y + 5,
      width: labelW,
      fontSize: 8.5,
      fill: "#888888",
    }),
    tb(String(value || "—"), {
      left: x + labelW + 8,
      top: y + 5,
      width: w - labelW - 12,
      fontSize: 8.5,
      fontWeight: "600",
      fill: "#1a1a1a",
    }),
  ];
}

// ─── Subtitle ────────────────────────────────────────────────────────────────

function makeSubtitle(x, y, text, config) {
  const { fontPair } = config;
  return [
    tb(text.toUpperCase(), {
      left: x,
      top: y + 10,
      width: CONTENT_W,
      fontSize: 7.5,
      fontWeight: "bold",
      fill: "#888888",
      fontFamily: fontPair.body,
      charSpacing: 100,
    }),
    sel(
      new fabric.Line([x, y + 24, x + CONTENT_W, y + 24], {
        stroke: "#dddddd",
        strokeWidth: 0.5,
      }),
    ),
  ];
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function makeFooter(pageNum, company, config) {
  const { fontPair } = config;
  return [
    sel(
      new fabric.Line([ML, CH - 18, CW - ML, CH - 18], {
        stroke: "#cccccc",
        strokeWidth: 0.5,
      }),
    ),
    tb(company || "ESG Report", {
      left: ML,
      top: CH - 15,
      width: 300,
      fontSize: 7,
      fill: "#999999",
      fontFamily: fontPair.body,
    }),
    tb(String(pageNum), {
      left: CW - ML - 30,
      top: CH - 15,
      width: 30,
      textAlign: "right",
      fontSize: 7,
      fill: "#999999",
      fontFamily: fontPair.body,
    }),
  ];
}

// ─── Page renderer ───────────────────────────────────────────────────────────

async function renderPage(canvas, pageSpec, config, pageNum, companyName) {
  canvas.clear();
  canvas.backgroundColor = "#ffffff";
  let y = pageSpec.blocks[0]?.type === "section-band" ? 0 : 40;
  for (const block of pageSpec.blocks)
    y = await applyBlock(canvas, block, config, y);
  if (pageSpec.badge || pageSpec.showFooter)
    makeFooter(pageNum, companyName, config).forEach((o) => canvas.add(o));
  canvas.renderAll();
}

async function applyBlock(canvas, block, config, y) {
  const { theme } = config;
  switch (block.type) {
    case "section-band":
      makeSectionBand(block.badge, block.title, config, y).forEach((o) =>
        canvas.add(o),
      );
      return y + 58;

    case "kpi-row": {
      const metrics = (block.metrics || []).slice(0, 5);
      if (!metrics.length) return y;
      const gap = 8,
        bh = 64;
      const bw = (CONTENT_W - gap * (metrics.length - 1)) / metrics.length;
      metrics.forEach((m, i) =>
        makeKpiBox(ML + i * (bw + gap), y, bw, bh, m, config).forEach((o) =>
          canvas.add(o),
        ),
      );
      return y + bh + 12;
    }

    case "data-table": {
      const rows = block.rows || [];
      if (!rows.length) return y;
      const ROW_H = 20;
      const singleCol = block.columns === 1;
      const colW = singleCol ? CONTENT_W : Math.floor((CONTENT_W - 20) / 2);
      let rowIdx = 0;
      for (let i = 0; i < rows.length; i += singleCol ? 1 : 2) {
        if (rowIdx % 2 === 0) {
          canvas.add(
            sel(
              new fabric.Rect({
                left: ML,
                top: y,
                width: CONTENT_W,
                height: ROW_H,
                fill: "#f8f9fa",
                strokeWidth: 0,
              }),
            ),
          );
        }
        makeDataRow(ML, y, colW, rows[i].label, rows[i].value).forEach((o) =>
          canvas.add(o),
        );
        if (!singleCol && rows[i + 1])
          makeDataRow(
            ML + colW + 20,
            y,
            colW,
            rows[i + 1].label,
            rows[i + 1].value,
          ).forEach((o) => canvas.add(o));
        canvas.add(
          sel(
            new fabric.Line([ML, y + ROW_H, ML + CONTENT_W, y + ROW_H], {
              stroke: "#e8e8e8",
              strokeWidth: 0.5,
            }),
          ),
        );
        y += ROW_H;
        rowIdx++;
      }
      return y + 6;
    }

    case "ghg-scope-chart": {
      const { scope1, scope2, scope3, unit } = block;
      const { theme, fontPair } = config;
      const bars = [
        scope1 > 0 && {
          label: "Scope 1  —  Direct",
          value: scope1,
          color: "#f97316",
        },
        scope2 > 0 && {
          label: "Scope 2  —  Purchased Energy",
          value: scope2,
          color: "#3b82f6",
        },
        scope3 > 0 && {
          label: "Scope 3  —  Value Chain",
          value: scope3,
          color: "#8b5cf6",
        },
      ].filter(Boolean);
      if (!bars.length) return y;

      const labelW = 160;
      const valW = 90;
      const barAreaW = CONTENT_W - labelW - valW - 8;
      const maxVal = Math.max(...bars.map((b) => b.value));
      const BAR_H = 22;
      const ROW_H = 38;

      // Title row
      canvas.add(
        tb("EMISSIONS BY SCOPE", {
          left: ML,
          top: y + 6,
          width: CONTENT_W,
          fontSize: 7.5,
          fontWeight: "bold",
          fill: "#888888",
          fontFamily: fontPair.body,
          charSpacing: 100,
        }),
      );
      canvas.add(
        sel(
          new fabric.Line([ML, y + 20, ML + CONTENT_W, y + 20], {
            stroke: "#eeeeee",
            strokeWidth: 0.5,
          }),
        ),
      );
      y += 24;

      bars.forEach(({ label, value, color }) => {
        const barW = Math.max(4, Math.round((value / maxVal) * barAreaW));
        // Background track
        canvas.add(
          sel(
            new fabric.Rect({
              left: ML + labelW,
              top: y + 7,
              width: barAreaW,
              height: BAR_H,
              fill: "#f1f5f9",
              rx: 4,
              ry: 4,
              strokeWidth: 0,
            }),
          ),
        );
        // Filled bar
        canvas.add(
          sel(
            new fabric.Rect({
              left: ML + labelW,
              top: y + 7,
              width: barW,
              height: BAR_H,
              fill: color,
              rx: 4,
              ry: 4,
              strokeWidth: 0,
            }),
          ),
        );
        // Scope label
        canvas.add(
          tb(label, {
            left: ML,
            top: y + 11,
            width: labelW - 8,
            fontSize: 8.5,
            fill: "#444444",
            fontFamily: fontPair.body,
          }),
        );
        // Value label
        canvas.add(
          tb(`${Number(value).toFixed(2)} ${unit}`, {
            left: ML + labelW + barAreaW + 8,
            top: y + 11,
            width: valW,
            fontSize: 8.5,
            fontWeight: "600",
            fill: color,
            fontFamily: fontPair.body,
          }),
        );
        y += ROW_H;
      });
      return y + 10;
    }

    case "policy-matrix": {
      const rows = block.rows || [];
      if (!rows.length) return y;
      rows.forEach((row) => {
        const isYes = row.status === "yes";
        const isIP =
          row.status === "in_progress" || row.status === "in-progress";
        const bg = isYes ? theme.light : isIP ? "#fffbeb" : "#f8fafc";
        const ac = isYes ? theme.primary : isIP ? "#d97706" : "#94a3b8";
        canvas.add(
          sel(
            new fabric.Rect({
              left: ML,
              top: y,
              width: CONTENT_W,
              height: 22,
              fill: bg,
              strokeWidth: 0,
            }),
          ),
        );
        canvas.add(
          sel(
            new fabric.Rect({
              left: ML,
              top: y,
              width: 3,
              height: 22,
              fill: ac,
              strokeWidth: 0,
            }),
          ),
        );
        canvas.add(
          sel(
            new fabric.Line([ML, y + 22, ML + CONTENT_W, y + 22], {
              stroke: "#e8ecf0",
              strokeWidth: 0.5,
            }),
          ),
        );
        canvas.add(
          tb(row.label, {
            left: ML + 9,
            top: y + 6,
            width: CONTENT_W * 0.42,
            fontSize: 8.5,
            fill: "#334155",
          }),
        );
        const st = isYes
          ? "YES"
          : isIP
            ? "IN PROGRESS"
            : row.status
              ? row.status.toUpperCase()
              : "NO";
        const sw = st === "IN PROGRESS" ? 58 : 30;
        const sx = ML + CONTENT_W * 0.42 + 4;
        canvas.add(
          sel(
            new fabric.Rect({
              left: sx,
              top: y + 5,
              width: sw,
              height: 12,
              fill: ac,
              rx: 6,
              ry: 6,
              strokeWidth: 0,
            }),
          ),
        );
        canvas.add(
          tb(st, {
            left: sx,
            top: y + 5.5,
            width: sw,
            textAlign: "center",
            fontSize: 6,
            fontWeight: "bold",
            fill: "#fff",
          }),
        );
        let bx = sx + sw + 5;
        if (row.isPublic) {
          canvas.add(
            sel(
              new fabric.Rect({
                left: bx,
                top: y + 5,
                width: 38,
                height: 12,
                fill: "#2563eb",
                rx: 6,
                ry: 6,
                strokeWidth: 0,
              }),
            ),
          );
          canvas.add(
            tb("PUBLIC", {
              left: bx,
              top: y + 5.5,
              width: 38,
              textAlign: "center",
              fontSize: 6,
              fontWeight: "bold",
              fill: "#fff",
            }),
          );
          bx += 43;
        }
        if (row.hasTargets) {
          canvas.add(
            sel(
              new fabric.Rect({
                left: bx,
                top: y + 5,
                width: 42,
                height: 12,
                fill: "#7c3aed",
                rx: 6,
                ry: 6,
                strokeWidth: 0,
              }),
            ),
          );
          canvas.add(
            tb("TARGETS", {
              left: bx,
              top: y + 5.5,
              width: 42,
              textAlign: "center",
              fontSize: 6,
              fontWeight: "bold",
              fill: "#fff",
            }),
          );
        }
        y += 22;
      });
      if (block.skipped?.length) {
        y += 4;
        canvas.add(
          tb(`No current policy on: ${block.skipped.join(" · ")}`, {
            left: ML + 9,
            top: y,
            width: CONTENT_W,
            fontSize: 8,
            fill: "#94a3b8",
            fontStyle: "italic",
          }),
        );
        y += 16;
      }
      return y + 6;
    }

    case "subtitle":
      makeSubtitle(ML, y, block.text, config).forEach((o) => canvas.add(o));
      return y + 30;

    case "text-block": {
      const content = (block.content || "").trim();
      if (!content) return y;
      const t = tb(content, {
        left: ML,
        top: y + 2,
        width: CONTENT_W,
        fontSize: 9.5,
        fill: "#444444",
        lineHeight: 1.7,
      });
      const h = t.getScaledHeight();
      canvas.add(t);
      return y + h + 14;
    }

    case "photo-placeholder": {
      const phW = block.width || CONTENT_W;
      const phH = block.height || 160;
      const phX = block.x !== undefined ? block.x : ML;
      const phId = block.phId || `ph-${Math.round(y)}`;
      if (block.imageSrc) {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const fimg = new fabric.Image(img);
            const scale = Math.min(phW / fimg.width, phH / fimg.height);
            fimg.set({
              left: phX,
              top: y,
              scaleX: scale,
              scaleY: scale,
              data: { type: "image-block", phId },
            });
            sel(fimg);
            canvas.add(fimg);
            canvas.renderAll();
            resolve(y + phH + 12);
          };
          img.onerror = () => resolve(y + phH + 12);
          img.src = block.imageSrc;
        });
      }
      canvas.add(
        sel(
          new fabric.Rect({
            left: phX,
            top: y,
            width: phW,
            height: phH,
            fill: "#f0f0f0",
            strokeWidth: 1.5,
            stroke: "#cccccc",
            strokeDashArray: [8, 4],
            rx: 4,
            ry: 4,
            data: { type: "photo-placeholder", phId },
          }),
        ),
      );
      canvas.add(
        tb("Double-click to add photo", {
          left: phX,
          top: y + phH / 2 - 8,
          width: phW,
          textAlign: "center",
          fontSize: 9,
          fill: "#bbbbbb",
          fontFamily: "Arial",
          editable: false,
          data: { type: "photo-label", phId },
        }),
      );
      return y + phH + 12;
    }

    case "text-photo": {
      const textW = Math.round(CONTENT_W * 0.52);
      const phW = Math.round(CONTENT_W * 0.44);
      const phX = ML + textW + Math.round(CONTENT_W * 0.04);
      const phH = block.height || 160;
      const phId = block.phId || `ph-tp-${Math.round(y)}`;
      const content = (block.content || "").trim();
      if (content) {
        canvas.add(
          tb(content, {
            left: ML,
            top: y + 2,
            width: textW - 8,
            fontSize: 9.5,
            fill: "#444444",
            lineHeight: 1.7,
          }),
        );
      }
      if (block.imageSrc) {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const fimg = new fabric.Image(img);
            const scale = Math.min(phW / fimg.width, phH / fimg.height);
            fimg.set({
              left: phX,
              top: y,
              scaleX: scale,
              scaleY: scale,
              data: { type: "image-block", phId },
            });
            sel(fimg);
            canvas.add(fimg);
            canvas.renderAll();
            resolve(y + phH + 12);
          };
          img.onerror = () => resolve(y + phH + 12);
          img.src = block.imageSrc;
        });
      }
      canvas.add(
        sel(
          new fabric.Rect({
            left: phX,
            top: y,
            width: phW,
            height: phH,
            fill: "#f0f0f0",
            strokeWidth: 1.5,
            stroke: "#cccccc",
            strokeDashArray: [8, 4],
            rx: 4,
            ry: 4,
            data: { type: "photo-placeholder", phId },
          }),
        ),
      );
      canvas.add(
        tb("Double-click to add photo", {
          left: phX,
          top: y + phH / 2 - 8,
          width: phW,
          textAlign: "center",
          fontSize: 9,
          fill: "#bbbbbb",
          fontFamily: "Arial",
          editable: false,
          data: { type: "photo-label", phId },
        }),
      );
      return y + phH + 12;
    }

    case "image":
      if (!block.src) return y;
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const fimg = new fabric.Image(img);
          const scale = Math.min(320 / fimg.width, 200 / fimg.height, 1);
          fimg.set({
            left: ML,
            top: y,
            scaleX: scale,
            scaleY: scale,
            data: { type: "image-block" },
          });
          sel(fimg);
          canvas.add(fimg);
          canvas.renderAll();
          resolve(y + fimg.getScaledHeight() + 12);
        };
        img.onerror = () => resolve(y);
        img.crossOrigin = "anonymous";
        img.src = block.src;
      });

    case "esg-section-cover": {
      const {
        letter,
        title: secTitle,
        description,
        phId,
        imageSrc,
        focusAreas = [],
        year = "",
      } = block;
      const { theme, fontPair } = config;

      // 49% left panel / 51% full-height photo
      const leftW = Math.round(CW * 0.49); // 412
      const rightX = leftW;
      const rightW = CW - rightX; // 430

      // ── Canvas base + left panel
      canvas.add(
        sel(
          new fabric.Rect({
            left: 0,
            top: 0,
            width: CW,
            height: CH,
            fill: "#ffffff",
            strokeWidth: 0,
          }),
        ),
      );
      canvas.add(
        sel(
          new fabric.Rect({
            left: 0,
            top: 0,
            width: leftW,
            height: CH,
            fill: theme.primary,
            strokeWidth: 0,
            data: { tr: "p" },
          }),
        ),
      );

      // ── Giant watermark letter — dominates the upper portion
      canvas.add(
        tb(letter, {
          left: -leftW * 0.12,
          top: -10,
          width: leftW * 1.24,
          textAlign: "center",
          fontSize: 220,
          fontWeight: "bold",
          fill: theme.dark,
          opacity: 0.1,
          fontFamily: fontPair.heading,
          editable: false,
          selectable: false,
          evented: false,
          data: { tr: "d" },
        }),
      );

      // ── Text block anchored at 40% down — below the letter
      const textY = Math.round(CH * 0.4); // ~238

      canvas.add(
        tb(secTitle.toUpperCase(), {
          left: ML + 2,
          top: textY,
          width: leftW - ML - 14,
          fontSize: 26,
          fontWeight: "bold",
          fill: "#ffffff",
          fontFamily: fontPair.heading,
          lineHeight: 1.1,
          charSpacing: 50,
          editable: true,
        }),
      );

      // Short accent bar
      canvas.add(
        sel(
          new fabric.Rect({
            left: ML + 2,
            top: textY + 34,
            width: 34,
            height: 3,
            fill: "#ffffff",
            rx: 1,
            strokeWidth: 0,
            opacity: 0.55,
          }),
        ),
      );

      if (description) {
        canvas.add(
          tb(description, {
            left: ML + 2,
            top: textY + 46,
            width: leftW - ML - 14,
            fontSize: 8,
            fill: "rgba(255,255,255,0.68)",
            fontFamily: fontPair.body,
            lineHeight: 1.65,
            editable: true,
          }),
        );
      }

      // Hairline rule before focus list
      canvas.add(
        sel(
          new fabric.Line([ML + 2, textY + 100, leftW - 14, textY + 100], {
            stroke: "rgba(255,255,255,0.16)",
            strokeWidth: 0.5,
          }),
        ),
      );

      // "OUR FOCUS AREAS" label
      canvas.add(
        tb(`OUR FOCUS AREAS  ·  ${year || new Date().getFullYear()}`, {
          left: ML + 2,
          top: textY + 108,
          width: leftW - ML - 14,
          fontSize: 6.5,
          fontWeight: "bold",
          fill: "rgba(255,255,255,0.35)",
          fontFamily: fontPair.body,
          charSpacing: 150,
          editable: false,
        }),
      );

      // Focus area bullets — 3 rows × 52px
      let faY = textY + 122;
      for (const fa of focusAreas.slice(0, 3)) {
        canvas.add(
          sel(
            new fabric.Rect({
              left: ML + 2,
              top: faY + 8,
              width: 10,
              height: 1.5,
              fill: "rgba(255,255,255,0.45)",
              strokeWidth: 0,
            }),
          ),
        );
        canvas.add(
          tb(fa.title, {
            left: ML + 18,
            top: faY + 3,
            width: leftW - ML - 30,
            fontSize: 9.5,
            fontWeight: "bold",
            fill: "#ffffff",
            fontFamily: fontPair.body,
            editable: false,
          }),
        );
        canvas.add(
          tb(fa.text, {
            left: ML + 18,
            top: faY + 17,
            width: leftW - ML - 30,
            fontSize: 7.5,
            fill: "rgba(255,255,255,0.58)",
            fontFamily: fontPair.body,
            lineHeight: 1.48,
            editable: false,
          }),
        );
        faY += 52;
      }

      // ── Right panel: full-height photo
      const phIdFinal = phId || `esg-${letter.toLowerCase()}-photo`;

      if (imageSrc) {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const fimg = new fabric.Image(img);
            const scale = Math.max(rightW / fimg.width, CH / fimg.height);
            fimg.set({
              left: rightX,
              top: 0,
              scaleX: scale,
              scaleY: scale,
              clipPath: new fabric.Rect({
                left: rightX,
                top: 0,
                width: rightW,
                height: CH,
                absolutePositioned: true,
              }),
              data: { type: "image-block", phId: phIdFinal },
            });
            sel(fimg);
            canvas.add(fimg);
            canvas.renderAll();
            resolve(CH);
          };
          img.onerror = () => {
            canvas.add(
              sel(
                new fabric.Rect({
                  left: rightX,
                  top: 0,
                  width: rightW,
                  height: CH,
                  fill: "#cdd5df",
                  strokeWidth: 0,
                  data: { type: "photo-placeholder", phId: phIdFinal },
                }),
              ),
            );
            canvas.add(
              tb("Double-click to add photo", {
                left: rightX,
                top: CH / 2 - 8,
                width: rightW,
                textAlign: "center",
                fontSize: 9,
                fill: "#8a97a8",
                fontFamily: "Arial",
                editable: false,
                data: { type: "photo-label", phId: phIdFinal },
              }),
            );
            canvas.renderAll();
            resolve(CH);
          };
          img.src = imageSrc;
        });
      }

      canvas.add(
        sel(
          new fabric.Rect({
            left: rightX,
            top: 0,
            width: rightW,
            height: CH,
            fill: "#cdd5df",
            strokeWidth: 0,
            data: { type: "photo-placeholder", phId: phIdFinal },
          }),
        ),
      );
      canvas.add(
        tb("Double-click to add photo", {
          left: rightX,
          top: CH / 2 - 8,
          width: rightW,
          textAlign: "center",
          fontSize: 9,
          fill: "#8a97a8",
          fontFamily: "Arial",
          editable: false,
          data: { type: "photo-label", phId: phIdFinal },
        }),
      );
      return CH;
    }

    case "sdg-list": {
      // List-style SDG renderer: icon square + goal name + narrative + citation
      const { goals: sdgGoals = [] } = block;
      if (!sdgGoals.length) return y;
      const { fontPair } = config;
      const iconSize = 42;
      const textX = ML + iconSize + 12;
      const textW = CONTENT_W - iconSize - 12;

      return new Promise((resolve) => {
        let pending = sdgGoals.length;
        const done = () => {
          if (--pending === 0) {
            canvas.renderAll();
            resolve(y + 6);
          }
        };

        sdgGoals.forEach((goal, idx) => {
          const textLines = Math.max(
            2,
            Math.ceil((goal.narrative?.length || 0) / 108),
          );
          const rowH = Math.max(62, 12 + 14 + textLines * 12 + 14 + 12);

          // Alternating row background
          if (idx % 2 === 1) {
            canvas.add(
              sel(
                new fabric.Rect({
                  left: ML,
                  top: y,
                  width: CONTENT_W,
                  height: rowH,
                  fill: "#f4f6f8",
                  strokeWidth: 0,
                }),
              ),
            );
          }

          const currentY = y;

          // Sørg for at tilføje et '0' foran tallet, hvis det er mindre end 10 (f.eks. '09' i stedet for '9')
          const goalNumStr = String(goal.num).padStart(2, "0");

          // Den helt præcise sti baseret på dit projekt: /sdg-icons/sdg-09.jpg
          const imgUrl = `/sdg-icons/sdg-${goalNumStr}.jpg`;

          fabric.Image.fromURL(
            imgUrl,
            (fimg) => {
              if (fimg && fimg.width) {
                sel(fimg).set({
                  left: ML,
                  top: currentY + 10,
                  scaleX: iconSize / fimg.width,
                  scaleY: iconSize / fimg.height,
                });
                canvas.add(fimg);
              } else {
                // Fallback: Hvis et billede mod forventning fejler, tegnes den gamle firkant
                canvas.add(
                  sel(
                    new fabric.Rect({
                      left: ML,
                      top: currentY + 10,
                      width: iconSize,
                      height: iconSize,
                      fill: goal.color,
                      rx: 3,
                      ry: 3,
                      strokeWidth: 0,
                    }),
                  ),
                );
                canvas.add(
                  tb(String(goal.num), {
                    left: ML,
                    top: currentY + 10 + iconSize / 2 - 9,
                    width: iconSize,
                    textAlign: "center",
                    fontSize: 14,
                    fontWeight: "bold",
                    fill: "#ffffff",
                    fontFamily: fontPair.heading,
                    editable: false,
                  }),
                );
              }
              done();
            },
            { crossOrigin: "anonymous" },
          );

          // Goal name
          canvas.add(
            tb(goal.name, {
              left: textX,
              top: y + 10,
              width: textW,
              fontSize: 10,
              fontWeight: "bold",
              fill: "#1a1a1a",
              fontFamily: fontPair.body,
              editable: false,
            }),
          );

          // Narrative text
          if (goal.narrative) {
            canvas.add(
              tb(goal.narrative, {
                left: textX,
                top: y + 25,
                width: textW,
                fontSize: 8.5,
                fill: "#444444",
                fontFamily: fontPair.body,
                lineHeight: 1.55,
                editable: false,
              }),
            );
          }

          // "Inspired by N. Name" citation in goal color
          canvas.add(
            tb(`Inspired by ${goal.num}. ${goal.name}`, {
              left: textX,
              top: y + rowH - 16,
              width: textW,
              fontSize: 7.5,
              fill: goal.color,
              fontFamily: fontPair.body,
              fontStyle: "italic",
              editable: false,
            }),
          );

          // Bottom separator
          canvas.add(
            sel(
              new fabric.Line([ML, y + rowH, ML + CONTENT_W, y + rowH], {
                stroke: "#e5e7eb",
                strokeWidth: 0.5,
              }),
            ),
          );

          y += rowH;
        });
      });
    }

    case "sdg-grid": {
      // Only render goals the company has selected
      const selectedNums = (block.selectedGoals || [])
        .map(Number)
        .sort((a, b) => a - b);
      if (!selectedNums.length) return y;

      // Adaptive grid: 4 per row for ≤12 goals, 5 for 13–17
      const perRow = selectedNums.length <= 12 ? 4 : 5;
      const tileGap = 8;
      const tileW = Math.floor((CONTENT_W - tileGap * (perRow - 1)) / perRow);
      const tileH = tileW; // square tiles — official icons are square
      const numRows = Math.ceil(selectedNums.length / perRow);
      const totalH = numRows * tileH + (numRows - 1) * tileGap;

      return new Promise((resolve) => {
        let pending = selectedNums.length;
        const done = () => {
          if (--pending === 0) {
            canvas.renderAll();
            resolve(y + totalH + 14);
          }
        };

        selectedNums.forEach((n, i) => {
          const col = i % perRow,
            row = Math.floor(i / perRow);
          const tx = ML + col * (tileW + tileGap);
          const ty = y + row * (tileH + tileGap);

          // Official UN icon image — bundled as base64 so it always loads.
          // sel() makes it a locked template object (not draggable by the user).
          fabric.Image.fromURL(
            SDG_ICON_DATA[n],
            (fimg) => {
              if (fimg && fimg.width) {
                sel(fimg).set({
                  left: tx,
                  top: ty,
                  scaleX: tileW / fimg.width,
                  scaleY: tileH / fimg.height,
                });
                canvas.add(fimg);
              } else {
                // Image failed — show plain coloured tile as fallback
                canvas.add(
                  sel(
                    new fabric.Rect({
                      left: tx,
                      top: ty,
                      width: tileW,
                      height: tileH,
                      fill: SDG_COLORS[n] || "#888",
                      rx: 4,
                      ry: 4,
                      strokeWidth: 0,
                    }),
                  ),
                );
              }
              done();
            },
            { crossOrigin: "anonymous" },
          );
        });
      });
    }

    case "spacer":
      return y + (block.height || 16);
    case "cover":
      return renderCoverBlock(canvas, block.data, config);
    case "toc":
      return renderTOCBlock(
        canvas,
        config,
        block.pageMap || {},
        block.presentBadges,
      );
    default:
      return y;
  }
}

// ─── Cover page ───────────────────────────────────────────────────────────────

function loadLogoAsync(canvas, src, x, y, maxW, maxH) {
  const img = new Image();
  img.onload = () => {
    const fimg = new fabric.Image(img);
    const s = Math.min(maxW / fimg.width, maxH / fimg.height, 1);
    fimg.set({
      left: x,
      top: y,
      scaleX: s,
      scaleY: s,
      data: { type: "image-block" },
    });
    sel(fimg);
    canvas.add(fimg);
    canvas.renderAll();
  };
  img.src = src;
}

function renderCoverBlock(canvas, data, config) {
  return renderCoverESG365(canvas, data, config);
}

function renderCoverESG365(canvas, data, config) {
  const { theme, fontPair } = config;
  const leftW = Math.round(CW * 0.5); // 421px left panel
  const rightX = leftW; // photo starts immediately
  const rightW = CW - rightX; // 421px right panel
  const phId = "cover-photo";

  // White background
  canvas.add(
    sel(
      new fabric.Rect({
        left: 0,
        top: 0,
        width: CW,
        height: CH,
        fill: "#ffffff",
        strokeWidth: 0,
      }),
    ),
  );

  // Left accent stripe
  canvas.add(
    sel(
      new fabric.Rect({
        left: 0,
        top: 0,
        width: 5,
        height: CH,
        fill: theme.primary,
        strokeWidth: 0,
        data: { tr: "p" },
      }),
    ),
  );

  // Logo — top-left
  if (data?.images?.logoImage) {
    loadLogoAsync(canvas, data.images.logoImage, ML, 20, 120, 58);
  } else {
    canvas.add(
      sel(
        new fabric.Rect({
          left: ML,
          top: 20,
          width: 90,
          height: 46,
          fill: "#f5f5f5",
          stroke: "#dddddd",
          strokeWidth: 1,
          rx: 3,
          ry: 3,
          strokeDashArray: [4, 3],
          data: { tr: "l" },
        }),
      ),
    );
    canvas.add(
      tb("LOGO", {
        left: ML,
        top: 38,
        width: 90,
        textAlign: "center",
        fontSize: 8,
        fill: "#cccccc",
        fontFamily: fontPair.body,
      }),
    );
  }

  // Company name — large headline
  canvas.add(
    tb(data?.companyName || "Company Name", {
      left: ML,
      top: 112,
      width: leftW - 56,
      fontSize: 28,
      fontWeight: "bold",
      fill: "#1a1a1a",
      fontFamily: fontPair.heading,
    }),
  );

  // Accent bar
  canvas.add(
    sel(
      new fabric.Rect({
        left: ML,
        top: 182,
        width: 44,
        height: 3,
        fill: theme.primary,
        rx: 1.5,
        strokeWidth: 0,
        data: { tr: "p" },
      }),
    ),
  );

  // Sector + Country
  const sub = [data?.sector, data?.country].filter(Boolean).join("  ·  ");
  if (sub)
    canvas.add(
      tb(sub, {
        left: ML,
        top: 193,
        width: leftW - 56,
        fontSize: 9.5,
        fill: "#555555",
        fontFamily: fontPair.body,
      }),
    );

  // Company description excerpt
  const rawDesc = data?.companyDescription
    ? data.companyDescription
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim()
    : "";
  if (rawDesc) {
    const excerpt =
      rawDesc.length > 240 ? rawDesc.slice(0, 240) + "…" : rawDesc;
    canvas.add(
      tb(excerpt, {
        left: ML,
        top: 216,
        width: leftW - 56,
        fontSize: 8.5,
        fill: "#666666",
        lineHeight: 1.55,
        fontFamily: fontPair.body,
      }),
    );
  }

  // Year + compliance note (lower section)
  canvas.add(
    tb(
      `Sustainability Report  ${data?.reportingYear || new Date().getFullYear()}`,
      {
        left: ML,
        top: CH - 72,
        width: leftW - 56,
        fontSize: 8.5,
        fill: "#888888",
        fontStyle: "italic",
        fontFamily: fontPair.body,
      },
    ),
  );
  canvas.add(
    tb("Prepared in accordance with VSME Basic Module (B1–B11)", {
      left: ML,
      top: CH - 56,
      width: leftW - 56,
      fontSize: 7.5,
      fill: "#aaaaaa",
      fontFamily: fontPair.body,
    }),
  );

  // Contact info at bottom-left
  if (data?.contactName) {
    canvas.add(
      tb(
        data.contactName +
          (data?.contactEmail ? "  ·  " + data.contactEmail : ""),
        {
          left: ML,
          top: CH - 36,
          width: leftW - 56,
          fontSize: 7.5,
          fill: "#888888",
          fontFamily: fontPair.body,
        },
      ),
    );
  }

  // Right side — full-bleed cover photo (check phId key first, then form-upload key)
  const coverPhotoSrc = data?.images?.['cover-photo'] || data?.images?.coverPhoto;
  if (coverPhotoSrc) {
    const coverImg = new Image();
    coverImg.onload = () => {
      const fimg = new fabric.Image(coverImg);
      const scaleX = rightW / fimg.width;
      const scaleY = CH / fimg.height;
      const scale = Math.max(scaleX, scaleY);
      const scaledW = fimg.width * scale;
      const scaledH = fimg.height * scale;
      fimg.set({
        left: rightX + (rightW - scaledW) / 2,
        top: (CH - scaledH) / 2,
        scaleX: scale,
        scaleY: scale,
        data: { type: "image-block", phId },
      });
      sel(fimg);
      canvas.add(fimg);
      canvas.renderAll();
    };
    coverImg.src = coverPhotoSrc;
  } else {
    canvas.add(
      sel(
        new fabric.Rect({
          left: rightX,
          top: 0,
          width: rightW,
          height: CH,
          fill: "#f0f0f0",
          strokeWidth: 0,
          data: { type: "photo-placeholder", phId },
        }),
      ),
    );
    canvas.add(
      sel(
        new fabric.Rect({
          left: rightX,
          top: 0,
          width: rightW,
          height: CH,
          fill: "#e8e8e8",
          strokeWidth: 1.5,
          stroke: "#cccccc",
          strokeDashArray: [8, 4],
          data: { tr: "l" },
        }),
      ),
    );
    canvas.add(
      tb("Double-click to add\ncompany photo", {
        left: rightX,
        top: CH / 2 - 20,
        width: rightW,
        textAlign: "center",
        fontSize: 9,
        fill: "#bbbbbb",
        fontFamily: fontPair.body,
        editable: false,
        data: { type: "photo-label", phId },
      }),
    );
  }

  // Thin vertical divider between panels
  canvas.add(
    sel(
      new fabric.Line([rightX, 0, rightX, CH], {
        stroke: "#e0e0e0",
        strokeWidth: 1,
      }),
    ),
  );

  return CH;
}

// ─── Table of contents ────────────────────────────────────────────────────────

function renderTOCBlock(canvas, config, pageMap, presentBadges) {
  const { theme, fontPair } = config;
  const ALL_SECTIONS = [
    ["B1", "General Information"],
    ["B2", "Policies & Commitments"],
    ["B3", "Energy & GHG Emissions"],
    ["B4", "Pollution"],
    ["B5", "Biodiversity"],
    ["B6", "Water"],
    ["B7", "Resources & Circular Economy"],
    ["B8", "Own Workforce"],
    ["B9", "Health & Safety"],
    ["B10", "Pay & Training"],
    ["B11", "Corporate Conduct"],
    ["SDG", "UN Sustainable Development Goals"],
    ["CERT", "Certifications & Standards"],
  ];
  const SECTIONS = presentBadges
    ? ALL_SECTIONS.filter(([b]) => presentBadges.has(b))
    : ALL_SECTIONS;

  // Header
  canvas.add(
    sel(
      new fabric.Rect({
        left: 0,
        top: 0,
        width: CW,
        height: 72,
        fill: "#ffffff",
        strokeWidth: 0,
      }),
    ),
  );
  canvas.add(
    sel(
      new fabric.Rect({
        left: 0,
        top: 0,
        width: 5,
        height: 72,
        fill: theme.primary,
        strokeWidth: 0,
        data: { tr: "p" },
      }),
    ),
  );
  canvas.add(
    tb("Contents", {
      left: ML,
      top: 12,
      width: 400,
      fontSize: 26,
      fontWeight: "bold",
      fill: "#1a1a1a",
      fontFamily: fontPair.heading,
    }),
  );
  canvas.add(
    tb("VSME Basic Module  ·  B1 – B11", {
      left: ML,
      top: 48,
      width: 400,
      fontSize: 9,
      fill: "#888888",
      fontFamily: fontPair.body,
    }),
  );
  canvas.add(
    sel(
      new fabric.Line([ML, 72, CW - ML, 72], {
        stroke: "#dddddd",
        strokeWidth: 0.5,
      }),
    ),
  );

  // Single column layout
  const rowH = 34;
  const startY = 88;
  const bW_std = 22,
    bW_wide = 34; // badge pill width

  SECTIONS.forEach(([badge, title], i) => {
    const y = startY + i * rowH;
    const bW = badge.length > 2 ? bW_wide : bW_std;

    canvas.add(
      sel(
        new fabric.Rect({
          left: ML,
          top: y + 6,
          width: bW,
          height: 18,
          fill: theme.primary,
          rx: 9,
          ry: 9,
          strokeWidth: 0,
          data: { tr: "p" },
        }),
      ),
    );
    canvas.add(
      tb(badge, {
        left: ML,
        top: y + 10,
        width: bW,
        textAlign: "center",
        fontSize: 7.5,
        fontWeight: "bold",
        fill: "#fff",
        fontFamily: fontPair.body,
      }),
    );
    canvas.add(
      tb(title, {
        left: ML + bW + 10,
        top: y + 7,
        width: CONTENT_W - bW - 56,
        fontSize: 11,
        fill: "#334155",
        fontFamily: fontPair.body,
      }),
    );
    canvas.add(
      tb(pageMap[badge] ? String(pageMap[badge]) : "—", {
        left: ML + CONTENT_W - 36,
        top: y + 7,
        width: 36,
        textAlign: "right",
        fontSize: 11,
        fontWeight: "bold",
        fill: theme.primary,
        fontFamily: fontPair.body,
        data: { tr: "pt" },
      }),
    );
    canvas.add(
      sel(
        new fabric.Line([ML, y + rowH, ML + CONTENT_W, y + rowH], {
          stroke: "#eeeeee",
          strokeWidth: 0.5,
        }),
      ),
    );
  });
  return CH;
}

// ─── PDF export ───────────────────────────────────────────────────────────────

// Walks every Fabric text object on the canvas and writes it to the PDF as
// invisible (opacity-0) text.  The PNG image provides the visual; this layer
// makes the content selectable / copy-pasteable in any PDF reader.
function addInvisibleTextLayer(doc, objects) {
  const PX = 297 / 842; // logical-canvas-px → PDF mm  (both share the 72-dpi basis)

  const invisGS = new doc.GState({ opacity: 0, fillOpacity: 0 });
  const normGS = new doc.GState({ opacity: 1, fillOpacity: 1 });
  doc.setGState(invisGS);

  for (const obj of objects) {
    const raw = obj.text ?? obj._text;
    if (typeof raw !== "string" || !raw.trim()) continue;

    const fontSize = Math.max(6, obj.fontSize || 9);
    const left = obj.left || 0;
    const top = obj.top || 0;
    const width = obj.width || 200;
    const align = obj.textAlign || "left";

    doc.setFontSize(fontSize);

    const x_mm = left * PX;
    const baseY_mm = (top + fontSize * 0.85) * PX; // approx baseline
    const w_mm = width * PX;
    const lineH_mm = fontSize * PX * 1.3;
    const anchorX =
      align === "center"
        ? x_mm + w_mm / 2
        : align === "right"
          ? x_mm + w_mm
          : x_mm;

    raw.split("\n").forEach((line, li) => {
      if (!line.trim()) return;
      try {
        doc.text(line.trim(), anchorX, baseY_mm + li * lineH_mm, { align });
      } catch {}
    });
  }

  doc.setGState(normGS);
}

async function waitForCanvasImages(canvas) {
  const imgs = canvas.getObjects().filter((o) => o.type === "image");
  if (!imgs.length) return;
  const wait = Promise.all(
    imgs.map(
      (fimg) =>
        new Promise((res) => {
          const el = fimg.getElement();
          if (!el) return res();
          if (el.complete && el.naturalWidth > 0) return res();
          el.addEventListener("load", res, { once: true });
          el.addEventListener("error", res, { once: true });
        }),
    ),
  );
  // Safety timeout: don't block export indefinitely if an image fails to fire events
  await Promise.race([wait, new Promise((r) => setTimeout(r, 6000))]);
}

// Fabric.js 5's loadFromJSON can stall when image objects carry a clipPath property,
// because the async enlivenObjects path for clipPaths occasionally doesn't fire its
// callback.  Strip clipPaths from image objects before loading and re-apply them after.
function _stripClipPaths(json) {
  if (!json?.objects) return { json, clips: {} };
  const clips = {};
  const objects = json.objects.map((o, idx) => {
    if (o.type === "image" && o.clipPath) {
      clips[idx] = o.clipPath;
      return { ...o, clipPath: null };
    }
    return o;
  });
  return { json: { ...json, objects }, clips };
}

function _reapplyClipPaths(canvas, clips) {
  const objs = canvas.getObjects();
  Object.entries(clips).forEach(([idx, cp]) => {
    const obj = objs[Number(idx)];
    if (!obj) return;
    obj.clipPath = new fabric.Rect({
      left: cp.left || 0,
      top: cp.top || 0,
      width: cp.width || 0,
      height: cp.height || 0,
      absolutePositioned: cp.absolutePositioned ?? true,
    });
  });
}

async function exportAllPagesToPDF(
  pages,
  allStates,
  config,
  companyName,
  reportingYear,
) {
  const { theme } = config;
  const EXPORT_SCALE = 3;
  const exportEl = document.createElement("canvas");
  exportEl.width = CW * EXPORT_SCALE;
  exportEl.height = CH * EXPORT_SCALE;
  document.body.appendChild(exportEl);
  const offscreen = new fabric.Canvas(exportEl, {
    width: CW * EXPORT_SCALE,
    height: CH * EXPORT_SCALE,
    backgroundColor: "#ffffff",
  });
  offscreen.setZoom(EXPORT_SCALE);
  const doc = new jsPDF({ format: "a4", unit: "mm", orientation: "landscape" });
  for (let i = 0; i < pages.length; i++) {
    if (i > 0) doc.addPage();
    await new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (!done) {
          done = true;
          resolve();
        }
      };
      // Hard per-page deadline — if Fabric's loadFromJSON callback never fires, move on
      const deadline = setTimeout(finish, 15000);

      offscreen.clear();
      offscreen.backgroundColor = "#ffffff";
      const saved = allStates[i];
      if (saved) {
        const { json: safeJson, clips } = _stripClipPaths(saved);
        offscreen.loadFromJSON(safeJson, async () => {
          clearTimeout(deadline);
          try {
            offscreen.setZoom(EXPORT_SCALE);
            _reapplyClipPaths(offscreen, clips);
            await waitForCanvasImages(offscreen);
            recolorCanvas(offscreen, theme);
            offscreen.renderAll();
          } catch (_) {
            /* render best-effort even on error */
          }
          finish();
        });
      } else {
        renderPage(offscreen, pages[i], config, i + 1, companyName)
          .then(() => {
            clearTimeout(deadline);
            finish();
          })
          .catch(() => {
            clearTimeout(deadline);
            finish();
          });
      }
    });
    await new Promise((r) => setTimeout(r, 120));
    doc.addImage(
      exportEl.toDataURL("image/jpeg", 0.92),
      "JPEG",
      0,
      0,
      297,
      210,
    );
    addInvisibleTextLayer(doc, offscreen.getObjects());
  }
  offscreen.dispose();
  document.body.removeChild(exportEl);
  doc.save(
    `VSME_ESG_${(companyName || "Report").replace(/\s+/g, "_")}_${reportingYear || ""}.pdf`,
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CanvasEditor({
  data,
  onClose,
  pendingCanvasDraft = null,
}) {
  const { update: updateForm } = useForm();
  const dataRef = useRef(data);
  dataRef.current = data;

  const canvasElRefs = useRef([]);
  const fabricInstances = useRef([]);
  const pageContainerRefs = useRef([]);
  const historyRef = useRef({});
  const fileInputRef = useRef(null);
  const activeIdxRef = useRef(0);
  const pushHistoryRef = useRef(null);
  const lastPointerRef = useRef({});
  const updateSelColorRef = useRef(null);
  const userObjectsRef = useRef({}); // per-page cache of user-added objects, always up to date
  const pagesRef = useRef(null); // kept in sync each render for use in callbacks
  // Per-page canvas overrides — keyed by page index.
  // Structure: { pageCount: N, dataSnapshot: {...}, states: { [idx]: fabricJSON } }
  // Cleared when form data has changed since the overrides were saved (dataSnapshot mismatch).
  const pageOverridesRef = useRef(null);
  if (pageOverridesRef.current === null) {
    try {
      const stored = JSON.parse(localStorage.getItem(PAGE_OVERRIDES_KEY) || "null");
      if (stored) {
        const { images: _i, ...currentForm } = data;
        const overrideStale =
          !stored.dataSnapshot ||
          JSON.stringify(stored.dataSnapshot) !== JSON.stringify(currentForm);
        if (overrideStale) {
          localStorage.removeItem(PAGE_OVERRIDES_KEY);
          pageOverridesRef.current = { pageCount: 0, states: {} };
        } else {
          pageOverridesRef.current = stored;
        }
      } else {
        pageOverridesRef.current = { pageCount: 0, states: {} };
      }
    } catch {
      pageOverridesRef.current = { pageCount: 0, states: {} };
    }
  }
  const nudgeTimerRef = useRef(null);
  const prevFontPairRef = useRef(null); // tracks previous font pair for in-place font swapping
  const autoSaveTimerRef = useRef(null);
  const handleSaveCanvasRef = useRef(null);
  const photoUploadTargetRef = useRef(null);

  // Prefer pendingCanvasDraft prop (passed directly from cloud load) over localStorage.
  // If the draft's dataSnapshot doesn't match current form data (e.g. year or currency changed)
  // the draft is considered stale and discarded so pages regenerate from the new data.
  // User-placed objects (photos, shapes) are stored in a SEPARATE key that is never invalidated
  // by form data changes, so they always survive regardless of draft staleness.
  const [savedDraft] = useState(() => {
    // Always seed userObjectsRef from the dedicated user-objects store first.
    // This key is updated immediately on every canvas change and is never cleared by stale detection.
    try {
      const saved = JSON.parse(
        localStorage.getItem(USER_OBJECTS_KEY) || "null",
      );
      if (saved)
        Object.entries(saved).forEach(([idx, objs]) => {
          if (objs?.length) userObjectsRef.current[Number(idx)] = objs;
        });
    } catch {}

    if (pendingCanvasDraft) return pendingCanvasDraft;
    try {
      const draft = JSON.parse(
        localStorage.getItem(CANVAS_STORAGE_KEY) || "null",
      );
      if (!draft) return null;
      const snap = draft.dataSnapshot;
      const { images: _i, ...currentForm } = data;
      const stale =
        !snap || JSON.stringify(snap) !== JSON.stringify(currentForm);
      if (stale) {
        localStorage.removeItem(CANVAS_STORAGE_KEY);
        return null;
      }
      return draft;
    } catch {
      return null;
    }
  });

  const [activeIdx, _setActiveIdx] = useState(0);
  const [themeId, setThemeId] = useState(
    savedDraft?.settings?.themeId ?? "green",
  );
  const [customColor, setCustomColor] = useState(
    savedDraft?.settings?.customColor ?? "#112a57",
  );
  const [reportStyleId] = useState(
    savedDraft?.settings?.reportStyleId ?? "modern",
  );
  const [fontPairId] = useState(
    savedDraft?.settings?.fontPairId ?? "editorial",
  );
  const [hasSelection, setHasSelection] = useState(false);
  const [selectionColor, setSelectionColor] = useState("#112a57");
  const [selType, setSelType] = useState(null); // 'text'|'image'|'rect'|'circle'|'other'|null
  const [selFont, setSelFont] = useState("Arial");
  const [selFontSize, setSelFontSize] = useState(11);
  const [selOpacity, setSelOpacity] = useState(100);
  const [selRx, setSelRx] = useState(0);
  const [bgTolerance, setBgTolerance] = useState(25);
  const [isExporting, setIsExporting] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [, forceUpdate] = useState(0);
  const [dragTargetPage, setDragTargetPage] = useState(null);
  const [deletedPageIndices, setDeletedPageIndices] = useState(() =>
    savedDraft?.settings?.deletedPages?.length
      ? new Set(savedDraft.settings.deletedPages)
      : new Set(),
  );
  const [customPageCount, setCustomPageCount] = useState(
    savedDraft?.settings?.customPageCount ?? 0,
  );
  const [canvasSaveTime, setCanvasSaveTime] = useState(null);
  // Pages that have been manually edited — shown with an indicator; data changes won't overwrite them
  const [customizedPages, setCustomizedPages] = useState(
    () => new Set(Object.keys(pageOverridesRef.current.states).map(Number)),
  );

  const _initDeleted = savedDraft?.settings?.deletedPages?.length
    ? new Set(savedDraft.settings.deletedPages)
    : new Set();
  const deletedPageIndicesRef = useRef(_initDeleted);
  const dragTargetRef = useRef(null); // page index the object is heading toward
  const dragSourceRef = useRef(null); // { fromIdx, obj }
  const crossPageOpsRef = useRef([]); // undo stack for cross-page transfers
  const crossPageRedoRef = useRef([]); // redo stack for cross-page transfers

  const customTheme = useMemo(
    () => makeThemeFromColor(customColor),
    [customColor],
  );
  const THEMES_ALL = useMemo(() => [...THEMES, customTheme], [customTheme]);
  const theme = useMemo(
    () => THEMES_ALL.find((t) => t.id === themeId) || THEMES[0],
    [themeId, THEMES_ALL],
  );
  const fontPair = useMemo(
    () => FONT_PAIRS.find((f) => f.id === fontPairId) || FONT_PAIRS[0],
    [fontPairId],
  );
  const config = useMemo(
    () => ({ theme, fontPair, reportStyle: reportStyleId }),
    [theme, fontPair, reportStyleId],
  );

  const themeRef = useRef(theme);
  const configRef = useRef(config);
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const pages = useMemo(() => buildAllPages(data), [data]);
  pagesRef.current = pages; // keep ref in sync without extra effect

  const setActiveIdx = useCallback((i) => {
    activeIdxRef.current = i;
    _setActiveIdx(i);
    const h = historyRef.current[i];
    setCanUndo(h ? h.idx > 0 : false);
    setCanRedo(h ? h.idx < h.stack.length - 1 : false);
  }, []);

  const pushHistoryForCanvas = useCallback((idx, canvas) => {
    const h = historyRef.current;
    if (!h[idx]) h[idx] = { stack: [], idx: -1 };
    const hist = h[idx],
      json = canvas.toJSON(["data"]);
    hist.stack = hist.stack.slice(0, hist.idx + 1);
    hist.stack.push(json);
    if (hist.stack.length > 40) hist.stack.shift();
    hist.idx = hist.stack.length - 1;
    if (activeIdxRef.current === idx) {
      setCanUndo(hist.idx > 0);
      setCanRedo(false);
    }
    userObjectsRef.current[idx] = json.objects.filter((o) => o.data?.userAdded);
    // Persist user-placed objects. Strip phId image srcs to save localStorage space —
    // they're stored in vsme_esg_images and restored on load. In-memory copy keeps full srcs.
    try {
      const toStore = {};
      Object.entries(userObjectsRef.current).forEach(([k, objs]) => {
        toStore[k] = objs.map((o) =>
          o.type === "image" && o.data?.phId ? { ...o, src: "" } : o,
        );
      });
      localStorage.setItem(USER_OBJECTS_KEY, JSON.stringify(toStore));
    } catch {}
    // Save full page state as an override. Strip image src before persisting (restored from
    // data.images on load). Include a form data snapshot so stale overrides are discarded
    // on next load if the user has changed form data since these were saved.
    pageOverridesRef.current.states[idx] = _stripImgSrc(json);
    pageOverridesRef.current.pageCount = pagesRef.current?.length ?? 0;
    const { images: _oi, ...overrideSnap } = dataRef.current;
    pageOverridesRef.current.dataSnapshot = overrideSnap;
    try {
      localStorage.setItem(
        PAGE_OVERRIDES_KEY,
        JSON.stringify(pageOverridesRef.current),
      );
    } catch {}
    setCustomizedPages((prev) =>
      prev.has(idx) ? prev : new Set([...prev, idx]),
    );
    // New action on this page invalidates any pending cross-page redos involving it
    crossPageRedoRef.current = crossPageRedoRef.current.filter(
      (op) => op.fromIdx !== idx && op.toIdx !== idx,
    );
    // Debounced auto-save to localStorage after any canvas change (2s idle)
    clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(
      () => handleSaveCanvasRef.current?.(),
      2000,
    );
  }, []);
  pushHistoryRef.current = pushHistoryForCanvas;

  const updateSelectionProps = useCallback((obj) => {
    if (!obj) {
      setSelType(null);
      return;
    }
    const t = obj.type;
    if (t === "textbox" || t === "text" || t === "i-text") {
      setSelType("text");
      setSelFont(obj.fontFamily || "Arial");
      setSelFontSize(obj.fontSize || 11);
    } else if (t === "image") {
      setSelType("image");
      setSelOpacity(Math.round((obj.opacity ?? 1) * 100));
    } else if (t === "rect") {
      setSelType("rect");
      setSelRx(Math.round(obj.rx || 0));
      setSelOpacity(Math.round((obj.opacity ?? 1) * 100));
    } else if (t === "circle") {
      setSelType("circle");
      setSelOpacity(Math.round((obj.opacity ?? 1) * 100));
    } else {
      setSelType("other");
    }
    const c =
      t === "line" || (obj.fill === "transparent" && obj.stroke)
        ? obj.stroke
        : obj.fill;
    setSelectionColor(fabricColorToHex(c));
  }, []);
  updateSelColorRef.current = updateSelectionProps;

  // ── Init canvases ──
  useEffect(() => {
    // Reset mount guards every time the canvas editor mounts (handles strict-mode double-invoke
    // and normal close→reopen cycles), so style/font effects never call rerenderAll() on mount.
    reportStyleMountedRef.current = false;
    fontPairMountedRef.current = false;

    // Resolve which draft to use. Both the cloud draft and the local draft are validated
    // against the current form data — if the snapshot no longer matches, pages regenerate
    // from fresh data instead of showing stale canvas content.
    const { images: _imgIgnore, ...currentForm } = data;
    const isStale = (draft) => {
      if (!draft) return true;
      const snap = draft.dataSnapshot;
      return !snap || JSON.stringify(snap) !== JSON.stringify(currentForm);
    };

    let localDraft = null;
    if (pendingCanvasDraft && !isStale(pendingCanvasDraft)) {
      localDraft = pendingCanvasDraft;
    } else if (!pendingCanvasDraft) {
      try {
        const raw = JSON.parse(
          localStorage.getItem(CANVAS_STORAGE_KEY) || "null",
        );
        if (raw) {
          if (!isStale(raw)) localDraft = raw;
          else localStorage.removeItem(CANVAS_STORAGE_KEY);
        }
      } catch {}
    }

    // If the saved overrides are for a different page count, they're stale — clear them.
    if (
      pageOverridesRef.current.pageCount !== 0 &&
      pageOverridesRef.current.pageCount !== pages.length
    ) {
      pageOverridesRef.current = { pageCount: pages.length, states: {} };
      try {
        localStorage.removeItem(PAGE_OVERRIDES_KEY);
      } catch {}
      setCustomizedPages(new Set());
    }

    const instances = new Array(pages.length).fill(null);
    pages.forEach((page, i) => {
      const el = canvasElRefs.current[i];
      if (!el) return;
      const canvas = new fabric.Canvas(el, {
        width: CW,
        height: CH,
        backgroundColor: "#ffffff",
        preserveObjectStacking: true,
        stopContextMenu: true,
      });
      instances[i] = canvas;

      // Full-width background rects (page backgrounds, section headers) should not capture
      // clicks so rubber-band selection works when dragging over them.
      // User-added objects are always selectable regardless of size.
      const origFindTarget = canvas.findTarget.bind(canvas);
      canvas.findTarget = function (e, skipGroup) {
        const target = origFindTarget(e, skipGroup);
        if (
          target &&
          target.type === "rect" &&
          !target.data?.userAdded &&
          target.left <= 0 &&
          target.width >= CW - 1
        ) {
          return null;
        }
        return target;
      };

      canvas.on("mouse:down", (e) => {
        const p = canvas.getPointer(e.e);
        lastPointerRef.current[i] = { x: p.x, y: p.y };
        if (activeIdxRef.current !== i) {
          const prev = instances[activeIdxRef.current];
          if (prev) {
            prev.discardActiveObject();
            prev.renderAll();
          }
          setActiveIdx(i);
          setHasSelection(false);
        }
      });
      canvas.on("selection:created", (e) => {
        if (activeIdxRef.current === i) {
          setHasSelection(true);
          updateSelColorRef.current?.(e.selected?.[0]);
        }
      });
      canvas.on("selection:updated", (e) => {
        if (activeIdxRef.current === i) {
          setHasSelection(true);
          updateSelColorRef.current?.(
            e.selected?.[0] ?? canvas.getActiveObject(),
          );
        }
      });
      canvas.on("selection:cleared", () => {
        if (activeIdxRef.current === i) {
          setHasSelection(false);
          setSelType(null);
        }
      });
      canvas.on("object:moving", (e) => {
        const obj = e.target;
        const centerY = obj.top + obj.getScaledHeight() / 2;
        let newTarget = null;
        if (centerY < 0 && i > 0) {
          newTarget = i - 1;
          dragSourceRef.current = { fromIdx: i, obj };
        } else if (centerY > CH && i < instances.length - 1) {
          newTarget = i + 1;
          dragSourceRef.current = { fromIdx: i, obj };
        } else dragSourceRef.current = null;
        if (newTarget !== dragTargetRef.current) {
          dragTargetRef.current = newTarget;
          setDragTargetPage(newTarget);
        }
      });
      canvas.on("object:modified", () => {
        const target = dragTargetRef.current,
          source = dragSourceRef.current;
        dragTargetRef.current = null;
        dragSourceRef.current = null;
        setDragTargetPage(null);
        if (target !== null && source?.fromIdx === i) {
          const { obj } = source;
          const toCanvas = fabricInstances.current[target];
          if (!toCanvas || !obj) {
            pushHistoryRef.current(i, canvas);
            forceUpdate((n) => n + 1);
            return;
          }
          // Capture pre-transfer states for undo
          const fromHistIdxBefore = historyRef.current[i]?.idx ?? 0;
          const toHistIdxBefore = historyRef.current[target]?.idx ?? 0;
          const preFromJson =
            historyRef.current[i]?.stack[fromHistIdxBefore] ?? null;
          const preToJson = toCanvas.toJSON(["data"]);
          const objH = obj.getScaledHeight(),
            objW = obj.getScaledWidth();
          let newTop =
            target > i
              ? Math.max(0, obj.top - CH)
              : Math.min(CH - objH, CH + obj.top);
          newTop = Math.max(0, Math.min(newTop, CH - Math.max(objH, 20)));
          const newLeft = Math.max(
            0,
            Math.min(obj.left, CW - Math.max(objW, 20)),
          );
          obj.clone((clone) => {
            clone.set({
              left: newLeft,
              top: newTop,
              data: { ...(clone.data || {}), userAdded: true },
            });
            sel(clone);
            // canvas.remove() uses indexOf and can miss the dragged object in Fabric 5's
            // active-object layer — filter ensures it's truly gone from the source canvas
            canvas.remove(obj);
            canvas._objects = canvas._objects.filter((o) => o !== obj);
            canvas.discardActiveObject();
            canvas.renderAll();
            pushHistoryRef.current(i, canvas);
            toCanvas.add(clone);
            toCanvas.bringToFront(clone);
            toCanvas.setActiveObject(clone);
            toCanvas.renderAll();
            pushHistoryRef.current(target, toCanvas);
            // Record the cross-page op for undo/redo
            if (preFromJson) {
              crossPageOpsRef.current.push({
                fromIdx: i,
                toIdx: target,
                fromHistIdxBefore,
                toHistIdxBefore,
                fromHistIdxAfter: historyRef.current[i].idx,
                toHistIdxAfter: historyRef.current[target].idx,
                undo: { fromJson: preFromJson, toJson: preToJson },
                redo: {
                  fromJson:
                    historyRef.current[i].stack[historyRef.current[i].idx],
                  toJson:
                    historyRef.current[target].stack[
                      historyRef.current[target].idx
                    ],
                },
              });
              crossPageRedoRef.current = [];
            }
            const prev = fabricInstances.current[activeIdxRef.current];
            if (prev && activeIdxRef.current !== target) {
              prev.discardActiveObject();
              prev.renderAll();
            }
            setActiveIdx(target);
            setHasSelection(true);
            updateSelColorRef.current?.(clone);
          });
        } else {
          pushHistoryRef.current(i, canvas);
          forceUpdate((n) => n + 1);
        }
      });
      canvas.on("text:changed", () => pushHistoryRef.current(i, canvas));
      canvas.on("mouse:dblclick", (e) => {
        const obj = e.target;
        if (
          obj?.data?.type === "photo-placeholder" ||
          obj?.data?.type === "photo-label"
        ) {
          const phId = obj.data?.phId;
          const placeholder =
            canvas
              .getObjects()
              .find(
                (o) =>
                  o.data?.type === "photo-placeholder" && o.data?.phId === phId,
              ) || obj;
          photoUploadTargetRef.current = {
            canvasIdx: i,
            obj: placeholder,
            canvas,
          };
          fileInputRef.current?.click();
        } else if (obj?.type === "textbox" && obj.editable !== false) {
          canvas.setActiveObject(obj);
          obj.enterEditing();
          canvas.renderAll();
        }
      });
      // Priority: page override (user's manual edits) > saved draft > rebuild from data
      const override = pageOverridesRef.current.states[i];
      const savedState = localDraft?.states?.[i];
      if (override) {
        canvas.loadFromJSON(override, () => {
          _restoreImgSrc(canvas, data.images, configRef.current.theme, () => {
            historyRef.current[i] = {
              stack: [canvas.toJSON(["data"])],
              idx: 0,
            };
          });
        });
      } else if (savedState) {
        canvas.loadFromJSON(savedState, () => {
          _restoreImgSrc(canvas, data.images, configRef.current.theme, () => {
            historyRef.current[i] = { stack: [canvas.toJSON(["data"])], idx: 0 };
          });
        });
      } else {
        renderPage(
          canvas,
          page,
          configRef.current,
          i + 1,
          data.companyName,
        ).then(() => {
          // Exclude images that the page builder already rendered from data.images
          // (identified by phId) to avoid duplicates on the canvas.
          const savedUserObjs = (userObjectsRef.current[i] || []).filter(
            (o) => !(o.type === "image" && o.data?.phId && data.images?.[o.data.phId]),
          );
          const finish = () => {
            if (!historyRef.current[i])
              historyRef.current[i] = {
                stack: [canvas.toJSON(["data"])],
                idx: 0,
              };
          };
          if (savedUserObjs.length > 0) {
            fabric.util.enlivenObjects(savedUserObjs, (objs) => {
              objs.forEach((o) => {
                o.set({
                  borderColor: "#2563eb",
                  cornerColor: "#2563eb",
                  cornerStyle: "circle",
                  cornerSize: 9,
                  transparentCorners: false,
                  padding: 2,
                });
                canvas.add(o);
              });
              recolorCanvas(canvas, configRef.current.theme);
              canvas.renderAll();
              finish();
            });
          } else {
            finish();
          }
        });
      }
    });
    fabricInstances.current = instances;
    return () => {
      instances.forEach((c) => c?.dispose());
      fabricInstances.current = [];
    };
  }, []); // eslint-disable-line

  // Theme change — recolor only
  useEffect(() => {
    fabricInstances.current.forEach((c) => {
      if (c) recolorCanvas(c, theme);
    });
  }, [theme]); // eslint-disable-line

  // Helper: re-render all pages, preserving user-added objects.
  // Pages with manual overrides are skipped — the user's layout is preserved.
  const rerenderAll = useCallback(() => {
    fabricInstances.current.forEach((canvas, i) => {
      if (!canvas || !pages[i] || deletedPageIndicesRef.current.has(i)) return;
      if (pageOverridesRef.current.states[i]) return; // user customized — don't overwrite
      const savedUserObjs = (userObjectsRef.current[i] || []).filter(
        (o) => !(o.type === "image" && o.data?.phId && data.images?.[o.data.phId]),
      );
      renderPage(
        canvas,
        pages[i],
        configRef.current,
        i + 1,
        data.companyName,
      ).then(() => {
        const finish = () => {
          // Snapshot after user objects are placed so future switches see them
          userObjectsRef.current[i] = canvas
            .toJSON(["data"])
            .objects.filter((o) => o.data?.userAdded);
          try {
            localStorage.setItem(
              USER_OBJECTS_KEY,
              JSON.stringify(userObjectsRef.current),
            );
          } catch {}
          historyRef.current[i] = { stack: [canvas.toJSON(["data"])], idx: 0 };
          if (activeIdxRef.current === i) {
            setCanUndo(false);
            setCanRedo(false);
          }
        };
        if (savedUserObjs.length > 0) {
          // Enliven the saved plain JSON objects into real Fabric objects, then add on top
          fabric.util.enlivenObjects(savedUserObjs, (objs) => {
            objs.forEach((o) => {
              o.set({
                borderColor: "#2563eb",
                cornerColor: "#2563eb",
                cornerStyle: "circle",
                cornerSize: 9,
                transparentCorners: false,
                padding: 2,
              });
              canvas.add(o);
            });
            recolorCanvas(canvas, themeRef.current);
            canvas.renderAll();
            finish();
          });
        } else {
          finish();
        }
      });
    });
  }, [pages, data]); // eslint-disable-line

  // Report style change — re-render ALL pages
  const reportStyleMountedRef = useRef(false);
  useEffect(() => {
    if (!reportStyleMountedRef.current) {
      reportStyleMountedRef.current = true;
      return;
    }
    rerenderAll();
  }, [reportStyleId]); // eslint-disable-line

  // Font pair change — swap fonts in-place so user edits are preserved
  const fontPairMountedRef = useRef(false);
  useEffect(() => {
    if (!fontPairMountedRef.current) {
      fontPairMountedRef.current = true;
      prevFontPairRef.current = fontPair;
      return;
    }
    const oldPair = prevFontPairRef.current;
    prevFontPairRef.current = fontPair;
    fabricInstances.current.forEach((c) => {
      if (!c) return;
      c.getObjects().forEach((obj) => {
        if (obj.data?.userAdded) return;
        if (
          obj.type === "textbox" ||
          obj.type === "text" ||
          obj.type === "i-text"
        ) {
          if (oldPair && obj.fontFamily === oldPair.heading)
            obj.set("fontFamily", fontPair.heading);
          else if (oldPair && obj.fontFamily === oldPair.body)
            obj.set("fontFamily", fontPair.body);
          obj.dirty = true;
        }
      });
      c.requestRenderAll();
    });
  }, [fontPairId]); // eslint-disable-line

  // New custom blank page — initialize its Fabric canvas after DOM renders it
  useEffect(() => {
    if (customPageCount === 0) return;
    const i = pages.length + customPageCount - 1;
    const el = canvasElRefs.current[i];
    if (!el || fabricInstances.current[i]) return;
    const canvas = new fabric.Canvas(el, {
      width: CW,
      height: CH,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
      stopContextMenu: true,
    });
    while (fabricInstances.current.length <= i)
      fabricInstances.current.push(null);
    fabricInstances.current[i] = canvas;
    canvas.on("mouse:down", (e) => {
      const p = canvas.getPointer(e.e);
      lastPointerRef.current[i] = { x: p.x, y: p.y };
      if (activeIdxRef.current !== i) {
        const prev = fabricInstances.current[activeIdxRef.current];
        if (prev) {
          prev.discardActiveObject();
          prev.renderAll();
        }
        setActiveIdx(i);
        setHasSelection(false);
      }
    });
    canvas.on("selection:created", (e) => {
      if (activeIdxRef.current === i) {
        setHasSelection(true);
        updateSelColorRef.current?.(e.selected?.[0]);
      }
    });
    canvas.on("selection:updated", (e) => {
      if (activeIdxRef.current === i) {
        setHasSelection(true);
        updateSelColorRef.current?.(
          e.selected?.[0] ?? canvas.getActiveObject(),
        );
      }
    });
    canvas.on("selection:cleared", () => {
      if (activeIdxRef.current === i) {
        setHasSelection(false);
        setSelType(null);
      }
    });
    canvas.on("object:moving", (e) => {
      const obj = e.target;
      const centerY = obj.top + obj.getScaledHeight() / 2;
      let newTarget = null;
      if (centerY < 0 && i > 0) {
        newTarget = i - 1;
        dragSourceRef.current = { fromIdx: i, obj };
      } else if (centerY > CH && i < fabricInstances.current.length - 1) {
        newTarget = i + 1;
        dragSourceRef.current = { fromIdx: i, obj };
      } else dragSourceRef.current = null;
      if (newTarget !== dragTargetRef.current) {
        dragTargetRef.current = newTarget;
        setDragTargetPage(newTarget);
      }
    });
    canvas.on("object:modified", () => {
      const target = dragTargetRef.current,
        source = dragSourceRef.current;
      dragTargetRef.current = null;
      dragSourceRef.current = null;
      setDragTargetPage(null);
      if (target !== null && source?.fromIdx === i) {
        const { obj } = source;
        const toCanvas = fabricInstances.current[target];
        if (!toCanvas || !obj) {
          pushHistoryRef.current(i, canvas);
          forceUpdate((n) => n + 1);
          return;
        }
        const fromHistIdxBefore = historyRef.current[i]?.idx ?? 0;
        const toHistIdxBefore = historyRef.current[target]?.idx ?? 0;
        const preFromJson =
          historyRef.current[i]?.stack[fromHistIdxBefore] ?? null;
        const preToJson = toCanvas.toJSON(["data"]);
        const objH = obj.getScaledHeight(),
          objW = obj.getScaledWidth();
        let newTop =
          target > i
            ? Math.max(0, obj.top - CH)
            : Math.min(CH - objH, CH + obj.top);
        newTop = Math.max(0, Math.min(newTop, CH - Math.max(objH, 20)));
        const newLeft = Math.max(
          0,
          Math.min(obj.left, CW - Math.max(objW, 20)),
        );
        obj.clone((clone) => {
          clone.set({
            left: newLeft,
            top: newTop,
            data: { ...(clone.data || {}), userAdded: true },
          });
          sel(clone);
          canvas.remove(obj);
          canvas._objects = canvas._objects.filter((o) => o !== obj);
          canvas.discardActiveObject();
          canvas.renderAll();
          pushHistoryRef.current(i, canvas);
          toCanvas.add(clone);
          toCanvas.bringToFront(clone);
          toCanvas.setActiveObject(clone);
          toCanvas.renderAll();
          pushHistoryRef.current(target, toCanvas);
          if (preFromJson) {
            crossPageOpsRef.current.push({
              fromIdx: i,
              toIdx: target,
              fromHistIdxBefore,
              toHistIdxBefore,
              fromHistIdxAfter: historyRef.current[i].idx,
              toHistIdxAfter: historyRef.current[target].idx,
              undo: { fromJson: preFromJson, toJson: preToJson },
              redo: {
                fromJson:
                  historyRef.current[i].stack[historyRef.current[i].idx],
                toJson:
                  historyRef.current[target].stack[
                    historyRef.current[target].idx
                  ],
              },
            });
            crossPageRedoRef.current = [];
          }
          const prev = fabricInstances.current[activeIdxRef.current];
          if (prev && activeIdxRef.current !== target) {
            prev.discardActiveObject();
            prev.renderAll();
          }
          setActiveIdx(target);
          setHasSelection(true);
          updateSelColorRef.current?.(clone);
        });
      } else {
        pushHistoryRef.current(i, canvas);
        forceUpdate((n) => n + 1);
      }
    });
    canvas.on("text:changed", () => pushHistoryRef.current(i, canvas));
    canvas.on("mouse:dblclick", (e) => {
      const obj = e.target;
      if (obj?.type === "textbox" && obj.editable !== false) {
        canvas.setActiveObject(obj);
        obj.enterEditing();
        canvas.renderAll();
      }
    });
    canvas.renderAll();
    historyRef.current[i] = { stack: [canvas.toJSON(["data"])], idx: 0 };
    recolorCanvas(canvas, themeRef.current);
    setActiveIdx(i);
    setTimeout(() => {
      pageContainerRefs.current[i]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }, [customPageCount]); // eslint-disable-line

  const handleUndo = useCallback(() => {
    const idx = activeIdxRef.current,
      canvas = fabricInstances.current[idx],
      h = historyRef.current[idx];
    // Cross-page undo: if the last transfer involved the active page, restore both canvases
    const ops = crossPageOpsRef.current;
    const lastOp = ops.length > 0 ? ops[ops.length - 1] : null;
    if (lastOp && (lastOp.fromIdx === idx || lastOp.toIdx === idx)) {
      ops.pop();
      crossPageRedoRef.current.push(lastOp);
      const fromCanvas = fabricInstances.current[lastOp.fromIdx],
        toCanvas = fabricInstances.current[lastOp.toIdx];
      const fromHist = historyRef.current[lastOp.fromIdx],
        toHist = historyRef.current[lastOp.toIdx];
      if (fromHist) fromHist.idx = lastOp.fromHistIdxBefore;
      if (toHist) toHist.idx = lastOp.toHistIdxBefore;
      fromCanvas?.loadFromJSON(lastOp.undo.fromJson, () => {
        recolorCanvas(fromCanvas, themeRef.current);
        fromCanvas.renderAll();
        userObjectsRef.current[lastOp.fromIdx] =
          lastOp.undo.fromJson.objects?.filter((o) => o.data?.userAdded) ?? [];
        try {
          localStorage.setItem(
            USER_OBJECTS_KEY,
            JSON.stringify(userObjectsRef.current),
          );
        } catch {}
      });
      toCanvas?.loadFromJSON(lastOp.undo.toJson, () => {
        recolorCanvas(toCanvas, themeRef.current);
        toCanvas.renderAll();
        userObjectsRef.current[lastOp.toIdx] =
          lastOp.undo.toJson.objects?.filter((o) => o.data?.userAdded) ?? [];
        try {
          localStorage.setItem(
            USER_OBJECTS_KEY,
            JSON.stringify(userObjectsRef.current),
          );
        } catch {}
      });
      setCanUndo(false);
      setCanRedo(true);
      return;
    }
    // Normal single-page undo
    if (!canvas || !h || h.idx <= 0) return;
    h.idx--;
    canvas.loadFromJSON(h.stack[h.idx], () => {
      recolorCanvas(canvas, themeRef.current);
      canvas.renderAll();
      userObjectsRef.current[idx] = h.stack[h.idx].objects.filter(
        (o) => o.data?.userAdded,
      );
      try {
        localStorage.setItem(
          USER_OBJECTS_KEY,
          JSON.stringify(userObjectsRef.current),
        );
      } catch {}
    });
    setCanUndo(h.idx > 0);
    setCanRedo(true);
  }, []);

  const handleRedo = useCallback(() => {
    const idx = activeIdxRef.current,
      canvas = fabricInstances.current[idx],
      h = historyRef.current[idx];
    // Cross-page redo: if we previously undid a cross-page transfer, redo both canvases
    const redos = crossPageRedoRef.current;
    const lastRedo = redos.length > 0 ? redos[redos.length - 1] : null;
    if (lastRedo && (lastRedo.fromIdx === idx || lastRedo.toIdx === idx)) {
      redos.pop();
      crossPageOpsRef.current.push(lastRedo);
      const fromCanvas = fabricInstances.current[lastRedo.fromIdx],
        toCanvas = fabricInstances.current[lastRedo.toIdx];
      const fromHist = historyRef.current[lastRedo.fromIdx],
        toHist = historyRef.current[lastRedo.toIdx];
      if (fromHist) fromHist.idx = lastRedo.fromHistIdxAfter;
      if (toHist) toHist.idx = lastRedo.toHistIdxAfter;
      fromCanvas?.loadFromJSON(lastRedo.redo.fromJson, () => {
        recolorCanvas(fromCanvas, themeRef.current);
        fromCanvas.renderAll();
        userObjectsRef.current[lastRedo.fromIdx] =
          lastRedo.redo.fromJson.objects?.filter((o) => o.data?.userAdded) ??
          [];
        try {
          localStorage.setItem(
            USER_OBJECTS_KEY,
            JSON.stringify(userObjectsRef.current),
          );
        } catch {}
      });
      toCanvas?.loadFromJSON(lastRedo.redo.toJson, () => {
        recolorCanvas(toCanvas, themeRef.current);
        toCanvas.renderAll();
        userObjectsRef.current[lastRedo.toIdx] =
          lastRedo.redo.toJson.objects?.filter((o) => o.data?.userAdded) ?? [];
        try {
          localStorage.setItem(
            USER_OBJECTS_KEY,
            JSON.stringify(userObjectsRef.current),
          );
        } catch {}
      });
      setCanUndo(true);
      setCanRedo(false);
      return;
    }
    // Normal single-page redo
    if (!canvas || !h || h.idx >= h.stack.length - 1) return;
    h.idx++;
    canvas.loadFromJSON(h.stack[h.idx], () => {
      recolorCanvas(canvas, themeRef.current);
      canvas.renderAll();
      userObjectsRef.current[idx] = h.stack[h.idx].objects.filter(
        (o) => o.data?.userAdded,
      );
      try {
        localStorage.setItem(
          USER_OBJECTS_KEY,
          JSON.stringify(userObjectsRef.current),
        );
      } catch {}
    });
    setCanUndo(true);
    setCanRedo(h.idx < h.stack.length - 1);
  }, []);

  const applySelectionColor = useCallback((color, pushHist = false) => {
    const idx = activeIdxRef.current,
      canvas = fabricInstances.current[idx];
    if (!canvas) return;
    canvas.getActiveObjects().forEach((obj) => applyColorToObj(obj, color));
    canvas.renderAll();
    setSelectionColor(color);
    if (pushHist) pushHistoryRef.current(idx, canvas);
  }, []);
  const applyFontFamily = useCallback((family) => {
    const idx = activeIdxRef.current,
      canvas = fabricInstances.current[idx];
    if (!canvas) return;
    canvas.getActiveObjects().forEach((obj) => {
      if ("fontFamily" in obj) obj.set("fontFamily", family);
    });
    canvas.renderAll();
    setSelFont(family);
    pushHistoryRef.current(idx, canvas);
  }, []);
  const applyFontSize = useCallback((size) => {
    const idx = activeIdxRef.current,
      canvas = fabricInstances.current[idx];
    if (!canvas) return;
    canvas.getActiveObjects().forEach((obj) => {
      if ("fontSize" in obj) obj.set("fontSize", Number(size));
    });
    canvas.renderAll();
    setSelFontSize(size);
    pushHistoryRef.current(idx, canvas);
  }, []);
  const applyOpacity = useCallback((pct, pushHist = false) => {
    const idx = activeIdxRef.current,
      canvas = fabricInstances.current[idx];
    if (!canvas) return;
    canvas.getActiveObjects().forEach((obj) => obj.set("opacity", pct / 100));
    canvas.renderAll();
    setSelOpacity(pct);
    if (pushHist) pushHistoryRef.current(idx, canvas);
  }, []);
  const applyCornerRadius = useCallback((r) => {
    const idx = activeIdxRef.current,
      canvas = fabricInstances.current[idx];
    if (!canvas) return;
    canvas.getActiveObjects().forEach((obj) => {
      if (obj.type === "rect") {
        obj.set({ rx: r, ry: r });
        obj.dirty = true;
      }
    });
    canvas.renderAll();
    setSelRx(r);
    pushHistoryRef.current(idx, canvas);
  }, []);

  const handleRemoveBg = useCallback(() => {
    const idx = activeIdxRef.current,
      canvas = fabricInstances.current[idx];
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (!obj || obj.type !== "image") return;
    const imgEl = obj.getElement(),
      w = imgEl.naturalWidth || imgEl.width,
      h = imgEl.naturalHeight || imgEl.height;
    if (!w || !h) return;
    const off = document.createElement("canvas");
    off.width = w;
    off.height = h;
    const ctx = off.getContext("2d");
    ctx.drawImage(imgEl, 0, 0);
    const id = ctx.getImageData(0, 0, w, h),
      d = id.data,
      thr = (bgTolerance / 100) * Math.sqrt(255 * 255 * 3);
    for (let i = 0; i < d.length; i += 4) {
      const dist = Math.sqrt(
        (255 - d[i]) ** 2 + (255 - d[i + 1]) ** 2 + (255 - d[i + 2]) ** 2,
      );
      if (dist < thr)
        d[i + 3] = Math.round(d[i + 3] * Math.min(1, (dist / thr) * 1.5));
    }
    ctx.putImageData(id, 0, 0);
    obj.setSrc(off.toDataURL("image/png"), () => {
      canvas.renderAll();
      pushHistoryRef.current(idx, canvas);
    });
  }, [bgTolerance]);

  const handleCustomColor = useCallback((color) => {
    setCustomColor(color);
    setThemeId("custom");
  }, []);

  // ── Shape tools ──
  const handleAddShape = useCallback((shapeType) => {
    const idx = activeIdxRef.current,
      canvas = fabricInstances.current[idx];
    if (!canvas) return;
    const ptr = lastPointerRef.current[idx];
    const cx = ptr ? Math.max(ML, Math.min(ptr.x, CW - 80)) : ML + 80;
    const cy = ptr ? Math.max(30, Math.min(ptr.y, CH - 80)) : 200;
    const t = themeRef.current;
    let obj;
    if (shapeType === "circle") {
      obj = sel(
        new fabric.Circle({
          left: cx,
          top: cy,
          radius: 40,
          fill: t.light,
          stroke: t.primary,
          strokeWidth: 1.5,
          data: { tr: "l", userAdded: true },
        }),
      );
    } else if (shapeType === "rect") {
      obj = sel(
        new fabric.Rect({
          left: cx,
          top: cy,
          width: 120,
          height: 70,
          fill: t.light,
          stroke: t.primary,
          strokeWidth: 1.5,
          rx: 0,
          ry: 0,
          data: { tr: "l", userAdded: true },
        }),
      );
    } else if (shapeType === "rounded") {
      obj = sel(
        new fabric.Rect({
          left: cx,
          top: cy,
          width: 120,
          height: 70,
          fill: t.light,
          stroke: t.primary,
          strokeWidth: 1.5,
          rx: 14,
          ry: 14,
          data: { tr: "l", userAdded: true },
        }),
      );
    } else if (shapeType === "line") {
      obj = sel(
        new fabric.Line([cx, cy, cx + 160, cy], {
          stroke: t.primary,
          strokeWidth: 2,
          data: { tr: "ps", userAdded: true },
        }),
      );
    } else if (shapeType === "triangle") {
      obj = sel(
        new fabric.Triangle({
          left: cx,
          top: cy,
          width: 80,
          height: 70,
          fill: t.light,
          stroke: t.primary,
          strokeWidth: 1.5,
          data: { tr: "l", userAdded: true },
        }),
      );
    }
    if (obj) {
      canvas.add(obj);
      canvas.setActiveObject(obj);
      canvas.renderAll();
      pushHistoryRef.current(idx, canvas);
    }
  }, []);

  const handleDuplicate = useCallback(() => {
    const idx = activeIdxRef.current,
      canvas = fabricInstances.current[idx];
    if (!canvas) return;
    const objs = canvas.getActiveObjects();
    if (!objs.length) return;
    const clones = [];
    let pending = objs.length;
    objs.forEach((obj) => {
      obj.clone((clone) => {
        clone.set({
          left: (clone.left || 0) + 14,
          top: (clone.top || 0) + 14,
          data: { ...(clone.data || {}), userAdded: true },
        });
        sel(clone);
        canvas.add(clone);
        clones.push(clone);
        if (--pending === 0) {
          canvas.discardActiveObject();
          if (clones.length === 1) canvas.setActiveObject(clones[0]);
          else
            canvas.setActiveObject(
              new fabric.ActiveSelection(clones, { canvas }),
            );
          canvas.renderAll();
          pushHistoryRef.current(idx, canvas);
        }
      });
    });
  }, []);

  const handleAddText = useCallback(() => {
    const idx = activeIdxRef.current,
      canvas = fabricInstances.current[idx];
    if (!canvas) return;
    const ptr = lastPointerRef.current[idx];
    const x = ptr ? Math.max(0, Math.min(ptr.x, CW - 100)) : ML;
    const y = ptr ? Math.max(0, Math.min(ptr.y, CH - 40)) : 200;
    const t = tb("Your text here", {
      left: x,
      top: y,
      width: Math.min(CONTENT_W, CW - x),
      fontSize: 11,
      fill: "#334155",
      data: { type: "user-text", userAdded: true },
    });
    canvas.add(t);
    canvas.setActiveObject(t);
    t.enterEditing();
    canvas.renderAll();
    pushHistoryRef.current(idx, canvas);
  }, []);
  const handleAddImage = useCallback(() => fileInputRef.current?.click(), []);
  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const photoTarget = photoUploadTargetRef.current;
    photoUploadTargetRef.current = null;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const fimg = new fabric.Image(img);
        if (photoTarget) {
          // Replace the photo placeholder with the uploaded image
          const {
            canvasIdx,
            obj: placeholder,
            canvas: targetCanvas,
          } = photoTarget;
          const phId = placeholder.data?.phId;
          const x = placeholder.left,
            y = placeholder.top;
          const w = placeholder.width * (placeholder.scaleX || 1);
          const h = placeholder.height * (placeholder.scaleY || 1);
          targetCanvas
            .getObjects()
            .filter((o) => o.data?.phId === phId)
            .forEach((o) => targetCanvas.remove(o));
          const isCoverStyle = h >= CH - 5;
          const scale = isCoverStyle
            ? Math.max(w / fimg.width, h / fimg.height)
            : Math.min(w / fimg.width, h / fimg.height);
          const scaledW = fimg.width * scale;
          const scaledH = fimg.height * scale;
          const imgLeft = isCoverStyle ? x - (scaledW - w) / 2 : x;
          const imgTop = isCoverStyle ? y - (scaledH - h) / 2 : y;
          fimg.set({
            left: imgLeft,
            top: imgTop,
            scaleX: scale,
            scaleY: scale,
            ...(isCoverStyle
              ? {
                  clipPath: new fabric.Rect({
                    left: x,
                    top: y,
                    width: w,
                    height: h,
                    absolutePositioned: true,
                  }),
                }
              : {}),
            data: {
              type: "image-block",
              phId: phId || undefined,
              userAdded: true,
            },
          });
          sel(fimg);
          targetCanvas.add(fimg);
          targetCanvas.setActiveObject(fimg);
          targetCanvas.renderAll();
          pushHistoryRef.current(canvasIdx, targetCanvas);
          if (phId)
            updateForm({
              images: {
                ...(dataRef.current.images || {}),
                [phId]: ev.target.result,
              },
            });
        } else {
          const idx = activeIdxRef.current,
            ptr = lastPointerRef.current[idx];
          const scale = Math.min(240 / fimg.width, 180 / fimg.height, 1);
          const x = ptr
            ? Math.max(0, Math.min(ptr.x, CW - fimg.width * scale))
            : ML;
          const y = ptr
            ? Math.max(0, Math.min(ptr.y, CH - fimg.height * scale))
            : 140;
          fimg.set({
            left: x,
            top: y,
            scaleX: scale,
            scaleY: scale,
            data: { type: "image-block", userAdded: true },
          });
          sel(fimg);
          const canvas = fabricInstances.current[idx];
          if (!canvas) return;
          canvas.add(fimg);
          canvas.setActiveObject(fimg);
          canvas.renderAll();
          pushHistoryRef.current(idx, canvas);
        }
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, []);

  const handleDelete = useCallback(() => {
    const idx = activeIdxRef.current,
      canvas = fabricInstances.current[idx];
    if (!canvas) return;
    canvas
      .getActiveObjects()
      .filter((o) => o.selectable !== false)
      .forEach((o) => canvas.remove(o));
    canvas.discardActiveObject();
    canvas.renderAll();
    pushHistoryRef.current(idx, canvas);
  }, []);
  const handleBringForward = useCallback(() => {
    const idx = activeIdxRef.current,
      canvas = fabricInstances.current[idx];
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    const objs =
      active.type === "activeSelection"
        ? [...active.getObjects()].sort(
            (a, b) =>
              canvas.getObjects().indexOf(b) - canvas.getObjects().indexOf(a),
          )
        : [active];
    objs.forEach((o) => canvas.bringForward(o));
    canvas.renderAll();
    pushHistoryRef.current(idx, canvas);
  }, []);
  const handleSendBackward = useCallback(() => {
    const idx = activeIdxRef.current,
      canvas = fabricInstances.current[idx];
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    const objs =
      active.type === "activeSelection"
        ? [...active.getObjects()].sort(
            (a, b) =>
              canvas.getObjects().indexOf(a) - canvas.getObjects().indexOf(b),
          )
        : [active];
    objs.forEach((o) => canvas.sendBackwards(o));
    canvas.renderAll();
    pushHistoryRef.current(idx, canvas);
  }, []);
  const handleBringToFront = useCallback(() => {
    const idx = activeIdxRef.current,
      canvas = fabricInstances.current[idx];
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    const objs =
      active.type === "activeSelection" ? [...active.getObjects()] : [active];
    objs.forEach((o) => canvas.bringToFront(o));
    canvas.renderAll();
    pushHistoryRef.current(idx, canvas);
  }, []);
  const handleSendToBack = useCallback(() => {
    const idx = activeIdxRef.current,
      canvas = fabricInstances.current[idx];
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    const objs =
      active.type === "activeSelection"
        ? [...active.getObjects()].reverse()
        : [active];
    objs.forEach((o) => canvas.sendToBack(o));
    canvas.renderAll();
    pushHistoryRef.current(idx, canvas);
  }, []);
  const handleDeletePage = useCallback(
    (pageIdx) => {
      const totalCount = pages.length + customPageCount;
      const visibleCount = totalCount - deletedPageIndicesRef.current.size;
      if (visibleCount <= 1) return;
      const newSet = new Set(deletedPageIndicesRef.current);
      newSet.add(pageIdx);
      deletedPageIndicesRef.current = newSet;
      setDeletedPageIndices(newSet);
      crossPageOpsRef.current = crossPageOpsRef.current.filter(
        (op) => op.fromIdx !== pageIdx && op.toIdx !== pageIdx,
      );
      crossPageRedoRef.current = crossPageRedoRef.current.filter(
        (op) => op.fromIdx !== pageIdx && op.toIdx !== pageIdx,
      );
      delete userObjectsRef.current[pageIdx];
      try {
        localStorage.setItem(
          USER_OBJECTS_KEY,
          JSON.stringify(userObjectsRef.current),
        );
      } catch {}
      if (activeIdxRef.current === pageIdx) {
        const allIdx = [...Array(totalCount).keys()];
        const visible = allIdx.filter((i) => !newSet.has(i));
        const newActive =
          visible.find((i) => i > pageIdx) ?? visible[visible.length - 1] ?? 0;
        setActiveIdx(newActive);
        pageContainerRefs.current[newActive]?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    },
    [pages, customPageCount, setActiveIdx],
  );

  const handleRestorePage = useCallback(
    (pageIdx) => {
      const newSet = new Set(deletedPageIndicesRef.current);
      newSet.delete(pageIdx);
      deletedPageIndicesRef.current = newSet;
      setDeletedPageIndices(newSet);
      setActiveIdx(pageIdx);
      setTimeout(() => {
        pageContainerRefs.current[pageIdx]?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 50);
    },
    [setActiveIdx],
  );

  const handleAddBlankPage = useCallback(() => {
    setCustomPageCount((c) => c + 1);
  }, []);

  const handlePageJump = useCallback(
    (idx) => {
      setActiveIdx(idx);
      pageContainerRefs.current[idx]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    },
    [setActiveIdx],
  );
  const handleResetCurrentPage = useCallback(() => {
    const i = activeIdxRef.current;
    const canvas = fabricInstances.current[i];
    const page = pagesRef.current?.[i];
    if (!canvas || !page) return;
    if (
      !window.confirm(
        "Reset this page to the current form data? Your manual layout edits will be lost.",
      )
    )
      return;
    delete pageOverridesRef.current.states[i];
    try {
      localStorage.setItem(
        PAGE_OVERRIDES_KEY,
        JSON.stringify(pageOverridesRef.current),
      );
    } catch {}
    setCustomizedPages((prev) => {
      const n = new Set(prev);
      n.delete(i);
      return n;
    });
    const savedUserObjs = (userObjectsRef.current[i] || []).filter(
      (o) => !(o.type === "image" && o.data?.phId && data.images?.[o.data.phId]),
    );
    renderPage(canvas, page, configRef.current, i + 1, data.companyName).then(
      () => {
        const finish = () => {
          historyRef.current[i] = { stack: [canvas.toJSON(["data"])], idx: 0 };
          setCanUndo(false);
          setCanRedo(false);
        };
        if (savedUserObjs.length) {
          fabric.util.enlivenObjects(savedUserObjs, (objs) => {
            objs.forEach((o) => {
              o.set({
                borderColor: "#2563eb",
                cornerColor: "#2563eb",
                cornerStyle: "circle",
                cornerSize: 9,
                transparentCorners: false,
                padding: 2,
              });
              canvas.add(o);
            });
            recolorCanvas(canvas, themeRef.current);
            canvas.renderAll();
            finish();
          });
        } else finish();
      },
    );
  }, [data]); // eslint-disable-line

  const handleSaveCanvas = useCallback(() => {
    const states = {};
    fabricInstances.current.forEach((canvas, i) => {
      if (canvas) {
        try {
          // Strip phId image srcs — they're stored once in vsme_esg_images and
          // restored via _restoreImgSrc on load, so embedding them here wastes storage.
          states[i] = _stripImgSrc(canvas.toJSON(["data"]));
        } catch {}
      }
    });
    const draft = {
      states,
      settings: {
        themeId,
        reportStyleId,
        fontPairId,
        customColor,
        customPageCount,
        deletedPages: [...deletedPageIndicesRef.current],
      },
      dataSnapshot: (() => {
        const { images: _i, ...f } = data;
        return f;
      })(),
    };
    try {
      localStorage.setItem(CANVAS_STORAGE_KEY, JSON.stringify(draft));
      setCanvasSaveTime(new Date());
    } catch {
      alert("Gem mislykkedes — lagerpladsen er fuld.");
    }
  }, [themeId, reportStyleId, fontPairId, customColor, customPageCount, data]);
  handleSaveCanvasRef.current = handleSaveCanvas;

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const allIdx = [...Array(pages.length + customPageCount).keys()];
      const visIdx = allIdx.filter(
        (i) => !deletedPageIndicesRef.current.has(i),
      );
      const pageSpecs = visIdx.map((i) =>
        i < pages.length
          ? pages[i]
          : { title: "Custom", badge: "", blocks: [] },
      );
      await exportAllPagesToPDF(
        pageSpecs,
        visIdx.map((i) => fabricInstances.current[i]?.toJSON(["data"])),
        configRef.current,
        data.companyName,
        data.reportingYear,
      );
    } finally {
      setIsExporting(false);
    }
  }, [pages, customPageCount, data]);

  useEffect(() => {
    const ARROWS = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z") {
          e.preventDefault();
          e.stopPropagation();
          handleUndo();
        }
        if (e.key === "y") {
          e.preventDefault();
          e.stopPropagation();
          handleRedo();
        }
        if (e.key === "d") {
          e.preventDefault();
          e.stopPropagation();
          handleDuplicate();
        }
      }
      if (ARROWS[e.key]) {
        const canvas = fabricInstances.current[activeIdxRef.current];
        const active = canvas?.getActiveObject();
        // Let Fabric handle arrow keys when a text object is in edit mode (cursor movement)
        if (!active || active.isEditing) return;
        e.preventDefault();
        e.stopPropagation(); // prevent Fabric's own keydown handler from also firing
        const step = e.shiftKey ? 10 : 1;
        const [dx, dy] = ARROWS[e.key].map((v) => v * step);
        active.set({
          left: (active.left || 0) + dx,
          top: (active.top || 0) + dy,
        });
        active.setCoords();
        // Also update Fabric's in-progress transform so a subsequent mouse interaction
        // doesn't snap the object back to its pre-nudge position
        if (canvas._currentTransform) {
          canvas._currentTransform.original.left = active.left;
          canvas._currentTransform.original.top = active.top;
        }
        // Keep user-added elements (cross-page transfers, shapes, text) above auto-generated content
        if (active.data?.userAdded) canvas.bringToFront(active);
        canvas.renderAll();
        clearTimeout(nudgeTimerRef.current);
        nudgeTimerRef.current = setTimeout(
          () => pushHistoryRef.current(activeIdxRef.current, canvas),
          400,
        );
      }
    };
    // Capture phase: fires before any element-level listener (including Fabric's canvas handlers)
    window.addEventListener("keydown", onKey, { capture: true });
    return () =>
      window.removeEventListener("keydown", onKey, { capture: true });
  }, [handleUndo, handleRedo, handleDuplicate]);

  return (
    <div className="canvas-editor">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        hidden
      />

      <header className="ce-toolbar">
        <div className="ce-toolbar-left">
          <button
            className="ce-btn-back"
            onClick={() => {
              handleSaveCanvas();
              onClose();
            }}
          >
            ← Back
          </button>
          <span className="ce-divider" />
          <span className="ce-title">{data.companyName || "Report"}</span>
        </div>

        <div className="ce-toolbar-center">
          <button className="ce-tool" title="Add text" onClick={handleAddText}>
            <span className="ce-tool-icon">T</span>
            <span className="ce-tool-label">Text</span>
          </button>
          <button
            className="ce-tool"
            title="Add image"
            onClick={handleAddImage}
          >
            <span className="ce-tool-icon">🖼</span>
            <span className="ce-tool-label">Image</span>
          </button>
          <span className="ce-divider" />
          <button
            className="ce-tool"
            title="Circle"
            onClick={() => handleAddShape("circle")}
          >
            <span className="ce-tool-icon">○</span>
            <span className="ce-tool-label">Circle</span>
          </button>
          <button
            className="ce-tool"
            title="Rectangle"
            onClick={() => handleAddShape("rect")}
          >
            <span className="ce-tool-icon">▭</span>
            <span className="ce-tool-label">Rect</span>
          </button>
          <button
            className="ce-tool"
            title="Rounded rectangle"
            onClick={() => handleAddShape("rounded")}
          >
            <span className="ce-tool-icon">▢</span>
            <span className="ce-tool-label">Rounded</span>
          </button>
          <button
            className="ce-tool"
            title="Line"
            onClick={() => handleAddShape("line")}
          >
            <span className="ce-tool-icon">─</span>
            <span className="ce-tool-label">Line</span>
          </button>
          <button
            className="ce-tool"
            title="Triangle"
            onClick={() => handleAddShape("triangle")}
          >
            <span className="ce-tool-icon">△</span>
            <span className="ce-tool-label">Triangle</span>
          </button>
          <span className="ce-divider" />
          <button
            className="ce-tool"
            title="Duplicate (Ctrl+D)"
            onClick={handleDuplicate}
            disabled={!hasSelection}
          >
            <span className="ce-tool-icon">⧉</span>
            <span className="ce-tool-label">Duplicate</span>
          </button>
          <button
            className="ce-tool ce-tool--danger"
            title="Delete"
            onClick={handleDelete}
            disabled={!hasSelection}
          >
            <span className="ce-tool-icon">✕</span>
            <span className="ce-tool-label">Delete</span>
          </button>
          <span className="ce-divider" />
          <button
            className="ce-tool"
            title="Undo (Ctrl+Z)"
            onClick={handleUndo}
            disabled={!canUndo}
          >
            <span className="ce-tool-icon">↩</span>
            <span className="ce-tool-label">Undo</span>
          </button>
          <button
            className="ce-tool"
            title="Redo (Ctrl+Y)"
            onClick={handleRedo}
            disabled={!canRedo}
          >
            <span className="ce-tool-icon">↪</span>
            <span className="ce-tool-label">Redo</span>
          </button>
          <span className="ce-divider" />
          <button
            className="ce-tool"
            title="Bring to front"
            onClick={handleBringToFront}
            disabled={!hasSelection}
          >
            <span className="ce-tool-icon">⤒</span>
            <span className="ce-tool-label">Front</span>
          </button>
          <button
            className="ce-tool"
            title="Bring forward one step"
            onClick={handleBringForward}
            disabled={!hasSelection}
          >
            <span className="ce-tool-icon">↑</span>
            <span className="ce-tool-label">Fwd</span>
          </button>
          <button
            className="ce-tool"
            title="Send backward one step"
            onClick={handleSendBackward}
            disabled={!hasSelection}
          >
            <span className="ce-tool-icon">↓</span>
            <span className="ce-tool-label">Bwd</span>
          </button>
          <button
            className="ce-tool"
            title="Send to back"
            onClick={handleSendToBack}
            disabled={!hasSelection}
          >
            <span className="ce-tool-icon">⤓</span>
            <span className="ce-tool-label">Back</span>
          </button>
          {hasSelection && (
            <>
              <span className="ce-divider" />
              <label className="ce-tool ce-color-tool" title="Element colour">
                <span className="ce-tool-icon">
                  <span
                    className="ce-color-swatch"
                    style={{ background: selectionColor }}
                  />
                </span>
                <span className="ce-tool-label">Colour</span>
                <input
                  type="color"
                  value={selectionColor}
                  onInput={(e) => applySelectionColor(e.target.value, false)}
                  onChange={(e) => applySelectionColor(e.target.value, true)}
                  className="ce-color-input-overlay"
                />
              </label>
            </>
          )}
        </div>

        <div className="ce-toolbar-right">
          <div className="ce-themes">
            {THEMES.map((t) => (
              <button
                key={t.id}
                className={`ce-theme-dot${themeId === t.id ? " active" : ""}`}
                style={{ "--c": t.primary }}
                title={t.label}
                onClick={() => setThemeId(t.id)}
              />
            ))}
            <label
              className={`ce-theme-dot ce-theme-dot--custom${themeId === "custom" ? " active" : ""}`}
              style={{ "--c": customColor }}
              title="Custom colour"
            >
              <input
                type="color"
                value={customColor}
                onInput={(e) => handleCustomColor(e.target.value)}
                onChange={(e) => handleCustomColor(e.target.value)}
                className="ce-color-input-overlay"
              />
            </label>
          </div>
          {customizedPages.has(activeIdx) && (
            <button
              className="ce-btn-reset-page"
              onClick={handleResetCurrentPage}
              title="Rebuild this page from your form data, discarding manual layout edits"
            >
              ↺ Reset page
            </button>
          )}
          <button
            className="ce-btn-save"
            onClick={handleSaveCanvas}
            title="Save canvas draft now (also auto-saves 2s after changes)"
          >
            {canvasSaveTime
              ? `Saved ${canvasSaveTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : "Save draft"}
          </button>
          <button
            className="ce-btn-export"
            style={{ background: theme.primary }}
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? "⏳ Generating…" : "📄 Export PDF"}
          </button>
        </div>
      </header>

      {/* Properties bar */}
      {hasSelection &&
        (selType === "text" ||
          selType === "image" ||
          selType === "rect" ||
          selType === "circle") && (
          <div className="ce-props">
            {selType === "text" && (
              <>
                <span className="ce-props-label">Font</span>
                <select
                  value={selFont}
                  onChange={(e) => applyFontFamily(e.target.value)}
                  className="ce-select"
                >
                  {FONTS.map((f) => (
                    <option key={f} value={f} style={{ fontFamily: f }}>
                      {f}
                    </option>
                  ))}
                </select>
                <span className="ce-props-label">Size</span>
                <select
                  value={selFontSize}
                  onChange={(e) => applyFontSize(Number(e.target.value))}
                  className="ce-select ce-select--narrow"
                >
                  {FONT_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </>
            )}
            {selType === "rect" && (
              <>
                <span className="ce-props-label">Corner radius</span>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={selRx}
                  onInput={(e) => {
                    setSelRx(Number(e.target.value));
                    applyCornerRadius(Number(e.target.value));
                  }}
                  onChange={(e) => applyCornerRadius(Number(e.target.value))}
                  className="ce-range"
                />
                <span className="ce-props-val">{selRx}px</span>
                <span className="ce-divider-v" />
              </>
            )}
            {(selType === "rect" || selType === "circle") && (
              <>
                <span className="ce-props-label">Opacity</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selOpacity}
                  onInput={(e) => applyOpacity(Number(e.target.value))}
                  onChange={(e) => applyOpacity(Number(e.target.value), true)}
                  className="ce-range"
                />
                <span className="ce-props-val">{selOpacity}%</span>
              </>
            )}
            {selType === "image" && (
              <>
                <span className="ce-props-label">Remove BG tolerance</span>
                <input
                  type="range"
                  min="5"
                  max="75"
                  value={bgTolerance}
                  onChange={(e) => setBgTolerance(Number(e.target.value))}
                  className="ce-range"
                />
                <span className="ce-props-val">{bgTolerance}%</span>
                <button className="ce-props-btn" onClick={handleRemoveBg}>
                  Remove BG
                </button>
                <span className="ce-divider-v" />
                <span className="ce-props-label">Opacity</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selOpacity}
                  onInput={(e) => applyOpacity(Number(e.target.value))}
                  onChange={(e) => applyOpacity(Number(e.target.value), true)}
                  className="ce-range"
                />
                <span className="ce-props-val">{selOpacity}%</span>
              </>
            )}
          </div>
        )}

      <div className="ce-body">
        <aside className="ce-pages">
          <p className="ce-pages-label">Pages</p>
          <div className="ce-page-list">
            {pages.map((p, i) =>
              deletedPageIndices.has(i) ? null : (
                <button
                  key={i}
                  className={`ce-page-btn${i === activeIdx ? " active" : ""}`}
                  style={{ "--pc": theme.primary }}
                  onClick={() => handlePageJump(i)}
                >
                  <span className="ce-page-num">{i + 1}</span>
                  <span className="ce-page-title">{p.title}</span>
                  {customizedPages.has(i) && (
                    <span
                      className="ce-page-custom-dot"
                      title="Layout customized — data changes won't affect this page"
                    />
                  )}
                </button>
              ),
            )}
            {Array.from({ length: customPageCount }, (_, ci) => {
              const i = pages.length + ci;
              return deletedPageIndices.has(i) ? null : (
                <button
                  key={`cp-${i}`}
                  className={`ce-page-btn${i === activeIdx ? " active" : ""}`}
                  style={{ "--pc": theme.primary }}
                  onClick={() => handlePageJump(i)}
                >
                  <span className="ce-page-num">{i + 1}</span>
                  <span className="ce-page-title">Custom</span>
                </button>
              );
            })}
            <button className="ce-page-add-btn" onClick={handleAddBlankPage}>
              + Add blank page
            </button>
            {deletedPageIndices.size > 0 && (
              <>
                <div className="ce-pages-deleted-label">Deleted</div>
                {[...deletedPageIndices]
                  .sort((a, b) => a - b)
                  .map((i) => (
                    <div key={`del-${i}`} className="ce-page-deleted-item">
                      <span className="ce-page-num">{i + 1}</span>
                      <span className="ce-page-title">
                        {i < pages.length ? pages[i].title : "Custom"}
                      </span>
                      <button
                        className="ce-page-restore-btn"
                        onClick={() => handleRestorePage(i)}
                      >
                        Restore
                      </button>
                    </div>
                  ))}
              </>
            )}
          </div>
        </aside>

        <main className="ce-canvas-area">
          {pages.map((page, i) => (
            <div
              key={i}
              ref={(el) => {
                pageContainerRefs.current[i] = el;
              }}
              className={`ce-page-block${dragTargetPage === i ? " ce-page-block--drag-target" : ""}`}
              style={
                deletedPageIndices.has(i) ? { display: "none" } : undefined
              }
            >
              <div className="ce-page-block-label">
                <span>
                  Page {i + 1} — {page.title}
                </span>
                {customizedPages.has(i) && (
                  <span
                    className="ce-page-custom-label"
                    title="This page has manual layout edits. Use 'Reset page' in the toolbar to rebuild from data."
                  >
                    ✦ customized
                  </span>
                )}
                <button
                  className="ce-page-delete-btn"
                  title="Delete this page"
                  onClick={() => handleDeletePage(i)}
                  disabled={
                    pages.length + customPageCount - deletedPageIndices.size <=
                    1
                  }
                >
                  ✕ Delete page
                </button>
              </div>
              <div
                className={`ce-canvas-wrap${i === activeIdx ? " active" : ""}`}
              >
                <canvas
                  ref={(el) => {
                    canvasElRefs.current[i] = el;
                  }}
                />
              </div>
            </div>
          ))}
          {Array.from({ length: customPageCount }, (_, ci) => {
            const i = pages.length + ci;
            return (
              <div
                key={`cp-${i}`}
                ref={(el) => {
                  pageContainerRefs.current[i] = el;
                }}
                className={`ce-page-block${dragTargetPage === i ? " ce-page-block--drag-target" : ""}`}
                style={
                  deletedPageIndices.has(i) ? { display: "none" } : undefined
                }
              >
                <div className="ce-page-block-label">
                  <span>Page {i + 1} — Custom</span>
                  <button
                    className="ce-page-delete-btn"
                    title="Delete this page"
                    onClick={() => handleDeletePage(i)}
                    disabled={
                      pages.length +
                        customPageCount -
                        deletedPageIndices.size <=
                      1
                    }
                  >
                    ✕ Delete page
                  </button>
                </div>
                <div
                  className={`ce-canvas-wrap${i === activeIdx ? " active" : ""}`}
                >
                  <canvas
                    ref={(el) => {
                      canvasElRefs.current[i] = el;
                    }}
                  />
                </div>
              </div>
            );
          })}
          <p className="ce-canvas-hint">
            Click to select · Drag to move · Drag past page edge to move to
            another page · Double-click text to edit · Ctrl+D to duplicate
          </p>
        </main>
      </div>
    </div>
  );
}
