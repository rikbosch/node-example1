'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
    
/**
 * vehicle position Schema
 */


var PositionPulse = new Schema({
    timestamp: Date,
    x: Number,
    y: Number   
});

var Vehicle = new Schema({
    licencePlate: String,
    Positions: [PositionPulse]  
});

/**
 * Validations
 */

Vehicle.methods.findByLicencePlate = function (licencePlate, callback) {
    return this.findByLicencePlate({ licencePlate: licencePlate }, callback);
};

mongoose.model('Vehicle', Vehicle);
