local ESX_RESOURCES = { "es_extended", "Agent" }

local framework_name
local esx_resource
local esx

local function resolve_esx_resource()
    for _, resource_name in ipairs(ESX_RESOURCES) do
        if GetResourceState(resource_name) == "started" then
            return resource_name
        end
    end
    return nil
end

local function refresh_framework()
    esx_resource = resolve_esx_resource()

    local configured = Config.Bridge.Framework
    local resolved = configured ~= "auto" and configured or (esx_resource and "esx" or nil)

    if resolved ~= "esx" then
        error("[agent_phone] No supported framework is running. This build only ships the ESX adapter.")
    end
    if not esx_resource then
        error(("[agent_phone] ESX is configured, but none of these resources is started: %s."):format(table.concat(ESX_RESOURCES, ", ")))
    end
    if resolved == framework_name then
        return
    end

    framework_name = resolved
    esx = nil
end

refresh_framework()

AddEventHandler("agent_phone:configurator:updated", refresh_framework)

function Bridge.Framework.GetName()
    return framework_name
end

function Bridge.Framework.Notify(title, message, notification_type, duration)
    if framework_name ~= "esx" then
        Bridge.Debug("error", "[agent_phone] Notification requested for unsupported framework '%s'.", tostring(framework_name))
        return
    end

    esx = esx or exports[esx_resource]:getSharedObject()
    esx.ShowNotification(message, notification_type, duration, title)
end

function Bridge.Framework.ShowHelpNotification(message, key)
    local control = key == "E" and "~INPUT_CONTEXT~" or ("[%s]"):format(tostring(key or "E"))
    BeginTextCommandDisplayHelp("STRING")
    AddTextComponentSubstringPlayerName(("%s  %s"):format(control, tostring(message or "")))
    EndTextCommandDisplayHelp(0, false, false, -1)
end
