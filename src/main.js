const loadingOverlay = document.getElementById('loadingOverlay');

fetch('./data/SpotifyFeatures.csv')
  .then(res => res.text())
  .then(csvText => {
    loadingOverlay.style.display = 'none';
    const data = Papa.parse(csvText, { header: true, dynamicTyping: true }).data;
    renderCharts(data);
  })
  .catch(err => {
    console.error(err);
    loadingOverlay.innerText = 'Erro ao carregar dados.';
  });

function renderCharts(data) {
  const width = 600, height = 400, margin = { top: 40, right: 30, bottom: 50, left: 70 };

  // Agrupar por gênero e calcular popularidade média
  const genreMap = d3.group(data, d => d.genre);
  const genreStats = Array.from(genreMap, ([genre, tracks]) => ({
    genre,
    popularity: d3.mean(tracks, d => d.popularity)
  })).sort((a, b) => d3.descending(a.popularity, b.popularity));

  // Gráfico 1 – Popularidade por Gênero
  const svg1 = d3.select("#chart1")
    .append("svg")
    .attr("width", width).attr("height", height);

  const x1 = d3.scaleBand()
    .domain(genreStats.map(d => d.genre))
    .range([margin.left, width - margin.right])
    .padding(0.2);

  const y1 = d3.scaleLinear()
    .domain([0, d3.max(genreStats, d => d.popularity)]).nice()
    .range([height - margin.bottom, margin.top]);

  svg1.append("g")
    .selectAll("rect")
    .data(genreStats)
    .join("rect")
    .attr("x", d => x1(d.genre))
    .attr("y", d => y1(d.popularity))
    .attr("height", d => y1(0) - y1(d.popularity))
    .attr("width", x1.bandwidth())
    .attr("fill", "#69b3a2");

  svg1.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x1))
    .selectAll("text")
    .attr("transform", "rotate(-40)")
    .style("text-anchor", "end");

  svg1.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y1));

  svg1.append("text")
    .attr("x", width / 2).attr("y", margin.top / 2)
    .attr("text-anchor", "middle").text("Popularidade média por Gênero");

  // Gráfico 2 – Scatter Plot Valence vs Popularidade
  const svg2 = d3.select("#chart2")
    .append("svg")
    .attr("width", width).attr("height", height);

  const x2 = d3.scaleLinear().domain([0, 1]).range([margin.left, width - margin.right]);
  const y2 = d3.scaleLinear().domain([0, 100]).range([height - margin.bottom, margin.top]);

  svg2.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x2).ticks(10));

  svg2.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y2));

  svg2.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", d => x2(d.valence))
    .attr("cy", d => y2(d.popularity))
    .attr("r", 3)
    .attr("fill", "#ff7f0e")
    .attr("opacity", 0.6);

  svg2.append("text")
    .attr("x", width / 2).attr("y", margin.top / 2)
    .attr("text-anchor", "middle").text("Valence vs Popularidade");

  // Gráfico 3 – Top 10 Artistas Populares
  const artistMap = d3.group(data, d => d.artist_name);
  const artistStats = Array.from(artistMap, ([artist, tracks]) => ({
    artist,
    popularity: d3.mean(tracks, d => d.popularity)
  })).sort((a, b) => d3.descending(a.popularity, b.popularity)).slice(0, 10);

  const svg3 = d3.select("#chart3")
    .append("svg")
    .attr("width", width).attr("height", height);

  const y3 = d3.scaleBand()
    .domain(artistStats.map(d => d.artist))
    .range([margin.top, height - margin.bottom])
    .padding(0.2);

  const x3 = d3.scaleLinear()
    .domain([0, d3.max(artistStats, d => d.popularity)]).nice()
    .range([margin.left, width - margin.right]);

  svg3.append("g")
    .selectAll("rect")
    .data(artistStats)
    .join("rect")
    .attr("x", margin.left)
    .attr("y", d => y3(d.artist))
    .attr("height", y3.bandwidth())
    .attr("width", d => x3(d.popularity) - margin.left)
    .attr("fill", "#1f77b4");

  svg3.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y3));

  svg3.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x3));

  svg3.append("text")
    .attr("x", width / 2).attr("y", margin.top / 2)
    .attr("text-anchor", "middle").text("Top 10 Artistas mais Populares");

  // Gráfico 4 – Atributos Médios por Gênero
  const atributos = ['valence', 'energy', 'danceability'];

  const grouped = Array.from(genreMap, ([genre, tracks]) => {
    const obj = { genre };
    atributos.forEach(attr => obj[attr] = d3.mean(tracks, d => d[attr]));
    return obj;
  });

  const svg4 = d3.select("#chart4")
    .append("svg")
    .attr("width", width).attr("height", height + 100);

  const x4 = d3.scaleBand()
    .domain(grouped.map(d => d.genre))
    .range([margin.left, width - margin.right])
    .padding(0.2);

  const y4 = d3.scaleLinear()
    .domain([0, 1])
    .range([height - margin.bottom, margin.top]);

  const color = d3.scaleOrdinal()
    .domain(atributos)
    .range(["#e41a1c", "#377eb8", "#4daf4a"]);

  atributos.forEach((attr, i) => {
    svg4.selectAll(`.bar-${attr}`)
      .data(grouped)
      .join("rect")
      .attr("x", d => x4(d.genre) + i * (x4.bandwidth() / atributos.length))
      .attr("y", d => y4(d[attr]))
      .attr("width", x4.bandwidth() / atributos.length)
      .attr("height", d => y4(0) - y4(d[attr]))
      .attr("fill", color(attr));
  });

  svg4.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x4))
    .selectAll("text")
    .attr("transform", "rotate(-40)").style("text-anchor", "end");

  svg4.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y4));

  svg4.append("text")
    .attr("x", width / 2).attr("y", margin.top / 2)
    .attr("text-anchor", "middle").text("Atributos por Gênero (valence, energy, danceability)");

  // Legenda
  const legend = svg4.append("g").attr("transform", `translate(${margin.left},${height + 10})`);
  atributos.forEach((attr, i) => {
    legend.append("rect")
      .attr("x", i * 120).attr("y", 0).attr("width", 15).attr("height", 15)
      .attr("fill", color(attr));
    legend.append("text")
      .attr("x", i * 120 + 20).attr("y", 12).text(attr);
  });
}
