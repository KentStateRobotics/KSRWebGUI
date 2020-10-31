
export class Router{
    private conn: WebSocket
    private url: string
    private id: number = -1
    private handlers: HandlerDict = {}

    constructor(url: string){
        this.url = url
        this.conn = new WebSocket(url)
        this.conn.onmessage = this.onmessage
        this.conn.onclose = this.onclose
        this.conn.onerror = this.onerror
    }

    public send(message: Message){
        if (this.id != -1){
            message.header.source = this.id
            this.conn.send(JSON.stringify(message))
        }else{
            console.warn("Message was not sent, no network id")
        }
    }

    public route(message: Message){
        if(message.header.destination == 0 || message.header.destination == this.id){
            if(this.handlers[message.header.channel]){
                this.handlers[message.header.channel](message)
            }else{
                console.warn("Unhandled message dropped")
            }
        }else{
            this.send(message)
        }
    }

    public addHandler(callback: (message: Message) => void, channel: number) {
        if(this.handlers[channel]){
            console.warn("Handler on channel: " + channel + " has been overriden")
        }
        this.handlers[channel] = callback
    }

    public addWorkerMessageHandler(worker: Worker, channel: number){
        this.addHandler(worker.postMessage, channel)
    }

    public removeHandler(channel?: number){
        if(channel){
            delete this.handlers[channel]
        }else{
            this.handlers = []
        }
    }

    public connect(url?: string){
        this.conn = new WebSocket(url ? url : this.url)
        this.conn.onmessage = this.onmessage
        this.conn.onclose = this.onclose
        this.conn.onerror = this.onerror
    }

    private onmessage(event: MessageEvent) {
        let message: Message = JSON.parse(event.data)
        if(message.header.channel == Channels.NETWORKING){
            if(message.header.type == NetworkingTypes.ID_ASSIGN){
                this.id = message.header.destination
            }
        }else{
            this.route(message)
        }
    }

    private onclose(event: CloseEvent) {
        this.id = -1
        console.debug("Websocket connection closed")
    }

    private onerror(event: Event) {
        console.error(event)
    }
}

export enum NetworkIds{
    /*Enum of reserved addresses*/
    LOCAL = 0,
    HOST = 1
}

export enum Channels{
    /*Enum of general channels*/
    NETWORKING = 0,
    LOGGING = 1
}

export enum NetworkingTypes{
    /*Enum of message types for the networking channel*/
    ID_ASSIGN = 0
}

export interface HandlerDict{
    [key: number]: (message: Message) => void
}

export interface Header{
    source: number
    destination: number
    channel: number
    type: number
}

export interface Message{
    header: Header
    [key: string]: any
}
