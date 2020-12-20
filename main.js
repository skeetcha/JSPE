const {app, BrowserWindow, Menu} = require('electron');

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    });

    win.loadFile('main.html');
}

function newProject() {

}

function openProject() {

}

function saveProject() {

}

function saveProjectAs() {

}

function exportRom() {
    
}

function exportRomAs() {

}

function makePatch() {

}

function openTextEditor() {

}

function openPokemonEditor() {

}

function openMoveEditor() {

}

const isMac = process.platform === 'darwin';

const template = isMac ? [
    {
        label: app.name,
        submenu: [
            {
                role: 'about'
            },
            {
                type: 'separator'
            },
            {
                role: 'hide'
            },
            {
                role: 'unhide'
            },
            {
                type: 'separator'
            },
            {
                role: 'quit'
            }
        ]
    },
    {
        label: 'File',
        submenu: [
            {
                label: 'New Project',
                click: newProject,
                accelerator: 'CmdOrCtrl+N'
            },
            {
                label: 'Open Project',
                click: openProject,
                accelerator: 'CmdOrCtrl+O'
            },
            {
                label: 'Save Project',
                click: saveProject,
                accelerator: 'CmdOrCtrl+S'
            },
            {
                label: 'Save Project As',
                click: saveProjectAs,
                accelerator: 'CmdOrCtrl+Shift+S'
            },
            {
                label: 'Export ROM',
                click: exportRom
            },
            {
                label: 'Export ROM As',
                click: exportRomAs
            },
            {
                label: 'Make Patch',
                click: makePatch
            },
            {
                role: 'close'
            }
        ]
    },
    {
        label: 'Edit',
        submenu: [
            {
                label: 'Text Editor',
                click: openTextEditor
            },
            {
                label: 'Pokemon Editor',
                click: openPokemonEditor
            },
            {
                label: 'Move Editor',
                click: openMoveEditor
            }
        ]
    }
] : [
    {
        label: 'File',
        submenu: [
            {
                label: 'New Project',
                click: newProject,
                accelerator: 'CmdOrCtrl+N'
            },
            {
                label: 'Open Project',
                click: openProject,
                accelerator: 'CmdOrCtrl+O'
            },
            {
                label: 'Save Project',
                click: saveProject,
                accelerator: 'CmdOrCtrl+S'
            },
            {
                label: 'Save Project As',
                click: saveProjectAs,
                accelerator: 'CmdOrCtrl+Shift+S'
            },
            {
                label: 'Export ROM',
                click: exportRom
            },
            {
                label: 'Export ROM As',
                click: exportRomAs
            },
            {
                label: 'Make Patch',
                click: makePatch
            },
            {
                role: 'quit'
            }
        ]
    },
    {
        label: 'Edit',
        submenu: [
            {
                label: 'Text Editor',
                click: openTextEditor
            },
            {
                label: 'Pokemon Editor',
                click: openPokemonEditor
            },
            {
                label: 'Move Editor',
                click: openMoveEditor
            }
        ]
    }
]

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
