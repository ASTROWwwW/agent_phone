local FRAMEWORK_RESOURCE = "Agent"

local core

local function refresh_framework()
    if GetResourceState(FRAMEWORK_RESOURCE) ~= "started" then
        error(("[agent_phone] La ressource %s n'est pas demarree. Cette version ne fonctionne qu'avec la base Agent."):format(FRAMEWORK_RESOURCE))
    end
    core = nil
end

refresh_framework()

AddEventHandler("agent_phone:configurator:updated", refresh_framework)

function Bridge.Framework.GetName()
    return "agent"
end

local function shared_object()
    core = core or exports[FRAMEWORK_RESOURCE]:getSharedObject()
    return core
end

function Bridge.Framework.Notify(title, message, notification_type, duration)
    shared_object().ShowNotification(message, notification_type, duration, title)
end

function Bridge.Framework.ShowHelpNotification(message, key)
    local control = key == "E" and "~INPUT_CONTEXT~" or ("[%s]"):format(tostring(key or "E"))
    BeginTextCommandDisplayHelp("STRING")
    AddTextComponentSubstringPlayerName(("%s  %s"):format(control, tostring(message or "")))
    EndTextCommandDisplayHelp(0, false, false, -1)
end
