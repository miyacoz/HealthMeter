# HealthMeter
Is just a small shouter to inform me on Discord whether my servers are still alive or not with some statistics

- availability confirmed on ubuntu system (20.x LTS)
  - it may work on a similar system which fulfills the requirements below:
    - `/proc/meminfo` file
    - `uptime` command
      - it may not work on mac or bsd systems because of the different format of the output
    - `df` command
    - `nohup` command
    - `bash` or `zsh`

# usage

## requirement

- node >= 14.0.0
  - cf.: https://nodejs.org/api/fs.html#fs_promises_api

## preparation

- install `node` and `yarn`
- make `.env` file by copying `.env.sample`, and rewrite the `WEBHOOK_URL` value with your discord webhook url
- type `yarn` or `yarn install` to make the program ready to start

## commands

- type `yarn start` to start monitoring
  - a message is posted for your discord immediately after starting
  - after that, it posts the stats at every hour 00 minutes
  - 2 files `nohup.out` and `pid` appear in the project directory
    - ***DO NOT DELETE `pid` FILE***, it is required to stop the program
    - `nohup.out` can be deleted at any time
- type `yarn stop` to stop monitoring
  - `pid` file is automatically deleted after stopping the program succeeds
