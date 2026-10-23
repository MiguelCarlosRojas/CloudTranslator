const fs = require('fs');
const path = require('path');
const os = require('os');

const home = os.homedir();
const iconPath = path.join(home, '.vork', 'vork.ico');
const localAppData = process.env.LOCALAPPDATA;

// 1. Windows Terminal Integration
if (localAppData) {
  const packagesDir = path.join(localAppData, 'Packages');
  if (fs.existsSync(packagesDir)) {
    const dirs = fs.readdirSync(packagesDir).filter(d => d.startsWith('Microsoft.WindowsTerminal'));
    dirs.forEach(d => {
      const sPath = path.join(packagesDir, d, 'LocalState', 'settings.json');
      if (fs.existsSync(sPath)) {
        try {
          const raw = fs.readFileSync(sPath, 'utf8');
          const json = JSON.parse(raw);
          const list = json.profiles.list || [];
          const existing = list.find(p => p.name === 'Vork CLI' || p.guid === '{a72886bb-f17e-4ca0-84b6-b5cb1af0c3f9}');
          
          const scriptTarget = path.join(home, '.vork', 'bin', 'vork.ps1');
          const cmdLine = `powershell.exe -NoProfile -ExecutionPolicy Bypass -NoExit -File "${scriptTarget}"`;
          
          const profileObj = {
            guid: '{a72886bb-f17e-4ca0-84b6-b5cb1af0c3f9}',
            name: 'Vork CLI',
            commandline: cmdLine,
            icon: iconPath,
            tabTitle: 'Vork CLI',
            startingDirectory: path.join(home, 'Videos', 'Visual Studio Code', 'CloudTranslator'),
            hidden: false
          };

          if (existing) {
            Object.assign(existing, profileObj);
          } else {
            list.push(profileObj);
          }
          json.profiles.list = list;
          fs.writeFileSync(sPath, JSON.stringify(json, null, 4), 'utf8');
          console.log('[OK] Windows Terminal profile registered with Vork icon in:', sPath);
        } catch (err) {
          console.error('[Error] Updating WT settings:', err.message);
        }
      }
    });
  }
}
