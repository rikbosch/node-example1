'use strict';

var amqp = require('amqp'), //rabbitmq connectie
    edge = require('edge'), //voor sql queries
    dateFormat = require('dateformat'); //dateformatting


process.env.EDGE_SQL_CONNECTION_STRING = 'Data Source=10.0.0.8,1437;Initial Catalog=TMS_DAI_STAGING;Integrated Security=True';

exports.run = function (callback) {

    //sql functie voor updaten locatie (code in commentaar wordt geparsed naar sql code)
    var updateLocation = edge.func('sql', function () {/*
		UPDATE tblActuelePosities 
		SET
		txtBoordcomputer = @boardComputerId,
		txtKenteken = @licensePlate,
		txtVlootnummer = @fleetNumber,
		dtmLaatsteLevensteken = @timestampUtc,
		dblX = @x,
		dblY = @y,
		intOdo = @odometer,
		dblSpeed = @speed
		WHERE idVloot = @fleetId AND dtmLaatsteLevensteken < @timestampUtc	
    */});

    //verbinding maken met rabbitMq
    var connection = amqp.createConnection({ vhost: 'transplan.staging' });

    //error logging
    connection.on('error', function (e) {
        console.log(e);
    });

    //evt. heartbeat logging
    connection.on('heartbeat', function () {
        console.log('heartbeat');
    });


    connection.on('ready', function () {
        console.log('connected');

        // queue aanmaken voor berichten
        connection.queue('node-js', function (q) {
            console.log('binding to queue node-js');

            //queue binden aan exchange voor coordinaat messages
            //MassTransit published berichten naar exchanges
            q.bind('FleetSync.Contracts:CoordinatesReceived', '', function () {
                console.log('bound to exchange');
            });

            //bij nieuwe message, parsen en locatie updaten
            q.on('message', function (json, headers, deliveryInfo) {
                console.log('received message');

                //json.data bevat raw bytes uit rabbitmq bericht               
                var envelope = JSON.parse(json.data);

                //envelope bevat nu gedeserializeerde MassTransit envelop (incl headers / messagetype) (a la Consumes<CoordinatesReceived>.Context)                                
                var m = envelope.message; //message property bevat de data

                //timestamp gedoe mbt sql server functie, format naar iets wat bekend is
                m.timestampUtc = dateFormat(m.timestampUtc, 'yyyy-mm-dd h:MM:ss');

                console.log(m);

                //update sql functie aanroepen
                updateLocation(m, function (e, r) {
                    if (e) {
                        console.log(e);
                    }
                    else {
                        console.log('updated position');
                    }
                });
            });


            //queue subscriben (vanaf hier komen berichten binnen in eventhandler hierboven)
            q.subscribe();

        });
    });

    callback();
};