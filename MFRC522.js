'use strict'

const EventEmitter = require('events').EventEmitter
const util = require('util')
const Tessel = require('tessel')

function MFRC522(opts) {
  if(!(this instanceof MFRC522)){
    return new MFRC522(opts)
  }

  this.port = opts.port || 'A'
  this.baud = opts.baud || 10000
}

MFRC522.prototype.writeToRegister = function(register) {

}

MFRC22.prototype.readFromRegister = function(register, numOfBytes, cb){
  
}

util.inherits(MFRC522, EventEmitter)

module.exports = MFRC522