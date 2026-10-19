// Wisp runs without a console window: Wisp is the whole UI.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    wisp_lib::run()
}
