const async = require('async')
const Tessel = require('tessel')

function MFRC522 () {
  this.spi = null
}

MFRC522.prototype.MAX_FIFO_LENGTH = 16

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
  COMMAND: 0x01,
  COMMAND_IEN: 0x02,
  DIV_EN: 0x03,
  COMMAND_IRQ: 0x04,
  DIV_IRQ: 0x05,
  ERROR: 0x06,
  STATUS1: 0x07,
  STATUS2: 0x08,
  FIFO_DATA: 0x09,
  FIFO_LEVEL: 0x0A,
  WATER_LEVEL: 0x0B,
  CONTROL: 0x0C,
  BIT_FRAMING: 0x0D,
  COLL: 0x0E,
  NODE: 0x11,
  TX_MODE: 0x12,
  RX_MODE: 0x13,
  TX_CONTROL: 0x14,
  TX_AUTO: 0x15,
  TX_SELECT: 0x16,
  RX_SELECT: 0x17,
  RX_THRESHOLD: 0x18,
  DEMOD: 0x19,
  MIFARE: 0x1C,
  SERIAL_SPEED: 0x1F,
  CRC_RESULT_H: 0x21,
  CRC_RESULT_L: 0x22,
  MOD_WIDTH: 0x24,
  RFC_FG: 0x26,
  GSN: 0x27,
  CW_GSP: 0x28,
  MOD_GSP: 0x29,
  T_MODE: 0x2A,
  T_PRESCALER: 0x2B,
  T_RELOAD_H: 0x2C,
  T_RELOAD_L: 0x2D,
  T_COUNTER_VALUE_H: 0x2E,
  T_COUNTER_VALUE_L: 0x2F
}

MFRC522.prototype.COMMANDS = {
  IDLE: 0x00,
  TRANSCEIVE: 0x0C,
  AUTHENTICATE: 0x0E
}

MFRC522.prototype.STATUS = {
  OK: 0,
  NO_TAG: 1,
  ERROR: 2
}

MFRC522.prototype.PICC = {
  REQIDL: 0x26
}

MFRC522.prototype.init = function (callback) {
  this.spi = new Tessel.port['A'].SPI({
    clockSpeed: 4 * 1000 * 1000, // 4KHz
    chipSelect: Tessel.port[MFRC522.prototype.PINS.CHIP_SELECT.port][MFRC522  .prototype.PINS.CHIP_SELECT.pin]
  })
  callback(null)
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
      this.write(register, [data | mask], callback)
    }
  })
}

MFRC522.prototype.clearBitMask = function (register, mask, callback) {
  this.read(register, (err, data) => {
    if (err) {
      callback(err)
    } else {
      this.write(register, [data & (~mask)], callback)
    }
  })
}

MFRC522.prototype.antennaOn = function (callback) {
  this.setBitMask(this.REGISTERS.TX_CONTROL, 0x03, (err) => {
    if (err) {
      callback(err)
    }
    this.read(this.REGISTERS.TX_CONTROL, (err, data) => {
      if (err) {
        callback(err)
      }
      console.log('TX Control Data: ', data[1])
      if ((data[1] & 0x03) !== 0x03) {
        callback(new Error('error turning on the antenna!'))
      } else {
        callback(null)
      }
    })
  })
}

MFRC522.prototype.antennaOff = function (callback) {
  this.clearBitMask(this.REGISTERS.TX_CONTROL, 0x03, (err) => {
    callback(err)
  })
}

MFRC522.prototype.readerToCard = function (command, dataToSend, callback) {
  let dataRecieved = Buffer.from([])
  let bitsRecieved = 0
  let status = 'error'
  let irqEn = 0x00
  let waitIRq = 0x00
  let lastBits = null
  let timeoutCounter = 2000
  let ack = null

  if (command === this.COMMANDS.AUTHENTICATE) {
    irqEn = 0x12
    waitIRq = 0x10
  } else if (command === this.COMMANDS.TRANSCEIVE) {
    console.log('Transcieve command recieved!')
    irqEn = 0x77
    waitIRq = 0x30
  }

  async.series([
    this.write.bind(this, this.REGISTERS.COMMAND_IEN, [irqEn | 0x80]),
    this.clearBitMask.bind(this, this.REGISTERS.COMMAND_IRQ, [0x80]),
    this.setBitMask.bind(this, this.REGISTERS.FIFO_LEVEL, [0x80]),
    this.write.bind(this, this.REGISTERS.COMMAND, [this.COMMANDS.IDLE]),
    (callback) => {
      async.eachSeries(dataToSend, (data, innerCallback) => {
        this.write(this.REGISTERS.FIFO_DATA, [data], innerCallback)
      }, callback)
    },
    this.write.bind(this, this.REGISTERS.COMMAND, [command]),
    (callback) => {
      if (command === this.COMMANDS.TRANSCEIVE) {
        this.setBitMask(this.REGISTERS.BIT_FRAMING, 0x80, callback)
      } else {
        callback(null)
      }
    },
    (callback) => {
      async.until(
        () => {
          return ~((timeoutCounter !== 0) && ~(ack & 0x01) && ~(ack & waitIRq))
        },
        (innerCallback) => {
          this.read(this.REGISTERS.COMMAND_IRQ, (err, data) => {
            ack = data[0] << 8 | data[1]
            if (ack !== 0x00) {
              console.log('Ack: ', ack)
            }
            timeoutCounter--
            if (err) {
              innerCallback(err)
            }
            innerCallback(null, data)
          })       
        }, callback
      )
    },
    (callback) => {
      console.log('Timeout counter: ', timeoutCounter, ' ACK: ', ack)
      if (timeoutCounter !== 0) {
        this.read(this.REGISTERS.ERROR, (err, data) => {
          if (err) {
            callback(err)
          } else {
            if (data & 0x1B === 0x00) {
              status = this.STATUS.OK
            }
            if (ack & irqEn & 0x01) {
              status = this.STATUS.NO_TAG
            }
            callback(null)
          }
        })
      } else {
        callback(new Error('MFRC522 Trancieve error.'))
      }
    },
    (callback) => {
      if (this.status === this.STATUS.NO_TAG | command !== this.COMMANDS.TRANSCEIVE) {
        callback(null)
      }
      this.read(this.REGISTERS.FIFO_LEVEL, (err, bytes) => {
        if (err) {
          callback(err)
        }
        this.read(this.REGISTERS.CONTROL, (err, data) => {
          if (err) {
            callback(err)
          }
          lastBits = data[0] & 0x07
          if (lastBits !== 0) {
            bitsRecieved = (bytes - 1) * 8 + lastBits
          } else {
            bitsRecieved = bytes * 8
          }

          if (bytes === 0) {
            bytes = 1
          } else if (bytes > this.MAX_FIFO_LENGTH) {
            bytes = this.MAX_FIFO_LENGTH
          }

          let bytesRecieved = 0
          async.until(
            () => bytesRecieved >= bytes,
            (callback) => {
              this.read(this.REGISTERS.FIFO_DATA, (err, data) => {
                if (err) {
                  callback(err)
                }
                if (data && data.length && data.length > 0) {
                  if (dataRecieved) {
                    dataRecieved.concat(data)
                  } else {
                    dataRecieved = data
                  }
                  bytesRecieved++
                }
              })
            })
          callback(null, dataRecieved)
        })
      })
    }
  ], (err, dataRecieved) => {
    if (err) {
      callback(err)
    } else {
      callback(null, dataRecieved)
    }
  })

  callback(null, {
    status,
    dataRecieved,
    bitsRecieved
  })
}

MFRC522.prototype.search = function (reqType, callback) {
  this.write(this.REGISTERS.BIT_FRAMING, [0x07])
  this.readerToCard(this.COMMANDS.TRANSCEIVE, reqType, callback)
}

module.exports = MFRC522
