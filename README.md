<p align="center">
    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Socket-io.svg/120px-Socket-io.svg.png" alt="logo">
</p>

## Redis Socket.IO

This is the repo of a Docker image `gevorgmelkumyan95/redis-socket-io`. The image provides a socket server application built with Node.js, which uses Socket.IO to facilitate real-time
communication. The server supports multiple channels and events, and is mainly designed to establish a bi-directional
connection between a Laravel back-end application and any kind of front-end application that utilizes Socket.IO. In
order to use the image, you'll need to have a Redis server configured on your local machine.

## Features

- **Real-Time Communication**: Enables bi-directional communication between clients and the server.
- **Redis Integration**: Utilizes Redis for subscribing to and publishing messages across channels.
- **Configurable Channels and Events**: Supports dynamic configuration of channels and events via environment variables.

## Environment Variables

- `REDIS_HOST`: Host address for the Redis server (default: `localhost`).
- `REDIS_PORT`: Port for the Redis server (default: `6379`).
- `REDIS_PASSWORD`: Password for the Redis server (default: `null`).
- `CHANNELS`: Comma-separated list of channels to subscribe to.
- `EVENTS`: Comma-separated list of events supported by the server.

## Usage

### Running the Server

1. **Pull the Image:**
   ```sh
   docker pull gevorgmelkumyan95/redis-socket-io:tag
   ```
2. **Run the Container:**
   ```sh
   docker run -d --name redis-socket-io -p 3000:3000 \
    -e REDIS_HOST=your-redis-host \
    -e REDIS_PORT=your-redis-port \
    -e REDIS_PASSWORD=your-redis-password \
    -e CHANNELS="channel1,channel2" \
    -e EVENTS="event1,event2" \
   gevorgmelkumyan95/socket-server:latest
   ```
   Alternatively, you can use it as a service in your `docker-compose.yml` file:
   ```yaml
   socket:
        image: gevorgmelkumyan95/redis-socket-io:latest
        ports:
            - 3000:3000
        networks:
            - net
        environment:
            - REDIS_HOST=your-redis-host
            - REDIS_PORT=your-redis-port
            - REDIS_PASSWORD=your-redis-password
            - CHANNELS=channel1,channel2
            - EVENTS=event1,event2
   ```

3. **Access the Server:**
   The server listens on port 3000 by default. You can access it at `http://localhost:3000` (or replace localhost with
   your server's IP address or domain).
4. **Setting Up the Client:**
   Events emitted from the client should have `client:` prefix, e.g. `client:event1`. The payload that is sent from the
   front-end to the socket server should contain the channel's name, e.g. the following:
    ```json
    {
        "message": "Hello, world!!!",
        "channel": "channel1"
    }
     ```

   Server events should have the `server:` prefix attached to the event name, e.g. `server:event2`. Here's an example of a
   front-end application utilizing the socket:

    ```html
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Socket.io Client</title>
        <script src="https://cdn.socket.io/4.0.0/socket.io.min.js"></script>
        <script>
            document.addEventListener('DOMContentLoaded', () => {
                const socket = io('http://localhost:3000');
    
                socket.on('server:event2', (data) => {
                    document.getElementById('messages').innerHTML += `<p>${data.message}</p>`;
                });
    
                document.getElementById('sendBtn').addEventListener('click', () => {
                    const msg = document.getElementById('messageInput').value;
                    socket.emit('client:event1', JSON.stringify({message: msg, channel: 'channel1'}));
                    document.getElementById('messageInput').value = '';
                });
            });
        </script>
    </head>
    <body>
        <h1>Socket.io Client</h1>
        <input type="text" id="messageInput" placeholder="Type a message">
        <button id="sendBtn">Send</button>
        <div id="messages"></div>
    </body>
    </html>
    ```
5. **Setting Up the Server:**
   Assuming the back-end is a Laravel application, first off, make sure that the broadcast driver is set to `redis` and your application is able to connect to your Redis server.
    ```sh
    BROADCAST_DRIVER=redis
    ```

   A server event class should implement `ShouldBroadcastNow` interface:

    ```php
    <?php
    
    namespace App\Events;
    
    use Illuminate\Broadcasting\Channel;
    use Illuminate\Broadcasting\InteractsWithSockets;
    use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
    use Illuminate\Foundation\Events\Dispatchable;
    use Illuminate\Queue\SerializesModels;
    
    class Event2 implements ShouldBroadcastNow {
        use Dispatchable, InteractsWithSockets, SerializesModels;
    
        public function __construct(public string $message) {}
    
        public function broadcastOn() {
            return new Channel('channel1');
        }
    
        public function broadcastAs(): string {
            return 'server:event2';
        }
    }
    ```
   Then, you can broadcast the event from your controller or any other part of your application:

    ```php
    broadcast(new Event2('Hello, world!!!'));
    ```
6. **Listening to Client events:**
   To listen to client events, you can use the `Redis` facade to subscribe to the channel and listen for the event:
    ```php
    Redis::subscribe(['channel1'], function ($message) {
        $data = json_decode($message, true);
        if ($data['channel'] === 'channel1') {
            // Handle the event
        }
    });
    ```