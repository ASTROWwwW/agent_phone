AgentPhoneCalls = {}

local active_call_payload = nil
local call_channel = 0

local function copy_payload(value)
    if type(value) ~= "table" then
        return value
    end

    local copy = {}
    for key, nested_value in pairs(value) do
        copy[key] = copy_payload(nested_value)
    end
    return copy
end

local function emit_call_changed(call)
    TriggerEvent("agent_phone:client:callChanged", copy_payload(call))
end

local function request_call_action(action, call)
    local result = Bridge.Callbacks.Trigger("agent_phone:calls:" .. action, { id = call.id })
    if not result or not result.success then
        local call_error = result and result.error or "request_failed"
        Bridge.Debug(
            "error",
            "[agent_phone] Call %s request failed: %s.",
            action,
            tostring(call_error)
        )
        return false, call_error
    end

    return true
end

local function leave_voice()
    if call_channel == 0 then
        return
    end
    Bridge.Calls.Leave()
    call_channel = 0
end

local function join_voice(channel)
    local next_channel = tonumber(channel) or 0
    if not Bridge.Calls.Join(next_channel) then
        return false
    end
    call_channel = next_channel
    return true
end

function AgentPhoneCalls.Dial(phone_number, company)
    if (phone_number ~= nil and (type(phone_number) ~= "string" or phone_number == ""))
        or (company ~= nil and (type(company) ~= "string" or company == ""))
        or (phone_number == nil and company == nil)
    then
        Bridge.Debug("error", "[agent_phone] Rejected invalid call target.")
        return false, "invalid_request"
    end

    local result = Bridge.Callbacks.Trigger("agent_phone:calls:dial", {
        company = company,
        phoneNumber = phone_number,
    })
    if not result or not result.success then
        local call_error = result and result.error or "request_failed"
        Bridge.Debug("error", "[agent_phone] Call request failed: %s.", tostring(call_error))
        return false, call_error
    end

    return true
end

function AgentPhoneCalls.IsActive()
    return active_call_payload ~= nil
end

function AgentPhoneCalls.GetActive()
    if not active_call_payload then
        return nil
    end
    return copy_payload(active_call_payload)
end

function AgentPhoneCalls.Answer()
    local call = active_call_payload
    if not call or call.state ~= "ringing" or call.direction ~= "incoming" then
        return false, "call_not_found"
    end
    return request_call_action("answer", call)
end

function AgentPhoneCalls.Decline()
    local call = active_call_payload
    if not call or call.state ~= "ringing" or call.direction ~= "incoming" then
        return false, "call_not_found"
    end
    return request_call_action("decline", call)
end

function AgentPhoneCalls.Hangup()
    local call = active_call_payload
    if not call or (call.state ~= "ringing" and call.state ~= "connected") then
        return false, "call_not_found"
    end
    return request_call_action("hangup", call)
end

function AgentPhoneCalls.Terminate()
    local call = active_call_payload
    if not call or (call.state ~= "ringing" and call.state ~= "connected") then
        return false, "call_not_found"
    end
    return request_call_action("terminate", call)
end

function AgentPhoneCalls.ReleaseFocus()
    AgentPhoneFocus.SetCall(false)
end

function AgentPhoneCalls.ReplayNui()
    if active_call_payload then
        SendNUIMessage({ type = "call:state", data = active_call_payload })
    end
end

function AgentPhoneCalls.Reset()
    local had_active_call = active_call_payload ~= nil
    active_call_payload = nil
    AgentPhoneFocus.SetCall(false)
    leave_voice()
    if had_active_call then
        emit_call_changed(nil)
    end
end

RegisterNetEvent("agent_phone:call:incoming", function(data)
    if type(data) ~= "table" or type(data.id) ~= "string" or data.state ~= "ringing" then
        Bridge.Debug("error", "[agent_phone] Rejected invalid incoming call data.")
        return
    end
    active_call_payload = data
    AgentPhoneFocus.SetCall(true)
    emit_call_changed(data)
    TriggerEvent("agent_phone:animation:call", data)
    SendNUIMessage({ type = "call:incoming", data = data })
end)

RegisterNetEvent("agent_phone:call:state", function(data)
    if type(data) ~= "table" or type(data.id) ~= "string" or type(data.state) ~= "string" then
        Bridge.Debug("error", "[agent_phone] Rejected invalid call state data.")
        return
    end
    if data.state == "ringing" or data.state == "connected" then
        active_call_payload = data
    end
    if data.state ~= "ringing" then
        AgentPhoneFocus.SetCall(false)
    end
    if data.state ~= "ringing" and data.state ~= "connected" then
        active_call_payload = nil
    end
    if data.state == "connected" and data.channel then
        if not join_voice(data.channel) then
            TriggerEvent("agent_phone:device:error", "voice_unavailable")
        end
    elseif data.state ~= "ringing" then
        leave_voice()
    end
    emit_call_changed(data)
    TriggerEvent("agent_phone:animation:call", data)
    SendNUIMessage({ type = "call:state", data = data })
end)
