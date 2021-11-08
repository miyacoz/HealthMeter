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

const getBytesString = value => {
  const converted = convertUnit(value)
  return `${converted.value} ${converted.unit.toUpperCase()}`
}

const spawn = command => new Promise((s, j) => {
  const child = nonPromiseSpawn(command)
  child.stdout.on('data', data => s(String(data)))
  child.stderr.on('data', data => j(String(data)))
  child.on('close', code => s(String(code)))
})

module.exports = {
  getBytesString,
  spawn,
}
