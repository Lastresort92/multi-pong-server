var io = require('socket.io')();

let entities = {};
let socketIdToEntityId = {};
let newEntityId = 1;

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

    for (entity in entityData) {
        if (entity['id'] === null) {
            entities[newEntityId++]['update'] = entity['update'];
        }
        else {
            mergeDeepObject(entities[entity['id']]['update'], entity['update']);
            for (removeComponent in entity['remove']) {
                delete entities[entity['id']]['update'][removeComponent];
            }
        }
    }

    io.emit('updateEntities', {
        'entities': entityData
    });

    console.log(`UpdateEntities with:`);
    console.log(entityData);
}

function destroyEntities(entityData) {

    for (entity in entityData) {
        if (entity['id'] !== null) {
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
        entityList.push({'id': entityId, 'update': entities[entityId]['update']});
    }

    socket.emit('joined', {'id': playerId, 'entityList': entityList});
    // socket.emit('updateEntities', entityList);
    // io.emit('updateEntities', [{'id': playerId, 'update': entities[playerId]['update']}]);
}

io.on('connection', function(socket) {

    console.log(`Client ${socket.id} connected.`);
    createPlayerEntity(socket);

    socket.on('updateEntities', updateEntities);

    socket.on('destroyEntities', destroyEntities);

    socket.on('disconnect', function() {
        // Remove client
        console.log(`Client ${socket.id} disconnected.`);
        destroyEntities([{'id': socketIdToEntityId[socket.id]}]);
    });
});

io.listen(3000);