const async = require('async')
const Tessel = require('tessel')

const CONSTS = require('./consts')

function MFRC522 () {
  this.spi = null
}

MFRC522.prototype.PICC = CONSTS.PICC
MFRC522.prototype.STATUS = CONSTS.STATUS

MFRC522.prototype.init = function (callback) {
  this.spi = new Tessel.port['A'].SPI({
    clockSpeed: 4 * 1000 * 1000, // 4KHz
    chipSelect: Tessel.port[CONSTS.PINS.CHIP_SELECT.port][CONSTS.PINS.CHIP_SELECT.pin]
  })
  callback(null)
}

MFRC522.prototype.write = function (register, data, callback) {
  this.spi.transfer(Buffer.from([(register << 1) & 0x7E].concat(data)), callback)
}

MFRC522.prototype.read = function (register, callback) {
  // send 0 as data to indicate a read
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
  this.setBitMask(CONSTS.REGISTERS.TX_CONTROL, 0x03, (err) => {
    if (err) {
      callback(err)
    }
    this.read(CONSTS.REGISTERS.TX_CONTROL, (err, data) => {
      if (err) {
        callback(err)
      }
      if ((data[1] & 0x03) !== 0x03) {
        callback(new Error('error turning on the antenna!'))
      } else {
        callback(null)
      }
    })
  })
}

MFRC522.prototype.antennaOff = function (callback) {
  this.clearBitMask(CONSTS.REGISTERS.TX_CONTROL, 0x03, (err) => {
    callback(err)
  })
}

MFRC522.prototype.readerToCard = function (command, dataToSend, callback) {
  let dataRecieved = Buffer.from([])
  let bitsRecieved = 0
  let status = 'error'
  let lastBits = null
  let timeoutCounter = 2000
  let ack = null

  let commandRegisterValues = this.setCommandRegisterValues(command)

  async.series([
    this.setBitMask.bind(this, CONSTS.REGISTERS.FIFO_LEVEL, [0x80]), // clears the FIFO Buffer pointer
    this.write.bind(this, CONSTS.REGISTERS.COMMAND, [CONSTS.COMMANDS.IDLE]), // cancels current command execution
    (callback) => {
      async.eachSeries(dataToSend, (data, innerCallback) => {
        this.write(CONSTS.REGISTERS.FIFO_DATA, [data], innerCallback)
      }, callback)
    },
    this.write.bind(this, CONSTS.REGISTERS.COMMAND, [command]),
    (callback) => {
      if (command === CONSTS.COMMANDS.TRANSCEIVE) {
        this.setBitMask(CONSTS.REGISTERS.BIT_FRAMING, 0x80, callback)
      } else {
        callback(null)
      }
    },
    (callback) => {
      async.until(
        () => {
          return ~((timeoutCounter !== 0) && ~(ack & 0x01) && ~(ack & commandRegisterValues.waitIRq))
        },
        (innerCallback) => {
          this.read(CONSTS.REGISTERS.COMMAND_IRQ, (err, data) => {
            ack = data[0] << 8 | data[1]
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
      if (timeoutCounter !== 0) {
        this.read(CONSTS.REGISTERS.ERROR, (err, data) => {
          if (err) {
            callback(err)
          } else {
            if (data & 0x1B === 0x00) {
              // TODO: Make more user friendly status
              status = CONSTS.STATUS.OK
            }
            if (ack & commandRegisterValues.irqEn & 0x01) {
              // TODO: Make more user friendly status              
              status = CONSTS.STATUS.NO_TAG
            }
            callback(null)
          }
        })
      } else {
        callback(new Error('MFRC522 Trancieve error.'))
      }
    },
    (callback) => {
      if (this.status === CONSTS.STATUS.NO_TAG | command !== CONSTS.COMMANDS.TRANSCEIVE) {
        callback(null)
      }
      this.read(CONSTS.REGISTERS.FIFO_LEVEL, (err, bytes) => {
        if (err) {
          callback(err)
        }
        this.read(CONSTS.REGISTERS.CONTROL, (err, data) => {
          if (err) {
            callback(err)
          }
          lastBits = data[0] & 0x07
          bytes = data[1]
          if (lastBits !== 0) {
            bitsRecieved = (bytes - 1) * 8 + lastBits
          } else {
            bitsRecieved = bytes * 8
          }

          if (bytes === 0) {
            bytes = 1
          } else if (bytes > CONSTS.MAX_FIFO_LENGTH) {
            bytes = this.MAX_FIFO_LENGTH
          }

          let bytesRecieved = 0
          async.until(
            () => bytesRecieved >= bytes,
            (callback) => {
              this.read(CONSTS.REGISTERS.FIFO_DATA, (err, data) => {
                if (err) {
                  callback(err)
                }
                if (data && data.length && data.length > 0) {
                  if (dataRecieved.length > 0) {
                    Buffer.concat([dataRecieved, data])
                  } else {
                    dataRecieved = data
                  }
                  bytesRecieved++
                }
                callback(null)
              })
            }, () => {
              callback(null, dataRecieved)
            })
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
}

MFRC522.prototype.setCommandRegisterValues = function (command) {
  let irqEn, waitIRq
  if (command === CONSTS.COMMANDS.AUTHENTICATE) {
    irqEn = 0x12
    waitIRq = 0x10
  } else if (command === CONSTS.COMMANDS.TRANSCEIVE) {
    console.log('Transcieve command recieved!')
    irqEn = 0x77
    waitIRq = 0x30
  }
  return {
    irqEn,
    waitIRq
  }
}

MFRC522.prototype.search = function (reqType, callback) {
  this.write(CONSTS.REGISTERS.BIT_FRAMING, [0x07])
  this.readerToCard(CONSTS.COMMANDS.TRANSCEIVE, reqType, callback)
}

module.exports = MFRC522
