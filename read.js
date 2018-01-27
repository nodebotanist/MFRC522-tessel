const Tessel = require('tessel-io')
const Five = require('johnny-five')
const MFRC522 = require('./MFRC522')

let board = new Five.Board({
  io: new Tessel()
})

board.on('ready', () => {
  console.log('ready!')
  let reader = new MFRC522()
})
