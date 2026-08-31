local server_bridge = AgentPhoneCompatibilityServer
local RESOURCE_NAME = server_bridge.ResourceName
local LB_PROVIDER_NAME = "lb-phone"

AddEventHandler("agent_phone:server:phoneNumberChanged", function(player_source, phone_number)
    TriggerEvent("lb-phone:numberChanged", player_source, phone_number)
end)

AddEventHandler("agent_phone:server:phoneNumberGenerated", function(player_source, phone_number)
    TriggerEvent("lb-phone:phoneNumberGenerated", player_source, phone_number)
end)

AddEventHandler("agent_phone:server:factoryReset", function(player_source, phone_number)
    TriggerEvent("lb-phone:factoryReset", player_source, phone_number)
end)

AddEventHandler("agent_phone:server:galleryMediaDeleted", function(player_source, phone_number, link)
    TriggerEvent("lb-phone:deletedFromGallery", player_source, phone_number, link)
end)

AddEventHandler("onResourceStop", function(resource_name)
    if resource_name ~= RESOURCE_NAME then
        return
    end

    AgentPhoneCompatibility.EmitServerProviderStop(LB_PROVIDER_NAME)
end)

local function reset_lb_export_cache()
    Bridge.Debug(
        "debug",
        "[agent_phone] Resetting the LB Phone server export cache after bridge startup.",
        { always = true }
    )
    AgentPhoneCompatibility.EmitServerProviderStop(LB_PROVIDER_NAME)
    AgentPhoneCompatibility.EmitServerProviderStart(LB_PROVIDER_NAME)
end

server_bridge.AfterPhoneReady(reset_lb_export_cache)
