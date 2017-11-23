'use strict'
// Import the interface to Tessel hardware
const tessel = require('tessel')
const MFRC522 = require('./MFRC522')

let mfrc522 = new MFRC522()

mfrc522.on('ready', () => {
  console.log('ready!')
})

mfrc522.init()