var io = require('socket.io-client');
var socket = io('http://localhost:3000');

socket.on('joined', function(entityId) {
    console.log('Received ' + entityId + ' from server');
    console.log('--------');
});

socket.on('updateEntities', function(entityList) {
    console.log('Updating entities');
    for (let entity of entityList) {
        console.log(`EntityId: ${entity.id} Update: ${entity.update}`);
    }
    console.log('--------');
});

socket.on('destroyEntities', function(entityList) {
    console.log('Destroying entities');
    for (let entity of entityList) {
        console.log(`Destroying ${entity.id}`);
    }
    console.log('--------');
});