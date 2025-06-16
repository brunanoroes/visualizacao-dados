const loadingOverlay = document.getElementById('loadingOverlay');
const chartContainer = d3.select("#chart");
const chartSelector = document.getElementById("chartSelector");

let dataset = null;

// Carrega CSV e inicia
fetch('./data/SpotifyFeatures.csv')
  .then(res => {
    if (!res.ok) throw new Error("CSV não encontrado.");
    return res.text();
  })
  .then(csvText => {
    loadingOverlay.style.display = 'none';
    dataset = Papa.parse(csvText, { header: true, dynamicTyping: true }).data;
    renderChartBySelection(chartSelector.value);
  })
  .catch(err => {
    console.error(err);
    loadingOverlay.innerText = 'Erro ao carregar dados.';
  });

// Lida com troca no dropdown para trocar gráfico
chartSelector.addEventListener("change", e => {
  if (!dataset) return;
  renderChartBySelection(e.target.value);
});

function renderChartBySelection(selection) {
  loadingOverlay.style.display = 'flex'; // mostra loading

  setTimeout(() => {
    chartContainer.selectAll("*").remove(); // limpa gráfico antigo

    switch(selection) {
      case "popularidadeGenero":
        renderBarChartGenrePopularity(dataset);
        break;
      case "valencePopularidade":
        renderScatterValencePopularity(dataset);
        break;
      case "topArtistas":
        renderTopArtists(dataset);
        break;
      case "atributosGenero":
        renderAvgAttributesByGenre(dataset);
        break;
      default:
        chartContainer.append("p").text("Opção inválida.");
    }

    loadingOverlay.style.display = 'none'; // esconde loading
  }, 50); // 50ms pra browser conseguir pintar o overlay
}

// Gráfico 1: Popularidade média por gênero
function renderBarChartGenrePopularity(data) {
  const width = 700, height = 400, margin = { top: 40, right: 30, bottom: 70, left: 70 };

  const svg = chartContainer.append("svg")
    .attr("width", width)
    .attr("height", height);

  // Agrupar por gênero e média de popularidade
  const genreMap = d3.group(data, d => d.genre);
  const genreStats = Array.from(genreMap, ([genre, tracks]) => ({
    genre,
    value: d3.mean(tracks, d => d.popularity)
  })).sort((a, b) => d3.descending(a.value, b.value));

  // Escalas
  const x = d3.scaleBand()
    .domain(genreStats.map(d => d.genre))
    .range([margin.left, width - margin.right])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(genreStats, d => d.value)]).nice()
    .range([height - margin.bottom, margin.top]);

  // Barras
  svg.append("g")
    .selectAll("rect")
    .data(genreStats)
    .join("rect")
    .attr("x", d => x(d.genre))
    .attr("y", d => y(d.value))
    .attr("height", d => y(0) - y(d.value))
    .attr("width", x.bandwidth())
    .attr("fill", "#69b3a2")
    .on("mouseover", (event, d) => {
      tooltip.style("display", "block").html(`<strong>${d.genre}</strong><br>Popularidade média: ${d.value.toFixed(2)}`);
      d3.select(event.currentTarget).attr("fill", "orange");
    })
    .on("mousemove", (event) => {
      tooltip.style("left", (event.pageX + 10) + "px")
             .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", (event) => {
      tooltip.style("display", "none");
      d3.select(event.currentTarget).attr("fill", "#69b3a2");
    });

  // Eixos
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-40)")
    .style("text-anchor", "end");

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  // Título
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .text("Popularidade Média por Gênero");
}

// Gráfico 2: Scatter Valence vs Popularidade
function renderScatterValencePopularity(data) {
  const width = 700, height = 400, margin = { top: 40, right: 30, bottom: 50, left: 70 };

  const svg = chartContainer.append("svg")
    .attr("width", width)
    .attr("height", height);

  // Escalas
  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.valence)).nice()
    .range([margin.left, width - margin.right]);

  const y = d3.scaleLinear()
    .domain(d3.extent(data, d => d.popularity)).nice()
    .range([height - margin.bottom, margin.top]);

  // Pontos
  svg.append("g")
    .selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", d => x(d.valence))
    .attr("cy", d => y(d.popularity))
    .attr("r", 3)
    .attr("fill", "#4682b4")
    .attr("opacity", 0.6)
    .on("mouseover", (event, d) => {
      tooltip.style("display", "block").html(
        `Valence: ${d.valence.toFixed(2)}<br>Popularidade: ${d.popularity}`
      );
      d3.select(event.currentTarget).attr("fill", "orange");
    })
    .on("mousemove", (event) => {
      tooltip.style("left", (event.pageX + 10) + "px")
             .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", (event) => {
      tooltip.style("display", "none");
      d3.select(event.currentTarget).attr("fill", "#4682b4");
    });

  // Eixos
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x))
    .append("text")
    .attr("x", width - margin.right)
    .attr("y", 40)
    .attr("fill", "black")
    .attr("text-anchor", "end")
    .text("Valence");

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y))
    .append("text")
    .attr("x", -margin.left + 10)
    .attr("y", margin.top)
    .attr("fill", "black")
    .attr("text-anchor", "start")
    .text("Popularidade");

  // Título
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .text("Valence vs Popularidade");
}

// Gráfico 3: Top 10 Artistas Populares
function renderTopArtists(data) {
  const width = 700, height = 400, margin = { top: 40, right: 30, bottom: 70, left: 120 };

  const svg = chartContainer.append("svg")
    .attr("width", width)
    .attr("height", height);

  // Agrupa por artista e média da popularidade
  const artistMap = d3.group(data, d => d.artist_name);
  const artistStats = Array.from(artistMap, ([artist, tracks]) => ({
    artist,
    value: d3.mean(tracks, d => d.popularity)
  })).sort((a, b) => d3.descending(a.value, b.value)).slice(0, 10);

  // Escalas
  const y = d3.scaleBand()
    .domain(artistStats.map(d => d.artist))
    .range([margin.top, height - margin.bottom])
    .padding(0.2);

  const x = d3.scaleLinear()
    .domain([0, d3.max(artistStats, d => d.value)]).nice()
    .range([margin.left, width - margin.right]);

  // Barras horizontais
  svg.append("g")
    .selectAll("rect")
    .data(artistStats)
    .join("rect")
    .attr("y", d => y(d.artist))
    .attr("x", margin.left)
    .attr("height", y.bandwidth())
    .attr("width", d => x(d.value) - margin.left)
    .attr("fill", "#ff7f0e")
    .on("mouseover", (event, d) => {
      tooltip.style("display", "block").html(`<strong>${d.artist}</strong><br>Popularidade média: ${d.value.toFixed(2)}`);
      d3.select(event.currentTarget).attr("fill", "orange");
    })
    .on("mousemove", (event) => {
      tooltip.style("left", (event.pageX + 10) + "px")
             .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", (event) => {
      tooltip.style("display", "none");
      d3.select(event.currentTarget).attr("fill", "#ff7f0e");
    });

  // Eixos
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  // Título
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .text("Top 10 Artistas por Popularidade");
}

// Gráfico 4: Atributos Médios por Gênero (vários atributos lado a lado)
function renderAvgAttributesByGenre(data) {
  const width = 800, height = 400, margin = { top: 40, right: 30, bottom: 100, left: 70 };
  const attributes = ["energy", "danceability", "valence"];

  const svg = chartContainer.append("svg")
    .attr("width", width)
    .attr("height", height);

  // Agrupar por gênero
  const genreMap = d3.group(data, d => d.genre);
  const genreStats = Array.from(genreMap, ([genre, tracks]) => {
    const obj = { genre };
    attributes.forEach(attr => {
      obj[attr] = d3.mean(tracks, d => d[attr]);
    });
    return obj;
  });

  const x0 = d3.scaleBand()
    .domain(genreStats.map(d => d.genre))
    .range([margin.left, width - margin.right])
    .paddingInner(0.1);

  const x1 = d3.scaleBand()
    .domain(attributes)
    .range([0, x0.bandwidth()])
    .padding(0.05);

  const y = d3.scaleLinear()
    .domain([0, 1]) // atributos variam de 0 a 1
    .range([height - margin.bottom, margin.top]);

  const color = d3.scaleOrdinal()
    .domain(attributes)
    .range(["#1f77b4", "#ff7f0e", "#2ca02c"]);

  // Barras
  svg.append("g")
    .selectAll("g")
    .data(genreStats)
    .join("g")
    .attr("transform", d => `translate(${x0(d.genre)},0)`)
    .selectAll("rect")
    .data(d => attributes.map(attr => ({ attr, value: d[attr] })))
    .join("rect")
    .attr("x", d => x1(d.attr))
    .attr("y", d => y(d.value))
    .attr("width", x1.bandwidth())
    .attr("height", d => y(0) - y(d.value))
    .attr("fill", d => color(d.attr))
    .on("mouseover", (event, d) => {
      tooltip.style("display", "block").html(`<strong>${d.attr}</strong><br>Valor médio: ${d.value.toFixed(2)}`);
      d3.select(event.currentTarget).attr("fill", "orange");
    })
    .on("mousemove", (event) => {
      tooltip.style("left", (event.pageX + 10) + "px")
             .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", (event) => {
      tooltip.style("display", "none");
      d3.select(event.currentTarget).attr("fill", d => color(d.attr));
    });

  // Eixos
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x0))
    .selectAll("text")
    .attr("transform", "rotate(-40)")
    .style("text-anchor", "end");

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  // Legenda
  const legend = svg.append("g")
    .attr("transform", `translate(${width - margin.right - 100},${margin.top})`);

  attributes.forEach((attr, i) => {
    const g = legend.append("g").attr("transform", `translate(0,${i * 20})`);
    g.append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", color(attr));
    g.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text(attr)
      .style("font-size", "12px");
  });

  // Título
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .text("Atributos Médios por Gênero");
}

// Tooltip global
const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip");
