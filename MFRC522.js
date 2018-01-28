const async = require('async')
const Tessel = require('tessel')

function MFRC522 () {
  this.spi = null;
}

MFRC522.prototype.PINS = {
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

MFRC522.prototype.REGISTERS = {
  COMMAND_IEN: 0x02,
  COMMAND_IRQ: 0x04,
  FIFO_LOVOL: 0x0A,
  TX_CONTROL: 0x14
}

MFRC522.prototype.COMMANDS = {
  AUTHENTICATE: 0x0E,
  TRANSCEIVE: 0x0C
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
  this.setBitMask(this.REGISTERS.TX_CONTROL, 0x03)
}

MFRC522.prototype.antennaOff = function () {
  this.clearBitMask(this.REGISTERS.TX_CONTROL, 0x03)
}

MFRC522.prototype.readerToCard = function (command, dataToSend, callback) {
  let dataRecieved = []
  let dataRecievedLength = 0
  let status = 'error'
  let irqEn = 0x00
  let waitIRq = 0x00
  let lastBits = null
  let timeout = 2000

  if (command === this.COMMANDS.AUTHENTICATE) {
    irqEn = 0x12
    waitIRq = 0x10
  } else if (command === this.COMMANDS.TRANSCEIVE) {
    irqEn = 0x77
    waitIRq = 0x30
  }

  async.series([
    this.write.bind(this, [this.REGISTERS.COMMAND_IEN, irqEn | 0x80]),
    this.clearBitMask.bind(this, [this.REGISTERS.COMMAND_IRQ, 0x80]),
    this.setBitMask.bind(this, [this.REGISTERS.FIFO_LEVEL, 0x80])
  ], (err) => {
    if (err) {
      callback(err)
    }
  })
}

MFRC522.prototype.search = function () {

}

module.exports = MFRC522
