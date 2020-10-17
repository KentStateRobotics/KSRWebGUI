"use strict";
class Router {
    constructor(url) {
        this.id = -1;
        this.handlers = {};
        this.url = url;
        this.conn = new WebSocket(url);
        this.conn.onmessage = this.onmessage;
        this.conn.onclose = this.onclose;
        this.conn.onerror = this.onerror;
    }
    send(message) {
        if (this.id != -1) {
            message.header.source = this.id;
            this.conn.send(JSON.stringify(message));
        }
        else {
            console.warn("Message was not sent, no network id");
        }
    }
    route(message) {
        if (message.header.destination == 0 || message.header.destination == this.id) {
            if (this.handlers[message.header.channel]) {
                this.handlers[message.header.channel](message);
            }
            else {
                console.warn("Unhandled message dropped");
            }
        }
        else {
            this.send(message);
        }
    }
    addHandler(callback, channel) {
        if (this.handlers[channel]) {
            console.warn("Handler on channel: " + channel + " has been overriden");
        }
        this.handlers[channel] = callback;
    }
    addWorkerMessageHandler(worker, channel) {
        this.addHandler(worker.postMessage, channel);
    }
    removeHandler(channel) {
        if (channel) {
            delete this.handlers[channel];
        }
        else {
            this.handlers = [];
        }
    }
    connect(url) {
        this.conn = new WebSocket(url ? url : this.url);
        this.conn.onmessage = this.onmessage;
        this.conn.onclose = this.onclose;
        this.conn.onerror = this.onerror;
    }
    onmessage(event) {
        let message = JSON.parse(event.data);
        if (message.header.channel == Channels.NETWORKING) {
            if (message.header.type == NetworkingTypes.ID_ASSIGN) {
                this.id = message.header.destination;
            }
        }
        else {
            this.route(message);
        }
    }
    onclose(event) {
        this.id = -1;
        console.debug("Websocket connection closed");
    }
    onerror(event) {
        console.error(event);
    }
}
var NetworkIds;
(function (NetworkIds) {
    /*Enum of reserved addresses*/
    NetworkIds[NetworkIds["LOCAL"] = 0] = "LOCAL";
    NetworkIds[NetworkIds["HOST"] = 1] = "HOST";
})(NetworkIds || (NetworkIds = {}));
var Channels;
(function (Channels) {
    /*Enum of general channels*/
    Channels[Channels["NETWORKING"] = 0] = "NETWORKING";
    Channels[Channels["LOGGING"] = 1] = "LOGGING";
})(Channels || (Channels = {}));
var NetworkingTypes;
(function (NetworkingTypes) {
    /*Enum of message types for the networking channel*/
    NetworkingTypes[NetworkingTypes["ID_ASSIGN"] = 0] = "ID_ASSIGN";
})(NetworkingTypes || (NetworkingTypes = {}));
