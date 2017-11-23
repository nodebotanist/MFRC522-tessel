'use strict'

const EventEmitter = require('events').EventEmitter
const util = require('util')
const Tessel = require('tessel')

function MFRC522() {

}

util.inherits(MFRC522, EventEmitter)

module.exports = MFRC522