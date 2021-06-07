const { ipcRenderer } = require('electron')

/** 预加载脚本，通过预加载脚本从渲染器访问Node.js */
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`${dependency}-version`, process.versions[dependency])
  }
})

/** 接收主线程参数 */
ipcRenderer.on('awaken', (event, params) => {
  console.log('awakenArgv', params)
})

