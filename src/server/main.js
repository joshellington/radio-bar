// eslint-disable-next-line import/no-extraneous-dependencies
const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron')
const { is } = require('electron-util')
const { menubar } = require('menubar')
const path = require('path')

const createMainWindow = (mb) => {
  // const mainWindow = new BrowserWindow({
  //   backgroundColor: '#fff',
  //   width: 500,
  //   height: 350,
  //   webPreferences: {
  //     devTools: is.development,
  //     nodeIntegration: true,
  //     backgroundThrottling: false,
  //     contextIsolation: false,
  //   }
  // });
  const mainWindow = mb.window

  const playPauseShortcut = globalShortcut.register(
    'mediaplaypause',
    function () {
      console.log('mediaplaypause pressed')
      mainWindow.webContents.send('media', 'playpause')
    },
  )
  if (!playPauseShortcut) {
    console.log('mediaplaypause registration failed')
  } else {
    console.log('mediaplaypause registration bound!')
  }

  const nextTrackShortcut = globalShortcut.register(
    'medianexttrack',
    function () {
      console.log('medianexttrack pressed')
      mainWindow.webContents.send('media', 'next')
    },
  )
  if (!nextTrackShortcut) {
    console.error('medianexttrack registration failed')
  }

  ipcMain.on('resize', (e, data) => {
    // console.log(e, data);
    mb.window?.setSize(400, data)
  })

  ipcMain.on('app-quit', () => {
    app.quit()
  })

  mb.on('after-create-window', () => {
    if (is.development) {
      mb.window.openDevTools({ mode: 'detach' })
      // mainWindow.loadURL('http://localhost:3000');
    } else {
      // mainWindow.loadURL(`file://${path.join(__dirname, '../../build/index.html')}`);
    }
  })
}

app.on('ready', () => {
  let index = `file://${path.join(__dirname, '../../build/index.html')}`
  if (is.development) {
    index = 'http://localhost:3000'
  }
  let icon = `file://${path.join(__dirname, '../../build/IconTemplate@2x.png')}`
  if (is.development) {
    icon = './IconTemplate.png'
  }

  const mb = menubar({
    icon: icon,
    index: index,
    browserWindow: {
      resizable: false,
      height: 300,
      transparent: true,
      alwaysOnTop: is.development ? true : false,
      webPreferences: {
        devTools: is.development,
        nodeIntegration: true,
        backgroundThrottling: false,
        contextIsolation: false,
      },
    },
  })

  mb.on('ready', () => {
    createMainWindow(mb)
  })
})
