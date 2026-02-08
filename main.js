const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

// Keep a global reference to prevent garbage collection
let mainWindow;

function createWindow() {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        title: 'IPTV Pro Player',
        icon: path.join(__dirname, 'icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            // Disable web security to avoid CORS issues with IPTV APIs
            webSecurity: false
        },
        // Modern look
        backgroundColor: '#0f172a',
        autoHideMenuBar: true,
        show: false // Don't show until ready
    });

    // Load your HTML file
    mainWindow.loadFile('iptv-pro-player.html');

    // Show window when ready (prevents white flash)
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Open DevTools in development (comment out for production)
    // mainWindow.webContents.openDevTools();

    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Custom menu (simplified)
    const menu = Menu.buildFromTemplate([
        {
            label: 'File',
            submenu: [
                { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => mainWindow.reload() },
                { type: 'separator' },
                { label: 'Exit', accelerator: 'Alt+F4', click: () => app.quit() }
            ]
        },
        {
            label: 'View',
            submenu: [
                { label: 'Toggle Fullscreen', accelerator: 'F11', click: () => mainWindow.setFullScreen(!mainWindow.isFullScreen()) },
                { label: 'Toggle DevTools', accelerator: 'F12', click: () => mainWindow.webContents.toggleDevTools() }
            ]
        }
    ]);
    Menu.setApplicationMenu(menu);

    // SECURITY: Handle new window creation (limit to safe protocols or deny)
    mainWindow.webContents.setWindowOpenHandler((details) => {
        // Only allow external links if they use https protocol
        if (details.url.startsWith('https:')) {
            require('electron').shell.openExternal(details.url);
        }
        return { action: 'deny' };
    });

    // SECURITY: Handle permission requests (deny all by default)
    mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
        // Deny all permissions (notifications, camera, mic, etc.)
        return callback(false);
    });
}

// App ready
app.whenReady().then(createWindow);

// Quit when all windows are closed (Windows & Linux)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// macOS: re-create window when dock icon clicked
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Ignore certificate errors REMOVED for security
// app.commandLine.appendSwitch('ignore-certificate-errors');
