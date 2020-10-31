import * as networking from './networking.js';
function main() {
    let router = new networking.Router('ws://' + window.location.hostname + ':4242');
}
window.onload = main;
