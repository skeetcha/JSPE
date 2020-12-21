const {app, BrowserWindow, Menu, dialog, ipcMain} = require('electron');
const child = require('child_process').execFile;
const path = require('path');
const fs = require('fs');

const ndsToolExe = 'ndstool.exe';
const xdeltaExe = 'xdelta.exe';

let win, textWin, pokeWin, moveWin;
const isMac = process.platform === 'darwin';
const isWin = process.platform === 'win32';
let dirty;
let baseRom, directory, projName, projRom;
let config = {};
let jspeVersion = '0.1.1';
const pathOs = isWin ? path.win32 : path.posix;
let projFile = '';

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
    win.setMenu(menu);
}

const deleteFolderRecursive = (path) => {
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

        child(pathOs.join(['bin', ndsToolExe]), params, (err, data) => {
            if (err) {
                console.error(err);
                return;
            }

            console.log(data.toString());
        });
    },
    build: (fname, directory) => {
        var arm9 = pathOs.join([directory, 'arm9.dec.bin']);

        try {
            var stats = fs.statSync(arm9);
            
            if (!stats.size) {
                throw Error();
            }
        } catch (err) {
            arm9 = pathOs.join([directory, 'arm9.bin']);
        }

        var overarm9 = pathOs.join([directory, 'overarm9.dec.bin']);
        var overlays = pathOs.join([directory, 'overlays_dez']);

        try {
            var stats = fs.statSync(overarm9);

            if (!stats.size) {
                throw Error();
            }
        } catch (err) {
            arm9 = pathOs.join([directory, 'arm9.bin']);
            overlays = pathOs.join([directory, 'overlays']);
        }

        var params = [
            '-c', fname,
            '-7', pathOs.join([directory, 'arm7.bin']),
            '-y7', pathOs.join([directory, 'overarm7.bin']),
            '-9', arm9,
            '-y9', overarm9,
            '-y', overlays,
            '-t', pathOs.join([directory, 'banner.bin']),
            '-h', pathOs.join([directory, 'header.bin']),
            '-d', pathOs.join([directory, 'fs'])
        ];

        child(pathOs.join(['bin', ndsTool]), params, (err, data) => {
            if (err) {
                console.error(err);
                return;
            }

            console.log(data.toString());
        });
    }
};

const xdelta3 = {
    makePatch: (patchName, fname1, fname2) => {
        var params = [
            '-e', '-s', fname1, fname2, patchName
        ];

        child(pathOs.join(['bin', xdeltaExe]), params, (err, data) => {
            if (err) {
                console.error(err);
                return;
            }

            console.log(data.toString());
        });
    },
    applyPatch: (patchName, fname1, fname2) => {
        var params = [
            '-d', '-s', fname1, patchName, fname2
        ];

        child(pathOs.join(['bin', xdeltaExe]), params, (err, data) => {
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
        var filePath = pathOs.normalize(fileData.filePaths[0]);
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
        config.project = {
            directory: d,
            baseRom: pathOs.join([d, 'base.nds']),
            projName: name,
            projRom: pathOs.join([d, 'edit.nds'])
        };
        config.versioninfo = jspeVersion;
    });
}

function openProject() {
    dialog.showOpenDialog(win, {
        properties: ['openFile'],
        filters: [
            { name: 'JSPE Project File', extensions: ['jspe']}
        ]
    }).then((fileData) => {
        var filePath = pathOs.normalize(fileData.filePaths[0]);
        projFile = filePath;
        config = JSON.parse(fs.readFileSync(filePath));

        win.webContents.send('baseRom', {type: 'set', value: config.project.baseRom});
        win.webContents.send('directory', {type: 'set', value: config.project.directory});
        win.webContents.send('projName', {type: 'set', value: config.project.projName});
        win.webContents.send('projRom', {type: 'set', value: config.project.projRom});
        config.versioninfo = jspeVersion;
    });
}

function saveProjectAs() {
    dialog.showSaveDialog(win, {
        filters: [
            { name: 'JSPE Project File', extensions: ['jspe']}
        ]
    }).then((fileData) => {
        var filePath = pathOs.normalize(fileData.filePaths[0]);
        projFile = filePath;
        fs.writeFileSync(filePath, JSON.stringify(config));
        dirty = false;
    });
}

function saveProject() {
    if (projFile === '') {
        saveProjectAs();
    } else {
        fs.writeFileSync(projFile, JSON.stringify(config));
        dirty = false;
    }
}

function exportRomTo(path) {
    if (config.project !== undefined) {
        dialog.showMessageBoxSync(win, {
            type: 'error',
            title: 'No ROM Loaded',
            message: 'There is no ROM loaded.'
        });
        return;
    }

    ndsTool.build(path, config.project.directory);
    return;
}

function exportRom() {
    win.webContents.send('projRom', {type: 'get'});
    setTimeout(() => {
        exportRomTo(projRom);
    }, 2000);
}

function exportRomAs() {
    dialog.showSaveDialog(win, {
        filters: [
            { name: 'Nintendo DS ROM', extensions: ['nds']}
        ]
    }).then((fileData) => {
        var filePath = pathOs.normalize(fileData.filePaths[0]);
        exportRomTo(filePath);
    });
}

function makePatch() {
    if (config.project === undefined) {
        dialog.showMessageBoxSync(win, {
            type: 'error',
            title: 'No ROM Loaded',
            message: 'There is no ROM loaded.'
        });
        return;
    }

    let inRom, outRom;
    win.webContents.send('baseRom', {type: 'get'});
    win.webContents.send('projRom', {type: 'get'});
    setTimeout(() => {
        inRom = baseRom;
        outRom = projRom;
    });

    if (!fs.existsSync(inRom)) {
        dialog.showMessageBoxSync(win, {
            type: 'error',
            title: 'No ROM Loaded',
            message: 'There is no ROM loaded.'
        });
        return;
    }

    if (!fs.existsSync(outRom)) {
        dialog.showMessageBoxSync(win, {
            type: 'error',
            title: 'No ROM Loaded',
            message: 'There is no ROM loaded.'
        });
        return;
    }

    dialog.showOpenDialogSync(win, {
        properties: ['openFile'],
        filters: [
            { name: 'xdelta3 Patch File', extensions: ['xdelta3']},
            { name: 'All Files', extensions: ['*']}
        ]
    }).then((fileData) => {
        var filePath = pathOs.normalize(fileData.filePaths[0]);
        xdelta3.makePatch(filePath, inRom, outRom);
    });
}

function openTextEditor() {
    textWin = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    });

    textWin.loadFile('views/text.html');
    textWin.webContents.openDevTools();
}

function openPokemonEditor() {
    pokeWin = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    });

    pokeWin.loadFile('views/poke.html');
    pokeWin.webContents.openDevTools();
}

function openMoveEditor() {
    moveWin = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    });

    moveWin.loadFile('views/move.html');
    moveWin.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (dirty) {
        var prompt = dialog.showMessageBoxSync(win, {
            type: 'question',
            buttons: ['Yes', 'No', 'Cancel'],
            title: 'Close?',
            message: 'Your project has been modified.\nDo you want to save your project file?'
        });

        if (prompt === 0) {
            saveProject();
        } else if (prompt === 1) {

        } else if (prompt === 2) {
            return;
        } else {
            app.quit();
        }
    }

    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
