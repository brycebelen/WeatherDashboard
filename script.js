let currentLat = 34.05;
let currentLong = -118.24;
let searchHistory = [];

const API_KEY = "d2c8556859925903e33b931f581ce7e8";
const DAYS_OF_WEEK = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]

document.addEventListener("DOMContentLoaded", async function(event) {
    setFooter();
    setSearchHistory();
    await updateContent();

    document.getElementById("search").addEventListener('click', async function() {
        const locationName = document.getElementById("city-input").value;
        await searchLocation(locationName);
    });

    document.getElementById("city-input").addEventListener('keydown', async function(e) {
        const locationName = document.getElementById("city-input").value;
        if (e.key === "Enter" && locationName){
            e.preventDefault();
            await searchLocation(locationName);
        }
    });

    document.getElementById("use-my-location").addEventListener('click', async function() {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(async function(position) {
                currentLat = position.coords.latitude;
                currentLong = position.coords.longitude;
                await updateContent();
            }, function(error) {
                console.error('Error occurred: ', error);
            });
        } else {
            console.log('Geolocation is not supported by your browser');
        }
    });
});

function setSearchHistory(){
    let $history = document.getElementById("search-history");
    let innerHtml = "";

    searchHistory.map((h, i) => {
        innerHtml += `<li class="no-decoration"><button type="button" onclick="historyClick(this)" class="history left-nav-button" data-lat=${h.lat} data-lon=${h.lon}>${h.name}</a></li>`
    });

    $history.innerHTML = innerHtml;
}

async function historyClick(elem){
    let lat = elem.getAttribute('data-lat');
    let lon = elem.getAttribute('data-lon');

    currentLat = lat;
    currentLong = lon;

    await updateContent();
}

async function updateContent(){
    let forecast = await fetchForecast();
    setCurrentLocation(forecast);
}

async function searchLocation(locationName){
    const url = `http://api.openweathermap.org/geo/1.0/direct?q=${locationName}&limit=5&appid=${API_KEY}`;

    try {
        clearError();

        const response = await fetch(url);
        const locations = await response.json();

        if (locations.length > 0){
            let location = locations[0];
            currentLat = location.lat;
            currentLong = location.lon;

            let forecast = await fetchForecast();

            searchHistory.unshift({name: forecast.city.name, lat: location.lat, lon: location.lon});

            setSearchHistory();
            
            setCurrentLocation(forecast);
        }
        else {
            showError("City not found!");
        }
    } catch (error) {
        console.error('Failed to fetch location data', error);
    }
}

function showError(message){
    let $error = document.getElementById("error-message");
    $error.innerText = message;
}

function clearError(){
    let $error = document.getElementById("error-message");
    $error.innerText = "";
}

function setFooter() {
    document.getElementById("footer").innerHTML = `Copyright Bryce Belen ${new Date().getFullYear()}`;
}

async function fetchForecast(){
    const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${currentLat}&lon=${currentLong}&units=imperial&appid=${API_KEY}`);
    let forecast = await response.json();
    return forecast;
}

function setCurrentLocation(forecast){
    let current = forecast.list[0];
    let cityName = forecast.city.name;
    let currentDate = getFormattedDate(new Date());
    let tempNum = current.main.temp;
    let tempClass = tempNum > 80 ? "hot" : tempNum < 60 ? "cold" : "";
    let currentTemp = `<strong>Temp:</strong> <span class="${tempClass}">${current.main.temp}° F</span>`;
    let currentWind = `<strong>Wind:</strong> ${current.wind.speed} mph`;
    let currentHumidity = `<strong>Humidity:</strong> ${current.main.humidity}%`;
    let icon = current.weather[0].icon;

    let $cityName = document.getElementById("city-name");
    let $cityWeatherIcon = document.getElementById("city-weather-icon-container");
    let $temp = document.getElementById("city-temp");
    let $wind = document.getElementById("city-wind");
    let $humidity = document.getElementById("city-humidity");

    $cityName.innerHTML = `${cityName} (${currentDate})`;
    $cityWeatherIcon.innerHTML = `<img id="city-weather-img" src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="weather icon" />`
    $temp.innerHTML = currentTemp;
    $wind.innerHTML = currentWind;
    $humidity.innerHTML = currentHumidity;

    setForecast(forecast.list);
};

function setForecast(forecast){
    let day1 = forecast.splice(0, 7);
    let day2 = forecast.splice(0, 7);
    let day3 = forecast.splice(0, 7);
    let day4 = forecast.splice(0, 7);
    let day5 = forecast.splice(0, 7);
    let days = [day1, day2, day3, day4, day5];

    for (let i = 0; i < days.length; i++){
        let day = days[i].reduce((prev, current) => {
            return (prev.main.temp > current.main.temp) ? prev : current;
        });

        let unixEpoch = day.dt;
        let date = new Date(unixEpoch * 1000);
        let formattedDate = getFormattedDate(date);
        let dayOfWeek = DAYS_OF_WEEK[date.getDay()];
        let tempNum = day.main.temp;
        let tempClass = tempNum > 80 ? "hot" : tempNum < 60 ? "cold" : "";
        let temp = `<strong>Temp:</strong> ${day.main.temp}° F`;
        let wind = `<strong>Wind:</strong> ${day.wind.speed} mph`;
        let humidity = `<strong>Humidity:</strong> ${day.main.humidity}%`;
        let icon = day.weather[0].icon;
        let description = day.weather[0].description;

        let $day = document.getElementById(`day-${i+1}`);
        $day.innerHTML = `
            <div id="forecast-card">
                <h4>${dayOfWeek} ${formattedDate}</h4>
                <hr />
                <p class="weather-description">${description}</p>
                <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}">
                <ul class="forecast-card-list">
                    <li class=${tempClass}>${temp}</li>
                    <li>${wind}</li>
                    <li>${humidity}</li>
                </ul>
            </div>
        `
    }
}

function getFormattedDate(date, includeYear) {
    let year = date.getFullYear();
  
    let month = (1 + date.getMonth()).toString();
    month = month.length > 1 ? month : '0' + month;
  
    let day = date.getDate().toString();
    day = day.length > 1 ? day : '0' + day;
    
    return includeYear ? month + '/' + day + '/' + year : month + '/' + day;
  }