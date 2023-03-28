const tmdbKey = '8400d993458dda83f0f7bb6260178dc2';
const tmdbBaseUrl = 'https://api.themoviedb.org/3/';
const playBtn = document.getElementById('playBtn');

const getGenres = async () => {
  const genreRequestEndpoint = `genre/movie/list?`
  const requestParams = `api_key=${tmdbKey}`
  const urlToFetch = `${tmdbBaseUrl}${genreRequestEndpoint}${requestParams}`
  try{
    const response = await fetch(urlToFetch);
    if(response.ok){
      const jsonResponse = await response.json();
      const genres = jsonResponse.genres;
      return genres;

    }
    throw new Error("Failed")
  }
  catch(error){
    console.log(error);
  }
};

const getMovies = async () => {
  const selectedGenre = getSelectedGenre();
  const discoverMovieEndpoint = `discover/movie?`
  const requestParams = `api_key=${tmdbKey}&with_genres=${selectedGenre}`
  const urlToFetch = `${tmdbBaseUrl}${discoverMovieEndpoint}${requestParams}`
  try{
    const response = await fetch(urlToFetch)
    if(response.ok){
      const jsonResponse = await response.json()
      const movies = jsonResponse.results
      // console.log(movies)
      return movies;
    }
    
  }
  catch(error){
    console.log(error)
  }
};

getMovies()

const getMovieInfo = async(movie) => {
  const movieId = movie.id;
  const movieEndpoint = `movie/${movieId}?`;
  const requestParams= `api_key=${tmdbKey}`;
  const urlToFetch = `${tmdbBaseUrl}${movieEndpoint}${requestParams}`
  try{
    const response = await fetch(urlToFetch);
    if(response.ok){
      const movieInfo = await response.json();
      return movieInfo;
    }
  }
  catch(error){
    console.log(error);
  }
};




// Gets a list of movies and ultimately displays the info of a random movie from the list
const showRandomMovie = async () => {
  const movieInfo = document.getElementById('movieInfo');
  if (movieInfo.childNodes.length > 0) {
    clearCurrentMovie();
  };
  const movies = await getMovies()
  let randomMovie = getRandomMovie(movies)
  const info = await getMovieInfo(randomMovie)
  displayMovie(info)

};

getGenres().then(populateGenreDropdown);
playBtn.onclick = showRandomMovie;


// Favorite Watch List
let watchLater = []
renderFavWatch()
function showFavList(){
  try{
    const movieTitleEl = document.getElementById('movieTitle');
    const moviePosterEl = document.getElementById('moviePoster').firstChild;
    const movieOverviewEl = document.getElementById('movieOverview');
    const obj = {
      title: movieTitleEl.textContent,
      summary: movieOverviewEl.textContent,
      img: moviePosterEl.src
    }
    if(checkDuplicat(obj)){
      saveLocalStorage(obj)
    }
    renderFavWatch()
    scrollTo(0, document.body.scrollHeight);
  }
  catch(error){
    console.log(error)
  }



}

function checkDuplicat(obj){
  let storageItems = JSON.parse(localStorage.getItem('myMovies'))
  let counter = 0;
  if(storageItems){
    for(let i = 0; i < watchLater.length; i++){
      if(obj.title !== watchLater[i].title){
        counter++;
      }
    }
    if(counter === storageItems.length){
      return true;
    }
    else{
      return false;
    }
  }
  return true;
}

function saveLocalStorage(obj){
  let watchItems = JSON.parse(localStorage.getItem('myMovies'));
  if(watchItems){
    watchLater = JSON.parse(localStorage.getItem('myMovies'))
  }
  watchLater.push(obj);
  localStorage.setItem("myMovies", JSON.stringify(watchLater))
}


function renderFavWatch(){
  const favListEl = document.getElementById('fav-list');
  favListEl.innerHTML = '<h2>Favourite Movies List</h2>'
  let watchItems = JSON.parse(localStorage.getItem('myMovies'));
  if(watchItems){
    watchLater = JSON.parse(localStorage.getItem('myMovies'))
    for(let i = 0; i < watchLater.length; i++){
      favListEl.innerHTML += `<article><img src="${watchLater[i].img}"><h1>${watchLater[i].title}</h1><p>${watchLater[i].summary}</p></article>`
    }
  }
}



function clearLocalStorage(){
  localStorage.clear();
  const favListEl = document.getElementById('fav-list');
  favListEl.innerHTML = '<h2>Favourite Movies List</h2>';
  watchLater = []
}




