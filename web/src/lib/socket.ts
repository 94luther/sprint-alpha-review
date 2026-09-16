import { io, Socket } from 'socket.io-client'
import { getDemoSocket } from './demoApi'

const API_URL = import.meta.env.VITE_API_URL
const STANDALONE = import.meta.env.VITE_DEMO_STANDALONE === '1'

let socket: Socket | null = null

// One shared /rt socket for the whole app. Created lazily so we only
// open a connection once a signed-in page actually needs live data.
//
// Standalone/artifact build: there is no server to open a websocket to, so
// this hands back the in-memory pub/sub from demoApi.ts instead, cast to
// the Socket type it stands in for. It only implements the .on/.off/.emit
// surface the pages actually use (order_status, dispatch_scored,
// courier_locations), which is all Track/Courier/Ops ever call.
export function getSocket(): Socket {
  if (STANDALONE) return getDemoSocket() as unknown as Socket
  if (!socket) {
    socket = io(`${API_URL}/rt`, {
      transports: ['websocket', 'polling'],
      autoConnect: true
    })
  }
  return socket
}

export function closeSocket() {
  if (STANDALONE) return
  socket?.disconnect()
  socket = null
}
