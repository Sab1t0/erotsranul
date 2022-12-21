'use strict';

class ThemeSettingManager {
	constructor (theme, defaults = {}) {
		this.defaults = defaults
		this.theme = theme
		if(this.theme != this.get("theme")) this.reset()
	};

	all () {
		var settings = localStorage.getItem(`lc-theme-settings`)
		if(settings) settings = JSON.parse(settings)

		return settings || {}
	}

	reset () {
		var settings = JSON.stringify({ theme: this.theme })
		localStorage.setItem("lc-theme-settings", settings)
	}

	get (key) {
		var settings = this.all()
		return settings[key] != undefined ? settings[key] : this.defaults[key]
	}

	set (key, value) {
		var settings = this.all()
		settings[key] = value
		localStorage.setItem("lc-theme-settings", JSON.stringify(settings))
	}
}