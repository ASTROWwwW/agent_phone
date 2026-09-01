local FRAMEWORK_RESOURCE = "Agent"

if GetResourceState(FRAMEWORK_RESOURCE) ~= "started" then
    error(("[agent_phone] The %s resource is not started. This build targets the Agent base only."):format(FRAMEWORK_RESOURCE))
end

Bridge.Framework.Name = "agent"
Bridge.Framework.Resource = FRAMEWORK_RESOURCE

function Bridge.Framework.GetName()
    return Bridge.Framework.Name
end

function Bridge.Framework.HasPermission(source, permission)
    if type(permission) ~= "string" or permission == "" then
        error("[agent_phone] Permission identifiers must be non-empty strings.")
    end

    local groups = Config.CommandPermissions[permission]
    if type(groups) ~= "table" or #groups == 0 then
        local message = "[agent_phone] Config.CommandPermissions.%s must contain at least one group."
        error(message:format(permission))
    end
    for index, group in ipairs(groups) do
        if type(group) ~= "string" or group == "" then
            local message = "[agent_phone] Config.CommandPermissions.%s[%s] must be a non-empty string."
            error(message:format(permission, index))
        end
    end

    return Bridge.Framework.HasAdminGroup(source, groups)
end
