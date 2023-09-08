const statusBar = {
    element: document.getElementById('sftpStatus'),
    idle: function() {
      this.setText('Idle');
      this.element.className = '';
    },
    sftpConnecting: function() {
        this.clearSftp()
        this.setClass('warning')
        this.setText('Connecting...')
    },
    sftpConnected: function() {
        this.clearSftp()
        this.setClass('success')
        this.setText('Connected')
    },
    sftpDisconnected: function() {
        this.clearSftp()
        this.setClass('danger')
        this.setText('Disconnected')
    },
    clearSftp: function() {
        this.element.className = '';
    },
    /**
     * @param type {('success'|'info'|'warning'|'danger')}
     */
    setClass: function(type) {
      this.element.className = '';
      this.element.classList.add(type)
    },
    setText: function(str) {
        this.element.innerHTML = `Status: ${str}`;
    },
}

const ftpSaveButton = {
    element: document.getElementById('saveFtpSettingsBtn'),
    disable: function() {
        this.element.disabled = true;
    },
    enable: function() {
        this.element.disabled = false;
    }
}
const ftpTestConnectionButton = {
    element: document.getElementById('testFtpSettingsBtn'),
    disable: function() {
        this.element.disabled = true;
    },
    enable: function() {
        this.element.disabled = false;
    }
}

const ftpSettingsWarning = {
    element: document.getElementById('ftpSettingsWarning'),
    /**
     * @param errors {string[]}
     */
    setErrors: function (errors) {
        this.element.style.display = 'block';
        this.element.innerHTML = '<ul class="list-group">' + errors.map((error) => `<li class="list-group-item list-group-item-danger">${error}</li>`).join('') + '</ul>';
    },
    clearErrors: function() {
        this.element.style.display = 'none';
    }
}

const ftpSettingsSuccess = {
    element: document.getElementById('ftpSettingsSuccess'),
    show: function() {
        this.element.style.display = 'block'
    },
    hide: function() {
        this.element.style.display = 'none';
    },
    setText: function(str) {
        this.element.innerText = str;
    }
}

const advancedSettings = {
    element: document.getElementById('advancedSettings'),
    elementBtn: document.getElementById('advancedSettingsBtn'),
    show: function() {
        this.elementBtn.innerText = 'Hide Advanced Settings';
        this.element.style.display = 'block';
    },
    toggleVisible: function() {
        const display = {block: 'none', none: 'block'}
        const text = {block: 'Show Advanced Settings', none: 'Hide Advanced Settings'}
        this.elementBtn.innerText = text[this.element.style.display]
        this.element.style.display = display[this.element.style.display]
    }
}

window.ui = {
    statusBar,
    ftpSettingsWarning,
    ftpSettingsSuccess,
    ftpSaveButton,
    ftpTestConnectionButton,
    advancedSettings,
}