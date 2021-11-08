require('dotenv').config()
const { readFile } = require('fs/promises')
const { env, exit } = require('process')
const { post } = require('axios')
const { format } = require('date-fns')
const { getBytesString, spawn } = require('./lib.js')

;(async () => {
  try {
    /* memory */
    const lines = (await readFile('/proc/meminfo', { encoding: 'utf8' }))
      .split('\n')
      .filter(l => /memtotal|memavailable|swaptotal|swapfree/i.test(l))

    if (lines.length !== 4) {
      throw new Error(`Number of retreated lines from proc meminfo is not 4: ${lines.length}`)
    }

    const parsedMeminfo = {}
    lines
      .map(l => l.toLowerCase().split(':'))
      .forEach(([title, value]) => {
        parsedMeminfo[title] = parseInt(value.trim().split(' ')[0], 10)
      })

    const memoryUsePercent = Math.ceil(100 - (parsedMeminfo.memavailable * 100 / parsedMeminfo.memtotal))
    const swapUsePercent = Math.ceil(100 - (parsedMeminfo.swapfree * 100 / parsedMeminfo.swaptotal))

    let memoryUsed = parsedMeminfo.memtotal - parsedMeminfo.memavailable
    let swapUsed = parsedMeminfo.swaptotal - parsedMeminfo.swapfree

    /* cpu */
    const loadAverage = (await spawn('uptime'))
      .replace(/.*load average:/i, '')
      .split(',')
      .map(v => parseFloat(v, 10))

    /* disk */
    const { total: diskTotal, used: diskUsed } = (await spawn('df'))
      .trim()
      .split('\n')
      .filter((l, i) => i !== 0)
      .map(l => {
        const [, total, used] = l.replace(/\s+/g, ' ').split(' ')
        return [parseInt(total, 10), parseInt(used, 10)]
      })
      .reduce(({ total, used }, [currentTotal, currentUsed]) => ({ total: total + currentTotal, used: used + currentUsed }), { total: 0, used: 0 })
    const diskUsePercent = Math.ceil(diskUsed * 100 / diskTotal)

    const content = [
      `> ${format(new Date(), "yyyy-MM-dd HH:mm:ss 'UTC'")}`,
      `Load Average: ${loadAverage.map(v => `\`${v}\``).join(', ')}`,
      `Memory Used: \`${memoryUsePercent} %\` (\`${getBytesString(memoryUsed)}\`/\`${getBytesString(parsedMeminfo.memtotal)}\`)`,
      `Swap Used: \`${swapUsePercent} %\` (\`${getBytesString(swapUsed)}\`/\`${getBytesString(parsedMeminfo.swaptotal)}\`)`,
      `Disk Used: \`${diskUsePercent} %\` (\`${getBytesString(diskUsed)}\`/\`${getBytesString(diskTotal)}\`)`,
    ].join('\n')

    const postResult = await post(env.WEBHOOK_URL, { content })

    exit(0)
  } catch (e) {
    console.warn(e)
    exit(127)
  }
})()
