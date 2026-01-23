import "dotenv/config";
import express from "express";
import {marked} from "marked";
const app = express();
const apiKey = process.env.TMDB_API_KEY;

app.use(express.static("public"));
app.set("view engine", "ejs");

app.get("/", async (req, res) => {
  try {
    const url = `https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}&language=sv-SE`;
    const response = await fetch(url);
    const data = await response.json();
    const carouselMovies = data.results.slice(0, 5);

    res.render("index", { carouselMovies });
  } catch (error) {
    res.render("index", { carouselMovies: [] });
  }
});

app.get("/movies", async (req, res) => {
  const baseUrl = "https://api.themoviedb.org/3/movie";
  const urls = [
    `${baseUrl}/now_playing?api_key=${apiKey}&language=sv-SE`,
    `${baseUrl}/top_rated?api_key=${apiKey}&language=sv-SE`,
    `${baseUrl}/upcoming?api_key=${apiKey}&language=sv-SE`,
    `${baseUrl}/popular?api_key=${apiKey}&language=sv-SE`,
  ];

  try {
    const responses = await Promise.all(urls.map((url) => fetch(url)));
    const dataResults = await Promise.all(responses.map((r) => r.json()));

    let allMovies = dataResults.flatMap((d) => d.results);

    const uniqueMovies = Array.from(
      new Map(allMovies.map((m) => [m.id, m])).values(),
    );

    const genreRes = await fetch(
      `https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}&language=sv-SE`,
    );
    const genreData = await genreRes.json();

    const moviesWithGenres = uniqueMovies.map((movie) => {
      return {
        ...movie,
        genre_names: movie.genre_ids
          .map((id) => {
            const g = genreData.genres.find((g) => g.id === id);
            return g ? g.name : "";
          })
          .join(", "),
      };
    });

    res.render("movies", { allMovies: moviesWithGenres });
  } catch (error) {
    console.error("Fel vid hämtning av totallistan:", error);
    res.render("movies", { allMovies: [] });
  }
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/api/movies/now-playing", async (req, res) => {
  const url = `https://api.themoviedb.org/3/movie/now_playing?language=sv-SE&page=1&api_key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Kunde inte hämta Now playing" });
  }
});

app.get("/api/movies/toplist", async (req, res) => {
  const url = `https://api.themoviedb.org/3/movie/popular?language=sv-SE&page=1&api_key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Kunde inte hämta Toplist" });
  }
});

app.get("/api/movies/kids", async (req, res) => {
  const url = `https://api.themoviedb.org/3/discover/movie?language=sv-SE&page=1&api_key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Kunde inte hämta Toplist" });
  }
});

app.get("/api/movies/classics", async (req, res) => {
  const url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=sv-SE&primary_release_date.lte=2009-12-31&sort_by=popularity.desc&vote_count.gte=1000&include_adult=false&page=1`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Kunde inte hämta Toplist" });
  }
});

app.get("/api/movies/genre", async (req, res) => {
  const url = `https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}&language=sv-SE`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Kunde inte hämta Genre" });
  }
});

app.get("/richards-filmer", async (req, res) => {
  const url = "https://plankton-app-xhkom.ondigitalocean.app/api/movies";
  try {
    const response = await fetch(url);
    const rawData = await response.json();
    /* console.dir(rawData, { depth: null }); */

    const mappedMovies = rawData.data.map((item) => {
      return {
        id: item.id,
        title: item.attributes.title,
        poster_path: item.attributes.image.url,
        genre_names: "Unknown genre",
      };
    });
    res.render("richards-filmer", { allMovies: mappedMovies });
  } catch (error) {
    console.error("Fel vid hämtning:", error);
    res.render("richards-filmer", { allMovies: [] });
  }
});

app.get("/richards-filmer/:id", async (req, res) => {
  const movieId = req.params.id;
  const url = `https://plankton-app-xhkom.ondigitalocean.app/api/movies/${movieId}`;
  try {
    const response = await fetch(url);
    const result = await response.json();
    console.log("API Svar:", result);
    const movieData = result.data;

    if (!movieData) {
      return res.status(404).render("error", { title: "Sidan hittades inte" });
    }

    const movie = {
      id: movieData.id,
      title: movieData.attributes.title,
      description: marked.parse(movieData.attributes.intro),
      image: movieData.attributes.image.url,
    };
    res.render("movie-info", { movie });
  } catch (error) {
    console.error("Fel vid hämtning av filmdetaljer:", error);
    res.status(500).send("Tekniskt fel vid hämtning av filmen.");
  }
});

app.use((req, res) => {
  res.status(404).render("error", { title: "Sidan hittades inte" });
});

export default app;
