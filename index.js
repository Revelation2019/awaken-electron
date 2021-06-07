const { app, BrowserWindow } = require('electron')
const path = require('path')

const PROTOCOL = 'electron'
/** BrowserWindow实例 */
let win = null;

function createWindow () {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.loadFile(path.join(__dirname, 'index.html'))
  /** 打开控制台 */
  win.webContents.openDevTools();
}

// 如果有实例在运行了，直接退出
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

// 当应用启动完成后，主动判断应用是否是从网页中调起
const _handleAfterReady = () => {
  // windows如果是通过url schema启动则发出时间处理
  // 启动参数超过1个才可能是通过url schema启动
  if (process.argv.length > 1) {
    if (!app.isReady()) {
      app.once("browser-window-created", () => {
        // app 未打开时，通过 open-url打开 app，此时可能还没 ready，需要延迟发送事件
        // 此段ready延迟无法触发 service/app/ open-url 处理，因为saga初始化需要时间
        app.emit("second-instance", null, process.argv);
      });
    } else {
      app.emit("second-instance", null, process.argv);
    }
  }
};

/** 注册伪协议 */
app.setAsDefaultProtocolClient(PROTOCOL)

/** app 模块的 ready 事件被激发后才能创建浏览器窗口 */
app.whenReady().then(() => {
  createWindow()
  
  /** 如果没有窗口打开则打开一个窗口 (macOS) */
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  _handleAfterReady()
})

/** Windows */
app.on('second-instance', async (event, argv) => {
  // Windows 下通过协议URL启动时，URL会作为参数，所以需要在这个事件里处理
  if (process.platform === 'win32') {
    /** 向渲染进程传参 */
    win.webContents.send('awaken', argv)
  }
});

/** Mac */
app.on('open-url', (event, url) => {
  /** 向渲染进程传递唤醒参数 */
  win.webContents.send('awaken', url)
});

/** 关闭所有窗口时退出应用 (Windows & Linux) */
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})
