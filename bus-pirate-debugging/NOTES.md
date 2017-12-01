# From the datasheet

* **Not** 5V tolerant.
* NSS: Chip Select pin
* IRQ: Interrupt Pin
* MSB First

## SPI "Addressing"

* MSB is the mode (1 = read, 2 = write)
* LSB is always 0

## CRC Coprocessor

## FIFO Queue for Read/Write to Chip

* 8 x 64 bits
* Buffers input *and* output
* Acessing the FIFO buffer
  * Read from FifoDataReg Address
    * Reads byte at read pointer, decrements it
  * Write to FifoDataReg Address
    * Writes to end of buffer, increments write pointer
  * FifoLeveReg = distance between read and write pointers (amount left to read)
  * FifoLevelReg has a Flush bit that, when set to 1, empties the buffer

## FIFO Buffer Status Information

* Status1Reg
  * Almost Full bit
    * WaterLevel can be set for this
  * Almost Empty bit
    * WaterLevel can be set for this
  * Overflow bit

* Can generate alerts on almost full, almost empty

## Interrupt System

Can generate interrupts on:

* Programmable timer counts from 1 to 0
* Transmitted data stream ends
* All data from FIFO has been processed by CRC
* Recieved data stream ends
* Command execution finishes (idle)
* FIFO queue almost empty/full
* An error is detected

## Timer

* Max 40 secs (see data sheet for calculations)
* Can be used for timeouts

## TODO

Figure out the register/command mix
What is a CRC, what does it mean?
How does this type of RFID work in context?