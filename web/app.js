let lang = "en";
let view = "home";
const VIEWS = ["home", "result", "map", "trends", "relate", "health", "plans", "method", "ready", "lines", "districts", "events", "learn", "field", "voices", "about"];
const MAIN_VIEWS = ["home", "result", "map", "trends", "districts"];
const MORE_VIEWS = ["events", "relate", "health", "plans", "lines", "field", "ready", "method", "learn", "voices", "about"];
let mapInstance = null;
let offlineLayer = null;
let gibsLayer = null;
let markerLayer = null;
let locatorMap = null;
let locatorOutline = null;
let locatorGibs = null;
let locatorMarkers = null;
let scaleControl = null;
let charts = [];
let resultChart = null;
let relateChart = null;
let relateCache = { key: "", payload: null };
let relateX = "T2M";
let relateY = "PRECTOTCORR";
let relatePoint = "a";
let relateMethod = "pearson";
let districtMap = null;
let districtLayer = null;
let districtGeo = null;
let districtId = "Dhaka";
let horizon = "short";
let diffFocus = "a";
let latest = null;
let reportLang = "en";
let reportLangPinned = false;
let reportFormat = "pdf";
let reportMoreFormatsOpen = false;
const reportSections = {
  summary: true, findings: true, chart: true, map: true, stats: true,
  compare: true, story: true, source: true, method: true, limits: true,
};
let pairs = [];
let boardCache = { key: "", rows: null };
let boardToken = 0;
const MEASURES = ["T2M", "T2M_MIN", "T2M_MAX", "PRECTOTCORR"];

const $ = (id) => document.getElementById(id);

function t(key) {
  const pack = I18N[lang] || I18N.en;
  return pack[key] === undefined ? I18N.en[key] : pack[key];
}

function fill(template, values) {
  return template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? "");
}

function formatP(value) {
  if (value < 0.001) return "< 0.001";
  return value.toFixed(3);
}

function formatPSentence(value) {
  if (value < 0.001) return "< 0.001";
  return "= " + value.toFixed(3);
}

function formatNum(value) {
  const abs = Math.abs(value);
  const digits = abs >= 10 ? 2 : 3;
  const text = abs.toFixed(digits);
  return value < 0 ? "-" + text : "+" + text;
}

function fold(summaryText) {
  const details = document.createElement("details");
  details.className = "fold";
  const summary = document.createElement("summary");
  summary.textContent = summaryText;
  details.appendChild(summary);
  return details;
}

function formatAbs(value) {
  const abs = Math.abs(value);
  const digits = abs >= 10 ? 2 : 3;
  return abs.toFixed(digits);
}

function setLang(next) {
  lang = I18N[next] ? next : "en";
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  $("lang").value = lang;
  paintChrome();
  if (!reportLangPinned && ["en", "bn", "hi", "ar", "id", "yo"].includes(lang)) reportLang = lang;
  if (latest) render(latest);
}

function paintReportPreview() {
  const root = $("report-preview");
  const where = $("report-where");
  if (!root) return;
  root.replaceChildren();
  const ui = REPORT_UI[lang] || REPORT_UI.en;
  if (!latest) {
    if (where) where.textContent = "";
    const note = document.createElement("p");
    note.textContent = ui.need;
    root.appendChild(note);
    return;
  }
  if (where) where.textContent = latest.a.name + " · " + latest.b.name + " · " + latest.a.country + " | " + latest.start_year + "–" + latest.end_year;
  const name = (REPORT_LANGS.find((row) => row[0] === reportLang) || ["", reportLang])[1];
  [name + " · " + reportFormat.toUpperCase(), reportPair(latest), reportCity(latest.a, latest), reportCity(latest.b, latest)].forEach((text) => {
    const line = document.createElement("p");
    line.textContent = text;
    root.appendChild(line);
  });
}

function paintReportDialog() {
  if (!$("report-go") || typeof REPORT_UI === "undefined") return;
  const ui = REPORT_UI[lang] || REPORT_UI.en;
  $("file-label").textContent = t("downloadReport");
  $("report-lang-label").textContent = ui.langLabel;
  $("report-format-label").textContent = ui.formatLabel;
  $("report-sections-label").textContent = ui.sectionsLabel;
  $("report-preview-label").textContent = ui.preview;
  $("report-go").textContent = ui.download;
  $("report-close").textContent = ui.close;
  const langs = $("report-langs");
  langs.replaceChildren();
  REPORT_LANGS.forEach(([code, name]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ghost";
    button.textContent = name;
    button.setAttribute("aria-pressed", code === reportLang ? "true" : "false");
    button.addEventListener("click", () => {
      reportLang = code;
      reportLangPinned = true;
      paintReportDialog();
    });
    langs.appendChild(button);
  });
  const formats = $("report-formats");
  formats.replaceChildren();

  const isGeneral = currentRole() === "general";
  const primaryCodes = ["pdf", "png"];
  const secondaryCodes = Object.keys(ui.formats).filter((c) => !primaryCodes.includes(c));

  function createFormatButton(code) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ghost";
    if (code === "pdf" || code === "png") {
      button.classList.add("format-primary");
    }
    button.setAttribute("aria-pressed", code === reportFormat ? "true" : "false");
    const strong = document.createElement("strong");
    if (code === "pdf") {
      strong.textContent = ui.downloadPdf || t("downloadPdf") || "Download as PDF";
    } else if (code === "png") {
      strong.textContent = ui.downloadPng || t("downloadPng") || "Download as PNG";
    } else {
      strong.textContent = code === "md" ? "Markdown" : code.toUpperCase();
    }
    button.appendChild(strong);
    if (ui.formats && ui.formats[code]) {
      button.appendChild(document.createTextNode(" — " + ui.formats[code]));
    }
    button.addEventListener("click", () => {
      reportFormat = code;
      paintReportDialog();
    });
    return button;
  }

  if (isGeneral) {
    primaryCodes.forEach((code) => {
      if (ui.formats && ui.formats[code]) {
        formats.appendChild(createFormatButton(code));
      }
    });

    const moreFold = document.createElement("details");
    moreFold.className = "fold more-formats-fold";
    const moreSummary = document.createElement("summary");
    moreSummary.className = "more-formats-summary";
    moreSummary.textContent = ui.moreFormats || t("moreFormats") || "More Formats";
    moreFold.appendChild(moreSummary);

    const moreList = document.createElement("div");
    moreList.className = "choice-list more-formats-list";
    secondaryCodes.forEach((code) => {
      moreList.appendChild(createFormatButton(code));
    });
    moreFold.appendChild(moreList);

    if (secondaryCodes.includes(reportFormat) || reportMoreFormatsOpen) {
      moreFold.open = true;
    }
    moreFold.addEventListener("toggle", () => {
      reportMoreFormatsOpen = moreFold.open;
    });

    formats.appendChild(moreFold);
  } else {
    const orderedCodes = [...primaryCodes, ...secondaryCodes];
    orderedCodes.forEach((code) => {
      if (ui.formats && ui.formats[code]) {
        formats.appendChild(createFormatButton(code));
      }
    });
  }
  const sections = $("report-sections");
  sections.replaceChildren();
  Object.keys(ui.sections).forEach((id) => {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = reportSections[id] !== false;
    input.addEventListener("change", () => {
      reportSections[id] = input.checked;
      paintReportPreview();
    });
    const span = document.createElement("span");
    span.textContent = ui.sections[id];
    label.append(input, span);
    sections.appendChild(label);
  });
  paintReportPreview();
}

function paintWithFlag(el, label) {
  if (!el) return;
  el.replaceChildren();
  const flag = document.createElement("span");
  flag.className = "bd-flag";
  flag.setAttribute("aria-hidden", "true");
  el.append(flag, document.createTextNode(label));
}

function paintChrome() {
  $("eyebrow").textContent = t("eyebrow");
  $("title").textContent = t("title");
  document.title = t("title");
  $("lede").textContent = t("lede");
  if ($("filter-summary")) $("filter-summary").textContent = t("filterSummary");
  $("lang-label").textContent = t("lang");
  $("lang-hint").textContent = t("langHint");
  $("perspective").textContent = t("perspective");
  $("view-result").textContent = t("navResult");
  $("view-map").textContent = t("navMap");
  $("view-trends").textContent = t("navTrends");
  $("view-relate").textContent = t("navRelate");
  $("view-health").textContent = t("navHealth");
  $("view-plans").textContent = t("navPlans");
  $("view-method").textContent = t("navMethod");
  $("view-ready").textContent = t("navReady");
  $("nav-project").textContent = t("navProject");
  $("view-home").textContent = t("navHome");
  $("view-about").textContent = t("navAbout");
  $("home-kicker").textContent = t("eyebrow");
  $("home-title").textContent = t("homeWelcome");
  $("home-formal").textContent = t("homeFormal");
  $("home-lead").textContent = t("homeLead");
  $("home-note").textContent = homeLiveDay ? fill(t("homeNote"), { day: homeLiveDay }) : t("homeNoteWait");
  $("home-alert-title").textContent = t("homeAlertTitle");
  $("home-alert-note").textContent = t("homeAlertFoot");
  $("home-go-trends").textContent = t("homeTrends");
  $("home-go-check").textContent = t("homeStart");
  $("home-go-map").textContent = t("homeMap");
  $("home-go-events").textContent = t("homeEvents");
  paintWithFlag($("home-go-districts"), t("homeDistricts"));
  $("home-alert-refresh").textContent = "↻";
  $("home-alert-refresh").setAttribute("aria-label", t("eventsRefresh"));
  $("home-alert-refresh").title = t("eventsRefresh");
  paintWithFlag($("view-districts"), t("navDistricts"));
  $("view-lines").textContent = t("navLines");
  $("view-learn").textContent = t("navLearn");
  $("view-events").textContent = t("navEvents");
  $("view-field").textContent = t("navField");
  $("view-voices").textContent = t("navVoices");
  if ($("nav-look")) $("nav-look").textContent = t("navLook");
  if ($("nav-use")) $("nav-use").textContent = t("navUse");
  if ($("nav-more")) $("nav-more").textContent = t("navMore");
  if ($("nav-more-toggle")) $("nav-more-toggle").title = t("navMore");
  $("go-trends").textContent = t("seeCharts");
  $("go-health").textContent = t("seeHealth");
  $("go-plans").textContent = t("seePlans");
  $("go-events").textContent = t("seeEvents");
  $("lbl-country").textContent = t("country");
  $("lbl-var").textContent = t("variable");
  $("lbl-season").textContent = t("season");
  $("lbl-from").textContent = t("from");
  $("lbl-to").textContent = t("to");
  $("apply").textContent = t("apply");
  $("refresh").textContent = t("refresh");
  $("lbl-role").textContent = t("role");
  fillSelect($("role"), t("roles"), $("role").value || "general");
  $("download-toggle").textContent = t("downloadReport");
  paintReportDialog();
  $("copy-answer").textContent = t("copyAnswer");
  $("keys-hint").textContent = t("keysHint");
  $("full-record").textContent = t("fullRecord");
  $("learn-title").textContent = t("learnTitle");
  $("learn-note").textContent = t("learnNote");
  $("field-title").textContent = t("fieldTitle");
  $("field-note").textContent = t("fieldNote");
  $("lbl-place").textContent = t("place");
  $("lbl-lat").textContent = t("latitude");
  $("lbl-lon").textContent = t("longitude");
  $("lbl-field-who").textContent = t("fieldWho");
  $("field-go").textContent = t("fieldGo");
  $("voices-title").textContent = t("voicesTitle");
  $("voices-note").textContent = t("voicesNote");
  $("lbl-voice-name").textContent = t("voiceName");
  $("lbl-voice-country").textContent = t("voiceCountry");
  $("lbl-voice-country-other").textContent = t("voiceCountryOther");
  fillVoiceCountries($("voice-country"));
  syncCountryOther();
  $("lbl-voice-role").textContent = t("voiceRole");
  $("lbl-voice-text").textContent = t("voiceText");
  $("voice-send").textContent = t("voiceSend");
  renderReady();
  renderAbout();
  renderLines();
  $("events-title").textContent = t("eventsTitle");
  $("events-note").textContent = t("eventsNote");
  $("events-rain").textContent = t("eventsRainNote");
  $("events-refresh").textContent = t("eventsRefresh");
  $("events-role").textContent = eventsRole();
  fillSelect($("field-who"), t("fieldPeople"), $("field-who").value || "farmer");
  fillSelect($("voice-role"), t("voiceRoles"), $("voice-role").value || "general");
  fillPlaces();
  if (fieldLatest) renderField(fieldLatest);
  renderLearn();
  if (hazardCache) renderHazards();
  ["result", "map", "trends", "health", "plans", "method"].forEach((id, index) => {
    const button = $("view-" + id);
    button.title = (index + 1) + " · " + button.textContent;
  });
  document.querySelectorAll(".nav button").forEach((button) => {
    if (!button.title) button.title = button.textContent;
  });
  paintPairs();
  fillSelect($("variable"), t("vars"), $("variable").value || "T2M");
  fillSelect($("season"), t("seasons"), $("season").value || "ALL");
  if (!latest) $("net-badge").textContent = t("offlineBadge");
  paintWindowNote();
  if (boardCache.rows) renderBoard(boardCache.rows);
  if (!$("scope-hint").hidden) $("scope-hint").textContent = t("scopeHint");
  $("find-open").textContent = t("find");
  $("find-open").title = "Ctrl+K";
  $("nav-open").textContent = t("navOpen");
  $("palette-kicker").textContent = t("findHint");
  $("palette-input").placeholder = t("findHint");
  $("lang").title = t("langHint");
  const menuClosed = document.body.classList.contains("nav-collapsed");
  $("nav-collapse").textContent = menuClosed ? t("navExpand") : t("navCollapse");
  $("nav-collapse").setAttribute("aria-pressed", menuClosed ? "true" : "false");
  paintMapLayers();
  renderChips();
  paintCrumb();
  if ($("tour") && !$("tour").hidden) paintTour();
  paintHomeEarth();
  paintHomeChrome();
  paintNasaLine();
  paintDistrictChrome();
}

function fillSelect(select, options, current) {
  const value = current || select.value;
  select.innerHTML = "";
  Object.entries(options).forEach(([id, label]) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = label;
    select.appendChild(option);
  });
  if (value) select.value = value;
}

function fillYears() {
  ["from-year", "to-year"].forEach((id) => {
    const select = $(id);
    const current = select.value;
    select.innerHTML = "";
    for (let year = 2004; year <= 2024; year += 1) {
      const option = document.createElement("option");
      option.value = String(year);
      option.textContent = String(year);
      select.appendChild(option);
    }
    select.value = current || (id === "from-year" ? "2004" : "2024");
  });
}

function currentPair() {
  return pairs.find((pair) => pair.id === $("pair").value) || pairs[0];
}

function query(refresh) {
  const pair = currentPair();
  const params = new URLSearchParams({
    city_a: pair.a.id,
    city_b: pair.b.id,
    variable: $("variable").value,
    season: $("season").value,
    start_year: $("from-year").value,
    end_year: $("to-year").value,
  });
  if (refresh) params.set("refresh", "true");
  return params;
}

function orderedYears() {
  const start = Number($("from-year").value);
  const end = Number($("to-year").value);
  if (start > end) {
    $("from-year").value = String(end);
    $("to-year").value = String(start);
  }
}

function setView(next) {
  view = VIEWS.includes(next) ? next : "result";
  document.body.dataset.view = view;
  VIEWS.forEach((id) => {
    const panel = $("view-panel-" + id);
    if (panel) panel.hidden = view !== id;
    $("view-" + id).setAttribute("aria-pressed", view === id ? "true" : "false");
  });
  const isMoreView = MORE_VIEWS.includes(view);
  const moreToggle = $("nav-more-toggle");
  const moreItems = $("nav-more-items");
  if (moreToggle) {
    moreToggle.setAttribute("data-active-child", isMoreView ? "true" : "false");
    if (isMoreView && moreItems && moreItems.hidden) {
      moreItems.hidden = false;
      moreToggle.setAttribute("aria-expanded", "true");
    }
  }
  const main = document.querySelector("main");
  if (main) main.scrollTop = 0;
  if (view === "map" && mapInstance) setTimeout(() => mapInstance.invalidateSize(), 60);
  if (view === "districts") setTimeout(mountDistrictMap, 60);
  placeLocator();
  if (view === "trends") setTimeout(() => charts.forEach((chart) => chart.resize()), 40);
  if (view === "relate") {
    loadRelate(false);
    if (relateChart) setTimeout(() => relateChart.resize(), 40);
  }
  if (view === "result") {
    setTimeout(() => {
      if (resultChart) resultChart.resize();
      if (locatorMap) locatorMap.invalidateSize();
    }, 80);
  }
  const fold = $("filter-fold");
  if (fold && !["home", "learn", "field", "voices", "events", "ready", "about", "lines", "districts"].includes(view)) {
    fold.open = view !== "result";
  }
  if (view === "voices") loadVoices();
  if (view === "events" || view === "home") loadHazards(false);
  document.body.classList.remove("nav-open");
  if ($("nav-backdrop")) $("nav-backdrop").hidden = true;
  paintCrumb();
  writeShare();
  const aside = ["learn", "field", "voices", "events", "ready", "about", "lines", "districts"].includes(view);
  $("scope-hint").hidden = !aside;
  if (aside) $("scope-hint").textContent = t("scopeHint");
}

async function load(refresh) {
  orderedYears();
  const status = $("status");
  const pair = currentPair();
  if (!pair || pair.a.id === pair.b.id) {
    status.textContent = t("sameCity");
    status.className = "status error";
    return;
  }
  if (boardCache.key && boardCache.key !== boardKey()) {
    boardCache = { key: "", rows: null };
    renderBoard(null);
  }
  status.className = "status";
  status.textContent = refresh ? t("nasaWait") : t("loading");
  $("apply").disabled = true;
  $("refresh").disabled = true;
  try {
    const response = await fetch("/api/compare?" + query(refresh).toString());
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.detail || t("errorTitle"));
    latest = payload;
    render(payload);
    status.textContent = "";
    loadBoard();
    loadRelate(refresh);
  } catch (error) {
    status.textContent = t("errorTitle") + " " + t("errorBody");
    status.className = "status error";
  } finally {
    $("apply").disabled = false;
    $("refresh").disabled = false;
  }
}

function citySentence(point, data) {
  const slope = point.slope;
  return fill(t("cityLine"), {
    city: point.name,
    dir: t("dir")[point.trend.direction],
    mag: formatAbs(slope.per_decade),
    unit: data.unit,
    sig: point.trend.significant ? t("sigYes") : t("sigNo"),
    p: formatPSentence(point.trend.p_value),
    lo: formatNum(slope.ci_low_per_decade),
    hi: formatNum(slope.ci_high_per_decade),
  });
}

function pairSentence(data) {
  const a = data.a.trend;
  const b = data.b.trend;
  if (a.significant && b.significant && a.direction !== b.direction && a.direction !== "no trend" && b.direction !== "no trend") {
    return t("pairOpposite");
  }
  if (a.significant && !b.significant) {
    return fill(t("pairOne"), { sigCity: data.a.name, otherCity: data.b.name });
  }
  if (b.significant && !a.significant) {
    return fill(t("pairOne"), { sigCity: data.b.name, otherCity: data.a.name });
  }
  if (a.significant && b.significant) return t("pairBoth");
  return t("pairNeither");
}

function plainPairLead(data) {
  if (!data || !data.a || !data.b) return "";
  const varName = (t("vars") && t("vars")[data.variable]) || data.variable;
  const a = data.a.trend;
  const b = data.b.trend;
  const aSig = Boolean(a && a.significant);
  const bSig = Boolean(b && b.significant);
  const aSlope = (data.a.slope && data.a.slope.per_decade) || 0;
  const bSlope = (data.b.slope && data.b.slope.per_decade) || 0;

  if (aSig && bSig) {
    const aUp = aSlope > 0;
    const bUp = bSlope > 0;
    if (aUp && bUp) {
      return fill(t("trendPairBothRising"), { cityA: data.a.name, cityB: data.b.name, var: varName, variable: varName });
    }
    if (!aUp && !bUp) {
      return fill(t("trendPairBothFalling"), { cityA: data.a.name, cityB: data.b.name, var: varName, variable: varName });
    }
    return fill(t("trendPairOpposite"), { cityA: data.a.name, cityB: data.b.name, var: varName, variable: varName });
  }
  if (aSig && !bSig) {
    return fill(t("trendPairOneOnly"), { sigCity: data.a.name, otherCity: data.b.name, citySig: data.a.name, cityOther: data.b.name, var: varName, variable: varName });
  }
  if (!aSig && bSig) {
    return fill(t("trendPairOneOnly"), { sigCity: data.b.name, otherCity: data.a.name, citySig: data.b.name, cityOther: data.a.name, var: varName, variable: varName });
  }
  return fill(t("trendPairNeither"), { cityA: data.a.name, cityB: data.b.name, var: varName, variable: varName });
}

function plainCitySummary(point, data) {
  if (!point || !point.trend) return "";
  const varName = (t("vars") && t("vars")[data.variable]) || data.variable;
  const cityName = point.name;
  const slope = point.slope ? point.slope.per_decade : 0;
  const yearsUsed = point.gaps ? point.gaps.years_used : 0;

  if (!Number.isFinite(slope) || yearsUsed < 5) {
    return fill(t("trendInconclusive"), { city: cityName, var: varName, variable: varName });
  }

  if (!point.trend.significant) {
    if (Math.abs(slope) < 0.01) {
      return fill(t("trendStable"), { city: cityName, var: varName, variable: varName });
    }
    return fill(t("trendNoTrend"), { city: cityName, var: varName, variable: varName });
  }

  if (slope > 0) {
    const key = Math.abs(slope) >= 0.25 ? "trendRisingSteady" : "trendRisingSlight";
    return fill(t(key), { city: cityName, var: varName, variable: varName });
  } else if (slope < 0) {
    const key = Math.abs(slope) >= 0.25 ? "trendFallingSteady" : "trendFallingSlight";
    return fill(t(key), { city: cityName, var: varName, variable: varName });
  } else {
    return fill(t("trendStable"), { city: cityName, var: varName, variable: varName });
  }
}

function render(data) {
  const answer = $("answer");
  answer.innerHTML = "";
  const isGeneral = currentRole() === "general";
  const isSingleYear = Number(data.start_year) === Number(data.end_year);
  const kicker = document.createElement("p");
  kicker.className = "found-kicker";
  kicker.textContent = t("foundKicker");
  answer.appendChild(kicker);
  const headline = document.createElement("h2");
  headline.className = "headline";
  headline.textContent = isSingleYear
    ? (ht("singleYearTip") || t("singleYearTip"))
    : (isGeneral ? plainPairLead(data) : pairSentence(data));
  answer.appendChild(headline);
  const status = document.createElement("div");
  status.className = "status-row";
  [data.a, data.b].forEach((point) => {
    const tag = document.createElement("span");
    tag.className = "tag " + (!isSingleYear && point.trend.significant ? "yes" : "no");
    const badgeText = isSingleYear
      ? (ht("singleYear") || "Single-year observation")
      : (isGeneral
        ? (point.trend.significant ? t("trendBadgeConfirmed") : t("trendBadgeUnconfirmed"))
        : (point.trend.significant ? t("sigYes") : t("sigNo")));
    tag.textContent = point.name + " · " + badgeText;
    status.appendChild(tag);
  });
  answer.appendChild(status);
  const slopes = document.createElement("p");
  slopes.className = "slope-line";
  if (isSingleYear) {
    const edgeA = edgeYears(data.a);
    const edgeB = edgeYears(data.b);
    const valA = edgeA.last ? edgeA.last.value.toFixed(2) + " " + data.unit : "—";
    const valB = edgeB.last ? edgeB.last.value.toFixed(2) + " " + data.unit : "—";
    slopes.textContent = data.start_year + " · " + data.a.name + ": " + valA + " · " + data.b.name + ": " + valB;
  } else if (isGeneral) {
    slopes.textContent = plainCitySummary(data.a, data) + " " + plainCitySummary(data.b, data);
  } else {
    slopes.textContent = data.a.name + " " + formatNum(data.a.slope.per_decade)
      + " · " + data.b.name + " " + formatNum(data.b.slope.per_decade)
      + " " + data.unit + " · " + t("perDecade");
  }
  answer.appendChild(slopes);
  const season = (t("seasons") && t("seasons")[data.season]) || data.season;
  const measure = (t("vars") && t("vars")[data.variable]) || data.variable;
  const mode = data.a.provenance.mode === "live" ? t("modeLive") : t("modeSaved");
  const periodStr = isSingleYear ? String(data.start_year) : (String(data.start_year) + "–" + String(data.end_year));
  const howVal = isSingleYear
    ? (ht("noTrendSingle") || "No trend for single year")
    : (formatNum(data.a.slope.per_decade) + " · " + formatNum(data.b.slope.per_decade) + " " + data.unit + " · " + t("perDecade").toLowerCase());
  const facts = document.createElement("div");
  facts.className = "facts";
  [
    [t("evWhat"), measure, () => openFilters("variable")],
    [t("evWhere"), data.a.name + " · " + data.b.name + ", " + data.a.country, () => {
      const box = $("locator");
      if (box) box.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }],
    [t("evWhen"), periodStr + " · " + season, () => openFilters("from-year")],
    [t("evHow"), howVal, () => openFold("answer")],
    [t("evSource"), "NASA POWER · " + mode, () => openFold("how")],
  ].forEach(([label, value, action]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "fact";
    const k = document.createElement("span");
    k.className = "k";
    k.textContent = label;
    const v = document.createElement("span");
    v.className = "v";
    v.textContent = value;
    button.append(k, v);
    button.addEventListener("click", action);
    facts.appendChild(button);
  });
  answer.appendChild(facts);
  const details = fold(isGeneral ? t("technicalDetails") : t("statDetails"));
  [citySentence(data.a, data), citySentence(data.b, data)].forEach((text) => {
    const p = document.createElement("p");
    p.textContent = text;
    details.appendChild(p);
  });
  const roleNote = document.createElement("p");
  roleNote.className = "role-note";
  roleNote.textContent = roleText();
  details.appendChild(roleNote);
  answer.appendChild(details);
  renderStory(data);
  renderHow(data);
  renderResultChart(data);
  writeShare();
  renderWatch(data);
  const badge = $("net-badge");
  const modeKey = data.a.provenance.mode;
  badge.textContent = modeKey === "live" ? t("onlineBadge") : t("offlineBadge");
  badge.className = "badge " + (modeKey === "live" ? "live" : "saved");
  renderTargets(data);
  renderMetrics(data);
  renderMap(data);
  renderLocator(data);
  renderCards(data);
  renderDiff(data);
  renderSample(data);
  const watching = $("watching");
  if (watching) watching.textContent = data.a.name + " · " + data.b.name;
  const trendLead = $("trend-lead");
  if (trendLead) {
    trendLead.textContent = isSingleYear
      ? (ht("singleYearTip") || t("singleYearTip"))
      : (isGeneral ? plainPairLead(data) : pairSentence(data));
  }
  const yearRead = $("year-read");
  if (yearRead) yearRead.textContent = t("yearHint");
  renderMethod();
  renderHealth();
  renderPlans(data);
  renderHome(data);
  paintWindowNote();
  if (boardCache.rows) renderBoard(boardCache.rows);
  renderGlance();
  renderFeature();
  paintHomeChrome();
  if (relateCache.payload) renderRelate();
  paintNasaLine();
  if (view === "trends") setTimeout(() => charts.forEach((chart) => chart.resize()), 40);
  if (view === "map" && mapInstance) setTimeout(() => mapInstance.invalidateSize(), 60);
  renderChips();
}

function evidenceList(data) {
  const list = document.createElement("dl");
  list.className = "evidence";
  const season = (t("seasons") && t("seasons")[data.season]) || data.season;
  const measure = (t("vars") && t("vars")[data.variable]) || data.variable;
  const mode = data.a.provenance.mode === "live" ? t("modeLive") : t("modeSaved");
  [
    [t("evWhat"), measure + " · " + data.unit],
    [t("evWhere"), data.a.name + " · " + data.b.name + ", " + data.a.country],
    [t("evWhen"), String(data.start_year) + "–" + String(data.end_year) + " · " + season],
    [t("evHow"), formatNum(data.a.slope.per_decade) + " · " + formatNum(data.b.slope.per_decade) + " " + data.unit + " · " + t("perDecade").toLowerCase()],
    [t("evSource"), "NASA POWER · " + mode],
  ].forEach(([label, value]) => {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = value;
    list.append(dt, dd);
  });
  return list;
}

function renderStory(data) {
  const root = $("story");
  if (!root) return;
  root.hidden = false;
  root.innerHTML = "";
  const isSingleYear = Number(data.start_year) === Number(data.end_year);
  const lead = document.createElement("p");
  lead.className = "slope-line";
  lead.textContent = isSingleYear
    ? (ht("singleYearTip") || t("singleYearTip"))
    : (currentRole() === "general" ? plainPairLead(data) : pairSentence(data));
  root.appendChild(lead);
  const details = fold(t("storyTitle"));
  reportLines(data).forEach((text) => {
    if (!text) return;
    const line = document.createElement("p");
    line.textContent = text;
    details.appendChild(line);
  });
  root.appendChild(details);
}

function renderHow(data) {
  const root = $("how");
  if (!root) return;
  root.innerHTML = "";
  const details = fold(t("howTitle"));
  const method = document.createElement("p");
  method.textContent = t("methodBody");
  details.appendChild(method);
  const limit = document.createElement("p");
  limit.textContent = t("evLimit");
  details.appendChild(limit);
  const point = data.a;
  const mode = point.provenance.mode;
  const modeText = mode === "live" ? t("modeLive") : mode === "offline" ? t("modeOffline") : t("modeSaved");
  const pre = document.createElement("pre");
  pre.className = "prov";
  pre.textContent = [
    modeText,
    point.provenance.dataset,
    "Variable: " + data.variable + " · " + data.unit,
    point.gaps.coverage_rule,
    t("gaps") + ": " + point.gaps.missing_marked + " · " + data.b.name + " " + data.b.gaps.missing_marked,
    point.provenance.fetched_at || "",
    point.provenance.request_url || "",
  ].filter(Boolean).join("\n");
  details.appendChild(pre);
  const about = document.createElement("p");
  about.className = "hint";
  about.textContent = t("lede");
  details.appendChild(about);
  root.appendChild(details);
}

function openFold(id) {
  const root = $(id);
  if (!root) return;
  const details = root.querySelector("details");
  if (details) details.open = true;
  root.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function openFilters(focusId) {
  const fold = $("filter-fold");
  if (fold) fold.open = true;
  const field = focusId ? $(focusId) : null;
  if (field) field.focus();
}

function renderResultChart(data) {
  const canvas = $("result-canvas");
  const note = $("result-chart-note");
  if (note) note.textContent = t("yearHint") + " " + t("mapStill");
  if (!canvas || typeof Chart === "undefined") return;
  if (resultChart) resultChart.destroy();
  const years = data.a.years || [];
  const bByYear = new Map((data.b.years || []).map((year, index) => [year, data.b.values[index]]));
  resultChart = new Chart(canvas, {
    type: "line",
    data: {
      labels: years,
      datasets: [
        {
          label: data.a.name,
          data: data.a.values,
          borderColor: "#f3b4c8",
          backgroundColor: "#f3b4c8",
          pointRadius: 3,
          tension: 0,
        },
        {
          label: data.b.name,
          data: years.map((year) => (bByYear.has(year) ? bByYear.get(year) : null)),
          borderColor: "#8fd4f5",
          backgroundColor: "#8fd4f5",
          pointRadius: 3,
          tension: 0,
        },
      ],
    },
    options: chartOptions(),
  });
}

function writeShare() {
  if (!$("pair") || !$("pair").value) return;
  const next = "?" + new URLSearchParams({
    pair: $("pair").value,
    variable: $("variable").value || "T2M",
    season: $("season").value || "ALL",
    from: $("from-year").value || "2004",
    to: $("to-year").value || "2024",
    view,
  }).toString();
  if (location.search !== next) history.replaceState(null, "", next);
}

function readShare() {
  const params = new URLSearchParams(location.search);
  const pair = params.get("pair");
  if (pair && [...$("pair").options].some((option) => option.value === pair)) $("pair").value = pair;
  const variable = params.get("variable");
  if (variable && [...$("variable").options].some((option) => option.value === variable)) $("variable").value = variable;
  const season = params.get("season");
  if (season && [...$("season").options].some((option) => option.value === season)) $("season").value = season;
  const from = params.get("from");
  if (from && [...$("from-year").options].some((option) => option.value === from)) $("from-year").value = from;
  const to = params.get("to");
  if (to && [...$("to-year").options].some((option) => option.value === to)) $("to-year").value = to;
  const next = params.get("view");
  if (next && VIEWS.includes(next)) setView(next);
}

function readSaves() {
  try {
    const rows = JSON.parse(localStorage.getItem("mci-saves") || "[]");
    return Array.isArray(rows) ? rows : [];
  } catch (error) {
    return [];
  }
}

function paintSaves() {
  const root = $("saved-list");
  if (!root) return;
  root.innerHTML = "";
  readSaves().forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip";
    button.textContent = item.label;
    button.addEventListener("click", () => applySave(item, false));
    root.appendChild(button);
  });
}

function saveCheck() {
  const label = ($("pair").selectedOptions[0] ? $("pair").selectedOptions[0].textContent : $("pair").value)
    + " · " + ($("variable").selectedOptions[0] ? $("variable").selectedOptions[0].textContent : "")
    + " · " + $("from-year").value + "–" + $("to-year").value;
  const row = {
    pair: $("pair").value,
    variable: $("variable").value,
    season: $("season").value,
    from: $("from-year").value,
    to: $("to-year").value,
    label,
  };
  const rows = readSaves().filter((item) => item.label !== label);
  rows.unshift(row);
  try { localStorage.setItem("mci-saves", JSON.stringify(rows.slice(0, 8))); } catch (error) {}
  paintSaves();
  paintHomeRecent();
}

function renderTargets(data) {
  const root = $("targets");
  root.innerHTML = "";
  const details = fold(t("latitude") + " · " + t("longitude"));
  [data.a, data.b].forEach((point, index) => {
    const line = document.createElement("p");
    line.className = "hint";
    const strong = document.createElement("b");
    strong.textContent = point.name + ", " + point.country;
    line.appendChild(strong);
    line.appendChild(document.createTextNode(" · " + Number(point.lat).toFixed(4) + ", " + Number(point.lon).toFixed(4)));
    if (index === 0) line.style.marginTop = "8px";
    details.appendChild(line);
  });
  root.appendChild(details);
}

function renderMetrics(data) {
  const root = $("metrics");
  root.innerHTML = "";
  const isGeneral = currentRole() === "general";
  const isSingleYear = Number(data.start_year) === Number(data.end_year);
  const perDec = t("perDecade").toLowerCase();
  let items;
  if (isSingleYear) {
    const edgeA = edgeYears(data.a);
    const edgeB = edgeYears(data.b);
    const valA = edgeA.last ? edgeA.last.value.toFixed(2) + " " + data.unit : "—";
    const valB = edgeB.last ? edgeB.last.value.toFixed(2) + " " + data.unit : "—";
    const diffVal = edgeA.last && edgeB.last ? formatNum(edgeA.last.value - edgeB.last.value) + " " + data.unit : "—";
    items = [
      [data.a.name, valA, false, ht("singleYear") || "Single-year observation"],
      [data.b.name, valB, false, ht("singleYear") || "Single-year observation"],
      [t("diffTitle"), diffVal, false, data.a.name + " − " + data.b.name],
      [t("sample"), String(data.start_year), false, ht("noTrendSingle") || "No trend for single year"],
    ];
  } else if (isGeneral) {
    const dirA = (t("dir") && t("dir")[data.a.trend.direction]) || data.a.trend.direction;
    const dirB = (t("dir") && t("dir")[data.b.trend.direction]) || data.b.trend.direction;
    items = [
      [data.a.name, dirA, data.a.trend.significant, data.a.trend.significant ? t("trendBadgeConfirmed") : t("trendBadgeUnconfirmed")],
      [data.b.name, dirB, data.b.trend.significant, data.b.trend.significant ? t("trendBadgeConfirmed") : t("trendBadgeUnconfirmed")],
      [t("diffTitle"), formatNum(data.difference.slope.per_decade) + " " + data.unit, data.difference.trend.significant, data.difference.trend.significant ? t("trendBadgeConfirmed") : t("trendBadgeUnconfirmed")],
      [t("sample"), String(data.start_year) + "–" + String(data.end_year), true, String(data.a.gaps.years_used) + " " + t("sample").toLowerCase()],
    ];
  } else {
    items = [
      [data.a.name, formatNum(data.a.slope.per_decade) + " " + data.unit, data.a.trend.significant, perDec + " · " + (data.a.trend.significant ? t("sigYes") : t("sigNo")) + " (p " + formatP(data.a.trend.p_value) + ")"],
      [data.b.name, formatNum(data.b.slope.per_decade) + " " + data.unit, data.b.trend.significant, perDec + " · " + (data.b.trend.significant ? t("sigYes") : t("sigNo")) + " (p " + formatP(data.b.trend.p_value) + ")"],
      [t("diffTitle"), formatNum(data.difference.slope.per_decade) + " " + data.unit, data.difference.trend.significant, perDec + " · " + data.a.name + " − " + data.b.name],
      [t("diffTitle") + " p", formatP(data.difference.trend.p_value), data.difference.trend.significant, data.difference.trend.significant ? t("sigYes") : t("sigNo")],
    ];
  }
  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "metric";
    card.title = t("pHelp");
    const k = document.createElement("p");
    k.className = "k";
    k.textContent = item[0];
    const v = document.createElement("p");
    v.className = "v";
    v.textContent = item[1];
    const s = document.createElement("p");
    s.className = "s " + (item[2] ? "yes" : "no");
    s.textContent = item[3] || (item[2] ? t("sigYes") : t("sigNo"));
    card.appendChild(k);
    card.appendChild(v);
    card.appendChild(s);
    root.appendChild(card);
  });
}

function chartOptions() {
  const tick = "#d0dae8";
  const grid = "#31445f";
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    onHover: (event, elements, chart) => {
      if (!elements.length) return;
      showYear(chart.data.labels[elements[0].index]);
    },
    onClick: (event, elements, chart) => {
      if (!elements.length) return;
      showYear(chart.data.labels[elements[0].index]);
    },
    plugins: {
      legend: { position: "bottom", labels: { color: tick, boxWidth: 12 } },
      tooltip: {
        callbacks: {
          label: (item) => item.dataset.label + ": " + (item.parsed.y == null ? "—" : item.parsed.y),
          footer: () => t("yearHint"),
        },
      },
    },
    scales: {
      x: { ticks: { color: tick, maxTicksLimit: 8 }, grid: { color: grid } },
      y: { ticks: { color: tick }, grid: { color: grid } },
    },
  };
}

function renderCards(data) {
  const root = $("cards");
  root.innerHTML = "";
  charts.forEach((chart) => chart.destroy());
  charts = [];
  const isGeneral = currentRole() === "general";
  const isSingleYear = Number(data.start_year) === Number(data.end_year);
  [data.a, data.b].forEach((point, index) => {
    const card = document.createElement("article");
    card.className = "card";
    const title = document.createElement("h2");
    title.textContent = point.name + " · " + point.country;
    card.appendChild(title);

    const box = document.createElement("div");
    box.className = "chart-box";
    const canvas = document.createElement("canvas");
    box.appendChild(canvas);

    if (isSingleYear) {
      const tag = document.createElement("span");
      tag.className = "tag no";
      tag.textContent = ht("noTrendSingle") || "No trend for single year";
      card.appendChild(tag);

      const edge = edgeYears(point);
      const summaryP = document.createElement("p");
      summaryP.className = "plain-summary";
      summaryP.textContent = (edge.last ? (edge.last.year + ": " + edge.last.value.toFixed(2) + " " + data.unit + ". ") : "")
        + (ht("singleYearTip") || t("singleYearTip") || "");
      card.appendChild(summaryP);
      card.appendChild(box);
    } else if (isGeneral) {
      const tag = document.createElement("span");
      tag.className = "tag " + (point.trend.significant ? "yes" : "no");
      tag.textContent = point.trend.significant ? t("trendBadgeConfirmed") : t("trendBadgeUnconfirmed");
      card.appendChild(tag);

      const summaryP = document.createElement("p");
      summaryP.className = "plain-summary";
      summaryP.textContent = plainCitySummary(point, data);
      card.appendChild(summaryP);

      card.appendChild(box);

      const tech = document.createElement("details");
      tech.className = "fold tech-details";
      const techSum = document.createElement("summary");
      techSum.textContent = t("technicalDetails");
      tech.appendChild(techSum);

      const techStats = document.createElement("div");
      techStats.className = "stats";
      techStats.style.marginTop = "6px";
      const excluded = point.gaps.years_excluded.map((item) => item.year).join(", ");
      const techRows = [
        [t("perDecade"), formatNum(point.slope.per_decade) + " " + data.unit + " · " + t("perDecade").toLowerCase()],
        [t("interval"), formatNum(point.slope.ci_low_per_decade) + " – " + formatNum(point.slope.ci_high_per_decade)],
        ["p-value", formatP(point.trend.p_value) + " (" + (point.trend.significant ? t("sigYes") : t("sigNo")) + ")"],
        ["Mann-Kendall S / Z", String(point.trend.S) + " / " + Number(point.trend.Z || 0).toFixed(3)],
        [t("perYear"), formatNum(point.slope.per_year) + " " + data.unit + " (95% CI: " + formatNum(point.slope.ci_low_per_year) + " – " + formatNum(point.slope.ci_high_per_year) + ")"],
        [t("sample"), String(point.gaps.years_used) + " (" + String(point.gaps.observed_days || 0) + " days)"],
        [t("gaps"), String(point.gaps.missing_marked)],
        [t("excluded"), excluded || t("none")],
      ];
      techRows.forEach(([lbl, val]) => {
        const line = document.createElement("div");
        line.textContent = lbl + ": " + val;
        techStats.appendChild(line);
      });
      tech.appendChild(techStats);

      const explains = document.createElement("div");
      explains.className = "tech-explains";
      explains.innerHTML =
        "<p><strong>" + t("perDecade") + ":</strong> " + t("explainSlope") + "</p>" +
        "<p><strong>p-value:</strong> " + t("explainPValue") + "</p>" +
        "<p><strong>" + (t("significance") || "Significance") + ":</strong> " + (point.trend.significant ? t("sigYes") : t("sigNo")) + " — " + t("explainSignificance") + "</p>";
      tech.appendChild(explains);
      card.appendChild(tech);
    } else {
      const tag = document.createElement("span");
      tag.className = "tag " + (point.trend.significant ? "yes" : "no");
      tag.textContent = point.trend.significant ? t("sigYes") : t("sigNo");
      card.appendChild(tag);
      const callout = document.createElement("p");
      callout.className = "callout";
      callout.appendChild(document.createTextNode(formatNum(point.slope.per_decade) + " " + data.unit + " "));
      const per = document.createElement("span");
      per.textContent = t("perDecade").toLowerCase();
      callout.appendChild(per);
      card.appendChild(callout);
      card.appendChild(box);
      const stats = document.createElement("div");
      stats.className = "stats";
      const excluded = point.gaps.years_excluded.map((item) => item.year).join(", ");
      const rows = [
        [t("interval"), formatNum(point.slope.ci_low_per_decade) + " – " + formatNum(point.slope.ci_high_per_decade)],
        ["p", formatP(point.trend.p_value)],
      ];
      rows.forEach(([label, value]) => {
        const line = document.createElement("div");
        line.textContent = label + ": " + value;
        stats.appendChild(line);
      });
      const extra = fold(t("showMore"));
      [
        ["Mann-Kendall S / Z", String(point.trend.S) + " / " + Number(point.trend.Z || 0).toFixed(3)],
        [t("perYear"), formatNum(point.slope.per_year) + " " + data.unit + " (95% CI: " + formatNum(point.slope.ci_low_per_year) + " – " + formatNum(point.slope.ci_high_per_year) + ")"],
        [t("sample"), String(point.gaps.years_used) + " (" + String(point.gaps.observed_days || 0) + " days)"],
        [t("gaps"), String(point.gaps.missing_marked)],
        [t("excluded"), excluded || t("none")],
      ].forEach(([label, value]) => {
        const line = document.createElement("div");
        line.textContent = label + ": " + value;
        extra.appendChild(line);
      });
      stats.appendChild(extra);
      card.appendChild(stats);
    }

    const details = fold(t("sourceBtn"));
    const pre = document.createElement("pre");
    pre.className = "prov";
    const mode = point.provenance.mode;
    const modeText = mode === "live" ? t("modeLive") : mode === "offline" ? t("modeOffline") : t("modeSaved");
    const resultObject = point.result_object || {
      district: point.name,
      variable: data.variable,
      period: data.start_year + "-01-01 to " + data.end_year + "-12-31",
      n_observations: point.gaps.observed_days,
      trend: {
        S: point.trend.S,
        Z: Number(Number(point.trend.Z || 0).toFixed(4)),
        p_value: Number(Number(point.trend.p_value).toFixed(6)),
        direction: point.trend.direction,
        "significant_at_0.05": Boolean(point.trend.significant),
      },
      slope: {
        slope_per_year: Number(Number(point.slope.per_year).toFixed(6)),
        ci_low: Number(Number(point.slope.ci_low_per_year).toFixed(6)),
        ci_high: Number(Number(point.slope.ci_high_per_year).toFixed(6)),
        units: data.unit + " per year",
      },
      provenance: {
        dataset_id: "NASA POWER daily point",
        source_url: point.provenance.request_url || "https://power.larc.nasa.gov/api/temporal/daily/point",
        retrieved: point.provenance.fetched_at || "saved file",
        mode: mode === "saved" ? "cache" : mode,
      },
    };
    const rawSeries = (point.years || []).map((yr, idx) => {
      const val = point.values && point.values[idx] != null ? Number(point.values[idx]).toFixed(2) : "—";
      const days = point.day_counts && point.day_counts[idx] != null ? " (" + point.day_counts[idx] + "d)" : "";
      return yr + ": " + val + " " + data.unit + days;
    }).join(", ");
    pre.textContent = [
      modeText,
      point.provenance.dataset,
      "Sources: " + (point.provenance.underlying_sources || []).join(", "),
      "Variable: " + data.variable,
      "Point: " + point.lat + ", " + point.lon,
      "Returned point: " + point.provenance.returned_latitude + ", " + point.provenance.returned_longitude,
      "Fetched: " + (point.provenance.fetched_at || "saved file"),
      point.provenance.request_url || "",
      point.gaps.coverage_rule,
      "",
      "Result Object (JSON):",
      JSON.stringify(resultObject, null, 2),
      "",
      "Annual Series (" + (point.years || []).length + " yrs, " + (point.gaps.observed_days || 0) + " daily obs):",
      rawSeries,
    ].filter((line) => line !== undefined && line !== null).join("\n");
    details.appendChild(pre);
    card.appendChild(details);
    root.appendChild(card);
    charts.push(drawChart(canvas, point.years, point.values, point.fitted, index === 0 ? "#f3b4c8" : "#8fd4f5"));
  });
}

function drawChart(canvas, years, values, fitted, color) {
  return new Chart(canvas, {
    type: "line",
    data: {
      labels: years,
      datasets: [
        {
          label: t("observed"),
          data: values,
          borderColor: color,
          backgroundColor: color,
          pointRadius: 3,
          tension: 0,
        },
        {
          label: t("fitted"),
          data: fitted,
          borderColor: "#d5deee",
          borderDash: [6, 4],
          pointRadius: 0,
          tension: 0,
        },
      ],
    },
    options: chartOptions(),
  });
}

function flagSvg(country) {
  const flags = {
    Bangladesh: '<svg viewBox="0 0 60 40" aria-hidden="true"><rect width="60" height="40" fill="#006a4e"/><circle cx="25" cy="20" r="10" fill="#f42a41"/></svg>',
    India: '<svg viewBox="0 0 60 40" aria-hidden="true"><rect width="60" height="13.4" fill="#ff9933"/><rect y="13.3" width="60" height="13.4" fill="#ffffff"/><rect y="26.6" width="60" height="13.4" fill="#138808"/><circle cx="30" cy="20" r="5" fill="none" stroke="#000080" stroke-width="1.2"/><circle cx="30" cy="20" r="1.1" fill="#000080"/></svg>',
    Indonesia: '<svg viewBox="0 0 60 40" aria-hidden="true"><rect width="60" height="20" fill="#ce1126"/><rect y="20" width="60" height="20" fill="#ffffff"/></svg>',
    Egypt: '<svg viewBox="0 0 60 40" aria-hidden="true"><rect width="60" height="13.4" fill="#ce1126"/><rect y="13.3" width="60" height="13.4" fill="#ffffff"/><rect y="26.6" width="60" height="13.4" fill="#000000"/><circle cx="30" cy="20" r="3.2" fill="#c9a227"/></svg>',
    Nigeria: '<svg viewBox="0 0 60 40" aria-hidden="true"><rect width="20" height="40" fill="#008751"/><rect x="20" width="20" height="40" fill="#ffffff"/><rect x="40" width="20" height="40" fill="#008751"/></svg>',
  };
  return flags[country] || '<svg viewBox="0 0 60 40" aria-hidden="true"><rect width="60" height="40" fill="#245086"/></svg>';
}

function ownSlope(data, key) {
  const point = data[key];
  const sig = point.trend.significant ? t("sigYes") : t("sigNo");
  return point.name + ": " + formatNum(point.slope.per_decade) + " " + data.unit + " · " + t("perDecade").toLowerCase() + ". " + sig + ". p " + formatPSentence(point.trend.p_value);
}

function diffMeter(diff) {
  const lo = diff.slope.ci_low_per_decade;
  const hi = diff.slope.ci_high_per_decade;
  const mid = diff.slope.per_decade;
  const wrap = document.createElement("div");
  wrap.className = "meter";
  const span = hi - lo;
  if (!Number.isFinite(span) || Math.abs(span) < 1e-9) return wrap;
  const pad = Math.max(Math.abs(span) * 0.12, 0.02);
  const min = Math.min(lo, 0, mid) - pad;
  const max = Math.max(hi, 0, mid) + pad;
  const scale = (value) => ((value - min) / (max - min)) * 100;
  const track = document.createElement("div");
  track.className = "meter-track";
  const bar = document.createElement("div");
  bar.className = "meter-ci";
  bar.style.left = scale(Math.min(lo, hi)) + "%";
  bar.style.width = Math.max(1.5, Math.abs(scale(hi) - scale(lo))) + "%";
  const zero = document.createElement("div");
  zero.className = "meter-zero";
  zero.style.left = scale(0) + "%";
  const mark = document.createElement("div");
  mark.className = "meter-mark";
  mark.style.left = scale(mid) + "%";
  track.append(bar, zero, mark);
  const note = document.createElement("p");
  note.className = "hint";
  note.textContent = t("diffBar");
  wrap.append(track, note);
  return wrap;
}

function renderDiff(data) {
  const diff = data.difference;
  const isGeneral = currentRole() === "general";
  const isSingleYear = Number(data.start_year) === Number(data.end_year);
  const sentence = diff.trend.significant
    ? fill(t("diffSig"), { p: formatPSentence(diff.trend.p_value) })
    : fill(t("diffNot"), { p: formatPSentence(diff.trend.p_value) });
  const root = $("diff");
  root.innerHTML = "";
  const title = document.createElement("h2");
  title.textContent = t("diffTitle") + " · " + data.a.name + " − " + data.b.name;
  const stage = document.createElement("div");
  stage.className = "faces";
  const flagWrap = document.createElement("div");
  flagWrap.className = "flag-wrap";
  const flag = document.createElement("div");
  flag.className = "flag";
  flag.innerHTML = flagSvg(data.a.country);
  flag.setAttribute("role", "img");
  flag.setAttribute("aria-label", data.a.country);
  const country = document.createElement("p");
  country.textContent = data.a.country;
  flagWrap.append(flag, country);
  stage.appendChild(flagWrap);
  const spot = document.createElement("p");
  spot.className = "face-read";
  spot.textContent = isSingleYear
    ? (ht("singleYearTip") || t("singleYearTip"))
    : (isGeneral ? plainCitySummary(data[diffFocus], data) : ownSlope(data, diffFocus));
  ["a", "b"].forEach((key) => {
    const point = data[key];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "face";
    button.dataset.city = key;
    button.setAttribute("aria-pressed", diffFocus === key ? "true" : "false");
    const swatch = document.createElement("span");
    swatch.className = "swatch " + (key === "a" ? "a" : "b");
    const name = document.createElement("strong");
    name.textContent = point.name;
    const slope = document.createElement("span");
    slope.className = "face-slope";
    if (isSingleYear) {
      const edge = edgeYears(point);
      slope.textContent = edge.last ? (edge.last.value.toFixed(2) + " " + data.unit) : "—";
    } else {
      slope.textContent = formatNum(point.slope.per_decade) + " " + data.unit + " · " + t("perDecade").toLowerCase();
    }
    const sig = document.createElement("span");
    sig.className = "mark " + (!isSingleYear && point.trend.significant ? "yes" : "no");
    sig.textContent = isSingleYear
      ? (ht("singleYear") || "Single-year observation")
      : (isGeneral
        ? (point.trend.significant ? t("trendBadgeConfirmed") : t("trendBadgeUnconfirmed"))
        : (point.trend.significant ? t("sigYes") : t("sigNo")));
    button.append(swatch, name, slope, sig);
    button.addEventListener("click", () => {
      diffFocus = key;
      stage.querySelectorAll(".face").forEach((item) => {
        item.setAttribute("aria-pressed", item.dataset.city === key ? "true" : "false");
      });
      spot.textContent = isSingleYear
        ? (ht("singleYearTip") || t("singleYearTip"))
        : (currentRole() === "general" ? plainCitySummary(data[key], data) : ownSlope(data, key));
    });
    stage.appendChild(button);
  });
  const lead = document.createElement("p");
  lead.className = "hint";
  lead.textContent = t("diffFace");
  const body = document.createElement("p");
  body.textContent = fill(t("diffBody"), {
    label: data.a.name + " − " + data.b.name,
    mag: formatNum(diff.slope.per_decade),
    unit: data.unit,
    sentence,
  });
  const box = document.createElement("div");
  box.className = "chart-box wide";
  const canvas = document.createElement("canvas");
  box.appendChild(canvas);
  root.appendChild(title);
  root.appendChild(lead);
  root.appendChild(stage);
  root.appendChild(spot);
  const sentences = diffSentences(data);
  if (isSingleYear) {
    const singleP = document.createElement("p");
    singleP.textContent = sentences[0];
    root.appendChild(singleP);
  } else if (isGeneral) {
    const plainWhat = document.createElement("p");
    plainWhat.textContent = sentences[0] + " " + sentences[1];
    root.appendChild(plainWhat);
    const tech = fold(t("technicalDetails"));
    tech.className = "fold tech-details";
    tech.appendChild(diffMeter(diff));
    tech.appendChild(body);
    [2, 3, 4].forEach((index) => {
      const line = document.createElement("p");
      line.textContent = sentences[index];
      tech.appendChild(line);
    });
    root.appendChild(tech);
  } else {
    root.appendChild(diffMeter(diff));
    root.appendChild(body);
    [0, 2].forEach((index) => {
      const line = document.createElement("p");
      line.textContent = sentences[index];
      root.appendChild(line);
    });
    const extra = fold(t("showMore"));
    [1, 3, 4].forEach((index) => {
      const line = document.createElement("p");
      line.textContent = sentences[index];
      extra.appendChild(line);
    });
    root.appendChild(extra);
  }
  root.appendChild(box);
  charts.push(drawChart(canvas, diff.years, diff.values, diff.fitted, "#f3b4c8"));
}

function renderSample(data) {
  const root = $("sample");
  root.innerHTML = "";
  const values = data.a.values || [];
  const latestValue = values.length ? Number(values[values.length - 1]).toFixed(2) : "—";
  const title = document.createElement("h2");
  title.textContent = t("sampleTitle");
  const body = document.createElement("p");
  body.textContent = fill(t("sampleBody"), {
    city: data.a.name,
    value: latestValue,
    unit: data.unit,
  });
  root.appendChild(title);
  root.appendChild(body);
}

function renderMethod() {
  const root = $("method");
  root.innerHTML = "";
  const title = document.createElement("h2");
  title.textContent = t("methodTitle");
  const body = document.createElement("p");
  body.textContent = t("methodBody");
  root.appendChild(title);
  root.appendChild(body);
  if (!latest) return;
  const list = document.createElement("ul");
  [latest.a, latest.b].forEach((point) => {
    const item = document.createElement("li");
    const mode = point.provenance.mode;
    const modeText = mode === "live" ? t("modeLive") : mode === "offline" ? t("modeOffline") : t("modeSaved");
    item.textContent = point.name + ", " + point.country + " · " + Number(point.lat).toFixed(4) + ", " + Number(point.lon).toFixed(4) + ". " + modeText;
    list.appendChild(item);
  });
  root.appendChild(list);
}

function renderHealth() {
  const root = $("health");
  root.innerHTML = "";
  const title = document.createElement("h2");
  title.textContent = t("healthTitle");
  const note = document.createElement("p");
  note.className = "hint";
  note.textContent = t("healthNote");
  const grid = document.createElement("div");
  grid.className = "health-grid";
  t("health").forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "health-card" + (index === healthFocusIndex() ? " focus" : "");
    const heading = document.createElement("h3");
    heading.textContent = item.title;
    const body = document.createElement("p");
    body.textContent = item.body;
    const list = document.createElement("ul");
    item.steps.forEach((step) => {
      const li = document.createElement("li");
      li.textContent = step;
      list.appendChild(li);
    });
    const steps = fold(t("showMore"));
    if (index === healthFocusIndex()) steps.open = true;
    steps.appendChild(list);
    card.appendChild(heading);
    card.appendChild(body);
    card.appendChild(steps);
    grid.appendChild(card);
  });
  root.appendChild(title);
  root.appendChild(note);
  root.appendChild(grid);
  const lesson = document.createElement("button");
  lesson.type = "button";
  lesson.className = "primary";
  lesson.style.marginTop = "12px";
  lesson.textContent = t("openHeat");
  lesson.addEventListener("click", () => playLesson("heat"));
  root.appendChild(lesson);
}

function renderPlans(data) {
  const root = $("plans");
  root.innerHTML = "";
  const title = document.createElement("h2");
  title.textContent = t("planTitle");
  const note = document.createElement("p");
  note.className = "hint";
  note.textContent = t("planNote");
  root.appendChild(title);
  root.appendChild(note);
  [data.a, data.b].forEach((city) => {
    const agencies = city.agencies || {};
    const values = {
      city: city.name,
      health: agencies.health || "",
      water: agencies.water || "",
      municipal: agencies.municipal || "",
      planning: agencies.planning || "",
    };
    const cityBlock = document.createElement("section");
    cityBlock.className = "plan-city";
    const cityHeading = document.createElement("h3");
    cityHeading.textContent = fill(t("plansFor"), { city: city.name });
    cityBlock.appendChild(cityHeading);
    ["short", "mid", "long"].forEach((key) => {
      const open = key === "short";
      const block = document.createElement(open ? "section" : "details");
      block.className = open ? "plan-block" : "fold plan-block";
      const heading = document.createElement(open ? "h3" : "summary");
      heading.textContent = t(key);
      const list = document.createElement("div");
      list.className = "plan-list";
      t("plans")[key].forEach((line) => {
        const card = document.createElement("article");
        card.className = "plan-card";
        card.textContent = fill(line, values);
        list.appendChild(card);
      });
      block.appendChild(heading);
      block.appendChild(list);
      cityBlock.appendChild(block);
    });
    root.appendChild(cityBlock);
  });
}

function yearSpan() {
  return Number($("to-year").value) - Number($("from-year").value) + 1;
}

function paintWindowNote() {
  const note = $("window-note");
  if (!note) return;
  const span = yearSpan();
  if (!Number.isFinite(span) || span >= 10) {
    note.hidden = true;
    return;
  }
  note.hidden = false;
  $("window-text").textContent = fill(t("shortWindow"), { n: span });
  $("full-record").textContent = t("fullRecord");
}

function boardKey() {
  const pair = currentPair();
  if (!pair) return "";
  return [pair.id, $("season").value, $("from-year").value, $("to-year").value].join("|");
}

function mark(significant, isSingleYear) {
  const span = document.createElement("span");
  if (isSingleYear) {
    span.className = "mark no";
    span.textContent = ht("singleYear") || "Single-year observation";
    return span;
  }
  const isGeneral = currentRole() === "general";
  span.className = "mark " + (significant ? "yes" : "no");
  span.textContent = significant
    ? (isGeneral ? t("trendBadgeConfirmed") : t("sigYes"))
    : (isGeneral ? t("trendBadgeUnconfirmed") : t("sigNo"));
  return span;
}

function renderBoard(rows) {
  const root = $("board");
  const strip = $("trend-board");
  if (strip) strip.innerHTML = "";
  if (!root || !rows || !rows.length) {
    if (root) {
      root.hidden = true;
      root.innerHTML = "";
    }
    return;
  }
  root.hidden = false;
  root.innerHTML = "";
  const isSingleYear = Number(rows[0].start_year) === Number(rows[0].end_year);
  const isGeneral = currentRole() === "general";
  const title = document.createElement("h2");
  title.textContent = t("boardTitle");
  const note = document.createElement("p");
  note.className = "hint";
  note.textContent = t("boardNote");
  const table = document.createElement("div");
  table.className = "board-table";
  const head = document.createElement("div");
  head.className = "board-row head";
  [t("variable"), rows[0].a.name, rows[0].b.name, t("diffTitle")].forEach((text) => {
    const span = document.createElement("span");
    span.textContent = text;
    head.appendChild(span);
  });
  table.appendChild(head);
  rows.forEach((row) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "board-row" + (row.variable === $("variable").value ? " current" : "");
    const name = document.createElement("span");
    name.textContent = (t("vars") && t("vars")[row.variable]) || row.variable;
    button.appendChild(name);
    button.appendChild(mark(row.a.trend.significant, isSingleYear));
    button.appendChild(mark(row.b.trend.significant, isSingleYear));
    button.appendChild(mark(row.difference.trend.significant, isSingleYear));
    button.addEventListener("click", () => openMeasure(row.variable));
    table.appendChild(button);
    if (strip) {
      const chip = document.createElement("button");
      chip.type = "button";
      const sigA = row.a.trend.significant;
      const sigB = row.b.trend.significant;
      chip.className = "chip" + (row.variable === $("variable").value ? " current" : "");
      if (isSingleYear) {
        chip.textContent = name.textContent + " · " + String(row.start_year);
      } else {
        const badgeYes = isGeneral ? t("trendBadgeConfirmed") : t("sigYes");
        const badgeNo = isGeneral ? t("trendBadgeUnconfirmed") : t("sigNo");
        chip.textContent = name.textContent + " · "
          + row.a.name + ": " + (sigA ? badgeYes : badgeNo)
          + " / " + row.b.name + ": " + (sigB ? badgeYes : badgeNo);
      }
      chip.addEventListener("click", () => openMeasure(row.variable));
      strip.appendChild(chip);
    }
  });
  const scroller = document.createElement("div");
  scroller.className = "board-scroll";
  scroller.appendChild(table);
  root.appendChild(title);
  root.appendChild(note);
  root.appendChild(scroller);
}

async function openMeasure(variable) {
  const changed = $("variable").value !== variable;
  if (changed) $("variable").value = variable;
  setView("trends");
  if (changed) await load(false);
}

async function loadBoard() {
  const token = ++boardToken;
  const pair = currentPair();
  const key = boardKey();
  if (!pair || !key) return;
  if (boardCache.key === key && boardCache.rows) {
    renderBoard(boardCache.rows);
    return;
  }
  try {
    const rows = await Promise.all(MEASURES.map(async (variable) => {
      const params = new URLSearchParams({
        city_a: pair.a.id,
        city_b: pair.b.id,
        variable,
        season: $("season").value,
        start_year: $("from-year").value,
        end_year: $("to-year").value,
      });
      const response = await fetch("/api/compare?" + params.toString());
      if (!response.ok) return null;
      return response.json();
    }));
    if (token !== boardToken) return;
    const ready = rows.filter(Boolean);
    boardCache = { key, rows: ready };
    renderBoard(ready);
  } catch (error) {
    if (token === boardToken) renderBoard(null);
  }
}

function renderMap(data) {
  if (typeof L === "undefined") {
    $("map-note").textContent = t("mapOffline");
    return;
  }
  if (!mapInstance) {
    mapInstance = L.map("map", { minZoom: 2, maxZoom: 8, scrollWheelZoom: true }).setView([23.8, 90.4], 5);
    const addOutline = () => {
      if (offlineLayer || typeof OFFLINE_WORLD_MAP === "undefined") return;
      offlineLayer = L.geoJSON(OFFLINE_WORLD_MAP, {
        style: { color: "#8fd4f5", weight: 1.2, fillColor: "#122033", fillOpacity: 0.92 },
      }).addTo(mapInstance);
      $("map-note").textContent = t("mapOffline");
    };
    if (navigator.onLine) {
      gibsLayer = L.tileLayer(
        "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg",
        { attribution: "NASA GIBS", maxZoom: 8, maxNativeZoom: 8 }
      );
      let errors = 0;
      gibsLayer.on("tileerror", () => {
        errors += 1;
        if (errors >= 4 && mapInstance.hasLayer(gibsLayer)) {
          mapInstance.removeLayer(gibsLayer);
          addOutline();
        }
      });
      gibsLayer.addTo(mapInstance);
      $("map-note").textContent = t("mapOnline");
    } else {
      addOutline();
    }
    markerLayer = L.layerGroup().addTo(mapInstance);
    if (!scaleControl) scaleControl = L.control.scale({ imperial: false, position: "bottomleft" }).addTo(mapInstance);
  }
  markerLayer.clearLayers();
  const points = [
    [data.a, "#f3b4c8"],
    [data.b, "#8fd4f5"],
  ];
  points.forEach(([point, color]) => {
    const marker = L.circleMarker([point.lat, point.lon], {
      radius: 9,
      color: "#ffffff",
      weight: 2,
      fillColor: color,
      fillOpacity: 0.95,
    });
    marker.bindTooltip(point.name, { permanent: true, direction: "top", offset: [0, -6], className: "city-tip" });
    marker.bindPopup("<strong>" + point.name + "</strong><br>" + point.country + "<br>" + Number(point.lat).toFixed(4) + ", " + Number(point.lon).toFixed(4));
    marker.addTo(markerLayer);
  });
  L.polyline([[data.a.lat, data.a.lon], [data.b.lat, data.b.lon]], {
    color: "#8fd4f5",
    weight: 2,
    dashArray: "5 7",
  }).addTo(markerLayer);
  mapInstance.fitBounds([[data.a.lat, data.a.lon], [data.b.lat, data.b.lon]], { padding: [64, 64], maxZoom: 6 });
  const tilesOn = gibsLayer && mapInstance.hasLayer(gibsLayer);
  const km = distanceKm(data.a.lat, data.a.lon, data.b.lat, data.b.lon);
  $("map-note").textContent = (tilesOn ? t("mapOnline") : t("mapOffline")) + " " + fill(t("mapDistance"), { km: String(Math.round(km)) });
  $("legend-a").textContent = data.a.name;
  $("legend-b").textContent = data.b.name;
  if (mapBase === "outline" && gibsLayer && mapInstance.hasLayer(gibsLayer)) showMapBase("outline");
  else paintMapLayers();
  setTimeout(() => mapInstance.invalidateSize(), 150);
}

function placeLocator() {
  const slot = document.querySelector("#view-panel-" + view + " .locator-slot");
  const box = $("locator");
  if (!slot || !box) return;
  if (box.parentElement !== slot) slot.appendChild(box);
  if (locatorMap) setTimeout(() => locatorMap.invalidateSize(), 80);
}

function renderLocator(data) {
  if (typeof L === "undefined" || !$("locator-map") || !data) return;
  if (!locatorMap) {
    locatorMap = L.map("locator-map", {
      minZoom: 2,
      maxZoom: 6,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
    }).setView([23.8, 90.4], 4);
    const addOutline = () => {
      if (locatorOutline || typeof OFFLINE_WORLD_MAP === "undefined") return;
      locatorOutline = L.geoJSON(OFFLINE_WORLD_MAP, {
        style: { color: "#8fd4f5", weight: 1, fillColor: "#122033", fillOpacity: 0.92 },
      }).addTo(locatorMap);
    };
    if (navigator.onLine) {
      locatorGibs = L.tileLayer(
        "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg",
        { maxZoom: 6, maxNativeZoom: 8 }
      );
      let errors = 0;
      locatorGibs.on("tileerror", () => {
        errors += 1;
        if (errors >= 4 && locatorMap.hasLayer(locatorGibs)) {
          locatorMap.removeLayer(locatorGibs);
          addOutline();
        }
      });
      locatorGibs.addTo(locatorMap);
    } else {
      addOutline();
    }
    locatorMarkers = L.layerGroup().addTo(locatorMap);
  }
  locatorMarkers.clearLayers();
  [[data.a, "#f3b4c8"], [data.b, "#8fd4f5"]].forEach(([point, color]) => {
    L.circleMarker([point.lat, point.lon], {
      radius: 7,
      color: "#ffffff",
      weight: 2,
      fillColor: color,
      fillOpacity: 0.95,
    }).bindTooltip(point.name, { permanent: true, direction: "top", offset: [0, -4], className: "city-tip" }).addTo(locatorMarkers);
  });
  L.polyline([[data.a.lat, data.a.lon], [data.b.lat, data.b.lon]], {
    color: "#8fd4f5",
    weight: 2,
    dashArray: "4 6",
  }).addTo(locatorMarkers);
  locatorMap.fitBounds([[data.a.lat, data.a.lon], [data.b.lat, data.b.lon]], { padding: [28, 28], maxZoom: 5 });
  const km = distanceKm(data.a.lat, data.a.lon, data.b.lat, data.b.lon);
  if ($("locator-kicker")) $("locator-kicker").textContent = t("locatorKicker");
  if ($("locator-caption")) {
    $("locator-caption").textContent = data.a.name + " · " + data.b.name + ". " + fill(t("mapDistance"), { km: String(Math.round(km)) });
  }
  const legend = $("locator-legend");
  if (legend) {
    legend.innerHTML = "";
    [[data.a, "a"], [data.b, "b"]].forEach(([point, key]) => {
      const swatch = document.createElement("span");
      swatch.className = "swatch " + key;
      const name = document.createElement("span");
      name.textContent = point.name;
      legend.append(swatch, name);
    });
  }
  setTimeout(() => locatorMap.invalidateSize(), 80);
}

const PAIR_LABELS = {
  en: {
    bangladesh: "Dhaka · Sylhet (Bangladesh)",
    india: "Delhi · Kolkata (India)",
    indonesia: "Jakarta · Surabaya (Indonesia)",
    egypt: "Cairo · Alexandria (Egypt)",
    nigeria: "Lagos · Abuja (Nigeria)",
  },
  bn: {
    bangladesh: "ঢাকা · সিলেট (বাংলাদেশ)",
    india: "দিল্লি · কলকাতা (ভারত)",
    indonesia: "জাকার্তা · সুরাবায়া (ইন্দোনেশিয়া)",
    egypt: "কায়রো · আলেকজান্দ্রিয়া (মিশর)",
    nigeria: "লেগোস · আবুজা (নাইজেরিয়া)",
  },
  hi: {
    bangladesh: "ढाका · सिलहट (बांग्लादेश)",
    india: "दिल्ली · कोलकाता (भारत)",
    indonesia: "जकार्ता · सुराबाया (इंडोनेशिया)",
    egypt: "काहिरा · सिकंदरिया (मिस्र)",
    nigeria: "लागोस · अबूजा (नाइजीरिया)",
  },
  id: {
    bangladesh: "Dhaka · Sylhet (Bangladesh)",
    india: "Delhi · Kolkata (India)",
    indonesia: "Jakarta · Surabaya (Indonesia)",
    egypt: "Kairo · Aleksandria (Mesir)",
    nigeria: "Lagos · Abuja (Nigeria)",
  },
  ar: {
    bangladesh: "دكا · سيلهيت (بنغلاديش)",
    india: "دلهي · كولكاتا (الهند)",
    indonesia: "جاكرتا · سورابايا (إندونيسيا)",
    egypt: "القاهرة · الإسكندرية (مصر)",
    nigeria: "لاغوس · أبوجا (نيجيريا)",
  },
  yo: {
    bangladesh: "Dhaka · Sylhet (Bangladesh)",
    india: "Delhi · Kolkata (India)",
    indonesia: "Jakarta · Surabaya (Indonesia)",
    egypt: "Cairo · Alexandria (Egypt)",
    nigeria: "Lagos · Abuja (Nigeria)",
  },
};

function paintPairs() {
  const select = $("pair");
  if (!select || !pairs.length) return;
  const keep = select.value || "bangladesh";
  const labels = PAIR_LABELS[lang] || PAIR_LABELS.en;
  select.innerHTML = "";
  pairs.forEach((pair) => {
    const option = document.createElement("option");
    option.value = pair.id;
    option.textContent = labels[pair.id] || (pair.a.name + " · " + pair.b.name + " (" + pair.country + ")");
    select.appendChild(option);
  });
  if ([...select.options].some((o) => o.value === keep)) select.value = keep;
  else select.value = "bangladesh";
}

async function loadPairs() {
  const response = await fetch("/api/pairs");
  pairs = await response.json();
  paintPairs();
  $("pair").value = "bangladesh";
  readShare();
  preferLinesCountry();
}

function downloadCsv() {
  window.location.href = "/api/export?" + query(false).toString();
}

function currentRole() {
  const value = $("role") ? $("role").value : "general";
  return value === "student" || value === "scientist" ? value : "general";
}

function roleText() {
  const who = currentRole();
  if (who === "student") return t("roleStudent");
  if (who === "scientist") return t("roleScientist");
  return t("roleGeneral");
}

function healthFocusIndex() {
  return { T2M_MIN: 0, T2M_MAX: 1, PRECTOTCORR: 2, T2M: 3 }[$("variable").value] ?? 3;
}

function distanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (value) => value * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

function diffSentences(data) {
  const diff = data.difference;
  return [
    fill(t("diffWhat"), { a: data.a.name, b: data.b.name }),
    fill(t("diffSame"), { a: data.a.name, b: data.b.name }),
    fill(diff.trend.significant ? t("diffClaimYes") : t("diffClaimNo"), { p: formatPSentence(diff.trend.p_value) }),
    fill(t("diffCi"), {
      lo: formatNum(diff.slope.ci_low_per_decade),
      hi: formatNum(diff.slope.ci_high_per_decade),
      unit: data.unit,
    }),
    fill(t("diffYears"), { n: diff.years.length }),
  ];
}

function valueIn(point, year) {
  const index = (point.years || []).indexOf(year);
  if (index < 0) return null;
  return point.values[index];
}

function showYear(year) {
  if (!latest) return;
  const va = valueIn(latest.a, year);
  const vb = valueIn(latest.b, year);
  const vd = valueIn(latest.difference, year);
  const text = fill(t("yearRead"), {
    year,
    a: latest.a.name,
    b: latest.b.name,
    va: va == null ? "—" : Number(va).toFixed(2),
    vb: vb == null ? "—" : Number(vb).toFixed(2),
    vd: vd == null ? "—" : formatNum(vd),
    unit: latest.unit,
  });
  if ($("year-read")) $("year-read").textContent = text;
  if ($("result-year")) $("result-year").textContent = text;
}

function rt(key) {
  const pack = (typeof REPORT_TEXT !== "undefined" && REPORT_TEXT[reportLang]) || {};
  if (Object.prototype.hasOwnProperty.call(pack, key)) return pack[key];
  const site = I18N[reportLang];
  if (site && site[key] !== undefined) return site[key];
  return I18N.en[key];
}

function reportOn(id) {
  return reportSections[id] !== false;
}

function reportCity(point, data) {
  const slope = point.slope;
  return fill(rt("cityLine"), {
    city: point.name,
    dir: rt("dir")[point.trend.direction],
    mag: formatAbs(slope.per_decade),
    unit: data.unit,
    sig: point.trend.significant ? rt("sigYes") : rt("sigNo"),
    p: formatPSentence(point.trend.p_value),
    lo: formatNum(slope.ci_low_per_decade),
    hi: formatNum(slope.ci_high_per_decade),
  });
}

function reportPair(data) {
  const a = data.a.trend;
  const b = data.b.trend;
  if (a.significant && b.significant && a.direction !== b.direction && a.direction !== "no trend" && b.direction !== "no trend") {
    return rt("pairOpposite");
  }
  if (a.significant && !b.significant) return fill(rt("pairOne"), { sigCity: data.a.name, otherCity: data.b.name });
  if (b.significant && !a.significant) return fill(rt("pairOne"), { sigCity: data.b.name, otherCity: data.a.name });
  if (a.significant && b.significant) return rt("pairBoth");
  return rt("pairNeither");
}

function reportRole() {
  const who = currentRole();
  if (who === "student") return rt("roleStudent");
  if (who === "scientist") return rt("roleScientist");
  return rt("roleGeneral");
}

function reportDiffLines(data) {
  const diff = data.difference;
  return [
    fill(rt("diffWhat"), { a: data.a.name, b: data.b.name }),
    fill(rt("diffSame"), { a: data.a.name, b: data.b.name }),
    fill(diff.trend.significant ? rt("diffClaimYes") : rt("diffClaimNo"), { p: formatPSentence(diff.trend.p_value) }),
    fill(rt("diffCi"), {
      lo: formatNum(diff.slope.ci_low_per_decade),
      hi: formatNum(diff.slope.ci_high_per_decade),
      unit: data.unit,
    }),
    fill(rt("diffYears"), { n: diff.years.length }),
    rt("notCause"),
  ];
}

function reportLines(data) {
  const who = currentRole();
  const season = (rt("seasons") && rt("seasons")[data.season]) || data.season;
  const measure = (rt("vars") && rt("vars")[data.variable]) || data.variable;
  const lines = [];
  const add = (id, rows) => {
    if (!reportOn(id)) return;
    rows.forEach((row) => lines.push(row));
  };
  add("summary", [
    rt("reportTitle"),
    rt("roles")[who],
    data.a.name + " · " + data.b.name + " · " + data.a.country,
    measure + " · " + season + " · " + data.start_year + "–" + data.end_year,
    "",
    reportRole(),
    "",
    reportPair(data),
  ]);
  add("findings", ["", reportCity(data.a, data), reportCity(data.b, data)]);
  add("compare", [""].concat(reportDiffLines(data)));
  if (who === "general" && reportOn("story")) lines.push("", rt("healthNote"));
  add("story", ["", reportPair(data)]);
  add("method", ["", rt("methodBody")]);
  add("limits", ["", rt("evLimit")]);
  add("source", [
    "",
    "NASA POWER",
    data.variable + " · " + data.unit,
    data.a.provenance.dataset || "",
    data.a.provenance.request_url || "",
    data.a.name + " " + Number(data.a.lat).toFixed(4) + ", " + Number(data.a.lon).toFixed(4),
    data.b.name + " " + Number(data.b.lat).toFixed(4) + ", " + Number(data.b.lon).toFixed(4),
    data.generated_at || "",
  ]);
  lines.push("", rt("keptSource"));
  return lines.filter((line) => line !== undefined);
}

function reportBase(data) {
  return ["trend", data.a.id, data.b.id, data.variable, currentRole()].join("-");
}

function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function saveText(text, name, type) {
  saveBlob(new Blob([text], { type: type + ";charset=utf-8" }), name);
}

function esc(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function reportSpark(data) {
  const years = data.a.years || [];
  const bByYear = new Map((data.b.years || []).map((year, index) => [year, data.b.values[index]]));
  const series = [
    [data.a.name, years.map((year, index) => data.a.values[index]), "#c45b78"],
    [data.b.name, years.map((year) => (bByYear.has(year) ? bByYear.get(year) : null)), "#1d6f93"],
  ];
  const nums = series.flatMap((item) => item[1].filter((value) => value != null));
  if (!nums.length) return "";
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const span = max - min || 1;
  const width = 640;
  const height = 220;
  const left = 36;
  const plotW = width - 52;
  const line = (values, color) => {
    const points = values.map((value, index) => {
      if (value == null) return null;
      const x = left + (values.length === 1 ? 0 : (index / (values.length - 1)) * plotW);
      const y = 24 + (1 - (value - min) / span) * 150;
      return x.toFixed(1) + "," + y.toFixed(1);
    }).filter(Boolean).join(" ");
    return "<polyline fill=\"none\" stroke=\"" + color + "\" stroke-width=\"2.5\" points=\"" + points + "\"/>";
  };
  const first = years[0] || "";
  const last = years[years.length - 1] || "";
  const legend = series.map((item, index) => {
    return "<rect x=\"" + (left + index * 180) + "\" y=\"188\" width=\"14\" height=\"8\" fill=\"" + item[2] + "\"/>"
      + "<text x=\"" + (left + 20 + index * 180) + "\" y=\"196\" fill=\"#102033\" font-size=\"13\">" + esc(item[0]) + "</text>";
  }).join("");
  return "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 " + width + " " + height + "\" role=\"img\">"
    + "<rect width=\"100%\" height=\"100%\" fill=\"#f7fafc\"/>"
    + "<text x=\"" + left + "\" y=\"16\" fill=\"#102033\" font-size=\"13\">" + esc(rt("chartOf") + " · " + data.unit) + "</text>"
    + line(series[0][1], series[0][2]) + line(series[1][1], series[1][2])
    + legend
    + "<text x=\"" + left + "\" y=\"176\" fill=\"#334155\" font-size=\"12\">" + esc(String(first)) + "</text>"
    + "<text x=\"" + (width - 70) + "\" y=\"176\" fill=\"#334155\" font-size=\"12\">" + esc(String(last)) + "</text>"
    + "</svg>";
}

function reportSketch(data) {
  const km = Math.round(distanceKm(data.a.lat, data.a.lon, data.b.lat, data.b.lon));
  return "<div class=\"ltr\"><svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 420 150\" role=\"img\">"
    + "<rect width=\"100%\" height=\"100%\" fill=\"#e7eef6\"/>"
    + "<line x1=\"70\" y1=\"78\" x2=\"300\" y2=\"78\" stroke=\"#1d6f93\" stroke-dasharray=\"4 4\"/>"
    + "<circle cx=\"70\" cy=\"78\" r=\"8\" fill=\"#c45b78\"/>"
    + "<circle cx=\"300\" cy=\"78\" r=\"8\" fill=\"#1d6f93\"/>"
    + "<text x=\"70\" y=\"58\" text-anchor=\"middle\" fill=\"#102033\" font-size=\"14\">" + esc(data.a.name) + "</text>"
    + "<text x=\"300\" y=\"58\" text-anchor=\"middle\" fill=\"#102033\" font-size=\"14\">" + esc(data.b.name) + "</text>"
    + "<text x=\"185\" y=\"108\" text-anchor=\"middle\" fill=\"#334155\" font-size=\"13\">" + km + " km</text>"
    + "</svg></div><p>" + esc(fill(rt("mapDistance"), { km: String(km) })) + "</p><p>" + esc(rt("sketch")) + "</p>";
}

function reportBlocks(data) {
  const season = (rt("seasons") && rt("seasons")[data.season]) || data.season;
  const measure = (rt("vars") && rt("vars")[data.variable]) || data.variable;
  const mode = data.a.provenance.mode === "live" ? rt("modeLive") : data.a.provenance.mode === "offline" ? rt("modeOffline") : rt("modeSaved");
  const blocks = [];
  const push = (id, title, html) => {
    if (reportOn(id)) blocks.push({ id, title, html });
  };
  push("summary", rt("hSummary"), "<p class=\"lead\">" + esc(reportPair(data)) + "</p><p>" + esc(reportRole()) + "</p>"
    + "<p><bdi>" + esc(data.a.name + " · " + data.b.name + ", " + data.a.country) + "</bdi></p>"
    + "<p>" + esc(measure + " · " + season + " · " + data.start_year + "–" + data.end_year) + "</p>");
  push("findings", rt("hFindings"), "<div class=\"cards\"><article><h3><bdi>" + esc(data.a.name) + "</bdi></h3><p>"
    + esc(formatNum(data.a.slope.per_decade) + " " + data.unit) + "</p><p>" + esc(data.a.trend.significant ? rt("sigYes") : rt("sigNo"))
    + " · p " + esc(formatP(data.a.trend.p_value)) + "</p></article><article><h3><bdi>" + esc(data.b.name) + "</bdi></h3><p>"
    + esc(formatNum(data.b.slope.per_decade) + " " + data.unit) + "</p><p>" + esc(data.b.trend.significant ? rt("sigYes") : rt("sigNo"))
    + " · p " + esc(formatP(data.b.trend.p_value)) + "</p></article></div><p>" + esc(reportCity(data.a, data)) + "</p><p>" + esc(reportCity(data.b, data)) + "</p>");
  push("chart", rt("hChart"), "<div class=\"ltr\">" + reportSpark(data) + "</div>");
  push("map", rt("hMap"), reportSketch(data));
  const excludedA = data.a.gaps.years_excluded.map((item) => item.year).join(", ") || rt("none");
  push("stats", rt("hStats"), "<dl><dt>" + esc(rt("interval")) + "</dt><dd><bdi>" + esc(data.a.name) + "</bdi> "
    + esc(formatNum(data.a.slope.ci_low_per_decade) + " to " + formatNum(data.a.slope.ci_high_per_decade)) + "</dd><dd><bdi>"
    + esc(data.b.name) + "</bdi> " + esc(formatNum(data.b.slope.ci_low_per_decade) + " to " + formatNum(data.b.slope.ci_high_per_decade))
    + "</dd><dt>p</dt><dd><bdi>" + esc(data.a.name) + "</bdi> " + esc(formatP(data.a.trend.p_value)) + " · <bdi>"
    + esc(data.b.name) + "</bdi> " + esc(formatP(data.b.trend.p_value)) + "</dd><dt>" + esc(rt("sample")) + "</dt><dd>"
    + esc(String(data.a.gaps.years_used) + " · " + String(data.b.gaps.years_used)) + "</dd><dt>" + esc(rt("gaps")) + "</dt><dd>"
    + esc(String(data.a.gaps.missing_marked) + " · " + String(data.b.gaps.missing_marked)) + "</dd><dt>" + esc(rt("excluded"))
    + "</dt><dd>" + esc(excludedA) + "</dd></dl>"
    + "<details><summary>" + esc(rt("glossSlope")) + "</summary><p>" + esc(rt("glossP")) + "</p><p>" + esc(rt("glossCi")) + "</p></details>");
  push("compare", rt("hCompare"), reportDiffLines(data).map((line) => "<p>" + esc(line) + "</p>").join(""));
  push("story", rt("hStory"), "<p>" + esc(reportPair(data)) + "</p><p>" + esc(reportCity(data.a, data)) + "</p><p>" + esc(reportCity(data.b, data)) + "</p>"
    + (currentRole() === "general" ? "<p>" + esc(rt("healthNote")) + "</p>" : ""));
  push("source", rt("hSource"), "<p>NASA POWER</p><p>" + esc(data.variable + " · " + data.unit) + "</p><p>" + esc(mode) + "</p><p>"
    + esc(data.a.provenance.dataset || "") + "</p><p><bdi>" + esc(data.a.name) + "</bdi> " + esc(Number(data.a.lat).toFixed(4) + ", " + Number(data.a.lon).toFixed(4))
    + "</p><p><bdi>" + esc(data.b.name) + "</bdi> " + esc(Number(data.b.lat).toFixed(4) + ", " + Number(data.b.lon).toFixed(4)) + "</p>"
    + (data.a.provenance.request_url ? "<p><a href=\"" + esc(data.a.provenance.request_url) + "\">NASA POWER</a></p>" : "")
    + "<p>" + esc(data.generated_at || "") + "</p>");
  push("method", rt("hMethod"), "<p>" + esc(rt("methodBody")) + "</p>");
  push("limits", rt("hLimits"), "<p>" + esc(rt("evLimit")) + "</p>");
  return blocks;
}

function reportHtml(data) {
  const prev = reportLang;
  const packs = {};
  REPORT_LANGS.forEach(([code]) => {
    reportLang = code;
    packs[code] = { dir: code === "ar" ? "rtl" : "ltr", title: rt("reportTitle"), blocks: reportBlocks(data) };
  });
  reportLang = prev;
  const chosen = packs[reportLang] || packs.en;
  const toc = chosen.blocks.map((block) => "<li><a href=\"#" + block.id + "\">" + esc(block.title) + "</a></li>").join("");
  const body = chosen.blocks.map((block) => "<section id=\"" + block.id + "\"><h2>" + esc(block.title) + "</h2>" + block.html + "</section>").join("");
  const options = REPORT_LANGS.map(([code, name]) => "<option value=\"" + code + "\"" + (code === reportLang ? " selected" : "") + ">" + name + "</option>").join("");
  const json = JSON.stringify(packs).replace(/</g, "\\u003c");
  return "<!DOCTYPE html><html lang=\"" + esc(reportLang) + "\" dir=\"" + chosen.dir + "\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>"
    + esc(chosen.title) + "</title><style>"
    + "body{margin:0;background:#f4f7fb;color:#102033;font:16px/1.55 'Nirmala UI','Segoe UI','Traditional Arabic','Noto Naskh Arabic',sans-serif}"
    + "header,main{max-width:860px;margin:0 auto;padding:16px}header{display:flex;flex-wrap:wrap;gap:8px;align-items:center}"
    + "h1{font-size:1.7rem;line-height:1.25;margin:0 0 8px}h2{font-size:1.2rem;margin:0 0 8px}p{margin:0 0 8px}"
    + ".kicker{margin:0;color:#1d6f93;font-weight:700}.lead{font-size:1.15rem;font-weight:700}"
    + ".cards{display:grid;grid-template-columns:1fr 1fr;gap:10px}.cards article{border:1px solid #c5d2e2;border-radius:12px;padding:10px;background:#fff}"
    + "dl{display:grid;grid-template-columns:minmax(140px,220px) 1fr;gap:4px 12px}dt{font-weight:700}nav ol{padding-inline-start:1.2rem}"
    + "a{color:#1d4f73}.ltr{direction:ltr}svg{width:100%;height:auto}details{margin-top:8px}"
    + "footer{border-top:1px solid #c5d2e2;margin-top:16px;padding-top:8px;color:#334155}"
    + "@media(max-width:700px){.cards,dl{grid-template-columns:1fr}}"
    + "@page{margin:14mm} @media print{header button,header select,header label,.back{display:none}body{background:#fff}}"
    + "</style></head><body id=\"top\"><header class=\"noprint\"><label>" + esc(rt("toc")) + " <select id=\"rl\">" + options + "</select></label>"
    + "<button type=\"button\" id=\"pr\">" + esc((REPORT_TEXT[reportLang] || REPORT_TEXT.en).printBtn || "Print") + "</button>"
    + "<a class=\"back\" href=\"#top\">" + esc(rt("backTop")) + "</a></header><main><p class=\"kicker\">" + esc(rt("coverKicker")) + "</p><h1>"
    + esc(chosen.title) + "</h1><nav><p>" + esc(rt("toc")) + "</p><ol>" + toc + "</ol></nav><article id=\"doc\">" + body + "</article><footer>"
    + esc(rt("keptSource")) + "</footer></main><script>const PACKS=" + json + ";function show(code){const pack=PACKS[code]||PACKS.en;document.documentElement.lang=code;document.documentElement.dir=pack.dir;document.title=pack.title;"
    + "document.querySelector('h1').textContent=pack.title;const doc=document.getElementById('doc');doc.innerHTML=pack.blocks.map(function(b){return '<section id=\"'+b.id+'\"><h2>'+b.title.replace(/</g,'')+'</h2>'+b.html+'</section>';}).join('');"
    + "document.querySelector('nav ol').innerHTML=pack.blocks.map(function(b){return '<li><a href=\"#'+b.id+'\">'+b.title.replace(/</g,'')+'</a></li>';}).join('');}"
    + "document.getElementById('rl').addEventListener('change',function(){show(this.value);});document.getElementById('pr').addEventListener('click',function(){print();});</script>"
    + "</body></html>";
}

function reportFileBase(data) {
  return ["trend", data.a.id, data.b.id, data.variable, reportLang].join("-");
}

function openReportPrint(html, name) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    saveText(html, name, "text/html");
    return false;
  }
  setTimeout(() => {
    try { win.focus(); win.print(); } catch (error) {}
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }, 400);
  return true;
}

function reportRtf(lines) {
  const encoded = lines.map((line) => {
    let out = "";
    for (const ch of line) {
      const code = ch.codePointAt(0);
      if (ch === "\\" || ch === "{" || ch === "}") out += "\\" + ch;
      else if (code < 128) out += ch;
      else if (code <= 65535) out += "\\u" + (code > 32767 ? code - 65536 : code) + "?";
      else {
        const rest = code - 65536;
        const hi = 55296 + (rest >> 10);
        const lo = 56320 + (rest & 1023);
        out += "\\u" + (hi - 65536) + "?\\u" + (lo - 65536) + "?";
      }
    }
    return out + "\\par";
  }).join("\n");
  return "{\\rtf1\\ansi\\uc1\\deff0{\\fonttbl{\\f0 Segoe UI;}}\\f0\\fs24\n" + encoded + "}";
}

function reportSvg(data) {
  const lines = reportLines(data).flatMap((line) => {
    const chunks = [];
    let rest = String(line);
    while (rest.length > 90) {
      chunks.push(rest.slice(0, 90));
      rest = rest.slice(90);
    }
    chunks.push(rest);
    return chunks;
  });
  const width = 1100;
  const text = lines.map((line, index) => {
    const safe = line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return "<text x=\"48\" y=\"" + (64 + index * 28) + "\" fill=\"#f4f7fb\" font-size=\"18\" font-family=\"Segoe UI, Nirmala UI, sans-serif\">" + safe + "</text>";
  }).join("");
  const chartTop = 80 + lines.length * 28;
  const height = chartTop + 220;
  const spark = (values, color, y) => {
    if (!values.length) return "";
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const points = values.map((value, index) => {
      const x = 48 + (values.length === 1 ? 0 : (index / (values.length - 1)) * 1000);
      const py = y + 80 - ((value - min) / span) * 70;
      return x.toFixed(1) + "," + py.toFixed(1);
    }).join(" ");
    return "<polyline fill=\"none\" stroke=\"" + color + "\" stroke-width=\"3\" points=\"" + points + "\"/>";
  };
  return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
    + "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"" + width + "\" height=\"" + height + "\" viewBox=\"0 0 " + width + " " + height + "\">"
    + "<rect width=\"100%\" height=\"100%\" fill=\"#121a27\"/>"
    + text
    + spark(data.a.values, "#f3b4c8", chartTop)
    + spark(data.b.values, "#8fd4f5", chartTop + 90)
    + "</svg>";
}

function wrapCanvas(ctx, text, maxWidth) {
  const words = String(text).split(" ");
  const lines = [];
  let line = "";
  const pushWord = (word) => {
    if (ctx.measureText(word).width <= maxWidth) return [word];
    const chunks = [];
    let chunk = "";
    for (const ch of word) {
      if (ctx.measureText(chunk + ch).width > maxWidth && chunk) {
        chunks.push(chunk);
        chunk = ch;
      } else {
        chunk += ch;
      }
    }
    if (chunk) chunks.push(chunk);
    return chunks;
  };
  words.forEach((word) => {
    pushWord(word).forEach((part) => {
      const next = line ? line + " " + part : part;
      if (ctx.measureText(next).width > maxWidth && line) {
        lines.push(line);
        line = part;
      } else {
        line = next;
      }
    });
  });
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function reportCanvas(data) {
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 1800;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#121a27";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f4f7fb";
  ctx.font = "28px Segoe UI, Nirmala UI, sans-serif";
  ctx.textBaseline = "top";
  const wrapped = [];
  reportLines(data).forEach((line) => wrapped.push(...wrapCanvas(ctx, line, 1300)));
  let y = 48;
  wrapped.forEach((line) => {
    ctx.fillText(line, 48, y);
    y += 40;
  });
  const values = data.a.values.concat(data.b.values);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const draw = (series, color, top) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    series.forEach((value, index) => {
      const x = 48 + (series.length === 1 ? 0 : (index / (series.length - 1)) * 1280);
      const py = top + 120 - ((value - min) / (max - min || 1)) * 100;
      if (index === 0) ctx.moveTo(x, py);
      else ctx.lineTo(x, py);
    });
    ctx.stroke();
  };
  const chartTop = y + 24;
  draw(data.a.values, "#f3b4c8", chartTop);
  draw(data.b.values, "#8fd4f5", chartTop + 140);
  ctx.fillStyle = "#f3b4c8";
  ctx.font = "22px Segoe UI, Nirmala UI, sans-serif";
  ctx.fillText(data.a.name, 48, chartTop + 128);
  ctx.fillStyle = "#8fd4f5";
  ctx.fillText(data.b.name, 48, chartTop + 268);
  const used = chartTop + 320;
  const cut = document.createElement("canvas");
  cut.width = canvas.width;
  cut.height = used;
  cut.getContext("2d").drawImage(canvas, 0, 0);
  return cut;
}

function downloadReport(format) {
  if (!latest) {
    $("status").textContent = t("errorTitle");
    $("status").className = "status error";
    return;
  }
  const base = reportFileBase(latest);
  if (format === "csv") {
    downloadCsv();
    return "csv";
  }
  if (format === "json") {
    const copy = Object.assign({ role: currentRole(), language: reportLang, narrative: reportLines(latest) }, latest);
    saveText(JSON.stringify(copy, null, 2), base + ".json", "application/json");
    return "file";
  }
  if (format === "txt") {
    saveText(reportLines(latest).join("\n\n"), base + ".txt", "text/plain");
    return "file";
  }
  if (format === "md") {
    saveText(reportLines(latest).map((line) => line ? line : "").join("\n\n"), base + ".md", "text/markdown");
    return "file";
  }
  if (format === "html") {
    saveText(reportHtml(latest), base + ".html", "text/html");
    return "file";
  }
  if (format === "pdf") {
    const html = reportHtml(latest);
    return openReportPrint(html, base + ".html") ? "pdf" : "popup";
  }
  if (format === "rtf") {
    saveText(reportRtf(reportLines(latest)), base + ".rtf", "application/rtf");
    return "file";
  }
  if (format === "svg") {
    saveText(reportSvg(latest), base + ".svg", "image/svg+xml");
    return "file";
  }
  const type = format === "jpeg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png";
  reportCanvas(latest).toBlob((blob) => {
    if (!blob) {
      $("status").textContent = t("errorTitle");
      $("status").className = "status error";
      return;
    }
    saveBlob(blob, base + "." + (format === "jpeg" ? "jpg" : format));
  }, type, 0.92);
  return "file";
}

async function copyAnswer() {
  if (!latest) return;
  const data = latest;
  const isGeneral = currentRole() === "general";
  const season = (t("seasons") && t("seasons")[data.season]) || data.season;
  const measure = (t("vars") && t("vars")[data.variable]) || data.variable;
  const mode = data.a.provenance.mode === "live" ? t("modeLive") : t("modeSaved");
  const text = [
    isGeneral ? plainPairLead(data) : pairSentence(data),
    data.a.name + " · " + data.b.name + ", " + data.a.country,
    measure + " · " + season + " · " + data.start_year + "–" + data.end_year,
    isGeneral ? plainCitySummary(data.a, data) : ownSlope(data, "a"),
    isGeneral ? plainCitySummary(data.b, data) : ownSlope(data, "b"),
    "NASA POWER · " + mode,
    t("evLimit"),
  ].join("\n");
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
  $("copy-answer").textContent = t("copied");
  setTimeout(() => { $("copy-answer").textContent = t("copyAnswer"); }, 1200);
}

$("lang").addEventListener("change", () => setLang($("lang").value));
$("pair").addEventListener("change", () => {
  preferLinesCountry();
  paintHomeChrome();
  load(false);
});
["variable", "season", "from-year", "to-year"].forEach((id) => {
  $(id).addEventListener("change", () => load(false));
});
VIEWS.forEach((id) => {
  $("view-" + id).addEventListener("click", () => {
    if (id === "events") openEventsPage();
    else setView(id);
  });
});
if ($("nav-more-toggle")) {
  $("nav-more-toggle").addEventListener("click", () => {
    const items = $("nav-more-items");
    if (!items) return;
    const willOpen = items.hidden;
    items.hidden = !willOpen;
    $("nav-more-toggle").setAttribute("aria-expanded", willOpen ? "true" : "false");
  });
}
$("go-trends").addEventListener("click", () => setView("trends"));
$("go-health").addEventListener("click", () => setView("health"));
$("go-plans").addEventListener("click", () => setView("plans"));
$("go-events").addEventListener("click", () => openEventsPage());
$("controls").addEventListener("submit", (event) => {
  event.preventDefault();
  load(false);
});
$("refresh").addEventListener("click", () => load(true));
$("role").addEventListener("change", () => {
  if (latest) render(latest);
  if (boardCache.rows) renderBoard(boardCache.rows);
  if (relateCache.payload) renderRelate();
  if (hazardCache) renderHazards();
  paintHomeChrome();
  paintReportDialog();
});
$("copy-answer").addEventListener("click", () => copyAnswer());
$("download-toggle").addEventListener("click", () => {
  const panel = $("download-panel");
  if (!reportLangPinned && ["en", "bn", "hi", "ar", "id", "yo"].includes(lang)) reportLang = lang;
  panel.hidden = !panel.hidden;
  $("download-toggle").setAttribute("aria-expanded", panel.hidden ? "false" : "true");
  paintReportDialog();
});
$("report-close").addEventListener("click", () => {
  $("download-panel").hidden = true;
  $("download-toggle").setAttribute("aria-expanded", "false");
});
$("report-go").addEventListener("click", () => {
  const ui = (REPORT_UI[lang] || REPORT_UI.en);
  if (!latest) {
    $("report-status").textContent = ui.need;
    $("report-status").className = "status error";
    return;
  }
  $("report-status").textContent = "";
  $("report-status").className = "status";
  const result = downloadReport(reportFormat);
  if (result === "pdf") $("report-status").textContent = ui.pdfOpened;
  else if (result === "popup") $("report-status").textContent = ui.popup;
  else if (result === "file") $("report-status").textContent = ui.saved;
});
document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    openPalette();
    return;
  }
  if (event.key === "Escape") {
    $("download-panel").hidden = true;
    $("download-toggle").setAttribute("aria-expanded", "false");
    closePalette();
    document.body.classList.remove("nav-open");
    if ($("nav-backdrop")) $("nav-backdrop").hidden = true;
    return;
  }
  if (!$("palette").hidden) return;
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.target.closest("input, select, textarea")) return;
  const next = { 1: "result", 2: "map", 3: "trends", 4: "health", 5: "plans", 6: "method" }[event.key];
  if (next) setView(next);
});
$("full-record").addEventListener("click", () => {
  $("from-year").value = "2004";
  $("to-year").value = "2024";
  paintHomeChrome();
  load(false);
});

const LESSONS = [
  { id: "power", org: "NASA POWER", title: "Data Access Viewer walkthrough", why: "whyPower", youtube: "RTen__OXyFU", lang: "en" },
  { id: "heat", org: "World Health Organization", title: "Beat the Heat", why: "whyHeat", youtube: "N7kYp-TaRVA", lang: "en" },
  { id: "water", org: "NASA ARSET", title: "Earth observations for energy and water", why: "whyWater", youtube: "Wmagqj7_c8w", lang: "en" },
  { id: "bn-quake", org: "Think Bangla", title: "ভূমিকম্প কেন হয়?", why: "whyBnQuake", youtube: "3z5PnwQUr1U", lang: "bn" },
  { id: "bn-flood", org: "Human Development Media", title: "বন্যার সময় কী করণীয়", why: "whyBnFlood", youtube: "GT9ShGE_qjg", lang: "bn" },
  { id: "hi-quake", org: "NDMA India", title: "Aapda ka samna: earthquake", why: "whyHiQuake", youtube: "1AWN0aCzs88", lang: "hi" },
  { id: "hi-heat", org: "DD News", title: "Heat wave: जोखिम, सुरक्षा और समाधान", why: "whyHiHeat", youtube: "UDGZ64ZMkEI", lang: "hi" },
  { id: "id-flood", org: "BPBD Surabaya", title: "Animasi mitigasi bencana banjir", why: "whyIdFlood", youtube: "jhNIMubIKqU", lang: "id" },
  { id: "ar-quake", org: "Al Jazeera Arabic", title: "خطوات عند وقوع الزلزال", why: "whyArQuake", youtube: "8yrbbwdlHWo", lang: "ar" },
  { id: "ng-flood", org: "TVC News Nigeria", title: "NEMA flood preparedness", why: "whyNgFlood", youtube: "9nyOE5xTj5k", lang: "ng" },
];
let lessonLang = "all";
let replyOpen = "";

function renderWatch(data) {
  const root = $("watch");
  if (!root) return;
  root.hidden = false;
  root.innerHTML = "";
  const title = document.createElement("h2");
  title.textContent = t("watchTitle");
  const body = document.createElement("p");
  const any = data.a.trend.significant || data.b.trend.significant;
  const measure = (t("vars") && t("vars")[data.variable]) || data.variable;
  body.textContent = any ? fill(t("watchSig"), { measure }) : t("watchQuiet");
  const note = document.createElement("p");
  note.className = "hint";
  note.textContent = t("watchNote");
  root.appendChild(title);
  root.appendChild(body);
  root.appendChild(note);
}

function renderLearn() {
  const filters = $("lesson-filters");
  if (filters) {
    filters.innerHTML = "";
    Object.entries(t("lessonLangs") || {}).forEach(([id, label]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ghost";
      button.textContent = label;
      button.setAttribute("aria-pressed", lessonLang === id ? "true" : "false");
      button.addEventListener("click", () => {
        lessonLang = id;
        renderLearn();
      });
      filters.appendChild(button);
    });
  }
  const root = $("learn-list");
  if (!root) return;
  root.innerHTML = "";
  LESSONS.filter((lesson) => lessonLang === "all" || lesson.lang === lessonLang).forEach((lesson) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "health-card learn-card";
    const org = document.createElement("p");
    org.className = "who";
    const langLabel = (t("lessonLangs") && t("lessonLangs")[lesson.lang]) || lesson.lang;
    org.textContent = langLabel + " · " + lesson.org;
    const title = document.createElement("h3");
    title.textContent = lesson.title;
    const why = document.createElement("p");
    why.textContent = t(lesson.why);
    button.appendChild(org);
    button.appendChild(title);
    button.appendChild(why);
    button.addEventListener("click", () => playLesson(lesson.id));
    root.appendChild(button);
  });
}

function playLesson(id) {
  const lesson = LESSONS.find((item) => item.id === id) || LESSONS[0];
  setView("learn");
  const frame = $("player");
  const wrap = $("player-wrap");
  wrap.hidden = false;
  frame.src = "https://www.youtube-nocookie.com/embed/" + lesson.youtube + "?rel=0";
  $("player-caption").textContent = lesson.org + " · " + lesson.title;
  wrap.scrollIntoView({ block: "nearest" });
}

function fillPlaces() {
  const select = $("place");
  if (!select) return;
  if (!select.options.length) {
    PLACES.forEach((place) => {
      const option = document.createElement("option");
      option.value = place.id;
      option.textContent = place.name;
      select.appendChild(option);
    });
    const custom = document.createElement("option");
    custom.value = "custom";
    select.appendChild(custom);
    select.value = "bd";
    applyPlace();
  }
  const custom = select.querySelector('option[value="custom"]');
  if (custom) custom.textContent = t("latitude") + " / " + t("longitude");
  syncFieldCoords();
}

function syncFieldCoords() {
  const custom = $("place").value === "custom";
  $("field-lat-field").hidden = !custom;
  $("field-lon-field").hidden = !custom;
  $("field-lat").required = custom;
  $("field-lon").required = custom;
}

function applyPlace() {
  syncFieldCoords();
  const place = PLACES.find((item) => item.id === $("place").value);
  if (!place) return;
  $("field-lat").value = String(place.lat);
  $("field-lon").value = String(place.lon);
}

function fieldSentence() {
  const who = $("field-who").value;
  if (who === "teacher") return t("fieldTeacher");
  if (who === "health") return t("fieldHealth");
  if (who === "student") return t("fieldStudent");
  return t("fieldFarmer");
}

let fieldLatest = null;

function renderField(data) {
  fieldLatest = data;
  const root = $("field-cards");
  root.innerHTML = "";
  const units = { T2M: "°C", T2M_MAX: "°C", PRECTOTCORR: "mm/day", RH2M: "%" };
  const labels = { T2M: t("fieldMeanTemp"), T2M_MAX: t("fieldDayHigh"), PRECTOTCORR: t("fieldRain"), RH2M: t("fieldHumid") };
  let day = "";
  let days = 0;
  Object.entries(labels).forEach(([key, label]) => {
    const item = (data.parameters || {})[key] || {};
    if (item.latest_day) day = item.latest_day;
    days = Math.max(days, item.days || 0);
    const card = document.createElement("article");
    card.className = "metric";
    const k = document.createElement("p");
    k.className = "k";
    k.textContent = label;
    const v = document.createElement("p");
    v.className = "v";
    v.textContent = item.latest == null ? "—" : String(item.latest);
    const s = document.createElement("p");
    s.className = "s";
    s.textContent = (units[key] || "") + (item.mean == null ? "" : " · " + t("fieldMean") + " " + item.mean);
    card.appendChild(k);
    card.appendChild(v);
    card.appendChild(s);
    root.appendChild(card);
  });
  $("field-read").textContent = fieldSentence() + " " + fill(t("fieldPoint"), {
    lat: data.returned_latitude == null ? data.requested_latitude : Number(data.returned_latitude).toFixed(2),
    lon: data.returned_longitude == null ? data.requested_longitude : Number(data.returned_longitude).toFixed(2),
    day: day || "—",
    days,
  });
}

async function askField(event) {
  event.preventDefault();
  const status = $("field-status");
  const lat = Number($("field-lat").value);
  const lon = Number($("field-lon").value);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    status.textContent = t("fieldFail");
    status.className = "status error";
    return;
  }
  status.className = "status";
  status.textContent = t("fieldWait");
  $("field-go").disabled = true;
  try {
    const params = new URLSearchParams({
      lat: $("field-lat").value,
      lon: $("field-lon").value,
    });
    const response = await fetch("/api/field?" + params.toString());
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.detail || "");
    renderField(payload);
    status.textContent = "";
  } catch (error) {
    status.textContent = t("fieldFail");
    status.className = "status error";
  } finally {
    $("field-go").disabled = false;
  }
}

function renderVoices(rows) {
  const root = $("voice-list");
  root.innerHTML = "";
  const notes = rows || [];
  const tops = notes.filter((note) => !note.parent);
  if (!tops.length) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = t("voiceEmpty");
    root.appendChild(empty);
    return;
  }
  tops.slice().reverse().forEach((note) => {
    root.appendChild(voiceCard(note, false));
    const replies = document.createElement("div");
    replies.className = "replies";
    notes.filter((item) => item.parent === note.id).forEach((item) => {
      replies.appendChild(voiceCard(item, true));
    });
    if (replyOpen === note.id) replies.appendChild(replyForm(note.id));
    root.appendChild(replies);
  });
}

function voiceCard(note, nested) {
  const card = document.createElement("article");
  card.className = nested ? "voice reply" : "voice";
  const who = document.createElement("p");
  who.className = "who";
  const role = (t("voiceRoles") && t("voiceRoles")[note.role]) || note.role;
  const country = note.country ? note.country : t("voiceNoCountry");
  who.textContent = note.name + " · " + country + " · " + role;
  const body = document.createElement("p");
  body.textContent = note.text;
  const when = document.createElement("p");
  when.className = "hint";
  when.textContent = note.at || "";
  card.appendChild(who);
  card.appendChild(body);
  card.appendChild(when);
  if (!nested) {
    const reply = document.createElement("button");
    reply.type = "button";
    reply.className = "ghost";
    reply.textContent = replyOpen === note.id ? t("voiceCancel") : t("voiceReply");
    reply.addEventListener("click", () => {
      replyOpen = replyOpen === note.id ? "" : note.id;
      loadVoices();
    });
    card.appendChild(reply);
  }
  return card;
}

function replyForm(parentId) {
  const form = document.createElement("form");
  form.className = "reply-form";
  const name = document.createElement("input");
  name.name = "name";
  name.maxLength = 40;
  name.placeholder = t("voiceName");
  name.value = $("voice-name").value || "";
  const role = document.createElement("select");
  role.name = "role";
  Object.entries(t("voiceRoles") || {}).forEach(([id, label]) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = label;
    role.appendChild(option);
  });
  role.value = $("voice-role").value || "general";
  const country = document.createElement("select");
  country.name = "country";
  fillVoiceCountries(country, $("voice-country").value || "Bangladesh");
  const other = document.createElement("input");
  other.name = "countryOther";
  other.maxLength = 40;
  other.placeholder = t("voiceCountryOther");
  other.value = $("voice-country-other").value || "";
  other.hidden = country.value !== "other";
  country.addEventListener("change", () => { other.hidden = country.value !== "other"; });
  const text = document.createElement("textarea");
  text.name = "text";
  text.maxLength = 400;
  text.rows = 2;
  text.placeholder = t("voiceText");
  const send = document.createElement("button");
  send.type = "submit";
  send.className = "primary";
  send.textContent = t("voiceReplySend");
  form.appendChild(name);
  form.appendChild(country);
  form.appendChild(other);
  form.appendChild(role);
  form.appendChild(text);
  form.appendChild(send);
  form.addEventListener("submit", (event) => sendVoice(event, parentId));
  return form;
}

async function loadVoices() {
  try {
    const response = await fetch("/api/voices");
    if (!response.ok) return;
    renderVoices(await response.json());
  } catch (error) {
    renderVoices([]);
  }
}

async function sendVoice(event, parent) {
  event.preventDefault();
  const form = event.target;
  const name = parent ? form.querySelector("[name=name]").value : $("voice-name").value;
  const role = parent ? form.querySelector("[name=role]").value : $("voice-role").value;
  const text = parent ? form.querySelector("[name=text]").value : $("voice-text").value;
  const country = chosenCountry(parent ? form : null);
  const error = parent ? null : $("voice-error");
  if (!name.trim() || !text.trim() || !country) {
    if (error) {
      error.hidden = false;
      error.textContent = t("voiceMissing");
    }
    const box = parent ? form.querySelector("[name=text]") : $("voice-text");
    if (box) box.focus();
    return;
  }
  if (error) error.hidden = true;
  const send = parent ? form.querySelector("button[type=submit]") : $("voice-send");
  if (send) send.disabled = true;
  try {
    const response = await fetch("/api/voices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, role, text, country, parent: parent || "" }),
    });
    if (!response.ok) {
      if (error) {
        error.hidden = false;
        error.textContent = t("voiceMissing");
      }
      return;
    }
    if (!parent) $("voice-text").value = "";
    replyOpen = "";
    renderVoices(await response.json());
  } finally {
    if (send) send.disabled = false;
  }
}

function renderReady() {
  $("ready-title").textContent = t("readyTitle");
  $("ready-note").textContent = t("readyNote");
  const root = $("ready-list");
  root.innerHTML = "";
  [
    ["readyQuakeTitle", "readyQuake"],
    ["readyFloodTitle", "readyFlood"],
    ["readyHeatTitle", "readyHeat"],
    ["readyStormTitle", "readyStorm"],
    ["readyFireTitle", "readyFire"],
  ].forEach(([titleKey, bodyKey]) => {
    const card = document.createElement("article");
    card.className = "health-card";
    const title = document.createElement("h3");
    title.textContent = t(titleKey);
    const body = document.createElement("p");
    body.textContent = t(bodyKey);
    card.appendChild(title);
    card.appendChild(body);
    root.appendChild(card);
  });
}

$("place").addEventListener("change", applyPlace);
$("field-lat").addEventListener("input", () => { $("place").value = "custom"; syncFieldCoords(); });
$("field-lon").addEventListener("input", () => { $("place").value = "custom"; syncFieldCoords(); });
$("field-who").addEventListener("change", () => { if (fieldLatest) renderField(fieldLatest); });
$("field-form").addEventListener("submit", askField);
function fillVoiceCountries(select, current) {
  const value = current || select.value || "Bangladesh";
  select.innerHTML = "";
  (typeof PLACES === "undefined" ? [] : PLACES).forEach((place) => {
    const option = document.createElement("option");
    option.value = place.name;
    option.textContent = place.name;
    select.appendChild(option);
  });
  const other = document.createElement("option");
  other.value = "other";
  other.textContent = t("voiceCountryOther");
  select.appendChild(other);
  select.value = [...select.options].some((option) => option.value === value) ? value : "Bangladesh";
}

function syncCountryOther() {
  const show = $("voice-country").value === "other";
  $("voice-country-other-wrap").hidden = !show;
  $("voice-country-other").required = show;
}

function chosenCountry(scope) {
  const select = scope ? scope.querySelector("[name=country]") : $("voice-country");
  const other = scope ? scope.querySelector("[name=countryOther]") : $("voice-country-other");
  if (!select) return "";
  if (select.value === "other") return other ? other.value.trim() : "";
  return select.value;
}

function renderAbout() {
  $("about-title").textContent = t("aboutTitle");
  const lead = $("about-lead");
  if (lead) lead.textContent = t("aboutLead") || "";
  const root = $("about-list");
  if (!root) return;
  root.innerHTML = "";

  const cards = t("aboutCards");
  if (Array.isArray(cards)) {
    cards.forEach((item) => {
      const card = document.createElement("article");
      card.className = "about-card";

      const head = document.createElement("div");
      head.className = "about-card-head";

      const title = document.createElement("h3");
      title.textContent = item.title;
      head.appendChild(title);

      if (item.badge) {
        const badge = document.createElement("span");
        badge.className = "about-badge";
        badge.textContent = item.badge;
        head.appendChild(badge);
      }
      card.appendChild(head);

      if (item.desc) {
        const desc = document.createElement("p");
        desc.className = "about-desc";
        desc.textContent = item.desc;
        card.appendChild(desc);
      }

      if (Array.isArray(item.points) && item.points.length > 0) {
        const ul = document.createElement("ul");
        ul.className = "about-points";
        item.points.forEach((pt) => {
          const li = document.createElement("li");
          const colonIdx = pt.indexOf(":");
          if (colonIdx > 0 && colonIdx < 45) {
            const prefix = pt.slice(0, colonIdx + 1);
            const rest = pt.slice(colonIdx + 1);
            const strong = document.createElement("strong");
            strong.textContent = prefix;
            li.appendChild(strong);
            li.appendChild(document.createTextNode(rest));
          } else {
            li.textContent = pt;
          }
          ul.appendChild(li);
        });
        card.appendChild(ul);
      }

      root.appendChild(card);
    });
  } else {
    [
      ["aboutObjectiveTitle", "aboutObjective"],
      ["aboutUsersTitle", "aboutUsers"],
      ["aboutEffectTitle", "aboutEffect"],
      ["aboutStoreTitle", "aboutStore"],
    ].forEach(([titleKey, bodyKey]) => {
      const card = document.createElement("article");
      card.className = "health-card";
      const title = document.createElement("h3");
      title.textContent = t(titleKey);
      const body = document.createElement("p");
      body.textContent = t(bodyKey);
      card.appendChild(title);
      card.appendChild(body);
      root.appendChild(card);
    });
  }
}

function renderLines() {
  $("lines-title").textContent = t("linesTitle");
  $("lines-note").textContent = t("linesNote");
  $("lbl-lines-pick").textContent = t("linesPick");
  $("lbl-lines-search").textContent = t("linesSearch");
  fillLinesPick();
  $("lines-empty").textContent = t("linesEmpty");
  const root = $("lines-list");
  root.innerHTML = "";
  const rows = typeof HELPLINES === "undefined" ? [] : HELPLINES;
  $("lines-count").textContent = fill(t("linesCount"), { n: String(rows.length) });
  rows.forEach((row) => {
    const card = document.createElement("article");
    card.className = "health-card line-card";
    card.dataset.name = row.name.toLowerCase();
    const title = document.createElement("h3");
    title.textContent = row.name;
    card.appendChild(title);
    const single = row.police.length && !row.ambulance.length && !row.fire.length;
    const parts = [];
    if (single) parts.push([t("linesGeneral"), row.police]);
    else {
      if (row.police.length) parts.push([t("linesPolice"), row.police]);
      if (row.ambulance.length) parts.push([t("linesAmbulance"), row.ambulance]);
      if (row.fire.length) parts.push([t("linesFire"), row.fire]);
    }
    if (row.disaster.length) parts.push([t("linesDisaster"), row.disaster]);
    parts.forEach(([label, codes]) => {
      const line = document.createElement("p");
      const num = document.createElement("bdi");
      num.textContent = codes.join(" or ");
      line.append(label + " ", num);
      card.appendChild(line);
    });
    root.appendChild(card);
  });
  filterLines();
}

function fillLinesPick() {
  const select = $("lines-pick");
  if (!select) return;
  const current = select.value;
  select.innerHTML = "";
  const all = document.createElement("option");
  all.value = "";
  all.textContent = t("linesAll");
  select.appendChild(all);
  const rows = typeof HELPLINES === "undefined" ? [] : HELPLINES;
  rows.forEach((row) => {
    const option = document.createElement("option");
    option.value = row.name;
    option.textContent = row.name;
    select.appendChild(option);
  });
  if ([...select.options].some((option) => option.value === current)) select.value = current;
  preferLinesCountry();
}

let linesPickedByUser = false;

function preferLinesCountry() {
  if (linesPickedByUser) return;
  const pair = currentPair();
  const name = pair && pair.country;
  const select = $("lines-pick");
  if (!select || !name || !select.options.length) return;
  const match = [...select.options].find((option) => option.value.toLowerCase() === String(name).toLowerCase());
  if (!match) return;
  if (select.value !== match.value) {
    select.value = match.value;
    if ($("lines-search")) $("lines-search").value = "";
  }
  filterLines();
}

function filterLines() {
  const query = ($("lines-search").value || "").trim().toLowerCase();
  const picked = ($("lines-pick") && $("lines-pick").value || "").toLowerCase();
  let shown = 0;
  document.querySelectorAll("#lines-list .line-card").forEach((card) => {
    const hit = (!picked || card.dataset.name === picked) && (!query || card.dataset.name.includes(query));
    card.hidden = !hit;
    if (hit) shown += 1;
  });
  $("lines-empty").hidden = shown !== 0;
}

$("voice-country").addEventListener("change", syncCountryOther);
$("lines-search").addEventListener("input", () => {
  linesPickedByUser = true;
  if ($("lines-search").value.trim() && $("lines-pick")) $("lines-pick").value = "";
  filterLines();
});
$("lines-pick").addEventListener("change", () => {
  linesPickedByUser = true;
  if ($("lines-pick").value) $("lines-search").value = "";
  filterLines();
  const shown = document.querySelector("#lines-list .line-card:not([hidden])");
  if (shown && $("lines-pick").value) shown.scrollIntoView({ block: "nearest" });
});
$("voice-form").addEventListener("submit", sendVoice);

let hazardCache = null;
let hazardFilter = "all";
let hazardFocus = "";

function eventsRole() {
  const who = currentRole();
  if (who === "student") return t("eventsRoleStudent");
  if (who === "scientist") return t("eventsRoleScientist");
  return t("eventsRoleGeneral");
}

function openEventsPage(category, title) {
  hazardFilter = category ? hazardGroup(category) : "all";
  hazardFocus = title || "";
  setView("events");
}

function hazardGroup(category) {
  if (category === "earthquakes") return "quakes";
  if (category === "severeStorms" || category === "floods") return "storms";
  if (category === "wildfires") return "fires";
  if (category === "volcanoes") return "volcanoes";
  return "other";
}

function renderHazards() {
  if (!hazardCache) return;
  $("events-role").textContent = eventsRole();
  const filters = $("event-filters");
  filters.innerHTML = "";
  Object.entries(t("eventFilters")).forEach(([id, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ghost";
    button.textContent = label;
    button.setAttribute("aria-pressed", hazardFilter === id ? "true" : "false");
    button.addEventListener("click", () => {
      hazardFilter = id;
      renderHazards();
    });
    filters.appendChild(button);
  });
  const list = $("event-list");
  list.innerHTML = "";
  const rows = (hazardCache.events || []).filter((row) => hazardFilter === "all" || hazardGroup(row.category) === hazardFilter);
  const status = $("events-status");
  status.className = "status";
  const fetched = fill(t("eventsFetched"), { time: hazardCache.fetched_at || "" });
  const partial = (hazardCache.partial || []).filter(Boolean).join(" ");
  status.textContent = partial ? fetched + " " + partial : fetched;
  if (!rows.length) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = t("eventsEmpty");
    list.appendChild(empty);
    hazardFocus = "";
    return;
  }
  const cats = t("eventCats") || {};
  rows.forEach((row) => {
    const card = document.createElement("article");
    card.className = "panel event";
    const who = document.createElement("p");
    who.className = "who";
    who.textContent = (cats[row.category] || row.category) + " · " + row.source;
    const title = document.createElement("h3");
    title.textContent = row.title;
    card.appendChild(who);
    card.appendChild(title);
    if (hazardFocus && row.title === hazardFocus) card.classList.add("event-focus");
    if (row.magnitude != null) {
      const mag = document.createElement("p");
      const number = Number(row.magnitude);
      mag.textContent = row.magnitude_unit === "M"
        ? "M " + number.toFixed(1)
        : String(number) + (row.magnitude_unit ? " " + row.magnitude_unit : "");
      card.appendChild(mag);
    }
    if (row.latitude != null && row.longitude != null) {
      const where = document.createElement("p");
      where.textContent = fill(t("eventsWhere"), {
        lat: row.latitude,
        lon: row.longitude,
        date: row.date || "—",
      });
      card.appendChild(where);
    }
    if (row.source_url) {
      const link = document.createElement("a");
      link.href = row.source_url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = row.source;
      card.appendChild(link);
    }
    list.appendChild(card);
  });
  const focused = list.querySelector(".event-focus");
  if (focused) {
    const main = document.querySelector("main");
    const top = focused.getBoundingClientRect().top - main.getBoundingClientRect().top + main.scrollTop - 12;
    main.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    setTimeout(() => focused.classList.remove("event-focus"), 1800);
  }
  hazardFocus = "";
  renderHomeAlerts();
}

function pickHomeAlerts(rows) {
  const chosen = [];
  const used = new Set();
  const take = (row) => {
    if (!row || used.has(row) || chosen.length >= 5) return;
    used.add(row);
    chosen.push(row);
  };
  const quakes = rows
    .filter((row) => row.magnitude_unit === "M" && row.magnitude != null)
    .slice()
    .sort((a, b) => Number(b.magnitude) - Number(a.magnitude));
  take(quakes[0]);
  ["severeStorms", "floods", "wildfires", "volcanoes", "landslides", "drought", "tempExtremes"].forEach((cat) => {
    take(rows.find((row) => row.category === cat));
  });
  rows.forEach(take);
  return chosen;
}

function shortWhen(value) {
  return value ? String(value).slice(0, 10) : "";
}

function alertChip(row) {
  if (row.magnitude == null) return (t("eventCats") || {})[row.category] || row.category || "·";
  const number = Number(row.magnitude);
  if (row.magnitude_unit === "M") return "M " + number.toFixed(1);
  const unit = row.magnitude_unit ? " " + row.magnitude_unit : "";
  return (number >= 10 ? number.toFixed(0) : number.toFixed(1)) + unit;
}

function renderHomeAlerts() {
  const list = $("home-alert-list");
  const status = $("home-alert-status");
  if (!list || !status || !hazardCache) return;
  list.innerHTML = "";
  status.className = "status";
  status.textContent = "";
  const rows = pickHomeAlerts(hazardCache.events || []);
  if (!rows.length) {
    status.textContent = t("eventsEmpty");
    return;
  }
  const cats = t("eventCats") || {};
  rows.forEach((row) => {
    const card = document.createElement("article");
    card.className = "alert-row";
    card.dataset.kind = row.category || "";
    const chip = document.createElement("p");
    chip.className = "alert-chip";
    chip.textContent = alertChip(row);
    const body = document.createElement("div");
    const who = document.createElement("p");
    who.className = "who";
    const kind = cats[row.category] || row.category || "";
    const source = row.source || "";
    const day = shortWhen(row.date);
    who.textContent = [kind, source, day].filter(Boolean).join(" · ");
    const title = document.createElement("h3");
    title.textContent = row.title || "";
    body.appendChild(who);
    body.appendChild(title);
    card.appendChild(chip);
    card.appendChild(body);
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    const openEvents = () => openEventsPage(row.category, row.title);
    card.addEventListener("click", openEvents);
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openEvents();
    });
    list.appendChild(card);
  });
}

const HOME_COPY = {
  en: { zone: "Dhaka · Bangladesh · UTC+6", nasaSaved: "Saved NASA file. Read at {time}.", nasaLive: "NASA file fetched at {time}.", nasaNone: "NASA file time is not in this check.", glance: "Environmental trend snapshot", glanceNote: "Four NASA POWER measures for the selected city and observation period. A rise is not automatically better.", vs: "{year}: {va} {unit}", quick: "Quick investigation", start: "Start investigation", recent: "Saved checks", recentEmpty: "No saved check yet.", wait: "Waiting for this measure.", explore: "Explore trend", feature: "Featured finding", featureEmpty: "Load a check to see a finding.", featureOpen: "Open the full result", slopeTip: "Per decade is the Theil-Sen slope. Significant means the Mann-Kendall p-value is below 0.05. Rising or falling is a direction, not a judgement.", singleYear: "Single-year observation", singleYearTip: "Single year observation. Trend slope requires multiple years of data.", noTrendSingle: "No trend for single year", unavailableData: "Data unavailable for this selection" },
  bn: { zone: "ঢাকা · বাংলাদেশ · UTC+6", nasaSaved: "সেভ করা NASA ফাইল। পড়া হয়েছে {time}।", nasaLive: "NASA ফাইল আনা হয়েছে {time}।", nasaNone: "এই যাচাইয়ে NASA ফাইলের সময় নেই।", glance: "পরিবেশের ধারার সারাংশ", glanceNote: "নির্বাচিত শহর ও পর্যবেক্ষণ সময়ের চারটি NASA POWER মাপ। বৃদ্ধি মানেই ভালো নয়।", vs: "{year}: {va} {unit}", quick: "দ্রুত যাচাই", start: "যাচাই শুরু", recent: "সেভ করা যাচাই", recentEmpty: "এখনো সেভ করা যাচাই নেই।", wait: "এই মাপের জন্য অপেক্ষা।", explore: "ধারা দেখুন", feature: "মূল ফলাফল", featureEmpty: "ফলাফল দেখতে একটি যাচাই লোড করুন।", featureOpen: "পুরো ফলাফল খুলুন", slopeTip: "প্রতি দশক Theil-Sen ঢাল। Significant মানে Mann-Kendall p 0.05-এর নিচে। বাড়া বা কমা একটি দিক, ভালো-মন্দ নয়।", singleYear: "এক বছরের পর্যবেক্ষণ", singleYearTip: "এক বছরের পর্যবেক্ষণ। ধারার ঢালের জন্য একাধিক বছরের উপাত্ত প্রয়োজন।", noTrendSingle: "এক বছরের জন্য ধারা প্রযোজ্য নয়", unavailableData: "এই নির্বাচনের জন্য উপাত্ত পাওয়া যায়নি" },
  hi: { zone: "ढाका · बांग्लादेश · UTC+6", nasaSaved: "सहेजी NASA फ़ाइल। पढ़ी गई {time}।", nasaLive: "NASA फ़ाइल आई {time}।", nasaNone: "इस जाँच में NASA फ़ाइल का समय नहीं है।", glance: "पर्यावरण रुझान का सार", glanceNote: "चयनित शहर और अवलोकन अवधि के लिए चार NASA POWER माप। बढ़ना अपने आप अच्छा नहीं।", vs: "{year}: {va} {unit}", quick: "त्वरित जाँच", start: "जाँच शुरू करें", recent: "सहेजी जाँच", recentEmpty: "अभी कोई सहेजी जाँच नहीं।", wait: "इस माप की प्रतीक्षा।", explore: "रुझान देखें", feature: "मुख्य निष्कर्ष", featureEmpty: "निष्कर्ष के लिए एक जाँच लोड करें।", featureOpen: "पूरा परिणाम खोलें", slopeTip: "प्रति दशक Theil-Sen ढलान है। Significant का अर्थ Mann-Kendall p 0.05 से कम। बढ़ना या घटना दिशा है, फ़ैसला नहीं।", singleYear: "एकल-वर्षीय अवलोकन", singleYearTip: "एकल वर्ष का अवलोकन। रुझान ढलान के लिए कई वर्षों के डेटा की आवश्यकता होती है।", noTrendSingle: "एकल वर्ष के लिए कोई रुझान नहीं", unavailableData: "इस चयन के लिए डेटा उपलब्ध नहीं है" },
  id: { zone: "Dhaka · Bangladesh · UTC+6", nasaSaved: "Berkas NASA tersimpan. Dibaca {time}.", nasaLive: "Berkas NASA diambil {time}.", nasaNone: "Waktu berkas NASA tidak ada pada pemeriksaan ini.", glance: "Cuplikan tren lingkungan", glanceNote: "Empat ukuran NASA POWER untuk kota dan periode pengamatan yang dipilih. Kenaikan tidak otomatis lebih baik.", vs: "{year}: {va} {unit}", quick: "Penyelidikan cepat", start: "Mulai penyelidikan", recent: "Pemeriksaan tersimpan", recentEmpty: "Belum ada pemeriksaan tersimpan.", wait: "Menunggu ukuran ini.", explore: "Lihat tren", feature: "Temuan utama", featureEmpty: "Muat pemeriksaan untuk melihat temuan.", featureOpen: "Buka hasil lengkap", slopeTip: "Per dekade adalah kemiringan Theil-Sen. Signifikan berarti p Mann-Kendall di bawah 0.05. Naik atau turun adalah arah, bukan penilaian.", singleYear: "Pengamatan satu tahun", singleYearTip: "Pengamatan satu tahun. Kemiringan tren membutuhkan data beberapa tahun.", noTrendSingle: "Tidak ada tren untuk satu tahun", unavailableData: "Data tidak tersedia untuk pilihan ini" },
  ar: { zone: "دكا · بنغلاديش · UTC+6", nasaSaved: "ملف NASA محفوظ. قُرئ في {time}.", nasaLive: "جُلب ملف NASA في {time}.", nasaNone: "وقت ملف NASA غير موجود في هذا الفحص.", glance: "ملخص الاتجاه البيئي", glanceNote: "أربعة مقاييس NASA POWER للمدينة وفترة الرصد المحددة. الارتفاع ليس أفضل تلقائيًا.", vs: "{year}: {va} {unit}", quick: "تحقيق سريع", start: "ابدأ التحقيق", recent: "فحوصات محفوظة", recentEmpty: "لا فحص محفوظ بعد.", wait: "بانتظار هذا المقياس.", explore: "استكشف الاتجاه", feature: "النتيجة البارزة", featureEmpty: "حمّل فحصًا لرؤية نتيجة.", featureOpen: "افتح النتيجة الكاملة", slopeTip: "في العقد هو ميل Theil-Sen. ذو دلالة يعني أن p لاختبار Mann-Kendall أقل من 0.05. الارتفاع أو الانخفاض اتجاه وليس حكمًا.", singleYear: "رصد لعام واحد", singleYearTip: "رصد لعام واحد. يتطلب ميل الاتجاه بيانات لعدة سنوات.", noTrendSingle: "لا يوجد اتجاه لعام واحد", unavailableData: "البيانات غير متوفرة لهذا التحديد" },
  yo: { zone: "Dhaka · Bangladesh · UTC+6", nasaSaved: "Fáìlì NASA tí a fi pamọ́. A kà á ní {time}.", nasaLive: "A gba fáìlì NASA ní {time}.", nasaNone: "Àkókò fáìlì NASA kò sí nínú àyẹ̀wò yìí.", glance: "Àkópọ̀ ìtọ́sọ́nà àyíká", glanceNote: "Ìwọ̀n NASA POWER mẹ́rin fún ìlú àti àkókò àkíyèsí tí a yàn. Lílọ sókè kì í ṣe rere fúnra rẹ̀.", vs: "{year}: {va} {unit}", quick: "Àyẹ̀wò kíákíá", start: "Bẹ̀rẹ̀ àyẹ̀wò", recent: "Àwọn àyẹ̀wò tí a fi pamọ́", recentEmpty: "Kò sí àyẹ̀wò tí a fi pamọ́ síbẹ̀.", wait: "Ń dúró de ìwọ̀n yìí.", explore: "Ṣàwárí ìtọ́sọ́nà", feature: "Èsì pàtàkì", featureEmpty: "Ṣe àyẹ̀wò kan kí èsì lè hàn.", featureOpen: "Ṣí èsì ní kíkún", slopeTip: "Lọ́dún mẹ́wàá jẹ́ Theil-Sen. Significant túmọ̀ sí p Mann-Kendall lábẹ́ 0.05. Lílọ sókè tàbí sílẹ̀ jẹ́ ìtọ́sọ́nà, kì í ṣe ìdájọ́.", singleYear: "Àkíyèsí ọdún kan", singleYearTip: "Àkíyèsí ọdún kan. Ìtọ́sọ́nà nílò data ọ̀pọ̀ ọdún.", noTrendSingle: "Kò sí ìtọ́sọ́nà fún ọdún kan", unavailableData: "Data kò sí fún àṣàyàn yìí" },
};

function ht(key) {
  const pack = HOME_COPY[lang] || HOME_COPY.en;
  return pack[key] || HOME_COPY.en[key] || "";
}

function applySave(item, openResult) {
  if ([...$("pair").options].some((option) => option.value === item.pair)) $("pair").value = item.pair;
  $("variable").value = item.variable;
  $("season").value = item.season;
  $("from-year").value = item.from;
  $("to-year").value = item.to;
  preferLinesCountry();
  paintHomeChrome();
  if (openResult) setView("result");
  load(false);
}

function copySelect(fromId, toId) {
  const from = $(fromId);
  const to = $(toId);
  if (!from || !to) return;
  const keep = from.value || to.value;
  to.replaceChildren();
  [...from.options].forEach((option) => {
    const next = document.createElement("option");
    next.value = option.value;
    next.textContent = option.textContent;
    to.appendChild(next);
  });
  if ([...to.options].some((option) => option.value === keep)) to.value = keep;
}

const SNAPSHOT_CITIES = [
  { id: "dhaka", pair: "bangladesh", partner: "sylhet", name: "Dhaka", country: "Bangladesh", minYear: 2004, maxYear: 2024 },
  { id: "delhi", pair: "india", partner: "kolkata", name: "Delhi", country: "India", minYear: 2004, maxYear: 2024 },
  { id: "jakarta", pair: "indonesia", partner: "surabaya", name: "Jakarta", country: "Indonesia", minYear: 2004, maxYear: 2024 },
  { id: "cairo", pair: "egypt", partner: "alexandria", name: "Cairo", country: "Egypt", minYear: 2004, maxYear: 2024 },
  { id: "lagos", pair: "nigeria", partner: "abuja", name: "Lagos", country: "Nigeria", minYear: 2004, maxYear: 2024 },
];

let snapshotState = {
  city: "dhaka",
  fromYear: 2004,
  toYear: 2024,
  data: null,
  loading: false,
  error: null,
};
let snapshotToken = 0;
let snapshotControlsBound = false;

function populateSnapshotYears(cityId) {
  const fromSelect = $("snapshot-from");
  const toSelect = $("snapshot-to");
  if (!fromSelect || !toSelect) return;

  const cityInfo = SNAPSHOT_CITIES.find((c) => c.id === cityId) || SNAPSHOT_CITIES[0];
  const minYear = cityInfo.minYear;
  const maxYear = cityInfo.maxYear;

  const prevFrom = Number(fromSelect.value) || snapshotState.fromYear;
  const prevTo = Number(toSelect.value) || snapshotState.toYear;

  fromSelect.replaceChildren();
  toSelect.replaceChildren();

  for (let year = minYear; year <= maxYear; year += 1) {
    const optFrom = document.createElement("option");
    optFrom.value = String(year);
    optFrom.textContent = String(year);
    fromSelect.appendChild(optFrom);

    const optTo = document.createElement("option");
    optTo.value = String(year);
    optTo.textContent = String(year);
    toSelect.appendChild(optTo);
  }

  const validFrom = Math.max(minYear, Math.min(maxYear, prevFrom));
  const validTo = Math.max(validFrom, Math.min(maxYear, prevTo));

  fromSelect.value = String(validFrom);
  toSelect.value = String(validTo);

  snapshotState.fromYear = validFrom;
  snapshotState.toYear = validTo;
}

function bindSnapshotControls() {
  if (snapshotControlsBound) return;
  const citySelect = $("snapshot-city");
  const fromSelect = $("snapshot-from");
  const toSelect = $("snapshot-to");
  if (!citySelect || !fromSelect || !toSelect) return;
  snapshotControlsBound = true;

  citySelect.addEventListener("change", () => {
    snapshotState.city = citySelect.value;
    populateSnapshotYears(snapshotState.city);
    loadSnapshot();
  });

  fromSelect.addEventListener("change", () => {
    let from = Number(fromSelect.value);
    let to = Number(toSelect.value);
    if (from > to) {
      to = from;
      toSelect.value = String(to);
    }
    snapshotState.fromYear = from;
    snapshotState.toYear = to;
    loadSnapshot();
  });

  toSelect.addEventListener("change", () => {
    let from = Number(fromSelect.value);
    let to = Number(toSelect.value);
    if (to < from) {
      from = to;
      fromSelect.value = String(from);
    }
    snapshotState.fromYear = from;
    snapshotState.toYear = to;
    loadSnapshot();
  });
}

function paintSnapshotFilters() {
  const citySelect = $("snapshot-city");
  const fromSelect = $("snapshot-from");
  const toSelect = $("snapshot-to");
  if (!citySelect || !fromSelect || !toSelect) return;

  if ($("lbl-snapshot-city")) $("lbl-snapshot-city").textContent = t("snapshotCity") || t("city") || "City";
  if ($("lbl-snapshot-from")) $("lbl-snapshot-from").textContent = t("from");
  if ($("lbl-snapshot-to")) $("lbl-snapshot-to").textContent = t("to");

  const curCity = snapshotState.city;
  citySelect.replaceChildren();
  SNAPSHOT_CITIES.forEach((item) => {
    const opt = document.createElement("option");
    opt.value = item.id;
    const localized = (t("snapshotCities") && t("snapshotCities")[item.id]) || (item.name + " (" + item.country + ")");
    opt.textContent = localized;
    citySelect.appendChild(opt);
  });
  if ([...citySelect.options].some((o) => o.value === curCity)) {
    citySelect.value = curCity;
  } else {
    citySelect.value = "dhaka";
    snapshotState.city = "dhaka";
  }

  if (!fromSelect.options.length || !toSelect.options.length) {
    populateSnapshotYears(snapshotState.city);
  } else {
    fromSelect.value = String(snapshotState.fromYear);
    toSelect.value = String(snapshotState.toYear);
  }

  bindSnapshotControls();
}

async function loadSnapshot() {
  const token = ++snapshotToken;
  const cityId = snapshotState.city;
  const fromYear = Number(snapshotState.fromYear);
  const toYear = Number(snapshotState.toYear);
  const cityInfo = SNAPSHOT_CITIES.find((c) => c.id === cityId) || SNAPSHOT_CITIES[0];

  snapshotState.loading = true;
  snapshotState.error = null;
  renderGlance();

  try {
    const rows = await Promise.all(MEASURES.map(async (variable) => {
      const params = new URLSearchParams({
        city_a: cityInfo.id,
        city_b: cityInfo.partner,
        variable,
        season: "ALL",
        start_year: String(fromYear),
        end_year: String(toYear),
      });
      const response = await fetch("/api/compare?" + params.toString());
      if (!response.ok) return null;
      return response.json();
    }));

    if (token !== snapshotToken) return;
    const ready = rows.filter(Boolean);
    if (!ready.length) {
      snapshotState.error = true;
      snapshotState.data = null;
    } else {
      const byVar = {};
      ready.forEach((row) => { byVar[row.variable] = row; });
      snapshotState.data = byVar;
    }
  } catch (err) {
    if (token !== snapshotToken) return;
    snapshotState.error = true;
    snapshotState.data = null;
  } finally {
    if (token === snapshotToken) {
      snapshotState.loading = false;
      renderGlance();
    }
  }
}

async function openSnapshotTrend(cityId, variable, startYear, endYear) {
  const cityInfo = SNAPSHOT_CITIES.find((c) => c.id === cityId) || SNAPSHOT_CITIES[0];
  const pair = pairs.find((p) => p.id === cityInfo.pair || p.a.id === cityId || p.b.id === cityId) || pairs[0];
  if (pair && $("pair")) $("pair").value = pair.id;
  if ($("variable")) $("variable").value = variable;
  if (startYear <= endYear) {
    if ($("from-year")) $("from-year").value = String(startYear);
    if ($("to-year")) $("to-year").value = String(endYear);
  }
  preferLinesCountry();
  paintHomeChrome();
  setView("trends");
  await load(false);
}

function paintHomeChrome() {
  if (!$("home-glance-title")) return;
  $("home-glance-title").textContent = ht("glance");
  $("home-glance-note").textContent = ht("glanceNote");
  $("home-quick-title").textContent = ht("quick");
  $("home-start").textContent = ht("start");
  $("home-recent-title").textContent = ht("recent");
  $("home-pair-label").textContent = t("country");
  $("home-var-label").textContent = t("variable");
  $("home-from-label").textContent = t("from");
  $("home-to-label").textContent = t("to");
  $("home-zone").textContent = ht("zone");
  copySelect("pair", "home-pair");
  copySelect("variable", "home-var");
  copySelect("from-year", "home-from");
  copySelect("to-year", "home-to");
  paintSnapshotFilters();
  paintHomeRecent();
  paintClock();
  renderFeature();
  renderGlance();
}

function dhakaHour(now) {
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka", hour: "2-digit", hourCycle: "h23",
  }).format(now);
  return Number(hour);
}

function paintClock() {
  const time = $("home-time");
  const date = $("home-date");
  if (!time || !date) return;
  const now = new Date();
  const hour = dhakaHour(now);
  const greet = $("home-greet");
  if (greet) {
    const key = hour < 5 || hour >= 17 ? "greetEvening" : hour < 12 ? "greetMorning" : "greetAfternoon";
    greet.textContent = t(key);
  }
  const locale = { en: "en-GB", bn: "bn-BD", hi: "hi-IN", id: "id-ID", ar: "ar-EG", yo: "yo-NG" }[lang] || "en-GB";
  time.textContent = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).format(now);
  date.textContent = new Intl.DateTimeFormat(locale, {
    timeZone: "Asia/Dhaka", weekday: "long", year: "numeric", month: "long", day: "numeric",
  }).format(now);
}

function paintNasaLine() {
  const node = $("home-nasa");
  if (!node || !latest) return;
  const fetched = latest.a.provenance && latest.a.provenance.fetched_at;
  const read = latest.generated_at;
  if (latest.a.provenance && latest.a.provenance.mode === "live" && fetched) {
    node.textContent = fill(ht("nasaLive"), { time: fetched });
  } else if (fetched || read) {
    node.textContent = fill(ht("nasaSaved"), { time: fetched || read });
  } else {
    node.textContent = ht("nasaNone");
  }
}

function edgeYears(point) {
  const years = point.years || [];
  const values = point.values || [];
  let last = null;
  let prev = null;
  for (let i = years.length - 1; i >= 0; i -= 1) {
    if (values[i] == null || !Number.isFinite(Number(values[i]))) continue;
    if (!last) last = { year: years[i], value: Number(values[i]) };
    else { prev = { year: years[i], value: Number(values[i]) }; break; }
  }
  return { last, prev };
}

function seriesExtent(points) {
  let min = Infinity;
  let max = -Infinity;
  points.forEach((point) => {
    (point.values || []).forEach((raw) => {
      const value = Number(raw);
      if (!Number.isFinite(value)) return;
      min = Math.min(min, value);
      max = Math.max(max, value);
    });
  });
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  return { min, max };
}

function addSpark(svg, point, color, extent) {
  const values = point.values || [];
  if (values.length < 2 || !extent) return;
  const span = (extent.max - extent.min) || 1;
  let d = "";
  let drawing = false;
  values.forEach((raw, index) => {
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      drawing = false;
      return;
    }
    const x = (index / (values.length - 1)) * 120;
    const y = 2 + (1 - (value - extent.min) / span) * 28;
    d += (drawing ? "L" : "M") + x.toFixed(1) + "," + y.toFixed(1);
    drawing = true;
  });
  if (!d) return;
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", color);
  path.setAttribute("stroke-width", "1.8");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("stroke-linecap", "round");
  svg.appendChild(path);
}

function trendBit(point, isSingleYear) {
  const span = document.createElement("span");
  if (isSingleYear) {
    span.className = "no";
    span.textContent = point.name + " · " + (ht("singleYear") || "Single-year observation");
    return span;
  }
  const known = point && point.trend && point.slope && Number.isFinite(Number(point.slope.per_decade));
  if (!known) {
    span.className = "no";
    span.textContent = point.name + " · " + ht("wait");
    return span;
  }
  const isGeneral = currentRole() === "general";
  span.className = point.trend.significant ? "yes" : "no";
  const dir = (t("dir") && t("dir")[point.trend.direction]) || "";
  const badge = point.trend.significant
    ? (isGeneral ? t("trendBadgeConfirmed") : t("sigYes"))
    : (isGeneral ? t("trendBadgeUnconfirmed") : t("sigNo"));
  span.textContent = point.name + " " + dir + " · " + badge;
  span.title = ht("slopeTip");
  return span;
}

function renderGlance() {
  const root = $("home-glance");
  if (!root) return;
  root.replaceChildren();

  const isSingleYear = Number(snapshotState.fromYear) === Number(snapshotState.toYear);

  MEASURES.forEach((variable) => {
    const card = document.createElement("article");
    card.className = "snap";

    const name = document.createElement("span");
    name.className = "k";
    name.textContent = (t("vars") && t("vars")[variable]) || variable;
    card.appendChild(name);

    if (snapshotState.loading) {
      const wait = document.createElement("p");
      wait.className = "snap-wait";
      wait.textContent = ht("wait");
      card.appendChild(wait);
      root.appendChild(card);
      return;
    }

    const row = snapshotState.data ? snapshotState.data[variable] : null;
    const point = row ? row.a : null;

    if (!row || !point || snapshotState.error) {
      const wait = document.createElement("p");
      wait.className = "snap-wait";
      wait.textContent = ht("unavailableData") || t("unavailableData") || "Data unavailable for this selection";
      card.appendChild(wait);
      root.appendChild(card);
      return;
    }

    const edge = edgeYears(point);
    if (!edge.last) {
      const wait = document.createElement("p");
      wait.className = "snap-wait";
      wait.textContent = ht("wait");
      card.appendChild(wait);
      root.appendChild(card);
      return;
    }

    const period = document.createElement("p");
    period.className = "snap-period";
    period.textContent = isSingleYear ? String(snapshotState.fromYear) : (String(row.start_year) + "–" + String(row.end_year));

    const level = document.createElement("p");
    level.className = "snap-level";
    level.textContent = String(edge.last.year) + ": " + edge.last.value.toFixed(2) + " " + row.unit;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 120 32");
    svg.setAttribute("class", "spark");
    svg.setAttribute("aria-hidden", "true");
    if (!isSingleYear && point.values && point.values.length >= 2) {
      const extent = seriesExtent([point]);
      addSpark(svg, point, "#8fd4f5", extent);
    }

    const legend = document.createElement("p");
    legend.className = "snap-legend";
    const legendA = document.createElement("span");
    legendA.className = "b";
    legendA.textContent = point.name;
    legend.appendChild(legendA);

    const slope = document.createElement("p");
    slope.className = "snap-slope";
    const per = document.createElement("p");
    per.className = "snap-per";

    const status = document.createElement("p");
    status.className = "snap-status";

    if (isSingleYear) {
      slope.textContent = ht("singleYear") || t("singleYear") || "Single-year observation";
      slope.title = ht("singleYearTip") || t("singleYearTip") || "";
      per.textContent = "";

      const span = document.createElement("span");
      span.className = "no";
      span.textContent = ht("noTrendSingle") || t("noTrendSingle") || "No trend for single year";
      status.appendChild(span);
    } else {
      const hasSlope = point.slope && Number.isFinite(Number(point.slope.per_decade));
      if (hasSlope) {
        slope.textContent = formatNum(point.slope.per_decade) + " " + row.unit;
        slope.title = ht("slopeTip");
        per.textContent = t("perDecade");
      } else {
        slope.textContent = "—";
        per.textContent = "";
      }

      const hasTrend = point.trend && point.trend.direction;
      if (hasTrend) {
        const isGeneral = currentRole() === "general";
        const span = document.createElement("span");
        span.className = point.trend.significant ? "yes" : "no";
        const dir = (t("dir") && t("dir")[point.trend.direction]) || point.trend.direction;
        const badge = point.trend.significant
          ? (isGeneral ? t("trendBadgeConfirmed") : t("sigYes"))
          : (isGeneral ? t("trendBadgeUnconfirmed") : t("sigNo"));
        span.textContent = dir + " · " + badge;
        span.title = ht("slopeTip");
        status.appendChild(span);
      } else {
        const span = document.createElement("span");
        span.className = "no";
        span.textContent = ht("wait");
        status.appendChild(span);
      }
    }

    const go = document.createElement("button");
    go.type = "button";
    go.className = "ghost";
    go.textContent = ht("explore");
    go.addEventListener("click", () => openSnapshotTrend(snapshotState.city, variable, snapshotState.fromYear, snapshotState.toYear));

    card.append(period, level, svg, legend, slope, per, status, go);
    root.appendChild(card);
  });
}

function renderFeature() {
  const title = $("home-feature-title");
  const root = $("home-feature-body");
  if (!title || !root) return;
  title.textContent = ht("feature");
  root.replaceChildren();
  if (!latest || !latest.a || !latest.a.trend || !latest.a.slope) {
    const note = document.createElement("p");
    note.className = "hint";
    note.textContent = ht("featureEmpty");
    root.appendChild(note);
    return;
  }
  const isSingleYear = Number(latest.start_year) === Number(latest.end_year);
  const line = document.createElement("p");
  line.className = "feature-line";
  line.textContent = currentRole() === "general" ? plainPairLead(latest) : pairSentence(latest);
  const meta = document.createElement("p");
  meta.className = "hint";
  const measure = (t("vars") && t("vars")[latest.variable]) || latest.variable;
  meta.textContent = latest.a.name + " · " + latest.b.name + " · " + measure
    + " · " + (isSingleYear ? String(latest.start_year) : (latest.start_year + "–" + latest.end_year));
  const slope = document.createElement("p");
  slope.className = "snap-slope";
  slope.title = isSingleYear ? (ht("singleYearTip") || "") : ht("slopeTip");
  slope.textContent = isSingleYear
    ? latest.a.name + " " + mean(latest.a.values) + " " + latest.unit
      + " · " + latest.b.name + " " + mean(latest.b.values) + " " + latest.unit
    : latest.a.name + " " + formatNum(latest.a.slope.per_decade)
      + " · " + latest.b.name + " " + formatNum(latest.b.slope.per_decade)
      + " " + latest.unit + " · " + t("perDecade").toLowerCase();
  const status = document.createElement("p");
  status.className = "snap-status";
  status.append(trendBit(latest.a, isSingleYear), trendBit(latest.b, isSingleYear));
  const go = document.createElement("button");
  go.type = "button";
  go.className = "primary";
  go.textContent = ht("featureOpen");
  go.addEventListener("click", () => setView("result"));
  root.append(line, meta, slope, status, go);
}

const RELATE_COPY = {
  en: { homeTitle: "Temperature and rainfall", note: "One NASA POWER point. The same years and the same 80% day rule as the trend test. A link is not a cause.", point: "City point", pearson: "Pearson", spearman: "Spearman", pairs: "paired years", little: "Little or no observed association", weak: "Weak", moderate: "Moderate", strong: "Strong", positive: "positive", negative: "negative", sig: "Significant", nosig: "Not significant", family: "These two are parts of one temperature record. A strong link is expected.", auto: "The p-value treats each year as independent. Climate years are usually related, so this p-value can look too small.", cause: "This is not evidence that one measure caused the other.", howTitle: "How this was calculated", how: "A year is kept only when both measures pass the 80% day rule. Pearson r measures a straight-line association. Spearman rho uses ranks. At least 8 paired years are required. Bands at 0.20, 0.40, and 0.70 are a reading convention, not a law.", wait: "Waiting for the paired years.", too_few: "Fewer than 8 paired years. No correlation is shown.", constant: "One measure does not vary, so a correlation is undefined.", uneven: "The two series could not be paired.", open: "Open the correlation", fit: "Linear fit", where: "at", relateStrongPos: "Strong positive relationship: when {varX} is higher in {city}, {varY} strongly tends to be higher as well.", relateModeratePos: "Moderate positive relationship: when {varX} increases in {city}, {varY} generally tends to increase.", relateWeakPosSig: "Slight positive tendency: higher {varX} slightly associates with higher {varY} in {city}.", relateStrongNeg: "Strong negative relationship: when {varX} is higher in {city}, {varY} strongly tends to be lower.", relateModerateNeg: "Moderate negative relationship: when {varX} increases in {city}, {varY} tends to decrease.", relateWeakNegSig: "Slight negative tendency: higher {varX} slightly associates with lower {varY} in {city}.", relateNoClear: "No clear relationship is observed between {varX} and {varY} in {city}. Changes in one do not reliably predict changes in the other.", relateCaution: "Important note: A correlation between two measurements does not mean one causes the other.", explainPearson: "Pearson correlation (r): Measures how closely two variables follow a straight line, from -1 (opposite) to +1 (identical direction).", explainSpearman: "Spearman correlation (rho): Measures whether two variables move together in order, even when their relationship is curved rather than straight.", explainRelateP: "Correlation p-value: The likelihood that this degree of correlation could occur purely by random chance. Values under 0.05 are statistically significant." },
  bn: { homeTitle: "তাপমাত্রা ও বৃষ্টি", note: "একটি NASA POWER বিন্দু। ধারা পরীক্ষার একই বছর ও একই ৮০% দিনের নিয়ম। সম্পর্ক মানে কারণ নয়।", point: "শহরের বিন্দু", pearson: "Pearson", spearman: "Spearman", pairs: "জোড়া বছর", little: "প্রায় কোনো সম্পর্ক দেখা যায় না", weak: "দুর্বল", moderate: "মাঝারি", strong: "শক্তিশালী", positive: "ধনাত্মক", negative: "ঋণাত্মক", sig: "Significant", nosig: "Significant নয়", family: "এ দুটি একই তাপমাত্রার রেকর্ডের অংশ। শক্তিশালী সম্পর্ক প্রত্যাশিত।", auto: "p প্রতিটি বছরকে স্বাধীন ধরে। জলবায়ুর বছর সাধারণত সম্পর্কিত, তাই p ছোট দেখাতে পারে।", cause: "এটি প্রমাণ নয় যে একটি মাপ অন্যটির কারণ।", howTitle: "এটি কীভাবে হিসাব হয়েছে", how: "দুটি মাপই ৮০% দিনের নিয়ম পার করলে তবেই বছর রাখা হয়। Pearson r সরলরৈখিক সম্পর্ক। Spearman rho ক্রম ব্যবহার করে। কমপক্ষে ৮টি জোড়া বছর লাগে। ০.২০, ০.৪০ ও ০.৭০ পড়ার রীতি, আইন নয়।", wait: "জোড়া বছরের জন্য অপেক্ষা।", too_few: "৮টির কম জোড়া বছর। কোনো সম্পর্ক দেখানো হচ্ছে না।", constant: "একটি মাপ বদলায় না, তাই সম্পর্ক অনির্দিষ্ট।", uneven: "দুটি সিরিজ জোড়া হয়নি।", open: "সম্পর্ক খুলুন", fit: "সরলরেখা", where: "এ", relateStrongPos: "দৃঢ় ধনাত্মক সম্পর্ক: {city}-এ যখন {varX} বেশি থাকে, তখন {varY}-ও স্পষ্টভাবে বেশি থাকার প্রবণতা দেখায়।", relateModeratePos: "মাঝারি ধনাত্মক সম্পর্ক: {city}-এ যখন {varX} বৃদ্ধি পায়, তখন {varY}-ও সাধারণত বৃদ্ধি পায়।", relateWeakPosSig: "সামান্য ধনাত্মক প্রবণতা: {city}-এ {varX} বৃদ্ধির সাথে {varY} কিছুটা বৃদ্ধি পাওয়ার সম্পর্ক রয়েছে।", relateStrongNeg: "দৃঢ় ঋণাত্মক সম্পর্ক: {city}-এ যখন {varX} বেশি থাকে, তখন {varY} স্পষ্টভাবে কম থাকার প্রবণতা দেখায়।", relateModerateNeg: "মাঝারি ঋণাত্মক সম্পর্ক: {city}-এ যখন {varX} বৃদ্ধি পায়, তখন {varY} হ্রাস পাওয়ার প্রবণতা দেখায়।", relateWeakNegSig: "সামান্য ঋণাত্মক প্রবণতা: {city}-এ {varX} বৃদ্ধির সাথে {varY} কিছুটা হ্রাস পাওয়ার সম্পর্ক রয়েছে।", relateNoClear: "{city}-এ {varX} এবং {varY}-এর মধ্যে কোনো স্পষ্ট সম্পর্ক দেখা যায় না। একটির পরিবর্তন অন্যটির পরিবর্তনের পূর্বাভাস দেয় না।", relateCaution: "গুরুত্বপূর্ণ বিষয়: দুটি পরিমাপের মধ্যে সম্পর্কের অর্থ এই নয় যে একটি অন্যটির কারণ।", explainPearson: "Pearson সম্পর্ক (r): দুটি মান কতটা সরলরৈখিকভাবে চলে তা মাপে, -১ (বিপরীতমুখী) থেকে +১ (একইমুখী)।", explainSpearman: "Spearman সম্পর্ক (rho): দুটি মান একসাথে ক্রমানুসারে বাড়ে বা কমে কি না তা পরীক্ষা করে, সরলরেখা না হলেও চলে।", explainRelateP: "সম্পর্কের p-মান: কাকতালীয়ভাবে এমন সম্পর্ক পাওয়ার সম্ভাবনা। ০.০৫-এর নিচে হলে সম্পর্কটি তাৎপর্যপূর্ণ ধরা হয়।" },
  hi: { homeTitle: "तापमान और वर्षा", note: "एक NASA POWER बिंदु। रुझान जाँच के वही वर्ष और वही 80% दिन का नियम। संबंध कारण नहीं है।", point: "शहर का बिंदु", pearson: "Pearson", spearman: "Spearman", pairs: "युग्मित वर्ष", little: "लगभग कोई संबंध नहीं", weak: "कमज़ोर", moderate: "मध्यम", strong: "मज़बूत", positive: "धनात्मक", negative: "ऋणात्मक", sig: "Significant", nosig: "Significant नहीं", family: "ये दोनों एक ही तापमान रिकॉर्ड के हिस्से हैं। मज़बूत संबंध अपेक्षित है।", auto: "p हर वर्ष को स्वतंत्र मानता है। जलवायु के वर्ष आमतौर पर जुड़े होते हैं, इसलिए p छोटा दिख सकता है।", cause: "यह प्रमाण नहीं कि एक माप दूसरे का कारण है।", howTitle: "यह कैसे गिना गया", how: "वर्ष तभी रहता है जब दोनों माप 80% दिन का नियम पार करें। Pearson r सीधी रेखा का संबंध है। Spearman rho क्रम का उपयोग करता है। कम से कम 8 युग्मित वर्ष चाहिए। 0.20, 0.40 और 0.70 पढ़ने की रीति है, क़ानून नहीं।", wait: "युग्मित वर्षों की प्रतीक्षा।", too_few: "8 से कम युग्मित वर्ष। कोई संबंध नहीं दिखाया जा रहा।", constant: "एक माप नहीं बदलता, इसलिए संबंध अनिर्धारित है।", uneven: "दोनों शृंखलाएँ नहीं जुड़ीं।", open: "संबंध खोलें", fit: "सरल रेखा", where: "पर", relateStrongPos: "मजबूत सकारात्मक संबंध: {city} में जब {varX} अधिक होता है, तो {varY} भी काफी अधिक रहने की प्रवृत्ति रखता है।", relateModeratePos: "मध्यम सकारात्मक संबंध: {city} में जब {varX} बढ़ता है, तो {varY} भी आमतौर पर बढ़ता है।", relateWeakPosSig: "हल्की सकारात्मक प्रवृत्ति: {city} में अधिक {varX} थोड़े अधिक {varY} से जुड़ा है।", relateStrongNeg: "मजबूत नकारात्मक संबंध: {city} में जब {varX} अधिक होता है, तो {varY} काफी कम रहने की प्रवृत्ति रखता है।", relateModerateNeg: "मध्यम नकारात्मक संबंध: {city} में जब {varX} बढ़ता है, तो {varY} घटने की प्रवृत्ति रखता है।", relateWeakNegSig: "हल्की नकारात्मक प्रवृत्ति: {city} में अधिक {varX} थोड़े कम {varY} से जुड़ा है।", relateNoClear: "{city} में {varX} और {varY} के बीच कोई स्पष्ट संबंध नहीं दिखता है। एक का बदलाव दूसरे का विश्वसनीय अनुमान नहीं देता।", relateCaution: "महत्वपूर्ण नोट: दो मापों के बीच संबंध का अर्थ यह नहीं है कि एक दूसरे का कारण बनता है।", explainPearson: "Pearson सहसंबंध (r): मापता है कि दो चर कितनी सीधी रेखा में चलते हैं, -1 (विपरीत) से +1 (समान दिशा)।", explainSpearman: "Spearman सहसंबंध (rho): मापता है कि क्या दो चर क्रम में साथ चलते हैं, भले ही संबंध सीधा न होकर वक्राकार हो।", explainRelateP: "सहसंबंध p-मान: संभावना कि ऐसा संबंध केवल संयोग से हो सकता है। 0.05 से कम मान सांख्यिकीय रूप से सार्थक होते हैं।" },
  id: { homeTitle: "Suhu dan hujan", note: "Satu titik NASA POWER. Tahun yang sama dan aturan 80% hari yang sama dengan uji tren. Hubungan bukan sebab.", point: "Titik kota", pearson: "Pearson", spearman: "Spearman", pairs: "tahun berpasangan", little: "Hampir tidak ada hubungan", weak: "lemah", moderate: "sedang", strong: "kuat", positive: "positif", negative: "negatif", sig: "Signifikan", nosig: "Tidak signifikan", family: "Keduanya bagian dari satu catatan suhu. Hubungan kuat memang diharapkan.", auto: "Nilai p menganggap tiap tahun independen. Tahun iklim biasanya terkait, jadi p bisa tampak terlalu kecil.", cause: "Ini bukan bukti bahwa satu ukuran menyebabkan ukuran lain.", howTitle: "Bagaimana ini dihitung", how: "Tahun disimpan hanya bila kedua ukuran lolos aturan 80% hari. Pearson r mengukur hubungan garis lurus. Spearman rho memakai peringkat. Perlu sedikitnya 8 tahun berpasangan. Ambang 0,20, 0,40, dan 0,70 adalah kebiasaan membaca, bukan hukum.", wait: "Menunggu tahun berpasangan.", too_few: "Kurang dari 8 tahun berpasangan. Korelasi tidak ditampilkan.", constant: "Satu ukuran tidak berubah, jadi korelasi tidak terdefinisi.", uneven: "Dua deret tidak dapat dipasangkan.", open: "Buka korelasi", fit: "Garis lurus", where: "di", relateStrongPos: "Hubungan positif yang kuat: ketika {varX} lebih tinggi di {city}, {varY} sangat cenderung lebih tinggi juga.", relateModeratePos: "Hubungan positif sedang: ketika {varX} meningkat di {city}, {varY} umumnya cenderung meningkat.", relateWeakPosSig: "Kecenderungan positif sedikit: {varX} yang lebih tinggi sedikit berkaitan dengan {varY} yang lebih tinggi di {city}.", relateStrongNeg: "Hubungan negatif yang kuat: ketika {varX} lebih tinggi di {city}, {varY} sangat cenderung lebih rendah.", relateModerateNeg: "Hubungan negatif sedang: ketika {varX} meningkat di {city}, {varY} cenderung menurun.", relateWeakNegSig: "Kecenderungan negatif sedikit: {varX} yang lebih tinggi sedikit berkaitan dengan {varY} yang lebih rendah di {city}.", relateNoClear: "Tidak ada hubungan yang jelas antara {varX} dan {varY} di {city}. Perubahan pada satu ukuran tidak dapat memprediksi ukuran lainnya.", relateCaution: "Catatan penting: Hubungan statistik antara dua ukuran tidak berarti yang satu menyebabkan yang lain.", explainPearson: "Korelasi Pearson (r): Mengukur seberapa dekat dua variabel mengikuti garis lurus, dari -1 (berlawanan) hingga +1 (searah).", explainSpearman: "Korelasi Spearman (rho): Mengukur apakah dua variabel bergerak bersama secara teratur, meski hubungannya tidak membentuk garis lurus.", explainRelateP: "Nilai p korelasi: Kemungkinan tingkat korelasi ini terjadi hanya karena kebetulan. Nilai di bawah 0,05 adalah signifikan secara statistik." },
  ar: { homeTitle: "الحرارة والمطر", note: "نقطة NASA POWER واحدة. السنوات نفسها وقاعدة 80% من الأيام كما في اختبار الاتجاه. الارتباط ليس سببًا.", point: "نقطة المدينة", pearson: "بيرسون", spearman: "سبيرمان", pairs: "سنوات مقترنة", little: "لا ارتباط يُذكر", weak: "ضعيف", moderate: "متوسط", strong: "قوي", positive: "موجب", negative: "سالب", sig: "ذو دلالة", nosig: "ليس ذا دلالة", family: "هذان جزءان من سجل حرارة واحد. الارتباط القوي متوقع.", auto: "قيمة p تتعامل مع كل سنة على أنها مستقلة. سنوات المناخ عادة مترابطة، لذلك قد تبدو p أصغر مما ينبغي.", cause: "هذا ليس دليلًا على أن مقياسًا سبب المقياس الآخر.", howTitle: "كيف حُسب هذا", how: "تُحفظ السنة فقط إذا اجتاز المقياسان قاعدة 80% من الأيام. r لبيرسون يقيس ارتباطًا خطيًا. rho لسبيرمان يستخدم الرتب. يلزم 8 سنوات مقترنة على الأقل. عتبات 0.20 و0.40 و0.70 عرف في القراءة وليست قانونًا.", wait: "بانتظار السنوات المقترنة.", too_few: "أقل من 8 سنوات مقترنة. لا يُعرض ارتباط.", constant: "أحد المقياسين لا يتغير، فالارتباط غير معرّف.", uneven: "تعذر اقتران السلسلتين.", open: "افتح الارتباط", fit: "خط مستقيم", where: "في", relateStrongPos: "علاقة طردية قوية: عندما يكون {varX} أعلى في {city}، فإن {varY} يميل بشدة إلى الارتفاع أيضًا.", relateModeratePos: "علاقة طردية متوسطة: عندما يرتفع {varX} في {city}، يميل {varY} عمومًا إلى الارتفاع.", relateWeakPosSig: "ميل طردي طفيف: يرتبط ارتفاع {varX} قليلًا بارتفاع {varY} في {city}.", relateStrongNeg: "علاقة عكسية قوية: عندما يكون {varX} أعلى في {city}، فإن {varY} يميل بشدة إلى الانخفاض.", relateModerateNeg: "علاقة عكسية متوسطة: عندما يرتفع {varX} في {city}، يميل {varY} إلى الانخفاض.", relateWeakNegSig: "ميل عكسي طفيف: يرتبط ارتفاع {varX} قليلًا بانخفاض {varY} في {city}.", relateNoClear: "لا توجد علاقة واضحة بين {varX} و{varY} في {city}. التغيرات في أحدهما لا تعكس بالضرورة تغيرات في الآخر.", relateCaution: "ملاحظة مهمة: الارتباط بين قياسين لا يعني بالضرورة أن أحدهما سبب في حدوث الآخر.", explainPearson: "معامل بيرسون (r): يقيس مدى اتباع متغيرين لخط مستقيم، من -1 (عكسي تمامًا) إلى +1 (طردي تمامًا).", explainSpearman: "معامل سبيرمان (rho): يقيس ما إذا كان المتغيران يتحركان معًا بالترتيب، حتى لو لم تكن العلاقة خطية مستقيمة.", explainRelateP: "قيمة p للارتباط: احتمال حدوث هذه الدرجة من الارتباط بالصدفة البحتة. القيم الأقل من 0.05 ذات دلالة إحصائية." },
  yo: { homeTitle: "Ìgbónásí àti òjò", note: "Ojúkan NASA POWER. Ọdún kan náà àti òfin 80% ọjọ́ bí ìdánwò ìtọ́sọ́nà. Ìbáṣepọ̀ kì í ṣe okùnfà.", point: "Ojú ìlú", pearson: "Pearson", spearman: "Spearman", pairs: "ọdún tí a so", little: "Kò sí ìbáṣepọ̀ tó hàn", weak: "kékeré", moderate: "àárín", strong: "tó lágbára", positive: "tó ń lọ sókè papọ̀", negative: "tó ń lọ ní òdì", sig: "Significant", nosig: "Kì í ṣe significant", family: "Àwọn méjèèjì jẹ́ apá ìkọsílẹ̀ ìgbónásí kan. Ìbáṣepọ̀ tó lágbára jẹ́ ohun tí a ń retí.", auto: "p ka ọdún kọ̀ọ̀kan sí òmìnira. Àwọn ọdún ojú-ọjọ́ sábà ní ìbáṣepọ̀, nítorí náà p lè kéré jù.", cause: "Èyí kì í ṣe ẹ̀rí pé ìwọ̀n kan fà ìwọ̀n kejì.", howTitle: "Báwo ni a ṣe ká", how: "A fi ọdún pamọ́ nìkan tí ìwọ̀n méjèèjì bá kọjá òfin 80% ọjọ́. Pearson r jẹ́ ìbáṣepọ̀ ìlà tààrà. Spearman rho lo ipò. Ó kéré tán ọdún 8. Ààlà 0.20, 0.40, àti 0.70 jẹ́ àṣà kíkà, kì í ṣe òfin.", wait: "Ń dúró de àwọn ọdún tí a so.", too_few: "Ọdún tí a so kò tó 8. A kò fi ìbáṣepọ̀ hàn.", constant: "Ìwọ̀n kan kò yí padà, nítorí náà ìbáṣepọ̀ kò ní ìtumọ̀.", uneven: "A kò le so àwọn ìtọ̀sọ́nà méjèèjì.", open: "Ṣí ìbáṣepọ̀", fit: "Ìlà tààrà", where: "ní", relateStrongPos: "Ìbáṣepọ̀ tó lágbára: nígbà tí {varX} bá ga ní {city}, {varY} náà tún máa ń ga sí i gan-an.", relateModeratePos: "Ìbáṣepọ̀ àárín: nígbà tí {varX} bá pọ̀ sí i ní {city}, {varY} sábà máa ń pọ̀ sí i pẹ̀lú.", relateWeakPosSig: "Àbá kékeré: {varX} tó ga ní {city} ní ìbáṣepọ̀ díẹ̀ pẹ̀lú {varY} tó ga.", relateStrongNeg: "Ìbáṣepọ̀ òdì tó lágbára: nígbà tí {varX} bá ga ní {city}, {varY} máa ń kéré sí i gan-an.", relateModerateNeg: "Ìbáṣepọ̀ òdì àárín: nígbà tí {varX} bá pọ̀ sí i ní {city}, {varY} sábà máa ń dínkù.", relateWeakNegSig: "Àbá òdì kékeré: {varX} tó ga ní {city} ní ìbáṣepọ̀ díẹ̀ pẹ̀lú {varY} tó kéré.", relateNoClear: "Kò sí ìbáṣepọ̀ tó hàn kedere láàárín {varX} àti {varY} ní {city}. Àyípadà nínú ọ̀kan kì í sọ tẹ́lẹ̀ nípa èkejì.", relateCaution: "Àkíyèsí pàtàkì: Ìbáṣepọ̀ láàárín àwọn ìwọ̀n méjì kì í ṣe pé ọ̀kan ló fa èkejì.", explainPearson: "Ìbáṣepọ̀ Pearson (r): Ń díwọ̀n bí àwọn ohun méjì ṣe tẹ̀lé ìlà tààrà, láti -1 dé +1.", explainSpearman: "Ìbáṣepọ̀ Spearman (rho): Ń díwọ̀n bóyá àwọn ohun méjì ń rìn pa pọ̀ ní tẹ̀létẹ̀lé, kódà bí kì í ṣe ìlà tààrà.", explainRelateP: "Iye p ti ìbáṣepọ̀: Àǹfààní pé irú ìbáṣepọ̀ yìí le ṣẹlẹ̀ nípa àrìnnàkò lásán. Àwọn iye tó kéré sí 0.05 ṣe pàtàkì ní ìmọ̀-ìṣirò." },
};

function rc(key) {
  const pack = RELATE_COPY[lang] || RELATE_COPY.en;
  return pack[key] || RELATE_COPY.en[key] || "";
}

function relateKey() {
  const pair = currentPair();
  if (!pair) return "";
  return [pair.id, $("season").value, $("from-year").value, $("to-year").value].join("|");
}

function relateRow(point, x, y) {
  const payload = relateCache.payload;
  if (!payload || !payload.points[point]) return null;
  return payload.points[point].pairs[x + "|" + y] || null;
}

function relateBlock(row) {
  if (!row || row.status !== "ok") return null;
  return relateMethod === "spearman" ? row.spearman : row.pearson;
}

function relateCoef(block) {
  if (!block) return null;
  return relateMethod === "spearman" ? block.rho : block.r;
}

function relateSentence(row) {
  if (!row) return rc("wait");
  if (row.status !== "ok") return rc(row.status) || rc("wait");
  const block = relateBlock(row);
  const value = relateCoef(block);
  const name = relateMethod === "spearman" ? "rho" : "r";
  const sign = block.reading.sign === "none" ? "" : " " + rc(block.reading.sign);
  return rc(block.reading.strength) + sign + ". " + name + " " + Number(value).toFixed(3)
    + ". p " + formatP(block.p_value) + ". " + row.n + " " + rc("pairs") + ". "
    + (block.significant ? rc("sig") : rc("nosig")) + ".";
}

function plainRelateSummary(row, cityName, xName, yName) {
  if (!row) return rc("wait");
  if (row.status !== "ok") {
    return rc(row.status) || rc("wait");
  }
  const block = relateBlock(row);
  if (!block) return rc("wait");
  const strength = block.reading ? block.reading.strength : "none";
  const sign = block.reading ? block.reading.sign : "none";
  const isSig = Boolean(block.significant);

  if (!isSig || strength === "none") {
    return fill(rc("relateNoClear"), { city: cityName, varX: xName, varY: yName, x: xName, y: yName });
  }

  let key = "relateNoClear";
  if (sign === "positive") {
    if (strength === "strong") key = "relateStrongPos";
    else if (strength === "moderate") key = "relateModeratePos";
    else if (strength === "weak") key = "relateWeakPosSig";
  } else if (sign === "negative") {
    if (strength === "strong") key = "relateStrongNeg";
    else if (strength === "moderate") key = "relateModerateNeg";
    else if (strength === "weak") key = "relateWeakNegSig";
  }

  return fill(rc(key), { city: cityName, varX: xName, varY: yName, x: xName, y: yName });
}

function renderRelateSummary(root, point, varX = "T2M", varY = "PRECTOTCORR") {
  root.replaceChildren();
  const row = relateRow(point, varX, varY);
  const city = relateCache.payload && relateCache.payload.points[point];
  const line = document.createElement("p");
  const where = city ? city.name : "";
  const xName = (t("vars") && t("vars")[varX]) || varX;
  const yName = (t("vars") && t("vars")[varY]) || varY;
  line.textContent = currentRole() === "general"
    ? plainRelateSummary(row, where, xName, yName)
    : (where ? where + " · " + xName + " · " + yName + ". " : "") + relateSentence(row);
  const button = document.createElement("button");
  button.type = "button";
  button.className = "primary";
  button.textContent = rc("open");
  button.addEventListener("click", () => {
    relateX = varX;
    relateY = varY;
    relatePoint = point;
    setView("relate");
  });
  root.append(line, button);
}

function renderHomeRelate() {
  const title = $("home-relate-title");
  const root = $("home-relate-body");
  if (!title || !root) return;
  title.textContent = rc("homeTitle");
  if (!relateCache.payload) {
    root.replaceChildren();
    const note = document.createElement("p");
    note.className = "hint";
    note.textContent = rc("wait");
    root.appendChild(note);
    return;
  }
  const previous = relateMethod;
  relateMethod = "pearson";
  renderRelateSummary(root, "a", "T2M", "PRECTOTCORR");
  relateMethod = previous;
}

function renderRelateFold() {
  const fold = $("relate-fold");
  if (!fold) return;
  fold.replaceChildren();
  if (!relateCache.payload) {
    fold.hidden = true;
    return;
  }
  fold.hidden = false;
  const activePoint = relatePoint || "a";
  const activeX = relateX || "T2M";
  const activeY = relateY || "PRECTOTCORR";
  const xName = (t("vars") && t("vars")[activeX]) || activeX;
  const yName = (t("vars") && t("vars")[activeY]) || activeY;
  const summary = document.createElement("summary");
  summary.textContent = (activeX === "T2M" && activeY === "PRECTOTCORR")
    ? rc("homeTitle")
    : (xName + " · " + yName);
  const body = document.createElement("div");
  renderRelateSummary(body, activePoint, activeX, activeY);
  fold.append(summary, body);
}

function renderRelateChart(row) {
  const canvas = $("relate-canvas");
  if (!canvas || typeof Chart === "undefined") return;
  if (relateChart) {
    relateChart.destroy();
    relateChart = null;
  }
  if (!row || row.status !== "ok") return;
  const xName = (t("vars") && t("vars")[relateX]) || relateX;
  const yName = (t("vars") && t("vars")[relateY]) || relateY;
  const unit = {};
  (relateCache.payload.variables || []).forEach((item) => { unit[item.id] = item.unit; });
  const dots = row.x.map((x, index) => ({ x, y: row.y[index] }));
  const datasets = [{
    type: "scatter",
    label: xName + " · " + yName,
    data: dots,
    backgroundColor: "#8fd4f5",
    borderColor: "#8fd4f5",
  }];
  if (relateMethod === "pearson" && row.line) {
    const low = Math.min(...row.x);
    const high = Math.max(...row.x);
    datasets.push({
      type: "line",
      label: rc("fit"),
      data: [
        { x: low, y: row.line.slope * low + row.line.intercept },
        { x: high, y: row.line.slope * high + row.line.intercept },
      ],
      borderColor: "#f0c36a",
      pointRadius: 0,
      borderWidth: 2,
    });
  }
  relateChart = new Chart(canvas, {
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom", labels: { color: "#d0dae8", boxWidth: 12 } } },
      scales: {
        x: { title: { display: true, text: xName + " (" + (unit[relateX] || "") + ")", color: "#d0dae8" }, ticks: { color: "#d0dae8" }, grid: { color: "#31445f" } },
        y: { title: { display: true, text: yName + " (" + (unit[relateY] || "") + ")", color: "#d0dae8" }, ticks: { color: "#d0dae8" }, grid: { color: "#31445f" } },
      },
    },
  });
}

function renderRelate() {
  renderHomeRelate();
  renderRelateFold();
  const title = $("relate-title");
  const note = $("relate-note");
  const tools = $("relate-tools");
  const read = $("relate-read");
  const matrix = $("relate-matrix");
  const sparks = $("relate-sparks");
  const how = $("relate-how");
  if (!title || !relateCache.payload) return;
  const payload = relateCache.payload;
  title.textContent = t("navRelate");
  note.textContent = rc("note");
  const city = payload.points[relatePoint];
  tools.replaceChildren();
  ["a", "b"].forEach((key) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ghost";
    button.textContent = payload.points[key].name;
    button.setAttribute("aria-pressed", relatePoint === key ? "true" : "false");
    button.addEventListener("click", () => { relatePoint = key; renderRelate(); });
    tools.appendChild(button);
  });
  ["pearson", "spearman"].forEach((method) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ghost";
    button.textContent = rc(method);
    button.title = method === "pearson" ? rc("how") : rc("how");
    button.setAttribute("aria-pressed", relateMethod === method ? "true" : "false");
    button.addEventListener("click", () => { relateMethod = method; renderRelate(); });
    tools.appendChild(button);
  });
  const row = relateRow(relatePoint, relateX, relateY);
  read.replaceChildren();
  const isGeneral = currentRole() === "general";
  const xName = (t("vars") && t("vars")[relateX]) || relateX;
  const yName = (t("vars") && t("vars")[relateY]) || relateY;

  if (isGeneral) {
    const headline = document.createElement("p");
    headline.className = "plain-summary";
    headline.textContent = plainRelateSummary(row, city.name, xName, yName);
    read.appendChild(headline);

    const caution = document.createElement("p");
    caution.className = "hint";
    caution.textContent = rc("relateCaution");
    read.appendChild(caution);

    if (row && row.same_family) {
      const family = document.createElement("p");
      family.className = "hint";
      family.textContent = rc("family");
      read.appendChild(family);
    }

    if (row && row.status === "ok") {
      const block = relateBlock(row);
      const value = relateCoef(block);
      const coefName = relateMethod === "spearman" ? "rho" : "r";
      const details = document.createElement("details");
      details.className = "fold tech-details";
      const summary = document.createElement("summary");
      summary.textContent = t("technicalDetails");
      details.appendChild(summary);

      const numGrid = document.createElement("div");
      numGrid.className = "stats";
      numGrid.style.marginTop = "6px";
      const statLines = [
        [coefName, Number(value).toFixed(3) + " (" + rc(block.reading.strength) + (block.reading.sign !== "none" ? " " + rc(block.reading.sign) : "") + ")"],
        ["p-value", formatP(block.p_value) + " (" + (block.significant ? rc("sig") : rc("nosig")) + ")"],
        [rc("pairs"), String(row.n)],
        [t("methodTitle") || "Method", relateMethod === "spearman" ? "Spearman rank correlation" : "Pearson correlation"],
      ];
      statLines.forEach(([label, val]) => {
        const line = document.createElement("div");
        line.textContent = label + ": " + val;
        numGrid.appendChild(line);
      });
      details.appendChild(numGrid);

      const explains = document.createElement("div");
      explains.className = "tech-explains";
      explains.innerHTML =
        "<p><strong>" + (relateMethod === "spearman" ? "Spearman (rho)" : "Pearson (r)") + ":</strong> " + (relateMethod === "spearman" ? rc("explainSpearman") : rc("explainPearson")) + "</p>" +
        "<p><strong>p-value:</strong> " + rc("explainRelateP") + "</p>" +
        "<p><strong>" + (t("significance") || "Significance") + ":</strong> " + (block.significant ? rc("sig") : rc("nosig")) + " — " + t("explainSignificance") + "</p>";
      details.appendChild(explains);
      read.appendChild(details);
    }
  } else {
    const headline = document.createElement("p");
    headline.textContent = city.name + " · " + xName + " · " + yName + " · " + payload.start_year + "–" + payload.end_year + ". " + relateSentence(row);
    read.appendChild(headline);
    if (row && row.same_family) {
      const family = document.createElement("p");
      family.className = "hint";
      family.textContent = rc("family");
      read.appendChild(family);
    }
    const limit = document.createElement("p");
    limit.className = "hint";
    limit.textContent = rc("auto") + " " + rc("cause");
    read.appendChild(limit);
  }
  const names = payload.variables.map((item) => item.id);
  matrix.replaceChildren();
  const grid = document.createElement("div");
  grid.className = "heat";
  const corner = document.createElement("span");
  corner.className = "corner";
  corner.textContent = rc("point") + ": " + city.name;
  grid.appendChild(corner);
  names.forEach((name) => {
    const head = document.createElement("span");
    head.className = "head";
    head.textContent = (t("vars") && t("vars")[name]) || name;
    grid.appendChild(head);
  });
  names.forEach((left) => {
    const label = document.createElement("span");
    label.className = "head";
    label.textContent = (t("vars") && t("vars")[left]) || left;
    grid.appendChild(label);
    names.forEach((right) => {
      if (left === right) {
        const blank = document.createElement("span");
        blank.className = "head";
        blank.textContent = "—";
        grid.appendChild(blank);
        return;
      }
      const cell = document.createElement("button");
      cell.type = "button";
      const item = relateRow(relatePoint, left, right);
      const block = item && item.status === "ok" ? (relateMethod === "spearman" ? item.spearman : item.pearson) : null;
      const value = block ? (relateMethod === "spearman" ? block.rho : block.r) : null;
      cell.textContent = value == null ? "—" : Number(value).toFixed(2);
      cell.title = (value == null ? rc(item && item.status) : relateSentence(item)) + " " + rc("auto");
      if (value != null) {
        const mix = Math.round(Math.abs(value) * 72);
        const ink = value >= 0 ? "var(--amber)" : "var(--cyan)";
        cell.style.background = "color-mix(in srgb, " + ink + " " + mix + "%, var(--card))";
      }
      if (left === relateX && right === relateY) cell.classList.add("on");
      cell.addEventListener("click", () => { relateX = left; relateY = right; renderRelate(); });
      grid.appendChild(cell);
    });
  });
  matrix.appendChild(grid);
  sparks.replaceChildren();
  if (row && row.status === "ok") {
    const unitMap = {};
    (payload.variables || []).forEach((item) => { unitMap[item.id] = item.unit; });
    [["x", relateX, row.x], ["y", relateY, row.y]].forEach((item, index) => {
      const varId = item[1];
      const vals = item[2] || [];
      const card = document.createElement("article");
      card.className = "snap";
      const name = document.createElement("span");
      name.className = "k";
      name.textContent = (t("vars") && t("vars")[varId]) || varId;
      const period = document.createElement("p");
      period.className = "snap-period";
      period.textContent = city.name + " · " + payload.start_year + "–" + payload.end_year;
      const lastVal = vals.length ? Number(vals[vals.length - 1]) : null;
      const lastYear = (row.years && row.years.length) ? row.years[row.years.length - 1] : payload.end_year;
      const level = document.createElement("p");
      level.className = "snap-level";
      level.textContent = (lastVal != null && Number.isFinite(lastVal))
        ? (lastYear + ": " + lastVal.toFixed(2) + " " + (unitMap[varId] || ""))
        : "";
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 120 32");
      svg.setAttribute("class", "spark");
      svg.setAttribute("aria-hidden", "true");
      const series = { values: vals };
      addSpark(svg, series, index === 0 ? "#f3b4c8" : "#8fd4f5", seriesExtent([series]));
      card.append(name, period, level, svg);
      sparks.appendChild(card);
    });
  }
  how.replaceChildren();
  const summary = document.createElement("summary");
  summary.textContent = rc("howTitle");
  const body = document.createElement("p");
  body.textContent = rc("how");
  how.append(summary, body);
  renderRelateChart(row);
}

async function loadRelate(refresh) {
  const pair = currentPair();
  const key = relateKey();
  if (!pair || !key) return;
  if (!refresh && relateCache.key === key && relateCache.payload) {
    renderRelate();
    return;
  }
  try {
    const params = new URLSearchParams({
      city_a: pair.a.id,
      city_b: pair.b.id,
      season: $("season").value,
      start_year: $("from-year").value,
      end_year: $("to-year").value,
    });
    if (refresh) params.set("refresh", "true");
    const response = await fetch("/api/relate?" + params.toString());
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.detail || "");
    relateCache = { key, payload };
    renderRelate();
  } catch (error) {
    const root = $("home-relate-body");
    if (root) {
      root.replaceChildren();
      const note = document.createElement("p");
      note.className = "hint";
      note.textContent = rc("wait");
      root.appendChild(note);
    }
  }
}

function paintHomeRecent() {
  const root = $("home-recent");
  if (!root) return;
  root.replaceChildren();
  const rows = readSaves();
  if (!rows.length) {
    const note = document.createElement("p");
    note.className = "hint";
    note.textContent = ht("recentEmpty");
    root.appendChild(note);
    return;
  }
  rows.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip";
    button.textContent = item.label;
    button.addEventListener("click", () => applySave(item, true));
    root.appendChild(button);
  });
}

function startHomeCheck(event) {
  event.preventDefault();
  $("pair").value = $("home-pair").value;
  $("variable").value = $("home-var").value;
  $("from-year").value = $("home-from").value;
  $("to-year").value = $("home-to").value;
  preferLinesCountry();
  paintHomeChrome();
  setView("result");
  load(false);
}

function renderHome(data) {
  const box = $("home-reading");
  if (!box || !data) return;
  box.hidden = false;
  const either = data.a.trend.significant || data.b.trend.significant;
  box.textContent = data.a.name + " · " + data.b.name + " · " + (either ? t("sigYes") : t("sigNo"));
  paintHomeEarth(data.a.lat, data.a.lon, data.b.lat, data.b.lon);
}

const HOME_LAGS = [5, 6, 8, 12, 20];
let homeLiveDay = "";

function dayOffset(days) {
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
}

function gibsTile(lat, lon, z) {
  const n = 2 ** z;
  const x = Math.floor(((Number(lon) + 180) / 360) * n);
  const latRad = (Number(lat) * Math.PI) / 180;
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  return [Math.min(n - 1, Math.max(0, x)), Math.min(n - 1, Math.max(0, y))];
}

function viirsUrl(z, y, x, day) {
  return "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/" + day + "/GoogleMapsCompatible_Level9/" + z + "/" + y + "/" + x + ".jpg";
}

function marbleUrl(z, y, x) {
  return "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/" + z + "/" + y + "/" + x + ".jpg";
}

function findLiveDay() {
  if (homeLiveDay) return Promise.resolve(homeLiveDay);
  if (findLiveDay.pending) return findLiveDay.pending;
  findLiveDay.pending = new Promise((resolve) => {
    const probe = new Image();
    let index = 0;
    const step = () => {
      if (index >= HOME_LAGS.length) {
        resolve("");
        return;
      }
      const day = dayOffset(HOME_LAGS[index]);
      index += 1;
      probe.onload = () => {
        homeLiveDay = day;
        resolve(day);
      };
      probe.onerror = step;
      probe.src = viirsUrl(0, 0, 0, day);
    };
    step();
  });
  return findLiveDay.pending;
}

function regionBox(lat1, lon1, lat2, lon2) {
  const lat = (Number(lat1) + Number(lat2)) / 2;
  const lon = (Number(lon1) + Number(lon2)) / 2;
  const south = Math.max(-55, lat - 14);
  const north = Math.min(70, lat + 14);
  const west = Math.max(-170, lon - 18);
  const east = Math.min(180, lon + 18);
  return [south, west, north, east].map((n) => n.toFixed(2)).join(",");
}

function liveSceneUrl(day, box) {
  return "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=VIIRS_SNPP_CorrectedReflectance_TrueColor&FORMAT=image/jpeg&CRS=EPSG:4326&WIDTH=1600&HEIGHT=800&BBOX=" + box + "&TIME=" + day;
}

function marbleSceneUrl(box) {
  return "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=BlueMarble_ShadedRelief_Bathymetry&FORMAT=image/jpeg&CRS=EPSG:4326&WIDTH=1600&HEIGHT=800&BBOX=" + box;
}

function sceneIsBroken(img) {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 40;
    canvas.height = 20;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, 40, 20);
    const pixels = ctx.getImageData(0, 0, 40, 20).data;
    let dark = 0;
    const count = pixels.length / 4;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] < 14 && pixels[i + 1] < 14 && pixels[i + 2] < 14) dark += 1;
    }
    return dark / count > 0.05;
  } catch (error) {
    return false;
  }
}

let homeScene = null;

function paintHomeEarth(lat, lon, lat2, lon2) {
  if (lat != null) {
    homeScene = { lat: lat, lon: lon, lat2: lat2 == null ? lat : lat2, lon2: lon2 == null ? lon : lon2 };
  }
  const scene = homeScene || { lat: 23.81, lon: 90.41, lat2: 24.89, lon2: 91.87 };
  drawHomeEarth(scene.lat, scene.lon, scene.lat2, scene.lon2);
}

function drawHomeEarth(lat, lon, lat2, lon2) {
  const img = $("home-live");
  const note = $("home-note");
  if (!img) return;
  const box = regionBox(lat, lon, lat2, lon2);
  if (img.dataset.box === box && img.dataset.ready === "1") {
    if (note) {
      note.textContent = img.dataset.day
        ? fill(t("homeNote"), { day: img.dataset.day })
        : t("homePhotoBase");
    }
    return;
  }
  const days = HOME_LAGS.map(dayOffset);
  let index = 0;
  img.crossOrigin = "anonymous";
  img.dataset.box = box;
  img.dataset.ready = "";
  img.dataset.day = "";
  const useMarble = () => {
    img.onload = () => {
      img.dataset.ready = "1";
    };
    img.onerror = null;
    img.src = marbleSceneUrl(box);
    if (note) note.textContent = t("homePhotoBase");
  };
  const tryNext = () => {
    if (index >= days.length) {
      useMarble();
      return;
    }
    const day = days[index];
    index += 1;
    img.onload = () => {
      if (sceneIsBroken(img)) {
        tryNext();
        return;
      }
      img.dataset.ready = "1";
      img.dataset.day = day;
      homeLiveDay = day;
      if (note) note.textContent = fill(t("homeNote"), { day: day });
    };
    img.onerror = tryNext;
    img.src = liveSceneUrl(day, box);
  };
  tryNext();
}

async function loadHazards(force) {
  if (hazardCache && !force) {
    renderHazards();
    return;
  }
  const status = $("events-status");
  status.className = "status";
  status.textContent = t("eventsWait");
  const homeStatus = $("home-alert-status");
  if (homeStatus && !hazardCache) {
    homeStatus.className = "status";
    homeStatus.textContent = t("eventsWait");
  }
  $("events-refresh").disabled = true;
  $("home-alert-refresh").disabled = true;
  try {
    const response = await fetch("/api/events" + (force ? "?refresh=true" : ""));
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.detail || "");
    hazardCache = payload;
    renderHazards();
  } catch (error) {
    status.textContent = t("eventsFail");
    status.className = "status error";
    const homeStatus = $("home-alert-status");
    if (homeStatus && !hazardCache) {
      homeStatus.textContent = t("eventsFail");
      homeStatus.className = "status error";
    }
  } finally {
    $("events-refresh").disabled = false;
    $("home-alert-refresh").disabled = false;
  }
}

$("events-refresh").addEventListener("click", () => loadHazards(true));
$("home-alert-refresh").addEventListener("click", () => loadHazards(true));
$("home-go-trends").addEventListener("click", () => setView("trends"));
$("home-go-check").addEventListener("click", () => {
  const form = $("home-quick");
  const scroller = document.querySelector("main");
  if (form && scroller) {
    const top = form.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 12;
    scroller.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }
  const field = $("home-pair");
  if (field) field.focus({ preventScroll: true });
});
$("home-go-map").addEventListener("click", () => setView("map"));
$("home-go-events").addEventListener("click", () => openEventsPage());
$("home-go-districts").addEventListener("click", () => setView("districts"));

function bindHomeDepth() {
  const stage = document.querySelector(".home-stage");
  if (!stage || bindHomeDepth.ready) return;
  bindHomeDepth.ready = true;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  stage.addEventListener("pointermove", (event) => {
    const box = stage.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    stage.style.setProperty("--px", (x * -12).toFixed(1) + "px");
    stage.style.setProperty("--py", (y * -8).toFixed(1) + "px");
  });
  stage.addEventListener("pointerleave", () => {
    stage.style.setProperty("--px", "0px");
    stage.style.setProperty("--py", "0px");
  });
}

let mapBase = "nasa";
let paletteRows = [];
let tourStep = 0;
const TOUR_KEYS = ["tour1", "tour2", "tour3"];
const NAV_GROUPS = {
  home: "navProject",
  result: "navProject",
  map: "navProject",
  trends: "navProject",
  districts: "navProject",
  events: "navMore",
  relate: "navMore",
  health: "navMore",
  plans: "navMore",
  lines: "navMore",
  field: "navMore",
  ready: "navMore",
  method: "navMore",
  learn: "navMore",
  voices: "navMore",
  about: "navMore",
};

function paintCrumb() {
  const crumb = $("page-crumb");
  if (!crumb) return;
  crumb.hidden = view === "home";
  if (view === "home") return;
  const button = $("view-" + view);
  crumb.textContent = t(NAV_GROUPS[view] || "navProject") + " · " + (button ? button.textContent : "");
}

function openKillerDemo() {
  if ($("pair")) $("pair").value = "bangladesh";
  if ($("variable")) $("variable").value = "T2M_MIN";
  if ($("season")) $("season").value = "ALL";
  if ($("from-year")) $("from-year").value = "2004";
  if ($("to-year")) $("to-year").value = "2024";
  preferLinesCountry();
  paintHomeChrome();
  setView("trends");
  load(false);
}

function renderChips() {
  const root = $("filter-chips");
  if (!root || !$("pair").options.length) return;
  root.innerHTML = "";
  const bits = [
    $("pair").selectedOptions[0] && $("pair").selectedOptions[0].textContent,
    $("variable").selectedOptions[0] && $("variable").selectedOptions[0].textContent,
    $("season").selectedOptions[0] && $("season").selectedOptions[0].textContent,
    $("from-year").value && $("to-year").value ? $("from-year").value + "–" + $("to-year").value : "",
  ].filter(Boolean);
  bits.forEach((text, index) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.textContent = text;
    const target = ["pair", "variable", "season", "from-year"][index];
    chip.addEventListener("click", () => openFilters(target));
    root.appendChild(chip);
  });
  const killer = document.createElement("button");
  killer.type = "button";
  killer.className = "ghost";
  killer.textContent = "⚡ " + t("killerDemo");
  killer.title = t("killerDemoTip");
  killer.addEventListener("click", openKillerDemo);
  root.appendChild(killer);
  const reset = document.createElement("button");
  reset.type = "button";
  reset.className = "ghost";
  reset.textContent = t("resetFilters");
  reset.addEventListener("click", () => {
    $("variable").value = "T2M";
    $("season").value = "ALL";
    $("from-year").value = "2004";
    $("to-year").value = "2024";
    if ($("pair").value !== "bangladesh") $("pair").value = "bangladesh";
    preferLinesCountry();
    paintHomeChrome();
    load(false);
  });
  root.appendChild(reset);
  const save = document.createElement("button");
  save.type = "button";
  save.className = "ghost";
  save.textContent = t("saveCheck");
  save.addEventListener("click", saveCheck);
  root.appendChild(save);
  const share = document.createElement("button");
  share.type = "button";
  share.className = "ghost";
  share.textContent = t("copyLink");
  share.addEventListener("click", async () => {
    writeShare();
    try { await navigator.clipboard.writeText(location.href); } catch (error) {}
    share.textContent = t("linkCopied");
    setTimeout(() => { share.textContent = t("copyLink"); }, 1200);
  });
  root.appendChild(share);
  paintSaves();
}

function paintMapLayers() {
  const nasa = $("map-layer-nasa");
  const outline = $("map-layer-outline");
  if (!nasa || !outline) return;
  nasa.textContent = t("mapLayerNasa");
  outline.textContent = t("mapLayerOutline");
  const tiles = Boolean(gibsLayer && mapInstance && mapInstance.hasLayer(gibsLayer));
  nasa.setAttribute("aria-pressed", tiles ? "true" : "false");
  outline.setAttribute("aria-pressed", tiles ? "false" : "true");
  nasa.disabled = !navigator.onLine && !gibsLayer;
}

function showMapBase(mode) {
  mapBase = mode;
  if (!mapInstance) return;
  if (mode === "outline") {
    if (gibsLayer && mapInstance.hasLayer(gibsLayer)) mapInstance.removeLayer(gibsLayer);
    if (!offlineLayer && typeof OFFLINE_WORLD_MAP !== "undefined") {
      offlineLayer = L.geoJSON(OFFLINE_WORLD_MAP, {
        style: { color: "#8fd4f5", weight: 1.2, fillColor: "#122033", fillOpacity: 0.92 },
      }).addTo(mapInstance);
    } else if (offlineLayer && !mapInstance.hasLayer(offlineLayer)) offlineLayer.addTo(mapInstance);
  } else if (gibsLayer) {
    if (offlineLayer && mapInstance.hasLayer(offlineLayer)) mapInstance.removeLayer(offlineLayer);
    if (!mapInstance.hasLayer(gibsLayer)) gibsLayer.addTo(mapInstance);
  }
  if (latest) {
    const tilesOn = gibsLayer && mapInstance.hasLayer(gibsLayer);
    const km = distanceKm(latest.a.lat, latest.a.lon, latest.b.lat, latest.b.lon);
    $("map-note").textContent = (tilesOn ? t("mapOnline") : t("mapOffline")) + " " + fill(t("mapDistance"), { km: String(Math.round(km)) });
  }
  paintMapLayers();
}

function paletteItems() {
  const pages = VIEWS.map((id) => ({
    label: $("view-" + id).textContent,
    kind: t(NAV_GROUPS[id] || "navProject"),
    run: () => (id === "events" ? openEventsPage() : setView(id)),
  }));
  return pages.concat([
    { label: "⚡ " + t("killerDemo"), kind: t("navLook"), run: openKillerDemo },
    { label: t("apply"), kind: t("navLook"), run: () => { setView("result"); load(false); } },
    { label: t("refresh"), kind: t("navLook"), run: () => { setView("result"); load(true); } },
    { label: t("fullRecord"), kind: t("navLook"), run: () => { $("from-year").value = "2004"; $("to-year").value = "2024"; setView("trends"); load(false); } },
    { label: t("copyAnswer"), kind: t("navLook"), run: () => copyAnswer() },
    { label: t("downloadReport") + " CSV", kind: t("navLook"), run: () => downloadReport("csv") },
  ]);
}

function paintPalette() {
  const query = ($("palette-input").value || "").trim().toLowerCase();
  paletteRows = paletteItems().filter((item) => (item.label + " " + item.kind).toLowerCase().includes(query));
  const list = $("palette-list");
  list.innerHTML = "";
  paletteRows.forEach((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("role", "option");
    button.setAttribute("aria-selected", index === 0 ? "true" : "false");
    button.textContent = item.label;
    const kind = document.createElement("span");
    kind.className = "palette-kind";
    kind.textContent = item.kind;
    button.appendChild(kind);
    button.addEventListener("click", () => {
      closePalette();
      item.run();
    });
    list.appendChild(button);
  });
}

function openPalette() {
  $("palette").hidden = false;
  $("palette-input").value = "";
  paintPalette();
  $("palette-input").focus();
}

function closePalette() {
  if ($("palette")) $("palette").hidden = true;
}

function movePalette(step) {
  const buttons = [...$("palette-list").querySelectorAll("button")];
  if (!buttons.length) return;
  const current = buttons.findIndex((button) => button.getAttribute("aria-selected") === "true");
  const next = (current + step + buttons.length) % buttons.length;
  buttons.forEach((button, index) => button.setAttribute("aria-selected", index === next ? "true" : "false"));
  buttons[next].scrollIntoView({ block: "nearest" });
}

function paintTour() {
  $("tour-text").textContent = t(TOUR_KEYS[tourStep]);
  $("tour-next").textContent = tourStep === TOUR_KEYS.length - 1 ? t("tourDone") : t("tourNext");
  $("tour-skip").textContent = t("tourSkip");
}

function showTour() {
  try {
    if (localStorage.getItem("mci-tour")) return;
  } catch (error) {
    return;
  }
  tourStep = 0;
  paintTour();
  $("tour").hidden = false;
}

function endTour() {
  $("tour").hidden = true;
  try { localStorage.setItem("mci-tour", "1"); } catch (error) {}
}

$("nav-collapse").addEventListener("click", () => {
  const on = !document.body.classList.contains("nav-collapsed");
  document.body.classList.toggle("nav-collapsed", on);
  $("nav-collapse").setAttribute("aria-pressed", on ? "true" : "false");
  $("nav-collapse").textContent = on ? t("navExpand") : t("navCollapse");
  try { localStorage.setItem("mci-nav", on ? "1" : "0"); } catch (error) {}
});
$("nav-open").addEventListener("click", () => {
  document.body.classList.add("nav-open");
  $("nav-backdrop").hidden = false;
});
$("nav-backdrop").addEventListener("click", () => {
  document.body.classList.remove("nav-open");
  $("nav-backdrop").hidden = true;
});
$("find-open").addEventListener("click", openPalette);
$("palette").addEventListener("click", (event) => {
  if (event.target === $("palette")) closePalette();
});
$("palette-input").addEventListener("input", paintPalette);
$("palette-input").addEventListener("keydown", (event) => {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    movePalette(1);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    movePalette(-1);
  } else if (event.key === "Enter") {
    event.preventDefault();
    const chosen = $("palette-list").querySelector('[aria-selected="true"]');
    if (chosen) chosen.click();
  }
});
$("map-layer-nasa").addEventListener("click", () => showMapBase("nasa"));
$("map-layer-outline").addEventListener("click", () => showMapBase("outline"));
$("tour-next").addEventListener("click", () => {
  if (tourStep >= TOUR_KEYS.length - 1) endTour();
  else {
    tourStep += 1;
    paintTour();
  }
});
$("tour-skip").addEventListener("click", endTour);
try {
  if (localStorage.getItem("mci-nav") === "1") document.body.classList.add("nav-collapsed");
} catch (error) {}
const DISTRICT_COPY = {
  en: { title: "Conditions in a Bangladesh district", note: "All 64 districts. Rainfall forecasts are the BMD feed on the DDM weather page. Fires are NASA FIRMS. The BMD special-bulletin list is checked for cyclone wording. The FFWC river API answers 403 until a BWDB key is set as FFWC_INTERNAL_KEY. IMERG Early granules are listed by NASA CMR, but the precipitation file needs an Earthdata token. A missing feed does not mean a district is safe.", division: "Division", all: "All divisions", search: "Search", pick: "District", observation: "Satellite observation", observationBody: "No NASA rainfall or fire feed is connected for this district.", forecast: "Forecast", forecastBody: "No forecast feed is connected. Forecasts are published by the Bangladesh Meteorological Department.", warning: "Official warning", warningBody: "No official warning feed is connected. This is not a statement that the district is safe.", disclaimer: "For an urgent emergency, follow the responsible authority. This page does not replace an official warning.", save: "Save as my district", saved: "My district. Click to clear.", links: "Official pages", boundary: "Boundaries: geoBoundaries, from the Bangladesh Bureau of Statistics and OCHA. CC BY 3.0 IGO. A district shape is not a weather measurement.", missing: "District boundaries could not be loaded.", tip: "Rainfall category and satellite detections." },
  bn: { title: "বাংলাদেশের একটি জেলার অবস্থা", note: "৬৪টি জেলা। বৃষ্টির পূর্বাভাস আসে BMD-র ফিড থেকে, যা DDM-এর আবহাওয়া পাতায় আছে। আগুনের খোঁজ NASA FIRMS। ঘূর্ণিঝড়ের জন্য BMD-র বিশেষ বিজ্ঞপ্তির তালিকা যাচাই হয়। FFWC-র নদীর এপিআই ৪০৩ দেয় যতক্ষণ না BWDB-র চাবি FFWC_INTERNAL_KEY হিসেবে দেওয়া হয়। NASA CMR IMERG Early-র ফাইলের নাম দেয়, কিন্তু বৃষ্টির সংখ্যা পড়তে Earthdata টোকেন লাগে। ফিড না থাকা মানে জেলা নিরাপদ নয়।", division: "বিভাগ", all: "সব বিভাগ", search: "খুঁজুন", pick: "জেলা", observation: "উপগ্রহ পর্যবেক্ষণ", observationBody: "এই জেলার জন্য NASA-র বৃষ্টি বা আগুনের ফিড যুক্ত নেই।", forecast: "পূর্বাভাস", forecastBody: "পূর্বাভাসের ফিড যুক্ত নেই। পূর্বাভাস প্রকাশ করে বাংলাদেশ আবহাওয়া অধিদপ্তর।", warning: "সরকারি সতর্কতা", warningBody: "সরকারি সতর্কতার ফিড যুক্ত নেই। এতে বলা হয় না যে জেলা নিরাপদ।", disclaimer: "জরুরি অবস্থায় দায়িত্বপ্রাপ্ত কর্তৃপক্ষের কথা মানুন। এই পাতা সরকারি সতর্কতার বদলি নয়।", save: "আমার জেলা হিসেবে রাখুন", saved: "আমার জেলা। মুছতে চাপুন।", links: "অফিসিয়াল পাতা", boundary: "সীমানা: geoBoundaries, বাংলাদেশ পরিসংখ্যান ব্যুরো ও OCHA। CC BY 3.0 IGO। জেলার আকার আবহাওয়ার মাপ নয়।", missing: "জেলার সীমানা লোড হয়নি।", tip: "বৃষ্টির শ্রেণি ও উপগ্রহের খোঁজ।" },
  hi: { title: "बांग्लादेश के एक ज़िले की स्थिति", note: "सभी 64 ज़िले। वर्षा, पूर्वानुमान या सरकारी चेतावनी की फ़ीड जुड़ी नहीं है। फ़ीड न होना सुरक्षा नहीं है।", division: "प्रदेश", all: "सभी प्रदेश", search: "खोजें", pick: "ज़िला", observation: "उपग्रह अवलोकन", observationBody: "इस ज़िले के लिए NASA वर्षा या आग की फ़ीड नहीं जुड़ी।", forecast: "पूर्वानुमान", forecastBody: "पूर्वानुमान फ़ीड नहीं जुड़ी। पूर्वानुमान बांग्लादेश मौसम विभाग प्रकाशित करता है।", warning: "आधिकारिक चेतावनी", warningBody: "आधिकारिक चेतावनी फ़ीड नहीं जुड़ी। इसका अर्थ नहीं कि ज़िला सुरक्षित है।", disclaimer: "आपात में ज़िम्मेदार प्राधिकरण का पालन करें। यह पृष्ठ आधिकारिक चेतावनी का स्थान नहीं लेता।", save: "मेरा ज़िला सहेजें", saved: "मेरा ज़िला। मिटाने के लिए दबाएँ।", links: "आधिकारिक पृष्ठ", boundary: "सीमाएँ: geoBoundaries, बांग्लादेश सांख्यिकी ब्यूरो और OCHA। CC BY 3.0 IGO।", missing: "ज़िला सीमाएँ लोड नहीं हुईं।", tip: "वर्षा श्रेणी और उपग्रह पहचान।" },
  id: { title: "Kondisi sebuah distrik di Bangladesh", note: "Ke-64 distrik. Umpan hujan, prakiraan, atau peringatan resmi belum terhubung. Umpan yang kosong bukan tanda aman.", division: "Divisi", all: "Semua divisi", search: "Cari", pick: "Distrik", observation: "Pengamatan satelit", observationBody: "Umpan hujan atau kebakaran NASA belum terhubung untuk distrik ini.", forecast: "Prakiraan", forecastBody: "Umpan prakiraan belum terhubung. Prakiraan diterbitkan Departemen Meteorologi Bangladesh.", warning: "Peringatan resmi", warningBody: "Umpan peringatan resmi belum terhubung. Ini bukan pernyataan bahwa distrik aman.", disclaimer: "Dalam keadaan darurat, ikuti otoritas yang berwenang. Halaman ini tidak menggantikan peringatan resmi.", save: "Simpan sebagai distrik saya", saved: "Distrik saya. Klik untuk menghapus.", links: "Halaman resmi", boundary: "Batas: geoBoundaries, dari Biro Statistik Bangladesh dan OCHA. CC BY 3.0 IGO.", missing: "Batas distrik tidak dapat dimuat.", tip: "Kategori hujan dan deteksi satelit." },
  ar: { title: "حالة منطقة في بنغلاديش", note: "المناطق الأربع والستون. لا موجز للمطر أو التوقع أو التحذير الرسمي. غياب الموجز لا يعني أن المنطقة آمنة.", division: "الإقليم", all: "كل الأقاليم", search: "بحث", pick: "المنطقة", observation: "رصد الأقمار", observationBody: "لا موجز لمطر أو حرائق ناسا لهذه المنطقة.", forecast: "توقع", forecastBody: "لا موجز للتوقع. التوقعات تنشرها إدارة الأرصاد في بنغلاديش.", warning: "تحذير رسمي", warningBody: "لا موجز للتحذير الرسمي. هذا ليس قولًا بأن المنطقة آمنة.", disclaimer: "في الطوارئ اتبع الجهة المسؤولة. هذه الصفحة لا تغني عن التحذير الرسمي.", save: "احفظها منطقتي", saved: "منطقتي. اضغط للمسح.", links: "الصفحات الرسمية", boundary: "الحدود: geoBoundaries، من مكتب إحصاء بنغلاديش وOCHA. CC BY 3.0 IGO.", missing: "تعذر تحميل حدود المناطق.", tip: "فئة المطر ورصد الأقمار." },
  yo: { title: "Ipò agbègbè kan ní Bangladesh", note: "Agbègbè 64. Kò sí ìjápọ̀ fún òjò, àsọtẹ́lẹ̀, tàbí ìkìlọ̀ ìjọba. Àìsí ìjápọ̀ kì í túmọ̀ sí ààbò.", division: "Agbègbè ńlá", all: "Gbogbo agbègbè ńlá", search: "Wá", pick: "Agbègbè", observation: "Àkíyèsí satẹ́laiti", observationBody: "Kò sí ìjápọ̀ òjò tàbí iná NASA fún agbègbè yìí.", forecast: "Àsọtẹ́lẹ̀", forecastBody: "Kò sí ìjápọ̀ àsọtẹ́lẹ̀. Àsọtẹ́lẹ̀ wá láti ọ̀dọ̀ ilé-iṣẹ́ ojú-ọjọ́ Bangladesh.", warning: "Ìkìlọ̀ ìjọba", warningBody: "Kò sí ìjápọ̀ ìkìlọ̀ ìjọba. Èyí kì í sọ pé agbègbè náà wà ní ààbò.", disclaimer: "Ní pàjáwìrì, tẹ̀lé aláṣẹ tó yẹ. Ojú-ìwé yìí kì í rọ́pò ìkìlọ̀ ìjọba.", save: "Fi pamọ́ bí agbègbè mi", saved: "Agbègbè mi. Tẹ̀ ẹ́ láti pa á rẹ́.", links: "Ojú-ìwé ìjọba", boundary: "Ààlà: geoBoundaries, láti BBS àti OCHA. CC BY 3.0 IGO.", missing: "Ààlà agbègbè kò ṣeé kó.", tip: "Ẹ̀ka òjò àti ìwárí satẹ́laiti." },
};

const DISTRICT_UI = {
  en: {
    loading: "Reading this district…",
    failed: "The district feed did not answer. Nothing was filled in.",
    current: "Current conditions",
    satellite: "Satellite observation",
    impact: "How this could affect the day",
    category: "Official rainfall category",
    reset: "Show all of Bangladesh",
    recent: "Updated recently",
    delayed: "Delayed data",
    unavailable: "Temporarily unavailable",
    off: "Not connected",
    none: "No relevant data found",
    expired: "Expired",
    power: "NASA POWER grid point on {day}: rain {rain} mm/day, temperature {temp} °C, humidity {humidity}%. About 8 days behind. One point near {lat}, {lon}. Not a district average and not IMERG.",
    powerOff: "Data currently unavailable from NASA POWER.",
    imerg: "NASA IMERG Early is not connected. The data directory requires an Earthdata login, so no rainfall grid was estimated.",
    firms: "{count} FIRMS thermal detections inside this district in the 24-hour file. Latest {when}, satellite {satellite}, confidence {confidence}. A detection is not every fire and not a warning.",
    firmsNear: " {near} more sit within about 15 km of the boundary, outside the district.",
    firmsNone: "No FIRMS detection in the 24-hour file falls inside this district.",
    firmsOff: "Data currently unavailable from NASA FIRMS.",
    forecast: "BMD rainfall forecast for {start} to {end}, issued {issued}. Category exactly as sent: {category}. Threshold {threshold} {unit}. Range {min}–{max} {unit}, average {avg}.",
    forecastOff: "Data currently unavailable from this source.",
    forecastNone: "No rainfall forecast row was returned for this district.",
    forecastOld: "The BMD rainfall forecast ended on {end}. It is not shown as active.",
    warn: "Rainfall category from the BMD forecast feed, not a separate emergency bulletin: {category}. Valid until {end}. Authority: Bangladesh Meteorological Department.",
    warnNone: "No active rainfall category was returned for this district.",
    ffwc: "Flood Forecasting and Warning Centre has no automated feed connected.",
    quake: "USGS past day, magnitude 4.5 and above: {count} inside this district. This is a catalog, not a government warning.",
    quakeNone: "No USGS magnitude 4.5+ earthquake from the past day falls inside this district.",
    impactForecast: "The forecast category for this period is {category}, up to {max} {unit}. This page does not turn that into a travel or safety instruction.",
    impactFire: "{count} satellite thermal detections were inside the district. That is not a fire warning.",
    impactNone: "No further daily-life note is added. A missing feed is not a statement that the district is safe.",
  },
  bn: {
    loading: "এই জেলার তথ্য আসছে…",
    failed: "জেলার ফিড সাড়া দেয়নি। কিছু বসানো হয়নি।",
    current: "এখনকার অবস্থা",
    satellite: "উপগ্রহ পর্যবেক্ষণ",
    impact: "দিনের ওপর কী প্রভাব পড়তে পারে",
    category: "সরকারি বৃষ্টির শ্রেণি",
    reset: "পুরো বাংলাদেশ দেখুন",
    recent: "সম্প্রতি আপডেট",
    delayed: "দেরি হওয়া তথ্য",
    unavailable: "এখন পাওয়া যাচ্ছে না",
    off: "যুক্ত নেই",
    none: "প্রাসঙ্গিক তথ্য পাওয়া যায়নি",
    expired: "মেয়াদ শেষ",
    power: "NASA POWER-এর একটি গ্রিড বিন্দু, {day}: বৃষ্টি {rain} মিমি/দিন, তাপমাত্রা {temp} °C, আর্দ্রতা {humidity}%। প্রায় ৮ দিন পিছিয়ে। বিন্দু {lat}, {lon}-এর কাছে। পুরো জেলার গড় নয় এবং IMERG নয়।",
    powerOff: "NASA POWER থেকে এখন তথ্য পাওয়া যাচ্ছে না।",
    imerg: "NASA IMERG Early যুক্ত নেই। ডেটা ফোল্ডারে Earthdata লগইন লাগে, তাই বৃষ্টির গ্রিড আন্দাজ করা হয়নি।",
    firms: "২৪ ঘণ্টার ফাইলে এই জেলার ভিতরে FIRMS-এর {count}টি তাপ শনাক্তকরণ। সর্বশেষ {when}, উপগ্রহ {satellite}, আস্থা {confidence}। এটা সব আগুন নয় এবং সতর্কতাও নয়।",
    firmsNear: " আর {near}টি সীমানার প্রায় ১৫ কিমির মধ্যে, জেলার বাইরে।",
    firmsNone: "২৪ ঘণ্টার ফাইলে এই জেলার ভিতরে কোনো FIRMS শনাক্তকরণ পড়েনি।",
    firmsOff: "NASA FIRMS থেকে এখন তথ্য পাওয়া যাচ্ছে না।",
    forecast: "BMD-র বৃষ্টির পূর্বাভাস {start} থেকে {end}, জারি {issued}। যে শ্রেণি পাঠানো হয়েছে: {category}। সীমা {threshold} {unit}। পরিসর {min}–{max} {unit}, গড় {avg}।",
    forecastOff: "এই উৎস থেকে এখন তথ্য পাওয়া যাচ্ছে না।",
    forecastNone: "এই জেলার জন্য বৃষ্টির পূর্বাভাসের সারি আসেনি।",
    forecastOld: "BMD-র বৃষ্টির পূর্বাভাস {end}-এ শেষ। সেটি সক্রিয় দেখানো হচ্ছে না।",
    warn: "BMD-র পূর্বাভাস ফিডের বৃষ্টির শ্রেণি, আলাদা জরুরি বিজ্ঞপ্তি নয়: {category}। {end} পর্যন্ত। কর্তৃপক্ষ: বাংলাদেশ আবহাওয়া অধিদপ্তর।",
    warnNone: "এই জেলার জন্য সক্রিয় বৃষ্টির শ্রেণি আসেনি।",
    ffwc: "বন্যা পূর্বাভাস ও সতর্কীকরণ কেন্দ্রের স্বয়ংক্রিয় ফিড যুক্ত নেই।",
    quake: "USGS-এর গত এক দিন, মাত্রা ৪.৫ বা বেশি: এই জেলায় {count}টি। এটা তালিকা, সরকারি সতর্কতা নয়।",
    quakeNone: "গত এক দিনের USGS মাত্রা ৪.৫+ ভূমিকম্প এই জেলার ভিতরে পড়েনি।",
    impactForecast: "এই সময়ের পূর্বাভাস শ্রেণি {category}, সর্বোচ্চ {max} {unit}। এটাকে যাত্রা বা নিরাপত্তার নির্দেশ বানানো হয়নি।",
    impactFire: "জেলার ভিতরে উপগ্রহের {count}টি তাপ শনাক্তকরণ। এটা আগুনের সতর্কতা নয়।",
    impactNone: "এর বেশি দৈনন্দিন নোট যোগ করা হয়নি। ফিড না থাকা মানে জেলা নিরাপদ নয়।",
  },
  hi: {
    loading: "यह ज़िला पढ़ा जा रहा है…",
    failed: "ज़िला फ़ीड ने उत्तर नहीं दिया। कुछ भरा नहीं गया।",
    current: "अभी की स्थिति",
    satellite: "उपग्रह अवलोकन",
    impact: "दिन पर क्या असर पड़ सकता है",
    category: "आधिकारिक वर्षा श्रेणी",
    reset: "पूरा बांग्लादेश दिखाएँ",
    recent: "हाल में अद्यतन",
    delayed: "देरी से आया डेटा",
    unavailable: "अभी उपलब्ध नहीं",
    off: "जुड़ा नहीं",
    none: "प्रासंगिक डेटा नहीं मिला",
    expired: "अवधि समाप्त",
    power: "NASA POWER ग्रिड बिंदु, {day}: वर्षा {rain} मिमी/दिन, तापमान {temp} °C, आर्द्रता {humidity}%। लगभग 8 दिन पीछे। बिंदु {lat}, {lon} के पास। ज़िले का औसत नहीं और IMERG नहीं।",
    powerOff: "NASA POWER से डेटा अभी उपलब्ध नहीं।",
    imerg: "NASA IMERG Early जुड़ा नहीं है। डेटा फ़ोल्डर को Earthdata लॉगिन चाहिए, इसलिए वर्षा ग्रिड नहीं बनाया गया।",
    firms: "24 घंटे की फ़ाइल में इस ज़िले के अंदर FIRMS की {count} ताप पहचान। नवीनतम {when}, उपग्रह {satellite}, विश्वास {confidence}। यह हर आग नहीं और चेतावनी नहीं।",
    firmsNear: " {near} और सीमा के लगभग 15 किमी के भीतर, ज़िले के बाहर।",
    firmsNone: "24 घंटे की फ़ाइल में इस ज़िले के अंदर कोई FIRMS पहचान नहीं।",
    firmsOff: "NASA FIRMS से डेटा अभी उपलब्ध नहीं।",
    forecast: "BMD वर्षा पूर्वानुमान {start} से {end}, जारी {issued}। भेजी गई श्रेणी: {category}। सीमा {threshold} {unit}। दायरा {min}–{max} {unit}, औसत {avg}।",
    forecastOff: "इस स्रोत से डेटा अभी उपलब्ध नहीं।",
    forecastNone: "इस ज़िले के लिए वर्षा पूर्वानुमान पंक्ति नहीं आई।",
    forecastOld: "BMD वर्षा पूर्वानुमान {end} को समाप्त हुआ। उसे सक्रिय नहीं दिखाया गया।",
    warn: "BMD पूर्वानुमान फ़ीड की वर्षा श्रेणी, अलग आपात बुलेटिन नहीं: {category}। {end} तक। प्राधिकरण: बांग्लादेश मौसम विभाग।",
    warnNone: "इस ज़िले के लिए सक्रिय वर्षा श्रेणी नहीं आई।",
    ffwc: "बाढ़ पूर्वानुमान केंद्र की स्वचालित फ़ीड जुड़ी नहीं है।",
    quake: "USGS पिछले दिन, परिमाण 4.5 या अधिक: इस ज़िले में {count}। यह सूची है, सरकारी चेतावनी नहीं।",
    quakeNone: "पिछले दिन का कोई USGS परिमाण 4.5+ भूकंप इस ज़िले के अंदर नहीं है।",
    impactForecast: "इस अवधि की पूर्वानुमान श्रेणी {category} है, अधिकतम {max} {unit}। इसे यात्रा या सुरक्षा आदेश नहीं बनाया गया।",
    impactFire: "ज़िले के अंदर उपग्रह की {count} ताप पहचान। यह आग की चेतावनी नहीं।",
    impactNone: "इससे आगे दैनिक नोट नहीं जोड़ा गया। फ़ीड का न होना सुरक्षा नहीं है।",
  },
  id: {
    loading: "Membaca distrik ini…",
    failed: "Umpan distrik tidak menjawab. Tidak ada yang diisi.",
    current: "Kondisi saat ini",
    satellite: "Pengamatan satelit",
    impact: "Apa artinya untuk hari ini",
    category: "Kategori hujan resmi",
    reset: "Tampilkan seluruh Bangladesh",
    recent: "Baru diperbarui",
    delayed: "Data tertunda",
    unavailable: "Sedang tidak tersedia",
    off: "Tidak terhubung",
    none: "Tidak ada data yang relevan",
    expired: "Kedaluwarsa",
    power: "Titik grid NASA POWER pada {day}: hujan {rain} mm/hari, suhu {temp} °C, kelembapan {humidity}%. Tertinggal sekitar 8 hari. Satu titik di dekat {lat}, {lon}. Bukan rata-rata distrik dan bukan IMERG.",
    powerOff: "Data NASA POWER sedang tidak tersedia.",
    imerg: "NASA IMERG Early tidak terhubung. Folder data meminta login Earthdata, jadi kisi hujan tidak diperkirakan.",
    firms: "{count} deteksi panas FIRMS di dalam distrik pada berkas 24 jam. Terbaru {when}, satelit {satellite}, keyakinan {confidence}. Ini bukan setiap kebakaran dan bukan peringatan.",
    firmsNear: " {near} lagi berada sekitar 15 km dari batas, di luar distrik.",
    firmsNone: "Tidak ada deteksi FIRMS dalam berkas 24 jam yang jatuh di dalam distrik ini.",
    firmsOff: "Data NASA FIRMS sedang tidak tersedia.",
    forecast: "Prakiraan hujan BMD untuk {start} sampai {end}, terbit {issued}. Kategori persis seperti yang dikirim: {category}. Ambang {threshold} {unit}. Rentang {min}–{max} {unit}, rata-rata {avg}.",
    forecastOff: "Data dari sumber ini sedang tidak tersedia.",
    forecastNone: "Tidak ada baris prakiraan hujan untuk distrik ini.",
    forecastOld: "Prakiraan hujan BMD berakhir pada {end}. Itu tidak ditampilkan sebagai aktif.",
    warn: "Kategori hujan dari umpan prakiraan BMD, bukan buletin darurat terpisah: {category}. Berlaku sampai {end}. Otoritas: Departemen Meteorologi Bangladesh.",
    warnNone: "Tidak ada kategori hujan aktif untuk distrik ini.",
    ffwc: "Umpan otomatis Pusat Prakiraan Banjir tidak terhubung.",
    quake: "USGS satu hari terakhir, magnitudo 4,5 ke atas: {count} di dalam distrik ini. Ini katalog, bukan peringatan pemerintah.",
    quakeNone: "Tidak ada gempa USGS magnitudo 4,5+ satu hari terakhir di dalam distrik ini.",
    impactForecast: "Kategori prakiraan periode ini adalah {category}, hingga {max} {unit}. Halaman ini tidak menjadikannya instruksi perjalanan atau keselamatan.",
    impactFire: "{count} deteksi panas satelit berada di dalam distrik. Itu bukan peringatan kebakaran.",
    impactNone: "Tidak ada catatan harian tambahan. Umpan yang kosong bukan tanda aman.",
  },
  ar: {
    loading: "تُقرأ هذه المنطقة…",
    failed: "لم يجب موجز المنطقة. لم يُملأ شيء.",
    current: "الحالة الحالية",
    satellite: "رصد الأقمار",
    impact: "ماذا قد يعني هذا لليوم",
    category: "فئة المطر الرسمية",
    reset: "أظهر كل بنغلاديش",
    recent: "حُدّث حديثًا",
    delayed: "بيانات متأخرة",
    unavailable: "غير متاح الآن",
    off: "غير متصل",
    none: "لا توجد بيانات ذات صلة",
    expired: "منتهٍ",
    power: "نقطة شبكة NASA POWER في {day}: مطر {rain} مم/يوم، حرارة {temp} °C، رطوبة {humidity}%. متأخر نحو 8 أيام. نقطة واحدة قرب {lat}، {lon}. ليس متوسط المنطقة وليس IMERG.",
    powerOff: "بيانات NASA POWER غير متاحة الآن.",
    imerg: "NASA IMERG Early غير متصل. مجلد البيانات يطلب دخول Earthdata، لذلك لم يُقدَّر شبكة مطر.",
    firms: "{count} رصد حراري من FIRMS داخل المنطقة في ملف 24 ساعة. الأحدث {when}، القمر {satellite}، الثقة {confidence}. هذا ليس كل حريق وليس تحذيرًا.",
    firmsNear: " و{near} أخرى على بعد نحو 15 كم من الحد، خارج المنطقة.",
    firmsNone: "لا يقع أي رصد FIRMS من ملف 24 ساعة داخل هذه المنطقة.",
    firmsOff: "بيانات NASA FIRMS غير متاحة الآن.",
    forecast: "توقع مطر BMD من {start} إلى {end}، صدر {issued}. الفئة كما أُرسلت: {category}. العتبة {threshold} {unit}. المدى {min}–{max} {unit}، المتوسط {avg}.",
    forecastOff: "البيانات غير متاحة من هذا المصدر الآن.",
    forecastNone: "لم تصل صف لتوقع المطر لهذه المنطقة.",
    forecastOld: "انتهى توقع مطر BMD في {end}. لا يُعرض كأنه سارٍ.",
    warn: "فئة مطر من موجز توقع BMD، وليست نشرة طوارئ منفصلة: {category}. حتى {end}. الجهة: إدارة الأرصاد في بنغلاديش.",
    warnNone: "لا توجد فئة مطر سارية لهذه المنطقة.",
    ffwc: "لا موجز آلي متصل لمركز توقع الفيضان.",
    quake: "USGS لليوم الماضي، قدر 4.5 فأكثر: {count} داخل هذه المنطقة. هذا فهرس وليس تحذيرًا حكوميًا.",
    quakeNone: "لا زلزال USGS بقدر 4.5 أو أكثر من اليوم الماضي داخل هذه المنطقة.",
    impactForecast: "فئة التوقع لهذه الفترة هي {category}، حتى {max} {unit}. لا تتحول هنا إلى تعليمات سفر أو سلامة.",
    impactFire: "{count} رصد حراري بالأقمار داخل المنطقة. هذا ليس تحذير حريق.",
    impactNone: "لا تُضاف ملاحظة يومية أخرى. غياب الموجز لا يعني أن المنطقة آمنة.",
  },
  yo: {
    loading: "Agbègbè yìí ń kà…",
    failed: "Ìjápọ̀ agbègbè kò dáhùn. Kò sí ohun tí a fi síbẹ̀.",
    current: "Ipò lọ́wọ́",
    satellite: "Àkíyèsí satẹ́laiti",
    impact: "Ohun tó lè kan ọjọ́ yìí",
    category: "Ẹ̀ka òjò ìjọba",
    reset: "Fi gbogbo Bangladesh hàn",
    recent: "Ṣẹ̀ṣẹ̀ ṣe àtúnṣe",
    delayed: "Dátà tó pẹ́",
    unavailable: "Kò sí nísinsìnyí",
    off: "Kò sopọ̀",
    none: "Kò sí dátà tó yẹ",
    expired: "Ó ti parí",
    power: "Ojú-ami NASA POWER ní {day}: òjò {rain} mm/ọjọ́, ìwọ̀n otútù {temp} °C, ọ̀rinrin {humidity}%. Ó pẹ́ tó ọjọ́ 8. Ojú-ami kan ní {lat}, {lon}. Kì í ṣe àpapọ̀ agbègbè, kì í sì í ṣe IMERG.",
    powerOff: "Dátà NASA POWER kò sí nísinsìnyí.",
    imerg: "NASA IMERG Early kò sopọ̀. Fódà dátà béèrè Earthdata, nítorí náà a kò ṣe àfojúsùn ojú-ami òjò.",
    firms: "Ìwárí ooru FIRMS {count} wà nínú agbègbè nínú fáìlì wákàtí 24. Tí ó ṣẹ̀ṣẹ̀ {when}, satẹ́laiti {satellite}, ìgbẹ́kẹ̀lé {confidence}. Èyí kì í ṣe gbogbo iná, kì í sì í ṣe ìkìlọ̀.",
    firmsNear: " {near} mìíràn wà ní nǹkan 15 km sí ààlà, lóde agbègbè.",
    firmsNone: "Kò sí ìwárí FIRMS nínú fáìlì wákàtí 24 tó wà nínú agbègbè yìí.",
    firmsOff: "Dátà NASA FIRMS kò sí nísinsìnyí.",
    forecast: "Àsọtẹ́lẹ̀ òjò BMD láti {start} sí {end}, tí a gbé jáde {issued}. Ẹ̀ka gangan: {category}. Ìdíwọ̀n {threshold} {unit}. Ìbùdó {min}–{max} {unit}, àpapọ̀ {avg}.",
    forecastOff: "Dátà kò sí láti orísun yìí nísinsìnyí.",
    forecastNone: "Kò sí ìlà àsọtẹ́lẹ̀ òjò fún agbègbè yìí.",
    forecastOld: "Àsọtẹ́lẹ̀ òjò BMD parí ní {end}. A kò fi hàn bí èyí tó ń ṣiṣẹ́.",
    warn: "Ẹ̀ka òjò láti inú àsọtẹ́lẹ̀ BMD, kì í ṣe ìkìlọ̀ pàjáwìrì ọtọ̀: {category}. Títí di {end}. Aláṣẹ: ilé-iṣẹ́ ojú-ọjọ́ Bangladesh.",
    warnNone: "Kò sí ẹ̀ka òjò tó ń ṣiṣẹ́ fún agbègbè yìí.",
    ffwc: "Ìjápọ̀ aládàáṣe ilé-iṣẹ́ ìkìlọ̀ ìkún omi kò sopọ̀.",
    quake: "USGS ọjọ́ tó kọjá, ìwọ̀n 4.5 sókè: {count} nínú agbègbè yìí. Àkójọ ni, kì í ṣe ìkìlọ̀ ìjọba.",
    quakeNone: "Kò sí ìwarìrì USGS ìwọ̀n 4.5+ ọjọ́ tó kọjá nínú agbègbè yìí.",
    impactForecast: "Ẹ̀ka àsọtẹ́lẹ̀ fún àkókò yìí ni {category}, tó {max} {unit}. A kò sọ ọ́ di àṣẹ ìrìn tàbí ààbò.",
    impactFire: "Ìwárí ooru satẹ́laiti {count} wà nínú agbègbè. Kì í ṣe ìkìlọ̀ iná.",
    impactNone: "Kò sí àkọsílẹ̀ ọjọ́ mìíràn. Àìsí ìjápọ̀ kì í túmọ̀ sí ààbò.",
  },
};

function du(key) {
  const pack = DISTRICT_UI[lang] || DISTRICT_UI.en;
  return pack[key] || DISTRICT_UI.en[key] || "";
}

const DISTRICT_CARDS = {
  en: { overview: "District alert overview", rain: "Rainfall", flood: "Flood", fire: "Fire detection", cyclone: "Cyclone", reading: "Reading…", off: "Not connected", found: "Detected", none: "Not Detected", missing: "No category returned", expired: "Expired", firms: "NASA FIRMS · satellite detection, not a warning", bmd: "BMD forecast · {day}", ffwc: "FFWC · no automated feed", bulletin: "No cyclone bulletin feed", auth: "Authentication required", sourceOff: "Source temporarily unavailable", cycloneNone: "No active official cyclone bulletin", cycloneNamed: "Official bulletin names this district", cycloneOther: "Bulletin does not name this district", floodAbove: "At or above danger level", floodBelow: "Below listed danger level", floodNone: "No station in this district", floodMeta: "FFWC API · {day}", cycloneMeta: "BMD INSTANT · {day}" },
  bn: { overview: "জেলার সতর্কতার সংক্ষেপ", rain: "বৃষ্টি", flood: "বন্যা", fire: "আগুনের খোঁজ", cyclone: "ঘূর্ণিঝড়", reading: "পড়ছে…", off: "যুক্ত নেই", found: "শনাক্ত হয়েছে", none: "শনাক্ত হয়নি", missing: "শ্রেণি আসেনি", expired: "মেয়াদ শেষ", firms: "NASA FIRMS · উপগ্রহের খোঁজ, সতর্কতা নয়", bmd: "BMD পূর্বাভাস · {day}", ffwc: "FFWC · স্বয়ংক্রিয় ফিড নেই", bulletin: "ঘূর্ণিঝড়ের বিজ্ঞপ্তি ফিড নেই", auth: "অনুমতি লাগে", sourceOff: "উৎস সাময়িকভাবে বন্ধ", cycloneNone: "কোনো সক্রিয় সরকারি ঘূর্ণিঝড় বিজ্ঞপ্তি নেই", cycloneNamed: "সরকারি বিজ্ঞপ্তিতে এই জেলার নাম আছে", cycloneOther: "বিজ্ঞপ্তিতে এই জেলার নাম নেই", floodAbove: "বিপদসীমায় বা তার উপরে", floodBelow: "দেওয়া বিপদসীমার নিচে", floodNone: "এই জেলায় কোনো স্টেশন নেই", floodMeta: "FFWC এপিআই · {day}", cycloneMeta: "BMD INSTANT · {day}" },
  hi: { overview: "ज़िला चेतावनी सार", rain: "वर्षा", flood: "बाढ़", fire: "आग की पहचान", cyclone: "चक्रवात", reading: "पढ़ रहा है…", off: "जुड़ा नहीं", found: "पहचाना गया", none: "पहचाना नहीं गया", missing: "श्रेणी नहीं आई", expired: "अवधि समाप्त", firms: "NASA FIRMS · उपग्रह पहचान, चेतावनी नहीं", bmd: "BMD पूर्वानुमान · {day}", ffwc: "FFWC · स्वचालित फ़ीड नहीं", bulletin: "चक्रवात बुलेटिन फ़ीड नहीं", auth: "प्रमाणीकरण चाहिए", sourceOff: "स्रोत अस्थायी रूप से बंद", cycloneNone: "कोई सक्रिय आधिकारिक चक्रवात बुलेटिन नहीं", cycloneNamed: "आधिकारिक बुलेटिन में इस ज़िले का नाम है", cycloneOther: "बुलेटिन में इस ज़िले का नाम नहीं", floodAbove: "खतरे के स्तर पर या ऊपर", floodBelow: "दिए गए खतरे के स्तर से नीचे", floodNone: "इस ज़िले में कोई स्टेशन नहीं", floodMeta: "FFWC एपीआई · {day}", cycloneMeta: "BMD INSTANT · {day}" },
  id: { overview: "Ringkasan peringatan distrik", rain: "Hujan", flood: "Banjir", fire: "Deteksi panas", cyclone: "Siklon", reading: "Membaca…", off: "Tidak terhubung", found: "Terdeteksi", none: "Tidak Terdeteksi", missing: "Kategori tidak ada", expired: "Kedaluwarsa", firms: "NASA FIRMS · deteksi satelit, bukan peringatan", bmd: "Prakiraan BMD · {day}", ffwc: "FFWC · tidak ada umpan otomatis", bulletin: "Tidak ada umpan buletin siklon", auth: "Perlu autentikasi", sourceOff: "Sumber sedang tidak tersedia", cycloneNone: "Tidak ada buletin siklon resmi yang aktif", cycloneNamed: "Buletin resmi menyebut distrik ini", cycloneOther: "Buletin tidak menyebut distrik ini", floodAbove: "Pada atau di atas batas bahaya", floodBelow: "Di bawah batas bahaya yang dikirim", floodNone: "Tidak ada stasiun di distrik ini", floodMeta: "API FFWC · {day}", cycloneMeta: "BMD INSTANT · {day}" },
  ar: { overview: "ملخص تنبيه المنطقة", rain: "المطر", flood: "الفيضان", fire: "رصد حراري", cyclone: "الإعصار", reading: "يُقرأ…", off: "غير متصل", found: "تم الرصد", none: "لم يتم الرصد", missing: "لم تصل فئة", expired: "منتهٍ", firms: "NASA FIRMS · رصد قمر، وليس تحذيرًا", bmd: "توقع BMD · {day}", ffwc: "FFWC · لا موجز آلي", bulletin: "لا موجز لنشرة الإعصار", auth: "يلزم تصريح", sourceOff: "المصدر غير متاح مؤقتًا", cycloneNone: "لا نشرة إعصار رسمية نشطة", cycloneNamed: "النشرة الرسمية تذكر هذه المنطقة", cycloneOther: "النشرة لا تذكر هذه المنطقة", floodAbove: "عند حد الخطر أو فوقه", floodBelow: "دون حد الخطر الوارد", floodNone: "لا محطة داخل هذه المنطقة", floodMeta: "واجهة FFWC · {day}", cycloneMeta: "BMD INSTANT · {day}" },
  yo: { overview: "Àkótán ìkìlọ̀ agbègbè", rain: "Òjò", flood: "Ìkún omi", fire: "Ìwárí ooru", cyclone: "Ìjì", reading: "Ń kà…", off: "Kò sopọ̀", found: "A ṣàwárí", none: "A kò ṣàwárí", missing: "Kò sí ẹ̀ka", expired: "Ó ti parí", firms: "NASA FIRMS · ìwárí satẹ́laiti, kì í ṣe ìkìlọ̀", bmd: "Àsọtẹ́lẹ̀ BMD · {day}", ffwc: "FFWC · kò sí ìjápọ̀ aládàáṣe", bulletin: "Kò sí ìjápọ̀ ìwé ìjì", auth: "Àṣẹ nílò", sourceOff: "Orísun kò sí fún ìgbà díẹ̀", cycloneNone: "Kò sí ìwé ìjì òṣìṣẹ́ tó ń lọ lọ́wọ́", cycloneNamed: "Ìwé òṣìṣẹ́ dárúko agbègbè yìí", cycloneOther: "Ìwé kò dárúko agbègbè yìí", floodAbove: "Ní òdìwọ̀n ewu tàbí lókè rẹ̀", floodBelow: "Lábẹ́ òdìwọ̀n ewu tí a ránṣẹ́", floodNone: "Kò sí ibùdó nínú agbègbè yìí", floodMeta: "API FFWC · {day}", cycloneMeta: "BMD INSTANT · {day}" },
};

function dcard(key) {
  if (key === "found") return t("detected");
  if (key === "none") return t("notDetected");
  const pack = DISTRICT_CARDS[lang] || DISTRICT_CARDS.en;
  return pack[key] || DISTRICT_CARDS.en[key] || "";
}

function dc(key) {
  const pack = DISTRICT_COPY[lang] || DISTRICT_COPY.en;
  return pack[key] || DISTRICT_COPY.en[key] || "";
}

function districtRecord(id) {
  const row = (typeof BD_DISTRICTS !== "undefined" && BD_DISTRICTS[id]) || null;
  if (!row) return null;
  return { id, en: row[0], bn: row[1], division: row[2] };
}

function districtLabel(id) {
  const row = districtRecord(id);
  if (!row) return id;
  return lang === "bn" ? row.bn : row.en;
}

function divisionLabel(id) {
  const row = (typeof BD_DIVISIONS !== "undefined" && BD_DIVISIONS.find((item) => item[0] === id)) || null;
  if (!row) return id;
  return lang === "bn" ? row[2] : row[1];
}

function districtIds() {
  return Object.keys(BD_DISTRICTS).sort((a, b) => districtLabel(a).localeCompare(districtLabel(b), lang === "bn" ? "bn" : "en"));
}

function paintDistrictPick() {
  const select = $("district-pick");
  if (!select || typeof BD_DISTRICTS === "undefined") return;
  const division = $("district-division") ? $("district-division").value : "all";
  select.replaceChildren();
  districtIds().forEach((id) => {
    const row = districtRecord(id);
    if (division && division !== "all" && row.division !== division) return;
    const option = document.createElement("option");
    option.value = id;
    option.textContent = districtLabel(id);
    select.appendChild(option);
  });
  if (![...select.options].some((option) => option.value === districtId) && districtRecord(districtId)) {
    const option = document.createElement("option");
    option.value = districtId;
    option.textContent = districtLabel(districtId);
    select.appendChild(option);
  }
  select.value = districtId;
}

function paintDistrictLayer() {
  if (!districtLayer) return;
  districtLayer.eachLayer((layer) => {
    const name = layer.feature.properties.shapeName;
    if (layer.getTooltip()) layer.setTooltipContent(districtLabel(name) + " · " + dc("tip"));
  });
  districtLayer.setStyle((feature) => {
    const on = feature.properties.shapeName === districtId;
    return {
      color: on ? "#8fd4f5" : "#7f93a8",
      weight: on ? 2.6 : 1,
      fillColor: on ? "#8fd4f5" : "#203044",
      fillOpacity: on ? 0.34 : 0.62,
    };
  });
}

let districtPayload = null;
let districtToken = 0;

function districtStatus(code) {
  return {
    recently_updated: du("recent"),
    delayed: du("delayed"),
    unavailable: du("unavailable"),
    not_connected: du("off"),
    authentication_required: dcard("auth"),
    no_relevant_data: du("none"),
    expired: du("expired"),
  }[code] || "";
}

function chipIcon(kind) {
  const paths = {
    rain: '<path d="M8 2v2.2M4.8 4.4 6.1 5.8M11.2 4.4 9.9 5.8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M8 6.6c-2 2.2-3 3.5-3 4.8a3 3 0 0 0 6 0c0-1.3-1-2.6-3-4.8Z" fill="currentColor"/>',
    flood: '<path d="M1.8 10.8c1.1-.9 2-.9 3 0s1.9.9 3 0 1.9-.9 3 0 1.9.9 3 0" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M1.8 7.2c1.1-.9 2-.9 3 0s1.9.9 3 0 1.9-.9 3 0 1.9.9 3 0" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>',
    fire: '<path d="M8 1.6s2 2 2 3.8c0 .9-.5 1.5-1.1 1.5.8-.2 1.6-1.1 1.6-2.2 1.4 1.2 2.4 2.9 2.4 4.6A4.9 4.9 0 0 1 8 14.2 4.9 4.9 0 0 1 3.1 9.3C3.1 6.8 5.3 4.4 8 1.6Z" fill="currentColor"/>',
    cyclone: '<circle cx="8" cy="8" r="1.7" fill="currentColor"/><path d="M8 2.4a4.6 4.6 0 0 1 4.2 2.6 3.2 3.2 0 0 0-4.2 3 4.6 4.6 0 0 1-4.2-2.6A3.2 3.2 0 0 0 8 2.4Zm0 11.2a4.6 4.6 0 0 1-4.2-2.6 3.2 3.2 0 0 0 4.2-3 4.6 4.6 0 0 1 4.2 2.6A3.2 3.2 0 0 0 8 13.6Z" fill="currentColor"/>',
  };
  return `<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">${paths[kind] || ""}</svg>`;
}

function rainTone(category) {
  const text = (category || "").toLowerCase();
  if (text.includes("very heavy")) return "critical";
  if (text.includes("moderately heavy")) return "moderate";
  if (text.includes("heavy")) return "high";
  if (text.includes("moderate")) return "moderate";
  if (category) return "info";
  return "off";
}

function overviewCard(spec) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "district-chip is-" + spec.tone + (spec.pulse ? " is-pulse" : "") + (spec.strong ? " is-pulse-strong" : "");
  button.dataset.target = spec.target;
  button.innerHTML = `<span class="chip-title">${chipIcon(spec.icon)}<span></span></span><p class="chip-status"></p><p class="chip-meta"></p>`;
  button.querySelector(".chip-title span").textContent = spec.title;
  button.querySelector(".chip-status").textContent = spec.status;
  button.querySelector(".chip-meta").textContent = spec.meta;
  return button;
}

function paintDistrictOverview(payload) {
  const root = $("district-overview-row");
  if (!root) return;
  if ($("district-overview-title")) $("district-overview-title").textContent = dcard("overview");
  const reading = !payload || payload.district !== districtId;
  root.replaceChildren();
  if (reading) {
    [
      ["rain", "district-forecast"],
      ["flood", "district-warn"],
      ["fire", "district-sat"],
      ["cyclone", "district-warn"],
    ].forEach((item) => {
      root.appendChild(overviewCard({ icon: item[0], title: dcard(item[0]), status: dcard("reading"), meta: "", tone: "off", target: item[1] }));
    });
    return;
  }
  const forecast = payload.forecast || {};
  const fires = payload.fires || {};
  const fireOff = fires.status === "unavailable";
  const fireFound = !fireOff && fires.count_inside > 0;
  let rainStatus = dcard("missing");
  let tone = "off";
  let pulse = false;
  let strong = false;
  if (forecast.status === "unavailable") rainStatus = du("unavailable");
  else if (forecast.status === "expired") rainStatus = dcard("expired");
  else if (forecast.active && forecast.category) {
    rainStatus = forecast.category;
    tone = rainTone(forecast.category);
    pulse = tone === "critical" || tone === "high";
    strong = tone === "critical";
  }
  root.append(
    overviewCard({ icon: "rain", title: dcard("rain"), status: rainStatus, meta: forecast.issued ? fill(dcard("bmd"), { day: forecast.issued }) : "BMD", tone, pulse, strong, target: "district-forecast" }),
    floodOverview(payload.flood),
    overviewCard({ icon: "fire", title: dcard("fire"), status: fireOff ? du("unavailable") : (fireFound ? t("detected") : t("notDetected")), meta: dcard("firms"), tone: fireOff ? "off" : (fireFound ? "info" : "quiet"), pulse: fireFound, target: "district-sat" }),
    cycloneOverview(payload.cyclone),
  );
}

function sourceDay(block) {
  const value = block && (block.checked_at || block.issued || block.newest_issued);
  return value ? String(value).slice(0, 16).replace("T", " ") : "";
}

function floodOverview(block) {
  const meta = fill(dcard("floodMeta"), { day: sourceDay(block) || "–" });
  if (block && block.reading === "above_danger") {
    return overviewCard({ icon: "flood", title: dcard("flood"), status: dcard("floodAbove"), meta, tone: "high", pulse: true, target: "district-warn" });
  }
  return overviewCard({ icon: "flood", title: dcard("flood"), status: dcard("floodBelow"), meta, tone: "quiet", target: "district-warn" });
}

function cycloneOverview(block) {
  const meta = fill(dcard("cycloneMeta"), { day: sourceDay(block) || "–" });
  if (block && block.reading === "named") {
    return overviewCard({ icon: "cyclone", title: dcard("cyclone"), status: dcard("cycloneNamed"), meta, tone: "critical", pulse: true, strong: true, target: "district-warn" });
  }
  if (block.reading === "other_district") {
    return overviewCard({ icon: "cyclone", title: dcard("cyclone"), status: dcard("cycloneOther"), meta, tone: "info", target: "district-warn" });
  }
  return overviewCard({ icon: "cyclone", title: dcard("cyclone"), status: dcard("none"), meta, tone: "quiet", target: "district-warn" });
}

function focusDistrictPart(id) {
  const main = document.querySelector("main");
  const el = $(id);
  if (!main || !el) return;
  const top = el.getBoundingClientRect().top - main.getBoundingClientRect().top + main.scrollTop - 12;
  main.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  document.querySelectorAll(".district-focus").forEach((node) => node.classList.remove("district-focus"));
  el.classList.add("district-focus");
  setTimeout(() => el.classList.remove("district-focus"), 1800);
}

function renderDistrictFacts(payload) {
  if (!payload || payload.district !== districtId || !$("district-obs")) return;
  const power = payload.power || {};
  const forecast = payload.forecast || {};
  const fires = payload.fires || {};
  const quakes = payload.earthquakes || {};
  const point = power.point || {};
  $("district-obs-label").textContent = du("current") + " · " + districtStatus(power.status);
  $("district-obs").textContent = power.status === "unavailable" || power.rain_mm_day == null
    ? du("powerOff")
    : fill(du("power"), {
      day: power.rain_day || power.temperature_day || "",
      rain: String(power.rain_mm_day),
      temp: power.temperature_c == null ? "—" : String(power.temperature_c),
      humidity: power.humidity_percent == null ? "—" : String(power.humidity_percent),
      lat: point.lat == null ? "" : String(point.lat),
      lon: point.lon == null ? "" : String(point.lon),
    });
  $("district-forecast-label").textContent = dc("forecast") + " · " + districtStatus(forecast.status);
  if (forecast.status === "unavailable") $("district-forecast").textContent = du("forecastOff");
  else if (forecast.status === "expired") $("district-forecast").textContent = fill(du("forecastOld"), { end: forecast.valid_end || "" });
  else if (!forecast.active) $("district-forecast").textContent = du("forecastNone");
  else {
    $("district-forecast").textContent = fill(du("forecast"), {
      start: forecast.valid_start || "",
      end: forecast.valid_end || "",
      issued: forecast.issued || "",
      category: forecast.category || "",
      threshold: forecast.threshold || "",
      unit: forecast.unit || "",
      min: forecast.minimum == null ? "—" : String(forecast.minimum),
      max: forecast.maximum == null ? "—" : String(forecast.maximum),
      avg: forecast.average == null ? "—" : String(forecast.average),
    });
  }
  const flood = payload.flood || {};
  const cyclone = payload.cyclone || {};
  $("district-warn-label").textContent = dc("warning");
  if (lang === "en") {
    $("district-warn").textContent = [flood.detail, cyclone.detail].filter(Boolean).join(" ") || dc("warningBody");
  } else {
    const floodState = flood.state || flood.status || "unavailable";
    let floodText = du("ffwc");
    if (floodState === "authentication_required") floodText = dcard("flood") + ": " + dcard("auth") + ". " + du("ffwc");
    else if (floodState === "unavailable" || floodState === "not_connected") floodText = du("ffwc");
    else if (flood.reading === "above_danger") floodText = dcard("flood") + ": " + dcard("floodAbove") + ".";
    else if (flood.reading === "below_danger") floodText = dcard("flood") + ": " + dcard("floodBelow") + ".";
    else floodText = dcard("flood") + ": " + dcard("floodNone") + ".";

    const cycState = cyclone.state || cyclone.status || "unavailable";
    let cycText = dcard("cyclone") + ": " + dcard("cycloneNone") + ".";
    if (cycState === "unavailable" || cycState === "not_connected") cycText = dcard("cyclone") + ": " + dcard("sourceOff") + ".";
    else if (cyclone.reading === "named") cycText = dcard("cyclone") + ": " + dcard("cycloneNamed") + ".";
    else if (cyclone.reading === "other_district") cycText = dcard("cyclone") + ": " + dcard("cycloneOther") + ".";
    $("district-warn").textContent = floodText + " " + cycText;
  }
  $("district-sat-label").textContent = du("satellite") + " · " + (fires.status === "unavailable" ? districtStatus(fires.status) : (fires.count_inside > 0 ? t("detected") : t("notDetected")));
  let satellite = fires.status === "unavailable" ? du("firmsOff") : (fires.count_inside
    ? fill(du("firms"), {
      count: String(fires.count_inside),
      when: (fires.latest && fires.latest.when) || "",
      satellite: (fires.latest && fires.latest.satellite) || "",
      confidence: (fires.latest && fires.latest.confidence) || "",
    })
    : du("firmsNone"));
  if (fires.count_near) satellite += fill(du("firmsNear"), { near: String(fires.count_near) });
  satellite += " " + ((lang === "en" && payload.imerg && payload.imerg.detail) ? payload.imerg.detail : du("imerg"));
  satellite += " " + (quakes.count ? fill(du("quake"), { count: String(quakes.count) }) : du("quakeNone"));
  $("district-sat").textContent = satellite;
  const notes = [];
  if (forecast.active && forecast.category) {
    notes.push(fill(du("impactForecast"), {
      category: forecast.category,
      max: forecast.maximum == null ? "—" : String(forecast.maximum),
      unit: forecast.unit || "",
    }));
  }
  if (fires.count_inside) notes.push(fill(du("impactFire"), { count: String(fires.count_inside) }));
  if (!notes.length) notes.push(du("impactNone"));
  $("district-impact-label").textContent = du("impact");
  $("district-impact").textContent = notes.join(" ");
  paintDistrictOverview(payload);
}

function loadDistrictFacts() {
  const token = ++districtToken;
  const asked = districtId;
  paintDistrictOverview(null);
  if ($("district-loading")) {
    $("district-loading").hidden = false;
    $("district-loading").textContent = du("loading");
  }
  fetch("./api/district?name=" + encodeURIComponent(asked)).then((response) => {
    if (!response.ok) throw new Error("district");
    return response.json();
  }).then((payload) => {
    if (token !== districtToken || asked !== districtId) return;
    districtPayload = payload;
    renderDistrictFacts(payload);
  }).catch(() => {
    if (token !== districtToken || !$("district-obs")) return;
    $("district-obs").textContent = du("failed");
  }).finally(() => {
    if (token === districtToken && $("district-loading")) $("district-loading").hidden = true;
  });
}

function paintDistrictCard() {
  const row = districtRecord(districtId);
  if (!$("district-name") || !row) return;
  $("district-name").textContent = districtLabel(districtId);
  $("district-meta").textContent = divisionLabel(row.division);
  $("district-obs-label").textContent = du("current");
  $("district-forecast-label").textContent = dc("forecast");
  $("district-warn-label").textContent = du("category");
  if ($("district-sat-label")) $("district-sat-label").textContent = du("satellite");
  if ($("district-impact-label")) $("district-impact-label").textContent = du("impact");
  if ($("district-reset")) $("district-reset").textContent = du("reset");
  if ($("district-trend")) $("district-trend").textContent = t("navTrends") || "Climate Trends";
  $("district-disclaimer").textContent = dc("disclaimer");
  let saved = "";
  try { saved = localStorage.getItem("mci-district") || ""; } catch (error) {}
  $("district-save").textContent = saved === districtId ? dc("saved") : dc("save");
  $("district-links-label").textContent = dc("links");
  const links = $("district-links");
  links.replaceChildren();
  [
    ["Bangladesh Meteorological Department", "https://bmd.gov.bd/"],
    ["Flood Forecasting and Warning Centre", "https://ffwc.gov.bd/"],
    ["Department of Disaster Management weather page", "https://rapid.ddm.gov.bd/home/weather"],
  ].forEach((item) => {
    const link = document.createElement("a");
    link.href = item[1];
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = item[0];
    links.appendChild(link);
  });
  if (districtPayload && districtPayload.district === districtId) renderDistrictFacts(districtPayload);
  else loadDistrictFacts();
}

function chooseDistrict(id, zoom) {
  const row = districtRecord(id);
  if (!row) return;
  districtId = id;
  const division = $("district-division");
  if (division && division.value !== "all" && division.value !== row.division) division.value = row.division;
  paintDistrictPick();
  paintDistrictCard();
  paintDistrictLayer();
  if (zoom && districtMap && districtLayer) {
    districtLayer.eachLayer((layer) => {
      if (layer.feature.properties.shapeName === id) districtMap.fitBounds(layer.getBounds(), { padding: [48, 48], maxZoom: 8 });
    });
  }
}

function paintDistrictChrome() {
  if (!$("district-title") || typeof BD_DISTRICTS === "undefined") return;
  paintWithFlag($("district-title"), dc("title"));
  $("district-note").textContent = dc("note");
  $("district-division-label").textContent = dc("division");
  $("district-pick-label").textContent = dc("pick");
  $("district-boundary").textContent = dc("boundary");
  const division = $("district-division");
  const keep = division.value || "all";
  division.replaceChildren();
  const all = document.createElement("option");
  all.value = "all";
  all.textContent = dc("all");
  division.appendChild(all);
  BD_DIVISIONS.forEach((item) => {
    const option = document.createElement("option");
    option.value = item[0];
    option.textContent = lang === "bn" ? item[2] : item[1];
    division.appendChild(option);
  });
  if ([...division.options].some((option) => option.value === keep)) division.value = keep;
  paintDistrictPick();
  paintDistrictCard();
  paintDistrictLayer();
}

function mountDistrictMap() {
  if (!$("district-map") || typeof L === "undefined") return;
  if (!districtGeo) return;
  if (!districtMap) {
    districtMap = L.map("district-map", { scrollWheelZoom: false, minZoom: 6, maxZoom: 10 }).setView([23.7, 90.3], 7);
    districtMap.attributionControl.setPrefix(false);
    districtMap.attributionControl.addAttribution("geoBoundaries · BBS · OCHA");
    districtLayer = L.geoJSON(districtGeo, {
      onEachFeature: (feature, layer) => {
        const name = feature.properties.shapeName;
        layer.bindTooltip(districtLabel(name) + " · " + dc("tip"), { sticky: true });
        layer.on("click", () => chooseDistrict(name, false));
      },
    }).addTo(districtMap);
    paintDistrictLayer();
  }
  districtMap.invalidateSize();
  if (!mountDistrictMap.fitted) {
    districtMap.fitBounds(districtLayer.getBounds(), { padding: [8, 8] });
    mountDistrictMap.fitted = true;
  }
  chooseDistrict(districtId, false);
}

function bindDistrictCenter() {
  if (!$("district-map") || bindDistrictCenter.ready || typeof BD_DISTRICTS === "undefined") return;
  bindDistrictCenter.ready = true;
  try {
    const saved = localStorage.getItem("mci-district");
    if (saved && BD_DISTRICTS[saved]) districtId = saved;
  } catch (error) {}
  $("district-division").addEventListener("change", () => {
    const division = $("district-division").value;
    const row = districtRecord(districtId);
    if (division !== "all" && row && row.division !== division) {
      const named = districtIds().find((id) => {
        const item = districtRecord(id);
        const divisionRow = BD_DIVISIONS.find((entry) => entry[0] === division);
        return item.division === division && divisionRow && item.en === divisionRow[1];
      });
      const first = named || districtIds().find((id) => districtRecord(id).division === division);
      if (first) {
        chooseDistrict(first, true);
        return;
      }
    }
    paintDistrictPick();
  });
  $("district-pick").addEventListener("change", () => chooseDistrict($("district-pick").value, true));
  $("district-overview-row").addEventListener("click", (event) => {
    const button = event.target.closest(".district-chip");
    if (button) focusDistrictPart(button.dataset.target);
  });
  $("district-reset").addEventListener("click", () => {
    if (districtMap && districtLayer) districtMap.fitBounds(districtLayer.getBounds(), { padding: [12, 12] });
  });
  if ($("district-trend")) {
    $("district-trend").addEventListener("click", () => {
      if ($("pair")) $("pair").value = "bangladesh";
      preferLinesCountry();
      paintHomeChrome();
      setView("trends");
      load(false);
    });
  }
  $("district-save").addEventListener("click", () => {
    try {
      if (localStorage.getItem("mci-district") === districtId) localStorage.removeItem("mci-district");
      else localStorage.setItem("mci-district", districtId);
    } catch (error) {}
    paintDistrictCard();
  });
  paintDistrictChrome();
  if (typeof L === "undefined") {
    $("district-boundary").textContent = dc("missing");
    return;
  }
  fetch("./bd_districts.geojson").then((response) => {
    if (!response.ok) throw new Error("boundaries");
    return response.json();
  }).then((geo) => {
    districtGeo = geo;
    if (view === "districts") mountDistrictMap();
  }).catch(() => {
    $("district-boundary").textContent = dc("missing");
  });
}

fillYears();
paintChrome();
setView("home");
bindDistrictCenter();
bindHomeDepth();
showTour();
setInterval(paintClock, 1000);
$("home-quick").addEventListener("submit", startHomeCheck);
loadPairs().then(() => {
  loadSnapshot();
  return load(false);
}).catch(() => {
  $("status").textContent = t("errorTitle") + " " + t("errorBody");
  $("status").className = "status error";
});
