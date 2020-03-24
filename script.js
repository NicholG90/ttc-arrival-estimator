const app = {};

app.init = () => {
    app.getRoutes();
    app.getLocation();
}

// Calling list of all Routes & corresponding data on page load
// Proxied this to use on github pages and test as api is http. Will update everything to proxy as needed.
app.getRoutes = () => {
    $.ajax({
        url: "https://proxy.hackeryou.com",
        method: "GET",
        dataType: "json",
        data: {
            reqUrl: 'http://restbus.info/api/agencies/ttc/routes',
        }
    }).then(response => {
        app.displayRoutes(response)
    })
}


// All routes passed to function that parses titles and uses jquery UI display
app.displayRoutes = (routes) => {
    routes = routes.map(route => {
    return `${route.title}`;
    })
    $(function() {
        $( "#routes" ).autocomplete({
            source: routes
        }); 
});
    app.getDirection();
}

// When Route is selected, route number is parsed and then specific route information is called
app.getDirection = () => {
    $('#routes').on('change',() => {
        $('.directionSelection').show(400).css('display','flex')
        app.routeSelection = $('#routes')
            .val()
            .split("-")[0];
    $.ajax({
        url: "https://proxy.hackeryou.com",
        method: "GET",
        dataType: "json",
        data: {
            reqUrl: `http://restbus.info/api/agencies/ttc/routes/${app.routeSelection}/`,
        }
    }).then(response => {
        app.displayDirections(response)
        app.getStops(response)
        app.displayStop(response)
    })
    });
}

// Specific route passed to function that parses array and displays directions 
app.displayDirections = (routeDirection) => {
    routeDirection = routeDirection.directions;
    routeDirection = routeDirection.map(direction =>{
    return `${direction.title}`;
    })
    $( function() {
        $( "#directions" ).autocomplete({
            source: routeDirection
        });
});

app.getStops = (routeDirection) => {
    $('#directions').on('change',() => {
        $('.stopSelection').show(400).css('display','flex')
        let directionSelection = $('#directions').val()
        directionSelection = directionSelection.split(" -")[0];
        routeDirections = routeDirection.directions
        indexofDirection = routeDirections.findIndex(x => x.shortTitle === directionSelection)
                directionStops = routeDirection.directions[indexofDirection].stops;            
                const fullMatchingStopData = directionStops.map(id => {
                    const matchingStop = routeDirection.stops.find(stop => stop.id  === id );
                    return matchingStop.title;
                })
                $( function() {
                    $( "#stops" ).autocomplete({
                        source: fullMatchingStopData
                    });
        })
    })
}
}

app.stopSelectionid = "";

app.displayStop = (routeDirection) => {
$('#stops').on('change',() => {
    stopSelection = $('#stops').val();
    const fullMatchingStopData = directionStops.map(id => {
        const matchingStop = routeDirection.stops.find(stop => stop.id  === id );
        return matchingStop;
    })
    app.stopSelectionid = fullMatchingStopData.find(({title}) => title === stopSelection);
    app.stopSelectionid = app.stopSelectionid.id
    app.getEstimate();
})
}

app.getEstimate = () => {
$.ajax({
    url: "https://proxy.hackeryou.com",
    method: "GET",
    dataType: "json",
    data: {
        reqUrl: `http://restbus.info/api/agencies/ttc/routes/${app.routeSelection}/stops/${app.stopSelectionid}/predictions`
    }
}).then(response => {
    clearInterval(app.timer);
    // Check if timer is running
    app.displayEstimate(response);
})
}

app.timer = "";

app.displayEstimate = (estimate) => {
if (!estimate.length) {
    $('.arrivalEstimates').html(`No prediction available for your stop`);
    return
}
let epochArrival = estimate[0].values[0].epochTime
    app.timer = setInterval(function() {
    let currentDate = Date.now()
    let timeUntilArrival = (epochArrival - currentDate) / 1000
    app.minutesUntilArrival = Math.floor(timeUntilArrival / 60) % 60;
    app.secondsUntilArrival = Math.floor(timeUntilArrival % 60);
    $('.arrivalEstimates').html(`Next arrival: ${app.minutesUntilArrival} Minutes`);
    $('.arrivalEstimates').append(` ${app.secondsUntilArrival} seconds`);
    app.backgroundColorChange();
    if (app.secondsUntilArrival <= 0) {
        app.getEstimate();
    }
}, 1000)
}

// Changing background color based on how long until arrival
// Using official TTC Colors!

app.backgroundColorChange = () => {
if (app.minutesUntilArrival < 3) {
    $('body').css({
        'transition': 'background-color 2s ease-in-out',
        'background-color': '#e27d60'
        });
    } else if (app.minutesUntilArrival < 5) {
    $('body').css({
            'transition': 'background-color 2s ease-in-out',
            'background-color': '#c38d9e'
        });
    } else {
    $('body').css('background','#7cc2aa');
    }
}


// Allow for change in route without reload
// remove content from html at page load

// Below is Geolocation - Not cleaned up yet - Added as an addition.
// Data only gives you by the minute - does not update by second

// Listener for Location Click
app.getLocation = () => {
    $('.location').on('click',() => {
        navigator.geolocation.getCurrentPosition(app.displayClosestInformation);
    });
}

// Display Location
app.displayClosestInformation = (position) => {
        let latitude = position.coords.latitude;
        let longitude = position.coords.longitude;
        $.ajax({
            url: "https://proxy.hackeryou.com",
            method: "GET",
            dataType: "json",
            data: {
                reqUrl: `http://restbus.info/api/locations/${latitude},${longitude}/predictions`,
            }
        }).then(function(response) {
                $('#routes').val(`${response[0].route.title}`);
                let trimmedDirection = response[0].values[0].direction.title;
                trimmedDirection = trimmedDirection.split(":")[1].trim();
                $('.directionSelection').css('display','flex');
                $('#directions').val(`${trimmedDirection}`);
                let trimmedStop = response[0].stop.title;
                trimmedStop = trimmedStop.split(":")[1].trim();
                $('.stopSelection').css('display','flex');
                $('#stops').val(`${trimmedStop}`);
                timeUntilArrival = response[0].values[0].seconds;
                app.minutesUntilArrival = Math.floor(timeUntilArrival / 60) % 60;
                app.secondsUntilArrival = Math.floor(timeUntilArrival % 60);
                $('.arrivalEstimates').html(`Next arrival: ${app.minutesUntilArrival} Minutes`);
                $('.arrivalEstimates').append(` ${app.secondsUntilArrival} seconds`);
                app.backgroundColorChange();
    });
}

$(document).ready(() => {

    app.init();

})