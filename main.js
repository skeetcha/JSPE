const {app, BrowserWindow, Menu, dialog, ipcMain} = require('electron');
const child = require('child_process').execFile;
const path = require('path');
const fs = require('fs');

const ndsToolExe = 'bin/ndstool.exe';
const xdelta = 'bin/xdelta.exe';

let win;
const isMac = process.platform === 'darwin';
const isWin = process.platform === 'win32';
let dirty;
let baseRom, directory, projName, projRom;
let config = {};
let jspeVersion = '0.1.1';

function createWindow() {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    });

    win.loadFile('views/main.html');
    win.webContents.openDevTools();
}

const deleteFolderRecursive = (path) => {
    var pathOs = isWin ? path.win32 : path.posix;
    
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach((file, index) => {
            const curPath = pathOs.join(path, file);

            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });

        fs.rmdirSync(path);
    }
};

const ndsTool = {
    dump: (fname, directory) => {
        var pathOs = isWin ? path.win32 : path.posix;

        var params = [
            '-x', fname,
            '-7', pathOs.join([directory, 'arm7.bin']),
            '-y7', pathOs.join([directory, 'overarm7.bin']),
            '-9', pathOs.join([directory, 'arm9.bin']),
            '-y9', pathOs.join([directory, 'overarm9.bin']),
            '-y', pathOs.join([directory, 'overlays']),
            '-t', pathOs.join([directory, 'banner.bin']),
            '-h', pathOs.join([directory, 'header.bin']),
            '-d', pathOs.join([directory, 'fs'])
        ];

        child(ndsToolExe, params, (err, data) => {
            if (err) {
                console.error(err);
                return;
            }

            console.log(data.toString());
        });
    }
};

ipcMain.handle('baseRomGet', (event, val) => {
    baseRom = val;
});

ipcMain.handle('directoryGet', (event, val) => {
    directory = val;
});

ipcMain.handle('projNameGet', (event, val) => {
    projName = val;
});

ipcMain.handle('projRomGet', (event, val) => {
    projRom = val;
});

function newProject() {
    dialog.showOpenDialog(win, {
        properties: ['openFile'],
        filters: [
            { name: 'Nintendo DS ROM', extensions: ['nds']}
        ]
    }).then((fileData) => {
        var filePath = path.normalize(fileData.filePaths[0]);
        var pathOs = isWin ? path.win32 : path.posix;
        var d = pathOs.dirname(filePath);
        var tail = pathOs.basename(filePath);
        var name = tail.replace(pathOs.extname(filePath), '');
        d = pathOs.join(d, name);

        if (fs.existsSync(d)) {
            var prompt = dialog.showMessageBoxSync(win, {
                type: 'question',
                buttons: ['Yes', 'No'],
                message: d + ' already exists. "Would you like this to be overwritten with the project directory?\nAll contents will be deleted. This cannot be undone.',
                title: 'Overwrite directory?'
            });

            if (prompt === 0) {
                deleteFolderRecursive(d);
            } else if (prompt === 1) {
                fs.unlinkSync(d);
            } else {
                app.quit();
            }
        }

        fs.mkdirSync(d, {recursive: true});
        ndsTool.dump(filePath, d);
        dirty = true;

        prompt = dialog.showMessageBoxSync(win, {
            type: 'question',
            buttons: ['Yes', 'No'],
            message: 'Would you like to create a backup of this ROM in your project directory?',
            title: 'Create backup?'
        });

        if (prompt === 0) {
            fs.copyFileSync(filePath, pathOs.join([d, 'base.nds']));
        } else if (prompt === 1) {

        } else {
            app.quit();
        }

        win.webContents.send('baseRom', {type: 'set', value: pathOs.join([d, 'base.nds'])});
        win.webContents.send('directory', {type: 'set', value: d});
        win.webContents.send('projName', {type: 'set', value: name});
        win.webContents.send('projRom', {type: 'set', value: pathOs.join([d, 'edit.nds'])});
        config.project = {'directory': d};
        config.versioninfo = jspeVersion;
    });
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
