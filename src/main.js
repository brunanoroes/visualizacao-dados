// Carregar CSV e criar gráficos
const loadingOverlay = document.getElementById('loadingOverlay');
fetch('data/SpotifyFeatures.csv')
  .then(response => response.text())
  .then(csvText => {
    loadingOverlay.style.display = 'none';
    const data = Papa.parse(csvText, { header: true, dynamicTyping: true }).data;

    // Filtrar linhas válidas (popularity != null)
    const filtered = data.filter(d => d.popularity !== null && d.popularity !== undefined);

    // 1. Popularidade média por gênero
    const popByGenre = {};
    filtered.forEach(d => {
      if (!popByGenre[d.genre]) popByGenre[d.genre] = [];
      popByGenre[d.genre].push(d.popularity);
    });
    const genres = Object.keys(popByGenre);
    const popMeans = genres.map(g => {
      const vals = popByGenre[g];
      return vals.reduce((a,b) => a+b, 0) / vals.length;
    });

    new Chart(document.getElementById('popularityByGenre'), {
      type: 'bar',
      data: {
        labels: genres,
        datasets: [{
          label: 'Popularidade Média',
          data: popMeans,
          backgroundColor: 'rgba(54,162,235,0.7)',
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, max: 100 }
        }
      }
    });

    // 3. Correlação entre valence e popularity (scatter)
    const valence = filtered.map(d => d.valence);
    const popularity = filtered.map(d => d.popularity);
    const genresForColor = filtered.map(d => d.genre);
    // Cores por gênero simples
    const genreColors = {};
    genres.forEach((g,i) => genreColors[g] = `hsl(${i * 40}, 70%, 60%)`);

    const scatterData = filtered.map(d => ({
      x: d.valence,
      y: d.popularity,
      backgroundColor: genreColors[d.genre]
    }));

    new Chart(document.getElementById('valenceVsPopularity'), {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Valence x Popularidade',
          data: scatterData,
          pointBackgroundColor: scatterData.map(p => p.backgroundColor),
          pointRadius: 4
        }]
      },
      options: {
        scales: {
          x: { min: 0, max: 1, title: { display: true, text: 'Valence (Positividade)' } },
          y: { min: 0, max: 100, title: { display: true, text: 'Popularidade' } }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });

    // 4. Top artistas por popularidade média
    const popByArtist = {};
    filtered.forEach(d => {
      if (!popByArtist[d.artist_name]) popByArtist[d.artist_name] = [];
      popByArtist[d.artist_name].push(d.popularity);
    });

    const artists = Object.keys(popByArtist);
    const popMeanArtist = artists.map(a => {
      const vals = popByArtist[a];
      return {
        artist: a,
        mean: vals.reduce((a,b) => a+b,0) / vals.length
      };
    });

    popMeanArtist.sort((a,b) => b.mean - a.mean);
    const top10 = popMeanArtist.slice(0, 10);

    new Chart(document.getElementById('topArtists'), {
      type: 'bar',
      data: {
        labels: top10.map(t => t.artist),
        datasets: [{
          label: 'Popularidade Média',
          data: top10.map(t => t.mean),
          backgroundColor: 'rgba(255, 99, 132, 0.7)'
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        scales: {
          x: { beginAtZero: true, max: 100 }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });

    // 5. Atributos médios por gênero (valence, energy, danceability)
    const attrByGenre = {};
    filtered.forEach(d => {
      if (!attrByGenre[d.genre]) attrByGenre[d.genre] = { valence: [], energy: [], danceability: [] };
      attrByGenre[d.genre].valence.push(d.valence);
      attrByGenre[d.genre].energy.push(d.energy);
      attrByGenre[d.genre].danceability.push(d.danceability);
    });

    const attrLabels = genres;
    const valenceMeans = genres.map(g => {
      const arr = attrByGenre[g].valence;
      return arr.reduce((a,b) => a+b, 0) / arr.length;
    });
    const energyMeans = genres.map(g => {
      const arr = attrByGenre[g].energy;
      return arr.reduce((a,b) => a+b, 0) / arr.length;
    });
    const danceMeans = genres.map(g => {
      const arr = attrByGenre[g].danceability;
      return arr.reduce((a,b) => a+b, 0) / arr.length;
    });

    new Chart(document.getElementById('attributesByGenre'), {
      type: 'bar',
      data: {
        labels: attrLabels,
        datasets: [
          { label: 'Valence', data: valenceMeans, backgroundColor: 'rgba(255, 206, 86, 0.7)' },
          { label: 'Energy', data: energyMeans, backgroundColor: 'rgba(255, 99, 132, 0.7)' },
          { label: 'Danceability', data: danceMeans, backgroundColor: 'rgba(54, 162, 235, 0.7)' },
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, max: 1 }
        }
      }
    });
  })
    .catch(err => {
    console.error('Erro ao carregar CSV:', err);
  });