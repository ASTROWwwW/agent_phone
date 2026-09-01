AgentPhoneCompatibilityServer = {}

local RESOURCE_NAME = GetCurrentResourceName()

local function reject_argument(provider_name, export_name, argument_name, expectation)
    Bridge.Debug(
        "warn",
        "[agent_phone] %s:%s refuse : %s doit etre %s.",
        provider_name,
        export_name,
        argument_name,
        expectation
    )
    return false
end

local function is_finite_integer(value)
    return type(value) == "number"
        and value == value
        and value > -math.huge
        and value < math.huge
        and value == math.floor(value)
end

local function require_phone_core()
    local phone = AgentPhone
    assert(
        type(phone) == "table",
        "[agent_phone] Phone compatibility bridge initialized before the phone core."
    )
    assert(
        type(phone.GetEquippedPhoneNumber) == "function",
        "[agent_phone] Phone compatibility bridge requires GetEquippedPhoneNumber."
    )
    assert(
        type(phone.GetSourceFromNumber) == "function",
        "[agent_phone] Phone compatibility bridge requires GetSourceFromNumber."
    )
    assert(
        type(phone.FormatNumber) == "function",
        "[agent_phone] Phone compatibility bridge requires FormatNumber."
    )

    return phone
end

AgentPhoneCompatibilityServer.ResourceName = RESOURCE_NAME
AgentPhoneCompatibilityServer.Phone = nil

function AgentPhoneCompatibilityServer.AfterPhoneReady(callback)
    assert(type(callback) == "function", "Phone compatibility callback must be a function")

    local function run_callback()
        local phone = require_phone_core()
        AgentPhoneCompatibilityServer.Phone = phone
        callback(phone)
    end

    Bridge.Database.AfterMigration("agent_phone", run_callback)
end

function AgentPhoneCompatibilityServer.GetCalls(provider_name, export_name)
    local calls = AgentPhoneCalls
    if type(calls) == "table"
        and type(calls.GetForSource) == "function"
        and type(calls.GetById) == "function"
        and type(calls.IsActiveForSource) == "function"
        and type(calls.EndForSource) == "function"
        and type(calls.TerminateForSource) == "function"
    then
        return calls
    end

    Bridge.Debug(
        "error",
        "[agent_phone] %s:%s indisponible : le service d appel n est pas pret.",
        provider_name,
        export_name
    )
    return nil
end

function AgentPhoneCompatibilityServer.GetNotifications(provider_name, export_name)
    local notifications = AgentPhoneNotifications
    if type(notifications) == "table" and type(notifications.Send) == "function" then
        return notifications
    end

    Bridge.Debug(
        "error",
        "[agent_phone] %s:%s indisponible : le service de notification n est pas pret.",
        provider_name,
        export_name
    )
    return nil
end

function AgentPhoneCompatibilityServer.ValidatePlayerSource(
    provider_name,
    export_name,
    player_source
)
    if is_finite_integer(player_source) and player_source > 0 then
        return true
    end

    return reject_argument(
        provider_name,
        export_name,
        "player source",
        "a positive integer"
    )
end

function AgentPhoneCompatibilityServer.ValidateIdentifier(provider_name, export_name, identifier)
    if type(identifier) == "string" and identifier:match("%S") then
        return true
    end

    return reject_argument(
        provider_name,
        export_name,
        "identifier",
        "a non-empty string"
    )
end

function AgentPhoneCompatibilityServer.ValidatePhoneNumber(provider_name, export_name, phone_number)
    if type(phone_number) == "string" and phone_number:match("%S") then
        return true
    end
    if is_finite_integer(phone_number) and phone_number >= 0 then
        return true
    end

    return reject_argument(
        provider_name,
        export_name,
        "phone number",
        "a non-empty string or non-negative integer"
    )
end

function AgentPhoneCompatibilityServer.ValidatePhoneNumberString(
    provider_name,
    export_name,
    phone_number
)
    if type(phone_number) == "string" and phone_number:match("%S") then
        return true
    end

    return reject_argument(
        provider_name,
        export_name,
        "phone number",
        "a non-empty string"
    )
end
