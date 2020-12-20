const ipc = require('electron').ipcRenderer;
const baseRomField = document.getElementById('baseRom');
const directoryField = document.getElementById('directory');
const projNameField = document.getElementById('projName');
const projRomField = document.getElementById('projRom');

ipc.on('baseRom', (event, args) => {
    if (args.type === 'get') {
        ipc.invoke('baseRomGet', baseRomField.value);
    } else if (args.type === 'set') {
        baseRomField.value = args.value;
    }
});

ipc.on('directory', (event, args) => {
    if (args.type === 'get') {
        ipc.invoke('directoryGet', directoryField.value);
    } else if (args.type === 'set') {
        directoryField.value = args.value;
    }
});

ipc.on('projName', (event, args) => {
    if (args.type === 'get') {
        ipc.invoke('projNameGet', projNameField.value);
    } else if (args.type === 'set') {
        projNameField.value = args.value;
    }
});

ipc.on('projRom', (event, args) => {
    if (args.type === 'get') {
        ipc.invoke('projRomGet', projRomField.value);
    } else if (args.type === 'set') {
        projRomField.value = args.value;
    }
});