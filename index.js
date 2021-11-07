require('dotenv').config()
const { readFile } = require('fs/promises')
const { env, exit } = require('process')

const decimal = (value, digits = 2) => Math.floor(value * Math.pow(10, digits)) / Math.pow(10, digits)

const round = kb => {
  let value = kb
  let unit = 'kb'
  let mb = 0
  let gb = 0

  if (value / 1024 >= 1) {
    value /= 1024
    unit = 'mb'

    if (value / 1024 >= 1) {
      value /= 1024
      unit = 'gb'
    }
  }

  if (value > 100) {
    value = decimal(value, 0)
  } else if (value > 10) {
    value = decimal(value, 1)
  } else {
    value = decimal(value)
  }

  return { value, unit }
}

(async () => {
  try {
    const meminfo = await readFile('/proc/meminfo', { encoding: 'utf8' })
    const lines = meminfo
      .split('\n')
      .filter(l => /memtotal|memavailable|swaptotal|swapfree/i.test(l))

    if (lines.length !== 4) {
      throw new Error(`Number of retreated lines from proc meminfo is not 4: ${lines.length}`)
    }

    const parsed = {}
    lines
      .map(l => l.toLowerCase().split(':'))
      .forEach(([title, value]) => {
        parsed[title] = parseInt(value.trim().split(' ')[0], 10)
      })

    const memoryUsePercent = Math.ceil(100 - (parsed.memavailable * 100 / parsed.memtotal))
    const swapUsePercent = Math.ceil(100 - (parsed.swapfree * 100 / parsed.swaptotal))

    let memoryUsed = parsed.memtotal - parsed.memavailable
    let swapUsed = parsed.swaptotal - parsed.swapfree

    console.log(
      round(parsed.memtotal),
      round(memoryUsed),
      memoryUsePercent,
      round(parsed.swaptotal),
      round(swapUsed),
      swapUsePercent
    )
    exit(0)
  } catch (e) {
    console.warn(e)
    exit(127)
  }
})()
