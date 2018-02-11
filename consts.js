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
