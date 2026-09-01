local required_services = {
    { name = "AgentPhoneApps", service = AgentPhoneApps },
    { name = "AgentPhoneCalls", service = AgentPhoneCalls },
    { name = "AgentPhoneCamera", service = AgentPhoneCamera },
    { name = "AgentPhoneClient", service = AgentPhoneClient },
    { name = "AgentPhoneFocus", service = AgentPhoneFocus },
    { name = "AgentPhoneNavigation", service = AgentPhoneNavigation },
    { name = "AgentPhonePublicApi", service = AgentPhonePublicApi },
}

for index = 1, #required_services do
    local entry = required_services[index]
    if type(entry.service) ~= "table" then
        error(("[agent_phone] L API publique client a demarre avant %s."):format(entry.name))
    end
end

local CLIENT_CAPABILITIES = {
    apiVersion = AgentPhonePublicApi.Version,
    customAppProtocolVersion = AgentPhoneApps.ProtocolVersion,
    features = {
        calls = {
            audio = true,
            company = true,
            video = false,
        },
        camera = true,
        customApps = {
            enabled = Config.CustomApps.Enabled == true,
            external = Config.CustomApps.Enabled == true
                and Config.CustomApps.ExternalApps == true,
        },
        equippedPhoneNumber = true,
        navigation = true,
        notifications = {
            customApps = Config.CustomApps.Enabled == true
                and Config.CustomApps.ExternalApps == true,
            system = false,
        },
        phoneGameInput = true,
        phoneState = true,
    },
    ready = true,
    side = "client",
}

local function refresh_configured_capabilities()
    local enabled = Config.CustomApps.Enabled == true
    local external = enabled and Config.CustomApps.ExternalApps == true
    CLIENT_CAPABILITIES.features.customApps.enabled = enabled
    CLIENT_CAPABILITIES.features.customApps.external = external
    CLIENT_CAPABILITIES.features.notifications.customApps = external
end

refresh_configured_capabilities()

AddEventHandler("agent_phone:configurator:updated", refresh_configured_capabilities)

local custom_app_api = AgentPhoneApps.ClientPublicApi
if type(custom_app_api) ~= "table" then
    error("[agent_phone] L API publique client a demarre avant l API des apps personnalisees.")
end

local camera_owner_resource

local function get_calling_resource(error_code)
    local owner_resource = GetInvokingResource()
    if type(owner_resource) ~= "string" or owner_resource == "" then
        return nil, error_code or "resource_required"
    end
    return owner_resource
end

local function claim_camera()
    local owner_resource, owner_error = get_calling_resource()
    if not owner_resource then
        return nil, owner_error
    end
    if camera_owner_resource and camera_owner_resource ~= owner_resource then
        return nil, "camera_claimed"
    end
    if not camera_owner_resource and AgentPhoneCamera.GetState().active then
        return nil, "camera_in_use"
    end

    camera_owner_resource = owner_resource
    return owner_resource
end

local function verify_camera_owner()
    local owner_resource, owner_error = get_calling_resource()
    if not owner_resource then
        return nil, owner_error
    end
    if camera_owner_resource and camera_owner_resource ~= owner_resource then
        return nil, "camera_claimed"
    end
    return owner_resource
end

local function release_camera_state()
    AgentPhoneCamera.DisableWalkable()
    AgentPhoneCamera.SetFlashlight(false)
    AgentPhoneCamera.SetSelfie(false)
    camera_owner_resource = nil
end

local function get_api_capabilities()
    return AgentPhonePublicApi.Copy(CLIENT_CAPABILITIES)
end

local function is_api_ready()
    return true
end

local function set_phone_game_input_enabled(enabled)
    if type(enabled) ~= "boolean" then
        return false, "invalid_focus_claim"
    end

    local owner_resource = GetInvokingResource()
    if type(owner_resource) ~= "string" or owner_resource == "" then
        return false, "resource_required"
    end
    return AgentPhoneFocus.SetExternalGameInput(owner_resource, enabled)
end

local function set_flashlight(enabled)
    if type(enabled) ~= "boolean" then
        return false, "invalid_state"
    end
    local owner_resource, owner_error
    if enabled then
        owner_resource, owner_error = claim_camera()
    else
        owner_resource, owner_error = verify_camera_owner()
    end
    if not owner_resource then
        return false, owner_error
    end
    AgentPhoneCamera.SetFlashlight(enabled)
    return true
end

local function set_selfie_camera(enabled)
    if type(enabled) ~= "boolean" then
        return false, "invalid_state"
    end
    local owner_resource, owner_error
    if enabled then
        owner_resource, owner_error = claim_camera()
    else
        owner_resource, owner_error = verify_camera_owner()
    end
    if not owner_resource then
        return false, owner_error
    end
    AgentPhoneCamera.SetSelfie(enabled)
    return true
end

local function enable_walkable_camera(selfie)
    if selfie ~= nil and type(selfie) ~= "boolean" then
        return false, "invalid_state"
    end
    local owner_resource, owner_error = claim_camera()
    if not owner_resource then
        return false, owner_error
    end
    AgentPhoneCamera.EnableWalkable(selfie == true)
    return true
end

local function disable_walkable_camera()
    local owner_resource, owner_error = verify_camera_owner()
    if not owner_resource then
        return false, owner_error
    end
    if camera_owner_resource == owner_resource then
        release_camera_state()
    end
    return true
end

local function toggle_camera_frozen()
    if not AgentPhoneCamera.GetState().active then
        return false, "camera_not_active"
    end
    local owner_resource, owner_error = claim_camera()
    if not owner_resource then
        return false, owner_error
    end
    AgentPhoneCamera.ToggleFrozen()
    return true, AgentPhoneCamera.GetState()
end

local function set_camera_frozen(frozen)
    if type(frozen) ~= "boolean" then
        return false, "invalid_state"
    end
    local camera_state = AgentPhoneCamera.GetState()
    if not camera_state.active then
        return false, "camera_not_active"
    end
    local owner_resource, owner_error = claim_camera()
    if not owner_resource then
        return false, owner_error
    end

    if camera_state.frozen ~= frozen then
        AgentPhoneCamera.ToggleFrozen()
        camera_state = AgentPhoneCamera.GetState()
    end
    return true, camera_state
end

local function release_camera()
    local owner_resource, owner_error = verify_camera_owner()
    if not owner_resource then
        return false, owner_error
    end
    if camera_owner_resource == owner_resource then
        release_camera_state()
    end
    return true
end

exports("GetApiCapabilities", get_api_capabilities)
exports("IsApiReady", is_api_ready)

exports("TogglePhone", AgentPhoneClient.Toggle)
exports("GetPhoneState", AgentPhoneClient.GetState)
exports("GetEquippedPhoneNumber", AgentPhoneClient.GetEquippedPhoneNumber)

exports("OpenApp", AgentPhoneNavigation.Open)
exports("CloseApp", AgentPhoneNavigation.Close)
exports("GetNavigationState", AgentPhoneNavigation.GetState)
exports("GetCurrentApp", AgentPhoneNavigation.GetCurrent)
exports("IsAppDataLoaded", AgentPhoneNavigation.IsDataLoaded)
exports("IsAppInstalled", AgentPhoneNavigation.IsInstalled)

exports("Dial", AgentPhoneCalls.Dial)
exports("AnswerCall", AgentPhoneCalls.Answer)
exports("DeclineCall", AgentPhoneCalls.Decline)
exports("HangupCall", AgentPhoneCalls.Hangup)
exports("TerminateCall", AgentPhoneCalls.Terminate)
exports("GetActiveCall", AgentPhoneCalls.GetActive)
exports("IsInCall", AgentPhoneCalls.IsActive)

exports("GetCameraState", AgentPhoneCamera.GetState)
exports("SetFlashlight", set_flashlight)
exports("SetSelfieCamera", set_selfie_camera)
exports("EnableWalkableCamera", enable_walkable_camera)
exports("DisableWalkableCamera", disable_walkable_camera)
exports("SetCameraFrozen", set_camera_frozen)
exports("ToggleCameraFrozen", toggle_camera_frozen)
exports("ReleaseCamera", release_camera)

exports("SetPhoneGameInputEnabled", set_phone_game_input_enabled)

exports("AddCustomApp", custom_app_api.AddCustomApp)
exports("AddCustomAppFromAdapter", custom_app_api.AddCustomAppFromAdapter)
exports("CloseActiveCustomAppFromAdapter", custom_app_api.CloseActiveCustomAppFromAdapter)
exports("CloseCustomApp", custom_app_api.CloseCustomApp)
exports("CloseCustomAppFromAdapter", custom_app_api.CloseCustomAppFromAdapter)
exports("GetCustomAppCapabilities", custom_app_api.GetCustomAppCapabilities)
exports("OpenCustomApp", custom_app_api.OpenCustomApp)
exports("OpenCustomAppFromAdapter", custom_app_api.OpenCustomAppFromAdapter)
exports("RemoveCustomApp", custom_app_api.RemoveCustomApp)
exports("RemoveCustomAppFromAdapter", custom_app_api.RemoveCustomAppFromAdapter)
exports("SendAppMessage", custom_app_api.SendAppMessage)
exports("SendCustomAppMessage", custom_app_api.SendCustomAppMessage)
exports("SendCustomAppMessageFromAdapter", custom_app_api.SendCustomAppMessageFromAdapter)
exports("SendCustomAppNotification", custom_app_api.SendCustomAppNotification)
exports(
    "SendCustomAppNotificationFromAdapter",
    custom_app_api.SendCustomAppNotificationFromAdapter
)
exports("UpdateCustomApp", custom_app_api.UpdateCustomApp)
exports("UpdateCustomAppFromAdapter", custom_app_api.UpdateCustomAppFromAdapter)

AddEventHandler("onClientResourceStop", function(resource_name)
    if resource_name == camera_owner_resource then
        release_camera_state()
    end
end)

TriggerEvent("agent_phone:client:apiReady", AgentPhonePublicApi.Version)
