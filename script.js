const positions = {};
function get_postcode_file(letters) {
    return fetch(`postcodes-${letters}.json`)
        .then(function(response) {
            return response.json();
        })
    .then(function(data) {
        Object.assign(positions,data);
    });
}

 	
function rad(degrees) {
    return Math.PI/180*degrees;
}

/** From https://www.movable-type.co.uk/scripts/latlong.html
 */
function distance(p1,p2) {
    const [lat1,lon1] = p1;
    const [lat2,lon2] = p2;
    var R = 6371e3; // metres
    var phi1 = rad(lat1);
    var phi2 = rad(lat2);
    var dphi = rad(lat2-lat1);
    var dlambda = rad(lon2-lon1);

    var a = Math.sin(dphi/2) * Math.sin(dphi/2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(dlambda/2) * Math.sin(dlambda/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    var d = (R * c)/1000;
    return d;
}

function postcode_location(postcode) {
    postcode = postcode.toUpperCase();
    if(positions[postcode]===undefined) {
        const letters = postcode.match(/^[A-Z]+/)[0];
        return get_postcode_file(letters).then(function() {
            return Promise.resolve(positions[postcode]);
        })
    } else {
        return Promise.resolve(positions[postcode]);
    }
}

function distance_between(postcode1,postcode2) {
    return Promise.all([postcode_location(postcode1),postcode_location(postcode2)]).then(([p1,p2])=>Promise.resolve(distance(p1,p2)));
}

function convert_units(km,units) {
    const factors = {
        km: 1,
        miles: 0.621371
    }
    return km*factors[units];
}

function compute() {
    const home = home_input.value;
    const postcodes = postcodes_input.value.split('\n').map(x=>x.trim()).filter(x=>x!='');
    const units = unit_inputs.find(x=>x.checked).value;
    units_display.innerHTML = units;
    console.log(units);
    output.innerHTML = '';
    postcodes.forEach(function(postcode) {
        distance_between(home,postcode,units)
            .then(function(d) {
                d = convert_units(d,units);
                output.innerHTML += `<tr><td class="postcode">${postcode.toUpperCase()}</td><td class="distance">${d.toFixed(3)}</td></tr>`;
            })
            .catch(function(e) {
                output.innerHTML += `<tr><td class="postcode">${postcode.toUpperCase()}</td><td class="error">Invalid</td></tr>`;
            });
    });
}

const home_input = document.getElementById('home');
const postcodes_input = document.getElementById('postcodes');
const unit_inputs = Array.prototype.slice.apply(document.querySelectorAll('input[name="units"]'));
const units_display = document.getElementById('units-display');
const go_button = document.getElementById('go');
const output = document.querySelector('#output tbody');

go_button.addEventListener('click',compute);
