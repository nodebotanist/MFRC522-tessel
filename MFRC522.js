'use strict'

const EventEmitter = require('events').EventEmitter
const util = require('util')
const Tessel = require('tessel')
const async = require('async')

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

class MFRC522 {
  constructor(opts) {
    if (!(this instanceof MFRC522)) {
      return new MFRC522(opts);
    }
    opts = opts || {};
    this.port = Tessel.port[opts.port || 'A'];
    this.baud = opts.baud || 4000000;
    this.chipSelectPin = this.port.pin[opts.pin || 5];
    this.resetPin = this.port.pin[opts.pin || 6];
    this.spi = new this.port.SPI({
      clockSpeed: this.baud
    })
  }
  init() {
    async.series([
      (cb) => {
        this.chipSelectPin.write(1, cb);
      },
      this.reset
    ], () => {
      this.emit('ready')
    })
  }
  reset(cb) {
    this.resetPin.write(0, () => {
      this.resetPin.write(1, cb)
    })
  }
  writeToRegister(register, data, cb) {
    register = register << 1
    register |= (0x01); // sets the read/write bit to write (1)
    this.spi.transfer(Buffer.from([register].concat(data)), cb)
  }
  readFromRegister(register, numOfBytes, cb) {
    register = register << 1;
    register &= ~(0x01); // sets the read/write bit to read (0)
    this.spi.transfer(Buffer.from([register]), cb)
  }
}

util.inherits(MFRC522, EventEmitter)

module.exports = MFRC522