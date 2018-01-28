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
}

class MFRC522 {
  init () {
    this.spi = new Tessel.port['A'].SPI({
      clockSpeed: 4 * 1000 * 1000, // 4KHz
      chipSelect: PINS.CHIP_SELECT
    })
  }

  write (register, data, callback) {
    this.spi.transfer(Buffer.from([(register << 1) & 0x7E].concat(data)), callback)
  }

  read (register, callback) {
    this.spi.transfer(Buffer.from([((register << 1) & 0x7E) | 0x80, 0]), callback)
  }

  setBitMask (register, mask, callback) {
    this.read(register, (err, data) => {
      if (err) {
        callback(err)
      } else {
        this.write(register, data | mask, callback)
      }
    })
  }

  clearBitMask (register, mask, callback) {
    this.read(register, (err, data) => {
      if (err) {
        callback(err)
      } else {
        this.write(register, data & (~mask), callback)
      }
    })
  }
}

module.exports = MFRC522
