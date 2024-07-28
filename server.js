require('dotenv').config();
const http = require('http');
const socketIo = require('socket.io');

const Redis = require('ioredis');
const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = process.env.REDIS_PORT || 6379;
const redisPassword = process.env.REDIS_PASSWORD || null;

const channels = process.env.CHANNELS.split(',');
const events = process.env.EVENTS.split(',');

const server = http.createServer((req, res) => {
	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.end('Socket Server is running');
});

const io = socketIo(server, {
	cors: {
		origin: '*',
		methods: ['GET', 'POST']
	}
});

const redis = new Redis({
	host: redisHost,
	port: redisPort,
	password: redisPassword
});

channels.forEach(channel => {
	redis.subscribe(channel, (err, count) => {
		if (err) {
			console.error('Failed to subscribe: %s', err.message);
		} else {
			console.log(`Subscribed successfully! This client is currently subscribed to ${count} channels.`);
		}
	});
})

redis.on('message', (channel, message) => {
	console.log(`Redis message received from ${channel}: ${message}`);
	const eventInfo = JSON.parse(message);
	const eventName = `client:${eventInfo.event}`;

	io.emit(eventName, eventInfo.data);
});

io.on('connection', (socket) => {
	console.log('A client connected');

	events.forEach(event => {
		socket.on(event, (data) => {
			console.log(`Event ${event} received from client:`, data);
			socket.broadcast.emit('message', JSON.stringify({ event, data }));
			// redis.publish('message', JSON.stringify({ event, data }));
		}
	)});

	// socket.on('clientMessage', (msg) => {
	// 	console.log('Message from client:', msg);
	//
	// 	socket.broadcast.emit('message', msg);
	// });

	socket.on('disconnect', () => {
		console.log('Client disconnected');
	});
});

const port = 3000;
server.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
