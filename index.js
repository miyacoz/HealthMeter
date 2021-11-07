require('dotenv').config()
const { readFile } = require('fs/promises')
const { env, exit } = require('process')
const { spawn: nonPromiseSpawn } = require('child_process')

const round = value => {
  let digits = 2
  if (value > 100) {
    digits = 0
  } else if (value > 10) {
    digits = 1
  }

  return Math.floor(value * Math.pow(10, digits)) / Math.pow(10, digits)
}

const convertUnit = value => {
  let unit = 'kb'

  if (value / 1024 >= 1) {
    value /= 1024
    unit = 'mb'

    if (value / 1024 >= 1) {
      value /= 1024
      unit = 'gb'
    }
  }

  return { value: round(value), unit }
}

const spawn = command => new Promise((s, j) => {
  const child = nonPromiseSpawn(command)
  child.stdout.on('data', data => s(String(data)))
  child.stderr.on('data', data => j(String(data)))
  child.on('close', code => s(String(code)))
})

;(async () => {
  try {
    /* memory */
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

    /* cpu */
    const uptimeResult = await spawn('uptime')
    const loadAverage = uptimeResult
      .replace(/.*load average:/i, '')
      .split(',')
      .map(v => parseFloat(v, 10))

    /* disk */
    const dfResult = await spawn('df')
    const { total: diskTotal, used: diskUsed } = dfResult
      .trim()
      .split('\n')
      .filter((l, i) => i !== 0)
      .map(l => {
        const [, total, used] = l.replace(/\s+/g, ' ').split(' ')
        return [parseInt(total, 10), parseInt(used, 10)]
      })
      .reduce(({ total, used }, [currentTotal, currentUsed]) => ({ total: total + currentTotal, used: used + currentUsed }), { total: 0, used: 0 })
    const diskUsePercent = Math.ceil(diskUsed * 100 / diskTotal)

    console.log(
      convertUnit(parsed.memtotal),
      convertUnit(memoryUsed),
      memoryUsePercent,
      convertUnit(parsed.swaptotal),
      convertUnit(swapUsed),
      swapUsePercent,
      loadAverage,
      convertUnit(diskTotal),
      convertUnit(diskUsed),
      diskUsePercent
    )
    exit(0)
  } catch (e) {
    console.warn(e)
    exit(127)
  }
})()
