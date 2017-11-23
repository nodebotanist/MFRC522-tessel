'use strict'

const EventEmitter = require('events').EventEmitter
const util = require('util')
const Tessel = require('tessel')

const REGISTERS = {
  COMMAND_REG: 0x01,
  ERROR_REG: 0x06,
  STATUS1: 0x07,
  STATUS2: 0x08,
  CONTROL: 0x0C,
  BIT_FRAME: 0x0D,
  MODE: 0x11,
  TX_MODE: 0x12,
  RX_MODE: 0x13,
  TX_CONTROL: 0x14,
}

function MFRC522(opts) {
  if(!(this instanceof MFRC522)){
    return new MFRC522(opts)
  }

  this.port = Tessel.port[opts.port || 'A']
  this.baud = opts.baud || 4000000
  this.spi = new port.SPI({
    clockSpeed: this.baud
  })
}

MFRC522.prototype.writeToRegister = function(register, cb) {
  register |= (1 << 7) // sets the read/write bit to write (1)
  this.spi.transfer(Buffer.from([register]), cb)
}

MFRC22.prototype.readFromRegister = function(register, numOfBytes, cb){
  register &= ~(1 << 7) // sets the read/write bit to read (0)
  this.spi.transfer(Buffer.from([register]), cb)
}

util.inherits(MFRC522, EventEmitter)

module.exports = MFRC522