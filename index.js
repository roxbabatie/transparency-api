'use strict';

const Hapi = require('hapi');

//const server = new Hapi.Server(~~process.env.PORT || 3000, '0.0.0.0');
const server = new Hapi.Server();
const mysql      = require('mysql');

const pool      =    mysql.createPool({
    connectionLimit : 100, //important
    host     : 'bqmayq5x95g1sgr9.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
    user     : 't3bp613kvelut0qs',
    password : 'b4r0a9k673529pbq',
    database : 'f67iclmsfga6k6kx',
    debug    :  false
});

server.connection({ port: process.env.PORT || 5000 });
server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
        reply('Hello, world!');
    }
});

server.route({
    method: 'GET',
    path: '/search',
    handler: function (request, reply) {
        //reply('Hello, search');
        var filter = "SELECT id, institutie, judet, venit, cheltuieli, arie, DATE_FORMAT(data_raport,'%m-%Y') AS data FROM  info";

        if (request.query.area !== undefined) {
            filter += " WHERE arie='"+encodeURIComponent(request.query.area)+"'";
        }

        if (request.query.inst !== undefined) {
            if (request.query.area !== undefined) {
                filter += " AND institutie LIKE '%"+encodeURIComponent(request.query.inst)+"%'";
            } else {
                filter += " WHERE institutie LIKE '%"+encodeURIComponent(request.query.inst)+"%'";
            }
        }

        filter +=';';

        handle_database(filter,reply);
        console.log("executig: ", filter);
    }
});

server.route({
    method: 'GET',
    path: '/compare/{institutie*2}',
    handler: function (request, reply) {
        const instParts = request.params.institutie.split('/');
        const query = "SELECT id, institutie, venit, cheltuieli FROM info WHERE id='" + encodeURIComponent(instParts[0]) +
            "' OR id='" + encodeURIComponent(instParts[1]) + "';";
        handle_database(query, reply);
    }
});

server.start((err) => {
    if (err) {
        throw err;
    }
    console.log('Server running at:', server.info.uri);
});


function handle_database(query,res) {

    pool.getConnection(function(err,connection){
        if (err) {
            connection.release();
            res({"code" : 100, "status" : "Error in connection database"});
            console.log('{"code" : 100, "status" : "Error in connection database"}');
            return;
        }

        console.log('connected as id ' + connection.threadId);

        connection.query(query,function(err,rows){
            connection.release();
            if(!err) {
               res(rows);
                console.log("result: ", rows);
            }
        });

        connection.on('error', function(err) {
            res({"code" : 100, "status" : "Error in connection database"});
            console.log('{"code" : 100, "status" : "Error in connection database"}');
            return;
        });
    });
}