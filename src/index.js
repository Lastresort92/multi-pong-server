var io = require('socket.io')();

let entities = {};
let socketIdToEntityId = {};
let newEntityId = 1;

function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item) && item !== null)
}

function mergeDeepObject(target, source) {
    let output = Object.assign({}, target)
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] })
                }
                else {
                    output[key] = mergeDeepObject(target[key], source[key])
                }
            } else {
                Object.assign(output, { [key]: source[key] })
            }
        })
    }
    return output
}

// Works like Object.assign(), but does a recursive merge
function mergeDeep(...sources) {
    let output = {}
    for (let source of sources) {
        output = mergeDeepObject(output, source)
    }
    return output
}

function updateEntities(entityData) {
    console.log('Updating entities')
    console.log(entityData)
    for (let entity of entityData) {
        if (entity['id'] === null) {
            let id = newEntityId++;
            entities[id]['update'] = entity['update'];
            entity['id'] = id;
        }
        else {
            if ('update' in entity) {
                mergeDeepObject(entities[entity['id']]['update'], entity['update']);
            }
            if ('remove' in entity) {
                for (removeComponent of entity['remove']) {
                    delete entities[entity['id']]['update'][removeComponent];
                }
            }
        }
    }

    io.emit('updateEntities', entityData);

    console.log(`UpdateEntities with:`);
    console.log(entityData);
}

function destroyEntities(entityData) {

    console.log(`Destroying entities`)
    for (let entity of entityData) {
        if (entity['id'] !== null) {
            console.log(`destroying`)
            console.log(entity)
            delete entities[entity['id']];
        }
    }

    io.emit('destroyEntities', entityData);
}

function createPlayerEntity(socket) {
    let playerId = newEntityId++;
    socketIdToEntityId[socket.id] = playerId;
    entities[playerId] = {'update': {}};

    console.log(`Assigned ${playerId} to new player`);

    let entityList = [];

    for (let entityId in entities) {
        console.log('BUilding entity array')
        entityList.push({'id': entityId, 'update': entities[entityId]['update']});
    }

    console.log('Emitting joined')
    console.log(`EntityList:`)
    console.log(entityList)
    socket.emit('joined', {'id': playerId, 'entityList': entityList});
    // socket.emit('updateEntities', entityList);
    // io.emit('updateEntities', [{'id': playerId, 'update': entities[playerId]['update']}]);
}

io.on('connection', function(socket) {

    console.log(`Client ${socket.id} connected.`);
    socket.on('join', function(data) {
        console.log('Player joined');
        createPlayerEntity(socket);
    });

    socket.on('updateEntities', updateEntities);

    socket.on('destroyEntities', destroyEntities);

    socket.on('disconnect', function() {
        // Remove client
        console.log(`Client ${socket.id} disconnected.`);
        destroyEntities([{'id': socketIdToEntityId[socket.id]}]);
    });
});

io.listen(3000);