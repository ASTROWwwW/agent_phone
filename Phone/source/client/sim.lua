AgentPhoneSimPicker = {}

local is_open = false
local payload = nil

local function close_picker(notify_server)
    is_open = false
    payload = nil
    AgentPhoneFocus.SetSimPicker(false)
    SendNUIMessage({ type = "sim:picker-close" })
    if notify_server then
        return Bridge.Callbacks.Trigger("agent_phone:sim:picker-close", {})
    end
end

function AgentPhoneSimPicker.ReplayNui()
    if is_open and payload then
        SendNUIMessage({ type = "sim:picker", data = payload })
        return
    end
    SendNUIMessage({ type = "sim:picker-close" })
end

function AgentPhoneSimPicker.Reset()
    is_open = false
    payload = nil
    AgentPhoneFocus.SetSimPicker(false)
end

RegisterNUICallback("sim:picker-close", function(data, cb)
    if type(data) ~= "table" then
        cb({ success = false, error = "invalid_request" })
        return
    end
    local result = close_picker(true)
    cb(type(result) == "table" and result or { success = false, error = "request_failed" })
end)

RegisterNetEvent("agent_phone:sim:picker", function(data)
    if type(data) ~= "table" or type(data.number) ~= "string" or type(data.choices) ~= "table" then
        Bridge.Debug("error", "[agent_phone] Rejected invalid SIM picker data.")
        return
    end
    is_open = true
    payload = data
    AgentPhoneFocus.SetSimPicker(true)
    SendNUIMessage({ type = "sim:picker", data = data })
end)

RegisterNetEvent("agent_phone:sim:picker-close", function()
    close_picker(false)
end)
