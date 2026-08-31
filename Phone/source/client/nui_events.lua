local relays_with_data = {
    ["agent_phone:mail:changed"] = "mail:changed",
    ["agent_phone:easyshare:changed"] = "easyshare:changed",
    ["agent_phone:marketplace:changed"] = "marketplace:changed",
    ["agent_phone:companies:changed"] = "companies:changed",
    ["agent_phone:fliptok:verification-changed"] = "fliptok:verification-changed",
    ["agent_phone:picstagram:verification-changed"] = "picstagram:verification-changed",
    ["agent_phone:banking:changed"] = "banking:changed",
    ["agent_phone:crewlink:changed"] = "crewlink:changed",
    ["agent_phone:messages:changed"] = "messages:changed",
    ["agent_phone:darkchat:changed"] = "darkchat:changed",
}

local relays_without_data = {
    ["agent_phone:gallery:changed"] = "gallery:changed",
    ["agent_phone:contacts:changed"] = "contacts:changed",
    ["agent_phone:calls:changed"] = "calls:changed",
    ["agent_phone:crypto:account-changed"] = "crypto:account-changed",
    ["agent_phone:billing:changed"] = "billing:changed",
}

for event_name, nui_type in pairs(relays_with_data) do
    RegisterNetEvent(event_name, function(data)
        SendNUIMessage({ type = nui_type, data = data })
    end)
end

for event_name, nui_type in pairs(relays_without_data) do
    RegisterNetEvent(event_name, function()
        SendNUIMessage({ type = nui_type })
    end)
end

RegisterNetEvent("agent_phone:crypto:changed", function(data)
    if type(data) ~= "table" or type(data.markets) ~= "table" then
        Bridge.Debug("error", "[agent_phone] Rejected invalid crypto market data.")
        return
    end
    SendNUIMessage({ type = "crypto:changed", data = data })
end)
