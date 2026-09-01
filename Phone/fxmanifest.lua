fx_version 'cerulean'
game 'gta5'
lua54 'yes'
node_version '22'
use_experimental_fxv2_oal 'yes'

author 'Sky-Systems'
description 'Agent Phone'
version '0.3.3'


shared_scripts {
    'config/init.lua',
    'source/bridge/shared.lua',
    'source/shared/imei.lua',
    'source/shared/sim_number.lua',
    'source/shared/custom_apps.lua',
    'source/bridge/phones/shared.lua',
}

client_scripts {
    'config/config.lua',
    'config/locales/*.lua',
    'source/bridge/client/callbacks.lua',
    'source/client/phone_configurator.lua',
    'source/bridge/client/framework.lua',
    'source/bridge/client/calls.lua',
    'source/client/animations.lua',
    'source/client/focus.lua',
    'source/client/calls.lua',
    'source/client/sim.lua',
    'source/client/camera.lua',
    'source/client/location.lua',
    'source/client/weather.lua',
    'source/client/garage.lua',
    'source/client/agentride.lua',
    'source/client/payphones.lua',
    'source/client/custom_apps.lua',
    'source/client/nui_server_bridge.lua',
    'source/client/nui_events.lua',
    'source/client/notifications.lua',
    'source/client/main.lua',
    'source/client/navigation.lua',
    'source/shared/public_api.lua',
    'source/client/public_api.lua',
    'source/bridge/phones/client/core.lua',
    'source/bridge/phones/client/lifecycle.lua',
}

server_scripts {
    '@oxmysql/lib/MySQL.lua',
    'config/config.lua',
    -- Secrets serveur, jamais en client_scripts. Charge apres config.lua pour
    -- ecraser les valeurs vides par defaut. Absent du depot : voir
    -- config/secrets.example.lua.
    'config/secrets.lua',
    'config/media.lua',
    'config/locales/en.lua',
    'config/locales/de.lua',
    'config/locales/es.lua',
    'source/shared/config_default.lua',
    'source/server/nui_build_check.lua',
    'source/server/update_check.lua',
    'source/bridge/server/database.lua',
    'source/bridge/server/migrations.lua',
    'source/server/phone_configurator_schema.lua',
    'source/bridge/server/callbacks.lua',
    'source/server/phone_configurator.lua',
    'source/bridge/server/framework.lua',
    'source/bridge/server/frameworks/*.lua',
    'source/bridge/server/inventory.lua',
    'source/bridge/server/inventory/*.lua',
    'source/bridge/server/inventory_contract.lua',
    'source/bridge/server/voice.lua',
    'source/server/custom_apps.lua',
    'source/server/media_metadata.lua',
    'source/server/companies.lua',
    'source/server/sim.lua',
    'source/server/memos.lua',
    'source/server/notes.lua',
    'source/server/phone_security.lua',
    'source/server/phone_accounts.lua',
    'source/server/phone_persistence.lua',
    'source/server/phone.lua',
    'source/server/device_directory.lua',
    'source/server/db_migrate.lua',
    'source/server/admin.lua',
    'source/server/custom_app_storage.lua',
    'source/server/payphones.lua',
    'source/server/calls.lua',
    'source/server/notifications.lua',
    'source/shared/public_api.lua',
    'source/server/public_api.lua',
    'source/server/media_provider_config.lua',
    'source/server/media_import.lua',
    'source/server/media_import/fivemanage.lua',
    'source/server/media_import/manifest.lua',
    'source/server/media.lua',
    'source/server/messages.lua',
    'source/server/easyshare.lua',
    'source/server/darkchat.lua',
    'source/server/flare.lua',
    'source/server/mail.lua',
    'source/server/banking.lua',
    'source/server/billing.lua',
    'source/server/garage.lua',
    'source/server/marketplace.lua',
    'source/server/fliptok.lua',
    'source/server/picstagram.lua',
    'source/server/feather.lua',
    'source/server/map.lua',
    'source/server/agentride.lua',
    'source/server/calendar.lua',
    'source/server/music.lua',
    'source/server/testdata.lua',
    'source/bridge/phones/server/core.lua',
    'source/bridge/phones/server/lifecycle.lua',
}

files {
    'source/html/index.html',
    'source/html/assets/**',
    'source/html/img/**',
    'source/html/sounds/**',
    'config/music/**',
}

ui_page 'source/html/index.html'

dependency 'oxmysql'
