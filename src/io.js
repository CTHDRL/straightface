import io from 'socket.io-client'

// object to manage connections
let connections = {}

export default (url) => {
    let socket = connections[url]
    if (!socket) {
        socket = io(url)
    }
    return {
        socket,
        destroy() {
            if (connections[url]) delete connections[url]
        },
    }
}
