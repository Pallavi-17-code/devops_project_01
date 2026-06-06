const chalk = require('chalk');

const log = {
  info: (msg) => console.log(chalk.cyan('➜ ') + chalk.cyanBright('INFO    ') + chalk.gray(msg)),
  success: (msg) => console.log(chalk.green('✔ ') + chalk.greenBright('SUCCESS ') + chalk.white(msg)),
  warn: (msg) => console.log(chalk.yellow('⚠ ') + chalk.yellowBright('WARN    ') + chalk.yellow(msg)),
  error: (msg) => console.log(chalk.red('✖ ') + chalk.redBright('ERROR   ') + chalk.red(msg)),
  db: (msg) => console.log(chalk.blue('⛁ ') + chalk.blueBright('DATABASE ') + chalk.whiteBright(msg)),
  request: (method, url) => {
    const methods = {
      GET: chalk.bgGreen.black.bold(` ${method} `),
      POST: chalk.bgBlue.black.bold(` ${method} `),
      PUT: chalk.bgYellow.black.bold(` ${method} `),
      DELETE: chalk.bgRed.black.bold(` ${method} `),
    };
    const styledMethod = methods[method] || chalk.bgWhite.black.bold(` ${method} `);
    console.log(`\n${chalk.gray(new Date().toLocaleTimeString())} ${styledMethod} ${chalk.cyan(url)}`);
  },
  server: (port) => {
    console.log('\n' + chalk.magenta('═'.repeat(60)));
    console.log(chalk.magenta('║ ') + chalk.magentaBright.bold('ORBITAL V4.0 ELITE COMMAND CORE ONLINE'));
    console.log(chalk.magenta('═'.repeat(60)));
    console.log(chalk.cyan('➜ ') + chalk.white(`Network Sync: `) + chalk.green.underline(`http://localhost:${port}`));
    console.log(chalk.cyan('➜ ') + chalk.white(`Core Status:  `) + chalk.greenBright('Operational / Nominal'));
    console.log(chalk.cyan('➜ ') + chalk.white(`Telemetry:    `) + chalk.magentaBright('Connected & Active\n'));
  }
}

module.exports = log;
