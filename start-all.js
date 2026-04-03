const { spawn } = require('child_process');

function run(command, args, cwd) {
  const child = spawn(command, args, { cwd, stdio: 'inherit', shell: true });
  child.on('exit', (code) => {
    if (code !== 0) {
      process.exit(code);
    }
  });
}

run('npm', ['run', 'dev'], __dirname);
