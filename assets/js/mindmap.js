/* Paper Archive bubble mind map
 * mindmap.json(논문 front matter에서 자동 생성)을 읽어 방사형 버블 맵을 그립니다.
 * 계층: 가운데 → 분야(field) → 주제(topic) → 접근 방법(approach) → 논문
 */
(function () {
  const svgEl = document.getElementById("mindmap");
  if (!svgEl || typeof d3 === "undefined") return;

  const PALETTES = {
    lavender: { fill: ["#BDB8F0", "#D4D0F6", "#E6E3FB"], ink: "#3C3489", line: "#9A93E6" },
    mint:     { fill: ["#9FDCC6", "#BDE8D8", "#D8F2E8"], ink: "#0F5240", line: "#6CC4A6" },
    babypink: { fill: ["#F5B8CC", "#F8CFDC", "#FBE3EB"], ink: "#7A2848", line: "#EC94B2" },
    butter:   { fill: ["#F7DC8C", "#FAE8B0", "#FCF2D4"], ink: "#6B4E0A", line: "#E5C25A" },
    lilac:    { fill: ["#E3B5DD", "#ECCBE7", "#F5E1F2"], ink: "#6A2A60", line: "#D38BC8" },
    peach:    { fill: ["#F9B99A", "#FBCFB8", "#FDE3D5"], ink: "#7A2E12", line: "#F29A72" }
  };
  const ORDER = ["lavender", "mint", "babypink", "butter", "lilac", "peach"];
  const CENTER = { fill: "#A8DCE7", ink: "#1F4C57", line: "#8CC5D2" };

  // 크기와 배치 (논문이 많아지면 여기 값들을 조절)
  const RAD_OVERVIEW = [56, 48, 40, 36, 34];      // 가운데, 분야, 주제, 접근, 논문
  const RING_OVERVIEW = [0, 145, 240, 325, 405];
  const RAD_FOCUS = [60, 46, 40, 36];             // 확대: 분야, 주제, 접근, 논문
  const RING_FOCUS = [0, 135, 235, 330];
  const BASE_WIDTH = 760;

  const cap = document.getElementById("mm-caption");
  const back = document.getElementById("mm-back");
  const DEFAULT_CAPTION = cap ? cap.textContent : "";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const say = (t) => { if (cap) cap.textContent = t; };

  fetch(svgEl.dataset.src)
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(build)
    .catch(() => say("마인드맵 데이터를 불러오지 못했어요. mindmap.json이 생성됐는지 확인해 주세요."));

  // 긴 이름을 버블 안에 들어가게 줄바꿈 (최대 3줄)
  function wrap(text, max) {
    // 너무 긴 단어는 하이픈 뒤에서 끊을 수 있게 나눔 (Physics-based → Physics- / based)
    const words = String(text || "").trim().split(/\s+/)
      .flatMap((w) => (w.length > max && w.includes("-") ? w.split(/(?<=-)/) : [w]));
    const lines = [];
    let cur = "";
    for (const w of words) {
      const next = cur.endsWith("-") ? cur + w : cur + " " + w;
      if (!cur) cur = w;
      else if (next.length <= max) cur = next;
      else { lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    const out = lines.slice(0, 3).map((l) => (l.length > max + 2 ? l.slice(0, max) + "…" : l));
    if (lines.length > 3 && !out[2].endsWith("…")) out[2] += "…";
    return out;
  }

  function groupBy(arr, key) {
    const m = new Map();
    arr.forEach((x) => { const k = x[key]; if (!m.has(k)) m.set(k, []); m.get(k).push(x); });
    return m;
  }

  function build(json) {
    const papers = (json.papers || []).filter((p) => p.field && p.topic && p.approach);
    if (!papers.length) {
      say("아직 논문이 없어요. _papers 폴더에 첫 논문을 추가하면 여기에 버블이 생겨요.");
      return;
    }

    // 분야 순서와 색 배정: _data/fields.yml 순서 우선, 나머지는 등장 순서
    const order = [];
    const palOf = {};
    (json.fields || []).forEach((f) => {
      if (!f || !f.name) return;
      order.push(f.name);
      if (f.palette && PALETTES[f.palette]) palOf[f.name] = f.palette;
    });
    papers.forEach((p) => { if (!order.includes(p.field)) order.push(p.field); });
    const used = new Set(Object.values(palOf));
    const free = ORDER.filter((p) => !used.has(p));
    let fk = 0;
    order.forEach((n) => {
      if (!palOf[n]) palOf[n] = free.length ? free[fk++ % free.length] : ORDER[fk++ % ORDER.length];
    });

    // 트리 데이터 구성
    const root = { name: json.center || "Paper Archive", children: [] };
    order.forEach((fieldName) => {
      const fp = papers.filter((p) => p.field === fieldName);
      if (!fp.length) return;
      const field = { name: fieldName, pal: palOf[fieldName], children: [] };
      groupBy(fp, "topic").forEach((tp, topicName) => {
        const topic = { name: topicName, children: [] };
        groupBy(tp, "approach").forEach((ap, approachName) => {
          topic.children.push({
            name: approachName,
            children: ap.map((p) => ({ name: p.short || p.title, title: p.title, url: p.url, paper: true }))
          });
        });
        field.children.push(topic);
      });
      root.children.push(field);
    });

    draw(root);
  }

  function draw(data) {
    const tree = d3.tree().size([2 * Math.PI, 1]).separation((a, b) => (a.parent === b.parent ? 1 : 1.4));
    const h = d3.hierarchy(data);
    tree(h);

    let uid = 0;
    const all = [];
    h.each((d) => {
      d.id = ++uid;
      if (d.depth === 1) d.pal = PALETTES[d.data.pal];
      if (d.depth > 1) d.pal = d.parent.pal;
      const a = d.x - Math.PI / 2;
      const r = RING_OVERVIEW[d.depth];
      d.ox = Math.cos(a) * r; d.oy = Math.sin(a) * r;
      d.tx = d.ox; d.ty = d.oy; d.x = d.ox; d.y = d.oy;
      all.push(d);
    });
    h.fx = 0; h.fy = 0;

    let focus = null;
    const R = (d) => (focus ? RAD_FOCUS[d.depth - focus.depth] : RAD_OVERVIEW[d.depth]);
    const label = (d) => d.data.name;
    const isPaper = (d) => !!d.data.paper;

    const svg = d3.select(svgEl);
    const gL = svg.append("g");
    const gN = svg.append("g");

    // 전체 보기에서는 가운데와 분야만, 분야를 누르면 그 분야 전체를 확대
    const visible = () => (focus ? focus.descendants() : all.filter((d) => d.depth < 2));
    const linksOf = (v) => {
      const s = new Set(v);
      return v.filter((d) => d.parent && s.has(d.parent)).map((d) => ({ source: d.parent, target: d }));
    };

    let nodes = visible();
    const sim = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(linksOf(nodes)).distance((l) => R(l.source) + R(l.target) + 30).strength(0.5))
      .force("collide", d3.forceCollide((d) => R(d) + 7).iterations(3))
      .force("x", d3.forceX((d) => d.tx).strength(0.12))
      .force("y", d3.forceY((d) => d.ty).strength(0.12))
      .force("charge", d3.forceManyBody().strength(-40))
      .stop();
    for (let k = 0; k < 300; k++) sim.tick();

    function fit() {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      nodes.forEach((d) => {
        const r = R(d) + 12;
        x0 = Math.min(x0, d.x - r); y0 = Math.min(y0, d.y - r);
        x1 = Math.max(x1, d.x + r); y1 = Math.max(y1, d.y + r);
      });
      const w = Math.max(BASE_WIDTH, x1 - x0), cx = (x0 + x1) / 2;
      svg.attr("viewBox", `${cx - w / 2} ${y0} ${w} ${y1 - y0}`);
    }

    function writeLabel(sel, d, color) {
      const big = d.depth <= 1;
      const ls = wrap(label(d), isPaper(d) ? 9 : big ? 12 : 11);
      const lh = big ? 17 : 15;
      ls.forEach((t, k) => {
        sel.append("text")
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "central")
          .attr("y", (k - (ls.length - 1) / 2) * lh)
          .style("font-size", d.depth === 0 ? "16px" : big ? "14px" : "12.5px")
          .style("font-weight", big ? 700 : isPaper(d) ? 500 : 600)
          .style("fill", color)
          .text(t);
      });
    }

    function run() {
      nodes = visible();
      sim.nodes(nodes);
      sim.force("link").links(linksOf(nodes));
      render();
      if (reduce) { sim.alpha(1); for (let k = 0; k < 300; k++) sim.tick(); position(); }
      else sim.alpha(0.9).restart();
    }

    function enterFocus(f) {
      focus = f;
      h.fx = null; h.fy = null; f.fx = 0; f.fy = 0;
      const local = d3.hierarchy(f.data);
      tree(local);
      const src = f.descendants(), loc = local.descendants();
      src.forEach((d, k) => {
        const a = loc[k].x - Math.PI / 2, r = RING_FOCUS[d.depth - f.depth];
        d.tx = Math.cos(a) * r; d.ty = Math.sin(a) * r;
        if (!nodes.includes(d)) { d.x = f.x; d.y = f.y; }
      });
      if (back) back.hidden = false;
      say(`${label(f)} 분야를 확대했어요. 가운데 버블이나 전체 보기를 누르면 돌아가요.`);
      run();
    }

    function exitFocus() {
      const f = focus;
      focus = null;
      f.fx = null; f.fy = null; h.fx = 0; h.fy = 0; h.x = 0; h.y = 0;
      all.forEach((d) => { d.tx = d.ox; d.ty = d.oy; });
      all.forEach((d) => { if (d.depth >= 1 && d.pal === f.pal) { d.x = d.ox * 0.6; d.y = d.oy * 0.6; } });
      if (back) back.hidden = true;
      say(DEFAULT_CAPTION);
      run();
    }

    function act(d) {
      if (isPaper(d)) { window.location.href = d.data.url; return; }
      if (focus) { if (d === focus) exitFocus(); return; }
      if (d.depth === 1) enterFocus(d);
    }

    const clickable = (d) => isPaper(d) || (focus ? d === focus : d.depth === 1);
    const ariaLabel = (d) => {
      const n = isPaper(d) ? d.data.title : label(d);
      if (!clickable(d)) return n;
      if (isPaper(d)) return `${n} 논문 페이지 열기`;
      if (d === focus) return `${n}, 전체 보기로 돌아가기`;
      return `${n} 분야 확대 (논문 ${d.leaves().length}편)`;
    };

    function render() {
      const L = gL.selectAll("line").data(linksOf(nodes), (l) => l.target.id);
      L.exit().remove();
      L.enter().append("line")
        .attr("stroke", (l) => (l.source.depth === 0 ? CENTER.line : l.target.pal.line))
        .attr("stroke-width", 1.6)
        .attr("stroke-opacity", 0.75)
        .attr("stroke-linecap", "round");

      const N = gN.selectAll("g.nd").data(nodes, (d) => d.id);
      N.exit().remove();
      const en = N.enter().append("g").attr("class", "nd");

      en.each(function (d) {
        const g = d3.select(this);
        if (isPaper(d)) {
          g.append("title").text(d.data.title);
          g.append("circle").attr("class", "bub").attr("r", R(d))
            .style("fill", "var(--surface)").attr("stroke", d.pal.line).attr("stroke-width", 1.6);
          writeLabel(g, d, "var(--text)");
          return;
        }
        const fill = d.depth === 0 ? CENTER.fill : d.pal.fill[d.depth - 1];
        const ink = d.depth === 0 ? CENTER.ink : d.pal.ink;
        g.append("circle").attr("class", "bub").attr("r", R(d)).attr("fill", fill).attr("stroke", ink).attr("stroke-width", 0);
        writeLabel(g, d, ink);
        if (d.depth === 1) {
          const b = g.append("g").attr("class", "badge");
          const bx = RAD_OVERVIEW[1] * 0.72, by = -RAD_OVERVIEW[1] * 0.72;
          b.append("circle").attr("cx", bx).attr("cy", by).attr("r", 11).attr("fill", d.pal.line);
          b.append("text").attr("x", bx).attr("y", by).attr("text-anchor", "middle").attr("dominant-baseline", "central")
            .style("font-size", "11px").style("font-weight", 700).style("fill", "#FFFFFF").text(d.leaves().length);
        }
      });

      en.on("click", (e, d) => act(d))
        .on("keydown", (e, d) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(d); } });

      gN.selectAll("g.nd").each(function (d) {
        const g = d3.select(this);
        g.select("circle.bub").transition().duration(reduce ? 0 : 350).attr("r", R(d));
        g.select("g.badge").style("display", focus ? "none" : null);
        if (clickable(d)) g.attr("tabindex", 0).attr("role", "button");
        else g.attr("tabindex", null).attr("role", null);
        g.attr("aria-label", ariaLabel(d));
      });

      position();
    }

    function position() {
      gL.selectAll("line")
        .attr("x1", (l) => l.source.x).attr("y1", (l) => l.source.y)
        .attr("x2", (l) => l.target.x).attr("y2", (l) => l.target.y);
      gN.selectAll("g.nd").attr("transform", (d) => `translate(${d.x},${d.y})`);
      fit();
    }

    if (back) back.addEventListener("click", () => { if (focus) exitFocus(); });
    sim.on("tick", position);
    render();
  }
})();
