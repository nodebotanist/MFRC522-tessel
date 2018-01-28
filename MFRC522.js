const async = require('async')
const Tessel = require('tessel')

const PINS = {
  CHIP_SELECT: {
    port: 'A',
    pin: 5
  },
  RESET: {
    port: 'A',
    pin: 7
  },
  INTERRUPT: {
    port: 'A',
    pin: 6
  }
}

const REGISTERS = {
  TX_CONTROL: 0x14
}

function MFRC522 () {
  this.spi = null;
}

MFRC522.prototype.init = function () {
  this.spi = new Tessel.port['A'].SPI({
    clockSpeed: 4 * 1000 * 1000, // 4KHz
    chipSelect: Tessel.port[PINS.CHIP_SELECT.port][PINS.CHIP_SELECT.pin]
  })
}

MFRC522.prototype.write = function (register, data, callback) {
  this.spi.transfer(Buffer.from([(register << 1) & 0x7E].concat(data)), callback)
}

MFRC522.prototype.read = function (register, callback) {
  this.spi.transfer(Buffer.from([((register << 1) & 0x7E) | 0x80, 0]), callback)
}

MFRC522.prototype.setBitMask = function (register, mask, callback) {
  this.read(register, (err, data) => {
    if (err) {
      callback(err)
    } else {
      this.write(register, data | mask, callback)
    }
  })
}

MFRC522.prototype.clearBitMask = function (register, mask, callback) {
  this.read(register, (err, data) => {
    if (err) {
      callback(err)
    } else {
      this.write(register, data & (~mask), callback)
    }
  })
}

MFRC522.prototype.antennaOn = function () {
  this.setBitMask(REGISTERS.TX_CONTROL, 0x03)
}

MFRC522.prototype.antennaOff = function () {
  this.clearBitMask(REGISTERS.TX_CONTROL, 0x03)
}

module.exports = MFRC522
