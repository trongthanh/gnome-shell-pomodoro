/* © 2018 int3ractive.com
 * @author Thanh Tran
 */
/* exported init, enable, disable */
const St = imports.gi.St;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
// const GLib = imports.gi.GLib;
const Mainloop = imports.mainloop;
// const Clutter = imports.gi.Clutter;

const ME = imports.misc.extensionUtils.getCurrentExtension();

const BREAK_ICON = 'applications-games-symbolic';
const POMODORO_ICON = 'timepp-pomodoro-symbolic';
const PAUSE_ICON = 'media-playback-pause-symbolic';

let pomodoroTimer;

class PomodoroTimer {
	constructor() {
		this.button = null;
		this.tic_mainloop_id = 0;

		// the panel button

		this.seconds = 0;
		this.is_break = false;
		this.is_paused = false;

		this.button = new St.Button({ can_focus: true, style_class: 'panel-button' });

		this.box_content = new St.BoxLayout({ style_class: 'panel-button-content' });
		this.button.add_actor(this.box_content);

		// icon = new St.Icon({ style_class: 'system-status-icon', icon_name: 'system-run-symbolic' });
		this.icon = new St.Icon({ style_class: 'system-status-icon', icon_name: POMODORO_ICON });
		this.box_content.add_actor(this.icon);

		this.label = new St.Label({ text: 'Thanh', visible: true /*y_align: Clutter.ActorAlign.CENTER*/ });
		this.box_content.add_actor(this.label);

		this._tic();
	}

	_show_toast(msg) {
		let text = this.text;
		if (!text) {
			text = this.text = new St.Label({ style_class: 'helloworld-label', text: msg });
		}
		Main.uiGroup.add_actor(text);

		text.opacity = 255;
		text.set_text(msg);

		const monitor = Main.layoutManager.primaryMonitor;

		text.set_position(
			monitor.x + Math.floor(monitor.width / 2 - text.width / 2),
			monitor.y + Math.floor(monitor.height / 2 - text.height / 2)
		);

		Tweener.addTween(text, {
			opacity: 0,
			time: 4,
			transition: 'easeOutQuad',
			onComplete: () => {
				Main.uiGroup.remove_actor(this.text);
			},
		});
	}

	_tic() {
		// clock = end_time - GLib.get_monotonic_time();

		// if (clock <= 0) {
		// 	tic_mainloop_id = null;
		// 	// this._timer_expired();
		// 	return;
		// }
		if (this.is_break && this.seconds >= 60 * 5) {
			// switch to pomodoro time
			this.seconds = 0;
			this.is_break = false;
			this.icon.icon_name = POMODORO_ICON;
			this._show_toast('Back to work.');
		} else if (!this.is_break && this.seconds >= 60 * 25) {
			// switch to break time
			this.seconds = 0;
			this.is_break = true;
			this.icon.icon_name = BREAK_ICON;
			this._show_toast("Let's take a break");
		}

		this._update_time_display();

		this.tic_mainloop_id = Mainloop.timeout_add_seconds(1, () => {
			this._tic();
		});
	}

	_update_time_display() {
		this.seconds += 1;
		this.label.set_text(this.get_formatted_time());
	}

	get_formatted_time() {
		return '%02d:%02d'.format(Math.floor(this.seconds / 3600), Math.floor((this.seconds % 3600) / 60));
	}

	_pause() {
		if (this.tic_mainloop_id) {
			Mainloop.source_remove(this.tic_mainloop_id);
			this.tic_mainloop_id = 0;
		}
	}

	_toggle_pause() {
		this.is_paused = !this.is_paused;
		if (this.is_paused) {
			this._pause();
			this.icon.icon_name = PAUSE_ICON;
		} else {
			if (this.is_break) {
				this.icon.icon_name = BREAK_ICON;
			} else {
				this.icon.icon_name = POMODORO_ICON;
			}

			this._tic();
		}
	}

	enable() {
		Main.panel._rightBox.insert_child_at_index(this.button, 0);

		this.button_press_event = this.button.connect(
			'button-press-event',
			this._toggle_pause.bind(this)
		);
		this._tic();
	}

	disable() {
		Main.panel._rightBox.remove_child(this.button);
		if (this.button_press_event) {
			this.button.disconnect(this.button_press_event);
			this.button_press_event = null;
		}
		this._pause();
	}
}

/**
 * GNOME extension default hook
 */
function init() {
	pomodoroTimer = new PomodoroTimer();
}

/**
 * GNOME extension default hook
 */
function enable() {
	// enable icon search from this extension
	const icon_theme = imports.gi.Gtk.IconTheme.get_default();
	icon_theme.prepend_search_path(ME.path + '/img/icons');

	pomodoroTimer.enable();
}

/**
 * GNOME extension default hook
 *
 * It is called when computer suspended
 */
function disable() {
	// remove icon search path from this extension
	let icon_theme = imports.gi.Gtk.IconTheme.get_default();
	let custom_path = ME.path + '/img/icons';
	let paths = icon_theme.get_search_path();
	paths.splice(paths.indexOf(custom_path), 1);
	icon_theme.set_search_path(paths);

	pomodoroTimer.disable();
}
