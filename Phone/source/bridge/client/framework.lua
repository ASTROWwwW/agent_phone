local FRAMEWORK_RESOURCE = "Agent"

local framework_name
local esx_resource
local esx

local function refresh_framework()
    esx_resource = GetResourceState(FRAMEWORK_RESOURCE) == "started" and FRAMEWORK_RESOURCE or nil

    if not esx_resource then
        error(("[agent_phone] The %s resource is not started. This build targets the Agent base only."):format(FRAMEWORK_RESOURCE))
    end
    if framework_name == "agent" then
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
