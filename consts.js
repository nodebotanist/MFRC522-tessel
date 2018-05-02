module.exports = {
  MAX_FIFO_LENGTH: 64,
  PINS: {
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
  },
  REGISTERS: {
    COMMAND: 0x01 << 1,
    COMMAND_IEN: 0x02 << 1,
    DIV_EN: 0x03 << 1,
    COMMAND_IRQ: 0x04 << 1,
    DIV_IRQ: 0x05 << 1,
    ERROR: 0x06 << 1,
    STATUS1: 0x07 << 1,
    STATUS2: 0x08 << 1,
    FIFO_DATA: 0x09 << 1,
    FIFO_LEVEL: 0x0A << 1,
    WATER_LEVEL: 0x0B << 1,
    CONTROL: 0x0C << 1,
    BIT_FRAMING: 0x0D << 1,
    COLL: 0x0E << 1,
    NODE: 0x11 << 1,
    TX_MODE: 0x12 << 1,
    RX_MODE: 0x13 << 1,
    TX_CONTROL: 0x14 << 1,
    TX_AUTO: 0x15 << 1,
    TX_SELECT: 0x16 << 1,
    RX_SELECT: 0x17 << 1,
    RX_THRESHOLD: 0x18 << 1,
    DEMOD: 0x19 << 1,
    MIFARE: 0x1C << 1,
    SERIAL_SPEED: 0x1F << 1,
    CRC_RESULT_H: 0x21 << 1,
    CRC_RESULT_L: 0x22 << 1,
    MOD_WIDTH: 0x24 << 1,
    RFC_FG: 0x26 << 1,
    GSN: 0x27 << 1,
    CW_GSP: 0x28 << 1,
    MOD_GSP: 0x29 << 1,
    T_MODE: 0x2A << 1,
    T_PRESCALER: 0x2B << 1,
    T_RELOAD_H: 0x2C << 1,
    T_RELOAD_L: 0x2D << 1,
    T_COUNTER_VALUE_H: 0x2E << 1,
    T_COUNTER_VALUE_L: 0x2F << 1
  },
  COMMANDS: {
    IDLE: 0x00,
    TRANSCEIVE: 0x0C,
    AUTHENTICATE: 0x0E
  },
  STATUS: {
    OK: 0,
    NO_TAG: 1,
    ERROR: 2
  },
  PICC: {
    REQIDL: 0x26
  }
}
