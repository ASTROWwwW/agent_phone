local api_ready = false

local SERVER_CAPABILITIES = {
    apiVersion = AgentPhonePublicApi.Version,
    features = {
        calls = {
            audio = true,
            company = true,
            video = false,
        },
        customApps = {
            enabled = Config.CustomApps.Enabled == true,
            external = Config.CustomApps.Enabled == true
                and Config.CustomApps.ExternalApps == true,
        },
        deviceDirectory = true,
        notifications = {
            customApps = Config.CustomApps.Enabled == true
                and Config.CustomApps.ExternalApps == true,
            system = false,
        },
        phoneNumberLookup = true,
    },
    ready = false,
    side = "server",
}

local function refresh_configured_capabilities()
    local enabled = Config.CustomApps.Enabled == true
    local external = enabled and Config.CustomApps.ExternalApps == true
    SERVER_CAPABILITIES.features.customApps.enabled = enabled
    SERVER_CAPABILITIES.features.customApps.external = external
    SERVER_CAPABILITIES.features.notifications.customApps = external
end

refresh_configured_capabilities()

AddEventHandler("agent_phone:configurator:serverUpdated", refresh_configured_capabilities)

local custom_app_api = AgentPhoneApps.ServerPublicApi
if type(custom_app_api) ~= "table" then
    error("[agent_phone] Server public API initialized before the custom app policy API.")
end

local function get_api_capabilities()
    local capabilities = AgentPhonePublicApi.Copy(SERVER_CAPABILITIES)
    capabilities.ready = api_ready
    return capabilities
end

local function is_api_ready()
    return api_ready
end

local function invoke(service_name, method_name, ...)
    if not api_ready then
        return nil, "api_not_ready"
    end

    local service = _G[service_name]
    local handler = type(service) == "table" and service[method_name] or nil
    if type(handler) ~= "function" then
        Bridge.Debug(
            "error",
            "[agent_phone] Public API service %s.%s is unavailable.",
            service_name,
            method_name
        )
        return nil, "api_not_ready"
    end
    return handler(...)
end

local function bind(service_name, method_name)
    return function(...)
        return invoke(service_name, method_name, ...)
    end
end

exports("GetApiCapabilities", get_api_capabilities)
exports("IsApiReady", is_api_ready)

exports("GetEquippedPhoneNumber", bind("AgentPhone", "GetEquippedPhoneNumber"))
exports("GetSourceFromPhoneNumber", bind("AgentPhone", "GetSourceFromNumber"))

exports("GetOnlineDeviceBySource", bind("AgentPhoneDeviceDirectory", "GetOnlineBySource"))
exports(
    "GetOnlineDeviceByPhoneNumber",
    bind("AgentPhoneDeviceDirectory", "GetOnlineByPhoneNumber")
)
exports(
    "GetOnlineDeviceByIdentifier",
    bind("AgentPhoneDeviceDirectory", "GetOnlineByIdentifier")
)
exports("GetOnlineDeviceByImei", bind("AgentPhoneDeviceDirectory", "GetOnlineByImei"))
exports("GetStoredDeviceByImei", bind("AgentPhoneDeviceDirectory", "GetStoredDeviceByImei"))
exports(
    "GetStoredDeviceByPhoneNumber",
    bind("AgentPhoneDeviceDirectory", "GetStoredDeviceByPhoneNumber")
)
exports(
    "GetStoredDeviceByIdentifier",
    bind("AgentPhoneDeviceDirectory", "GetStoredDeviceByIdentifier")
)
exports(
    "GetStoredSimByPhoneNumber",
    bind("AgentPhoneDeviceDirectory", "GetStoredSimByPhoneNumber")
)

exports("GetActiveCallBySource", bind("AgentPhoneCalls", "GetForSource"))
exports("GetActiveCallById", bind("AgentPhoneCalls", "GetById"))
exports("IsPlayerInCall", bind("AgentPhoneCalls", "IsActiveForSource"))
exports("EndCallForSource", bind("AgentPhoneCalls", "EndForSource"))
exports("TerminateCallForSource", bind("AgentPhoneCalls", "TerminateForSource"))

exports("AddCustomAppPolicy", custom_app_api.AddCustomAppPolicy)
exports("AddCustomAppPolicyFromAdapter", custom_app_api.AddCustomAppPolicyFromAdapter)
exports("GetCustomAppCapabilities", custom_app_api.GetCustomAppCapabilities)
exports("GetCustomAppPolicy", custom_app_api.GetCustomAppPolicy)
exports("HasCustomAppPermission", custom_app_api.HasCustomAppPermission)
exports("RemoveCustomAppPolicy", custom_app_api.RemoveCustomAppPolicy)
exports("RemoveCustomAppPolicyFromAdapter", custom_app_api.RemoveCustomAppPolicyFromAdapter)
exports("SendAppMessage", custom_app_api.SendAppMessage)
exports("SendCustomAppMessage", custom_app_api.SendCustomAppMessage)
exports("SendCustomAppNotification", custom_app_api.SendCustomAppNotification)
exports("UpdateCustomAppPolicy", custom_app_api.UpdateCustomAppPolicy)
exports("UpdateCustomAppPolicyFromAdapter", custom_app_api.UpdateCustomAppPolicyFromAdapter)

Bridge.Database.AfterMigration("agent_phone", function()
    local required_services = {
        AgentPhone,
        AgentPhoneCalls,
        AgentPhoneDeviceDirectory,
        AgentPhoneNotifications,
    }
    for index = 1, #required_services do
        if type(required_services[index]) ~= "table" then
            error("[agent_phone] Server public API initialized before its domain services.")
        end
    end

    api_ready = true
    TriggerEvent("agent_phone:server:apiReady", AgentPhonePublicApi.Version)
end)
