'use strict'

const EventEmitter = require('events').EventEmitter
const util = require('util')
const Tessel = require('tessel')
const async = require('async')

const REGISTERS = {
  COMMAND: 0x01,
  ERROR_REG: 0x06,
  STATUS1: 0x07,
  STATUS2: 0x08,
  CONTROL: 0x0C,
  BIT_FRAME: 0x0D,
  MODE: 0x11,
  TX_MODE: 0x12,
  RX_MODE: 0x13,
  MOD_WIDTH: 0x24,
  TX_CONTROL: 0x14,
  FIFO_LEVEL: 0x0A,
  FIFO_DATA: 0x09
}

const COMMANDS = {
  PCD_IDLE: 0x00,
  TRANSCIEVE: 0x0C
}

class MFRC522 {
  constructor (opts) {
    if (!(this instanceof MFRC522)) {
      return new MFRC522(opts)
    }
    opts = opts || {}
    this.port = Tessel.port[opts.port || 'A']
    this.baud = opts.baud || 4000000
    this.chipSelectPin = this.port.pin[opts.pin || 5]
    this.resetPin = this.port.pin[opts.pin || 6]
    this.spi = new this.port.SPI({
      clockSpeed: this.baud
    })
  }
  init () {
    async.series([
      (cb) => {
        this.chipSelectPin.write(1, cb)
      },
      this.reset.bind(this),
      this.resetBaud.bind(this),
      this.setModWidth.bind(this),
      this.enableAntenna.bind(this)
    ], () => {
      this.emit('ready')
    })
  }
  scanForPICC () {
    async.series([
      this.resetBaud.bind(this),
      this.setModWidth.bind(this),

    ])
  }
  communicateWithPICC (command, dataToSend, cb) {
    async.serial([
      (cb) => {
        this.writeToRegister(REGISTERS.FIFO_LEVEL, 0x00, cb) // clear FIFO data queue
      },
      (cb) => {
        this.writeToRegister(REGISTERS.COMMAND, COMMANDS.PCD_IDLE, cb)
      },
      (cb) => {
        this.writeToRegister(REGISTERS.FIFO_DATA, dataToSend, cb)
      },
      (cb) => {
        this.writeToRegister(REGISTERS.COMMAND, command, cb)
      },
      (cb) => {
        if (command === COMMANDS.TRANSCIEVE) {
          this.readFromRegister(REGISTERS.BIT_FRAME, (err, data) => {
            if (err) {
              cb(err)
            }
            this.writeToRegister(REGISTERS.BIT_FRAME, [(data[0] | 0x80)], cb)
          })
        } else {
          cb(null)
        }
      }
    ], cb)
  }
  reset (cb) {
    this.resetPin.write(0, () => {
      this.resetPin.write(1, cb)
    })
  }
  resetBaud (cb) {
    this.writeToRegister(REGISTERS.TX_MODE, [0x00], (err) => {
      if (err) {
        cb(err)
      }
      this.writeToRegister(REGISTERS.RX_MODE, [0x00], cb)
    })
  }
  setModWidth (cb) {
    this.writeToRegister(REGISTERS.MOD_WIDTH, [0x00], cb)
  }
  enableAntenna (cb) {
    this.readFromRegister(REGISTERS.TX_CONTROL, (err, data) => {
      if (err) {
        cb(err)
      }
      if ((data[0] & 0x03) !== 0x03) {
        this.writeToRegister(REGISTERS.TX_CONTROL, [(data[0] | 0x03)], cb)
      }
    })
  }
  writeToRegister (register, data, cb) {
    async.series([
      (cb) => {
        this.chipSelectPin.write(0, cb)
      },
      (cb) => {
        register = register << 1
        register &= ~(0x01 << 7) // sets the read/write bit to write (0)
        this.spi.transfer(Buffer.from([register].concat(data)), cb)
      },
      (cb) => {
        this.chipSelectPin.write(1, cb)
      }
    ], cb)
  }
  readFromRegister (register, cb) {
    async.series([
      (cb) => {
        this.chipSelectPin.write(0, cb)
      },
      (cb) => {
        register = register << 1
        register |= (0x01 << 7) // sets the read/write bit to read (1)
        this.spi.transfer(Buffer.from([register]), cb)
      },
      (cb) => {
        this.chipSelectPin.write(1, cb)
      }
    ], cb)
  }
}

util.inherits(MFRC522, EventEmitter)

module.exports = MFRC522
