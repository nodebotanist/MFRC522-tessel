# Notes from reading the datasheet

NSS = Peripheral Select Line, pull low to indicate comms

uses MSB for data transfer

To read data, send a register address, THEN read from peripheral
To get data for the last address sent, you need to send 0x00 to flush data

To write data to the peripheral, write the register address, then data to be written

IRQ is an interrupt pin that can be used
